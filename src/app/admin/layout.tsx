"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminSidebar from "@/components/AdminSidebar";
import { Menu } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- SECURITY CHECK: ADMIN ONLY ---
  useEffect(() => {
    // Use session + auth state listener to avoid race where session isn't restored yet
    let subscription: any = null;
    const verifyProfile = async (user: any) => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role !== 'admin') {
          alert('Akses Ditolak! Anda bukan Admin.');
          router.push('/');
        } else {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error('Error verifying admin role:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    const init = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;

      if (user) {
        await verifyProfile(user);
        return;
      }

      // If no session yet, subscribe to auth changes (this handles browser reloads)
      const { data } = supabase.auth.onAuthStateChange((_event, s) => {
        const u = s?.user ?? null;
        if (u) {
          verifyProfile(u);
        } else {
          // No user signed in -> redirect to login
          setLoading(false);
          router.push('/login');
        }
      });

      subscription = data.subscription;
    };

    init();

    return () => {
      if (subscription?.unsubscribe) subscription.unsubscribe();
    };
  }, [router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500 font-medium">Memuat Admin Panel...</div>;
  if (!isAdmin) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* SIDEBAR (Komponen Terpisah) */}
      <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* KONTEN UTAMA */}
      <div className="flex-1 flex flex-col h-full relative overflow-y-auto">
        
        {/* --- HEADER MOBILE REVISI --- */}
        {/* bg-gray-100: Warna abu-abu (bukan hitam/putih polos) */}
        {/* h-20: Ukuran lebih besar/tinggi */}
        {/* px-6: Padding kiri kanan lebih lega */}
        <header className="md:hidden bg-gray-100 h-20 border-b border-gray-200 flex items-center px-6 sticky top-0 z-30 gap-4 shadow-sm">
          
          {/* 1. TOMBOL DI KIRI */}
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="p-3 bg-white text-gray-700 rounded-xl border border-gray-200 shadow-sm hover:text-red-600 hover:border-red-200 transition active:scale-95"
          >
            <Menu size={26} />
          </button>

          {/* Judul Dashboard */}
          <div className="flex flex-col">
            <span className="font-bold text-xl text-gray-800 leading-none">Admin Panel</span>
            <span className="text-xs text-gray-500">Estadio Futsal</span>
          </div>

        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}