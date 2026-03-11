import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Role from '@/models/Role';

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

export async function GET() {
    try {
        await connectDB();
        const companyId = await getCompanyId();
        if (!companyId) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const roles = await Role.find({ company: companyId }).sort({ createdAt: -1 });
        return NextResponse.json(roles);
    } catch (error) {
        return NextResponse.json({ message: (error as Error).message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const companyId = await getCompanyId();
        if (!companyId) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { name } = await req.json();

        if (!name) {
            return NextResponse.json({ message: 'Role name is required' }, { status: 400 });
        }

        const role = await Role.create({
            company: companyId,
            name,
        });

        return NextResponse.json(role, { status: 201 });
    } catch (error) {
        if ((error as any).code === 11000) {
            return NextResponse.json({ message: 'Role name already exists' }, { status: 400 });
        }
        return NextResponse.json({ message: (error as Error).message }, { status: 500 });
    }
}
