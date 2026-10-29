import React from 'react';

export default function BottomNav({ activeView, setActiveView, role }) {
  // Admin dashboard is a full-screen workspace: never show the public dock there.
  if (activeView === 'dashboard') return null;

  const navItems = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'location', label: 'Peta', icon: 'map' },
    { id: 'education', label: 'Edukasi', icon: 'school' },
    { id: 'eresource', label: 'E-Resource', icon: 'library_books' },
    { id: 'sponsor', label: 'Sponsor', icon: 'handshake' },
  ];

  return (
    <nav
      className="lg:hidden fixed left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-xl border border-primary/30 rounded-2xl shadow-2xl px-3 py-2 text-white animate-in slide-in-from-bottom duration-200"
      style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex items-center justify-around">
        {navItems.slice(0, 5).map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                isActive
                  ? 'text-primary font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-semibold mt-0.5 leading-tight">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary absolute -bottom-1"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
