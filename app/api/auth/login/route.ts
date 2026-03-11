import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Company from '@/models/Company';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Manager from '@/models/Manager';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: 'Please provide email and password' },
                { status: 400 }
            );
        }

        // Check for company
        let user = await Company.findOne({ email }).select('+password');
        let role = 'company';

        // If not found as a company, check if it's a manager
        if (!user) {
            user = await Manager.findOne({ email }).select('+password');
            if (user) {
                role = 'manager';
            }
        }

        if (!user) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Create token containing ID, Role, and Parent Company (if manager)
        const payload: any = { id: user._id, role };
        if (role === 'manager') {
            payload.companyId = user.company;
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET!, {
            expiresIn: '30d',
        });

        const responsePayload: any = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role,
            token,
        };

        // Add manager specific fields
        if (role === 'manager') {
            responsePayload.managerId = user.managerId;
            responsePayload.companyId = user.company;
        }

        const response = NextResponse.json(
            responsePayload,
            { status: 200 }
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
