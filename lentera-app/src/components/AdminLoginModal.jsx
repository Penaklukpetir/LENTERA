import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function AdminLoginModal({ setShowAdminLoginModal, onAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Kredensial tidak terverifikasi.');
        return;
      }

      if (data.user?.role !== 'admin' && data.user?.role !== 'village') {
        setErrorMsg('Akun ini tidak memiliki akses ke dasbor perangkat desa.');
        return;
      }

      onAuthenticated({ token: data.token, user: data.user });
      setShowAdminLoginModal(false);
    } catch (err) {
      setErrorMsg('Gagal menghubungi server otentikasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" 
        onClick={() => setShowAdminLoginModal(false)}
      />

      {/* Modal Card - Compact & Mobile Scrollable */}
      <div className="relative bg-slate-900 border border-primary/30 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl p-4 sm:p-6 z-10 text-white animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button 
          onClick={() => setShowAdminLoginModal(false)}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Security Badge Header */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-primary via-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 mb-2 border border-white/20">
            <span className="material-symbols-outlined text-slate-950 font-black text-2xl">admin_panel_settings</span>
          </div>
          <div className="text-[9px] font-extrabold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 mb-1">
            PORTAL OTENTIKASI RESMI
          </div>
          <h2 className="text-lg font-extrabold text-white">Dasbor Perangkat Desa</h2>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium max-w-xs">
            Akses terbatas khusus Kepala Desa & Pengelola Sistem LENTERA.
          </p>
        </div>

        {/* Username shortcut (does not bypass authentication) */}
        <div className="space-y-2 mb-4">
          <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
            ISI CEPAT USERNAME:
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setUsername('kades')}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                <span className="material-symbols-outlined text-lg">shield_person</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-extrabold text-white truncate">Kepala Desa</h4>
                <p className="text-[9px] text-emerald-400 font-semibold truncate">Username: kades</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setUsername('admin')}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 hover:border-sky-500/40 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0">
                <span className="material-symbols-outlined text-lg">manage_accounts</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-extrabold text-white truncate">Admin GIS</h4>
                <p className="text-[9px] text-sky-400 font-semibold truncate">Username: admin</p>
              </div>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-wider">
            <span className="bg-slate-900 px-2 text-slate-500">Kredensial Pegawai</span>
          </div>
        </div>

        {/* Form Login Admin */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          {errorMsg && (
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
              Username
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              placeholder="Username akun perangkat desa"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-primary placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
              Kata Sandi Otorisasi
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-primary placeholder:text-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-primary to-emerald-400 hover:from-primary/90 hover:to-emerald-400/90 text-slate-950 font-extrabold rounded-lg text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 mt-1 disabled:opacity-60"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-base">sync</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">key</span>
                <span>Masuk Dasbor Perangkat Desa</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
