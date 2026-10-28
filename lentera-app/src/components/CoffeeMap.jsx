import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Basemap Layer Providers
const BASEMAP_PROVIDERS = {
  satellite: {
    id: 'satellite',
    name: 'Satelit HD (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery',
    icon: 'satellite_alt'
  },
  osm: {
    id: 'osm',
    name: 'Vektor (OSM)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
    icon: 'map'
  },
  topo: {
    id: 'topo',
    name: 'Topografi (Elevasi)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
    icon: 'terrain'
  }
};

// Premium SVG Map Pin Markers for LENTERA GIS
const createCustomIcon = (type, status) => {
  const isWaspada = status === 'Waspada';
  const isArabica = (type || '').toLowerCase() === 'arabica';
  
  const mainColor = isWaspada ? '#ef4444' : (isArabica ? '#10b981' : '#f59e0b');
  const gradStart = isWaspada ? '#f87171' : (isArabica ? '#34d399' : '#fbbf24');
  const gradEnd = isWaspada ? '#dc2626' : (isArabica ? '#059669' : '#d97706');
  const glowColor = isWaspada ? 'rgba(239, 68, 68, 0.4)' : (isArabica ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)');

  const leafIconSvg = `<path fill="white" d="M17 8C8 10 5.5 16.5 3 22C3 15.5 8 10 17 8Z" opacity="0.95"/>
    <path fill="white" d="M12 3C6.5 3 2 7.5 2 13C2 17.5 5 21 9.5 22C8.5 19 9 15.5 12 13C15 10.5 19 9.5 22 9C21.5 5.5 17.5 3 12 3Z"/>`;

  const warningIconSvg = `<path fill="white" d="M12 2L1 21H23L12 2ZM12 6L19.5 19H4.5L12 6ZM11 10V14H13V10H11ZM11 16V18H13V16H11Z"/>`;

  const iconContentSvg = isWaspada ? warningIconSvg : leafIconSvg;

  const html = `
    <div style="position: relative; width: 38px; height: 48px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 8px 16px ${glowColor}); cursor: pointer;">
      <svg width="38" height="48" viewBox="0 0 38 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="pinGrad-${type}-${status}" x1="19" y1="0" x2="19" y2="44" gradientUnits="userSpaceOnUse">
            <stop stop-color="${gradStart}"/>
            <stop offset="1" stop-color="${gradEnd}"/>
          </linearGradient>
        </defs>
        
        ${isWaspada ? `<circle cx="19" cy="19" r="17" fill="none" stroke="${mainColor}" stroke-width="2.5" opacity="0.8">
          <animate attributeName="r" values="17;24;17" dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.8;0;0.8" dur="1.8s" repeatCount="indefinite"/>
        </circle>` : ''}

        <path d="M19 0C8.50659 0 0 8.50659 0 19C0 29.5 14 42.5 18.15 47.15C18.6 47.65 19.4 47.65 19.85 47.15C24 42.5 38 29.5 38 19C38 8.50659 29.4934 0 19 0Z" fill="url(#pinGrad-${type}-${status})" stroke="#FFFFFF" stroke-width="2.5"/>

        <circle cx="19" cy="18" r="11" fill="rgba(255, 255, 255, 0.25)"/>
      </svg>
      
      <div style="position: absolute; top: 9px; left: 10px; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${iconContentSvg}
        </svg>
      </div>

      <div style="position: absolute; top: 48px; left: 50%; transform: translateX(-50%); background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(8px); color: #ffffff; padding: 2px 7px; border-radius: 8px; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.25); box-shadow: 0 4px 12px rgba(0,0,0,0.4); pointer-events: none;">
        ${type || 'Lahan'} ${isWaspada ? '⚠️' : ''}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: html,
    iconSize: [38, 62],
    iconAnchor: [19, 48],
    popupAnchor: [0, -48]
  });
};

// Pulse User Location Icon
const createUserIcon = () => {
  return L.divIcon({
    className: 'user-location-icon',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: -6px; background: rgba(56, 189, 248, 0.35); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #0ea5e9, #0284c7); border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 6px 16px rgba(14, 165, 233, 0.5); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <div style="position: absolute; top: 34px; left: 50%; transform: translateX(-50%); background: #0284c7; color: white; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.3);">
          ANDA DI SINI
        </div>
      </div>
    `,
    iconSize: [36, 56],
    iconAnchor: [18, 18]
  });
};

// Official Administrative Boundary Coordinates Polygon for Desa Kucur, Kec. Dau, Kab. Malang
// Berdasarkan Data Profil Resmi Desa:
// - Utara: Desa Petungsewu & Desa Karangwidoro (Kec. Dau)
// - Timur: Desa Petungsewu, Desa Kalisongo, & Desa Pandanlandung (Kec. Dau)
// - Selatan: Desa Dalisodo (Kec. Wagir)
// - Barat: Kawasan Hutan Negara / Perhutani (Lereng Gunung Kawi)
const KUCUR_VILLAGE_BOUNDARY = [
  // Utara (Batas Desa Petungsewu & Karangwidoro)
  [-7.9050, 112.5180],
  [-7.9020, 112.5240],
  [-7.9060, 112.5310],
  // Timur (Batas Kalisongo & Pandanlandung)
  [-7.9120, 112.5350],
  [-7.9180, 112.5370],
  [-7.9250, 112.5340],
  // Selatan (Batas Desa Dalisodo, Kec. Wagir)
  [-7.9310, 112.5270],
  [-7.9330, 112.5190],
  [-7.9280, 112.5080],
  // Barat (Kawasan Hutan Negara / Lereng Gunung Kawi)
  [-7.9220, 112.4980],
  [-7.9150, 112.4940],
  [-7.9090, 112.5020]
];

// Badge Marker Icon for Desa Kucur Administrative Center
const createVillageBadgeIcon = () => {
  return L.divIcon({
    className: 'village-badge-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; items-center; justify-content: center;">
        <div style="background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(10px); color: white; padding: 6px 14px; border-radius: 30px; font-size: 11px; font-weight: 800; border: 2px solid #10b981; box-shadow: 0 10px 25px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 6px; white-space: nowrap;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></span>
          <span style="color: #10b981; font-weight: 900; letter-spacing: 1px;">WILAYAH DESA KUCUR</span>
          <span style="color: #94a3b8; font-size: 10px;">(KEC. DAU)</span>
        </div>
      </div>
    `,
    iconSize: [220, 36],
    iconAnchor: [110, 18]
  });
};

// Helper: Generate Spatial Polygon Bounds Around Lat/Lng
const generateSpatialPolygon = (latInput, lngInput, areaSquareMeters) => {
  const lat = parseFloat(latInput);
  const lng = parseFloat(lngInput);
  if (isNaN(lat) || isNaN(lng)) return [];

  const area = parseFloat(areaSquareMeters) || 1200;
  // Convert approximate square area to latitude/longitude offsets
  const deltaLat = Math.sqrt(area) / 111000 / 2;
  const deltaLng = Math.sqrt(area) / (111000 * Math.cos((lat * Math.PI) / 180)) / 2;

  return [
    [lat + deltaLat, lng - deltaLng],
    [lat + deltaLat, lng + deltaLng],
    [lat - deltaLat, lng + deltaLng],
    [lat - deltaLat, lng - deltaLng]
  ];
};

function MapEventsHandler({ onMapClick, enabled, setMapCenterCoords }) {
  const map = useMap();
  
  useMapEvents({
    click(e) {
      if (enabled) {
        onMapClick(e.latlng);
      }
    },
    move() {
      const center = map.getCenter();
      setMapCenterCoords({ lat: center.lat, lng: center.lng });
    }
  });

  return null;
}

function MapController({ triggerZoomIn, triggerZoomOut, triggerRecenter, center }) {
  const map = useMap();

  useEffect(() => {
    if (triggerZoomIn > 0) map.zoomIn();
  }, [triggerZoomIn]);

  useEffect(() => {
    if (triggerZoomOut > 0) map.zoomOut();
  }, [triggerZoomOut]);

  useEffect(() => {
    if (triggerRecenter > 0) map.setView(center, 16);
  }, [triggerRecenter, center]);

  return null;
}

// Draggable / Real-time Pin Marker for New Plot Coordinate Registration
const createNewPlotPinIcon = () => {
  return L.divIcon({
    className: 'new-plot-pin-icon',
    html: `
      <div style="position: relative; width: 42px; height: 52px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 8px 18px rgba(14, 165, 233, 0.6)); cursor: move;">
        <div style="position: absolute; inset: -4px; background: rgba(56, 189, 248, 0.4); border-radius: 50%; animation: ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <svg width="42" height="52" viewBox="0 0 38 48" fill="none">
          <path d="M19 0C8.5 0 0 8.5 0 19C0 29.5 14 42.5 18.15 47.15C18.6 47.65 19.4 47.65 19.85 47.15C24 42.5 38 29.5 38 19C38 8.5 29.5 0 19 0Z" fill="#0284c7" stroke="#ffffff" stroke-width="2.5"/>
          <circle cx="19" cy="18" r="10" fill="#38bdf8"/>
        </svg>
        <div style="position: absolute; top: 10px; left: 12px; color: white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [42, 52],
    iconAnchor: [21, 52]
  });
};

export default function CoffeeMap({ 
  filteredPlots, 
  selectedPlot, 
  setSelectedPlot, 
  role, 
  handleMapClick, 
  showAddForm,
  newPlotCoords,
  setNewPlotCoords,
  onOpenAddPlot
}) {
  const defaultCenter = [-7.9152, 112.5201];
  const [mapCenterCoords, setMapCenterCoords] = useState({ lat: defaultCenter[0], lng: defaultCenter[1] });
  
  const [userLocation, setUserLocation] = useState(defaultCenter);
  const [mapTargetCenter, setMapTargetCenter] = useState(defaultCenter);
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [activeBasemap, setActiveBasemap] = useState('satellite'); // 'satellite', 'osm', 'topo'
  const [showVillageBoundary, setShowVillageBoundary] = useState(true);
  const [showPolygons, setShowPolygons] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showDiseaseZones, setShowDiseaseZones] = useState(true);
  const [showLayerPanel, setShowLayerPanel] = useState(false);

  const [zoomInCount, setZoomInCount] = useState(0);
  const [zoomOutCount, setZoomOutCount] = useState(0);
  const [recenterCount, setRecenterCount] = useState(0);

  // Real GPS Geolocation Trigger Handler
  const handleLocateUserGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation GPS tidak didukung oleh browser Anda.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCoords = [latitude, longitude];
        setUserLocation(newCoords);
        setMapTargetCenter(newCoords);
        setGpsActive(true);
        setGpsLoading(false);
        setRecenterCount(r => r + 1);
      },
      (error) => {
        console.warn('GPS Geolocation Error:', error);
        setGpsLoading(false);
        setMapTargetCenter(defaultCenter);
        setRecenterCount(r => r + 1);
        alert('Menggunakan lokasi default Kebun Desa Kucur.');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Compute Spatial GIS Statistics
  const totalLandArea = filteredPlots.reduce((acc, p) => acc + (parseFloat(p.land_area) || 0), 0);
  const avgElevation = filteredPlots.length > 0 
    ? Math.round(filteredPlots.reduce((acc, p) => acc + (parseFloat(p.elevation) || 0), 0) / filteredPlots.length) 
    : 0;
  const totalYield = filteredPlots.reduce((acc, p) => acc + (parseFloat(p.predicted_yield) || 0), 0);

  const currentProvider = BASEMAP_PROVIDERS[activeBasemap];

  return (
    <main className="flex-1 relative overflow-hidden h-[calc(100vh-80px)]">
      
      {/* Floating GIS Spatial Analysis Header Widget */}
      <div className="absolute top-4 left-4 z-10 hidden sm:flex items-center gap-3 bg-slate-900/85 backdrop-blur-md p-2.5 px-4 rounded-2xl border border-primary/30 text-white shadow-2xl">
        <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-lg">public</span>
          </div>
          <div>
            <div className="text-[9px] font-extrabold text-primary uppercase tracking-widest">SISTEM INFORMASI GEOGRAFIS</div>
            <div className="text-xs font-bold text-slate-100">Desa Kucur, Malang</div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
          <div>
            <span className="text-slate-400 text-[10px] block">LUAS POLIGON</span>
            <span className="text-emerald-400 font-extrabold">{totalLandArea.toLocaleString()} m²</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">RATA2 ELEVASI</span>
            <span className="text-sky-400 font-extrabold">{avgElevation} MDPL</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">ESTIMASI PANEN MLR</span>
            <span className="text-amber-400 font-extrabold">{totalYield.toFixed(1)} kg</span>
          </div>
        </div>
      </div>

      {/* Admin Click Instruction Alert Banner */}
      {(role === 'admin' || role === 'village') && !showAddForm && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white border border-primary/40 px-3 py-1.5 rounded-full z-10 shadow-2xl flex items-center gap-2 text-xs font-bold backdrop-blur-md max-w-[calc(100vw-32px)]">
          <span className="material-symbols-outlined text-primary text-sm">add_location_alt</span>
          <span className="hidden sm:inline">Klik lokasi di peta atau</span>
          {onOpenAddPlot && (
            <button
              type="button"
              onClick={onOpenAddPlot}
              className="bg-primary hover:bg-primary/90 text-slate-950 font-extrabold px-3 py-1 rounded-full text-[11px] border-none cursor-pointer flex items-center gap-1 shadow-sm transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-xs">edit_location</span>
              <span>+ Ketik Titik Koordinat</span>
            </button>
          )}
        </div>
      )}

      {/* Floating GIS Layer Manager Control Trigger Button */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        <button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 text-white rounded-xl border border-primary/30 shadow-2xl text-xs font-extrabold backdrop-blur-md hover:border-primary transition-all"
        >
          <span className="material-symbols-outlined text-primary text-base">layers</span>
          <span>Layer & Basemap SIG</span>
          <span className="material-symbols-outlined text-sm">{showLayerPanel ? 'expand_less' : 'expand_more'}</span>
        </button>

        {/* Layer Manager Modal Floating Menu */}
        {showLayerPanel && (
          <div className="bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-700 shadow-2xl text-white w-72 space-y-4 animate-in fade-in zoom-in duration-150">
            <div>
              <div className="text-[10px] font-extrabold text-primary uppercase tracking-wider mb-2">PILIH BASEMAP SPASIAL</div>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.values(BASEMAP_PROVIDERS).map((bm) => (
                  <button
                    key={bm.id}
                    onClick={() => setActiveBasemap(bm.id)}
                    className={`p-2 rounded-xl text-center flex flex-col items-center gap-1 border transition-all ${
                      activeBasemap === bm.id
                        ? 'bg-primary/20 border-primary text-primary font-bold'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{bm.icon}</span>
                    <span className="text-[9px] font-extrabold leading-tight">{bm.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">OVERLAY LAYER SIG</div>
              <div className="space-y-2 text-xs">
                <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/50">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">nature_people</span>
                    <span className="font-bold text-primary">Batas Wilayah Desa Kucur</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showVillageBoundary}
                    onChange={(e) => setShowVillageBoundary(e.target.checked)}
                    className="accent-primary"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/50">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-sm">polyline</span>
                    <span>Poligon Batas Lahan Kopi</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showPolygons}
                    onChange={(e) => setShowPolygons(e.target.checked)}
                    className="accent-primary"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/50">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-400 text-sm">grain</span>
                    <span>Zona Karat Daun (Waspada)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showDiseaseZones}
                    onChange={(e) => setShowDiseaseZones(e.target.checked)}
                    className="accent-primary"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/50">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sky-400 text-sm">location_on</span>
                    <span>Pin Penanda Kebun</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showMarkers}
                    onChange={(e) => setShowMarkers(e.target.checked)}
                    className="accent-primary"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Container */}
      <MapContainer 
        center={defaultCenter} 
        zoom={14.5} 
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 0 }}
      >
        {/* Dynamic Basemap Tile Layer */}
        <TileLayer
          key={currentProvider.id}
          attribution={currentProvider.attribution}
          url={currentProvider.url}
        />

        {/* Render Official Desa Kucur Administrative Boundary Polygon */}
        {showVillageBoundary && (
          <>
            <Polygon
              positions={KUCUR_VILLAGE_BOUNDARY}
              pathOptions={{
                color: '#10b981',
                fillColor: '#10b981',
                fillOpacity: 0.12,
                weight: 3.5,
                dashArray: '10, 8'
              }}
            >
              <Tooltip sticky permanent={false}>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '11px', fontWeight: '800', color: '#059669' }}>
                  🏛️ Batas Teritorial Administratif Desa Kucur, Kec. Dau, Kab. Malang
                </div>
              </Tooltip>
            </Polygon>

            {/* Village Center Label Badge */}
            <Marker position={[-7.9152, 112.5201]} icon={createVillageBadgeIcon()} interactive={false} />
          </>
        )}

        {/* User Location Pulse Icon */}
        <Marker position={userLocation} icon={createUserIcon()} />

        {/* Render Spatial Polygons (Batas Lahan Kopi) */}
        {showPolygons && filteredPlots.map(plot => {
          const isWaspada = plot.status === 'Waspada';
          const isArabica = (plot.coffee_type || '').toLowerCase() === 'arabica';
          
          const polygonCoords = generateSpatialPolygon(plot.lat, plot.lng, plot.land_area);

          const fillColor = isWaspada ? '#ef4444' : (isArabica ? '#10b981' : '#f59e0b');
          const strokeColor = isWaspada ? '#dc2626' : (isArabica ? '#059669' : '#d97706');

          return (
            <Polygon
              key={`poly-${plot.id}`}
              positions={polygonCoords}
              pathOptions={{
                color: strokeColor,
                fillColor: fillColor,
                fillOpacity: isWaspada ? 0.45 : 0.3,
                weight: 2.5,
                dashArray: isWaspada && showDiseaseZones ? '6, 6' : null
              }}
              eventHandlers={{
                click: () => setSelectedPlot(plot)
              }}
            >
              <Tooltip sticky permanent={false}>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '11px', fontWeight: '700' }}>
                  🏰 Poligon Lahan: {plot.farmer_name} ({plot.land_area || 1200} m²)
                </div>
              </Tooltip>
            </Polygon>
          );
        })}

        {/* Render Coffee Plots Markers */}
        {showMarkers && filteredPlots.map(plot => (
          <Marker 
            key={plot.id} 
            position={[plot.lat, plot.lng]} 
            icon={createCustomIcon(plot.coffee_type, plot.status)}
            eventHandlers={{
              click: () => {
                setSelectedPlot(plot);
              },
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'Plus Jakarta Sans', padding: '2px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{plot.farmer_name}</h4>
                <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#64748b' }}>
                  Varietas: <strong>{plot.coffee_type}</strong>
                </p>
                <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#64748b' }}>
                  Luas Poligon: <strong>{plot.land_area || 1200} m²</strong>
                </p>
                <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#64748b' }}>
                  Ketinggian: <strong>{plot.elevation} MDPL</strong>
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                  Estimasi Panen MLR: <strong style={{ color: '#10b981' }}>{plot.predicted_yield || '657.40'} kg</strong>
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render Marker Titik Baru yang Sedang Diinput / Digeser */}
        {showAddForm && newPlotCoords && !isNaN(Number(newPlotCoords.lat)) && !isNaN(Number(newPlotCoords.lng)) && (
          <Marker 
            position={[Number(newPlotCoords.lat), Number(newPlotCoords.lng)]}
            icon={createNewPlotPinIcon()}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const ll = e.target.getLatLng();
                if (setNewPlotCoords) {
                  setNewPlotCoords({
                    lat: parseFloat(ll.lat.toFixed(6)),
                    lng: parseFloat(ll.lng.toFixed(6))
                  });
                }
              }
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -48]}>
              <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '11px', fontWeight: '800', color: '#0284c7' }}>
                📍 Plot Baru: [{Number(newPlotCoords.lat).toFixed(5)}, {Number(newPlotCoords.lng).toFixed(5)}]
                <br/>
                <span style={{ fontSize: '9px', color: '#64748b' }}>(Bisa digeser atau diketik di form)</span>
              </div>
            </Tooltip>
          </Marker>
        )}

        {/* Map Handlers */}
        <MapEventsHandler 
          onMapClick={handleMapClick} 
          enabled={role === 'admin' || role === 'village'} 
          setMapCenterCoords={setMapCenterCoords}
        />
        <MapController 
          triggerZoomIn={zoomInCount}
          triggerZoomOut={zoomOutCount}
          triggerRecenter={recenterCount}
          center={mapTargetCenter}
        />
      </MapContainer>

      {/* UI Overlays: Zoom & Recenter Controls on the Right */}
      <div className="absolute top-20 right-4 flex flex-col gap-2 z-10">
        {(role === 'admin' || role === 'village') && (
          <button 
            onClick={() => {
              if (handleMapClick) {
                handleMapClick(newPlotCoords || mapCenterCoords);
              }
            }}
            className={`w-10 h-10 shadow-xl rounded-xl flex items-center justify-center transition-all border ${
              showAddForm 
                ? 'bg-primary text-slate-950 border-primary font-bold shadow-primary/30' 
                : 'bg-slate-900/90 text-white border-slate-700 hover:bg-slate-800'
            }`}
            title="Tambah Plot / Buka Form Input Koordinat"
          >
            <span className="material-symbols-outlined font-extrabold text-lg">
              add_location_alt
            </span>
          </button>
        )}
        <button 
          onClick={() => setZoomInCount(z => z + 1)}
          className="w-10 h-10 bg-slate-900/90 text-white shadow-xl rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors border border-slate-700"
          title="Zoom In"
        >
          <span className="material-symbols-outlined font-bold">add</span>
        </button>
        <button 
          onClick={() => setZoomOutCount(z => z + 1)}
          className="w-10 h-10 bg-slate-900/90 text-white shadow-xl rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors border border-slate-700"
          title="Zoom Out"
        >
          <span className="material-symbols-outlined font-bold">remove</span>
        </button>
        <div className="h-px w-6 mx-auto bg-primary/20 my-0.5"></div>
        <button 
          onClick={handleLocateUserGPS}
          className={`w-10 h-10 shadow-xl rounded-xl flex items-center justify-center transition-all border ${
            gpsActive 
              ? 'bg-sky-500 text-white border-sky-400 shadow-sky-500/40' 
              : 'bg-slate-900/90 text-white border-slate-700 hover:bg-slate-800'
          }`}
          title="Aktifkan Lokasi Saya (GPS Real-time)"
        >
          <span className={`material-symbols-outlined ${gpsLoading ? 'animate-spin' : ''}`}>
            {gpsActive ? 'gps_fixed' : 'my_location'}
          </span>
        </button>
      </div>

      {/* Coordinates Status Bar — desktop only, so it never collides with the mobile Aset Desa pill */}
      <div className="hidden lg:flex absolute bottom-6 left-6 z-10 max-w-[calc(100vw-24px)] pointer-events-none">
        <div className="px-4 sm:px-5 py-2.5 rounded-xl shadow-2xl border border-primary/20 flex items-center gap-3.5 bg-slate-900/90 backdrop-blur-md text-white overflow-hidden text-ellipsis whitespace-nowrap">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] font-extrabold uppercase text-slate-300 tracking-wider">{currentProvider.name}</span>
          </div>
          <div className="h-3 w-px bg-slate-700 shrink-0"></div>
          <span className="text-[10px] font-bold text-slate-300 font-mono truncate px-0.5">
            Lat: {mapCenterCoords.lat.toFixed(5)}°, Long: {mapCenterCoords.lng.toFixed(5)}°
          </span>
        </div>
      </div>

    </main>
  );
}

