import pool from './db.js';

const SOS_STATUSES = ['ALERT_ACTIVE', 'DISPATCHED', 'RESOLVED'];

export const createSosAlert = async (req, res) => {
  const { latitude, longitude, notes } = req.body;
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return res.status(400).json({ error: 'Koordinat GPS pengguna tidak valid.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO emergency_sos_alerts (latitude, longitude, notes)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [lat, lng, notes || null]
    );
    return res.status(201).json({
      status: 'SUCCESS',
      message: 'Sinyal SOS tercatat dan diteruskan ke Admin Karang Taruna.',
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Create SOS alert error:', err);
    return res.status(500).json({ error: 'Gagal menyimpan sinyal darurat SOS.' });
  }
};

export const getSosAlerts = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM emergency_sos_alerts WHERE deleted_at IS NULL ORDER BY created_at DESC, id DESC'
    );
    return res.status(200).json({ status: 'SUCCESS', data: result.rows });
  } catch (err) {
    console.error('Fetch SOS alerts error:', err);
    return res.status(500).json({ error: 'Gagal mengambil data sinyal SOS.' });
  }
};

export const updateSosStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!SOS_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Status SOS tidak valid.' });
  }

  try {
    const result = await pool.query(
      `UPDATE emergency_sos_alerts SET status = $1
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sinyal SOS tidak ditemukan.' });
    }
    return res.status(200).json({ status: 'SUCCESS', data: result.rows[0] });
  } catch (err) {
    console.error('Update SOS status error:', err);
    return res.status(500).json({ error: 'Gagal memperbarui status SOS.' });
  }
};
