import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      console.error('Missing env: SUPABASE_URL or SERVICE_ROLE_KEY');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fetch semua bookings dengan profiles relationship
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('API: Fetched bookings count:', data?.length || 0);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('GET /api/bookings error:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { ids, newStatus } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !newStatus) {
      return NextResponse.json({ error: 'Missing ids or newStatus' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Update status untuk multiple bookings
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({ status: newStatus })
      .in('id', ids)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('API: Updated bookings count:', data?.length || 0);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('PATCH /api/bookings error:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
