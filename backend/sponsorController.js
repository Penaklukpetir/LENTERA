import pool from './db.js';

const SPONSORSHIP_SELECT = `
  SELECT s.id, s.sponsor_id, s.plot_id, s.funding_amount, s.status, s.proposal_url,
         s.sponsor_name, s.contact, s.plot_owner, s.created_at, s.updated_at,
         s.curated_by, s.curated_at, s.curation_notes,
         s.approved_by, s.approved_at,
         s.rejected_by, s.rejected_at, s.rejection_reason,
         s.disbursed_by, s.disbursed_at,
         COALESCE(s.sponsor_name, u.full_name) AS company_name,
         COALESCE(s.plot_owner, p.farmer_name) AS farmer_name,
         p.coffee_type, p.elevation,
         cu.full_name AS curated_by_name,
         au.full_name AS approved_by_name,
         ru.full_name AS rejected_by_name,
         du.full_name AS disbursed_by_name
  FROM sponsorships s
  LEFT JOIN users u ON s.sponsor_id = u.id
  LEFT JOIN coffee_plots p ON s.plot_id = p.id
  LEFT JOIN users cu ON s.curated_by = cu.id
  LEFT JOIN users au ON s.approved_by = au.id
  LEFT JOIN users ru ON s.rejected_by = ru.id
  LEFT JOIN users du ON s.disbursed_by = du.id
`;

const mapSponsorship = (row) => ({
  ...row,
  sponsor_name: row.company_name || row.sponsor_name || 'Sponsor',
  plot_owner: row.farmer_name || row.plot_owner || '-',
  amount: row.funding_amount,
});

export const getSponsorships = async (req, res) => {
  try {
    const result = await pool.query(
      `${SPONSORSHIP_SELECT} WHERE s.deleted_at IS NULL ORDER BY s.id DESC`
    );
    return res.status(200).json(result.rows.map(mapSponsorship));
  } catch (err) {
    console.error('Fetch sponsorships database query exception:', err);
    return res.status(500).json({ error: 'Internal server error while fetching sponsorships data.' });
  }
};

export const createSponsorship = async (req, res) => {
  const { sponsor_name, contact, plot_id, funding_amount, proposal_url } = req.body;

  if (!sponsor_name || !plot_id || funding_amount === undefined) {
    return res.status(400).json({
      error: 'Nama perusahaan, lahan target, dan nominal pendanaan wajib diisi.',
    });
  }

  const amount = Number(funding_amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Nominal pendanaan harus lebih besar dari nol.' });
  }

  const storedProposal = req.file ? `/uploads/${req.file.filename}` : proposal_url;
  if (!storedProposal) {
    return res.status(400).json({ error: 'Dokumen proposal PDF wajib diunggah.' });
  }

  try {
    const plot = await pool.query(
      'SELECT id, farmer_name FROM coffee_plots WHERE id = $1 AND deleted_at IS NULL',
      [plot_id]
    );
    if (plot.rows.length === 0) {
      return res.status(404).json({ error: 'Lahan target tidak ditemukan.' });
    }

    const sponsorId = req.user ? req.user.id : null;
    const result = await pool.query(
      `INSERT INTO sponsorships
         (sponsor_id, sponsor_name, contact, plot_id, plot_owner, proposal_url, funding_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
       RETURNING *`,
      [sponsorId, sponsor_name, contact || null, plot_id, plot.rows[0].farmer_name, storedProposal, amount]
    );

    return res.status(201).json({
      message: 'Proposal sponsorship berhasil dikirim dan menunggu kurasi Karang Taruna.',
      sponsorship: mapSponsorship(result.rows[0]),
    });
  } catch (err) {
    console.error('Insert B2B sponsorship query database exception:', err);
    return res.status(500).json({ error: 'Internal server error while creating sponsorship proposal.' });
  }
};

const transition = async (req, res, {
  fromStatus,
  toStatus,
  allowedRoles,
  setClause,
  extraValues,
  notFoundMessage,
  conflictMessage,
  successMessage,
}) => {
  const { id } = req.params;
  const role = req.user ? req.user.role : null;
  if (!role || !allowedRoles.includes(role)) {
    return res.status(403).json({ error: 'Access denied: insufficient permission level.' });
  }

  const reason = req.body ? req.body.reason || req.body.rejection_reason || req.body.notes : null;
  if (toStatus === 'REJECTED' && !reason) {
    return res.status(400).json({ error: 'Alasan penolakan wajib diisi.' });
  }

  try {
    const values = [id, fromStatus, req.user.id, ...extraValues(reason)];
    const result = await pool.query(
      `UPDATE sponsorships
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = $2 AND deleted_at IS NULL
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      const exists = await pool.query(
        'SELECT status FROM sponsorships WHERE id = $1 AND deleted_at IS NULL',
        [id]
      );
      if (exists.rows.length === 0) {
        return res.status(404).json({ error: notFoundMessage });
      }
      return res.status(409).json({
        error: `${conflictMessage} Status saat ini: ${exists.rows[0].status}.`,
      });
    }

    return res.status(200).json({
      message: successMessage,
      sponsorship: mapSponsorship(result.rows[0]),
    });
  } catch (err) {
    console.error('Sponsorship transition error:', err);
    return res.status(500).json({ error: 'Internal server error while updating sponsorship status.' });
  }
};

export const curateSponsorship = (req, res) =>
  transition(req, res, {
    fromStatus: 'PENDING',
    toStatus: 'CURATED',
    allowedRoles: ['admin'],
    setClause: 'status = \'CURATED\', curated_by = $3, curated_at = CURRENT_TIMESTAMP, curation_notes = $4',
    extraValues: (reason) => [reason || null],
    notFoundMessage: 'Proposal sponsorship tidak ditemukan.',
    conflictMessage: 'Hanya proposal berstatus PENDING yang dapat dikurasi.',
    successMessage: 'Proposal lolos kurasi dan diteruskan ke Kepala Desa.',
  });

export const approveSponsorship = (req, res) =>
  transition(req, res, {
    fromStatus: 'CURATED',
    toStatus: 'APPROVED',
    allowedRoles: ['village'],
    setClause: 'status = \'APPROVED\', approved_by = $3, approved_at = CURRENT_TIMESTAMP',
    extraValues: () => [],
    notFoundMessage: 'Proposal sponsorship tidak ditemukan.',
    conflictMessage: 'Hanya proposal yang sudah dikurasi yang dapat disetujui.',
    successMessage: 'Sponsorship disetujui dan ditandatangani oleh Kepala Desa.',
  });

export const rejectSponsorship = (req, res) =>
  transition(req, res, {
    fromStatus: 'PENDING',
    toStatus: 'REJECTED',
    allowedRoles: ['admin'],
    setClause: 'status = \'REJECTED\', rejected_by = $3, rejected_at = CURRENT_TIMESTAMP, rejection_reason = $4',
    extraValues: (reason) => [reason],
    notFoundMessage: 'Proposal sponsorship tidak ditemukan.',
    conflictMessage: 'Hanya proposal PENDING yang dapat ditolak saat kurasi.',
    successMessage: 'Proposal sponsorship ditolak pada tahap kurasi.',
  });

export const rejectCuratedSponsorship = (req, res) =>
  transition(req, res, {
    fromStatus: 'CURATED',
    toStatus: 'REJECTED',
    allowedRoles: ['village'],
    setClause: 'status = \'REJECTED\', rejected_by = $3, rejected_at = CURRENT_TIMESTAMP, rejection_reason = $4',
    extraValues: (reason) => [reason],
    notFoundMessage: 'Proposal sponsorship tidak ditemukan.',
    conflictMessage: 'Hanya proposal berstatus CURATED yang dapat ditolak Kepala Desa.',
    successMessage: 'Proposal sponsorship ditolak oleh Kepala Desa.',
  });

export const disburseSponsorship = (req, res) =>
  transition(req, res, {
    fromStatus: 'APPROVED',
    toStatus: 'DISBURSED',
    allowedRoles: ['village'],
    setClause: 'status = \'DISBURSED\', disbursed_by = $3, disbursed_at = CURRENT_TIMESTAMP',
    extraValues: () => [],
    notFoundMessage: 'Proposal sponsorship tidak ditemukan.',
    conflictMessage: 'Hanya sponsorship APPROVED yang dapat dicairkan.',
    successMessage: 'Dana sponsorship ditandai telah dicairkan.',
  });
