import React, { useState, useEffect } from 'react';
import Pagination from './Pagination';
import { API_BASE_URL } from '../lib/api';
import { waLink } from '../lib/wa';
const DESTINATION_PAGE_SIZE = 6;

function DestinationCard({ dest, fallbackPhone, onBook }) {
  const images = Array.isArray(dest.images) && dest.images.length > 0
    ? dest.images
    : (dest.img ? [dest.img] : []);
  const [index, setIndex] = useState(0);
  const total = images.length || 1;
  const current = images[index] || dest.img;
  const goPrev = (e) => {
    e.stopPropagation();
    setIndex(i => (i - 1 + total) % total);
  };
  const goNext = (e) => {
    e.stopPropagation();
    setIndex(i => (i + 1) % total);
  };

  const guidePhone = dest.guide_phone || fallbackPhone;
  const guideWaHref = waLink(
    guidePhone,
    `Halo Pemandu Wisata Desa Kucur, saya tertarik mengunjungi ${dest.name}. Boleh dibantu informasi kunjungannya?`
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg card-hover transition-all duration-300 flex flex-col group">
      <div className="relative h-48 overflow-hidden bg-slate-800">
        {current ? (
          <img
            src={current}
            alt={dest.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            <span className="material-symbols-outlined text-3xl">image</span>
          </div>
        )}

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/70 text-white flex items-center justify-center border border-white/20 hover:bg-slate-900 transition-colors cursor-pointer"
              title="Foto sebelumnya"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/70 text-white flex items-center justify-center border border-white/20 hover:bg-slate-900 transition-colors cursor-pointer"
              title="Foto berikutnya"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                  className={`w-1.5 h-1.5 rounded-full border-none cursor-pointer transition-all ${i === index ? 'bg-white w-4' : 'bg-white/50'}`}
                  title={`Foto ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}

        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-extrabold px-3 py-1 rounded-full border border-white/20">
          {dest.tag}
        </div>
        <div className="absolute bottom-3 right-3 bg-emerald-500 text-slate-950 font-black text-[11px] px-3 py-1 rounded-xl shadow-lg">
          {dest.elevation}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
            {dest.name}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {dest.desc}
          </p>

          <div className="pt-2 flex flex-wrap gap-1.5">
            {dest.highlights?.map((hl, idx) => (
              <span key={idx} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                ✓ {hl}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">payments</span>
              {dest.price}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">schedule</span>
              {dest.hours}
            </span>
          </div>

          {guideWaHref ? (
            <a
              href={guideWaHref}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer no-underline"
            >
              <span className="material-symbols-outlined text-base">chat</span>
              <span>Hubungi Pemandu Lahan (WhatsApp)</span>
            </a>
          ) : (
            <div className="w-full bg-slate-200 dark:bg-slate-800 text-slate-500 font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-base">phone_disabled</span>
              <span>Nomor pemandu belum diatur</span>
            </div>
          )}

          <button
            onClick={onBook}
            className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold py-2 rounded-xl text-[11px] transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <span className="material-symbols-outlined text-sm">event_available</span>
            <span>Ajukan Jadwal Kunjungan</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Navigation({ destinations = [] }) {
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [selectedDest, setSelectedDest] = useState(null);
  const [destPage, setDestPage] = useState(1);
  const [guides, setGuides] = useState([]);
  const [publicSettings, setPublicSettings] = useState(null);
  const [selectedGuideId, setSelectedGuideId] = useState('');
  const [bookingState, setBookingState] = useState({ loading: false, error: '', success: '' });
  const [guideForm, setGuideForm] = useState({
    name: '',
    phone: '',
    date: '',
    guests: 2,
    notes: ''
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/guides`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setGuides(data.data || []))
      .catch(() => setGuides([]));

    fetch(`${API_BASE_URL}/settings/public`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setPublicSettings(data?.data || null))
      .catch(() => setPublicSettings(null));
  }, []);

  const handleOpenGuideModal = (dest) => {    setSelectedDest(dest);
    setBookingState({ loading: false, error: '', success: '' });
    setShowGuideModal(true);
  };

  const handleSendGuideRequest = async (e) => {
    e.preventDefault();
    setBookingState({ loading: true, error: '', success: '' });

    const destName = selectedDest ? selectedDest.name : 'Destinasi Wisata Desa Kucur';

    try {
      const res = await fetch(`${API_BASE_URL}/guides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guide_id: selectedGuideId ? Number(selectedGuideId) : null,
          visitor_name: guideForm.name,
          phone: guideForm.phone,
          visit_date: guideForm.date,
          visitors_count: Number(guideForm.guests),
          target_dest: destName,
          notes: guideForm.notes
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setBookingState({ loading: false, error: data.error || 'Gagal menyimpan permintaan pemandu.', success: '' });
        return;
      }

      const message = `Halo Pemandu Wisata Desa Kucur!\n\nSaya ingin memesan pendampingan wisata:\n• *Nama Pemesan*: ${guideForm.name}\n• *Destinasi Target*: ${destName}\n• *Tanggal Kunjungan*: ${guideForm.date}\n• *Jumlah Rombongan*: ${guideForm.guests} Orang\n• *No HP/WA*: ${guideForm.phone}\n• *Catatan Tambahan*: ${guideForm.notes || '-'}\n\nMohon konfirmasi ketersediaan pemandu lokal. Terima kasih!`;

      const chosenGuide = guides.find((guide) => String(guide.id) === String(selectedGuideId));
      const targetPhone = chosenGuide?.phone_number || selectedDest?.guide_phone || publicSettings?.guide_phone;
      const waHref = waLink(targetPhone, message);

      setBookingState({
        loading: false,
        error: '',
        success: waHref
          ? 'Permintaan pemandu sudah kami terima. Lanjutkan konfirmasi via WhatsApp.'
          : 'Permintaan pemandu sudah kami terima. Nomor WhatsApp pemandu belum diatur, silakan hubungi perangkat desa.'
      });
      if (waHref) window.open(waHref, '_blank');
      setGuideForm({ name: '', phone: '', date: '', guests: 2, notes: '' });
      setSelectedGuideId('');
    } catch (err) {
      setBookingState({ loading: false, error: 'Koneksi terputus. Permintaan belum tersimpan.', success: '' });
    }
  };

  const destPageCount = Math.max(1, Math.ceil(destinations.length / DESTINATION_PAGE_SIZE));
  const safeDestPage = Math.min(destPage, destPageCount);
  const pagedDestinations = destinations.slice(
    (safeDestPage - 1) * DESTINATION_PAGE_SIZE,
    safeDestPage * DESTINATION_PAGE_SIZE
  );

  return (
    <div className="flex-grow overflow-y-auto max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-12 font-display space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900/90 via-slate-900 to-teal-950 p-6 sm:p-10 rounded-3xl border border-emerald-500/20 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 font-extrabold text-[11px] uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">explore</span>
            <span>Navigasi & Agrowisata Desa Kucur</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Jelajah Pesona Alam & Kebun Kopi Pegunungan
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Dapatkan pengalaman otentik menjelajahi terasering kebun kopi, greenhouse pasca-panen, dan titik panoramic lereng Gunung Kawi bersama pemandu lokal terverifikasi.
          </p>
        </div>
      </div>

      {/* Grid Destinasi Wisata */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Destinasi Favorit Wisatawan</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pilih titik destinasi dan hubungi pemandu warga lokal langsung via WhatsApp</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pagedDestinations.map((dest) => (
            <DestinationCard
              key={dest.id}
              dest={dest}
              fallbackPhone={publicSettings?.guide_phone}
              onBook={() => handleOpenGuideModal(dest)}
            />
          ))}
        </div>

        <Pagination
          page={safeDestPage}
          pageCount={destPageCount}
          total={destinations.length}
          pageSize={DESTINATION_PAGE_SIZE}
          onPageChange={setDestPage}
          itemLabel="destinasi"
          className="mt-4 border-t border-slate-200 dark:border-slate-800"
        />
      </section>

      {/* REQUEST GUIDE MODAL OVERLAY */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-xl">person_pin</span>
                <h3 className="text-lg font-extrabold text-white">Formulir Pemesanan Pemandu Wisata</h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSendGuideRequest} className="space-y-3 text-xs">
              {bookingState.error && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{bookingState.error}</span>
                </div>
              )}
              {bookingState.success && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>{bookingState.success}</span>
                </div>
              )}

              {guides.length > 0 && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pilih Pemandu (Opsional)</label>
                  <select
                    value={selectedGuideId}
                    onChange={(e) => setSelectedGuideId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-emerald-400 font-semibold"
                  >
                    <option value="">Ditentukan Pokdarwis</option>
                    {guides.map((guide) => (
                      <option key={guide.id} value={guide.id}>
                        {guide.guide_name} • {guide.rating ? `${guide.rating}★` : 'Pemandu Lokal'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Pemesan / Ketua Rombongan</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Andi Pratama"
                  value={guideForm.name}
                  onChange={(e) => setGuideForm({ ...guideForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-emerald-400 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nomor WhatsApp / HP</label>
                  <input
                    type="tel"
                    required
                    placeholder="08123456789"
                    value={guideForm.phone}
                    onChange={(e) => setGuideForm({ ...guideForm, phone: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-emerald-400 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal Kunjungan</label>
                  <input
                    type="date"
                    required
                    value={guideForm.date}
                    onChange={(e) => setGuideForm({ ...guideForm, date: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-emerald-400 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jumlah Rombongan (Orang)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={guideForm.guests}
                  onChange={(e) => setGuideForm({ ...guideForm, guests: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-emerald-400 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows="2"
                  placeholder="Kebutuhan khusus, preferensi titik kumpul, dll..."
                  value={guideForm.notes}
                  onChange={(e) => setGuideForm({ ...guideForm, notes: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-emerald-400 font-semibold resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={bookingState.loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 rounded-xl font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all cursor-pointer mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {bookingState.loading ? (
                  <span className="material-symbols-outlined animate-spin text-base">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-base">send</span>
                )}
                <span>Kirim Permintaan Pemandu</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}