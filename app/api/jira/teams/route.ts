import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Team name is required" },
                { status: 400 }
            );
        }

        const email = process.env.JIRA_EMAIL;
        const token = process.env.JIRA_API_TOKEN;
        const domain = process.env.JIRA_DOMAIN;

        if (!email || !token || !domain) {
            console.error("Jira credentials are not fully configured in the environment variables.");
            return NextResponse.json(
                { error: "Jira integration is not configured" },
                { status: 500 }
            );
        }

        const auth = Buffer.from(`${email}:${token}`).toString('base64');

        // Create the team (group) in Jira
        const payload = {
            name: name
        };

        const createRes = await fetch(`${domain}/rest/api/3/group`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await createRes.json();

        if (createRes.ok && data.groupId) {
            return NextResponse.json(
                {
                    message: "Team created successfully",
                    team: {
                        id: data.groupId,
                        name: data.name,
                        self: data.self
                    }
                },
                { status: 201 }
            );
        } else {
            console.error("Jira API returned an error during team creation:", JSON.stringify(data));
            return NextResponse.json(
                {
                    error: "Failed to create team",
                    details: data.errorMessages || data.errors || data
                },
                { status: createRes.status }
            );
        }

    } catch (error: any) {
        console.error("Error creating Jira team:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
