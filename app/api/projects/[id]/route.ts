import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import { provisionProjectEmployee, deprovisionProjectEmployee } from '@/lib/projectProvisioning';

// Helper to get authenticated user info
async function getAuthInfo() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string, companyId?: string, role?: string };
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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const auth = await getAuthInfo();

        if (!auth) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        const { id } = await params;
        const {
            name,
            description,
            status,
            projectKey,
            githubTeams,
            slackChannelName,
            assignedEmployees
        } = await req.json();

        // Ensure the project belongs to this manager/company
        const project = await Project.findOne({ _id: id, company: auth.companyId });

        if (!project) {
            return NextResponse.json({ message: 'Project not found' }, { status: 404 });
        }

        if (auth.role === 'manager' && project.manager.toString() !== auth.userId) {
            return NextResponse.json({ message: 'Not authorized to edit this project' }, { status: 403 });
        }

        const oldAssignedEmployees = project.assignedEmployees.map((id: any) => id.toString());
        const oldStatus = project.status;

        project.name = name || project.name;
        project.projectKey = projectKey || project.projectKey;
        project.description = description !== undefined ? description : project.description;
        project.status = status || project.status;
        project.githubTeams = githubTeams !== undefined ? githubTeams : project.githubTeams;
        project.slackChannelName = slackChannelName !== undefined ? slackChannelName : project.slackChannelName;
        project.assignedEmployees = assignedEmployees !== undefined ? assignedEmployees : project.assignedEmployees;

        await project.save();

        if (assignedEmployees !== undefined) {
            const newAssignedEmployees = project.assignedEmployees.map((id: any) => id.toString());
            
            const addedEmployees = newAssignedEmployees.filter((id: string) => !oldAssignedEmployees.includes(id));
            const removedEmployees = oldAssignedEmployees.filter((id: string) => !newAssignedEmployees.includes(id));
            
            for (const empId of addedEmployees) {
                provisionProjectEmployee(project._id.toString(), empId).catch(console.error);
            }
            for (const empId of removedEmployees) {
                deprovisionProjectEmployee(project._id.toString(), empId).catch(console.error);
            }
        }

        if (project.status === 'completed' && oldStatus !== 'completed') {
            for (const empId of project.assignedEmployees) {
                 deprovisionProjectEmployee(project._id.toString(), empId.toString()).catch(console.error);
            }
        }

        return NextResponse.json(project);
    } catch (error) {
        return NextResponse.json(
            { message: (error as Error).message },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const auth = await getAuthInfo();

        if (!auth) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        const { id } = await params;

        // Ensure the project belongs to this manager/company
        const project = await Project.findOne({ _id: id, company: auth.companyId });

        if (!project) {
            return NextResponse.json({ message: 'Project not found' }, { status: 404 });
        }

        if (auth.role === 'manager' && project.manager.toString() !== auth.userId) {
            return NextResponse.json({ message: 'Not authorized to delete this project' }, { status: 403 });
        }

        for (const empId of project.assignedEmployees) {
            deprovisionProjectEmployee(project._id.toString(), empId.toString()).catch(console.error);
        }

        await Project.findByIdAndDelete(id);

        return NextResponse.json({ message: 'Project deleted successfully' });
    } catch (error) {
        return NextResponse.json(
            { message: (error as Error).message },
            { status: 500 }
        );
    }
}
