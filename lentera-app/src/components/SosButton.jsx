import React, { useState } from 'react';

export default function SosButton() {
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosNotes, setSosNotes] = useState('');

  return (
    <>
      {/* FLOATING EMERGENCY SOS BUTTON (SMALL CIRCLE ON MOBILE, FULL PILL ON DESKTOP) */}
      <div className="fixed bottom-24 md:bottom-6 right-4 sm:right-6 z-40">
        <button
          onClick={() => setShowSosModal(true)}
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
                onClick={() => {
                  setShowSosModal(false);
                  setSosNotes('');
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-rose-700/60 hover:bg-rose-700 text-white flex items-center justify-center border-none cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
              <span className="material-symbols-outlined text-4xl mb-1">warning</span>
              <h3 className="text-lg sm:text-xl font-extrabold">Butuh Bantuan Darurat Wisatawan?</h3>
              <p className="text-xs font-medium opacity-90 mt-1">Kirim panggilan darurat langsung ke Satgas Kedaruratan Desa Kucur</p>
            </div>

            <div className="p-5 sm:p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const message = `PANGGILAN KEDARURATAN WISATAWAN LENTERA!\n\nTolong bantu saya!\n• *Lokasi*: Kucur Agrowisata Area\n• *Koordinat*: LAT: -7.9150 / LONG: 112.5230\n• *Keterangan Darurat*: ${sosNotes || 'Tersesat/Membutuhkan Bantuan Medis Lapangan'}`;
                  window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(message)}`, '_blank');
                  setShowSosModal(false);
                  setSosNotes('');
                }}
                className="space-y-4"
              >
                <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-3.5 flex items-center gap-3">
                  <span className="material-symbols-outlined text-rose-400">my_location</span>
                  <div>
                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Kordinat GPS Terdeteksi</p>
                    <p className="font-bold text-white font-mono text-xs">LAT: -7.9150 / LONG: 112.5230</p>
                  </div>
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
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl text-xs text-center transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">send</span>
                    <span>Kirim Laporan Darurat SOS (WhatsApp)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSosModal(false);
                      setSosNotes('');
                    }}
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
