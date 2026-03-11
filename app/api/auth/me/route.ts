import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Company from '@/models/Company';

export async function GET() {
    try {
        await connectDB();
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { message: 'Not authorized' },
                { status: 401 }
            );
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string, role?: string };

        if (decoded.role === 'manager') {
            // Must dynamically import or rely on top level Manager import
            const Manager = require('@/models/Manager').default || require('@/models/Manager');
            const manager = await Manager.findById(decoded.id).select('-password');

            if (!manager) {
                return NextResponse.json({ message: 'Manager not found' }, { status: 404 });
            }

            return NextResponse.json({
                _id: manager._id,
                name: manager.name,
                email: manager.email,
                phone: manager.phone,
                managerId: manager.managerId,
                companyId: manager.company,
                role: 'manager'
            });
        }

        const company = await Company.findById(decoded.id).select('-password');

        if (!company) {
            return NextResponse.json(
                { message: 'Company not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            _id: company._id,
            name: company.name,
            email: company.email,
            phone: company.phone,
            role: 'company'
        });
    } catch (error) {
        return NextResponse.json(
            { message: (error as Error).message },
            { status: 500 }
        );
    }
}
