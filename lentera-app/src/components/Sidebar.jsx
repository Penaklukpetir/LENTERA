import React, { useState } from 'react';

export default function Sidebar({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filteredPlots,
  selectedPlot,
  setSelectedPlot,
  role,
  onOpenAddPlot,
  collapsible = false,
  collapsed = false,
  onToggleCollapse
}) {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const sidebarContent = (
    <>
      {/* Title */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-1 gap-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">Aset Desa</h2>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] bg-primary/20 text-primary px-2.5 py-0.5 rounded-full font-extrabold">
              {filteredPlots.length} Plot Spasial
            </span>
            {collapsible && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden md:flex w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary items-center justify-center border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                title="Lipat Panel Aset Desa (Perlebar Peta)"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-3 sm:mb-4">Jelajahi titik wisata dan edukasi</p>

        {/* Admin Quick Action Button: Input Plot Coordinates Manual */}
        {(role === 'admin' || role === 'village') && onOpenAddPlot && (
          <button
            type="button"
            onClick={onOpenAddPlot}
            className="w-full mb-3 py-2 px-3 bg-gradient-to-r from-primary to-emerald-400 hover:from-primary/90 text-slate-950 font-extrabold rounded-xl text-xs shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none"
            title="Daftarkan plot lahan dengan mengetik titik koordinat tanpa perlu ke lokasi fisik"
          >
            <span className="material-symbols-outlined text-base">add_location_alt</span>
            <span>+ Input Plot (Ketik Koordinat)</span>
          </button>
        )}
        
        {/* Search */}
        <div className="relative mb-4 sm:mb-6">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
          <input 
            type="text" 
            placeholder="Cari lahan, petani..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-primary focus:border-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories (Aset Desa Layout) */}
        <div className="space-y-1.5 sm:space-y-2">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">Kategori Lahan</span>
          
          <div className="grid grid-cols-3 md:grid-cols-1 gap-1 sm:gap-2">
            <button 
              onClick={() => setFilterType('All')}
              className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all border ${
                filterType === 'All' 
                  ? 'bg-primary/10 border-primary/30 text-primary font-bold' 
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="material-symbols-outlined text-sm">explore</span>
                <span className="text-[11px] sm:text-xs">Semua Lahan</span>
              </div>
            </button>

            <button 
              onClick={() => setFilterType('Arabica')}
              className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all border ${
                filterType === 'Arabica' 
                  ? 'bg-primary/10 border-primary/30 text-primary font-bold' 
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="material-symbols-outlined text-sm text-emerald-500">eco</span>
                <span className="text-[11px] sm:text-xs">Arabika</span>
              </div>
            </button>

            <button 
              onClick={() => setFilterType('Robusta')}
              className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all border ${
                filterType === 'Robusta' 
                  ? 'bg-primary/10 border-primary/30 text-primary font-bold' 
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="material-symbols-outlined text-sm text-amber-500">eco</span>
                <span className="text-[11px] sm:text-xs">Robusta</span>
              </div>
            </button>
          </div>
        </div>

      </div>

      {/* Plot List Grid */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 space-y-3 max-h-[40vh] md:max-h-none">
        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Daftar Titik Lahan Tani</span>
        
        <div className="space-y-2.5">
          {filteredPlots.map(plot => (
            <div 
              key={plot.id}
              onClick={() => {
                setSelectedPlot(plot);
                setMobileExpanded(false);
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer card-hover ${
                selectedPlot?.id === plot.id
                  ? 'bg-white border-primary shadow-md dark:bg-slate-900' 
                  : 'bg-slate-50/50 border-slate-200/60 dark:border-slate-800 dark:bg-slate-900/30 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-xs truncate max-w-[140px] text-slate-900 dark:text-white">
                  {plot.farmer_name}
                </h4>
                <span className={`inline-block px-1.5 py-0.5 text-[9px] font-extrabold rounded uppercase ${
                  plot.coffee_type === 'Arabica' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  {plot.coffee_type}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                Elevasi: {plot.elevation} MDPL • {plot.tree_count} Pohon
              </p>
            </div>
          ))}
          {filteredPlots.length === 0 && (
            <p className="text-center text-slate-400 text-xs mt-6 font-medium">Tidak ada plot yang cocok.</p>
          )}
        </div>
      </div>

      {/* Profile Admin Panel Footer */}
      <div className="p-4 sm:p-6 border-t border-primary/10 mt-auto bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <img 
            alt="Foto profil" 
            className="w-9 h-9 rounded-full object-cover border-2 border-primary" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB49XTHhLyqcCds65O1-qfMC3dgSqfrMuPTo45zTqDILI7DQdb0R45_TLZP-4hzbR2LZI1OOc9kStcPMhCkkMqrUmK8c9mfhYOO8yx8iSdCBMGYt25vfCryIgcjNyd0snRzl1NJmbG_X3qtY4a0Bnc2DN93otROr8UNC4jcm4FjmmMjM9vPM3fVavWINbS8oe1McOkWsX2bw5QBglms3SqNd-TVDkN3aNm7rOodzU1vZ9eaWHNINWxU1YXyuusd-y3JGRikd11bq3s"
          />
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {role === 'admin' ? 'Ahmad Fauzi' : role === 'village' ? 'Budi Santoso' : 'Guest Visitor'}
            </p>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">
              {role === 'admin' ? 'PM LENTERA' : role === 'village' ? 'Kepala Desa Kucur' : 'Wisatawan Desa'}
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar Layout (collapsible in admin GIS workspace) */}
      <aside className={`hidden md:flex ${collapsed ? 'w-16' : 'w-72 lg:w-80'} bg-white dark:bg-background-dark border-r border-primary/10 z-40 flex-col shadow-xl shrink-0 transition-all duration-300 overflow-hidden`}>
        {collapsed ? (
          <div className="w-full flex flex-col items-center py-4 gap-3">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Perlebar Panel Aset Desa"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
            <div className="h-px w-8 bg-primary/15" />
            <span
              className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 select-none"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              Aset Desa
            </span>
            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-extrabold">
              {filteredPlots.length}
            </span>
          </div>
        ) : (
          sidebarContent
        )}
      </aside>

      {/* Mobile Slide-Up Bottom Sheet Trigger Pill (hidden while sheet is open) */}
      {!mobileExpanded && (
        <div className="md:hidden fixed bottom-24 left-3 z-[45]">
          <button
            onClick={() => setMobileExpanded(true)}
            className="flex items-center gap-2 bg-slate-900/95 text-white px-3.5 py-2 rounded-full border border-primary/40 shadow-2xl backdrop-blur-md text-xs font-black hover:border-primary transition-all"
          >
            <span className="material-symbols-outlined text-primary text-base">format_list_bulleted</span>
            <span>Aset Desa ({filteredPlots.length})</span>
            <span className="material-symbols-outlined text-sm">expand_less</span>
          </button>
        </div>
      )}

      {/* Mobile Slide-Up Bottom Sheet Modal */}
      {mobileExpanded && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end" onClick={() => setMobileExpanded(false)}>
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
          <div 
            className="relative bg-white dark:bg-slate-900 rounded-t-3xl border-t border-primary/30 shadow-2xl max-h-[75vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle Top Bar */}
            <div className="w-full py-2.5 flex justify-center cursor-pointer" onClick={() => setMobileExpanded(false)}>
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
            </div>
            
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
