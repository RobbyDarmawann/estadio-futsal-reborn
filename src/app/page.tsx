"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion } from "framer-motion"; 
import { MapPin, Phone, Facebook, Twitter } from "lucide-react";

const FadeInSection = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full h-full flex flex-col justify-center" 
    >
      {children}
    </motion.div>
  );
};

export default function Home() {
  const heroImages = [
    "/images/hero-1.jpg", 
    "/images/hero-2.jpg",
    "/images/hero-3.jpg",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <main className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-gray-900 text-white">
      
      <div className="fixed top-0 w-full z-50">
        <Navbar /> 
      </div>

      <section className="relative h-screen w-full snap-start flex items-center justify-center overflow-hidden">
        \
        {heroImages.map((src, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? "opacity-50" : "opacity-0"
            }`}
          >
            <Image
              src={src}
              alt={`Slide ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-red-500 font-bold tracking-[0.2em] uppercase mb-4 block">
              Premium Futsal Arena
            </span>
            <h1 className="text-5xl md:text-8xl font-extrabold text-white mb-6 leading-tight drop-shadow-2xl">
              GAME ON.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                LEVEL UP.
              </span>
            </h1>
            <p className="text-gray-200 text-lg md:text-xl mb-10 max-w-3xl mx-auto drop-shadow-md">
              Venue futsal standar internasional dengan lantai vinyl interlock terbaik di Bekasi.
            </p>
            <Link 
              href="/booking" 
              className="bg-red-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-red-700 transition shadow-lg hover:shadow-red-500/50"
            >
              Booking Sekarang
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="h-screen w-full snap-start flex items-center bg-white text-gray-900 relative overflow-hidden">
        <FadeInSection>
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-4xl font-extrabold mb-2">Fasilitas Estadio</h2>
              <div className="w-20 h-1 bg-red-600 mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[
                { title: "Lantai Vinyl", img: "/images/fasilitas-1.jpg", desc: "Standar internasional Interlock." },
                { title: "Scoreboard", img: "/images/fasilitas-2.jpg", desc: "Digital scoreboard & timer pro." },
                { title: "Locker Room", img: "/images/fasilitas-3.jpg", desc: "Ruang ganti aman & bersih." },
                { title: "Bola & Rompi", img: "/images/fasilitas-4.jpg", desc: "Bola original & rompi berkualitas." },
              ].map((item, idx) => (
                 <div key={idx} className="group bg-gray-50 rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition duration-500 h-[250px] md:h-[300px] flex flex-col">
                    <div className="relative h-3/4 w-full bg-gray-200 overflow-hidden">
                      <Image 
                        src={item.img} 
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-110 transition duration-700"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-center">
                      <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                      <p className="text-gray-600 text-xs">{item.desc}</p>
                    </div>
                 </div>
              ))}
            </div>
          </div>
        </FadeInSection>
      </section>

      <section className="h-screen w-full snap-start flex items-center bg-gray-900 relative overflow-hidden">
        <FadeInSection>
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              
              <div>
                <span className="text-red-500 font-bold tracking-widest uppercase mb-2 block">Find Us</span>
                <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-white">Lokasi & Kontak</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl">
                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                      <Phone className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Booking via WA/Telp</p>
                      <p className="text-xl font-bold text-white">0877 2121 0909</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="#" className="flex-1 flex items-center gap-3 p-3 bg-gray-800 rounded-xl hover:bg-blue-600 transition">
                      <Facebook className="text-blue-500" size={20}/> <span className="text-white font-semibold">Estadio Futsal</span>
                    </Link>
                    <Link href="#" className="flex-1 flex items-center gap-3 p-3 bg-gray-800 rounded-xl hover:bg-sky-500 transition">
                      <Twitter className="text-sky-500" size={20}/> <span className="text-white font-semibold">@estadiofutsal</span>
                    </Link>
                  </div>

                  <div className="flex items-start gap-3 mt-6">
                    <MapPin className="text-red-500 mt-1" size={24} />
                    <p className="text-gray-300">
                      Jln. Perjuangan No 66, Bekasi Utara 17142 <br/>(Dekat Summarecon Mall)
                    </p>
                  </div>
                </div>
              </div>

              {/* Peta */}
              <div className="relative h-[300px] md:h-[400px] w-full bg-white rounded-3xl overflow-hidden border-4 border-gray-700">
                <Image 
                  src="/images/map.jpg" 
                  alt="Peta Lokasi"
                  fill
                  className="object-cover"
                />
              </div>

            </div>
          </div>
        </FadeInSection>
      </section>

      <section className="h-screen w-full snap-start flex flex-col relative bg-red-600 overflow-hidden">
        {/* Bagian CTA di tengah */}
        <div className="flex-grow flex items-center justify-center px-4 relative z-10">
           <FadeInSection>
              <div className="text-center max-w-4xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                  Siap Mencetak Gol?
                </h2>
                <p className="text-red-100 text-xl mb-8 max-w-2xl mx-auto">
                  Jangan sampai kehabisan slot jam favoritmu. Amankan jadwal mainmu sekarang juga.
                </p>
                <Link 
                  href="/booking" 
                  className="inline-block bg-white text-red-600 px-12 py-5 rounded-full font-bold text-2xl hover:bg-gray-100 transition shadow-2xl transform hover:scale-105"
                >
                  Lihat Jadwal
                </Link>
              </div>
           </FadeInSection>
        </div>

        <div className="w-full">
           <Footer />
        </div>
      </section>

    </main>
  );
}