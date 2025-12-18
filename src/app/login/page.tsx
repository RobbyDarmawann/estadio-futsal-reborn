"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, Loader2, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("Login Gagal: Email atau password salah.");
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role === 'admin') {
        router.push("/admin"); 
      } else {
        router.push("/booking"); 
      }
      
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 relative">
        
        <Link href="/" className="absolute top-8 left-8 text-gray-500 hover:text-red-600 flex items-center gap-2 transition font-medium">
           <ArrowLeft size={20}/> Kembali
        </Link>

        <div className="mb-10 mt-12 md:mt-0">
          <Image src="/images/main-logo.png" alt="Logo" width={150} height={50} className="mb-6 object-contain" />
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Welcome Back!</h1>
          <p className="text-gray-500 text-lg">Masuk untuk mulai booking lapangan.</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm border border-red-200 font-medium flex items-center gap-2">
            <span className="text-xl">⚠️</span> {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Input Email */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="text-gray-400" size={22} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-300 text-gray-900 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition font-medium text-lg placeholder:text-gray-400"
                placeholder="nama@email.com"
              />
            </div>
          </div>

          {/* Input Password */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="text-gray-400" size={22} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-300 text-gray-900 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition font-medium text-lg placeholder:text-gray-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-red-700 transition shadow-lg hover:shadow-red-500/40 flex justify-center items-center disabled:bg-gray-300 disabled:cursor-not-allowed mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Masuk Sekarang"}
          </button>
        </form>

        <p className="mt-10 text-center text-gray-600 font-medium">
          Belum punya akun?{" "}
          <Link href="/register" className="text-red-600 font-bold hover:underline">
            Daftar Akun
          </Link>
        </p>
      </div>

      {/* BAGIAN KANAN: GAMBAR */}
      <div className="hidden lg:block w-1/2 relative bg-gray-900">
        <Image
          src="/images/banner.jpg"
          alt="Login Visual"
          fill
          className="object-cover opacity-50"
          priority
        />
        <div className="absolute inset-0 flex flex-col justify-end p-20 text-white bg-gradient-to-t from-black/90 via-black/30 to-transparent">
          <h2 className="text-5xl font-extrabold mb-6 leading-tight">Estadio Futsal <br/> Arena.</h2>
          <p className="text-xl text-gray-200 font-light leading-relaxed">
            Platform booking lapangan futsal modern. Cek jadwal realtime, booking tanpa ribet, main lebih puas.
          </p>
        </div>
      </div>
    </div>
  );
}