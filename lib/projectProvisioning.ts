import mongoose from 'mongoose';
import Connector from '@/models/Connector';
import Project from '@/models/Project';
import Employee from '@/models/Employee';
import AccessLog from '@/models/AccessLog';
import Company from '@/models/Company';
import { decrypt } from '@/lib/encryption';
import { sendProjectAssignmentEmail, sendProjectDeprovisionEmail } from '@/lib/email';

async function logAction(companyId: string, userId: string, userName: string, app: string, action: string, status: string, details: string) {
    try {
        await AccessLog.create({
            company: companyId,
            user: userId,
            userId: userId,
            userName,
            app,
            action,
            status,
            details
        });
    } catch (err) {
        console.error('Failed to write access log', err);
    }
}

// Map role names to common team identifiers to robustly match with project GitHub teams.
// For example: "Backend Developer" -> "backend"
function getRoleKeywords(roleName: string): string[] {
    if (!roleName) return [];
    return roleName.toLowerCase().split(/[\s_-]+/).filter(w => w.length > 2);
}

function findMatchingGitHubTeam(roleName: string, projectTeams: string[]): string | null {
    if (!projectTeams || projectTeams.length === 0) return null;
    if (projectTeams.length === 1) return projectTeams[0]; // If there's only one team, default to it? The requirements say "add the employee to the team that matches their role", so if there's only one it might or might not match. Let's still try to match, but maybe fallback or exact match.
    
    const keywords = getRoleKeywords(roleName);
    
    // Direct or partial match
    for (const team of projectTeams) {
        const teamLower = team.toLowerCase();
        for (const keyword of keywords) {
            if (teamLower.includes(keyword)) {
                return team;
            }
        }
    }
    
    return null;
}

function extractGitHubUsername(employee: any): string | null {
    if (employee.githubUsername) return employee.githubUsername;
    if (employee.githubProfileLink) {
        try {
            const url = new URL(employee.githubProfileLink);
            const parts = url.pathname.split('/').filter(Boolean);
            if (parts.length > 0) {
                return parts[0];
            }
        } catch (e) {
            return employee.githubProfileLink.replace(/^@/, '').trim();
        }
    }
    return null;
}

export async function provisionProjectEmployee(projectId: string, employeeId: string) {
    console.log(`[Project Provisioning] Starting for project ${projectId}, employee ${employeeId}`);

    try {
        const project = await Project.findById(projectId);
        if (!project) {
            console.log(`[Project Provisioning] Project not found`);
            return;
        }

        const employee = await Employee.findById(employeeId).populate('role');
        if (!employee) {
            console.log(`[Project Provisioning] Employee not found`);
            return;
        }

        const connector = await Connector.findOne({ company: employee.company });
        if (!connector) {
            console.log(`[Project Provisioning] No connectors found for company ${employee.company}`);
            return;
        }

        const roleName = employee.role?.name || '';
        const targetTeam = findMatchingGitHubTeam(roleName, project.githubTeams);

        // --- GitHub ---
        if (connector.github?.token && targetTeam) {
            try {
                const token = decrypt(connector.github.token);
                const org = connector.github.org;
                const username = extractGitHubUsername(employee);

                if (username && org) {
                    await logAction(employee.company, employee._id, employee.name, 'github', 'provision_project', 'pending', `Adding ${username} to team ${targetTeam} in org ${org}`);
                    console.log(`[GitHub API] PUT /orgs/${org}/teams/${targetTeam}/memberships/${username}`);

                    const response = await fetch(`https://api.github.com/orgs/${org}/teams/${targetTeam}/memberships/${username}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/vnd.github+json',
                            'X-GitHub-Api-Version': '2022-11-28'
                        }
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`GitHub API Error: ${response.status} ${errorText}`);
                    }

                    await logAction(employee.company, employee._id, employee.name, 'github', 'provision_project', 'success', `User added to GitHub team ${targetTeam}`);
                } else {
                    await logAction(employee.company, employee._id, employee.name, 'github', 'provision_project', 'failed', 'Missing GitHub Username or Config Org Name');
                }
            } catch (error) {
                console.error('[GitHub Project Provisioning] Error:', error);
                await logAction(employee.company, employee._id, employee.name, 'github', 'provision_project', 'failed', (error as Error).message);
            }
        }

        // --- Slack ---
        if (connector.slack?.botToken && project.slackChannelName) {
            try {
                const token = decrypt(connector.slack.botToken);
                
                // 1. Find Slack user by email
                console.log(`[Slack API] GET /users.lookupByEmail for ${employee.email}`);
                const lookupRes = await fetch(`https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(employee.email)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const lookupData = await lookupRes.json();

                if (lookupData.ok && lookupData.user?.id) {
                    const slackUserId = lookupData.user.id;
                    
                    // 2. Find Slack channel ID by name
                    let channelId = null;
                    let cursor = '';
                    do {
                        console.log(`[Slack API] GET /conversations.list for channel ${project.slackChannelName}`);
                        const listRes = await fetch(`https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200${cursor ? `&cursor=${cursor}` : ''}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const listData = await listRes.json();

                        if (listData.ok && listData.channels) {
                            const found = listData.channels.find((c: any) => c.name === project.slackChannelName || c.name === project.slackChannelName.replace(/^#/, ''));
                            if (found) {
                                channelId = found.id;
                                break;
                            }
                            cursor = listData.response_metadata?.next_cursor || '';
                        } else {
                            break;
                        }
                    } while (cursor);

                    if (channelId) {
                        // 3. Invite user to channel
                        await logAction(employee.company, employee._id, employee.name, 'slack', 'provision_project', 'pending', `Adding Slack user ${slackUserId} to channel ${channelId}`);
                        console.log(`[Slack API] POST /conversations.invite`);
                        const inviteRes = await fetch(`https://slack.com/api/conversations.invite`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                channel: channelId,
                                users: slackUserId
                            })
                        });
                        const inviteData = await inviteRes.json();

                        if (inviteData.ok || inviteData.error === 'already_in_channel') {
                            await logAction(employee.company, employee._id, employee.name, 'slack', 'provision_project', 'success', `User added to Slack channel ${project.slackChannelName}`);
                        } else {
                            throw new Error(`Failed to invite to Slack channel: ${inviteData.error}`);
                        }
                    } else {
                        await logAction(employee.company, employee._id, employee.name, 'slack', 'provision_project', 'failed', `Channel ${project.slackChannelName} not found`);
                    }
                } else {
                    await logAction(employee.company, employee._id, employee.name, 'slack', 'provision_project', 'failed', `User lookup failed: ${lookupData.error}`);
                }
            } catch (error) {
                console.error('[Slack Project Provisioning] Error:', error);
                await logAction(employee.company, employee._id, employee.name, 'slack', 'provision_project', 'failed', (error as Error).message);
            }
        }

        console.log(`[Project Provisioning] Completed for ${employee.email}`);
        
        try {
            const company = await Company.findById(employee.company);
            const companyName = company ? company.name : 'Our Company';
            
            await sendProjectAssignmentEmail(
                employee.email, 
                employee.name, 
                project.name, 
                targetTeam, 
                project.slackChannelName, 
                companyName
            );
        } catch (emailErr) {
            console.error('[Project Provisioning] Failed to send assignment email:', emailErr);
        }

    } catch (error) {
        console.error('[Project Provisioning] Error:', error);
    }
}

export async function deprovisionProjectEmployee(projectId: string, employeeId: string) {
    console.log(`[Project De-provisioning] Starting for project ${projectId}, employee ${employeeId}`);

    try {
        const project = await Project.findById(projectId);
        if (!project) {
            console.log(`[Project De-provisioning] Project not found`);
            return;
        }

        const employee = await Employee.findById(employeeId).populate('role');
        if (!employee) {
            console.log(`[Project De-provisioning] Employee not found`);
            return;
        }

        const connector = await Connector.findOne({ company: employee.company });
        if (!connector) {
            console.log(`[Project De-provisioning] No connectors found for company ${employee.company}`);
            return;
        }

        const roleName = employee.role?.name || '';
        const targetTeam = findMatchingGitHubTeam(roleName, project.githubTeams);

        // --- GitHub ---
        if (connector.github?.token && targetTeam) {
            try {
                const token = decrypt(connector.github.token);
                const org = connector.github.org;
                const username = extractGitHubUsername(employee);

                if (username && org) {
                    await logAction(employee.company, employee._id, employee.name, 'github', 'deprovision_project', 'pending', `Removing ${username} from team ${targetTeam} in org ${org}`);
                    console.log(`[GitHub API] DELETE /orgs/${org}/teams/${targetTeam}/memberships/${username}`);

                    const response = await fetch(`https://api.github.com/orgs/${org}/teams/${targetTeam}/memberships/${username}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/vnd.github+json',
                            'X-GitHub-Api-Version': '2022-11-28'
                        }
                    });

                    if (!response.ok && response.status !== 404) {
                        const errorText = await response.text();
                        throw new Error(`GitHub API Error: ${response.status} ${errorText}`);
                    }

                    await logAction(employee.company, employee._id, employee.name, 'github', 'deprovision_project', 'success', `User removed from GitHub team ${targetTeam}`);
                }
            } catch (error) {
                console.error('[GitHub Project De-provisioning] Error:', error);
                await logAction(employee.company, employee._id, employee.name, 'github', 'deprovision_project', 'failed', (error as Error).message);
            }
        }

        // --- Slack ---
        if (connector.slack?.botToken && project.slackChannelName) {
            try {
                const token = decrypt(connector.slack.botToken);
                
                // 1. Find Slack user by email
                console.log(`[Slack API] GET /users.lookupByEmail for ${employee.email}`);
                const lookupRes = await fetch(`https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(employee.email)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const lookupData = await lookupRes.json();

                if (lookupData.ok && lookupData.user?.id) {
                    const slackUserId = lookupData.user.id;
                    
                    // 2. Find Slack channel ID by name
                    let channelId = null;
                    let cursor = '';
                    do {
                        console.log(`[Slack API] GET /conversations.list for channel ${project.slackChannelName}`);
                        const listRes = await fetch(`https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200${cursor ? `&cursor=${cursor}` : ''}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const listData = await listRes.json();

                        if (listData.ok && listData.channels) {
                            const found = listData.channels.find((c: any) => c.name === project.slackChannelName || c.name === project.slackChannelName.replace(/^#/, ''));
                            if (found) {
                                channelId = found.id;
                                break;
                            }
                            cursor = listData.response_metadata?.next_cursor || '';
                        } else {
                            break;
                        }
                    } while (cursor);

                    if (channelId) {
                        // 3. Kick user from channel
                        await logAction(employee.company, employee._id, employee.name, 'slack', 'deprovision_project', 'pending', `Removing Slack user ${slackUserId} from channel ${channelId}`);
                        console.log(`[Slack API] POST /conversations.kick`);
                        const kickRes = await fetch(`https://slack.com/api/conversations.kick`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                channel: channelId,
                                user: slackUserId
                            })
                        });
                        const kickData = await kickRes.json();

                        if (kickData.ok || kickData.error === 'not_in_channel') {
                            await logAction(employee.company, employee._id, employee.name, 'slack', 'deprovision_project', 'success', `User removed from Slack channel ${project.slackChannelName}`);
                        } else if (kickData.error === 'restricted_action' || kickData.error === 'cant_kick_from_general') {
                            await logAction(employee.company, employee._id, employee.name, 'slack', 'deprovision_project', 'failed', `Bot lacks permission to remove users from channel ${project.slackChannelName}. Please remove manually or update Workspace Settings.`);
                            console.warn(`[Slack API] Bot lacks permission to kick user ${slackUserId} from channel ${channelId} (${kickData.error})`);
                        } else {
                            throw new Error(`Failed to kick from Slack channel: ${kickData.error}`);
                        }
                    } else {
                        await logAction(employee.company, employee._id, employee.name, 'slack', 'deprovision_project', 'failed', `Channel ${project.slackChannelName} not found`);
                    }
                } else {
                    await logAction(employee.company, employee._id, employee.name, 'slack', 'deprovision_project', 'failed', `User lookup failed: ${lookupData.error}`);
                }
            } catch (error) {
                console.error('[Slack Project De-provisioning] Error:', error);
                await logAction(employee.company, employee._id, employee.name, 'slack', 'deprovision_project', 'failed', (error as Error).message);
            }
        }

        console.log(`[Project De-provisioning] Completed for ${employee.email}`);
        
        try {
            const company = await Company.findById(employee.company);
            const companyName = company ? company.name : 'Our Company';
            
            let reason = 'project completion or reassignment';
            if (project.status === 'completed') {
                reason = 'project completion';
            } else {
                reason = 'removal from the project';
            }
            
            await sendProjectDeprovisionEmail(
                employee.email, 
                employee.name, 
                project.name, 
                reason,
                companyName
            );
        } catch (emailErr) {
            console.error('[Project De-provisioning] Failed to send deprovision email:', emailErr);
        }

    } catch (error) {
        console.error('[Project De-provisioning] Error:', error);
    }
}
