"use client";

import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Toast from "@/components/Toast";
import { useRouter } from "next/navigation";
import { 
  Calendar, Clock, MapPin, CheckCircle, Info, 
  CreditCard, Banknote, Upload, X, Loader2 
} from "lucide-react";

export default function BookingPage() {
  const router = useRouter();
  
  // --- STATE ---
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedField, setSelectedField] = useState("1");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [bookedSlotsFromDB, setBookedSlotsFromDB] = useState<string[]>([]); 
  
  // State Modal Pembayaran
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"bri" | "cod" | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const PRICE_PER_HOUR = 150000;
  // Waktu tunggu pembayaran (menit). Ubah nilai ini untuk mengatur durasi timeout.
  const WAIT_MINUTES = 45;

  // State untuk pembayaran COD (deadline + countdown)
  const [paymentDeadline, setPaymentDeadline] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  const [confirmedCODBookingIds, setConfirmedCODBookingIds] = useState<number[]>([]);

  // --- CEK LOGIN & REALTIME ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/login");
      else {
        setUser(user);
        setLoadingUser(false);
      }
    };
    checkUser();

    // Realtime Listener: Update slot jika ada yang booking
    const channel = supabase
      .channel('realtime-user-bookings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, () => {
        fetchBookedSlots(selectedDate, selectedField);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, () => {
        fetchBookedSlots(selectedDate, selectedField);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router, selectedDate, selectedField]);

  // --- AMBIL DATA SLOT DARI DB ---
  const fetchBookedSlots = async (date: string, fieldId: string) => {
    const { data } = await supabase
      .from('bookings')
      .select('start_time')
      .eq('booking_date', date)
      .eq('field_id', parseInt(fieldId))
      .neq('status', 'cancelled'); // Ambil yang pending & confirmed

    if (data) {
      const times = data.map((item: any) => item.start_time.substring(0, 5));
      setBookedSlotsFromDB(times);
    }
  };

  // Countdown timer effect (client-side) untuk menampilkan sisa waktu
  useEffect(() => {
    if (countdownSeconds <= 0) return;
    const iv = setInterval(() => {
      setCountdownSeconds((s) => {
        if (s <= 1) {
          clearInterval(iv);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [countdownSeconds]);

  useEffect(() => {
    fetchBookedSlots(selectedDate, selectedField);
    setSelectedSlots([]); 
  }, [selectedDate, selectedField]);

  // --- GENERATE JAM (00:00 - 23:00) ---
  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  // --- HANDLE KLIK SLOT ---
  const handleSlotClick = (time: string) => {
    if (selectedSlots.includes(time)) {
      setSelectedSlots(selectedSlots.filter((t) => t !== time));
    } else {
      if (selectedSlots.length >= 4) {
        setToastMessage("Maksimal booking 4 jam per sesi!");
        setShowToast(true);
        return;
      }
      setSelectedSlots([...selectedSlots, time].sort());
    }
  };

  // --- SUBMIT BOOKING ---
  const handleBookingSubmit = async () => {
    // Jika memilih BRI, wajib upload bukti. Untuk COD tidak perlu upload di sini.
    if (paymentMethod === 'bri' && !uploadFile) {
      setToastMessage("Wajib upload bukti pembayaran untuk transfer BRI!");
      setShowToast(true);
      return;
    }
    setIsSubmitting(true);

    try {
      let proofUrl: string | null = null;

      // Jika ada file (BRI), upload dulu dan dapatkan URL
      if (uploadFile) {
        const fileExt = uploadFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('booking-proofs')
          .upload(fileName, uploadFile);

        if (uploadError) throw uploadError;

        proofUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/booking-proofs/${fileName}`;
      }

      // Siapkan deadline (untuk COD)
      const deadlineIso = paymentMethod === 'cod' ? new Date(Date.now() + WAIT_MINUTES * 60 * 1000).toISOString() : null;

      // Insert dan ambil id yang terinsert agar bisa di-cancel otomatis client-side
      const insertedIds: number[] = [];

      for (const time of selectedSlots) {
        const startHour = parseInt(time.split(':')[0]);
        const endHour = (startHour + 1) % 24; 
        const endTime = `${endHour.toString().padStart(2, '0')}:00`;

        // Try insert with payment_deadline if present; if DB doesn't have the column, retry without it
        let inserted: any = null;
        let insertError: any = null;

        try {
          const resp = await supabase.from('bookings')
            .insert({
              field_id: parseInt(selectedField),
              user_id: user.id,
              booking_date: selectedDate,
              start_time: time,
              end_time: endTime,
              status: 'pending',
              payment_method: paymentMethod === 'bri' ? 'transfer_bri' : 'bayar_ditempat',
              proof_image_url: proofUrl,
              is_offline_booking: paymentMethod === 'cod',
              payment_deadline: deadlineIso
            })
            .select('id')
            .single();
          inserted = resp.data;
          insertError = resp.error;
        } catch (err) {
          insertError = err;
        }

        if (insertError) {
          const msg = (insertError && (insertError.message || JSON.stringify(insertError))).toString();
          if (msg.toLowerCase().includes('payment_deadline') || msg.toLowerCase().includes('column') || msg.toLowerCase().includes('unknown')) {
            // retry without payment_deadline
            const resp2 = await supabase.from('bookings')
              .insert({
                field_id: parseInt(selectedField),
                user_id: user.id,
                booking_date: selectedDate,
                start_time: time,
                end_time: endTime,
                status: 'pending',
                payment_method: paymentMethod === 'bri' ? 'transfer_bri' : 'bayar_ditempat',
                proof_image_url: proofUrl,
                is_offline_booking: paymentMethod === 'cod'
              })
              .select('id')
              .single();
            if (resp2.error) throw resp2.error;
            inserted = resp2.data;
          } else {
            throw insertError;
          }
        }

        if (inserted && inserted.id) insertedIds.push(inserted.id);
      }

      // Jika COD, simpan deadline di DB dan schedule client-side cancellation.
      if (paymentMethod === 'cod' && deadlineIso) {
        setPaymentDeadline(deadlineIso);
        setConfirmedCODBookingIds(insertedIds);

        // Schedule client-side cancellation (browser must tetap terbuka; tambahkan job server untuk keandalan)
        setTimeout(async () => {
          try {
            await supabase.from('bookings').update({ status: 'cancelled' })
              .in('id', insertedIds)
              .eq('status', 'pending');
            // Refresh slots
            fetchBookedSlots(selectedDate, selectedField);
          } catch (err) {
            console.error('Auto-cancel failed', err);
          }
        }, WAIT_MINUTES * 60 * 1000);

        // Tutup modal dan tampilkan toast lalu kembali ke halaman booking
        setShowPaymentModal(false);
        setToastMessage("Booking berhasil! Silahkan lunasi pembayaran ke admin dalam waktu " + WAIT_MINUTES + " menit.");
        setShowToast(true);
        setTimeout(() => router.push('/booking'), 1500);
      } else {
        // Untuk transfer BRI: tampilkan toast dan tutup modal
        setToastMessage("Booking Berhasil! Silahkan tunggu konfirmasi Admin.");
        setShowToast(true);
        setShowPaymentModal(false);
      }

      setSelectedSlots([]);
      setUploadFile(null);
      setPaymentMethod(null);

      // Refresh Manual
      fetchBookedSlots(selectedDate, selectedField);

    } catch (error: any) {
      console.error(error);
      setToastMessage("Gagal melakukan booking: " + error.message);
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingUser) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-20 relative pt-20">
      <Navbar />

      {/* HEADER */}
      <div className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Halo, {user?.user_metadata?.full_name}!
          </h1>
          <p className="text-gray-400">Pilih jadwal main tim kamu hari ini.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
        
        {/* FILTER */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Calendar size={18} className="text-red-600"/> Tanggal Main
            </label>
            <input 
              type="date" 
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-red-500 outline-none cursor-pointer font-bold"
            />
          </div>

          <div className="w-full md:w-1/2">
            <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <MapPin size={18} className="text-red-600"/> Pilih Lapangan
            </label>
            <div className="relative">
              <select 
                value={selectedField} 
                onChange={(e) => setSelectedField(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-red-500 outline-none appearance-none cursor-pointer font-bold"
              >
                <option value="1">Lapangan A (Vinyl Interlock)</option>
                <option value="2">Lapangan B (Sintetis Hitam)</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">▼</div>
            </div>
          </div>
        </div>

        {/* GRID SLOT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                  <Clock size={20} /> Slot Waktu (24 Jam)
                </h3>
                <div className="flex gap-2 text-[10px] text-gray-800 font-bold md:text-xs">
                  <div className="flex items-center gap-1"><span className="w-3 h-3 bg-white border border-gray-300 rounded"></span> Available</div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-600 rounded"></span> Selected</div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-200 rounded"></span> Booked</div>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {generateTimeSlots().map((time) => {
                  const now = new Date();
                  const currentHour = now.getHours();
                  const slotHour = parseInt(time.split(':')[0]);
                  const isToday = selectedDate === now.toISOString().split('T')[0];
                  
                  const isPastTime = isToday && slotHour <= currentHour;
                  const isBookedDB = bookedSlotsFromDB.includes(time);
                  const isDisabled = isPastTime || isBookedDB;
                  const isSelected = selectedSlots.includes(time);

                  const endHour = (slotHour + 1) % 24;
                  const displayEndHour = endHour === 0 ? "24" : endHour.toString().padStart(2, '0');
                  const timeLabel = `${time}-${displayEndHour}:00`;

                  return (
                    <button
                      key={time}
                      disabled={isDisabled}
                      onClick={() => handleSlotClick(time)}
                      className={`
                        py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg border transition flex flex-col items-center justify-center gap-1
                        ${isDisabled 
                          ? "bg-gray-50 text-gray-300 cursor-not-allowed border-gray-100" 
                          : isSelected
                            ? "bg-red-600 text-white border-red-600 shadow-md scale-105 z-10" 
                            : "bg-white text-gray-700 hover:border-red-500 hover:text-red-600 border-gray-200" 
                        }
                      `}
                    >
                      <span>{timeLabel}</span>
                      {isBookedDB ? (
                        <span className="text-[9px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">Booked</span>
                      ) : isPastTime && !isBookedDB ? (
                         <span className="text-[9px] text-gray-300">Lewat</span>
                      ) : isSelected ? (
                         <CheckCircle size={12} className="text-white/80"/>
                      ) : (
                         <span className="text-[9px] text-green-600 font-normal">Available</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SUMMARY & CHECKOUT */}
          <div className="lg:col-span-1">
             <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-24">
                <h3 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-4 mb-4">Ringkasan</h3>
                <div className="space-y-4 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Tanggal:</span>
                    <span className="font-medium text-gray-900">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Jam:</span>
                    <span className="font-medium text-gray-900">{selectedSlots.length} Jam</span>
                  </div>
                </div>

                {selectedSlots.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedSlots.map(slot => (
                      <span key={slot} className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded font-bold border border-red-100">
                        {slot}
                      </span>
                    ))}
                  </div>
                )}

                <div className="border-t border-dashed border-gray-300 my-6"></div>

                <div className="flex justify-between items-end mb-6">
                  <span className="text-gray-600">Total Bayar</span>
                  <span className="text-2xl font-bold text-red-600">
                    Rp {(selectedSlots.length * PRICE_PER_HOUR).toLocaleString('id-ID')}
                  </span>
                </div>

                <button 
                  disabled={selectedSlots.length === 0}
                  onClick={() => setShowPaymentModal(true)} 
                  className={`
                    w-full py-4 rounded-xl font-bold text-white transition
                    ${selectedSlots.length === 0 
                      ? "bg-gray-300 cursor-not-allowed" 
                      : "bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-red-500/30"}
                  `}
                >
                  Lanjut Pembayaran
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* --- POPUP MODAL PEMBAYARAN --- */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900">
                {!paymentMethod ? "Pilih Metode Pembayaran" : "Konfirmasi Pembayaran"}
              </h3>
              <button onClick={() => { setShowPaymentModal(false); setPaymentMethod(null); }} className="text-gray-400 hover:text-red-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {!paymentMethod && (
                <div className="space-y-3">
                  <button onClick={() => setPaymentMethod('bri')} className="w-full flex items-center gap-4 p-4 border rounded-xl hover:border-red-500 hover:bg-red-50 transition group text-left">
                    <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition"><CreditCard size={24} /></div>
                    <div><h4 className="font-bold text-gray-900">Transfer Bank BRI</h4><p className="text-sm text-gray-500">Cek manual oleh admin</p></div>
                  </button>
                  <button onClick={() => setPaymentMethod('cod')} className="w-full flex items-center gap-4 p-4 border rounded-xl hover:border-red-500 hover:bg-red-50 transition group text-left">
                    <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition"><Banknote size={24} /></div>
                    <div><h4 className="font-bold text-gray-900">Bayar Ditempat (COD)</h4><p className="text-sm text-gray-500">Anda diberi waktu pembayaran setelah konfirmasi</p></div>
                  </button>
                </div>
              )}

              {paymentMethod && (
                <div className="space-y-6 animate-in slide-in-from-right-10 duration-300">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    {paymentMethod === 'bri' ? (
                      <>
                        <p className="text-xs text-blue-600 font-bold uppercase mb-1">Transfer ke:</p>
                        <p className="text-lg font-bold text-gray-900">BRI 1234-5678-9012-345</p>
                        <p className="text-sm text-gray-600">a.n. Estadio Futsal</p>
                        <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between">
                          <span className="text-sm text-gray-600">Total Transfer:</span>
                          <span className="font-bold text-red-600">Rp {(selectedSlots.length * PRICE_PER_HOUR).toLocaleString('id-ID')}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        {confirmedCODBookingIds.length > 0 && paymentDeadline ? (
                          <>
                            <p className="text-sm text-gray-700 font-medium mb-2">Booking berhasil. Silahkan lunasi pembayaran ke admin dalam batas waktu berikut.</p>
                            <div className="mt-2 p-3 bg-green-50 rounded border border-green-100">
                              <p className="text-sm text-gray-700">Batas waktu pembayaran:</p>
                              <p className="font-bold text-lg text-red-600">{new Date(paymentDeadline).toLocaleString()}</p>
                              <p className="mt-2 text-sm text-gray-600">Sisa waktu: <span className="font-mono">{Math.floor(countdownSeconds/60).toString().padStart(2,'0')}:{(countdownSeconds%60).toString().padStart(2,'0')}</span></p>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <button onClick={() => { setShowPaymentModal(false); setPaymentMethod(null); }} className="flex-1 py-2 bg-gray-100 rounded font-bold">Tutup</button>
                              <button onClick={async () => {
                                // Manual cancel
                                try {
                                  await supabase.from('bookings').update({ status: 'cancelled' }).in('id', confirmedCODBookingIds).eq('status', 'pending');
                                  fetchBookedSlots(selectedDate, selectedField);
                                  setPaymentDeadline(null);
                                  setConfirmedCODBookingIds([]);
                                  setShowPaymentModal(false);
                                } catch (err) { console.error(err); setToastMessage('Gagal batalkan booking'); setShowToast(true); }
                              }} className="py-2 px-3 bg-red-600 text-white rounded font-bold">Batalkan Sekarang</button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-gray-700 font-medium mb-2">Untuk pembayaran ditempat, silahkan konfirmasi booking. Anda memiliki {WAIT_MINUTES} menit untuk membayar kepada admin.</p>
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {paymentMethod === 'bri' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Upload Bukti Transfer</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition cursor-pointer relative">
                        <input type="file" accept="image/*" onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                        {uploadFile ? (
                          <div className="flex flex-col items-center text-green-600"><CheckCircle size={32} className="mb-2" /><p className="text-sm font-medium">{uploadFile.name}</p><p className="text-xs text-gray-400">Klik untuk ganti</p></div>
                        ) : (
                          <div className="flex flex-col items-center text-gray-400"><Upload size={32} className="mb-2" /><p className="text-sm font-medium">Klik untuk pilih gambar</p><p className="text-xs">JPG, PNG (Max 2MB)</p></div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => setPaymentMethod(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition" disabled={isSubmitting}>Kembali</button>
                    <button onClick={handleBookingSubmit} disabled={isSubmitting} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition shadow-lg flex justify-center items-center gap-2 disabled:bg-gray-400">
                      {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : "Konfirmasi Booking"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <Toast message={toastMessage} show={showToast} onClose={() => setShowToast(false)} />
    </main>
  );
}