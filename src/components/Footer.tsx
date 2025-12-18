import Link from "next/link";
import { Facebook, Twitter, Instagram, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">ESTADIO FUTSAL</h3>
            <p className="text-sm leading-relaxed mb-4">
              Arena futsal standar internasional dengan lantai vinyl interlock berkualitas. 
              Main nyaman, aman, dan seru bersama teman-teman.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="hover:text-red-500"><Facebook size={20}/></Link>
              <Link href="#" className="hover:text-red-500"><Twitter size={20}/></Link>
              <Link href="#" className="hover:text-red-500"><Instagram size={20}/></Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Menu Cepat</h4>
            <ul className="space-y-2">
              <li><Link href="/booking" className="hover:text-red-500 transition">Cek Jadwal</Link></li>
              <li><Link href="/register" className="hover:text-red-500 transition">Daftar Member</Link></li>
              <li><Link href="#" className="hover:text-red-500 transition">Peraturan & Tata Tertib</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Hubungi Kami</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="text-red-500 flex-shrink-0" size={20} />
                <span className="text-sm">Jln Perjuangan No 66, Bekasi Utara 17142</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-red-500 flex-shrink-0" size={20} />
                <span className="text-sm">0877 2121 0909</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Estadio Futsal Reborn. Rekayasa Proses Bisnis Project.
        </div>
      </div>
    </footer>
  );
}