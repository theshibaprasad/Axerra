import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Connector from '@/models/Connector';
import { decrypt } from '@/lib/encryption';

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

async function getGithubConfig() {
    await connectDB();
    const companyId = await getCompanyId();
    if (!companyId) return null;

    const connector = await Connector.findOne({ company: companyId });
    if (!connector || !connector.github?.org || !connector.github?.token) {
        return null; // GitHub not configured
    }

    const org = connector.github.org;
    const token = decrypt(connector.github.token);
    return { org, token };
}

// Check if a GitHub team exists in the configured organization
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const name = searchParams.get('name');
        if (!name) {
            return NextResponse.json({ message: 'Team name is required' }, { status: 400 });
        }

        const config = await getGithubConfig();
        if (!config) {
            return NextResponse.json({ message: 'GitHub connector not configured' }, { status: 422 });
        }

        const { org, token } = config;

        // GitHub API allows getting team by slug. Alternatively, search by scanning list of teams
        // GitHub slugs preserve underscores but replace spaces and special characters with hyphens
        const slug = name.toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '');

        const response = await fetch(`https://api.github.com/orgs/${org}/teams/${slug}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'SaaS-App'
            }
        });

        if (response.status === 404) {
            // Fallback: Check the first page of teams to see if we missed the slug translation
            const fallbackResponse = await fetch(`https://api.github.com/orgs/${org}/teams?per_page=100`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                    'User-Agent': 'SaaS-App'
                }
            });
            if (fallbackResponse.ok) {
                const teams = await fallbackResponse.json();
                const matchedTeam = teams.find((t: any) => t.name.toLowerCase() === name.toLowerCase());
                if (matchedTeam) {
                    return NextResponse.json({ exists: true, team: matchedTeam });
                }
            }
            return NextResponse.json({ exists: false });
        } else if (!response.ok) {
            const error = await response.text();
            console.error('GitHub API error:', error);
            return NextResponse.json({ message: 'Error checking GitHub team' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json({ exists: true, team: data });
    } catch (error) {
        console.error('Error in GET /api/github/team:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

// Create a new GitHub team in the configured organization
export async function POST(req: Request) {
    try {
        const { name } = await req.json();
        if (!name) {
            return NextResponse.json({ message: 'Team name is required' }, { status: 400 });
        }

        const config = await getGithubConfig();
        if (!config) {
            return NextResponse.json({ message: 'GitHub connector not configured' }, { status: 422 });
        }

        const { org, token } = config;

        const response = await fetch(`https://api.github.com/orgs/${org}/teams`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'SaaS-App'
            },
            body: JSON.stringify({
                name,
                privacy: 'closed' // Default privacy, can be 'closed' or 'secret'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();

            // Check if it already exists (422 + Name must be unique for this org)
            if (response.status === 422) {
                try {
                    const data = JSON.parse(errorText);
                    if (data.errors?.some((e: any) => e.message === 'Name must be unique for this org')) {
                        // Team already exists, treat as success
                        return NextResponse.json({ team: { name } }, { status: 200 });
                    }
                } catch (e) {
                    // Ignore parse error
                }
            }

            console.error('GitHub API error creating team:', errorText);
            return NextResponse.json({ message: 'Failed to create GitHub team' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json({ team: data }, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/github/team:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
