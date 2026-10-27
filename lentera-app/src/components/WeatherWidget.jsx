import React, { useState, useEffect } from 'react';

export default function WeatherWidget() {
  const [weatherData, setWeatherData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Coordinate Desa Kucur, Kec. Dau, Kab. Malang: Lat -7.953, Lon 112.535
  const LAT = -7.953;
  const LON = 112.535;

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FJakarta`
      );
      if (res.ok) {
        const data = await res.json();
        setWeatherData(data);
      }
    } catch (err) {
      console.error('Fetch weather error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherDescription = (code) => {
    if (code === 0) return { label: 'Cerah', icon: 'wb_sunny', color: 'text-amber-400' };
    if (code === 1 || code === 2 || code === 3) return { label: 'Cerah Berawan', icon: 'partly_cloudy_day', color: 'text-sky-400' };
    if (code >= 45 && code <= 48) return { label: 'Kabut Pegunungan', icon: 'foggy', color: 'text-slate-400' };
    if (code >= 51 && code <= 67) return { label: 'Hujan Gerimis', icon: 'rainy', color: 'text-blue-400' };
    if (code >= 80 && code <= 82) return { label: 'Hujan Lokal', icon: 'showers', color: 'text-blue-500' };
    if (code >= 95) return { label: 'Hujan Badai', icon: 'thunderstorm', color: 'text-purple-400' };
    return { label: 'Hujan Ringan', icon: 'water_drop', color: 'text-blue-400' };
  };

  const currentWeather = weatherData?.current_weather;
  const dailyWeather = weatherData?.daily;
  const desc = currentWeather ? getWeatherDescription(currentWeather.weathercode) : null;

  return (
    <>
      {/* Live Weather Navbar Pill */}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-primary/20 hover:border-primary/50 transition-all text-xs font-extrabold text-slate-800 dark:text-slate-100 shadow-sm"
        title="Klik untuk melihat Prakiraan Cuaca Desa Kucur 7 Hari"
      >
        {loading ? (
          <span className="material-symbols-outlined animate-spin text-sm text-primary">sync</span>
        ) : (
          <>
            <span className={`material-symbols-outlined text-sm ${desc?.color}`}>{desc?.icon || 'partly_cloudy_day'}</span>
            <span>{currentWeather ? `${Math.round(currentWeather.temperature)}°C` : '23°C'}</span>
            <span className="hidden sm:inline font-semibold text-slate-400 text-[11px]">| Kucur</span>
          </>
        )}
      </button>

      {/* Modal Prakiraan Cuaca 7 Hari & Rekomendasi Kopi */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-primary/30 space-y-5 animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="text-[10px] font-extrabold text-primary uppercase tracking-widest">LIVE OPEN-METEO API</div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sky-500">thermostat</span>
                  <span>Cuaca & Forecast Desa Kucur</span>
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Current Condition Hero */}
            {currentWeather && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-500/10 via-primary/5 to-emerald-500/10 border border-sky-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">HARI INI (LERENG KAWI 1.200 MDPL)</span>
                  <div className="text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {Math.round(currentWeather.temperature)}°C
                  </div>
                  <div className="text-xs font-bold text-sky-500 mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">{desc?.icon}</span>
                    <span>{desc?.label}</span>
                  </div>
                </div>

                <div className="text-right space-y-1 text-xs">
                  <div className="text-slate-400 font-semibold">Kecepatan Angin: <span className="text-slate-900 dark:text-white font-bold">{currentWeather.windspeed} km/j</span></div>
                  <div className="text-slate-400 font-semibold">Koordinat: <span className="text-slate-900 dark:text-white font-bold">7.953° S, 112.535° E</span></div>
                  <div className="text-emerald-500 font-bold text-[10px] mt-2">✓ Kondisi Lahan Ter-update</div>
                </div>
              </div>
            )}

            {/* Rekomendasi Pertanian Kopi */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5">
              <div className="font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">eco</span>
                <span>Rekomendasi Agronomi Kopi Hari Ini</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {currentWeather && currentWeather.weathercode >= 51
                  ? '🌧️ Terjadi curah hujan tinggi. Hindari penjemuran biji kopi (sun-drying) di area terbuka dan waspadai kelembaban tinggi memicu jamur Karat Daun (Hemileia vastatrix).'
                  : '☀️ Cuaca cerah dan mendukung! Sangat ideal untuk proses pemangkasan tunas air, penjemuran biji kopi hasil panen, dan aplikasi pupuk organik.'}
              </p>
            </div>

            {/* Daily 7-Day Forecast */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">PRAKIRAAN CUACA 7 HARI KE DEPAN</h4>
              
              <div className="grid grid-cols-7 gap-2">
                {dailyWeather && dailyWeather.time.map((dateStr, idx) => {
                  const dayName = new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'short' });
                  const maxTemp = Math.round(dailyWeather.temperature_2m_max[idx]);
                  const minTemp = Math.round(dailyWeather.temperature_2m_min[idx]);
                  const dayDesc = getWeatherDescription(dailyWeather.weathercode[idx]);

                  return (
                    <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                      <span className="block text-[10px] font-extrabold text-slate-400 uppercase">{dayName}</span>
                      <span className={`material-symbols-outlined text-base block mx-auto ${dayDesc.color}`}>{dayDesc.icon}</span>
                      <span className="block text-[11px] font-extrabold text-slate-900 dark:text-white">{maxTemp}°</span>
                      <span className="block text-[9px] font-semibold text-slate-400">{minTemp}°</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button onClick={() => setShowModal(false)} className="w-full py-3 bg-primary text-slate-900 font-extrabold rounded-xl text-xs shadow-md">
              Tutup Informasi Cuaca
            </button>
          </div>
        </div>
      )}
    </>
  );
}
