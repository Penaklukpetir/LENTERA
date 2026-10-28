import React, { useEffect, useState } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';
const FALLBACK_IMG = '/indonesian_coffee_farmer.png';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function Home({ setActiveView, destinations = [] }) {
  const [showVideo, setShowVideo] = useState(false);
  const [modules, setModules] = useState([]);
  const [eresources, setEresources] = useState([]);

  useEffect(() => {
    const loadVillageContent = async () => {
      try {
        const [eduRes, eresRes] = await Promise.all([
          fetch(`${API_BASE_URL}/education`),
          fetch(`${API_BASE_URL}/eresources`)
        ]);
        if (eduRes.ok) setModules(await eduRes.json());
        if (eresRes.ok) setEresources(await eresRes.json());
      } catch (err) {
        console.error('Gagal memuat konten desa:', err);
      }
    };
    loadVillageContent();
  }, []);

  const featured = modules[0]
    ? {
        kicker: modules[0].category || 'EDUKASI',
        title: modules[0].title,
        desc: modules[0].description || modules[0].sub_info || '',
        img: modules[0].image_url || FALLBACK_IMG,
        date: modules[0].created_at,
        target: 'education'
      }
    : destinations[0]
      ? {
          kicker: destinations[0].tag || 'DESTINASI',
          title: destinations[0].name,
          desc: destinations[0].description || '',
          img: destinations[0].img_url || FALLBACK_IMG,
          date: destinations[0].created_at,
          target: 'location'
        }
      : null;

  const latestUpdates = [
    ...eresources.map((item) => ({
      id: `eresource-${item.id}`,
      kicker: item.type || 'E-RESOURCE',
      title: item.title,
      desc: item.content || '',
      date: item.created_at,
      img: null,
      icon: 'menu_book',
      target: 'eresource'
    })),
    ...destinations.map((item) => ({
      id: `destination-${item.id}`,
      kicker: item.tag || 'DESTINASI',
      title: item.name,
      desc: item.description || '',
      date: item.created_at,
      img: item.img_url || FALLBACK_IMG,
      target: 'location'
    }))
  ]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 2);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto pb-28 lg:pb-0">
      
      {/* Hero Section */}
      <section className="relative py-4 sm:py-8 lg:py-12 overflow-hidden bg-background-light dark:bg-background-dark shrink-0 w-full">
        {/* Modern Ambient Radial Glow */}
        <div className="absolute top-1/4 right-1/4 -z-10 w-72 sm:w-96 h-72 sm:h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-0 right-0 -z-10 w-full sm:w-1/2 h-full bg-emerald-500/5 rounded-l-full blur-3xl"></div>
        
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-4 sm:gap-8 lg:gap-12 mt-1 sm:mt-4">
          <div className="w-full lg:flex-1 space-y-3 sm:space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-[10px] sm:text-xs font-extrabold tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              EKSPLORASI DESA WISATA KUCUR
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
              Memberdayakan <span className="text-primary bg-gradient-to-r from-emerald-500 to-primary bg-clip-text text-transparent">Pariwisata</span> & Edukasi Desa
            </h1>
            <p className="text-xs sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Temukan permata agrowisata kopi tersembunyi di Desa Kucur melalui integrasi Web-GIS spasial berkelanjutan dan modul edukasi interaktif.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 justify-center lg:justify-start pt-1">
              <button 
                onClick={() => setActiveView('location')}
                className="bg-primary hover:bg-primary/95 text-slate-900 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-extrabold shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-0.5 text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">map</span>
                <span>Mulai Eksplorasi Peta</span>
              </button>
              <button 
                onClick={() => setShowVideo(true)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base text-rose-500">play_circle</span>
                <span>Tonton Video Profil</span>
              </button>
            </div>
          </div>
          <div className="flex-1 relative w-full max-w-sm sm:max-w-none">
            {/* Ambient emerald radial glow behind the hero photo */}
            <div
              className="pointer-events-none absolute -inset-8 sm:-inset-12 z-0"
              style={{
                background: 'radial-gradient(circle at 55% 45%, rgba(16,185,129,0.16) 0%, rgba(16,185,129,0.06) 42%, transparent 70%)',
                filter: 'blur(24px)'
              }}
            />
            <div className="absolute -right-6 top-1/4 h-40 w-40 sm:h-56 sm:w-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl border border-slate-200/50 dark:border-slate-800/80">
              <img 
                alt="Hero Desa Kucur" 
                className="w-full h-44 sm:h-auto aspect-[16/9] sm:aspect-[4/3] object-cover"
                src="/indonesian_coffee_farmer.png" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
              
              {/* Mobile Badge Overlay */}
              <div className="sm:hidden absolute bottom-2.5 left-2.5 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-primary text-base">map</span>
                <div>
                  <p className="text-xs font-bold leading-tight">{destinations.length} Destinasi Agrowisata</p>
                  <p className="text-[9px] text-slate-300 leading-tight">{modules.length} modul edukasi tersedia</p>
                </div>
              </div>
            </div>
            
            {/* Desktop Floating Badge */}
            <div className="hidden sm:block absolute -bottom-6 -left-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 sm:p-5 rounded-2xl shadow-2xl border border-primary/20">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-primary/20 p-2.5 sm:p-3 rounded-xl text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl sm:text-2xl">people</span>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{destinations.length}</p>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold">Destinasi Agrowisata</p>
                  <p className="text-[10px] text-slate-400 font-medium">{modules.length} modul edukasi · {eresources.length} e-resource</p>
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
            <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">Publikasi resmi dari basis data desa: modul edukasi, e-resource, dan destinasi wisata</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Left: Featured Content from PostgreSQL */}
            <div className="lg:col-span-8">
              {featured ? (
                <div
                  onClick={() => setActiveView(featured.target)}
                  className="group relative h-[320px] sm:h-[500px] rounded-2xl overflow-hidden cursor-pointer shadow-lg sm:shadow-xl card-hover"
                >
                  <img
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src={featured.img}
                    alt={featured.title}
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
                  <div className="absolute bottom-0 p-4 sm:p-10 space-y-2 sm:space-y-4">
                    <span className="px-3 py-1 bg-primary text-slate-900 text-[10px] sm:text-xs font-black rounded-full uppercase tracking-wider">
                      {featured.kicker}
                    </span>
                    <h3 className="text-base sm:text-4xl font-extrabold text-white leading-snug sm:leading-tight max-w-2xl line-clamp-2 sm:line-clamp-none">
                      {featured.title}
                    </h3>
                    {featured.desc && (
                      <p className="text-slate-200 sm:text-slate-300 max-w-xl text-xs sm:text-lg leading-relaxed line-clamp-2 sm:line-clamp-none">
                        {featured.desc}
                      </p>
                    )}
                    {featured.date && (
                      <div className="flex items-center gap-1.5 pt-1 sm:pt-2 text-white/80 text-[11px] sm:text-sm font-semibold">
                        <span className="material-symbols-outlined text-xs sm:text-sm">calendar_today</span>
                        <span>{formatDate(featured.date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-[320px] sm:h-[500px] rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex flex-col items-center justify-center gap-3 text-center px-6">
                  <span className="material-symbols-outlined text-4xl text-slate-300">feed</span>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Belum ada modul edukasi atau destinasi yang dipublikasikan.</p>
                </div>
              )}
            </div>

            {/* Right: Latest Records from PostgreSQL */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-6">
              <h4 className="text-base sm:text-xl font-extrabold flex items-center gap-2">
                <span className="w-1.5 h-5 sm:h-6 bg-primary rounded-full"></span>
                Update Terbaru
              </h4>
              <div className="space-y-3 sm:space-y-4">
                {latestUpdates.length > 0 ? latestUpdates.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.target)}
                    className="w-full flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 card-hover cursor-pointer text-left"
                  >
                    <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden">
                      {item.img ? (
                        <img
                          className="w-full h-full object-cover"
                          src={item.img}
                          alt={item.title}
                          onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/15 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-2xl">{item.icon}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="text-[10px] sm:text-xs font-extrabold text-primary uppercase">{item.kicker}</p>
                      <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">{item.title}</h5>
                      {item.date && <p className="text-[10px] sm:text-xs text-slate-400">{formatDate(item.date)}</p>}
                    </div>
                  </button>
                )) : (
                  <p className="text-xs font-semibold text-slate-400">Belum ada e-resource atau destinasi terbaru.</p>
                )}
              </div>
              <button
                onClick={() => setActiveView('eresource')}
                className="w-full py-3 sm:py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-extrabold text-xs sm:text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
              >
                Lihat Semua E-Resource
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
                className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-full bg-slate-50 dark:bg-slate-900/50 shadow-sm"
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
