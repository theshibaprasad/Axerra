import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import Employee from '@/models/Employee';

// Helper to get authenticated user info
async function getAuthInfo() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return null;

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

export async function GET() {
    try {
        await connectDB();
        const auth = await getAuthInfo();

        if (!auth || auth.role !== 'manager') {
            return NextResponse.json({ message: 'Not authorized or not a manager' }, { status: 401 });
        }

        // Parallelize MongoDB requests for speed
        const [directReportsCount, projects] = await Promise.all([
            // Get count of employees managed by this precise manager
            Employee.countDocuments({ manager: auth.userId, company: auth.companyId, status: 'active' }),
            // Fetch projects owned by this manager to calculate stats
            Project.find({ manager: auth.userId, company: auth.companyId })
        ]);

        let activeProjectsCount = 0;
        let completedProjectsCount = 0;
        let totalIntegrations = 0;

        projects.forEach(project => {
            if (project.status === 'active') activeProjectsCount++;
            if (project.status === 'completed') completedProjectsCount++;

            // Count connected GitHub Teams
            if (project.githubTeams && project.githubTeams.length > 0) {
                totalIntegrations += project.githubTeams.length;
            }
            // Count a Slack Channel as 1 integration
            if (project.slackChannelName && project.slackChannelName.trim() !== '') {
                totalIntegrations += 1;
            }
        });

        // Compute success rate (Completed / Total)
        const totalProjectsCount = projects.length;
        const completionRate = totalProjectsCount > 0
            ? Math.round((completedProjectsCount / totalProjectsCount) * 100)
            : 0;

        return NextResponse.json({
            totalDirectReports: directReportsCount,
            activeProjects: activeProjectsCount,
            completedProjects: completedProjectsCount,
            totalIntegrations,
            completionRate
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { message: (error as Error).message },
            { status: 500 }
        );
    }
}
