import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Connector from '@/models/Connector';
import { encrypt, decrypt } from '@/lib/encryption';

async function getCompanyId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        return decoded.id;
    } catch (error) {
        return null;
    }
}

export async function GET() {
    try {
        await connectDB();
        const companyId = await getCompanyId();
        if (!companyId) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const connector = await Connector.findOne({ company: companyId });

        if (!connector) {
            return NextResponse.json({});
        }

        // Return masked data or check if configured
        return NextResponse.json({
            github: {
                org: connector.github?.org,
                isConfigured: !!connector.github?.token,
            },
            slack: {
                isConfigured: !!(connector.slack?.botToken || connector.slack?.inviteLink),
                hasUserToken: !!connector.slack?.userToken,
                inviteLink: connector.slack?.inviteLink,
            },
            jira: {
                domain: connector.jira?.domain,
                email: connector.jira?.email,
                isConfigured: !!connector.jira?.token,
            }
        });
    } catch (error) {
        return NextResponse.json({ message: (error as Error).message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const companyId = await getCompanyId();
        if (!companyId) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { github, slack, jira } = await req.json();

        console.log("---- SAVE CONNECTORS REQUEST ----");
        console.log("Slack incoming:", slack);

        const updateFields: any = {};

        // Update GitHub
        if (github) {
            if (github.org !== undefined) updateFields['github.org'] = github.org;
            if (github.token) updateFields['github.token'] = encrypt(github.token);
        }

        // Update Slack
        if (slack) {
            if (slack.botToken) updateFields['slack.botToken'] = encrypt(slack.botToken);
            if (slack.userToken) updateFields['slack.userToken'] = encrypt(slack.userToken);
            if (slack.inviteLink !== undefined) updateFields['slack.inviteLink'] = slack.inviteLink;
        }

        // Update Jira
        if (jira) {
            if (jira.domain !== undefined) updateFields['jira.domain'] = jira.domain;
            if (jira.email !== undefined) updateFields['jira.email'] = jira.email;
            if (jira.token) updateFields['jira.token'] = encrypt(jira.token);
        }

        console.log("Updating fields:", updateFields);

        await Connector.findOneAndUpdate(
            { company: companyId },
            { $set: updateFields },
            { new: true, upsert: true }
        );

        return NextResponse.json({ message: 'Connectors updated successfully' });
    } catch (error) {
        return NextResponse.json({ message: (error as Error).message }, { status: 500 });
    }
}
