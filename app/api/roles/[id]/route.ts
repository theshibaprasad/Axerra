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

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const companyId = await getCompanyId();
        if (!companyId) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { id } = await context.params;
        const { name } = await req.json();

        if (!name) {
            return NextResponse.json({ message: 'Role name is required' }, { status: 400 });
        }

        const role = await Role.findOneAndUpdate(
            { _id: id, company: companyId },
            { name },
            { new: true, runValidators: true }
        );

        if (!role) {
            return NextResponse.json({ message: 'Role not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json(role, { status: 200 });
    } catch (error) {
        if ((error as any).code === 11000) {
            return NextResponse.json({ message: 'Role name already exists' }, { status: 400 });
        }
        return NextResponse.json({ message: (error as Error).message }, { status: 500 });
    }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const companyId = await getCompanyId();
        if (!companyId) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const { id } = await context.params;
        const role = await Role.findOneAndDelete({ _id: id, company: companyId });

        if (!role) {
            return NextResponse.json({ message: 'Role not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Role deleted successfully' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: (error as Error).message }, { status: 500 });
    }
}
