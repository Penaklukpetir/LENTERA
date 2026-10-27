import React, { useState } from 'react';

export default function Home({ setActiveView }) {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      
      {/* Hero Section */}
      <section className="relative py-4 sm:py-8 lg:py-10 overflow-hidden bg-background-light dark:bg-background-dark shrink-0 w-full">
        <div className="absolute top-0 right-0 -z-10 w-full sm:w-1/2 h-full bg-primary/5 rounded-l-full blur-3xl"></div>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-4 sm:gap-8 lg:gap-12 mt-1 sm:mt-4">
          <div className="w-full lg:flex-1 space-y-3 sm:space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-bold">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
              </span>
              EKSPLORASI DESA
            </div>
            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-6xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
              Memberdayakan <span className="text-primary">Pariwisata</span> & Edukasi Desa
            </h1>
            <p className="text-xs sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Temukan permata tersembunyi di desa kami melalui pariwisata berkelanjutan dan sumber daya edukasi yang mendalam.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 justify-center lg:justify-start pt-1">
              <button 
                onClick={() => setActiveView('location')}
                className="bg-primary hover:bg-primary/95 text-slate-900 px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl font-extrabold shadow-md shadow-primary/20 transition-all transform hover:scale-[1.02] text-xs sm:text-sm cursor-pointer"
              >
                Mulai Eksplorasi
              </button>
              <button 
                onClick={() => setShowVideo(true)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-xs sm:text-sm cursor-pointer"
              >
                Tonton Video
              </button>
            </div>
          </div>
          <div className="flex-1 relative w-full max-w-xs sm:max-w-none">
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-md sm:shadow-2xl">
              <img 
                alt="Hero Desa" 
                className="w-full h-36 sm:h-auto aspect-[16/9] sm:aspect-[4/3] object-cover"
                src="/indonesian_coffee_farmer.png" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>
            <div className="hidden sm:block absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl border border-primary/10">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-primary/20 p-2 sm:p-3 rounded-lg text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg sm:text-2xl">people</span>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">1,200+</p>
                  <p className="text-xs sm:text-sm text-slate-500">Pelajar Aktif</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kabar Desa News Grid */}
      <section className="py-8 sm:py-24 bg-white dark:bg-slate-900/50 pb-28 sm:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          <div>
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">WARTA & BERITA</div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white mb-1">Kabar Desa</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">Update resmi, berita, dan catatan administratif Desa Kucur</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Left: Featured News */}
            <div className="lg:col-span-8">
              <div className="group relative h-[320px] sm:h-[500px] rounded-2xl overflow-hidden cursor-pointer shadow-lg sm:shadow-xl">
                <img 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWJWRuY4hdyxFAgFYRhvV2qjgN7yU-02_sLaVC-6sqyD_ndwVzMfOSt7tG1fu6qCRGNKWDCM3Gb6w80UGOqquCgaJ54crWr5JTPpJqM1gfduwcZJSbqACb9TCypXE0FjPyIu5XwCuak3sQxvHB5UPcYwkn9T8mgyOCaZ_NiW7YPWsUtbvFPrdlnK-EPRgBlZ1Q_I6MpsZZz6Xrot3r9Zt0QV6ztzQlcCWPYzG7tpO5ycVAv1aOZgvOfVLlw9hNgCoxACMM_a_UPZY" 
                  alt="Infrastruktur Desa"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
                <div className="absolute bottom-0 p-4 sm:p-10 space-y-2 sm:space-y-4">
                  <span className="px-3 py-1 bg-primary text-slate-900 text-[10px] sm:text-xs font-black rounded-full uppercase tracking-wider">
                    Berita Utama
                  </span>
                  <h3 className="text-base sm:text-4xl font-extrabold text-white leading-snug sm:leading-tight max-w-2xl line-clamp-2 sm:line-clamp-none">
                    Hibah Pariwisata Berkelanjutan Baru Diberikan untuk Peningkatan Infrastruktur 2024
                  </h3>
                  <p className="text-slate-200 sm:text-slate-300 max-w-xl text-xs sm:text-lg leading-relaxed line-clamp-2 sm:line-clamp-none">
                    Komite LENTERA dengan bangga mengumumkan hibah senilai Rp 3,8 Miliar untuk pengembangan jalur ramah lingkungan dan integrasi energi surya di homestay desa.
                  </p>
                  <div className="flex items-center gap-3 sm:gap-4 pt-1 sm:pt-2 text-white/80 text-[11px] sm:text-sm font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs sm:text-sm">calendar_today</span>
                      <span>15 Oktober 2023</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs sm:text-sm">person</span>
                      <span>Admin Desa</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Sidebar Updates */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-6">
              <h4 className="text-base sm:text-xl font-extrabold flex items-center gap-2">
                <span className="w-1.5 h-5 sm:h-6 bg-primary rounded-full"></span>
                Update Terbaru
              </h4>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer">
                  <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden">
                    <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1yjrM5vBBEGIX2ZccR75qyFDfzXBhH2qFt2gMjY2V6_F9hELK0VtZBehwFPdv9jn_8JxlEJIQ2YCFAYia5pGH3s1CEia8Xykjy9I_QchfmfiAtmL784Yrr1wM2nw-BfP86XTUdwiAxG2ScZmy8oUP-hF2wuQPxHWHFeP1pvIuqUUwsex8cDE78aaS1VJSnUo6cSxZIGJO-fjF7seLZLr2ZpoeVEsr6nfrfXUvxYcFFrDLh9cuervcSUWe2lZjvvtKJQAQK4KViFQ" alt="Komunitas" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs font-extrabold text-primary uppercase">Komunitas</p>
                    <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">Pertemuan Bulanan Warga: Membahas Jadwal Festival Panen</h5>
                    <p className="text-[10px] sm:text-xs text-slate-400">2 jam yang lalu</p>
                  </div>
                </div>
                <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer">
                  <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden">
                    <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAL20DZf0ZDR-WpqqJvszdVjyQtH0nQZCJmmQKeC_XmLibuVja9CJ9RB8ZSBkk9YTcmv4Jhzp0ZmCwyokAWizVrv9l-FE3DsFvWLNNI5r03TTgz-pGEFMSotHhxiXEzso7sUoxZukrt9BHO0RwcdBdQ-6j8UHdS2-0TCIY4tJs5bFxRX9Gq6oiG0wSOgYIhZe6qLpkJRLiXCj_s9_fWe3qX99EJi4jiusF8WoL5xfEH7-XKqZF7tGFiuyeVFGdrGm8kY4Sk9Rc9ung" alt="Hospitality" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs font-extrabold text-primary uppercase">Hospitality</p>
                    <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">Program Sertifikasi Homestay Baru Diluncurkan untuk Warga Lokal</h5>
                    <p className="text-[10px] sm:text-xs text-slate-400">Kemarin</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setActiveView('eresource')}
                className="w-full py-3 sm:py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-extrabold text-xs sm:text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
              >
                Lihat Semua Berita
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Banner */}
      <section className="py-16 border-y border-slate-100 dark:border-slate-800 bg-white dark:bg-background-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-slate-400 text-sm font-bold uppercase tracking-widest mb-10">Mitra Terpercaya Kami</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-75">
            {[
              { name: 'UNIVERSITAS MA CHUNG', color: 'text-rose-600 dark:text-rose-400' },
              { name: 'PEMERINTAH DESA KUCUR', color: 'text-emerald-600 dark:text-emerald-400' },
              { name: 'SATGAS KAWI LESTARI', color: 'text-amber-600 dark:text-amber-400' },
              { name: 'LENTERA SPATIAL COFFEE', color: 'text-primary font-black' },
              { name: 'KOPMA KUCUR MAJU', color: 'text-blue-600 dark:text-blue-400' }
            ].map((partner) => (
              <div 
                key={partner.name}
                className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm text-slate-400">handshake</span>
                <span className={`text-[10px] font-black tracking-widest ${partner.color}`}>{partner.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Modal Overlay */}
      {showVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
            <button 
              onClick={() => setShowVideo(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <iframe 
              className="w-full h-full" 
              src="https://www.youtube.com/embed/GkV1fXfnPVQ?autoplay=1" 
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 pt-10 sm:pt-16 pb-32 sm:pb-16 mt-auto border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-12">
          <div className="col-span-2 md:col-span-1 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 mb-3 sm:mb-6">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-900 text-sm">eco</span>
              </div>
              <span className="text-lg sm:text-xl font-black text-white">LENTERA</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-400">
              Mendorong pembangunan berkelanjutan melalui inovasi pedesaan dan edukasi. Bergabunglah bersama kami untuk membuat perubahan.
            </p>
          </div>
          <div>
            <h5 className="font-extrabold text-white mb-3 sm:mb-6 uppercase tracking-widest text-[11px] sm:text-xs">Eksplorasi</h5>
            <ul className="space-y-2.5 sm:space-y-4 text-xs sm:text-sm font-semibold">
              <li><a className="hover:text-primary transition-colors cursor-pointer" onClick={() => setActiveView('location')}>Destinasi</a></li>
              <li><a className="hover:text-primary transition-colors cursor-pointer" onClick={() => setActiveView('eresource')}>E-Resources</a></li>
              <li><a className="hover:text-primary transition-colors cursor-pointer" onClick={() => setActiveView('education')}>Lokakarya</a></li>
              <li><a className="hover:text-primary transition-colors cursor-pointer" onClick={() => setActiveView('home')}>Cerita Lokal</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-extrabold text-white mb-3 sm:mb-6 uppercase tracking-widest text-[11px] sm:text-xs">Komunitas</h5>
            <ul className="space-y-2.5 sm:space-y-4 text-xs sm:text-sm font-semibold">
              <li><a className="hover:text-primary transition-colors cursor-pointer" onClick={() => setActiveView('navigation')}>Jadi Pemandu</a></li>
              <li><a className="hover:text-primary transition-colors cursor-pointer" onClick={() => setActiveView('sponsor')}>Sponsor</a></li>
              <li><a className="hover:text-primary transition-colors cursor-pointer" onClick={() => setActiveView('home')}>Relawan</a></li>
              <li><a className="hover:text-primary transition-colors cursor-pointer" onClick={() => setActiveView('eresource')}>Forum</a></li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <h5 className="font-extrabold text-white mb-3 sm:mb-6 uppercase tracking-widest text-[11px] sm:text-xs">Hubungi Kami</h5>
            <ul className="space-y-2.5 sm:space-y-4 text-xs sm:text-sm font-semibold">
              <li className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                <span>Desa Kucur, Malang</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-sm">email</span>
                <span>halo@lentera-desa.id</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 sm:mt-16 pt-6 sm:pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4 text-[10px] sm:text-xs uppercase tracking-widest font-semibold text-center md:text-left">
          <span>© 2026 LENTERA. HAK CIPTA DILINDUNGI.</span>
          <div className="flex gap-4 sm:gap-8">
            <a className="hover:text-white transition-colors" href="#">Kebijakan Privasi</a>
            <a className="hover:text-white transition-colors" href="#">Syarat Layanan</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
