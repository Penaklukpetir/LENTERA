import React, { useState } from 'react';

export default function LoginModal({ setShowLoginModal, handleRoleChange, openAdminModal }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVisitorLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setTimeout(() => {
      handleRoleChange('visitor');
      setLoading(false);
      setShowLoginModal(false);
    }, 400);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setSuccessMsg(`Pendaftaran berhasil! Selamat datang, ${name || 'Wisatawan'}. Silakan masuk.`);
      setIsRegisterMode(false);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
        onClick={() => setShowLoginModal(false)}
      />

      {/* Modal Card - Compact & Mobile Scrollable */}
      <div className="relative bg-white dark:bg-slate-900 border border-primary/20 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl p-4 sm:p-6 z-10">
        
        {/* Close Button */}
        <button 
          onClick={() => setShowLoginModal(false)}
          className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-13 h-13 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-primary font-extrabold text-3xl">tour</span>
          </div>
          <div className="text-[10px] font-extrabold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20 mb-1">
            PORTAL WISATAWAN & PUBLIK
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {isRegisterMode ? 'Daftar Akun Wisatawan' : 'Masuk Akun Wisatawan'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium max-w-xs">
            Jelajahi wisata edukasi agrowisata, ulasan pengunjung, dan pemetaan kebun kopi Desa Kucur.
          </p>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Login / Register Wisatawan */}
        <form onSubmit={isRegisterMode ? handleRegisterSubmit : handleVisitorLogin} className="space-y-3.5">
          {isRegisterMode && (
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Alan Pratama"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-primary"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Email / ID Wisatawan
            </label>
            <input
              type="email"
              required
              placeholder="wisatawan@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Kata Sandi
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-slate-900 font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-lg">sync</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">{isRegisterMode ? 'person_add' : 'explore'}</span>
                <span>{isRegisterMode ? 'Daftar Sekarang' : 'Masuk & Jelajahi Agrowisata'}</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode Register / Login */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setSuccessMsg('');
            }}
            className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
          >
            {isRegisterMode ? 'Sudah punya akun? Masuk di sini' : 'Belum punya akun? Daftar sebagai Wisatawan'}
          </button>
        </div>

        {/* Pilihan Kecil Masuk Laman Admin / Perangkat Desa */}
        <div className="border-t border-slate-100 dark:border-slate-800 mt-4 pt-3.5 text-center">
          <button
            type="button"
            onClick={() => {
              setShowLoginModal(false);
              if (openAdminModal) openAdminModal();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-primary/20 text-[11px] font-extrabold text-slate-700 dark:text-slate-300 hover:text-primary transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm text-primary">admin_panel_settings</span>
            <span>Masuk Laman Admin / Perangkat Desa</span>
          </button>
        </div>

      </div>
    </div>
  );
}
