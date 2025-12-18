"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, User, Loader2, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName, 
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      // Langsung redirect ke login setelah sukses
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      
      {/* BAGIAN KIRI: FORM REGISTER */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 relative">
        
        <Link href="/" className="absolute top-8 left-8 text-gray-500 hover:text-red-600 flex items-center gap-2 transition font-medium">
           <ArrowLeft size={20}/> Kembali
        </Link>

        <div className="mb-10 mt-12 md:mt-0">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Buat Akun Baru</h1>
          <p className="text-gray-500 text-lg">Gabung member Estadio & nikmati kemudahannya.</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm border border-red-200 font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          
          {/* Input Nama Lengkap */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lengkap</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="text-gray-400" size={22} />
              </div>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                // STYLE BARU: Lebih kontras
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-300 text-gray-900 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition font-medium text-lg placeholder:text-gray-400"
                placeholder="Nama Lengkap"
              />
            </div>
          </div>

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
                placeholder="Minimal 6 karakter"
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-red-700 transition shadow-lg hover:shadow-red-500/40 flex justify-center items-center disabled:bg-gray-300 disabled:cursor-not-allowed mt-6"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Daftar Member Sekarang"}
          </button>
        </form>

        <p className="mt-10 text-center text-gray-600 font-medium">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-red-600 font-bold hover:underline">
            Login disini
          </Link>
        </p>
      </div>

      <div className="hidden lg:block w-1/2 relative bg-gray-900">
        <Image
          src="/images/banner.jpg"
          alt="Register Visual"
          fill
          className="object-cover opacity-50"
          priority
        />
        <div className="absolute inset-0 flex flex-col justify-end p-20 text-white bg-gradient-to-t from-black/90 via-black/30 to-transparent">
          <h2 className="text-5xl font-extrabold mb-6 leading-tight">Join The <br/> Club.</h2>
          <p className="text-xl text-gray-200 font-light leading-relaxed">
            Dapatkan kemudahan akses booking, riwayat permainan, dan promo eksklusif member Estadio.
          </p>
        </div>
      </div>
    </div>
  );
}