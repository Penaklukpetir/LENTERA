import pool from './db.js';

const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

export const getTourGuides = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tour_guides WHERE deleted_at IS NULL AND status <> 'OFFLINE' ORDER BY rating DESC, id ASC"
    );
    return res.status(200).json({ status: 'SUCCESS', data: result.rows });
  } catch (err) {
    console.error('Fetch tour guides error:', err);
    return res.status(500).json({ error: 'Gagal mengambil data pemandu wisata.' });
  }
};

export const createGuideBooking = async (req, res) => {
  const { guide_id, visitor_name, phone, visit_date, visitors_count, target_dest, notes } = req.body;

  if (!visitor_name || !phone || !visit_date) {
    return res.status(400).json({ error: 'Nama, nomor telepon, dan tanggal kunjungan wajib diisi.' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(visit_date) || Number.isNaN(Date.parse(visit_date))) {
    return res.status(400).json({ error: 'Format tanggal kunjungan harus YYYY-MM-DD.' });
  }

  const visitors = visitors_count === undefined || visitors_count === null || visitors_count === ''
    ? 1
    : Number(visitors_count);
  if (!Number.isInteger(visitors) || visitors < 1) {
    return res.status(400).json({ error: 'Jumlah pengunjung minimal 1 orang.' });
  }

  try {
    if (guide_id) {
      const guide = await pool.query(
        'SELECT id FROM tour_guides WHERE id = $1 AND deleted_at IS NULL',
        [guide_id]
      );
      if (guide.rows.length === 0) {
        return res.status(404).json({ error: 'Pemandu wisata tidak ditemukan.' });
      }
    }

    const result = await pool.query(
      `INSERT INTO guide_bookings
         (guide_id, visitor_name, phone, visit_date, visitors_count, target_dest, notes)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'Semua Destinasi'), $7)
       RETURNING *`,
      [guide_id || null, visitor_name, phone, visit_date, visitors, target_dest, notes || null]
    );

    return res.status(201).json({
      status: 'SUCCESS',
      message: 'Permintaan pemandu wisata tercatat dan menunggu konfirmasi Pokdarwis.',
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Create guide booking error:', err);
    return res.status(500).json({ error: 'Gagal menyimpan permintaan pemandu wisata.' });
  }
};

export const getGuideBookings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, g.guide_name, g.phone_number AS guide_phone
       FROM guide_bookings b
       LEFT JOIN tour_guides g ON b.guide_id = g.id
       WHERE b.deleted_at IS NULL
       ORDER BY b.created_at DESC, b.id DESC`
    );
    return res.status(200).json({ status: 'SUCCESS', data: result.rows });
  } catch (err) {
    console.error('Fetch guide bookings error:', err);
    return res.status(500).json({ error: 'Gagal mengambil data pemesanan pemandu.' });
  }
};

export const updateGuideBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!BOOKING_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Status pemesanan tidak valid.' });
  }

  try {
    const result = await pool.query(
      `UPDATE guide_bookings SET status = $1
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pemesanan pemandu tidak ditemukan.' });
    }
    return res.status(200).json({ status: 'SUCCESS', data: result.rows[0] });
  } catch (err) {
    console.error('Update guide booking status error:', err);
    return res.status(500).json({ error: 'Gagal memperbarui status pemesanan pemandu.' });
  }
};
