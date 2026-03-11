import { NextRequest, NextResponse } from "next/server";
import { WebClient } from "@slack/web-api";
import pRetry from 'p-retry';

// Initialize Slack WebClient with the bot token from environment variables
// Ensure SLACK_BOT_TOKEN is set in your .env.local file
const slackToken = process.env.SLACK_BOT_TOKEN;
const web = new WebClient(slackToken);

export async function POST(req: NextRequest) {
    try {
        const { name, is_private = false } = await req.json();

        if (!name) {
            return NextResponse.json(
                { error: "Channel name is required" },
                { status: 400 }
            );
        }

        if (!slackToken) {
            console.error("SLACK_BOT_TOKEN is not configured.");
            return NextResponse.json(
                { error: "Slack integration is not configured" },
                { status: 500 }
            );
        }

        // Call the conversations.create method using the WebClient
        const result = await web.conversations.create({
            name,
            is_private, // false by default for public channels
        });

        if (result.ok && result.channel?.id) {
            const channelId = result.channel.id;

            // Find the owner user ID 
            // We'll dynamically look it up to ensure it picks up the primary owner
            const usersList = await web.users.list({});
            const owner = usersList.members?.find((m) => m.is_owner);

            if (owner && owner.id) {
                // Slack can sometimes take a brief moment to fully initialize 
                // the channel before invitations can be sent. We'll retry if needed.
                await pRetry(async () => {
                    await web.conversations.invite({
                        channel: channelId,
                        users: owner.id as string
                    });
                }, { retries: 3, minTimeout: 1000 });
            }

            return NextResponse.json(
                { message: "Channel created successfully", channel: result.channel },
                { status: 201 }
            );
        } else {
            console.error("Slack API returned an error:", result.error);
            return NextResponse.json(
                { error: result.error || "Failed to create channel" },
                { status: 400 }
            );
        }
    } catch (error: any) {
        console.error("Error creating Slack channel:", error);

        // Handle specific Slack API errors (like name_taken)
        if (error.data && error.data.error) {
            return NextResponse.json(
                { error: error.data.error },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

