import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';

// Helper to get authenticated company ID
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

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const companyId = await getCompanyId();

        if (!companyId) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const { name, email, phone, managerId } = await req.json();

        if (!name || !email || !phone || !managerId) {
            return NextResponse.json(
                { message: 'Please provide all required fields' },
                { status: 400 }
            );
        }

        // Check for duplicate email (excluding this manager)
        const existingByEmail = await Manager.findOne({ email, _id: { $ne: resolvedParams.id } });
        if (existingByEmail) {
            return NextResponse.json(
                { message: 'Another manager with this email already exists' },
                { status: 400 }
            );
        }

        // Check for duplicate Manager ID (excluding this manager)
        const existingById = await Manager.findOne({ managerId, company: companyId, _id: { $ne: resolvedParams.id } });
        if (existingById) {
            return NextResponse.json(
                { message: 'Another manager with this Manager ID already exists in your company' },
                { status: 400 }
            );
        }

        const manager = await Manager.findOneAndUpdate(
            { _id: resolvedParams.id, company: companyId },
            { name, email, phone, managerId },
            { new: true, runValidators: true }
        );

        if (!manager) {
            return NextResponse.json({ message: 'Manager not found' }, { status: 404 });
        }

        return NextResponse.json(manager);
    } catch (error) {
        console.error('Error updating manager:', error);
        return NextResponse.json(
            { message: (error as Error).message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const companyId = await getCompanyId();

        if (!companyId) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        const resolvedParams = await params;

        const manager = await Manager.findOneAndDelete({
            _id: resolvedParams.id,
            company: companyId,
        });

        if (!manager) {
            return NextResponse.json({ message: 'Manager not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Manager removed successfully' });
    } catch (error) {
        console.error('Error deleting manager:', error);
        return NextResponse.json(
            { message: (error as Error).message },
            { status: 500 }
        );
    }
}
