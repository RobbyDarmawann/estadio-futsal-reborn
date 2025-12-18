"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Clock, CheckCircle2, DollarSign, User, Globe, Laptop } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pendingToday: 0,
    totalToday: 0,
    revenueToday: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const today = new Date().toISOString().split('T')[0];

    // 1. Ambil Statistik Hari Ini
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_date', today);

    if (bookings) {
      const pendingCount = bookings.filter(b => b.status === 'pending').length;
      const validBookings = bookings.filter(b => b.status !== 'cancelled');
      const estimatedRevenue = validBookings.length * 150000; 

      setStats({
        pendingToday: pendingCount,
        totalToday: bookings.length,
        revenueToday: estimatedRevenue
      });
    }

    // 2. Ambil 5 Aktivitas Terbaru
    const { data: recent } = await supabase
      .from('bookings')
      .select('*, profiles(full_name)') // Ambil semua kolom booking + nama profile
      .order('created_at', { ascending: false })
      .limit(5);

    if (recent) setRecentActivities(recent);

    setLoading(false);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-500">Ringkasan aktivitas Estadio Futsal hari ini.</p>
      </div>

      {/* --- STATS CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Pending */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Menunggu Persetujuan</p>
            <h3 className="text-3xl font-bold text-gray-900">{loading ? "..." : stats.pendingToday}</h3>
            <p className="text-xs text-orange-500 mt-2 font-medium">Perlu tindakan segera</p>
          </div>
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
            <Clock size={24} />
          </div>
        </div>
        {/* Total */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Total Booking Hari Ini</p>
            <h3 className="text-3xl font-bold text-gray-900">{loading ? "..." : stats.totalToday}</h3>
            <p className="text-xs text-blue-500 mt-2 font-medium">Slot terisi</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </div>
        {/* Revenue */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Estimasi Pendapatan</p>
            <h3 className="text-3xl font-bold text-gray-900">{loading ? "..." : `Rp ${stats.revenueToday.toLocaleString('id-ID')}`}</h3>
            <p className="text-xs text-green-500 mt-2 font-medium">Hari ini</p>
          </div>
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* --- AKTIVITAS TERBARU (FIXED NAME) --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-lg text-gray-800 mb-4">Booking Terbaru Masuk</h3>
        
        <div className="space-y-4">
          {recentActivities.length === 0 ? (
             <p className="text-gray-400 text-center py-4">Belum ada booking masuk.</p>
          ) : (
            recentActivities.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition border border-gray-50">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm
                    ${item.status === 'pending' ? 'bg-orange-500' : item.status === 'confirmed' ? 'bg-green-500' : 'bg-red-500'}
                  `}>
                    <User size={18} />
                  </div>
                  <div>
                    {/* LOGIC NAMA DIPERBAIKI DISINI */}
                    <p className="text-sm font-bold text-gray-900">
                      {item.profiles?.full_name || item.customer_name || "Tanpa Nama"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                       <span>{item.booking_date} ({item.start_time})</span>
                       <span className="text-gray-300">|</span>
                       {item.is_offline_booking ? (
                         <span className="flex items-center gap-1 text-gray-600"><User size={10}/> Manual</span>
                       ) : (
                         <span className="flex items-center gap-1 text-blue-600"><Globe size={10}/> Online</span>
                       )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase
                    ${item.status === 'pending' ? 'bg-orange-100 text-orange-700' : 
                      item.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                  `}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}