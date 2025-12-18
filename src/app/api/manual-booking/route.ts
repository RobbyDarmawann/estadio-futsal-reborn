import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      manualName,
      manualDate,
      manualField,
      manualSlots,
      manualPayment,
    } = body;

    // Validasi Basic
    if (!manualName || !manualSlots || manualSlots.length === 0) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Pastikan env server tersedia
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL on server env');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Buat client admin DI SINI agar error pembuatan client bisa ditangkap oleh try/catch
    const supabaseAdmin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Siapkan Array Data untuk Insert Massal
    const bookingsData = manualSlots.map((time: string) => {
      const startHour = parseInt(time.split(':')[0]);
      const endHour = (startHour + 1) % 24;
      const endTime = `${endHour.toString().padStart(2, '0')}:00`;

      return {
        field_id: parseInt(manualField),
        user_id: null, // User Offline tidak punya ID
        customer_name: manualName,
        booking_date: manualDate,
        start_time: time,
        end_time: endTime,
        status: 'confirmed', // Langsung Confirmed
        payment_method: manualPayment,
        is_offline_booking: true,
        proof_image_url: null,
      };
    });

    // Eksekusi Insert pakai Service Role (Bypass RLS)
    const { data, error } = await supabaseAdmin.from('bookings').insert(bookingsData).select();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Manual Booking Error:', error);
    // Jika server menghasilkan HTML (error overlay), kita kembalikan JSON agar client tidak crash saat parse
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}