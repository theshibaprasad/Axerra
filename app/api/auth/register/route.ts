import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Company from '@/models/Company';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { name, email, phone, password } = await req.json();

        if (!name || !email || !phone || !password) {
            return NextResponse.json(
                { message: 'Please provide all fields' },
                { status: 400 }
            );
        }

        // Check if company exists
        const companyExists = await Company.findOne({ email });
        if (companyExists) {
            return NextResponse.json(
                { message: 'Company already exists' },
                { status: 400 }
            );
        }

        // Create company
        const company = await Company.create({
            name,
            email,
            phone,
            password,
        });

        // Create token
        const token = jwt.sign({ id: company._id }, process.env.JWT_SECRET!, {
            expiresIn: '30d',
        });

        const response = NextResponse.json(
            {
                _id: company._id,
                name: company.name,
                email: company.email,
                phone: company.phone,
                token,
            },
            { status: 201 }
        );

        // Set cookie
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/',
        });

        return response;
    } catch (error) {
        return NextResponse.json(
            { message: (error as Error).message },
            { status: 500 }
        );
    }
}
