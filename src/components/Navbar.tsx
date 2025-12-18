"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Menu, X, LogIn, UserPlus, 
  Bell, User, LogOut, History, ChevronDown 
} from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsProfileOpen(false);
    setIsOpen(false);
    router.push("/login");
    router.refresh();
  };

  const getInitials = () => {
    const name = user?.user_metadata?.full_name || "User";
    return name.charAt(0).toUpperCase();
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 fixed top-0 w-full z-50 transition-all font-montserrat">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* LOGO */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/">
              <Image 
                src="/images/main-logo.png" 
                alt="Estadio Futsal"
                width={150} 
                height={50} 
                className="h-14 w-auto object-contain"
                priority 
              />
            </Link>
          </div>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link href="/" className="text-gray-700 hover:text-red-600 font-medium transition">Home</Link>
            <Link href="/about" className="text-gray-700 hover:text-red-600 font-medium transition">About</Link>
            <Link href="/booking" className="text-gray-700 hover:text-red-600 font-medium transition">Jadwal & Booking</Link>
            {user && (
               <Link href="/history" className="text-gray-700 hover:text-red-600 font-medium transition flex items-center gap-2">
                 Riwayat
               </Link>
            )}
          </div>

          {/* DESKTOP AUTH SECTION */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {/* Desktop Notification */}
          <Link href="/notifications" className="relative p-2 text-gray-600 hover:text-red-600 transition rounded-full hover:bg-gray-100 group">
            <Bell size={22} className="group-hover:animate-swing" /> {/* Tambah animasi swing dikit biar lucu */}
            
            {/* Logic Titik Merah (Opsional: Nanti bisa dibikin logic unread beneran) */}
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full border border-white animate-pulse"></span>
          </Link>

                {/* Desktop Profile Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-3 pl-2 pr-4 py-1 rounded-full border border-gray-200 hover:shadow-md transition cursor-pointer"
                  >
                    <div className="w-9 h-9 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {getInitials()}
                    </div>
                    <div className="text-left hidden lg:block">
                       <p className="text-xs text-gray-500 font-semibold">Halo,</p>
                       <p className="text-sm font-bold text-gray-900 max-w-[100px] truncate">
                         {user.user_metadata?.full_name || "Member"}
                       </p>
                    </div>
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-4 py-2 border-b border-gray-50 mb-1">
                        <p className="text-xs text-gray-400">Signed in as</p>
                        <p className="text-sm font-bold truncate">{user.email}</p>
                      </div>
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">
                        <div className="flex items-center gap-2"><User size={16}/> Edit Profil</div>
                      </Link>
                      <Link href="/history" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">
                        <div className="flex items-center gap-2"><History size={16}/> Riwayat Booking</div>
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                      >
                        <div className="flex items-center gap-2"><LogOut size={16}/> Keluar</div>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="flex items-center gap-2 text-red-600 border border-red-600 hover:bg-red-50 px-4 py-2 rounded-full font-bold transition">
                  <LogIn size={18} /> Login
                </Link>
                <Link href="/register" className="flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-full font-bold hover:bg-red-700 transition shadow-md hover:shadow-red-500/30">
                  <UserPlus size={18} /> Daftar
                </Link>
              </>
            )}
          </div>

          {/* --- MOBILE VIEW SECTION (UPDATED) --- */}
          <div className="md:hidden flex items-center gap-3">
             {user && (
                <>
                  <Link href="/notifications" className="relative p-2 text-gray-600 hover:text-red-600 transition rounded-full active:bg-gray-100 flex items-center justify-center">
                    <Bell size={22} />
                    {/* Titik merah notifikasi */}
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full border border-white"></span>
                  </Link>

                  {/* 2. Mobile Avatar */}
                  <div className="w-9 h-9 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold border border-red-200">
                    {getInitials()}
                  </div>
                </>
             )}

            {/* 3. Hamburger Menu Button */}
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="text-gray-800 hover:text-red-600 p-1 focus:outline-none"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* --- MOBILE MENU DROPDOWN --- */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl absolute w-full left-0 top-20 flex flex-col p-6 space-y-4 h-screen md:h-auto overflow-y-auto">
          <Link href="/" onClick={() => setIsOpen(false)} className="block text-lg font-semibold text-gray-800 border-b pb-2">Home</Link>
          <Link href="/booking" onClick={() => setIsOpen(false)} className="block text-lg font-semibold text-gray-800 border-b pb-2">Jadwal & Booking</Link>
          <Link href="/about" onClick={() => setIsOpen(false)} className="block text-lg font-semibold text-gray-800 border-b pb-2">About</Link>

          {user ? (
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">
                   {getInitials()}
                </div>
                <div>
                   <p className="text-sm font-bold">{user.user_metadata?.full_name}</p>
                   <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              
              <Link href="/history" className="flex items-center gap-3 text-gray-700 p-2 hover:bg-gray-50 rounded-lg">
                 <History size={20} /> Riwayat Booking
              </Link>
              <Link href="/profile" className="flex items-center gap-3 text-gray-700 p-2 hover:bg-gray-50 rounded-lg">
                 <User size={20} /> Edit Profil
              </Link>
              
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold py-3 rounded-lg mt-4 border border-red-200">
                <LogOut size={20} /> Keluar Aplikasi
              </button>
            </div>
          ) : (
            <div className="pt-4 flex flex-col gap-3">
              <Link href="/login" onClick={() => setIsOpen(false)} className="w-full flex justify-center items-center gap-2 border-2 border-red-600 text-red-600 font-bold py-3 rounded-lg">
                <LogIn size={20} /> Login Member
              </Link>
              <Link href="/register" onClick={() => setIsOpen(false)} className="w-full flex justify-center items-center gap-2 bg-red-600 text-white font-bold py-3 rounded-lg">
                <UserPlus size={20} /> Daftar Sekarang
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}