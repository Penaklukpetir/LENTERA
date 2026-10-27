import React, { useState, useEffect } from 'react';

export default function AdminPlotForm({
  newPlotCoords,
  setNewPlotCoords,
  showAddForm,
  setShowAddForm,
  formFarmer,
  setFormFarmer,
  formType,
  setFormType,
  formCount,
  setFormCount,
  formElevation,
  setFormElevation,
  formArea,
  setFormArea,
  formDesc,
  setFormDesc,
  handleAddPlot
}) {
  const [pasteInput, setPasteInput] = useState('');
  const [parseNotice, setParseNotice] = useState('');

  // Default to Desa Kucur center if no coordinates selected yet
  useEffect(() => {
    if (showAddForm && !newPlotCoords) {
      setNewPlotCoords({ lat: -7.9152, lng: 112.5201 });
    }
  }, [showAddForm, newPlotCoords, setNewPlotCoords]);

  if (showAddForm === false) return null;

  // Auto-parse coordinates from "lat, lng" string (Google Maps format)
  const handleParseCoords = (text) => {
    if (!text) return;
    const clean = text.replace(/[°[\]()]/g, ' ').trim();
    const parts = clean.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setNewPlotCoords({ lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) });
        setParseNotice(`✓ Koordinat valid: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setTimeout(() => setParseNotice(''), 3000);
      }
    }
  };

  const handleDeviceGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setNewPlotCoords({
            lat: parseFloat(pos.coords.latitude.toFixed(6)),
            lng: parseFloat(pos.coords.longitude.toFixed(6))
          });
          setParseNotice('✓ GPS lokasi saat ini terdeteksi');
          setTimeout(() => setParseNotice(''), 3000);
        },
        () => {
          alert('Tidak dapat mendeteksi GPS. Anda tetap bisa mengetik angka koordinat secara manual di bawah.');
        }
      );
    }
  };

  return (
    <div 
      className="admin-form-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3.5 max-h-[88vh] overflow-y-auto" 
      style={{ zIndex: 1000, width: '380px', maxWidth: 'calc(100vw - 32px)', boxSizing: 'border-box' }}
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">add_location_alt</span>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white m-0">Registrasi Plot Kopi Baru</h3>
            <span className="text-[10px] text-slate-400 font-medium">Bisa ketik koordinat manual / klik peta</span>
          </div>
        </div>
        <button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (setShowAddForm) setShowAddForm(false);
            if (setNewPlotCoords) setNewPlotCoords(null);
          }} 
          className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-100 hover:bg-rose-500/20 hover:text-rose-600 dark:bg-slate-800 text-slate-400 dark:hover:text-rose-400 transition-all cursor-pointer border-none shadow-sm"
          title="Tutup Form"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>

      <form onSubmit={(e) => {
        if (!newPlotCoords || newPlotCoords.lat === '' || newPlotCoords.lng === '' || isNaN(Number(newPlotCoords.lat)) || isNaN(Number(newPlotCoords.lng))) {
          e.preventDefault();
          alert('Mohon masukkan titik koordinat Latitude dan Longitude yang valid terlebih dahulu.');
          return;
        }
        handleAddPlot(e);
      }} className="space-y-3 text-xs">
        
        {/* SECTION: INPUT MANUAL TITIK KOORDINAT */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-primary/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">pin_drop</span>
              Titik Koordinat (Input Manual)
            </span>
          </div>

          <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
            💡 <strong>Tidak perlu ke lokasi fisik.</strong> Masukkan angka koordinat dari Google Maps, berkas sertifikat, atau catatan arsip.
          </div>

          {/* Quick Paste Input */}
          <div>
            <input 
              type="text" 
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-mono text-slate-900 dark:text-white outline-none focus:border-primary box-border" 
              placeholder="Tempel format Google Maps (misal: -7.9152, 112.5201)" 
              value={pasteInput}
              onChange={(e) => {
                setPasteInput(e.target.value);
                handleParseCoords(e.target.value);
              }}
            />
            {parseNotice && (
              <span className="text-[10px] text-emerald-400 font-bold block mt-1">{parseNotice}</span>
            )}
          </div>

          {/* Latitude & Longitude Inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Latitude (Lintang)</label>
              <input 
                type="number" 
                step="any"
                required 
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-primary box-border" 
                placeholder="-7.915200" 
                value={newPlotCoords?.lat ?? ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setNewPlotCoords({
                    lat: isNaN(val) ? '' : val,
                    lng: newPlotCoords?.lng ?? 112.5201
                  });
                }}
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Longitude (Bujur)</label>
              <input 
                type="number" 
                step="any"
                required 
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-primary box-border" 
                placeholder="112.520100" 
                value={newPlotCoords?.lng ?? ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setNewPlotCoords({
                    lat: newPlotCoords?.lat ?? -7.9152,
                    lng: isNaN(val) ? '' : val
                  });
                }}
              />
            </div>
          </div>

          {/* Quick Helper Actions */}
          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
            <button
              type="button"
              onClick={() => setNewPlotCoords({ lat: -7.9152, lng: 112.5201 })}
              className="text-[10px] px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-primary font-semibold border-none cursor-pointer"
            >
              📍 Titik Pusat Desa Kucur
            </button>
            <button
              type="button"
              onClick={handleDeviceGPS}
              className="text-[10px] px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-sky-400 font-semibold border-none cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[12px]">my_location</span>
              GPS Saat Ini (Jika di kebun)
            </button>
          </div>
        </div>

        {/* SECTION: DATA KEBUN & PETANI */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Pemilik Lahan</label>
          <input 
            type="text" 
            required 
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white outline-none focus:border-primary box-border" 
            placeholder="Contoh: Pak Slamet (Poktan 2)" 
            value={formFarmer}
            onChange={(e) => setFormFarmer(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Varietas Kopi</label>
            <select 
              className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white outline-none focus:border-primary box-border"
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
            >
              <option value="Robusta">Robusta</option>
              <option value="Arabica">Arabica</option>
              <option value="Liberica">Liberica</option>
              <option value="Excelsa">Excelsa</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Luas Lahan (m²)</label>
            <input 
              type="number" 
              required 
              min="1"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white outline-none focus:border-primary box-border" 
              placeholder="1000" 
              value={formArea}
              onChange={(e) => setFormArea(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div style={{ minWidth: 0 }}>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jumlah Pohon</label>
            <input 
              type="number" 
              required 
              min="0"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white outline-none focus:border-primary box-border" 
              value={formCount}
              onChange={(e) => setFormCount(e.target.value)}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Elevasi (MDPL)</label>
            <input 
              type="number" 
              required 
              min="0"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white outline-none focus:border-primary box-border" 
              value={formElevation}
              onChange={(e) => setFormElevation(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Keterangan Lahan</label>
          <textarea 
            rows="2" 
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white outline-none focus:border-primary box-border resize-none" 
            placeholder="Deskripsi kondisi lahan, batas parit, dll..."
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-extrabold py-2.5 rounded-xl shadow-md shadow-primary/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">save</span>
          <span>Simpan Data & Koordinat Spasial</span>
        </button>
      </form>
    </div>
  );
}


