import pool from './db.js';

const normalizeImages = (images, fallback) => {
  const list = Array.isArray(images)
    ? images.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)
    : [];
  if (list.length === 0 && fallback) list.push(fallback);
  return list;
};

const mapDestination = (row) => {
  const images = Array.isArray(row.images) && row.images.length > 0
    ? row.images
    : (row.img_url ? [row.img_url] : []);
  return {
    ...row,
    img: images[0] || row.img_url,
    images,
    desc: row.description,
  };
};

export const getDestinations = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tourist_destinations WHERE deleted_at IS NULL ORDER BY id ASC'
    );
    return res.status(200).json({ status: 'SUCCESS', data: result.rows.map(mapDestination) });
  } catch (err) {
    console.error('Fetch destinations error:', err);
    return res.status(500).json({ error: 'Gagal mengambil data destinasi wisata.' });
  }
};

export const createDestination = async (req, res) => {
  const {
    name, tag, elevation, price, hours, img_url, images,
    guide_name, guide_phone, description, highlights,
  } = req.body;
  const gallery = normalizeImages(images, img_url);

  if (!name || !tag || gallery.length === 0 || !description) {
    return res.status(400).json({ error: 'Nama, tag, gambar, dan deskripsi destinasi wajib diisi.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tourist_destinations
         (name, tag, elevation, price, hours, img_url, description, highlights, images, guide_name, guide_phone)
       VALUES ($1, $2, COALESCE($3, '950 MDPL'), COALESCE($4, 'Rp 15.000 / orang'),
               COALESCE($5, '08:00 - 18:00 WIB'), $6, $7, $8, $9::text[],
               NULLIF($10, ''), NULLIF($11, ''))
       RETURNING *`,
      [
        name, tag, elevation, price, hours, gallery[0], description,
        Array.isArray(highlights) ? highlights : [], gallery,
        guide_name || '', guide_phone || '',
      ]
    );
    return res.status(201).json({ status: 'SUCCESS', data: mapDestination(result.rows[0]) });
  } catch (err) {
    console.error('Create destination error:', err);
    return res.status(500).json({ error: 'Gagal menyimpan destinasi wisata.' });
  }
};

export const updateDestination = async (req, res) => {
  const { id } = req.params;
  const {
    name, tag, elevation, price, hours, img_url, images,
    guide_name, guide_phone, description, highlights,
  } = req.body;
  const gallery = normalizeImages(images, img_url);

  try {
    const result = await pool.query(
      `UPDATE tourist_destinations
       SET name = COALESCE($1, name), tag = COALESCE($2, tag), elevation = COALESCE($3, elevation),
           price = COALESCE($4, price), hours = COALESCE($5, hours),
           img_url = COALESCE($6, img_url), description = COALESCE($7, description),
           highlights = COALESCE($8, highlights),
           images = COALESCE($9::text[], images),
           guide_name = COALESCE($10, guide_name), guide_phone = COALESCE($11, guide_phone),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $12 AND deleted_at IS NULL
       RETURNING *`,
      [
        name, tag, elevation, price, hours, gallery[0] || null, description,
        Array.isArray(highlights) ? highlights : null,
        gallery.length > 0 ? gallery : null,
        guide_name === undefined ? null : guide_name,
        guide_phone === undefined ? null : guide_phone,
        id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Destinasi tidak ditemukan.' });
    }
    return res.status(200).json({ status: 'SUCCESS', data: mapDestination(result.rows[0]) });
  } catch (err) {
    console.error('Update destination error:', err);
    return res.status(500).json({ error: 'Gagal memperbarui destinasi wisata.' });
  }
};

export const deleteDestination = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE tourist_destinations SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Destinasi tidak ditemukan.' });
    }
    return res.status(200).json({ status: 'SUCCESS', message: 'Destinasi dihapus (soft delete).' });
  } catch (err) {
    console.error('Delete destination error:', err);
    return res.status(500).json({ error: 'Gagal menghapus destinasi wisata.' });
  }
};
