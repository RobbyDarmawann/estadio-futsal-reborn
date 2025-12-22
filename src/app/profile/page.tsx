"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  User, Mail, Calendar, Edit2, Save, LogOut, 
  Loader2, Trophy, Wallet, History 
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Toast from "@/components/Toast";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Form State
  const [fullName, setFullName] = useState("");
  
  // Stats State
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalSpent: 0,
    memberSince: ""
  });

  useEffect(() => {
    const getData = async () => {
      // 1. Ambil User
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
      setFullName(user.user_metadata?.full_name || "");

      // 2. Ambil Statistik Booking User Ini
      const { data: bookings } = await supabase
        .from('bookings')
        .select('status, total_price') // Asumsi kita akan hitung manual atau pakai konstanta
        .eq('user_id', user.id);

      if (bookings) {
        // Hitung total booking (semua status)
        const total = bookings.length;
        
        // Hitung pengeluaran (hanya yang confirmed)
        // Kita asumsikan harga per jam 150.000 jika kolom total_price belum ada di DB
        // Atau hitung berdasarkan jumlah confirmed * 150000
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
        const spent = confirmedBookings.length * 150000;

        setStats({
          totalBookings: total,
          totalSpent: spent,
          memberSince: user.created_at
        });
      }

      setLoading(false);
    };

    getData();
  }, [router]);

  // --- LOGIC UPDATE PROFIL ---
  const handleUpdateProfile = async () => {
    setIsSaving(true);
    
    // Update metadata di Supabase Auth
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName }
    });

    // Update juga di tabel public.profiles agar sinkron
    if (!error && user) {
      await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);
        
      setIsEditing(false);
      router.refresh(); // Refresh agar navbar update nama
    } else {
      setToastMessage("Gagal mengupdate profil.");
      setShowToast(true);
    }
    
    setIsSaving(false);
  };

  // --- LOGIC LOGOUT ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Helper Initials
  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-red-600" /></div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <Navbar />

      {/* --- HERO HEADER BACKGROUND --- */}
      <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 h-64 w-full">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-4xl mx-auto px-6 h-full flex items-center justify-center pt-10">
           {/* Bisa kasih background pattern tipis disini kalau mau */}
        </div>
      </div>

      {/* --- MAIN CONTENT CARD --- */}
      <div className="max-w-4xl mx-auto px-4 -mt-24 relative z-10">
        
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          
          {/* PROFILE HEADER (AVATAR) */}
          <div className="flex flex-col items-center  pb-6">
            <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg">
              <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-5xl font-bold text-white shadow-inner">
                {getInitials(fullName)}
              </div>
            </div>
            
            <div className="text-center mt-4">
              <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
              <p className="text-gray-500 flex items-center justify-center gap-1 mt-1">
                <Mail size={14} /> {user?.email}
              </p>
              
              {/* Badge Member */}
              <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
                <User size={12} className="mr-1"/> Official Member
              </div>
            </div>
          </div>

          {/* --- STATS GRID --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-t border-b border-gray-100 bg-gray-50/50">
            <div className="p-6 text-center hover:bg-gray-50 transition">
              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm font-medium mb-1">
                <History size={16} /> Total Booking
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
            </div>
            <div className="p-6 text-center hover:bg-gray-50 transition">
              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm font-medium mb-1">
                <Wallet size={16} /> Total Pengeluaran
              </div>
              <p className="text-2xl font-bold text-gray-900">Rp {stats.totalSpent.toLocaleString('id-ID')}</p>
            </div>
            <div className="p-6 text-center hover:bg-gray-50 transition">
              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm font-medium mb-1">
                <Calendar size={16} /> Bergabung Sejak
              </div>
              <p className="text-lg font-bold text-gray-900">
                {stats.memberSince ? format(new Date(stats.memberSince), "d MMM yyyy", { locale: id }) : "-"}
              </p>
            </div>
          </div>

          {/* --- EDIT FORM SECTION --- */}
          <div className="p-8 md:p-12">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-gray-900">Informasi Pribadi</h3>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-red-600 hover:text-red-700 font-bold text-sm flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg transition"
                >
                  <Edit2 size={16} /> Edit Profil
                </button>
              )}
            </div>

            <div className="space-y-6 max-w-2xl mx-auto">
              
              {/* Input Nama */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lengkap / Tim</label>
                <div className={`relative transition-all ${isEditing ? 'opacity-100' : 'opacity-70'}`}>
                  <User className="absolute left-4 top-4 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={fullName}
                    disabled={!isEditing}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl border outline-none font-medium transition-all
                      ${isEditing 
                        ? "bg-white border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 shadow-sm" 
                        : "bg-gray-100 border-transparent text-gray-600 cursor-not-allowed"}
                    `}
                  />
                </div>
              </div>

              {/* Input Email (Disabled) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Alamat Email <span className="text-xs font-normal text-gray-400">(Tidak dapat diubah)</span></label>
                <div className="relative opacity-70">
                  <Mail className="absolute left-4 top-4 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-100 border border-transparent text-gray-600 cursor-not-allowed font-medium outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons (Save / Cancel) */}
              {isEditing && (
                <div className="flex gap-4 pt-4 animate-in fade-in slide-in-from-bottom-4">
                  <button 
                    onClick={() => { setIsEditing(false); setFullName(user.user_metadata.full_name); }}
                    className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleUpdateProfile}
                    disabled={isSaving}
                    className="flex-[2] py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg hover:shadow-red-500/30 transition flex justify-center items-center gap-2"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={20}/> : <><Save size={20}/> Simpan Perubahan</>}
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* --- FOOTER ACTIONS --- */}
          <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-center">
             <button 
               onClick={handleLogout}
               className="text-red-600 hover:text-white hover:bg-red-600 px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 border border-red-200 hover:border-red-600"
             >
               <LogOut size={18} /> Keluar Akun
             </button>
          </div>

        </div>
      </div>
    </main>
    <Toast message={toastMessage} show={showToast} onClose={() => setShowToast(false)} />
  );
}