"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  User, Mail, Shield, Calendar, Edit2, Save, 
  Loader2, LogOut, Lock 
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function AdminProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Data Admin
  const [profile, setProfile] = useState({
    id: "",
    email: "",
    fullName: "",
    role: "",
    createdAt: ""
  });

  // State untuk form edit
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    // 1. Ambil User Auth
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/login");
      return;
    }

    // 2. Ambil Detail Profil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile({
        id: user.id,
        email: user.email || "",
        fullName: profileData.full_name || "",
        role: profileData.role,
        createdAt: user.created_at
      });
      setEditName(profileData.full_name || "");
    }
    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) return alert("Nama tidak boleh kosong");
    setIsSaving(true);

    try {
      // Update Supabase Auth Metadata
      await supabase.auth.updateUser({
        data: { full_name: editName }
      });

      // Update Table Profiles
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editName })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, fullName: editName });
      setIsEditing(false);
      alert("Profil berhasil diperbarui!");
      router.refresh();

    } catch (error: any) {
      alert("Gagal update: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "A";
  };

  if (loading) return <div className="h-full flex items-center justify-center text-gray-500"><Loader2 className="animate-spin mr-2"/> Memuat Profil...</div>;

  return (
    <div>
      {/* Header Page */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-gray-500 mt-1">Kelola informasi akun administrator Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- KARTU KIRI: IDENTITAS VISUAL --- */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center relative overflow-hidden">
            {/* Hiasan Background Atas */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-gray-900 to-gray-800"></div>
            
            <div className="relative z-10 -mt-4">
              <div className="w-28 h-28 mx-auto bg-white p-1.5 rounded-full shadow-lg mb-4">
                <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-4xl font-bold text-gray-600">
                  {getInitials(profile.fullName)}
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-gray-900">{profile.fullName}</h2>
              <p className="text-sm text-gray-500 mb-4">{profile.email}</p>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wider rounded-full border border-red-100">
                <Shield size={12} /> Administrator
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bergabung</span>
                <span className="font-medium text-gray-900">
                  {format(new Date(profile.createdAt), "d MMMM yyyy", { locale: id })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="font-medium text-green-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div> Aktif
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- KARTU KANAN: FORM EDIT --- */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-gray-800">Informasi Pribadi</h3>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                >
                  <Edit2 size={16}/> Edit Data
                </button>
              )}
            </div>

            <div className="space-y-6">
              
              {/* Input Nama (Bisa Diedit) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-gray-400" size={18}/>
                  <input 
                    type="text" 
                    disabled={!isEditing}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none font-medium transition
                      ${isEditing 
                        ? "bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900" 
                        : "bg-gray-50 border-transparent text-gray-600 cursor-not-allowed"}
                    `}
                  />
                </div>
              </div>

              {/* Input Email (Read Only) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex justify-between">
                  Email Login
                  <span className="text-[10px] text-orange-500 flex items-center gap-1 normal-case font-normal"><Lock size={10}/> Tidak dapat diubah</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-gray-400" size={18}/>
                  <input 
                    type="text" 
                    disabled
                    value={profile.email}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border border-transparent text-gray-500 cursor-not-allowed font-medium outline-none"
                  />
                </div>
              </div>

              {/* Input Role (Read Only) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Hak Akses</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-3.5 text-gray-400" size={18}/>
                  <input 
                    type="text" 
                    disabled
                    value="Super Admin" // Hardcode tampilan kerennya
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border border-transparent text-gray-500 cursor-not-allowed font-medium outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="pt-4 flex gap-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                  <button 
                    onClick={() => { setIsEditing(false); setEditName(profile.fullName); }}
                    className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleUpdateProfile}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition flex items-center gap-2 disabled:bg-blue-400"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={18}/> : <><Save size={18}/> Simpan Perubahan</>}
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* Logout Zone */}
          <div className="mt-8 bg-red-50 rounded-2xl p-6 border border-red-100 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-red-900">Keluar Aplikasi</h4>
              <p className="text-sm text-red-600/80">Sesi Anda akan berakhir di perangkat ini.</p>
            </div>
            <button 
              onClick={handleLogout}
              className="px-5 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white transition flex items-center gap-2 shadow-sm"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}