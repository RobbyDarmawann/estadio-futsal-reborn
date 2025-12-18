"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2, Wifi, Shield, Coffee, ShowerHead, Grid3X3 } from "lucide-react";

// Komponen Animasi (Sama seperti di Home agar konsisten)
const FadeInSection = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

export default function About() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 font-sans pt-20">
      <Navbar />

      {/* --- HERO HEADER --- */}
      <section className="bg-gray-900 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image src="/images/banner.jpg" alt="bg" fill className="object-cover" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <motion.h1 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl md:text-5xl font-extrabold text-white mb-4"
          >
            TENTANG ESTADIO
          </motion.h1>
          <p className="text-gray-400 text-lg">Lebih dari sekadar tempat bermain futsal.</p>
        </div>
      </section>

      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="h-1 w-10 bg-red-600 rounded-full"></span>
                <span className="text-red-600 font-bold uppercase tracking-wider text-sm">Our Story</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Dibangun Oleh Penggila Futsal, Untuk Penggila Futsal.
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-justify">
                <p>
                  ESTADIO FUTSAL hadir dari hasrat memberikan kenikmatan dan kepuasan permainan 
                  kepada para pecinta futsal di kota Bekasi dan sekitarnya. 
                </p>
                <p>
                  Kami mengusung konsep <strong>Eco-friendly</strong> dan ramah lingkungan, menciptakan atmosfer 
                  yang sejuk dan sirkulasi udara yang baik, menjadikan Estadio tempat bermain yang sangat 
                  mendukung kesehatan dan performa tim Anda.
                </p>
                <p>
                  Selain lapangan standar kompetisi, kami memprioritaskan kenyamanan penonton dengan 
                  adanya <strong>Jembatan Tribun Penonton di Lantai 2</strong>, memberikan sudut pandang terbaik 
                  layaknya stadion profesional.
                </p>
              </div>
            </div>

            <div className="relative h-[400px] w-full bg-gray-200 rounded-2xl overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition duration-500">
              <Image 
                src="/images/about-1.png" 
                alt="Pintu Masuk Estadio"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </FadeInSection>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Arena Pertempuran</h2>
              <p className="text-gray-600 mt-2">Dua lapangan dengan karakter berbeda, satu standar kualitas.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="group relative h-80 rounded-2xl overflow-hidden shadow-lg">
                <Image 
                  src="/images/lapangan-biru.jpg" 
                  alt="Estadio Blue Court"
                  fill
                  className="object-cover transition duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 to-transparent flex flex-col justify-end p-8">
                  <h3 className="text-white text-2xl font-bold mb-2">Estadio Blue Court</h3>
                  <p className="text-blue-100 text-sm">Lantai Vinyl Interlock tipe Blue memberikan kontras maksimal untuk visibilitas bola yang lebih baik.</p>
                </div>
              </div>

              {/* Black Court */}
              <div className="group relative h-80 rounded-2xl overflow-hidden shadow-lg">
                <Image 
                  src="/images/lapangan-hitam.jpg" 
                  alt="Estadio Black Court"
                  fill
                  className="object-cover transition duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent flex flex-col justify-end p-8">
                  <h3 className="text-white text-2xl font-bold mb-2">Estadio Black Court</h3>
                  <p className="text-gray-300 text-sm">Desain elegan dan maskulin. Memberikan nuansa pertandingan underground yang intens dan fokus.</p>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="mb-12">
               <h2 className="text-3xl font-bold text-gray-900 mb-4">Fasilitas & Layanan</h2>
               <p className="text-gray-600">Semua yang Anda butuhkan untuk kenyamanan sebelum dan sesudah bertanding.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Grid3X3, title: "Lantai Interlock Vinyl", desc: "Standar internasional, aman untuk lutut, pantulan bola akurat." },
                { icon: Wifi, title: "Free Hotspot (WiFi)", desc: "Tetap terkoneksi, update skor di sosmed tanpa hambatan." },
                { icon: ShowerHead, title: "Shower & Ruang Ganti", desc: "Kamar mandi bersih, toilet duduk, dan shower segar." },
                { icon: CheckCircle2, title: "Rompi & Handuk", desc: "Fasilitas peminjaman rompi tim dan handuk bersih." },
                { icon: Coffee, title: "Kantin & Lounge", desc: "Tempat bersantai, ngopi, dan mengisi tenaga setelah main." },
                { icon: Shield, title: "Security & CCTV", desc: "Parkir luas dengan keamanan 24 jam dan pantauan CCTV." },
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition flex items-start gap-4">
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                    <item.icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeInSection>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Sudut Stadion</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-[500px]">
              <div className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden group">
                <Image 
                  src="/images/tribun-penonton.jpg" 
                  alt="Tribun Penonton"
                  fill
                  className="object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute bottom-0 left-0 p-4 bg-gradient-to-t from-black/70 to-transparent w-full">
                  <span className="text-white font-semibold">Tribun Penonton Lt. 2</span>
                </div>
              </div>

              {/* Gambar Kecil 1 (Scoreboard) */}
              <div className="relative rounded-2xl overflow-hidden group">
                <Image 
                  src="/images/digital-score-board.jpg" 
                  alt="Digital Scoreboard"
                  fill
                  className="object-cover group-hover:scale-105 transition duration-500"
                />
              </div>

              {/* Gambar Kecil 2 (Shower) */}
              <div className="relative rounded-2xl overflow-hidden group">
                <Image 
                  src="/images/ruang-ganti.jpg" 
                  alt="Shower Room"
                  fill
                  className="object-cover group-hover:scale-105 transition duration-500"
                />
              </div>

              <div className="col-span-2 relative rounded-2xl overflow-hidden group">
                 <Image 
                  src="/images/tribun.jpg" 
                  alt="tribun-penonton"
                  fill
                  className="object-cover group-hover:scale-105 transition duration-500"
                />
              </div>

            </div>
          </FadeInSection>
        </div>
      </section>

      <Footer />
    </main>
  );
}