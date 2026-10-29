import pool from './db.js';

const FARMER_CTE = `
  WITH plot_agg AS (
    SELECT LOWER(TRIM(p.farmer_name)) AS farmer_key,
           MIN(p.farmer_name) AS farmer_name,
           COUNT(p.id)::int AS plot_count,
           COALESCE(SUM(p.land_area), 0)::float8 AS total_land_area,
           MIN(p.elevation)::int AS min_elevation,
           MAX(p.elevation)::int AS max_elevation,
           COALESCE(SUM(p.tree_count), 0)::int AS total_trees,
           COALESCE(SUM(p.predicted_yield), 0)::float8 AS predicted_yield,
           STRING_AGG(DISTINCT p.coffee_type, ', ') AS coffee_types,
           ARRAY_AGG(p.id ORDER BY p.id) AS plot_ids
    FROM coffee_plots p
    WHERE p.deleted_at IS NULL
    GROUP BY LOWER(TRIM(p.farmer_name))
  ),
  harvest_agg AS (
    SELECT LOWER(TRIM(p.farmer_name)) AS farmer_key,
           COUNT(b.id)::int AS batch_count,
           COALESCE(SUM(b.weight_kg), 0)::float8 AS harvest_kg,
           MAX(b.harvest_date) AS last_harvest_date
    FROM harvest_batches b
    JOIN coffee_plots p ON p.id = b.plot_id
    WHERE b.deleted_at IS NULL AND p.deleted_at IS NULL
    GROUP BY LOWER(TRIM(p.farmer_name))
  ),
  merged AS (
    SELECT f.id, f.name AS farmer_name, f.phone, f.address, f.notes,
           true AS registered, LOWER(TRIM(f.name)) AS farmer_key
    FROM farmers f
    WHERE f.deleted_at IS NULL
    UNION ALL
    SELECT NULL, pa.farmer_name, NULL, NULL, NULL, false, pa.farmer_key
    FROM plot_agg pa
    WHERE NOT EXISTS (
      SELECT 1 FROM farmers f2
      WHERE f2.deleted_at IS NULL AND LOWER(TRIM(f2.name)) = pa.farmer_key
    )
  )
`;

const FARMER_FROM = `
  FROM merged m
  LEFT JOIN plot_agg pa ON pa.farmer_key = m.farmer_key
  LEFT JOIN harvest_agg ha ON ha.farmer_key = m.farmer_key
`;

const FARMER_PAGE_SIZE = 10;
const MAX_FARMER_PAGE_SIZE = 100;

const normalizeName = (name) => String(name || '').trim().toLowerCase();

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const toSearchPattern = (value) => {
  const term = String(value || '').trim().slice(0, 100);
  if (!term) return '';
  return `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
};

export const getFarmersList = async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1);
  const pageSize = Math.min(parsePositiveInt(req.query.pageSize, FARMER_PAGE_SIZE), MAX_FARMER_PAGE_SIZE);
  const searchPattern = toSearchPattern(req.query.search);

  try {
    const [summaryResult, countResult] = await Promise.all([
      pool.query(
        `${FARMER_CTE}
         SELECT COUNT(*)::int AS total_farmers,
                COALESCE(SUM(COALESCE(pa.total_land_area, 0)), 0)::float8 AS total_land_area,
                COALESCE(SUM(COALESCE(pa.total_trees, 0)), 0)::int AS total_trees,
                COALESCE(SUM(COALESCE(pa.predicted_yield, 0)), 0)::float8 AS predicted_yield,
                COALESCE(SUM(COALESCE(ha.harvest_kg, 0)), 0)::float8 AS harvest_kg
         ${FARMER_FROM}`
      ),
      pool.query(
        `${FARMER_CTE}
         SELECT COUNT(*)::int AS total
         FROM merged m
         WHERE ($1::text = '' OR m.farmer_name ILIKE $1)`,
        [searchPattern]
      ),
    ]);

    const total = countResult.rows[0]?.total || 0;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, pageCount);

    let rows = [];
    if (total > 0) {
      const result = await pool.query(
        `${FARMER_CTE}
         SELECT m.id, m.farmer_name, m.phone, m.address, m.notes, m.registered,
                COALESCE(pa.plot_count, 0)::int AS plot_count,
                COALESCE(pa.total_land_area, 0)::float8 AS total_land_area,
                pa.min_elevation,
                pa.max_elevation,
                COALESCE(pa.total_trees, 0)::int AS total_trees,
                COALESCE(pa.predicted_yield, 0)::float8 AS predicted_yield,
                pa.coffee_types,
                COALESCE(pa.plot_ids, ARRAY[]::int[]) AS plot_ids,
                COALESCE(ha.batch_count, 0)::int AS batch_count,
                COALESCE(ha.harvest_kg, 0)::float8 AS harvest_kg,
                ha.last_harvest_date
         ${FARMER_FROM}
         WHERE ($1::text = '' OR m.farmer_name ILIKE $1)
         ORDER BY LOWER(m.farmer_name) ASC, m.farmer_name ASC
         LIMIT $2 OFFSET $3`,
        [searchPattern, pageSize, (safePage - 1) * pageSize]
      );
      rows = result.rows;
    }

    return res.status(200).json({
      data: rows,
      pagination: { page: safePage, pageSize, pageCount, total },
      summary: summaryResult.rows[0],
    });
  } catch (err) {
    console.error('Fetch farmer list query exception:', err);
    return res.status(500).json({ error: 'Internal server error while fetching farmer list.' });
  }
};

export const getFarmerOptions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, phone
       FROM farmers
       WHERE deleted_at IS NULL
       ORDER BY LOWER(name) ASC, name ASC`
    );
    return res.status(200).json({ data: result.rows });
  } catch (err) {
    console.error('Fetch farmer options exception:', err);
    return res.status(500).json({ error: 'Internal server error while fetching farmer options.' });
  }
};

const PHONE_PATTERN = /^[+0-9][0-9+\-\s()]{5,19}$/;

const parseFarmerPayload = (body) => {
  const name = String(body?.name || '').trim();
  const phone = String(body?.phone || '').trim();
  const address = String(body?.address || '').trim();
  const notes = String(body?.notes || '').trim();

  if (name.length < 2 || name.length > 100) {
    return { error: 'Nama petani wajib diisi (2-100 karakter).' };
  }
  if (phone && !PHONE_PATTERN.test(phone)) {
    return { error: 'Nomor HP tidak valid.' };
  }

  return { name, phone: phone || null, address: address || null, notes: notes || null };
};

const parseFarmerId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const createFarmer = async (req, res) => {
  const payload = parseFarmerPayload(req.body);
  if (payload.error) {
    return res.status(400).json({ error: payload.error });
  }

  try {
    const result = await pool.query(
      `INSERT INTO farmers (name, phone, address, notes, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, phone, address, notes, created_at`,
      [payload.name, payload.phone, payload.address, payload.notes, req.user ? req.user.id : null]
    );

    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Petani dengan nama tersebut sudah terdaftar.' });
    }
    console.error('Create farmer exception:', err);
    return res.status(500).json({ error: 'Internal server error while creating farmer.' });
  }
};

export const updateFarmer = async (req, res) => {
  const id = parseFarmerId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'ID petani tidak valid.' });
  }

  const payload = parseFarmerPayload(req.body);
  if (payload.error) {
    return res.status(400).json({ error: payload.error });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT id, name FROM farmers WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
      [id]
    );
    if (existing.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Petani tidak ditemukan.' });
    }

    const oldName = existing.rows[0].name;
    const renamed = normalizeName(payload.name) !== normalizeName(oldName);

    if (renamed) {
      const nameTaken = await client.query(
        `SELECT 1 FROM farmers
         WHERE deleted_at IS NULL AND id <> $1 AND LOWER(name) = LOWER($2)`,
        [id, payload.name]
      );
      if (nameTaken.rowCount > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Nama petani sudah dipakai petani lain.' });
      }

      const plotTaken = await client.query(
        `SELECT 1 FROM coffee_plots
         WHERE deleted_at IS NULL AND LOWER(TRIM(farmer_name)) = LOWER($1)`,
        [payload.name]
      );
      if (plotTaken.rowCount > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Nama sudah dipakai pada lahan petani lain.' });
      }

      await client.query(
        `UPDATE coffee_plots
         SET farmer_name = $1, updated_at = CURRENT_TIMESTAMP
         WHERE deleted_at IS NULL AND LOWER(TRIM(farmer_name)) = LOWER($2)`,
        [payload.name, oldName]
      );
    }

    const result = await client.query(
      `UPDATE farmers
       SET name = $1, phone = $2, address = $3, notes = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, name, phone, address, notes, updated_at`,
      [payload.name, payload.phone, payload.address, payload.notes, id]
    );

    await client.query('COMMIT');
    return res.status(200).json({ data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Nama petani sudah dipakai petani lain.' });
    }
    console.error('Update farmer exception:', err);
    return res.status(500).json({ error: 'Internal server error while updating farmer.' });
  } finally {
    client.release();
  }
};

export const deleteFarmer = async (req, res) => {
  const id = parseFarmerId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'ID petani tidak valid.' });
  }

  try {
    const existing = await pool.query(
      `SELECT id, name FROM farmers WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    if (existing.rowCount === 0) {
      return res.status(404).json({ error: 'Petani tidak ditemukan.' });
    }

    const plots = await pool.query(
      `SELECT COUNT(*)::int AS count FROM coffee_plots
       WHERE deleted_at IS NULL AND LOWER(TRIM(farmer_name)) = LOWER($1)`,
      [existing.rows[0].name]
    );
    if (plots.rows[0].count > 0) {
      return res.status(409).json({
        error: `Petani masih memiliki ${plots.rows[0].count} lahan aktif. Hapus atau ubah lahan tersebut terlebih dahulu.`,
      });
    }

    const result = await pool.query(
      `UPDATE farmers
       SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, name, deleted_at`,
      [id]
    );

    return res.status(200).json({ data: result.rows[0] });
  } catch (err) {
    console.error('Delete farmer exception:', err);
    return res.status(500).json({ error: 'Internal server error while deleting farmer.' });
  }
};
