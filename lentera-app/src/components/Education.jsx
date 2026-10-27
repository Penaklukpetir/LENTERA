import React, { useState, useEffect } from 'react';

export default function Education() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);

  useEffect(() => {
    fetchEducationModules();
  }, []);

  const fetchEducationModules = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/education');
      if (res.ok) {
        const data = await res.json();
        setModules(data);
      }
    } catch (err) {
      console.error('Fetch education modules error:', err);
    }
  };

  const slides = [
    {
      id: 0,
      tag: 'Kopi Kucur',
      title: 'Kebun Kopi Arabika Kucur',
      desc: 'Ditanam di lereng pegunungan Kawi pada ketinggian 1.200 mdpl. Nikmati pembelajaran langsung mengenai teknik pembudidayaan organik terpadu hingga pemrosesan pasca-panen tradisional.',
      img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=1200',
      color: 'bg-primary'
    },
    {
      id: 1,
      tag: 'Jeruk Organik',
      title: 'Perkebunan Jeruk Kucur',
      desc: 'Sentra budidaya jeruk unggulan bebas bahan kimia. Pelajari bagaimana sistem pertanian presisi ramah lingkungan mampu melestarikan hara tanah dan memproduksi buah manis berkualitas tinggi.',
      img: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&q=80&w=1200',
      color: 'bg-orange-500'
    },
    {
      id: 2,
      tag: 'Hutan Bambu',
      title: 'Ekowisata Hutan Bambu Lestari',
      desc: 'Kawasan konservasi seluas puluhan hektar yang dikelola mandiri oleh Karang Taruna. Berfungsi menjaga stabilitas mata air desa serta menyediakan material utama kriya anyaman bambu kreatif.',
      img: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80&w=1200',
      color: 'bg-blue-500'
    }
  ];

  const packages = [
    {
      title: 'Paket Edukasi Tani Lengkap',
      price: 'Rp 150.000 / orang',
      bg: 'https://images.unsplash.com/photo-1596422846543-75c6fc18a523?auto=format&fit=crop&q=80&w=600',
      features: ['Tur Kebun Kopi 2 Jam', 'Makan Siang Nasi Liwet', 'Souvenir Kopi Bubuk 250g', 'Bimbingan Petani Ahli']
    },
    {
      title: 'Paket Petualang Lereng Kawi',
      price: 'Rp 250.000 / orang',
      bg: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=600',
      features: ['Jelajah Hutan Bambu', 'Petik Jeruk Organik Sepuasnya', 'Camping Ground & Api Unggun', 'Pemandu Satgas Desa']
    }
  ];

  const handleNext = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const timer = setInterval(handleNext, 8000);
    return () => clearInterval(timer);
  }, []);

  const filteredModules = modules.filter(m => {
    if (activeCategory === 'Semua') return true;
    return (m.category || '').toUpperCase() === activeCategory.toUpperCase();
  });

  return (
    <div className="flex-grow overflow-y-auto max-w-7xl mx-auto px-4 sm:px-6 py-4 pb-32 sm:pb-36 font-display">
      
      <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 sm:mb-6">
        <a className="hover:text-primary" href="#">LENTERA</a>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-primary">Wisata Edukasi</span>
      </nav>

      {/* Slide Banner Carousel */}
      <section className="relative bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden shadow-md sm:shadow-2xl border border-primary/10 mb-6 sm:mb-16 h-[270px] sm:h-[440px]" id="education-carousel">
        <div className="relative w-full h-full overflow-hidden">
          {slides.map((slide, idx) => (
            <div 
              key={slide.id}
              className={`absolute inset-0 flex items-center transition-all duration-700 ${
                activeSlide === idx ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
              }`}
            >
              <div className="absolute inset-0 z-0">
                <img src={slide.img} alt={slide.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-950 via-slate-950/85 md:via-slate-950/70 to-slate-950/30 md:to-transparent"></div>
              </div>
              
              <div className="relative z-10 w-full max-w-2xl px-5 sm:px-8 md:px-16 text-white space-y-1.5 sm:space-y-4">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/40 text-primary text-[9px] sm:text-xs font-extrabold uppercase tracking-wider`}>
                  {slide.tag}
                </span>
                <h2 className="text-base sm:text-3xl md:text-5xl font-black leading-tight text-white">
                  {slide.title}
                </h2>
                <p className="text-[11px] sm:text-sm md:text-base text-slate-200 sm:text-slate-300 font-medium leading-relaxed line-clamp-2 sm:line-clamp-none">
                  {slide.desc}
                </p>
                <button 
                  onClick={() => alert(`Memulai pendaftaran Modul: ${slide.title}`)}
                  className="px-3.5 py-1.5 sm:px-6 sm:py-3 bg-primary hover:bg-primary/95 text-slate-900 font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5 uppercase text-[10px] sm:text-xs tracking-wider cursor-pointer"
                >
                  <span>Pelajari Modul</span>
                  <span className="material-symbols-outlined text-xs sm:text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop-only Carousel chevrons to prevent text collision on small mobile screens */}
        <button onClick={handlePrev} className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 dark:bg-black/20 hover:bg-white/20 border border-white/20 text-white rounded-full items-center justify-center transition-colors z-20 cursor-pointer">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <button onClick={handleNext} className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 dark:bg-black/20 hover:bg-white/20 border border-white/20 text-white rounded-full items-center justify-center transition-colors z-20 cursor-pointer">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>

        {/* Dots indicators */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {slides.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${activeSlide === idx ? 'w-6 sm:w-8 bg-primary' : 'w-2 bg-white/50'}`}
            />
          ))}
        </div>
      </section>

      {/* Katalog Modul Terhubung PostgreSQL */}
      <section className="mb-12 sm:mb-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
          <div>
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">TERINTEGRASI DASBOR</div>
            <h2 className="text-lg sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">Katalog Edukasi Resmi Desa Kucur</h2>
            <p className="text-slate-500 mt-0.5 font-medium text-[11px] sm:text-xs">Pelajari lebih dalam kearifan pertanian lokal dari modul yang dikelola Perangkat Desa</p>
          </div>
          <div className="flex gap-1.5 sm:gap-2 bg-slate-100 dark:bg-slate-900 p-1 sm:p-1.5 rounded-xl border border-primary/10 w-full sm:w-auto overflow-x-auto">
            {['Semua', 'Kopi', 'Tani', 'Produksi'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-extrabold rounded-lg transition-all shrink-0 cursor-pointer ${
                  activeCategory.toLowerCase() === cat.toLowerCase() 
                    ? 'bg-primary text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredModules.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="material-symbols-outlined text-4xl text-slate-400">school</span>
            <p className="mt-2 text-sm font-bold text-slate-500">Belum ada modul edukasi aktif untuk kategori ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
            {filteredModules.map(mod => (
              <div key={mod.id} className="bg-white dark:bg-slate-900 border border-primary/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm sm:shadow-md flex flex-col hover:border-primary/40 transition-all">
                <div className="h-36 sm:h-48 overflow-hidden relative">
                  <img src={mod.image_url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300'} alt={mod.title} className="w-full h-full object-cover" />
                  <span className="absolute top-3 left-3 bg-primary text-slate-900 text-[9px] sm:text-[10px] font-black px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full uppercase shadow-sm">
                    {mod.sub_info || mod.category || 'EDUKASI'}
                  </span>
                </div>
                <div className="p-4 sm:p-6 flex flex-col flex-grow justify-between space-y-3 sm:space-y-4">
                  <div>
                    <h3 className="text-sm sm:text-lg font-extrabold mb-1.5 text-slate-900 dark:text-white">{mod.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs leading-relaxed line-clamp-3">{mod.description}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedModule(mod)}
                    className="w-full bg-primary/10 hover:bg-primary text-primary hover:text-slate-900 py-2.5 sm:py-3 rounded-xl font-extrabold transition-all text-[11px] sm:text-xs flex items-center justify-center gap-2 mt-auto border border-primary/20 shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm sm:text-base">menu_book</span>
                    <span>Buka Modul Pembelajaran</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal Detail Reader Modul Edukasi */}
      {selectedModule && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-primary/20 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary uppercase">
                  {selectedModule.category || 'KOPI'}
                </span>
                <span className="text-xs font-bold text-slate-400">Modul Terverifikasi</span>
              </div>
              <button onClick={() => setSelectedModule(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <img src={selectedModule.image_url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300'} alt={selectedModule.title} className="w-full h-44 rounded-2xl object-cover" />
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{selectedModule.title}</h3>
              <p className="text-[11px] text-slate-400 font-semibold">{selectedModule.sub_info || 'Materi Edukasi Pertanian Kucur'}</p>
              
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2 max-h-48 overflow-y-auto">
                <p className="whitespace-pre-line">{selectedModule.description}</p>
              </div>
            </div>

            <div className="pt-2">
              <button onClick={() => setSelectedModule(null)} className="w-full py-3 bg-primary text-slate-900 font-extrabold rounded-xl shadow-md text-xs">
                Tutup Modul
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
