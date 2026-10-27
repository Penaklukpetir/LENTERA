import React from 'react';

export default function SponsorView({ role, sponsorships, setShowSponsorModal, approveSponsorship, inDashboard = false }) {
  return (
    <div className="tab-view-container">
      <div className="tab-view-header">
        <span className="tab-view-title">Sponsorship Hub & Investasi Hijau B2B</span>
        <button 
          onClick={() => setShowSponsorModal(true)}
          className="form-submit-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          Ajukan Proposal Kemitraan
        </button>
      </div>

      <div className="tab-view-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Stats overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div className="info-item" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="info-icon-container">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div className="info-details">
              <span className="info-label">Total Dana Kemitraan</span>
              <span className="info-value" style={{ fontSize: '20px', color: 'var(--color-green-light)' }}>
                Rp 50.000.000
              </span>
            </div>
          </div>
          
          <div className="info-item" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="info-icon-container">
              <span className="material-symbols-outlined">handshake</span>
            </div>
            <div className="info-details">
              <span className="info-label">Sponsor Aktif</span>
              <span className="info-value" style={{ fontSize: '20px' }}>2 Perusahaan</span>
            </div>
          </div>

          <div className="info-item" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="info-icon-container">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <div className="info-details">
              <span className="info-label">Status Verifikasi</span>
              <span className="info-value" style={{ fontSize: '20px' }}>ISO 29148 Compliant</span>
            </div>
          </div>
        </div>

        {/* Proposals Table */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>Antrean Proposal Kemitraan Lahan Kopi</h3>
          
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '550px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px' }}>Nama Perusahaan</th>
                <th style={{ padding: '12px' }}>Petani Mitra</th>
                <th style={{ padding: '12px' }}>Nilai Investasi</th>
                <th style={{ padding: '12px' }}>Status Proposal</th>
                {role === 'village' && inDashboard && <th style={{ padding: '12px' }}>Aksi Persetujuan</th>}
              </tr>
            </thead>
            <tbody>
              {sponsorships.map(spon => (
                <tr key={spon.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', fontWeight: '700' }}>{spon.sponsor_name}</td>
                  <td style={{ padding: '12px' }}>{spon.plot_owner}</td>
                  <td style={{ padding: '12px', color: 'var(--color-green-light)', fontWeight: '700' }}>
                    Rp {spon.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span className={`plot-tag ${spon.status === 'APPROVED' ? 'arabica' : 'robusta'}`}>
                      {spon.status}
                    </span>
                  </td>
                  {role === 'village' && inDashboard && (
                    <td style={{ padding: '12px' }}>
                      {spon.status === 'PENDING' ? (
                        <button 
                          onClick={() => approveSponsorship(spon.id)}
                          className="form-submit-btn" 
                          style={{ padding: '6px 12px', fontSize: '11px' }}
                        >
                          Approve & TTD
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Selesai</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

      </div>
    </div>
  );
}
