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

// Fetch all GitHub teams in the configured organization
export async function GET(req: Request) {
    try {
        const config = await getGithubConfig();
        if (!config) {
            return NextResponse.json({ message: 'GitHub connector not configured' }, { status: 422 });
        }

        const { org, token } = config;

        // Fetch up to 100 teams from the org
        const response = await fetch(`https://api.github.com/orgs/${org}/teams?per_page=100`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'SaaS-App'
            }
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('GitHub API error:', error);
            return NextResponse.json({ message: 'Error fetching GitHub teams' }, { status: response.status });
        }

        const teams = await response.json();
        return NextResponse.json({ teams });
    } catch (error) {
        console.error('Error in GET /api/github/teams:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
