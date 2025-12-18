"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, CalendarCheck, FileText, 
  User, LogOut, X 
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export default function AdminSidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Daftar Booking", href: "/admin/bookings", icon: CalendarCheck },
    { name: "Laporan", href: "/admin/reports", icon: FileText },
    { name: "Profil Admin", href: "/admin/profile", icon: User },
  ];

  return (
    <>
      {/* OVERLAY (Hanya muncul di Mobile saat menu buka) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* SIDEBAR CONTAINER */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-gray-900 text-white transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 md:static md:block
      `}>
        
        {/* Header Sidebar */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-800 bg-gray-900">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-wider text-white">
              ADMIN<span className="text-red-600">PANEL</span>
            </span>
          </div>
          {/* Tombol Close di Mobile */}
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Menu List */}
        <div className="p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)} // Tutup sidebar pas klik (mobile)
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium
                  ${isActive 
                    ? "bg-red-600 text-white shadow-lg shadow-red-900/50" 
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"}
                `}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Tombol Logout (Di Bawah) */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-xl transition"
          >
            <LogOut size={20} />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}