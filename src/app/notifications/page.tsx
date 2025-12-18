"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, CheckCircle2, XCircle, Calendar, Clock, ArrowRight, Loader2 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale"; 

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        fetchNotifications(user.id);
      }
    };
    checkUser();

    const channel = supabase
      .channel('realtime-notifications')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, (payload) => {
        if (payload.new.status !== 'pending') {
          if (user) fetchNotifications(user.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router, user]);

  const fetchNotifications = async (userId: string) => {
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'pending') 
      .order('updated_at', { ascending: false });

    if (data) setNotifications(data);
    setLoading(false);
  };

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return "";
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: id });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-red-600" /></div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <Navbar />

      {/* HEADER SECTION */}
      <div className="bg-white border-b border-gray-200 pt-24 pb-8 px-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="bg-red-100 p-2 rounded-xl text-red-600">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
            <p className="text-gray-500 text-sm">Klik notifikasi untuk melihat detail riwayat.</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6">
        
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell size={40} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Belum ada notifikasi</h3>
            <p className="text-gray-500 max-w-xs mx-auto">Saat Admin menyetujui atau menolak booking Anda, infonya akan muncul di sini.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {notifications.map((item, index) => (
                <motion.div
                  key={item.id}
                  layoutId={item.id}
                  onClick={() => router.push('/history')}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
                >
                  {/* Color Strip Indicator */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 
                    ${item.status === 'confirmed' ? 'bg-green-500' : 'bg-red-500'}`} 
                  />

                  <div className="flex items-start gap-4 pl-2">
                    
                    {/* Icon Status */}
                    <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                      ${item.status === 'confirmed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
                    `}>
                      {item.status === 'confirmed' ? <CheckCircle2 size={20}/> : <XCircle size={20}/>}
                    </div>

                    <div className="flex-1">
                      {/* Header Notif */}
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900 text-base">
                          {item.status === 'confirmed' ? "Booking Disetujui!" : "Booking Ditolak"}
                        </h3>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                          {getTimeAgo(item.updated_at || item.created_at)}
                        </span>
                      </div>

                      {/* Isi Pesan */}
                      <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                        {item.status === 'confirmed' 
                          ? "Pembayaran Anda telah diverifikasi. Silahkan datang sesuai jadwal." 
                          : "Maaf, booking Anda tidak dapat diproses. Silahkan hubungi admin atau booking ulang."}
                      </p>

                      {/* Detail Booking Card Kecil */}
                      <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center gap-4 text-sm text-gray-700 group-hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400"/>
                          <span className="font-semibold">{item.booking_date}</span>
                        </div>
                        <div className="w-px h-4 bg-gray-300"></div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-gray-400"/>
                          <span>{item.start_time} - {item.end_time}</span>
                        </div>
                        
                        <div className="ml-auto">
                           <ArrowRight size={16} className="text-gray-400 group-hover:text-red-500 transition-colors"/>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}