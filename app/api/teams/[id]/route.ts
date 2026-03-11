import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';

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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const companyId = await getCompanyId();
        if (!companyId) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const resolvedParams = await params;
        const id = resolvedParams.id;

        const { name, githubTeam } = await req.json();

        if (!name) {
            return NextResponse.json({ message: 'Team name is required' }, { status: 400 });
        }

        if (githubTeam) {
            const existingGithubMapping = await Team.findOne({ company: companyId, githubTeam, _id: { $ne: id } });
            if (existingGithubMapping) {
                return NextResponse.json({ message: 'A team mapped to this GitHub team already exists' }, { status: 400 });
            }
        }

        const team = await Team.findOneAndUpdate(
            { _id: id, company: companyId },
            { name, githubTeam },
            { returnDocument: 'after' }
        );

        if (!team) {
            return NextResponse.json({ message: 'Team not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json(team);
    } catch (error) {
        if ((error as any).code === 11000) {
            return NextResponse.json({ message: 'Team name already exists' }, { status: 400 });
        }
        return NextResponse.json({ message: (error as Error).message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const companyId = await getCompanyId();
        if (!companyId) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

        const resolvedParams = await params;
        const id = resolvedParams.id;

        const team = await Team.findOneAndDelete({ _id: id, company: companyId });

        if (!team) {
            return NextResponse.json({ message: 'Team not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Team deleted successfully' });
    } catch (error) {
        return NextResponse.json({ message: (error as Error).message }, { status: 500 });
    }
}
