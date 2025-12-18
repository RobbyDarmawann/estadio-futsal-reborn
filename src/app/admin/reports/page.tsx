"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Download, FileSpreadsheet, Calendar, Filter, 
  DollarSign, TrendingUp, Users, Loader2 
} from "lucide-react";
import * as XLSX from 'xlsx'; // Library Excel
import { format, startOfMonth, endOfMonth } from "date-fns";
import { id } from "date-fns/locale"; // Format Indonesia

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  
  // --- STATE FILTER ---
  const [filterType, setFilterType] = useState<"daily" | "monthly">("daily");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default Hari Ini
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // Default Bulan Ini (YYYY-MM)

  // --- STATE SUMMARY ---
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    successRate: 0
  });

  const PRICE_PER_HOUR = 150000; // Bisa diganti logic dinamis nanti

  useEffect(() => {
    fetchReportData();
  }, [filterType, selectedDate, selectedMonth]);

  // --- FETCH DATA ---
  const fetchReportData = async () => {
    setLoading(true);
    let query = supabase
      .from('bookings')
      .select('*, profiles(full_name)')
      .neq('status', 'cancelled') // Hanya ambil yang sukses/pending (opsional: bisa ambil semua)
      .order('booking_date', { ascending: true });

    // LOGIC FILTER TANGGAL
    if (filterType === "daily") {
      query = query.eq('booking_date', selectedDate);
    } else {
      // Logic Bulanan: Dari Tanggal 1 s.d Akhir Bulan
      const start = `${selectedMonth}-01`;
      // Hitung akhir bulan agak tricky di string, kita pakai library date-fns atau logic SQL simple
      // Cara simple: Filter string YYYY-MM
      // Tapi Supabase butuh range. Kita pakai logic startOfMonth/endOfMonth di JS
      const dateObj = new Date(selectedMonth);
      const startDate = format(startOfMonth(dateObj), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(dateObj), 'yyyy-MM-dd');
      
      query = query.gte('booking_date', startDate).lte('booking_date', endDate);
    }

    const { data: bookings, error } = await query;

    if (bookings) {
      setData(bookings);
      
      // HITUNG SUMMARY
      const confirmed = bookings.filter(b => b.status === 'confirmed');
      // Logic revenue: Hitung selisih jam start & end (karena user bisa book 2 jam)
      // Disini kita hitung simple dulu berdasarkan jumlah row * harga, 
      // TAPI sebaiknya hitung durasi jam sebenarnya.
      
      let revenue = 0;
      confirmed.forEach(b => {
         const startH = parseInt(b.start_time.split(':')[0]);
         const endH = parseInt(b.end_time.split(':')[0]);
         // Handle lewat tengah malam (23:00 - 01:00) -> logic sederhana dulu
         let duration = endH - startH;
         if (duration <= 0) duration += 24; 
         
         revenue += duration * PRICE_PER_HOUR;
      });

      setSummary({
        totalRevenue: revenue,
        totalBookings: confirmed.length,
        successRate: bookings.length > 0 ? Math.round((confirmed.length / bookings.length) * 100) : 0
      });
    }
    setLoading(false);
  };

// --- EXPORT TO EXCEL (VERSI RAPI) ---
  const handleExportExcel = () => {
    // 1. Format Data (Data Cleaning)
    // Kita ubah data mentah menjadi format yang enak dibaca manusia
    const excelData = data.map(item => ({
      "TANGGAL": format(new Date(item.booking_date), "dd/MM/yyyy", { locale: id }), // Format: 16/12/2025
      "JAM MAIN": `${item.start_time} - ${item.end_time}`,
      "NAMA PELANGGAN": (item.profiles?.full_name || item.customer_name || "Tanpa Nama").toUpperCase(), // Huruf Besar semua biar rapi
      "TIPE": item.is_offline_booking ? "OFFLINE" : "ONLINE",
      "METODE BAYAR": item.payment_method === 'transfer_bri' ? "TRANSFER BRI" : "TUNAI / COD",
      "STATUS": item.status === 'confirmed' ? "LUNAS" : "PENDING",
      "PENDAPATAN (RP)": item.status === 'confirmed' ? 150000 : 0
    }));

    // 2. Buat Worksheet dari JSON
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 3. ATUR LEBAR KOLOM (PENTING BIAR RAPI)
    // wch = width character (jumlah karakter lebar kolom)
    const columnWidths = [
      { wch: 15 }, // Kolom A: Tanggal
      { wch: 20 }, // Kolom B: Jam Main
      { wch: 35 }, // Kolom C: Nama Pelanggan (Dibuat lebar)
      { wch: 10 }, // Kolom D: Tipe
      { wch: 20 }, // Kolom E: Metode Bayar
      { wch: 15 }, // Kolom F: Status
      { wch: 20 }, // Kolom G: Pendapatan
    ];
    worksheet['!cols'] = columnWidths;

    // 4. Buat Workbook & Append
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Keuangan");

    // 5. Generate Nama File yang Informatif
    const timestamp = new Date().toLocaleTimeString().replace(/:/g, "-");
    const periodName = filterType === 'daily' 
      ? `Harian_${selectedDate}` 
      : `Bulanan_${selectedMonth}`;
    
    const fileName = `Laporan_Estadio_${periodName}_${timestamp}.xlsx`;

    // 6. Download
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div>
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Laporan Keuangan</h1>
        <p className="text-gray-500 mt-1">Rekap pendapatan harian dan bulanan Estadio Futsal.</p>
      </div>

      {/* FILTER CONTROL BAR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        
        {/* Kiri: Toggle Filter */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
          <button 
            onClick={() => setFilterType("daily")}
            className={`flex-1 md:flex-none px-6 py-2 text-sm font-bold rounded-lg transition ${filterType === 'daily' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Laporan Harian
          </button>
          <button 
            onClick={() => setFilterType("monthly")}
            className={`flex-1 md:flex-none px-6 py-2 text-sm font-bold rounded-lg transition ${filterType === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Laporan Bulanan
          </button>
        </div>

        {/* Tengah: Date Picker */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 flex items-center gap-2 w-full">
            <Calendar size={18} className="text-gray-500"/>
            {filterType === 'daily' ? (
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent outline-none text-sm font-bold text-gray-700 w-full"
              />
            ) : (
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent outline-none text-sm font-bold text-gray-700 w-full"
              />
            )}
          </div>
        </div>

        {/* Kanan: Export Button */}
        <button 
          onClick={handleExportExcel}
          disabled={data.length === 0}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 transition shadow-lg hover:shadow-green-500/30 disabled:bg-gray-300 disabled:shadow-none"
        >
          <FileSpreadsheet size={20} /> Export Excel
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl text-white shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Total Pendapatan</p>
              <h3 className="text-3xl font-bold">Rp {summary.totalRevenue.toLocaleString('id-ID')}</h3>
            </div>
            <div className="p-2 bg-white/10 rounded-lg"><DollarSign size={24}/></div>
          </div>
          <p className="text-xs text-gray-400">
            {filterType === 'daily' ? `Tanggal ${selectedDate}` : `Bulan ${selectedMonth}`}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Transaksi Sukses</p>
              <h3 className="text-3xl font-bold text-gray-900">{summary.totalBookings}</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={24}/></div>
          </div>
          <p className="text-xs text-green-600 font-bold flex items-center gap-1">
            <TrendingUp size={14}/> {summary.successRate}% Rate Pembayaran
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Status Filter</p>
              <h3 className="text-xl font-bold text-gray-900 capitalize">
                {filterType === 'daily' ? "Laporan Harian" : "Laporan Bulanan"}
              </h3>
            </div>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Filter size={24}/></div>
          </div>
          <p className="text-xs text-gray-400">Menampilkan data sesuai periode</p>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-900">Rincian Transaksi</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Tanggal</th>
                <th className="p-4 font-semibold">Jam</th>
                <th className="p-4 font-semibold">Pelanggan</th>
                <th className="p-4 font-semibold">Tipe</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2"><Loader2 className="animate-spin"/> Memuat data...</div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 italic">Tidak ada transaksi pada periode ini.</td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-medium">{item.booking_date}</td>
                    <td className="p-4">{item.start_time} - {item.end_time}</td>
                    <td className="p-4 font-bold text-gray-900">
                      {item.profiles?.full_name || item.customer_name || "Tanpa Nama"}
                    </td>
                    <td className="p-4">
                      {item.is_offline_booking ? (
                        <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold">OFFLINE</span>
                      ) : (
                        <span className="inline-flex px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold">ONLINE</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-bold uppercase
                        ${item.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}
                      `}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold">
                      {item.status === 'confirmed' ? (
                        <span className="text-green-600">Rp 150.000</span>
                      ) : (
                        <span className="text-gray-400 line-through">Rp 150.000</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}