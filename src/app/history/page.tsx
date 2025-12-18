"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  Calendar, Clock, MapPin, CreditCard, Banknote, 
  CheckCircle2, XCircle, AlertCircle, Loader2 
} from "lucide-react";

// Tipe data grouping
type GroupedHistory = {
  booking_date: string;
  field_id: number;
  start_time: string;
  end_time: string;
  total_hours: number;
  total_price: number;
  status: string;
  payment_method: string;
  payment_deadline?: string | null;
  created_at: string;
};

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<GroupedHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [countdownMap, setCountdownMap] = useState<{ [key: string]: number }>({});

  const PRICE_PER_HOUR = 150000;

  useEffect(() => {
    // 1. Cek Login
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        fetchHistory(user.id);
      }
    };
    checkUser();
  }, [router]);

  // Real-time countdown untuk deadline pembayaran
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownMap((prev) => {
        const updated = { ...prev };
        let hasChange = false;
        Object.keys(updated).forEach((key) => {
          if (updated[key] > 0) {
            updated[key] -= 1;
            hasChange = true;
          }
        });
        return hasChange ? updated : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Ambil Data Booking User Ini
  const fetchHistory = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId) // Filter hanya punya user ini
      .order('created_at', { ascending: false }); // Terbaru di atas

    if (data) {
      // 3. Logic Grouping (Menyatukan jam terpisah jadi satu kartu)
      const groups: { [key: string]: GroupedHistory } = {};

      data.forEach((item) => {
        // Grouping berdasarkan waktu pembuatan (toleransi detik) untuk menyatukan transaksi
        const timeKey = new Date(item.created_at).getTime(); 
        const timeGroup = Math.floor(timeKey / 10000); 
        
        // Key unik: tanggal + lapangan + waktu_transaksi
        const key = `${item.booking_date}-${item.field_id}-${timeGroup}`;

        if (!groups[key]) {
          groups[key] = {
            booking_date: item.booking_date,
            field_id: item.field_id,
            start_time: item.start_time,
            end_time: item.end_time,
            total_hours: 1,
            total_price: PRICE_PER_HOUR,
            status: item.status,
            payment_method: item.payment_method,
            payment_deadline: item.payment_deadline ?? null,
            created_at: item.created_at
          };
        } else {
          // Update data group
          groups[key].total_hours += 1;
          groups[key].total_price += PRICE_PER_HOUR;
          // Cari jam paling awal dan akhir
          if (item.start_time < groups[key].start_time) groups[key].start_time = item.start_time;
          if (item.end_time > groups[key].end_time) groups[key].end_time = item.end_time;
          // Jika belum ada deadline di group, ambil dari item
          if (!groups[key].payment_deadline && item.payment_deadline) groups[key].payment_deadline = item.payment_deadline;
        }
      });

      // Ubah ke array & sort
      const groupedArray = Object.values(groups).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Inisialisasi countdown map untuk setiap group yang punya deadline
      const newCountdownMap: { [key: string]: number } = {};
      groupedArray.forEach((item, idx) => {
        if (item.payment_deadline && item.status === 'pending' && item.payment_method !== 'transfer_bri') {
          const diff = Math.max(0, new Date(item.payment_deadline).getTime() - Date.now());
          newCountdownMap[`${idx}`] = Math.floor(diff / 1000);
        }
      });
      setCountdownMap(newCountdownMap);

      setHistory(groupedArray);
    }
    setLoading(false);
  };

  // Helper Warna Status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Disetujui';
      case 'cancelled': return 'Ditolak';
      default: return 'Menunggu Konfirmasi';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle2 size={18} />;
      case 'cancelled': return <XCircle size={18} />;
      default: return <AlertCircle size={18} />;
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-red-600" /></div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <Navbar />

      <div className="bg-gray-900 text-white pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Riwayat Booking</h1>
          <p className="text-gray-400">Pantau status persetujuan jadwal main tim kamu.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8">
        
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Calendar size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Belum ada riwayat booking</h3>
              <p className="text-gray-500 mb-6">Kamu belum pernah memesan lapangan. Yuk main!</p>
              <button 
                onClick={() => router.push('/booking')}
                className="bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700 transition"
              >
                Booking Sekarang
              </button>
            </div>
          ) : (
            history.map((item, idx) => {
              // Ambil countdown dari state real-time
              const countdown = countdownMap[`${idx}`] ?? null;
              
              return (
              <div 
                key={idx} 
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition duration-300"
              >
                {/* Header Kartu: Tanggal & Status */}
                <div className="p-5 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-lg text-gray-600">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Tanggal Main</p>
                      <p className="text-gray-900 font-bold text-lg">{item.booking_date}</p>
                    </div>
                  </div>

                  {/* Badge Status */}
                  <div className={`px-4 py-2 rounded-full border flex items-center gap-2 text-sm font-bold ${getStatusColor(item.status)}`}>
                    {getStatusIcon(item.status)}
                    <span>{getStatusText(item.status)}</span>
                  </div>
                </div>

                {/* Body Kartu: Detail Lapangan & Harga */}
                <div className="p-5 flex flex-col md:flex-row gap-6">
                  
                  {/* Info Lapangan */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="text-red-500 mt-1 flex-shrink-0" size={18} />
                      <div>
                        <p className="text-gray-900 font-bold">{item.field_id === 1 ? "Lapangan A (Vinyl Interlock)" : "Lapangan B (Sintetis Hitam)"}</p>
                        <p className="text-sm text-gray-500">Standar Internasional</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="text-red-500 mt-1 flex-shrink-0" size={18} />
                      <div>
                        <p className="text-gray-900 font-bold">
                          {item.start_time} - {item.end_time}
                        </p>
                        <p className="text-sm text-gray-500">Durasi: {item.total_hours} Jam</p>
                      </div>
                    </div>
                  </div>

                  {/* Info Pembayaran */}
                  <div className="flex-1 md:border-l border-gray-100 md:pl-6 space-y-3">
                    <div className="flex items-start gap-3">
                      {item.payment_method === 'transfer_bri' ? (
                        <CreditCard className="text-blue-600 mt-1 flex-shrink-0" size={18} />
                      ) : (
                        <Banknote className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      )}
                      <div>
                        <p className="text-gray-900 font-bold capitalize">
                          {item.payment_method === 'transfer_bri' ? 'Transfer Bank BRI' : 'Bayar Ditempat'}
                        </p>
                        <p className="text-sm text-gray-500">Metode Pembayaran</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-xs text-gray-500">Total Harga</p>
                      <p className="text-xl font-bold text-red-600">
                        Rp {item.total_price.toLocaleString('id-ID')}
                      </p>
                    </div>

                    {/* Jika bayar ditempat dan pending, tampilkan deadline pembayaran */}
                    {item.payment_method !== 'transfer_bri' && item.status === 'pending' && item.payment_deadline && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-100 text-sm text-yellow-800">
                        <p className="font-bold">Batas waktu pembayaran:</p>
                        <p>{new Date(item.payment_deadline).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Sisa waktu: {countdown !== null && countdown >= 0 ? (
                          <>
                            {Math.floor(countdown / 60)} menit {countdown % 60} detik
                          </>
                        ) : '00 menit 00 detik'}</p>
                      </div>
                    )}
                  </div>

                </div>
                
                {/* Footer Pesan (Opsional) */}
                {item.status === 'pending' && (
                  <div className="bg-gray-200 px-5 py-3 text-xs text-orange-700 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin"/>
                    Mohon tunggu, admin sedang memverifikasi bukti pembayaran Anda.
                  </div>
                )}
                {item.status === 'confirmed' && (
                  <div className="bg-green-50 px-5 py-3 text-xs text-green-700 flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    Booking berhasil! Silahkan datang tepat waktu dan tunjukkan kartu ini.
                  </div>
                )}

              </div>
            );
            })
          )}
        </div>

      </div>
    </main>
  );
}