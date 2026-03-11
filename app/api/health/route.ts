import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export async function GET() {
    try {
        await connectDB();
        return NextResponse.json({ status: 'Ok', database: 'Connected' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ status: 'Error', error: (error as Error).message }, { status: 500 });
    }
}
