import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import { provisionProjectEmployee } from '@/lib/projectProvisioning';

// Helper to get authenticated user info
async function getAuthInfo() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string, companyId?: string, role?: string };
        // If logged in as manager, companyId is embedded in jwt. Otherwise, id IS the companyId
        const companyId = decoded.companyId || decoded.id;
        return {
            userId: decoded.id,
            companyId,
            role: decoded.role || (decoded.companyId ? 'manager' : 'admin')
        };
    } catch (error) {
        return null;
    }
}

export async function GET() {
    try {
        await connectDB();
        const auth = await getAuthInfo();

        if (!auth) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        let query: any = { company: auth.companyId };

        // If manager, only their projects. If admin, all projects for company (optional feature later)
        if (auth.role === 'manager') {
            query.manager = auth.userId;
        }

        const projects = await Project.find(query)
            .populate('assignedEmployees', 'name email status')
            .sort({ createdAt: -1 });

        return NextResponse.json(projects);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { message: (error as Error).message },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const auth = await getAuthInfo();

        if (!auth) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        const {
            name,
            description,
            status,
            projectKey,
            githubTeams,
            slackChannelName,
            assignedEmployees
        } = await req.json();

        if (!name || !projectKey) {
            return NextResponse.json(
                { message: 'Please provide a project name and key' },
                { status: 400 }
            );
        }

        // Check for duplicate name for this manager
        const existingProject = await Project.findOne({
            name,
            manager: auth.userId,
            company: auth.companyId
        });

        if (existingProject) {
            return NextResponse.json(
                { message: 'You already have a project with this name' },
                { status: 400 }
            );
        }

        const project = await Project.create({
            name,
            projectKey,
            description,
            status: status || 'active',
            githubTeams: githubTeams || [],
            slackChannelName: slackChannelName || '',
            assignedEmployees: assignedEmployees || [],
            manager: auth.userId,
            company: auth.companyId
        });

        if (project.assignedEmployees && project.assignedEmployees.length > 0) {
            for (const empId of project.assignedEmployees) {
                provisionProjectEmployee(project._id.toString(), empId.toString()).catch(console.error);
            }
        }

        return NextResponse.json(project, { status: 201 });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { message: (error as Error).message },
            { status: 500 }
        );
    }
}
