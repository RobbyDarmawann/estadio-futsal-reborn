"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Check, X, Eye, Calendar, Clock, MapPin, 
  CreditCard, Banknote, Plus, User, Loader2, Globe 
} from "lucide-react";
import Image from "next/image";

// Tipe data Grouping
type GroupedBooking = {
  ids: number[];
  profile: any;
  customer_name: string | null;
  booking_date: string;
  field_id: number;
  start_time: string;
  end_time: string;
  total_hours: number;
  total_price: number;
  status: string;
  payment_method: string;
  is_offline_booking: boolean;
  proof_image_url: string | null;
  created_at: string;
};

export default function AdminBookingsPage() {
  const [groupedBookings, setGroupedBookings] = useState<GroupedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all"); 
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [manualField, setManualField] = useState("1");
  const [manualName, setManualName] = useState("");
  const [manualPayment, setManualPayment] = useState<"transfer_bri" | "bayar_ditempat" | null>(null); 
  const [manualSlots, setManualSlots] = useState<string[]>([]);
  const [bookedSlotsDB, setBookedSlotsDB] = useState<string[]>([]); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PRICE_PER_HOUR = 150000;

  useEffect(() => {
    fetchBookings();
  }, []);

  // --- FETCH & GROUPING (VIA API SERVER) ---
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bookings');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        alert('Gagal fetch bookings: ' + (errorData.error || 'Unknown error'));
        setLoading(false);
        return;
      }

      const { data } = await response.json();
      
      if (!data || data.length === 0) {
        console.log('No bookings found');
        setGroupedBookings([]);
        setLoading(false);
        return;
      }

      console.log('Fetched bookings count:', data.length);
      const groups: { [key: string]: GroupedBooking } = {};

      data.forEach((item: any) => {
        const timeKey = new Date(item.created_at).getTime(); 
        const timeGroup = Math.floor(timeKey / 10000); 

        // Gunakan nama manual jika user_id null
        const userIdentifier = item.user_id ? item.user_id : (item.customer_name || 'anon');
        
        const key = `${item.booking_date}-${item.field_id}-${userIdentifier}-${item.status}-${timeGroup}`;

        if (!groups[key]) {
          groups[key] = {
            ids: [item.id],
            profile: item.profiles,
            customer_name: item.customer_name,
            booking_date: item.booking_date,
            field_id: item.field_id,
            start_time: item.start_time,
            end_time: item.end_time,
            total_hours: 1,
            total_price: PRICE_PER_HOUR,
            status: item.status,
            payment_method: item.payment_method,
            is_offline_booking: item.is_offline_booking,
            proof_image_url: item.proof_image_url,
            created_at: item.created_at
          };
        } else {
          groups[key].ids.push(item.id);
          groups[key].total_hours += 1;
          groups[key].total_price += PRICE_PER_HOUR;
          if (item.start_time < groups[key].start_time) groups[key].start_time = item.start_time;
          if (item.end_time > groups[key].end_time) groups[key].end_time = item.end_time;
        }
      });

      const groupedArray = Object.values(groups).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log('Grouped bookings count:', groupedArray.length);
      setGroupedBookings(groupedArray);
      setLoading(false);
    } catch (error: any) {
      console.error('Fetch bookings exception:', error.message);
      alert('Exception: ' + error.message);
      setLoading(false);
    }
  };

  // --- FETCH REALTIME SLOTS ---
  const fetchBookedSlots = async (date: string, fieldId: string) => {
    try {
      const response = await fetch(
        `/api/booked-slots?date=${date}&field_id=${fieldId}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Booked slots error:', errorData.error);
        return;
      }

      const { slots } = await response.json();
      setBookedSlotsDB(slots || []);
    } catch (error: any) {
      console.error('Fetch booked slots error:', error.message);
    }
  };

  useEffect(() => {
    if (isAddModalOpen) {
      fetchBookedSlots(manualDate, manualField);
      setManualSlots([]); 
    }
  }, [manualDate, manualField, isAddModalOpen]);

  // --- SUBMIT MANUAL BOOKING (VIA API) ---
  const handleManualSubmit = async () => {
    if (!manualName || manualSlots.length === 0 || !manualPayment) return alert("Lengkapi data!");
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/manual-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manualName,
          manualDate,
          manualField,
          manualSlots,
          manualPayment
        }),
      });

      if (!response.ok) throw new Error("Gagal menyimpan data ke server");

      alert("Booking Berhasil!");
      setIsAddModalOpen(false);
      setManualName("");
      setManualSlots([]);
      setManualPayment(null);
      await fetchBookings(); 

    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- UPDATE STATUS (VIA API SERVER) ---
  const handleUpdateStatus = async (ids: number[], newStatus: string) => {
    const confirmMsg = newStatus === 'confirmed' ? "Setujui booking ini?" : "Tolak booking ini?";
    if (!confirm(confirmMsg)) return;

    try {
      const response = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Update failed');
      }

      console.log('Status updated');
      await fetchBookings();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) slots.push(`${i.toString().padStart(2, '0')}:00`);
    return slots;
  };

  const toggleManualSlot = (time: string) => {
    if (manualSlots.includes(time)) setManualSlots(manualSlots.filter(t => t !== time));
    else setManualSlots([...manualSlots, time].sort());
  };

  const filteredBookings = groupedBookings.filter(b => {
    if (filterStatus === 'all') return true;
    return b.status === filterStatus;
  });

  return (
    <div>
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daftar Booking</h1>
          <p className="text-gray-500 mt-1">Kelola reservasi masuk dan input booking manual.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex bg-gray-100 p-1.5 rounded-full">
            <button onClick={() => setFilterStatus('all')} className={`px-6 py-3 text-sm font-bold rounded-full transition shadow-sm ${filterStatus === 'all' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-900'}`}>Semua</button>
            <button onClick={() => setFilterStatus('pending')} className={`px-6 py-3 text-sm font-bold rounded-full transition shadow-sm ${filterStatus === 'pending' ? 'bg-orange-500 text-white shadow' : 'text-gray-500 hover:text-orange-600'}`}>Pending</button>
            <button onClick={() => setFilterStatus('confirmed')} className={`px-6 py-3 text-sm font-bold rounded-full transition shadow-sm ${filterStatus === 'confirmed' ? 'bg-green-600 text-white shadow' : 'text-gray-500 hover:text-green-600'}`}>Disetujui</button>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center gap-2 bg-red-600 text-white px-8 py-3 rounded-full font-bold hover:bg-red-700 transition shadow-lg hover:shadow-red-500/30">
            <Plus size={22} /> Booking Baru
          </button>
        </div>
      </div>

      {/* LIST BOOKING */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center py-10 text-gray-500">Memuat data...</p>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">Belum ada data booking.</p>
          </div>
        ) : (
          filteredBookings.map((item, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition hover:shadow-md">
              <div className="flex items-start gap-5 flex-1">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0 ${item.field_id === 1 ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-gray-700 to-gray-900'}`}>
                  <div className="text-center">
                    <MapPin size={24} className="mx-auto mb-1"/>
                    <span className="text-[10px] font-bold block">{item.field_id === 1 ? "VINYL" : "SINTETIS"}</span>
                  </div>
                </div>
                
                <div className="w-full">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    {/* NAMA USER / MANUAL */}
                    <h3 className="font-bold text-gray-900 text-xl">
                      {item.profile?.full_name || item.customer_name || "Tanpa Nama"}
                    </h3>
                    
                    {item.is_offline_booking ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                        <User size={10}/> OFFLINE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
                        <Globe size={10}/> ONLINE
                      </span>
                    )}
                    
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border
                      ${item.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                        item.status === 'confirmed' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}
                    `}>
                      {item.status}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 font-medium">
                    <div className="flex items-center gap-1.5"><Calendar size={16} className="text-gray-400"/> {item.booking_date}</div>
                    <div className="flex items-center gap-1.5 text-gray-900 font-bold bg-gray-50 px-2 py-0.5 rounded">
                       <Clock size={16} className="text-gray-500"/> {item.start_time} - {item.end_time} ({item.total_hours} Jam)
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-900">Total: Rp {item.total_price.toLocaleString('id-ID')}</div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold border ${item.payment_method === 'transfer_bri' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                       {item.payment_method === 'transfer_bri' ? <><CreditCard size={14}/> Transfer BRI</> : <><Banknote size={14}/> Bayar Ditempat</>}
                    </span>
                    
                    {!item.is_offline_booking && item.proof_image_url && (
                      <button onClick={() => setSelectedProof(item.proof_image_url)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg font-bold hover:bg-gray-200 transition cursor-pointer border border-gray-200">
                        <Eye size={14}/> Lihat Bukti
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {item.status === 'pending' && (
                <div className="flex items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                   <button onClick={() => handleUpdateStatus(item.ids, 'cancelled')} className="flex-1 md:flex-none px-5 py-2.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 font-bold text-sm flex items-center justify-center gap-2 transition"><X size={18}/> Tolak</button>
                   <button onClick={() => handleUpdateStatus(item.ids, 'confirmed')} className="flex-1 md:flex-none px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/30 transition"><Check size={18}/> Setujui</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL & LIGHTBOX (Sama seperti sebelumnya) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 md:pl-72">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-gray-900 px-8 py-5 flex justify-between items-center text-white shrink-0 rounded-t-3xl">
              <h3 className="font-bold text-xl flex items-center gap-2">Tambah Booking Manual</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="hover:text-red-400 p-1 rounded-full hover:bg-white/10 transition"><X size={24}/></button>
            </div>
            <div className="p-8 overflow-y-auto bg-gray-50 flex-1 min-h-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Pelanggan <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <User className="absolute left-4 top-3.5 text-gray-400" size={20}/>
                          <input type="text" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Contoh: Budi Walk-in" className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-bold text-gray-800"/>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Jadwal Main</label>
                        <div className="flex gap-3 mb-3">
                          <input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-red-500 outline-none"/>
                        </div>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                          <button onClick={() => setManualField("1")} className={`flex-1 py-2 text-sm font-bold rounded-md transition ${manualField === "1" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500"}`}>Lap. A (Vinyl)</button>
                          <button onClick={() => setManualField("2")} className={`flex-1 py-2 text-sm font-bold rounded-md transition ${manualField === "2" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>Lap. B (Sintetis)</button>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Metode Pembayaran <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => setManualPayment('bayar_ditempat')} className={`p-3 rounded-xl border-2 text-center transition ${manualPayment === 'bayar_ditempat' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}><span className="font-bold text-sm block">Bayar Ditempat</span></button>
                          <button onClick={() => setManualPayment('transfer_bri')} className={`p-3 rounded-xl border-2 text-center transition ${manualPayment === 'transfer_bri' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}><span className="font-bold text-sm block">Transfer BRI</span></button>
                      </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full">
                   <div className="flex justify-between items-center mb-4">
                      <label className="text-xs font-bold text-gray-500 uppercase">Pilih Jam (Realtime)</label>
                      <span className="text-xs font-bold text-red-600">{manualSlots.length} Jam Dipilih</span>
                   </div>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto pr-1 flex-1 min-h-[300px] max-h-[400px]">
                      {generateTimeSlots().map((time) => {
                        const isBooked = bookedSlotsDB.includes(time);
                        const isSelected = manualSlots.includes(time);
                        const startH = parseInt(time.split(':')[0]);
                        const endH = (startH + 1) % 24;
                        const endLabel = endH === 0 ? "24" : endH.toString().padStart(2, '0');
                        const label = `${time}-${endLabel}:00`;
                        return (
                          <button key={time} disabled={isBooked} onClick={() => toggleManualSlot(time)} className={`py-3 px-1 text-[11px] font-bold rounded border transition flex items-center justify-center ${isBooked ? 'bg-gray-100 text-gray-300 border-transparent cursor-not-allowed' : isSelected ? 'bg-red-600 text-white border-red-600 shadow-md transform scale-105' : 'bg-white text-gray-700 border-gray-200 hover:border-red-400 hover:text-red-600'}`}>{label}</button>
                        )
                      })}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                       <div className="flex justify-between items-center">
                          <div><p className="text-xs text-gray-400">Total Harga</p><p className="text-2xl font-bold text-gray-900">Rp {(manualSlots.length * PRICE_PER_HOUR).toLocaleString('id-ID')}</p></div>
                          <div className="text-right"><p className="text-xs text-gray-400">Durasi</p><p className="font-bold text-gray-900">{manualSlots.length} Jam</p></div>
                       </div>
                    </div>
                </div>
              </div>
            </div>
            <div className="p-5 bg-white border-t border-gray-100 flex gap-4 shrink-0 rounded-b-3xl">
               <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 bg-gray-100 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-200 transition">Batal</button>
               <button onClick={handleManualSubmit} disabled={isSubmitting} className="flex-[2] py-3 bg-red-600 rounded-xl font-bold text-white hover:bg-red-700 shadow-lg flex justify-center items-center gap-2 disabled:bg-gray-300">{isSubmitting ? <Loader2 className="animate-spin" size={20}/> : "Simpan & Setujui Booking"}</button>
            </div>
          </div>
        </div>
      )}

      {selectedProof && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setSelectedProof(null)}>
          <div className="relative max-w-3xl w-full max-h-[90vh] bg-white p-2 rounded-lg">
            <button onClick={() => setSelectedProof(null)} className="absolute -top-10 right-0 text-white hover:text-red-400 p-2"><X size={32}/></button>
            <div className="relative w-full h-[60vh] md:h-[80vh]">
              <Image src={selectedProof} alt="Bukti" fill className="object-contain rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}