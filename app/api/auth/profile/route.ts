import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Company from '@/models/Company';

export async function PATCH(req: Request) {
    try {
        await connectDB();
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        const companyId = decoded.id;

        const { name, phone } = await req.json();

        if (!name) {
            return NextResponse.json({ message: 'Company name is required' }, { status: 400 });
        }

        const updatedCompany = await Company.findByIdAndUpdate(
            companyId,
            { name, phone },
            { returnDocument: 'after' }
        ).select('-password'); // Exclude password from the response

        if (!updatedCompany) {
            return NextResponse.json({ message: 'Company not found' }, { status: 404 });
        }

        return NextResponse.json(updatedCompany);
    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json(
            { message: 'Internal server error while updating profile' },
            { status: 500 }
        );
    }
}
