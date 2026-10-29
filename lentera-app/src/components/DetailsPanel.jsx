import React, { useState, useEffect } from 'react';
import { calculateMLRYield, getPredictionRange } from '../lib/mlr';
import { API_BASE_URL } from '../lib/api';

export default function DetailsPanel({ 
  selectedPlot, 
  setSelectedPlot, 
  role, 
  token, 
  plots, 
  setPlots,
  inDashboard = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    farmer_name: '',
    coffee_type: 'Robusta',
    tree_count: 100,
    elevation: 800,
    land_area: 1000,
    planting_year: '',
    description: ''
  });

  const [plotBatches, setPlotBatches] = useState([]);
  const [harvestSummary, setHarvestSummary] = useState(null);
  const [mlrHistory, setMlrHistory] = useState([]);
  const [showAddHarvestModal, setShowAddHarvestModal] = useState(false);
  const [newHarvest, setNewHarvest] = useState({
    weight_kg: '',
    harvest_date: ''
  });

  useEffect(() => {
    if (selectedPlot) {
      setEditForm({
        farmer_name: selectedPlot.farmer_name || '',
        coffee_type: selectedPlot.coffee_type || 'Robusta',
        tree_count: selectedPlot.tree_count || 0,
        elevation: selectedPlot.elevation || 0,
        land_area: selectedPlot.land_area || 0,
        planting_year: selectedPlot.planting_year ?? '',
        description: selectedPlot.description || ''
      });
      setIsEditing(false);

      // Fetch real harvest records for this plot
      fetch(`${API_BASE_URL}/plots/${selectedPlot.id}/harvests`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          setPlotBatches(Array.isArray(data?.data) ? data.data : []);
          setHarvestSummary(data?.status === 'SUCCESS' ? data : null);
        })
        .catch(() => {
          setPlotBatches([]);
          setHarvestSummary(null);
        });

      fetch(`${API_BASE_URL}/plots/${selectedPlot.id}/mlr-history`)
        .then(res => (res.ok ? res.json() : []))
        .then(data => setMlrHistory(Array.isArray(data) ? data : []))
        .catch(() => setMlrHistory([]));
    }
  }, [selectedPlot]);

  // Prediksi yang tampil tergantung panen tercatat, jadi segarkan lahan + ringkasan musim
  // setiap kali input berubah; panel akurasi juga membaca data yang sama.
  const refreshPlotSnapshot = async (plotId) => {
    try {
      const [plotsRes, harvestsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/plots`),
        fetch(`${API_BASE_URL}/plots/${plotId}/harvests`)
      ]);
      if (plotsRes.ok) {
        const list = await plotsRes.json();
        setPlots(list);
        const fresh = list.find((item) => item.id === plotId);
        if (fresh) setSelectedPlot(fresh);
      }
      if (harvestsRes.ok) {
        const summary = await harvestsRes.json();
        setHarvestSummary(summary?.status === 'SUCCESS' ? summary : null);
      }
    } catch (err) {
      console.error('Gagal menyegarkan data prediksi lahan:', err);
    }
  };

  // Handle Quick Add Harvest Batch for this plot
  const handleCreateHarvestBatch = async (e) => {
    e.preventDefault();
    if (!selectedPlot) return;
    const weight = parseFloat(newHarvest.weight_kg);
    if (!Number.isFinite(weight) || weight <= 0) {
      alert('Berat panen harus lebih dari 0 kg.');
      return;
    }
    const payload = {
      weight_kg: weight,
      harvest_date: newHarvest.harvest_date || undefined
    };

    try {
      const res = await fetch(`${API_BASE_URL}/plots/${selectedPlot.id}/harvests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Gagal menyimpan panen: ${data.error || 'Terjadi kesalahan.'}`);
        return;
      }
      setPlotBatches([data.data, ...plotBatches]);
      setShowAddHarvestModal(false);
      setNewHarvest({ weight_kg: '', harvest_date: '' });
      await refreshPlotSnapshot(selectedPlot.id);
      alert('Pencatatan hasil panen realisasi berhasil disimpan!');
    } catch (err) {
      console.error('Error creating harvest batch:', err);
      alert('Koneksi terputus. Panen belum tersimpan.');
    }
  };

  // Handle Edit Plot Save with Backend API Persistence
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedPlot) return;

    const area = parseFloat(editForm.land_area) || 0;
    const trees = parseInt(editForm.tree_count) || 0;
    const elev = parseInt(editForm.elevation) || 0;

    const payload = {
      farmer_name: editForm.farmer_name,
      coffee_type: editForm.coffee_type,
      tree_count: trees,
      elevation: elev,
      land_area: area,
      planting_year: editForm.planting_year === '' ? null : Number(editForm.planting_year),
      description: editForm.description
    };

    try {
      const res = await fetch(`${API_BASE_URL}/plots/${selectedPlot.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.plot) {
        alert(`Gagal memperbarui plot: ${data.error || 'Terjadi kesalahan.'}`);
        return;
      }

      setIsEditing(false);
      await refreshPlotSnapshot(selectedPlot.id);
      alert('Data lahan dan perkiraan panen berhasil diperbarui.');
    } catch (err) {
      console.error('Gagal update plot:', err);
      alert('Koneksi terputus. Perubahan belum tersimpan.');
    }
  };

  // Handle Delete Plot with Backend API Persistence
  const handleDeletePlot = async () => {
    if (!selectedPlot) return;
    if (window.confirm(`Nonaktifkan plot lahan "${selectedPlot.farmer_name}"? Data akan diarsipkan dan tidak tampil lagi di peta.`)) {
      try {
        const res = await fetch(`${API_BASE_URL}/plots/${selectedPlot.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(`Gagal menonaktifkan plot: ${data.error || 'Terjadi kesalahan.'}`);
          return;
        }

        const updatedPlots = plots.filter(p => p.id !== selectedPlot.id);
        setPlots(updatedPlots);
        setSelectedPlot(null);
        alert('Plot lahan berhasil dinonaktifkan.');
      } catch (err) {
        console.error('Gagal menghapus plot:', err);
        alert('Koneksi terputus. Plot belum dinonaktifkan.');
      }
    }
  };

  // Nilai dasar untuk perhitungan perkiraan panen
  const currentArea = parseFloat(selectedPlot?.land_area || 0);
  const currentTrees = parseInt(selectedPlot?.tree_count || 0);
  const currentElev = parseInt(selectedPlot?.elevation || 0);
  const currentType = selectedPlot?.coffee_type || '';
  const mlrTotalYield = calculateMLRYield(currentArea, currentTrees, currentElev, currentType);

  // Prediksi yang ditampilkan = prediksi dasar dikoreksi panen musim-musim sebelumnya
  const calibratedYield = Number(selectedPlot?.calibrated_yield ?? mlrTotalYield);
  const calibrationSeasons = Number(selectedPlot?.calibration_seasons || 0);
  const calibrationRatio = Number(selectedPlot?.calibration_ratio || 1);
  const predictionRange = getPredictionRange(calibratedYield);

  // Total Recorded Real Harvest Weight for this Plot
  const totalRecordedHarvestKg = plotBatches.reduce((acc, b) => acc + (parseFloat(b.weight_kg) || 0), 0);
  const latestSeason = harvestSummary?.latest_season ?? null;
  const latestSeasonKg = Number(harvestSummary?.latest_kg ?? 0);
  const seasonTargetKg = Number(harvestSummary?.season_predicted_kg ?? calibratedYield);
  const seasonAchievementRatio = seasonTargetKg > 0 ? Math.round((latestSeasonKg / seasonTargetKg) * 100) : 0;

  return (
    <aside className={`details-panel ${selectedPlot ? 'open' : ''}`}>
      <div className="details-header">
        <h3 className="details-title">Detail Plot Lahan</h3>
        <button className="close-btn" onClick={() => setSelectedPlot(null)}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {selectedPlot && (
        <div className="details-content">
          {/* Header Title & Tag */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>{selectedPlot.farmer_name}</h2>
            <span className={`plot-tag ${selectedPlot.coffee_type.toLowerCase()}`}>
              {selectedPlot.coffee_type}
            </span>
          </div>

          {/* ADMIN & DESA CRUD ACTION CONTROLS */}
          {inDashboard && (role === 'admin' || role === 'village') && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                style={{ 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px', 
                  padding: '8px 12px', 
                  borderRadius: '10px', 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: isEditing ? 'var(--color-primary)' : 'var(--bg-secondary)', 
                  color: isEditing ? '#132210' : 'var(--text-main)', 
                  fontWeight: '800', 
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                {isEditing ? 'Batal Edit' : 'Edit Plot Lahan'}
              </button>

              <button 
                onClick={handleDeletePlot}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px', 
                  padding: '8px 12px', 
                  borderRadius: '10px', 
                  border: 'none', 
                  backgroundColor: 'rgba(239, 68, 68, 0.15)', 
                  color: '#EF4444', 
                  fontWeight: '800', 
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                title="Nonaktifkan plot dari peta"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                Hapus
              </button>
            </div>
          )}

          {/* INLINE EDIT FORM OR READ-ONLY VIEW */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nama Pemilik Lahan</label>
                <input 
                  type="text" 
                  required 
                  value={editForm.farmer_name}
                  onChange={(e) => setEditForm({ ...editForm, farmer_name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Varietas</label>
                  <select 
                    value={editForm.coffee_type}
                    onChange={(e) => setEditForm({ ...editForm, coffee_type: e.target.value })}
                    style={{ width: '100%', padding: '8px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '12px', boxSizing: 'border-box' }}
                  >
                    <option value="Robusta">Robusta</option>
                    <option value="Arabica">Arabica</option>
                    <option value="Liberica">Liberica</option>
                    <option value="Excelsa">Excelsa</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Luas (m²)</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    value={editForm.land_area}
                    onChange={(e) => setEditForm({ ...editForm, land_area: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jumlah Pohon</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    value={editForm.tree_count}
                    onChange={(e) => setEditForm({ ...editForm, tree_count: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Elevasi (MDPL)</label>
                  <input 
                    type="number" 
                    required 
                    min="400"
                    max="3000"
                    value={editForm.elevation}
                    onChange={(e) => setEditForm({ ...editForm, elevation: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tahun Tanam (opsional)</label>
                <input 
                  type="number" 
                  min="1900"
                  max={new Date().getFullYear()}
                  placeholder="misal 2012"
                  value={editForm.planting_year}
                  onChange={(e) => setEditForm({ ...editForm, planting_year: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '12px', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {editForm.planting_year && Number(editForm.planting_year) >= 1900
                    ? `Umur tanaman ± ${new Date().getFullYear() - Number(editForm.planting_year)} tahun`
                    : 'Kosongkan bila belum diketahui.'}
                </span>
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Keterangan Lahan</label>
                <textarea 
                  rows="2"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '12px', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button 
                type="submit" 
                style={{ 
                  padding: '10px', 
                  borderRadius: '10px', 
                  border: 'none', 
                  backgroundColor: 'var(--color-primary)', 
                  color: '#132210', 
                  fontWeight: '800', 
                  fontSize: '12px',
                  cursor: 'pointer',
                  marginTop: '4px'
                }}
              >
                Simpan Perubahan
              </button>
            </form>
          ) : (
            <>
              <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-muted)', margin: '12px 0 0 0' }}>
                {selectedPlot.description || 'Tidak ada deskripsi tambahan untuk lahan ini.'}
              </p>

              {/* 1. KARTU PERKIRAAN HASIL PANEN */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                borderRadius: '14px',
                padding: '14px',
                marginTop: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#34D399', fontSize: '20px' }}>analytics</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Perkiraan Hasil Panen
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '22px', fontWeight: '800', color: '#F8FAFC', marginBottom: '2px' }}>
                  {calibratedYield.toLocaleString('id-ID')} <span style={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8' }}>Kg/tahun</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '8px' }}>
                  Rentang wajar {predictionRange.low.toLocaleString('id-ID')}–{predictionRange.high.toLocaleString('id-ID')} kg
                  {' '}(8 dari 10 kebun contoh berada di rentang ini).
                </div>
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(52, 211, 153, 0.2)',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  marginBottom: '8px',
                  fontSize: '11px',
                  lineHeight: '1.6',
                  color: '#CBD5E1'
                }}>
                  {calibrationSeasons > 0 ? (
                    <>
                      Perkiraan dasar {mlrTotalYield.toLocaleString('id-ID')} kg, disesuaikan
                      {' '}×{calibrationRatio.toLocaleString('id-ID')} dari {calibrationSeasons} musim panen sebelumnya.
                    </>
                  ) : (
                    <>
                      Perkiraan dasar {mlrTotalYield.toLocaleString('id-ID')} kg. Angka ini akan menyesuaikan
                      {' '}otomatis setelah panen pertama lahan ini tercatat.
                    </>
                  )}
                </div>

                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(52, 211, 153, 0.2)',
                  borderRadius: '10px',
                  padding: '10px',
                  marginBottom: '8px',
                  fontSize: '11px',
                  lineHeight: '1.7',
                  color: '#CBD5E1'
                }}>
                  Perkiraan dihitung dari luas lahan, jumlah pohon, dan jenis kopi. Hasil panen dari musim-musim sebelumnya dipakai untuk menyesuaikan angka agar makin dekat dengan kondisi kebun ini.
                </div>
              </div>

              {/* RIWAYAT PERKIRAAN PANEN */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '14px',
                marginTop: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#94A3B8', fontSize: '18px' }}>history</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Riwayat Perkiraan Panen
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>{mlrHistory.length} entri</span>
                </div>

                {mlrHistory.length === 0 ? (
                  <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>
                    Belum ada riwayat perkiraan panen untuk lahan ini.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {mlrHistory.slice(0, 4).map((entry) => (
                      <div key={entry.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '8px',
                        fontSize: '10px',
                        color: '#94A3B8',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        paddingBottom: '4px'
                      }}>
                        <span>
                          {new Date(entry.calculated_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span style={{ color: '#34D399', fontWeight: 700 }}>
                          {Number(entry.predicted_kg).toLocaleString('id-ID')} Kg
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. KARTU PENCATATAN HASIL PANEN REALISASI */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(14, 165, 233, 0.1) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '14px',
                padding: '14px',
                marginTop: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#38BDF8', fontSize: '20px' }}>fact_check</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Pencatatan Hasil Panen Realisasi
                    </span>
                  </div>
                  {(role === 'admin' || role === 'village') && (
                    <button
                      onClick={() => setShowAddHarvestModal(true)}
                      style={{
                        background: '#38BDF8',
                        color: '#0F172A',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span> Catat Panen
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#F8FAFC' }}>
                    {(latestSeason ? latestSeasonKg : totalRecordedHarvestKg).toLocaleString('id-ID')}
                    {' '}<span style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8' }}>
                      Kg {latestSeason ? `Musim ${latestSeason}` : 'Realisasi'}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#38BDF8', fontWeight: 700 }}>
                    {plotBatches.length} Catatan Panen
                  </span>
                </div>
                {latestSeason && totalRecordedHarvestKg !== latestSeasonKg && (
                  <div style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '6px' }}>
                    Total semua musim: {totalRecordedHarvestKg.toLocaleString('id-ID')} kg
                  </div>
                )}

                {/* Audit Comparison Gauge */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '10px',
                  padding: '10px',
                  fontSize: '11px',
                  lineHeight: '1.5',
                  color: '#CBD5E1',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>{latestSeason ? `Perkiraan musim ${latestSeason}:` : 'Perkiraan musim berikutnya:'}</span>
                    <span style={{ fontWeight: 700, color: '#34D399' }}>
                      {(latestSeason ? seasonTargetKg : calibratedYield).toLocaleString('id-ID')} Kg
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>{latestSeason ? `Panen musim ${latestSeason}:` : 'Total Panen Realisasi:'}</span>
                    <span style={{ fontWeight: 700, color: '#38BDF8' }}>{(latestSeason ? latestSeasonKg : totalRecordedHarvestKg).toLocaleString('id-ID')} Kg</span>
                  </div>
                  {latestSeason && seasonTargetKg > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '4px', marginTop: '4px' }}>
                      <span>Capaian Terhadap Perkiraan:</span>
                      <span style={{ fontWeight: 800, color: seasonAchievementRatio >= 80 ? '#34D399' : '#FBBF24' }}>
                        {seasonAchievementRatio}% ({seasonAchievementRatio >= 80 ? 'On Target / Sangat Baik' : 'Dalam Proses Panen'})
                      </span>
                    </div>
                  )}
                  {latestSeason && Number(harvestSummary?.calibration_seasons) > 0 && (
                    <div style={{ marginTop: '4px', fontSize: '10px', color: '#94A3B8' }}>
                      Perkiraan musim {latestSeason} disesuaikan ×{Number(harvestSummary.calibration_ratio).toLocaleString('id-ID')}
                      {' '}dari {harvestSummary.calibration_seasons} musim sebelumnya.
                    </div>
                  )}
                </div>
              </div>

              {/* 2. RINCIAN LAHAN SPASIAL */}
              <div className="details-info-section" style={{ marginTop: '16px' }}>
                <div className="info-item">
                  <div className="info-icon-container">
                    <span className="material-symbols-outlined">aspect_ratio</span>
                  </div>
                  <div className="info-details">
                    <span className="info-label">Luas Lahan (m²)</span>
                    <span className="info-value">{currentArea.toLocaleString()} m²</span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-container">
                    <span className="material-symbols-outlined">forest</span>
                  </div>
                  <div className="info-details">
                    <span className="info-label">Jumlah Tanaman Kopi</span>
                    <span className="info-value">{currentTrees.toLocaleString()} Pohon</span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-container">
                    <span className="material-symbols-outlined">filter_hdr</span>
                  </div>
                  <div className="info-details">
                    <span className="info-label">Elevasi Ketinggian Lahan</span>
                    <span className="info-value">{currentElev} MDPL (Meter)</span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-container">
                    <span className="material-symbols-outlined">calendar_month</span>
                  </div>
                  <div className="info-details">
                    <span className="info-label">Tahun Tanam</span>
                    <span className="info-value">
                      {selectedPlot.planting_year
                        ? `${selectedPlot.planting_year} (± ${new Date().getFullYear() - Number(selectedPlot.planting_year)} tahun)`
                        : 'Belum dicatat'}
                    </span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-container">
                    <span className="material-symbols-outlined">pin_drop</span>
                  </div>
                  <div className="info-details">
                    <span className="info-label">Koordinat Spasial (Titik)</span>
                    <span className="info-value" style={{ fontSize: '11px' }}>
                      Lat: {Number(selectedPlot.lat).toFixed(6)}<br />
                      Lng: {Number(selectedPlot.lng).toFixed(6)}
                    </span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Coordination Navigation */}
              <a 
                href={`https://wa.me/6281234567890?text=Halo%20Admin%20Karang%20Taruna%2C%20saya%20tertarik%20mengunjungi%20lahan%20kopi%20${encodeURIComponent(selectedPlot.farmer_name)}%20di%20Kucur.`}
                target="_blank"
                rel="noreferrer"
                className="nav-action-btn"
                style={{ textDecoration: 'none', marginTop: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}
              >
                <span className="material-symbols-outlined">chat</span>
                Hubungi Pemandu Lahan (WhatsApp)
              </a>
            </>
          )}
        </div>
      )}

      {/* QUICK MODAL: CATAT PANEN BARU */}
      {showAddHarvestModal && selectedPlot && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#1E293B',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '440px',
            padding: '20px',
            color: '#F8FAFC',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined">fact_check</span> Catat Hasil Panen Realisasi
              </h3>
              <button onClick={() => setShowAddHarvestModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateHarvestBatch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Pemilik Lahan</label>
                <input type="text" disabled value={selectedPlot.farmer_name} style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#94A3B8', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Hasil Panen (Kg)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Contoh: 850"
                    value={newHarvest.weight_kg}
                    onChange={(e) => setNewHarvest({ ...newHarvest, weight_kg: e.target.value })}
                    style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '8px', padding: '8px 12px', color: '#F8FAFC', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Tanggal Panen</label>
                  <input
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={newHarvest.harvest_date}
                    onChange={(e) => setNewHarvest({ ...newHarvest, harvest_date: e.target.value })}
                    style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#F8FAFC', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0 }}>
                Kosongkan tanggal untuk memakai tanggal hari ini. Data ini langsung dipakai pada perbandingan perkiraan panen di tab Daftar Lahan.
              </p>

              <button
                type="submit"
                style={{
                  marginTop: '8px',
                  background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Simpan Pencatatan Hasil Panen Realisasi
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
