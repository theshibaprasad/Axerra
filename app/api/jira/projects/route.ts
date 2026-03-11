import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, key, description = "" } = body;

        if (!name || !key) {
            return NextResponse.json(
                { error: "Project name and key are required" },
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

        // 1. Get the current user to get their accountId to use as project lead
        const userRes = await fetch(`${domain}/rest/api/3/myself`, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
            }
        });

        if (!userRes.ok) {
            const errorText = await userRes.text();
            console.error("Failed to fetch Jira user:", errorText);
            return NextResponse.json(
                { error: "Failed to authenticate with Jira API" },
                { status: userRes.status }
            );
        }

        const userData = await userRes.json();
        const accountId = userData.accountId;

        if (!accountId) {
            return NextResponse.json(
                { error: "Failed to retrieve Jira account ID for project lead" },
                { status: 500 }
            );
        }

        // 2. Create the project
        const projectPayload = {
            key: key,
            name: name,
            projectTypeKey: 'software',
            // Using a generic software template to avoid automatic Confluence space creation
            projectTemplateKey: 'com.pyxis.greenhopper.jira:gh-simplified-agility-kanban',
            description: description || `Created via Axerra API`,
            leadAccountId: accountId,
            assigneeType: 'PROJECT_LEAD'
        };

        const createRes = await fetch(`${domain}/rest/api/3/project`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectPayload)
        });

        const data = await createRes.json();

        if (createRes.ok && data.id) {
            return NextResponse.json(
                {
                    message: "Project created successfully",
                    project: { id: data.id, key: data.key, self: data.self }
                },
                { status: 201 }
            );
        } else {
            console.error("Jira API returned an error during project creation:", JSON.stringify(data));
            return NextResponse.json(
                {
                    error: "Failed to create project",
                    details: data.errorMessages || data.errors
                },
                { status: createRes.status }
            );
        }

    } catch (error: any) {
        console.error("Error creating Jira project:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
