import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import Role from '@/models/Role';
import Manager from '@/models/Manager';
import { provisionEmployee } from '@/lib/provisioning';
import { sendInvitationEmail } from '@/lib/email';

// Helper to get authenticated company ID
async function getCompanyId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string, companyId?: string };
        // If logged in as manager, companyId is embedded in jwt. Otherwise, id IS the companyId
        return decoded.companyId || decoded.id;
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

        const employees = await Employee.find({ company: companyId })
            .populate('role', 'name')
            .populate('manager', 'name email')
            .sort({ createdAt: -1 });

        // Safe serialization: Convert Mongoose docs to plain objects
        const safeEmployees = employees.map(emp =>
            emp.toObject ? emp.toObject() : emp
        );

        return NextResponse.json(safeEmployees);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            {
                message: (error as Error).message,
                stack: (error as Error).stack // Returning stack to help debug 500 error
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

        const { name, email, phone, role, manager, githubProfileLink } = await req.json();

        if (!name || !email || !phone || !role || !manager) {
            return NextResponse.json(
                { message: 'Please provide all required fields (Name, Email, Phone, Role, Manager)' },
                { status: 400 }
            );
        }

        // Verify role belongs to company
        const roleDoc = await Role.findOne({ _id: role, company: companyId });
        if (!roleDoc) {
            return NextResponse.json(
                { message: 'Invalid role selected' },
                { status: 400 }
            );
        }

        // Verify manager belongs to company
        const managerDoc = await Manager.findOne({ _id: manager, company: companyId });
        if (!managerDoc) {
            return NextResponse.json(
                { message: 'Invalid manager selected' },
                { status: 400 }
            );
        }

        // Check for duplicate email in company
        const existingEmployee = await Employee.findOne({ email, company: companyId });
        if (existingEmployee) {
            return NextResponse.json(
                { message: 'Employee with this email already exists in your company' },
                { status: 400 }
            );
        }

        const employee = await Employee.create({
            name,
            email,
            phone,
            role: roleDoc._id,
            manager: managerDoc._id,
            githubProfileLink,
            company: companyId,
            status: 'provisioning', // Start in provisioning state
        });

        // Run provisioning asynchronously (don't block response)
        // In a real serverless env (Vercel), use Inngest or similar background jobs.
        // For this demo/VPS, this works but isn't durable.
        (async () => {
            try {
                // Fetch company details for branding in the email
                const { default: Company } = await import('@/models/Company');
                const companyDoc = await Company.findById(companyId);
                const companyName = companyDoc ? companyDoc.name : 'SaaS Platform';

                // Fetch connector for Slack Invite Link
                const { default: Connector } = await import('@/models/Connector');
                const connectorDoc = await Connector.findOne({ company: companyId });
                const slackLink = connectorDoc?.slack?.inviteLink || '';

                // Extract GitHub Username from URL
                let githubUsername = '';
                if (githubProfileLink) {
                    try {
                        const url = new URL(githubProfileLink);
                        const parts = url.pathname.split('/').filter(Boolean);
                        if (parts.length > 0) {
                            githubUsername = parts[0];
                        }
                    } catch (e) {
                        // Fallback if they just typed their username instead of a URL
                        githubUsername = githubProfileLink.replace(/^@/, '').trim();
                    }
                }

                // Update employee with mapped username
                if (githubUsername) {
                    employee.githubUsername = githubUsername;
                }

                // Send the rich HTML email with the specific Slack link
                await sendInvitationEmail(email, name, companyName, slackLink);

                // Trigger Background provisioning (GitHub, etc)
                await provisionEmployee(employee);

                // Update status to active after provisioning (simplified)
                await Employee.findByIdAndUpdate(employee._id, { status: 'active' });
            } catch (err) {
                console.error('Background provisioning failed', err);
                await Employee.findByIdAndUpdate(employee._id, { status: 'failed' });
            }
        })();

        return NextResponse.json(employee, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { message: (error as Error).message },
            { status: 500 }
        );
    }
}
