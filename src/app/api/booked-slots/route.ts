import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const fieldId = searchParams.get('field_id');

    if (!date || !fieldId) {
      return NextResponse.json(
        { error: 'Missing date or field_id' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('start_time')
      .eq('booking_date', date)
      .eq('field_id', parseInt(fieldId))
      .neq('status', 'cancelled');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const times = (data || []).map((item: any) => 
      item.start_time.substring(0, 5)
    );

    return NextResponse.json({ slots: times });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
