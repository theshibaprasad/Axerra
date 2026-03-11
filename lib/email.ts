import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS?.replace(/"/g, '').replace(/\s+/g, ''),
    },
});

export async function sendInvitationEmail(to: string, name: string, companyName: string = 'Our Company', slackLink: string = '') {
    try {
        const slackSection = slackLink ? `
            <div style="margin: 30px 0; text-align: center;">
                <p style="color: #4a5568; font-size: 16px; margin-bottom: 15px;">Join your teammates on Slack to get started!</p>
                <a href="${slackLink}" style="display: inline-block; background-color: #E01E5A; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; min-width: 200px;">
                    Join Slack Workspace
                </a>
            </div>
        ` : `
            <p style="color: #4a5568;">You will be added to the company Slack workspace shortly.</p>
        `;

        const info = await transporter.sendMail({
            from: `"${companyName} IT" <${process.env.EMAIL_USER}>`,
            to,
            subject: `Welcome to ${companyName}!`,
            html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7fafc; padding: 40px 0; min-height: 100vh;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <div style="background-color: #2563eb; padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Welcome to ${companyName}!</h1>
                    </div>
                    
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #1a202c; font-size: 22px; margin-top: 0; margin-bottom: 20px;">Hi ${name},</h2>
                        
                        <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            We're thrilled to have you join the team. Your HR administrator has added your profile to our platform, and we are automatically provisioning your access to the tools you need.
                        </p>
                        
                        <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
                            <h3 style="color: #1a202c; font-size: 16px; margin-top: 0; margin-bottom: 10px;">Tool Access Check</h3>
                            <ul style="color: #4a5568; font-size: 15px; margin: 0; padding-left: 20px; line-height: 1.5;">
                                <li><strong>GitHub:</strong> You will receive an Organization Invite sent to your GitHub account shortly.</li>
                                <li><strong>Slack:</strong> See link below to join.</li>
                            </ul>
                        </div>

                        ${slackSection}
                        
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                        
                        <p style="color: #718096; font-size: 14px; line-height: 1.5; margin: 0;">
                            If you have any questions or have trouble accessing your tools, please reach out to your manager or IT support.
                        </p>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <p style="color: #a0aec0; font-size: 12px;">© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
                </div>
            </div>
            `,
        });

        console.log(`[EMAIL SERVICE] Email sent: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('[EMAIL SERVICE] Error sending email:', error);
        return false;
    }
}

export async function sendManagerCredentialsEmail(to: string, name: string, tempPassword: string) {
    try {
        const info = await transporter.sendMail({
            from: `"SaaS Platform" <${process.env.EMAIL_USER}>`,
            to,
            subject: "Your Manager Account Credentials",
            html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h2 style="color: #4A90E2;">Welcome to the Management Portal, ${name}!</h2>
                <p>Your administrator has created a Manager account for you on the platform.</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Your Temporary Password:</strong></p>
                    <p style="font-size: 18px; letter-spacing: 1px; margin: 10px 0; font-family: monospace; color: #d32f2f;">${tempPassword}</p>
                </div>
                <p><strong>Action Required:</strong> For security reasons, please log in immediately and change your password in your account settings.</p>
                <p>Thank you,</p>
                <p>The Admin Team</p>
            </div>
            `,
        });

        console.log(`[EMAIL SERVICE] Manager credentials email sent: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('[EMAIL SERVICE] Error sending manager email:', error);
        return false;
    }
}

export async function sendTerminationEmail(to: string, name: string, companyName: string = 'Our Company') {
    try {
        const info = await transporter.sendMail({
            from: `"${companyName} HR/IT" <${process.env.EMAIL_USER}>`,
            to,
            subject: `Update regarding your account at ${companyName}`,
            html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7fafc; padding: 40px 0; min-height: 100vh;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <div style="background-color: #4a5568; padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Account Update</h1>
                    </div>
                    
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #1a202c; font-size: 20px; margin-top: 0; margin-bottom: 20px;">Dear ${name},</h2>
                        
                        <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            We are writing to inform you that your profile at <strong>${companyName}</strong> has been updated by your administrator, and your access to company tools and platforms is being revoked.
                        </p>
                        
                        <div style="background-color: #f8fafc; border-left: 4px solid #4a5568; padding: 16px 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
                            <h3 style="color: #1a202c; font-size: 16px; margin-top: 0; margin-bottom: 10px;">What this means</h3>
                            <ul style="color: #4a5568; font-size: 15px; margin: 0; padding-left: 20px; line-height: 1.5;">
                                <li>Your access to the company GitHub organization is being removed.</li>
                                <li>Your access to the company Slack workspace is being deactivated.</li>
                                <li>Any other integrated tools will be unlinked from your account.</li>
                            </ul>
                        </div>
                        
                        <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            We want to thank you for your contributions. If you believe this action was taken in error or if you have any questions regarding your account status, please reach out to your HR representative or IT support immediately.
                        </p>

                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                        
                        <p style="color: #718096; font-size: 14px; line-height: 1.5; margin: 0;">
                            Best regards,<br/>The ${companyName} Team
                        </p>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <p style="color: #a0aec0; font-size: 12px;">© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
                </div>
            </div>
            `,
        });

        console.log(`[EMAIL SERVICE] Termination email sent: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('[EMAIL SERVICE] Error sending termination email:', error);
        return false;
    }
}

export async function sendProjectAssignmentEmail(to: string, name: string, projectName: string, githubTeam: string | null, slackChannel: string | null, companyName: string = 'Our Company') {
    try {
        const githubText = githubTeam ? `<li><strong>GitHub:</strong> You will be added to the <code>${githubTeam}</code> team.</li>` : '';
        const slackText = slackChannel ? `<li><strong>Slack:</strong> You have been added to the <code>${slackChannel}</code> channel.</li>` : '';
        const resourcesText = (githubText || slackText) ? `
            <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
                <h3 style="color: #1a202c; font-size: 16px; margin-top: 0; margin-bottom: 10px;">Resource Provisioning Check</h3>
                <ul style="color: #4a5568; font-size: 15px; margin: 0; padding-left: 20px; line-height: 1.5;">
                    ${githubText}
                    ${slackText}
                </ul>
            </div>
        ` : '';

        const info = await transporter.sendMail({
            from: `"${companyName} IT" <${process.env.EMAIL_USER}>`,
            to,
            subject: `Project Assignment: ${projectName}`,
            html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7fafc; padding: 40px 0; min-height: 100vh;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <div style="background-color: #2563eb; padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Project Assignment</h1>
                    </div>
                    
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #1a202c; font-size: 20px; margin-top: 0; margin-bottom: 20px;">Hi ${name},</h2>
                        
                        <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            You have been assigned to the project <strong>${projectName}</strong> by your manager.
                        </p>
                        
                        ${resourcesText}
                        
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                        
                        <p style="color: #718096; font-size: 14px; line-height: 1.5; margin: 0;">
                            If you have any questions or have trouble accessing your tools, please reach out to your manager or IT support.
                        </p>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <p style="color: #a0aec0; font-size: 12px;">© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
                </div>
            </div>
            `,
        });

        console.log(`[EMAIL SERVICE] Assignment email sent: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('[EMAIL SERVICE] Error sending assignment email:', error);
        return false;
    }
}

export async function sendProjectDeprovisionEmail(to: string, name: string, projectName: string, reason: string = 'project completion', companyName: string = 'Our Company') {
    try {
        const info = await transporter.sendMail({
            from: `"${companyName} IT" <${process.env.EMAIL_USER}>`,
            to,
            subject: `Removed from Project: ${projectName}`,
            html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7fafc; padding: 40px 0; min-height: 100vh;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <div style="background-color: #4a5568; padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Project Update</h1>
                    </div>
                    
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #1a202c; font-size: 20px; margin-top: 0; margin-bottom: 20px;">Hi ${name},</h2>
                        
                        <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            You have been automatically de-provisioned from the tools for the project <strong>${projectName}</strong> due to ${reason}.
                        </p>
                        
                        <div style="background-color: #f8fafc; border-left: 4px solid #4a5568; padding: 16px 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
                            <h3 style="color: #1a202c; font-size: 16px; margin-top: 0; margin-bottom: 10px;">What this means</h3>
                            <ul style="color: #4a5568; font-size: 15px; margin: 0; padding-left: 20px; line-height: 1.5;">
                                <li>You have been removed from the project's GitHub team.</li>
                                <li>You have been removed from the project's Slack channel.</li>
                            </ul>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                        
                        <p style="color: #718096; font-size: 14px; line-height: 1.5; margin: 0;">
                            Best regards,<br/>The ${companyName} Team
                        </p>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <p style="color: #a0aec0; font-size: 12px;">© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
                </div>
            </div>
            `,
        });

        console.log(`[EMAIL SERVICE] Deprovision email sent: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('[EMAIL SERVICE] Error sending deprovision email:', error);
        return false;
    }
}
