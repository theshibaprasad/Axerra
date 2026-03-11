import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import Connector from '@/models/Connector';
import Manager from '@/models/Manager';
import Employee from '@/models/Employee';
import Role from '@/models/Role';

async function getCompanyId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return null;
    }

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

        if (!companyId) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        // Run all queries in parallel for better performance
        const [totalTeams, connector, totalManagers, totalEmployees, totalRoles] = await Promise.all([
            Team.countDocuments({ company: companyId }),
            Connector.findOne({ company: companyId }),
            Manager.countDocuments({ company: companyId }),
            Employee.countDocuments({ company: companyId }),
            Role.countDocuments({ company: companyId })
        ]);

        let activeConnectorsCount = 0;

        if (connector) {
            if (connector.github?.token) activeConnectorsCount++;
            if (connector.slack?.botToken) activeConnectorsCount++;
            if (connector.jira?.token) activeConnectorsCount++;
        }

        return NextResponse.json({
            totalTeams,
            activeConnectorsCount,
            totalManagers,
            totalEmployees,
            totalRoles,
            securityStatus: 'Secure' // Keeping this placeholder as requested or assuming it's static for now
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { message: (error as Error).message },
            { status: 500 }
        );
    }
}
