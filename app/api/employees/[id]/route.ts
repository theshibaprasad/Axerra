import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import Role from '@/models/Role';
import Manager from '@/models/Manager';
import { provisionEmployee, deprovisionEmployee } from '@/lib/provisioning';
import { sendTerminationEmail } from '@/lib/email';

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
        const { id } = await params;

        if (!companyId) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, email, phone, role: newRoleId, manager: newManagerId, githubProfileLink, status } = body;

        if (!name || !email || !phone || !newRoleId || !newManagerId) {
            return NextResponse.json(
                { message: 'Please provide all required fields' },
                { status: 400 }
            );
        }

        // Verify employee belongs to company
        const employee = await Employee.findOne({ _id: id, company: companyId });
        if (!employee) {
            return NextResponse.json(
                { message: 'Employee not found' },
                { status: 404 }
            );
        }

        const oldRoleId = employee.role?.toString();
        const isRoleChanging = newRoleId && newRoleId !== oldRoleId;

        // Verify new role belongs to company if changing
        if (isRoleChanging) {
            const roleDoc = await Role.findOne({ _id: newRoleId, company: companyId });
            if (!roleDoc) {
                return NextResponse.json(
                    { message: 'Invalid role selected' },
                    { status: 400 }
                );
            }
        }

        const oldManagerId = employee.manager?.toString();
        const isManagerChanging = newManagerId && newManagerId !== oldManagerId;

        if (isManagerChanging) {
            const managerDoc = await Manager.findOne({ _id: newManagerId, company: companyId });
            if (!managerDoc) {
                return NextResponse.json(
                    { message: 'Invalid manager selected' },
                    { status: 400 }
                );
            }
        }

        // Check for duplicate email (excluding current employee)
        const existingEmployee = await Employee.findOne({
            email,
            company: companyId,
            _id: { $ne: id },
        });
        if (existingEmployee) {
            return NextResponse.json(
                { message: 'Employee with this email already exists' },
                { status: 400 }
            );
        }

        // Update fields
        employee.name = name;
        employee.email = email;
        employee.phone = phone;
        employee.githubProfileLink = githubProfileLink;
        employee.status = status || employee.status;
        employee.role = newRoleId;
        employee.manager = newManagerId;

        const updatedEmployee = await employee.save();

        return NextResponse.json(updatedEmployee);
    } catch (error) {
        console.error('Update Error:', error);
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
        const { id } = await params;

        if (!companyId) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        // Find before deleting to get details for de-provisioning
        const employee = await Employee.findOne({ _id: id, company: companyId });

        if (!employee) {
            return NextResponse.json(
                { message: 'Employee not found' },
                { status: 404 }
            );
        }

        // De-provision from GitHub and Slack & Send Email in Background
        (async () => {
            try {
                // Fetch company to get companyName for the email
                const { default: Company } = await import('@/models/Company');
                const companyDoc = await Company.findById(companyId);
                const companyName = companyDoc ? companyDoc.name : 'Our Company';

                await deprovisionEmployee(employee);
                await sendTerminationEmail(employee.email, employee.name, companyName);
            } catch (err) {
                console.error('Background deprovisioning failed', err);
            }
        })();

        // Delete record
        await Employee.deleteOne({ _id: id });

        return NextResponse.json({ message: 'Employee removed' });
    } catch (error) {
        console.error('Delete Error:', error);
        return NextResponse.json(
            { message: (error as Error).message },
            { status: 500 }
        );
    }
}
