import React, { useState, useEffect, useRef } from 'react';
import { fetchElevation } from '../lib/elevation';

export default function AdminPlotForm({
  newPlotCoords,
  setNewPlotCoords,
  showAddForm,
  setShowAddForm,
  farmerOptions = [],
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
  formPlantingYear,
  setFormPlantingYear,
  formDesc,
  setFormDesc,
  handleAddPlot
}) {
  const [pasteInput, setPasteInput] = useState('');
  const [parseNotice, setParseNotice] = useState('');
  const [manualFarmer, setManualFarmer] = useState(false);
  const [elevationStatus, setElevationStatus] = useState('idle');
  const elevationEditRef = useRef(0);

  // Reset the farmer picker back to "choose from registry" each time the form is closed
  useEffect(() => {
    if (!showAddForm) setManualFarmer(false);
  }, [showAddForm]);

  // Fill elevation from the map coordinates whenever the pin is clicked, dragged, or typed
  useEffect(() => {
    if (!showAddForm) return;

    const lat = Number(newPlotCoords?.lat);
    const lng = Number(newPlotCoords?.lng);
    const coordsReady = newPlotCoords
      && newPlotCoords.lat !== ''
      && newPlotCoords.lng !== ''
      && Number.isFinite(lat)
      && Number.isFinite(lng)
      && Math.abs(lat) <= 90
      && Math.abs(lng) <= 180;

    if (!coordsReady) {
      setElevationStatus('idle');
      return;
    }

    const controller = new AbortController();
    const editVersion = elevationEditRef.current;
    setElevationStatus('loading');

    const timer = setTimeout(async () => {
      try {
        const value = await fetchElevation(lat, lng, controller.signal);
        if (elevationEditRef.current !== editVersion) return;
        setFormElevation(String(value));
        setElevationStatus('auto');
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (elevationEditRef.current !== editVersion) return;
        setElevationStatus('failed');
      }
    }, 600);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [showAddForm, newPlotCoords, setFormElevation]);

  // Default to Desa Kucur center if no coordinates selected yet
  useEffect(() => {
    if (showAddForm && !newPlotCoords) {
      setNewPlotCoords({ lat: -7.9152, lng: 112.5201 });
    }
  }, [showAddForm, newPlotCoords, setNewPlotCoords]);

  if (!showAddForm) return null;

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

  const coordValid = newPlotCoords
    && newPlotCoords.lat !== ''
    && newPlotCoords.lng !== ''
    && !isNaN(Number(newPlotCoords.lat))
    && !isNaN(Number(newPlotCoords.lng));

  const elevationHint = {
    loading: 'Mendeteksi elevasi dari titik peta…',
    auto: 'Terisi otomatis dari peta — boleh diubah.',
    failed: 'Elevasi tidak terdeteksi — isi manual.',
  }[elevationStatus] || '';

  const elevationHintClass = elevationStatus === 'failed'
    ? 'text-amber-500'
    : elevationStatus === 'auto'
      ? 'text-emerald-500'
      : 'text-slate-400';

  const trimmedFarmer = (formFarmer || '').trim();
  const matchedFarmer = farmerOptions.find(
    (farmer) => (farmer.name || '').trim().toLowerCase() === trimmedFarmer.toLowerCase()
  );
  const useManualFarmer = manualFarmer || farmerOptions.length === 0 || (trimmedFarmer !== '' && !matchedFarmer);

  return (
    <div className="fixed inset-x-3 top-20 bottom-4 z-[70] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 md:static md:inset-auto md:z-auto md:h-[calc(100vh-80px)] md:w-[350px] md:shrink-0 md:rounded-none md:border-y-0 md:border-r-0 md:border-l xl:w-[380px]">
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-slate-100 px-3.5 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-primary text-lg shrink-0">add_location_alt</span>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">Registrasi Plot Kopi Baru</h3>
            <span className="text-[10px] text-slate-400 font-medium block truncate">Klik peta, geser pin, atau tempel koordinat</span>
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
          className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center bg-slate-100 hover:bg-rose-500/20 hover:text-rose-600 dark:bg-slate-800 text-slate-400 dark:hover:text-rose-400 transition-all cursor-pointer border-none shadow-sm"
          title="Tutup Form"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>

      <form
        onSubmit={(e) => {
          if (!coordValid) {
            e.preventDefault();
            alert('Mohon masukkan titik koordinat Latitude dan Longitude yang valid terlebih dahulu.');
            return;
          }
          handleAddPlot(e);
        }}
        className="flex flex-1 min-h-0 flex-col"
      >
        {/* Scrollable fields */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3 space-y-3 text-xs">

          {/* SECTION: INPUT MANUAL TITIK KOORDINAT */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-primary/20 space-y-2">
            <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">pin_drop</span>
              Titik Koordinat (Input Manual)
            </span>

            <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              💡 <strong>Tidak perlu ke lokasi fisik.</strong> Tempel angka dari Google Maps, sertifikat, atau arsip desa.
            </div>

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
                <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold block mt-1">{parseNotice}</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Latitude</label>
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
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Longitude</label>
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
                className="text-[10px] px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-sky-500 font-semibold border-none cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[12px]">my_location</span>
                GPS Saat Ini
              </button>
            </div>
          </div>

          {/* SECTION: DATA KEBUN & PETANI */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Pemilik Lahan</label>
              <span className="text-[9px] font-bold text-slate-400">{farmerOptions.length} petani terdaftar</span>
            </div>

            {useManualFarmer ? (
              <>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white outline-none focus:border-primary box-border"
                  placeholder="Tulis nama petani baru"
                  value={formFarmer}
                  onChange={(e) => setFormFarmer(e.target.value)}
                />
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-[9px] font-semibold text-amber-500">
                    {farmerOptions.length === 0 ? 'Belum ada data petani terdaftar.' : 'Petani baru — belum terhubung ke daftar.'}
                  </span>
                  {farmerOptions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setManualFarmer(false);
                        setFormFarmer('');
                      }}
                      className="text-[10px] font-extrabold text-primary bg-transparent border-none cursor-pointer shrink-0"
                    >
                      Pilih dari daftar
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <select
                  required
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white outline-none focus:border-primary box-border"
                  value={matchedFarmer ? matchedFarmer.name : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '__manual__') {
                      setManualFarmer(true);
                      setFormFarmer('');
                      return;
                    }
                    setManualFarmer(false);
                    setFormFarmer(value);
                  }}
                >
                  <option value="" disabled>— Pilih petani terdaftar —</option>
                  {farmerOptions.map((farmer) => (
                    <option key={farmer.id} value={farmer.name}>
                      {farmer.name}{farmer.phone ? ` · ${farmer.phone}` : ''}
                    </option>
                  ))}
                  <option value="__manual__">➕ Petani baru (isi manual)</option>
                </select>
                <span className="block text-[9px] text-slate-400 mt-1">
                  {matchedFarmer
                    ? `Terhubung ke Daftar Petani${matchedFarmer.phone ? ` · ${matchedFarmer.phone}` : ''}`
                    : 'Lahan akan otomatis terhubung ke Daftar Petani desa.'}
                </span>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="min-w-0">
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

            <div className="min-w-0">
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
            <div className="min-w-0">
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

            <div className="min-w-0">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Elevasi (MDPL)</label>
              <input
                type="number"
                required
                min="0"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white outline-none focus:border-primary box-border"
                value={formElevation}
                onChange={(e) => {
                  elevationEditRef.current += 1;
                  setElevationStatus('manual');
                  setFormElevation(e.target.value);
                }}
              />
              {elevationHint && (
                <span className={`block text-[9px] mt-1 font-semibold ${elevationHintClass}`}>
                  {elevationHint}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Tahun Tanam <span className="text-slate-400 font-semibold normal-case tracking-normal">(opsional)</span>
            </label>
            <input
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white outline-none focus:border-primary box-border"
              placeholder="misal 2012"
              value={formPlantingYear}
              onChange={(e) => setFormPlantingYear(e.target.value)}
            />
            <span className="block text-[9px] text-slate-400 mt-1">
              {formPlantingYear && Number(formPlantingYear) >= 1900
                ? `Umur tanaman ± ${new Date().getFullYear() - Number(formPlantingYear)} tahun`
                : 'Isi bila tahu tahun tanam — dipakai untuk menilai wajar-tidaknya perkiraan panen.'}
            </span>
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
        </div>

        {/* Sticky footer: submit is always reachable without scrolling */}
        <div className="shrink-0 border-t border-slate-100 bg-white px-3.5 py-2.5 space-y-1.5 dark:border-slate-800 dark:bg-slate-900">
          <div className={`font-mono text-[10px] font-bold ${coordValid ? 'text-slate-500 dark:text-slate-400' : 'text-rose-500'}`}>
            {coordValid
              ? `Lat ${Number(newPlotCoords.lat).toFixed(5)} · Lng ${Number(newPlotCoords.lng).toFixed(5)}`
              : 'Koordinat belum valid'}
          </div>
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-extrabold py-2.5 rounded-xl shadow-md shadow-primary/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">save</span>
            <span>Simpan Data &amp; Koordinat</span>
          </button>
        </div>
      </form>
    </div>
  );
}
