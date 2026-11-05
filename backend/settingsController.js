import pool from './db.js';

const normalizePhone = (value) => {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith('8')) digits = `62${digits}`;
  return digits;
};

const isValidPhone = (value) => /^62\d{8,13}$/.test(value);

const readSettings = async () => {
  const result = await pool.query(
    'SELECT sos_phone, guide_phone, updated_at FROM village_settings WHERE id = 1'
  );
  return result.rows[0] || { sos_phone: '', guide_phone: '', updated_at: null };
};

export const getPublicSettings = async (req, res) => {
  try {
    const settings = await readSettings();
    return res.status(200).json({
      status: 'SUCCESS',
      data: { sos_phone: settings.sos_phone, guide_phone: settings.guide_phone },
    });
  } catch (err) {
    console.error('Fetch public settings error:', err);
    return res.status(500).json({ error: 'Gagal mengambil pengaturan desa.' });
  }
};

export const getVillageSettings = async (req, res) => {
  try {
    return res.status(200).json({ status: 'SUCCESS', data: await readSettings() });
  } catch (err) {
    console.error('Fetch village settings error:', err);
    return res.status(500).json({ error: 'Gagal mengambil pengaturan desa.' });
  }
};

export const updateVillageSettings = async (req, res) => {
  const sosPhone = normalizePhone(req.body.sos_phone);
  const guidePhone = normalizePhone(req.body.guide_phone);

  if (!isValidPhone(sosPhone)) {
    return res.status(400).json({ error: 'Nomor WhatsApp SOS tidak valid. Contoh: 081234567890.' });
  }
  if (guidePhone && !isValidPhone(guidePhone)) {
    return res.status(400).json({ error: 'Nomor WhatsApp pemandu tidak valid. Contoh: 081234567890.' });
  }

  try {
    const result = await pool.query(
      `UPDATE village_settings
       SET sos_phone = $1, guide_phone = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = 1
       RETURNING sos_phone, guide_phone, updated_at`,
      [sosPhone, guidePhone]
    );
    return res.status(200).json({ status: 'SUCCESS', data: result.rows[0] });
  } catch (err) {
    console.error('Update village settings error:', err);
    return res.status(500).json({ error: 'Gagal menyimpan pengaturan desa.' });
  }
};
