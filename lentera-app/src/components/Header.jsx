import React, { useState } from 'react';
import WeatherWidget from './WeatherWidget';

const NAV_TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'location', label: 'Location', icon: 'map' },
  { id: 'education', label: 'Education', icon: 'school' },
  { id: 'navigation', label: 'Navigation', icon: 'explore' },
  { id: 'eresource', label: 'E-Resource', icon: 'library_books' },
  { id: 'sponsor', label: 'Sponsor', icon: 'handshake' },
  { id: 'profile', label: 'Profil', icon: 'person' },
];

export default function Header({
  activeView,
  setActiveView,
  role,
  handleLogout,
  setShowLoginModal,
  setShowAdminLoginModal,
  theme,
  toggleTheme
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (id) => {
    setActiveView(id);
    setMenuOpen(false);
  };

  const visibleNavTabs = NAV_TABS;

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-primary/10 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-12 sm:h-16 flex items-center justify-between gap-1.5">

          {/* Logo */}
          <div className="flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0" onClick={() => handleNav('home')}>
            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-slate-900 text-base sm:text-xl font-extrabold">lightbulb</span>
            </div>
            <span className="text-sm sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              LENTERA
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
            {visibleNavTabs.map((tab) => {
              const isActive = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleNav(tab.id)}
                  className={`text-sm font-semibold transition-all relative py-2 ${isActive
                      ? 'text-primary font-bold after:content-[""] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-primary'
                      : 'text-slate-600 dark:text-slate-300 hover:text-primary'
                    }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Auth Buttons / User Profile Badge (Desktop only — mobile uses drawer) */}
            {role === 'visitor' ? (
              <div className="hidden lg:flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-primary hover:bg-primary/90 text-slate-900 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-sm flex items-center gap-1 sm:gap-1.5 transition-all transform hover:scale-[1.02] shrink-0"
                >
                  <span className="material-symbols-outlined text-sm font-bold">tour</span>
                  <span className="text-[11px] sm:text-xs">Masuk Wisatawan</span>
                </button>

                <button
                  onClick={() => setShowAdminLoginModal(true)}
                  className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white border border-primary/30 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-extrabold shadow-sm flex items-center gap-1 transition-all transform hover:scale-[1.02] shrink-0"
                  title="Portal Login Khusus Kades & Admin Desa"
                >
                  <span className="material-symbols-outlined text-sm text-primary">admin_panel_settings</span>
                  <span className="hidden sm:inline text-xs">Portal Admin</span>
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => handleNav('dashboard')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-full border border-primary/30 text-xs font-extrabold flex items-center gap-1 sm:gap-1.5 transition-all shrink-0 ${
                    activeView === 'dashboard'
                      ? 'bg-primary text-slate-900 shadow-md'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">space_dashboard</span>
                  <span className="hidden sm:inline">Dasbor {role === 'village' ? 'Kades' : 'Admin'}</span>
                </button>

                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-primary/20 text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0">
                  <span className="material-symbols-outlined text-sm text-primary">
                    {role === 'village' ? 'shield_person' : 'admin_panel_settings'}
                  </span>
                  <span className="hidden sm:inline capitalize">{role === 'village' ? 'Kades' : 'Admin'}</span>
                  <button
                    onClick={handleLogout}
                    className="ml-0.5 p-0.5 rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-500 transition-colors"
                    title="Keluar (Logout)"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                  </button>
                </div>
              </div>
            )}

            {/* Live Weather Widget Desa Kucur (desktop only) */}
            <div className="hidden lg:block">
              <WeatherWidget />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full hover:bg-primary/10 transition-colors text-slate-600 dark:text-slate-300"
              title="Ganti Tema"
            >
              <span className="material-symbols-outlined text-lg">
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>

            {/* Hamburger — mobile only */}
            <button
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-xl">
                {menuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex" onClick={() => setMenuOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Slide-in Panel */}
          <div
            className="relative ml-auto w-72 max-w-[85vw] h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-lg">lightbulb</span>
                </div>
                <span className="text-lg font-extrabold text-slate-900 dark:text-white">LENTERA</span>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <span className="material-symbols-outlined text-slate-500">close</span>
              </button>
            </div>

            {/* Auth Section in Mobile Drawer */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
              {role === 'visitor' ? (
                <>
                  <button
                    onClick={() => { setMenuOpen(false); setShowLoginModal(true); }}
                    className="w-full bg-primary text-slate-900 py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">tour</span>
                    <span>Masuk Wisatawan</span>
                  </button>

                  <button
                    onClick={() => { setMenuOpen(false); setShowAdminLoginModal(true); }}
                    className="w-full bg-slate-900 text-white border border-primary/30 py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm text-primary">admin_panel_settings</span>
                    <span>Portal Admin / Kades</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-primary/10">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-primary">
                      {role === 'village' ? 'shield_person' : 'admin_panel_settings'}
                    </span>
                    <div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white capitalize">
                        {role === 'village' ? 'Kepala Desa' : 'Admin Sistem'}
                      </div>
                      <div className="text-[10px] text-slate-400">Terautentikasi</div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); handleLogout(); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Nav Items */}
            <div className="flex-1 overflow-y-auto py-3 px-3">
              {visibleNavTabs.map((tab) => {
                const isActive = activeView === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleNav(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-sm font-semibold transition-all text-left ${isActive
                        ? 'bg-primary/15 text-primary'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    <span className={`material-symbols-outlined text-lg ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                      {tab.icon}
                    </span>
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-lg text-slate-400">
                  {theme === 'light' ? 'dark_mode' : 'light_mode'}
                </span>
                Mode {theme === 'light' ? 'Gelap' : 'Terang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
