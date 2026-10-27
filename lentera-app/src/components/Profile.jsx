import React, { useState } from 'react';

export default function Profile() {
  const [activeSubTab, setActiveSubTab] = useState('team'); // team, smartics

  const team = [
    {
      name: 'Ahmad Fauzi',
      role: 'Project Manager',
      img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400',
      desc: 'Memastikan setiap visi LENTERA terwujud dengan sempurna.'
    },
    {
      name: 'Siti Aminah',
      role: 'Lead Developer',
      img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
      desc: 'Arsitek di balik sistem LENTERA yang handal dan cepat.'
    },
    {
      name: 'Budi Santoso',
      role: 'UI/UX Designer',
      img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400',
      desc: 'Menghadirkan pengalaman pengguna yang indah dan intuitif.'
    },
    {
      name: 'Dewi Lestari',
      role: 'Content Strategist',
      img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
      desc: 'Menyusun narasi yang kuat untuk mempromosikan desa.'
    }
  ];

  return (
    <div className="flex-grow overflow-y-auto max-w-7xl mx-auto px-6 py-8 space-y-12">
      
      {/* Sub tabs selector */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-primary/10">
          <button 
            onClick={() => setActiveSubTab('team')}
            className={`px-6 py-3 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'team' ? 'bg-primary text-slate-955 shadow' : 'text-slate-500 hover:text-primary'
            }`}
          >
            Profil Tim Developer
          </button>
          <button 
            onClick={() => setActiveSubTab('smartics')}
            className={`px-6 py-3 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'smartics' ? 'bg-primary text-slate-955 shadow' : 'text-slate-500 hover:text-primary'
            }`}
          >
            Draf Jurnal SMARTICS
          </button>
        </div>
      </div>

      {activeSubTab === 'team' && (
        <>
          {/* Hero Section */}
          <section className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold">
              <span className="material-symbols-outlined text-sm">groups</span>
              TIM PENGEMBANG
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Di Balik Inovasi <span className="text-primary">LENTERA</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Kami adalah Software House yang berdedikasi untuk menciptakan solusi digital yang berdampak positif bagi masyarakat, khususnya dalam memajukan potensi pariwisata dan edukasi di pedesaan.
            </p>
          </section>

          {/* Members Grid */}
          <section className="py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, idx) => (
                <div key={idx} className="group">
                  <div className="relative aspect-square rounded-3xl overflow-hidden mb-6 border-4 border-white dark:border-slate-800 shadow-xl transition-all group-hover:-translate-y-2">
                    <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{member.name}</h3>
                  <p className="text-primary font-bold text-sm uppercase tracking-wider">{member.role}</p>
                  <p className="text-slate-500 text-sm mt-2">{member.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Vision Section */}
          <section className="py-16 bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-8 md:p-12 border border-primary/5">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1">
                <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">Visi Kami untuk Masa Depan Desa</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined">trending_up</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white">Pertumbuhan Ekonomi</h4>
                      <p className="text-slate-500 text-sm">Membantu kelompok tani desa menjangkau investor B2B secara lebih transparan melalui pemetaan spasial.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                      <span className="material-symbols-outlined">school</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white">Edukasi Berkelanjutan</h4>
                      <p className="text-slate-500 text-sm">Menyediakan akses informasi dan modul praktis budidaya bagi masyarakat dan pengunjung.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 relative">
                <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800" alt="Office" className="w-full aspect-square object-cover" />
                  <div className="absolute inset-0 bg-primary/20 mix-blend-overlay"></div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {activeSubTab === 'smartics' && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-primary/10 shadow-xl space-y-12 text-slate-800 dark:text-slate-300">
          
          {/* Footnote simulator banner */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
            <h2 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-2">SMARTICS Journal Formatting</h2>
            <p className="text-xs text-slate-500 italic">
              *Footnote (First Page No-Number): This research was supported and funded in part by Universitas Ma Chung academic development fund under PKL lentera grant #2026.
            </p>
          </div>

          {/* Acknowledgment Section */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-955 dark:text-white">ACKNOWLEDGMENT</h2>
            <p className="text-xs leading-relaxed">
              The authors would like to express their sincere gratitude to the Government of Kucur Village, Dau District, Malang Regency, and the leaders of the local Coffee Farmer Groups (*Kelompok Tani*) for their collaboration and support during the requirements elicitation process. Special appreciation is also extended to the Department of Information Systems at Universitas Ma Chung for providing academic guidance and resources that facilitated the successful completion of this software engineering research.
            </p>
          </section>

          {/* References Section */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-955 dark:text-white">REFERENCES</h2>
            <ol className="list-none space-y-2 text-[11px] text-slate-500 font-mono">
              <li>[1] R. S. Warsilah, “Digitalisasi Desa Wisata dan Tantangan Kesenjangan Infrastruktur di Wilayah Pelosok,” *Jurnal Pembangunan Ekonomi Pedesaan*, vol. 12, no. 2, pp. 110–123, 2022.</li>
              <li>[2] P. A. Burrough and R. A. McDonnell, *Principles of Geographical Information Systems*, Oxford: Oxford University Press, 1998.</li>
              <li>[3] J. Martin, *Rapid Application Development*, New York: Macmillan Publishing Company, 1991.</li>
              <li>[4] *ISO/IEC/IEEE International Standard - Systems and software engineering -- Life cycle processes -- Requirements engineering*, ISO/IEC/IEEE 29148:2018, 2018.</li>
            </ol>
          </section>

          {/* Biographies Section */}
          <section className="space-y-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-955 dark:text-white">BIOGRAPHIES</h2>
            
            {/* Alan Biography with Top-Left photo alignment */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-24 h-32 flex-shrink-0 border-2 border-primary rounded overflow-hidden bg-slate-100 shadow-md">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" 
                  alt="Alan Assidiqqi" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="space-y-4 text-xs leading-relaxed">
                <p>
                  <strong>Alan Assidiqqi Pratama</strong> was born in Malang, Indonesia, on October 12, 2004. He is currently pursuing his Bachelor of Science degree in Information Systems at Universitas Ma Chung, Malang, Indonesia, expected to graduate in 2027. His primary academic focus centers on software engineering and web-based geographic information systems.
                </p>
                <p>
                  He has completed several academic software projects and internship trials in web database development. His research interests include spatial database engineering, Geographic Information Systems (GIS), and software requirements modeling using international standards. He has previously co-authored coursework specifications on rural economy digitization.
                </p>
                <p>
                  Mr. Pratama is a student of the Universitas Ma Chung.
                </p>
              </div>
            </div>

            {/* Advisor Biography */}
            <div className="flex flex-col md:flex-row gap-6 items-start pt-6 border-t border-dashed border-slate-200 dark:border-slate-800">
              <div className="w-24 h-32 flex-shrink-0 border-2 border-slate-300 rounded overflow-hidden bg-slate-100 shadow-md">
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <span className="material-symbols-outlined text-4xl">person</span>
                </div>
              </div>
              <div className="space-y-4 text-xs leading-relaxed">
                <p>
                  <strong>[Advisor Name]</strong> was born in Indonesia. He/She received the Master of Computer Science / Doctor degree in Information Systems from Ma Chung University, Malang, Indonesia, in 2015. He/She is currently a full-time lecturer and researcher at the Department of Information Systems, Faculty of Technology and Design, Universitas Ma Chung, Malang, Indonesia.
                </p>
                <p>
                  He/She has over 8 years of academic lecturing and research experience. His/Her research interests lie in the fields of software engineering, decision support systems, and database management. He/She has published several research papers in national and international peer-reviewed journals.
                </p>
                <p>
                  Dr./Mr./Mrs. [Last Name] is a member of the Indonesian Association for Information Systems (AISINDO). A photograph of the author is placed at the top-left of this biography.
                </p>
              </div>
            </div>

          </section>

        </div>
      )}

    </div>
  );
}
