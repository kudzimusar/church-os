import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { user_id, amount, currency, record_type, notes, org_id } = body;

        if (!user_id || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { error } = await supabaseAdmin.from('financial_records').insert([{
            user_id,
            amount,
            currency: currency || 'JPY',
            record_type: record_type || 'tithe',
            notes: notes || '',
            org_id: org_id,
            given_date: new Date().toISOString()
        }]);

        if (error) {
            console.error("Finance DB Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Transaction recorded' }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}
