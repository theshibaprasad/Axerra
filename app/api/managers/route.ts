import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';
import Company from '@/models/Company';
import { sendManagerCredentialsEmail } from '@/lib/email';

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

export async function GET() {
    try {
        await connectDB();
        const companyId = await getCompanyId();

        if (!companyId) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        const managers = await Manager.find({ company: companyId })
            .sort({ createdAt: -1 });

        // Safe serialization: Convert Mongoose docs to plain objects
        const safeManagers = managers.map(mgr =>
            mgr.toObject ? mgr.toObject() : mgr
        );

        return NextResponse.json(safeManagers);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            {
                message: (error as Error).message,
                stack: (error as Error).stack
            },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const companyId = await getCompanyId();

        if (!companyId) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        const { name, email, phone, managerId } = await req.json();

        if (!name || !email || !phone || !managerId) {
            return NextResponse.json(
                { message: 'Please provide all required fields (Name, Email, Phone, Manager ID)' },
                { status: 400 }
            );
        }

        // Fetch company details to generate the default password
        const companyDoc = await Company.findById(companyId);
        if (!companyDoc) {
            return NextResponse.json(
                { message: 'Company not found' },
                { status: 404 }
            );
        }

        // Check for duplicate email in the system
        const existingByEmail = await Manager.findOne({ email });
        if (existingByEmail) {
            return NextResponse.json(
                { message: 'A manager with this email already exists' },
                { status: 400 }
            );
        }

        // Check for duplicate Manager ID
        const existingById = await Manager.findOne({ managerId, company: companyId });
        if (existingById) {
            return NextResponse.json(
                { message: 'A manager with this Manager ID already exists in your company' },
                { status: 400 }
            );
        }

        // Generate the default password: [lower-case-org-name]@1234
        const orgNameBase = companyDoc.name.replace(/\s+/g, '').toLowerCase();
        const generatedPassword = `${orgNameBase}@1234`;

        // Create the manager (Mongoose pre-save hook will hash the password)
        const newManager = await Manager.create({
            name,
            email,
            phone,
            managerId,
            password: generatedPassword,
            company: companyId,
        });

        // Trigger email asynchronously (non-blocking)
        (async () => {
            try {
                await sendManagerCredentialsEmail(email, name, generatedPassword);
            } catch (err) {
                console.error('Failed to send manager credentials email', err);
            }
        })();

        // Strip password before returning payload for security even though 'select: false' might handle it, better safe
        const safeManagerObj = newManager.toObject();
        delete safeManagerObj.password;

        return NextResponse.json(safeManagerObj, { status: 201 });
    } catch (error) {
        console.error('Error creating manager:', error);
        return NextResponse.json(
            { message: (error as Error).message },
            { status: 500 }
        );
    }
}
