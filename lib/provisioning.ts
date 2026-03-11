import Connector from '@/models/Connector';
import Team from '@/models/Team';
import AccessLog from '@/models/AccessLog';
import { decrypt } from '@/lib/encryption';

interface User {
    _id: string;
    name: string;
    email: string;
    team?: string; // The Team ID
    githubUsername?: string;
    githubProfileLink?: string;
    company: string;
}

export async function provisionEmployee(user: User) {
    console.log(`[Provisioning] Starting for user ${user.email} (${user._id})`);

    try {
        // 1. Get Company Connectors
        const connector = await Connector.findOne({ company: user.company });
        if (!connector) {
            console.log(`[Provisioning] No connectors found for company ${user.company}`);
            return;
        }

        // 2. Get Team Mapping (Optional now since Org invites don't strictly require it)
        let teamMap = null;
        if (user.team) {
            teamMap = await Team.findById(user.team);
            if (!teamMap) {
                console.log(`[Provisioning] Team ${user.team} requested but not found.`);
                // We'll continue anyway because they can still get a GitHub Org invite
            }
        }

        // 3. Execution (Provisioning)

        // --- GitHub ---
        if (connector.github?.token) {
            try {
                const token = decrypt(connector.github.token);
                const org = connector.github.org;
                const username = user.githubUsername;

                if (username && org) {
                    await logAction(user, 'github', 'provision', 'pending', `Fetching user ID for ${username} to send Org invite`);
                    console.log(`[GitHub API] GET /users/${username}`);

                    // 1. Resolve Username to GitHub User ID
                    const userRes = await fetch(`https://api.github.com/users/${username}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/vnd.github+json',
                            'X-GitHub-Api-Version': '2022-11-28'
                        }
                    });

                    if (!userRes.ok) {
                        const errText = await userRes.text();
                        throw new Error(`Failed to resolve GitHub username ${username}: ${errText}`);
                    }

                    const githubUser = await userRes.json();
                    const githubUserId = githubUser.id;

                    await logAction(user, 'github', 'provision', 'pending', `Inviting GitHub ID ${githubUserId} (${username}) to org ${org}`);
                    console.log(`[GitHub API] POST /orgs/${org}/invitations`);

                    // 2. Send Organization Invite
                    const inviteRes = await fetch(`https://api.github.com/orgs/${org}/invitations`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/vnd.github+json',
                            'X-GitHub-Api-Version': '2022-11-28',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            invitee_id: githubUserId
                        })
                    });

                    if (!inviteRes.ok) {
                        const errorText = await inviteRes.text();

                        // Ignore 422 if it just means they are already a member or have a pending invite
                        if (inviteRes.status !== 422) {
                            throw new Error(`GitHub API Invite Error: ${inviteRes.status} ${errorText}`);
                        } else {
                            console.log(`[GitHub API] Duplicate invite or already member (422), continuing neutrally.`)
                        }
                    }

                    await logAction(user, 'github', 'provision', 'success', `User invited to GitHub Org ${org}`);
                } else {
                    await logAction(user, 'github', 'provision', 'failed', 'Missing GitHub Username or Config Org Name');
                }
            } catch (error) {
                console.error('[GitHub Provisioning] Error:', error);
                await logAction(user, 'github', 'provision', 'failed', (error as Error).message);
            }
        }

        console.log(`[Provisioning] Completed for ${user.email}`);

    } catch (error) {
        console.error('[Provisioning] Error:', error);
        await logAction(user, 'system', 'provision', 'failed', (error as Error).message);
    }
}


export async function deprovisionEmployee(user: User, teamId?: string) {
    console.log(`[De-provisioning] Starting for user ${user.email} (${user._id})`);

    try {
        // 1. Get Company Connectors
        const connector = await Connector.findOne({ company: user.company });
        if (!connector) {
            console.log(`[De-provisioning] No connectors found for company ${user.company}`);
            return;
        }

        // 3. Execution (De-provisioning)

        // --- GitHub ---
        // --- GitHub ---
        // --- GitHub ---
        if (connector.github?.token) {
            try {
                const token = decrypt(connector.github.token);
                const org = connector.github.org;
                let username = user.githubUsername;

                if (!username && user.githubProfileLink) {
                    try {
                        const url = new URL(user.githubProfileLink);
                        const parts = url.pathname.split('/').filter(Boolean);
                        if (parts.length > 0) {
                            username = parts[0];
                        }
                    } catch (e) {
                        username = user.githubProfileLink.replace(/^@/, '').trim();
                    }
                }

                if (username && org) {
                    await logAction(user, 'github', 'deprovision', 'pending', `Removing ${username} from org ${org}`);
                    console.log(`[GitHub API] DELETE /orgs/${org}/members/${username}`);

                    const response = await fetch(`https://api.github.com/orgs/${org}/members/${username}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/vnd.github+json',
                            'X-GitHub-Api-Version': '2022-11-28'
                        }
                    });

                    console.log(`[GitHub API] Response Status: ${response.status}`);

                    if (!response.ok) {
                        // 404 means already removed or not found
                        if (response.status !== 404) {
                            const errorText = await response.text();
                            console.error(`[GitHub API] Failed with ${response.status}: ${errorText}`);
                            throw new Error(`GitHub API Error: ${response.status} ${errorText}`);
                        } else {
                            console.log(`[GitHub API] User not found in org (404), considering removed.`);
                        }
                    } else {
                        console.log(`[GitHub API] Success (204).`);
                    }

                    await logAction(user, 'github', 'deprovision', 'success', `User removed from GitHub org ${org}`);
                } else {
                    console.log('[De-provisioning] Skipped GitHub: No username, profile link, or org provided.');
                    await logAction(user, 'github', 'deprovision', 'failed', 'Missing GitHub Username/Link or Org');
                }
            } catch (error) {
                console.error('[GitHub De-provisioning] Error:', error);
                await logAction(user, 'github', 'deprovision', 'failed', (error as Error).message);
            }
        } else {
            console.log('[De-provisioning] Skipped GitHub: No connector token.');
        }

        // --- Slack ---
        if (connector.slack?.botToken) {
            try {
                const token = decrypt(connector.slack.botToken);
                await logAction(user, 'slack', 'deprovision', 'pending', `Looking up Slack user by email: ${user.email}`);
                console.log(`[Slack API] GET /users.lookupByEmail`);

                const lookupRes = await fetch(`https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(user.email)}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const lookupData = await lookupRes.json();

                if (lookupData.ok && lookupData.user?.id) {
                    const slackUserId = lookupData.user.id;
                    await logAction(user, 'slack', 'deprovision', 'pending', `Removing Slack user from all channels: ${slackUserId}`);

                    // Since we can't deactivate the user on standard Slack plans with a Bot Token,
                    // we will instead remove them from all public and private channels the bot can see.

                    let cursor = '';
                    let channels: any[] = [];

                    // 1. Fetch all channels
                    do {
                        console.log(`[Slack API] GET /conversations.list`);
                        const listRes = await fetch(`https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200${cursor ? `&cursor=${cursor}` : ''}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const listData = await listRes.json();

                        if (listData.ok && listData.channels) {
                            channels = channels.concat(listData.channels);
                            cursor = listData.response_metadata?.next_cursor || '';
                        } else {
                            console.error(`[Slack API] Failed to list channels:`, listData.error);
                            break;
                        }
                    } while (cursor);

                    // 2. Kick user from every channel
                    let kickedCount = 0;
                    let failedCount = 0;

                    for (const channel of channels) {
                        if (channel.is_general) continue; // Cannot kick from #general

                        console.log(`[Slack API] POST /conversations.kick for channel ${channel.name} (${channel.id})`);
                        const kickRes = await fetch(`https://slack.com/api/conversations.kick`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                channel: channel.id,
                                user: slackUserId
                            })
                        });

                        const kickData = await kickRes.json();

                        if (kickData.ok) {
                            kickedCount++;
                        } else {
                            // ignore errors if user isn't in the channel or bot isn't in the channel
                            if (kickData.error !== 'not_in_channel' && kickData.error !== 'user_not_in_channel' && kickData.error !== 'cant_kick_from_general') {
                                console.error(`[Slack API] Failed to kick from ${channel.name}:`, kickData.error);
                                failedCount++;
                            }
                        }
                    }

                    await logAction(user, 'slack', 'deprovision', 'success', `User removed from ${kickedCount} channels. (${failedCount} errors)`);
                } else {
                    console.error(`[Slack API] User lookup failed: ${lookupData.error}`);
                    await logAction(user, 'slack', 'deprovision', 'failed', `User lookup failed: ${lookupData.error}`);
                }
            } catch (error) {
                console.error('[Slack De-provisioning] Error:', error);
                await logAction(user, 'slack', 'deprovision', 'failed', (error as Error).message);
            }
        }

        console.log(`[De-provisioning] Completed for ${user.email}`);

    } catch (error) {
        console.error('[De-provisioning] Error:', error);
        await logAction(user, 'system', 'deprovision', 'failed', (error as Error).message);
    }
}

async function logAction(user: User, app: string, action: string, status: string, details: string) {
    try {
        await AccessLog.create({
            company: user.company,
            // Handle different user object shapes if necessary, but strictly typing implies _id exists
            user: user._id,
            userId: user._id,
            userName: user.name,
            app,
            action,
            status,
            details
        });
    } catch (err) {
        console.error('Failed to write access log', err);
    }
}
