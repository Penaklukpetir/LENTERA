import React, { useState, useEffect } from 'react';
import Pagination from './Pagination';
import { API_BASE_URL } from '../lib/api';

const REVIEW_PAGE_SIZE = 6;
const INFO_PAGE_SIZE = 6;

const formatResourceType = (type) => {
  const value = String(type || '').toUpperCase();
  if (value === 'VIDEO') return 'Video';
  if (value === 'PDF') return 'Dokumen';
  return 'Teks';
};

export default function EResourceView() {
  const [reviews, setReviews] = useState([]);
  const [eresources, setEresources] = useState([]);
  const [filterRating, setFilterRating] = useState('ALL');
  const [reviewPage, setReviewPage] = useState(1);
  const [infoPage, setInfoPage] = useState(1);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);

  const [visitorName, setVisitorName] = useState('');
  const [visitedLoc, setVisitedLoc] = useState('Kebun Kopi Kucur');
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    fetchApprovedReviews();
    fetchPublicEResources();
  }, []);

  const fetchApprovedReviews = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews?approved_only=true`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error('Fetch public reviews error:', err);
    }
  };

  const fetchPublicEResources = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/eresources`);
      if (res.ok) {
        const data = await res.json();
        setEresources(data.filter(item => !item.status || item.status === 'AKTIF' || item.status === 'aktif'));
      }
    } catch (err) {
      console.error('Fetch public eresources error:', err);
    }
  };

  const handleAddReviewSubmit = async (e) => {
    e.preventDefault();
    if (!visitorName || !userComment) return;

    try {
      const res = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitor_name: visitorName,
          rating: parseInt(userRating),
          comment: userComment,
          visited_location: visitedLoc
        })
      });

      if (res.ok) {
        setToastMsg('✓ Terima kasih! Ulasan Anda sudah kami terima untuk ditinjau perangkat desa.');
        setShowReviewModal(false);
        setVisitorName('');
        setUserComment('');
        fetchApprovedReviews();
        setTimeout(() => setToastMsg(null), 4000);
      }
    } catch (err) {
      alert('Gagal mengirim ulasan.');
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (filterRating === 'ALL') return true;
    return r.rating === parseInt(filterRating);
  });

  const reviewPageCount = Math.max(1, Math.ceil(filteredReviews.length / REVIEW_PAGE_SIZE));
  const safeReviewPage = Math.min(reviewPage, reviewPageCount);
  const pagedReviews = filteredReviews.slice(
    (safeReviewPage - 1) * REVIEW_PAGE_SIZE,
    safeReviewPage * REVIEW_PAGE_SIZE
  );

  const infoPageCount = Math.max(1, Math.ceil(eresources.length / INFO_PAGE_SIZE));
  const safeInfoPage = Math.min(infoPage, infoPageCount);
  const pagedEresources = eresources.slice(
    (safeInfoPage - 1) * INFO_PAGE_SIZE,
    safeInfoPage * INFO_PAGE_SIZE
  );

  const defaultAvatars = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  ];

  return (
    <div className="flex-grow overflow-y-auto max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-28 sm:pb-36 space-y-10 sm:space-y-16 font-display">
      
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-primary/30 font-extrabold text-xs flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-primary text-base">task_alt</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Section 1: Visitor reviews */}
      <section>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">ULASAN PENGUNJUNG</div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">Apa Kata Pengunjung</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs">Ulasan terverifikasi dari pengunjung Desa Kucur</p>
          </div>

          <div className="flex flex-wrap gap-2.5 sm:gap-3 items-center">
            {/* Filter Dropdown */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl shadow-sm text-xs">
              <span className="material-symbols-outlined text-slate-400 text-base">filter_list</span>
              <span className="font-bold text-slate-500 hidden xs:inline">Bintang:</span>
              <select 
                value={filterRating} 
                onChange={e => {
                  setFilterRating(e.target.value);
                  setReviewPage(1);
                }}
                className="bg-transparent font-extrabold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Rating</option>
                <option value="5">⭐⭐⭐⭐⭐ (5 Bintang)</option>
                <option value="4">⭐⭐⭐⭐ (4 Bintang)</option>
                <option value="3">⭐⭐⭐ (3 Bintang)</option>
              </select>
            </div>

            <button 
              onClick={() => setShowReviewModal(true)}
              className="px-4 sm:px-5 py-2.5 bg-primary text-slate-900 rounded-xl font-extrabold flex items-center gap-2 hover:opacity-90 transition-all shadow-md text-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-slate-900 text-base">rate_review</span>
              <span>Berikan Ulasan</span>
            </button>
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="material-symbols-outlined text-4xl text-slate-400">rate_review</span>
            <p className="mt-2 text-sm font-bold text-slate-500">Belum ada ulasan publik terverifikasi untuk filter ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pagedReviews.map((rev, idx) => (
              <div key={rev.id || idx} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:border-primary/30 card-hover transition-all">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                      <img alt={rev.visitor_name} className="w-11 h-11 rounded-full object-cover border border-primary/20" src={defaultAvatars[idx % defaultAvatars.length]} />
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{rev.visitor_name}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Dikunjungi: {rev.visited_location || 'Kebun Kopi'}</p>
                      </div>
                    </div>
                    <div className="flex text-amber-400">
                      {Array.from({ length: rev.rating || 5 }).map((_, rIdx) => (
                        <span key={rIdx} className="material-symbols-outlined text-sm">star</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed italic mb-4">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400 font-semibold">
                  <span>Terverifikasi Desa Kucur</span>
                  <span className="text-emerald-500 font-bold">✓ Tampil Publik</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination
          page={safeReviewPage}
          pageCount={reviewPageCount}
          total={filteredReviews.length}
          pageSize={REVIEW_PAGE_SIZE}
          onPageChange={setReviewPage}
          itemLabel="ulasan"
          className="mt-4 border-t border-slate-100 dark:border-slate-700/60"
        />
      </section>

      {/* Section 2: Informasi & Pengumuman Resmi Desa Kucur (Terhubung langsung ke E-Resource yang diunggah Kades dari Dasbor) */}
      <section className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/80 pb-5">
          <div>
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">INFORMASI DESA</div>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-primary text-2xl">campaign</span>
              <span>Informasi & Pengumuman Resmi Desa Kucur</span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Informasi umum, jadwal kegiatan, dan publikasi resmi dari Perangkat Desa Kucur</p>
          </div>
          <span className="px-3.5 py-1.5 bg-primary/10 text-primary text-xs font-extrabold rounded-xl border border-primary/20 shrink-0 self-start sm:self-auto">
            {eresources.length} Informasi Aktif
          </span>
        </div>

        {eresources.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="material-symbols-outlined text-4xl text-slate-400">info</span>
            <p className="mt-2 text-sm font-bold text-slate-500">Belum ada pengumuman resmi dari perangkat desa.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pagedEresources.map((item) => (
              <div key={item.id} className="p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-4 hover:border-primary/40 card-hover transition-all shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-xl">
                        {item.type === 'VIDEO' ? 'play_circle' : item.type === 'PDF' ? 'picture_as_pdf' : 'description'}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-500/10 text-blue-500 uppercase tracking-wider">
                      {formatResourceType(item.type)}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white line-clamp-2">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 font-semibold mt-1">
                    Dipublikasikan: {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Terbaru'}
                  </p>
                  
                  <p className="text-slate-600 dark:text-slate-300 text-xs mt-3 line-clamp-3 leading-relaxed">
                    {item.content || 'Klik tombol di bawah untuk membaca pengumuman selengkapnya.'}
                  </p>
                </div>

                <button 
                  onClick={() => setSelectedResource(item)}
                  className="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold text-xs hover:bg-primary hover:text-slate-900 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-base">visibility</span>
                  <span>Baca Selengkapnya</span>
                </button>
              </div>
            ))}
          </div>
        )}

        <Pagination
          page={safeInfoPage}
          pageCount={infoPageCount}
          total={eresources.length}
          pageSize={INFO_PAGE_SIZE}
          onPageChange={setInfoPage}
          itemLabel="informasi"
          className="mt-4 border-t border-slate-100 dark:border-slate-700/80"
        />
      </section>

      {/* Modal Form Tambah Ulasan */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 max-w-md w-full rounded-3xl p-6 shadow-2xl border border-primary/20 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Berikan Ulasan Kunjungan</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddReviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">NAMA ANDA</label>
                <input type="text" placeholder="Masukkan nama Anda..." value={visitorName} onChange={e => setVisitorName(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-900 dark:text-white" required />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">LOKASI KUNJUNGAN</label>
                <input type="text" placeholder="Contoh: Kebun Kopi Kucur, Sentra Kerajinan" value={visitedLoc} onChange={e => setVisitedLoc(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-900 dark:text-white" />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">RATING BINTANG</label>
                <select value={userRating} onChange={e => setUserRating(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-extrabold text-slate-900 dark:text-white">
                  <option value={5}>⭐⭐⭐⭐⭐ (5 - Sangat Memuaskan)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 - Bagus)</option>
                  <option value={3}>⭐⭐⭐ (3 - Cukup)</option>
                  <option value={2}>⭐⭐ (2 - Kurang)</option>
                  <option value={1}>⭐ (1 - Buruk)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">ULASAN / KESAN & PESAN</label>
                <textarea rows={3} placeholder="Tuliskan pengalaman kunjungan Anda..." value={userComment} onChange={e => setUserComment(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-900 dark:text-white" required />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-3 bg-primary text-slate-900 font-extrabold rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all text-xs">
                  Kirim Ulasan
                </button>
                <button type="button" onClick={() => setShowReviewModal(false)} className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Reader Informasi E-Resource */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-primary/20 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/10 text-blue-500 uppercase">
                  {formatResourceType(selectedResource.type)}
                </span>
                <span className="text-xs font-bold text-slate-400">Dipublikasikan Desa Kucur</span>
              </div>
              <button onClick={() => setSelectedResource(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{selectedResource.title}</h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                Tanggal: {selectedResource.created_at ? new Date(selectedResource.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Terbaru'}
              </p>
              
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2 max-h-60 overflow-y-auto">
                {selectedResource.content ? (
                  <p className="whitespace-pre-line">{selectedResource.content}</p>
                ) : (
                  <p className="italic text-slate-400">Pengumuman resmi dari pemerintah Desa Kucur mengenai kegiatan agrowisata dan perkebunan kopi.</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button onClick={() => setSelectedResource(null)} className="w-full py-3 bg-primary text-slate-900 font-extrabold rounded-xl shadow-md text-xs">
                Tutup Informasi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
