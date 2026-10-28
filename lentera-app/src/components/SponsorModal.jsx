import React from 'react';

export default function SponsorModal({
  plots,
  newSponsorName,
  setNewSponsorName,
  sponsorContact,
  setSponsorContact,
  selectedSponsorPlot,
  setSelectedSponsorPlot,
  sponsorAmount,
  setSponsorAmount,
  proposalFile,
  setProposalFile,
  handleSponsorSubmit,
  setShowSponsorModal
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">Ajukan Kemitraan Investasi Lahan</h3>
          <button className="close-btn" onClick={() => setShowSponsorModal(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSponsorSubmit} className="modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Nama Perusahaan / Investor</label>
            <input 
              type="text" 
              required 
              className="form-input" 
              placeholder="Contoh: PT Kopi Java Mandiri"
              value={newSponsorName}
              onChange={(e) => setNewSponsorName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Kontak Penanggung Jawab</label>
            <input 
              type="text" 
              required
              className="form-input" 
              placeholder="Nama PIC • 0812xxxxxxx / email"
              value={sponsorContact || ''}
              onChange={(e) => setSponsorContact(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Pilih Lahan Kopi Target</label>
            <select 
              className="form-input"
              value={selectedSponsorPlot}
              onChange={(e) => setSelectedSponsorPlot(e.target.value)}
            >
              {plots.map(plot => (
                <option key={plot.id} value={plot.id}>
                  {plot.farmer_name} ({plot.coffee_type} - {plot.elevation} MDPL)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Nominal Investasi (Rp)</label>
            <input 
              type="number" 
              required 
              min="1000000"
              className="form-input"
              value={sponsorAmount}
              onChange={(e) => setSponsorAmount(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Unggah Berkas Proposal PDF (Max 5MB)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input 
                type="file" 
                accept="application/pdf,.pdf" 
                id="proposal-pdf-input"
                required
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file && setProposalFile) {
                    if (file.type !== 'application/pdf') {
                      alert('Berkas proposal wajib berformat PDF.');
                      e.target.value = '';
                      return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      alert('Ukuran berkas proposal maksimal 5 MB.');
                      e.target.value = '';
                      return;
                    }
                    setProposalFile(file);
                  }
                }}
              />
              <label 
                htmlFor="proposal-pdf-input" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  padding: '10px 14px', 
                  backgroundColor: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '10px', 
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                <span className="material-symbols-outlined text-rose-500" style={{ fontSize: '24px' }}>picture_as_pdf</span>
                <span>{proposalFile ? `File Dipilih: ${proposalFile.name}` : 'Pilih File PDF Proposal (Maks. 5 MB)...'}</span>
              </label>
            </div>
          </div>

          <button type="submit" className="form-submit-btn" style={{ marginTop: '12px' }}>
            Kirim Dokumen Proposal Ke Kades
          </button>
        </form>
      </div>
    </div>
  );
}
