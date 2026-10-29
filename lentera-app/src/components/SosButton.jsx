import React, { useState } from 'react';
import { API_BASE_URL } from '../lib/api';

export default function SosButton() {
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosNotes, setSosNotes] = useState('');
  const [coords, setCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle'); // idle | loading | ready | error
  const [geoError, setGeoError] = useState('');
  const [submitState, setSubmitState] = useState({ loading: false, error: '', success: '' });

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      setGeoError('Perangkat ini tidak mendukung layanan lokasi GPS.');
      return;
    }

    setGeoStatus('loading');
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy)
        });
        setGeoStatus('ready');
      },
      (error) => {
        setGeoStatus('error');
        setGeoError(
          error.code === error.PERMISSION_DENIED
            ? 'Izin lokasi ditolak. Aktifkan GPS agar sinyal SOS dapat dikirim.'
            : 'Lokasi GPS tidak dapat dibaca. Coba lagi di area terbuka.'
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const openModal = () => {
    setSubmitState({ loading: false, error: '', success: '' });
    setShowSosModal(true);
    requestLocation();
  };

  const closeModal = () => {
    setShowSosModal(false);
    setSosNotes('');
    setSubmitState({ loading: false, error: '', success: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coords) {
      setSubmitState({ loading: false, error: 'Koordinat GPS belum tersedia. Aktifkan izin lokasi terlebih dahulu.', success: '' });
      return;
    }

    setSubmitState({ loading: true, error: '', success: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: coords.lat,
          longitude: coords.lng,
          notes: sosNotes
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitState({ loading: false, error: data.error || 'Gagal mengirim sinyal SOS.', success: '' });
        return;
      }

      const message = `PANGGILAN KEDARURATAN WISATAWAN LENTERA!\n\nTolong bantu saya!\n• *Lokasi*: Kucur Agrowisata Area\n• *Koordinat*: LAT: ${coords.lat.toFixed(6)} / LONG: ${coords.lng.toFixed(6)} (akurasi ±${coords.accuracy} m)\n• *Keterangan Darurat*: ${sosNotes || 'Tersesat/Membutuhkan Bantuan Medis Lapangan'}`;

      setSubmitState({
        loading: false,
        error: '',
        success: 'Sinyal SOS tercatat di sistem. Petugas darurat akan menerima laporan ini.'
      });
      window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(message)}`, '_blank');
    } catch (err) {
      setSubmitState({ loading: false, error: 'Koneksi terputus. Sinyal SOS belum terkirim.', success: '' });
    }
  };

  return (
    <>
      {/* FLOATING EMERGENCY SOS BUTTON — locked above the mobile dock */}
      <div className="fixed z-40 right-4 sm:right-6 bottom-20 md:bottom-6">
        <button
          onClick={openModal}
          className="bg-rose-600 hover:bg-rose-500 text-white shadow-2xl border-2 border-rose-400 transition-all hover:scale-105 active:scale-95 cursor-pointer animate-pulse
                     w-14 h-14 rounded-full flex items-center justify-center p-0
                     md:w-auto md:h-auto md:py-3.5 md:px-5 md:rounded-full md:flex-row md:gap-3"
          title="SOS Bantuan Kedaruratan Wisatawan"
        >
          {/* Mobile View: Icon + SOS text inside circle */}
          <div className="md:hidden flex flex-col items-center justify-center -space-y-0.5 pointer-events-none">
            <span className="material-symbols-outlined text-lg leading-none">warning</span>
            <span className="text-[10px] font-black tracking-widest leading-none">SOS</span>
          </div>

          {/* Desktop View: Full Pill layout */}
          <div className="hidden md:flex items-center justify-center bg-white rounded-full text-rose-600 font-bold w-8 h-8 shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-lg">warning</span>
          </div>
          <div className="hidden md:block text-left">
            <div className="text-[9px] font-extrabold uppercase tracking-widest text-rose-200">KEDARURATAN</div>
            <div className="text-xs font-black leading-tight">SOS Bantuan Wisatawan</div>
          </div>
        </button>
      </div>

      {/* SOS EMERGENCY MODAL OVERLAY */}
      {showSosModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl overflow-hidden shadow-2xl text-slate-100">
            <div className="bg-rose-600 p-5 sm:p-6 text-center text-white relative">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-rose-700/60 hover:bg-rose-700 text-white flex items-center justify-center border-none cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
              <span className="material-symbols-outlined text-4xl mb-1">warning</span>
              <h3 className="text-lg sm:text-xl font-extrabold">Butuh Bantuan Darurat Wisatawan?</h3>
              <p className="text-xs font-medium opacity-90 mt-1">Kirim panggilan darurat langsung ke Satgas Kedaruratan Desa Kucur</p>
            </div>

            <div className="p-5 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {submitState.error && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">error</span>
                    <span>{submitState.error}</span>
                  </div>
                )}
                {submitState.success && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span>{submitState.success}</span>
                  </div>
                )}

                <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-3.5 flex items-center gap-3">
                  <span className={`material-symbols-outlined ${geoStatus === 'ready' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {geoStatus === 'loading' ? 'location_searching' : geoStatus === 'ready' ? 'my_location' : 'location_off'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Lokasi Perangkat</p>
                    {geoStatus === 'ready' && coords ? (
                      <p className="font-bold text-white font-mono text-xs">
                        LAT: {coords.lat.toFixed(6)} / LONG: {coords.lng.toFixed(6)}
                        <span className="block text-[10px] text-emerald-300 font-sans font-semibold mt-0.5">Akurasi ±{coords.accuracy} m</span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-300 font-semibold">
                        {geoStatus === 'loading' ? 'Mendeteksi lokasi Anda...' : geoError || 'Lokasi belum tersedia.'}
                      </p>
                    )}
                  </div>
                  {geoStatus !== 'ready' && (
                    <button
                      type="button"
                      onClick={requestLocation}
                      disabled={geoStatus === 'loading'}
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold text-[10px] shrink-0 disabled:opacity-60"
                    >
                      {geoStatus === 'loading' ? '...' : 'Coba Lagi'}
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Keterangan Situasi Darurat (Opsional)</label>
                  <textarea
                    value={sosNotes}
                    onChange={(e) => setSosNotes(e.target.value)}
                    rows="2"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white outline-none focus:border-rose-500 resize-none"
                    placeholder="Contoh: Tersesat di lereng tinggi, ban bocor, butuh P3K..."
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={submitState.loading || geoStatus !== 'ready'}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl text-xs text-center transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitState.loading ? (
                      <span className="material-symbols-outlined animate-spin text-base">sync</span>
                    ) : (
                      <span className="material-symbols-outlined text-base">send</span>
                    )}
                    <span>Kirim Laporan Darurat SOS</span>
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-full py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs text-center border border-slate-700 cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
