import pool from './db.js';

const VALID_PROCESS_METHODS = ['Natural Process', 'Full Washed', 'Honey Process', 'Wet Hulled'];
const VALID_BATCH_STATUSES = ['Pengeringan', 'Gudang Green Bean', 'Siap Kirim', 'Terjual'];
const VALID_GRADES = ['Specialty Grade', 'Commercial Grade'];
const FORMULA_VERSION = 'MLR-v1.2-Kucur';

const BATCH_COLUMNS = `
  b.id, b.batch_code, b.plot_id, b.weight_kg, b.drying_days, b.grade,
  b.process_method, b.cupping_score, b.status, b.harvest_date, b.created_at,
  p.farmer_name, p.coffee_type, p.elevation,
  (p.geom)[0] AS lng, (p.geom)[1] AS lat
`;

const BATCH_FROM = `
  FROM harvest_batches b
  LEFT JOIN coffee_plots p ON b.plot_id = p.id AND p.deleted_at IS NULL
`;

const BATCH_SELECT = `SELECT ${BATCH_COLUMNS} ${BATCH_FROM}`;

const BATCH_PAGE_SIZE = 8;
const MAX_BATCH_PAGE_SIZE = 100;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const toSearchPattern = (value) => {
  const term = String(value || '').trim().slice(0, 100);
  if (!term) return '';
  return `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
};

// GET /api/scm/batches?page=1&pageSize=8&search=
export const getScmBatches = async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1);
  const pageSize = Math.min(parsePositiveInt(req.query.pageSize, BATCH_PAGE_SIZE), MAX_BATCH_PAGE_SIZE);
  const searchPattern = toSearchPattern(req.query.search);

  try {
    const [summaryResult, countResult] = await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS total_batches,
               COALESCE(SUM(b.weight_kg), 0)::float8 AS total_weight_kg,
               COALESCE(SUM(b.weight_kg) FILTER (WHERE b.status IN ('Gudang Green Bean', 'Siap Kirim')), 0)::float8 AS green_bean_stock_kg,
               COUNT(*) FILTER (WHERE b.grade = 'Specialty Grade')::int AS specialty_count
        FROM harvest_batches b
        WHERE b.deleted_at IS NULL
      `),
      pool.query(
        `SELECT COUNT(*)::int AS total
         ${BATCH_FROM}
         WHERE b.deleted_at IS NULL
           AND ($1::text = '' OR b.batch_code ILIKE $1 OR p.farmer_name ILIKE $1 OR b.process_method ILIKE $1)`,
        [searchPattern]
      ),
    ]);

    const total = countResult.rows[0]?.total || 0;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, pageCount);

    let rows = [];
    if (total > 0) {
      const result = await pool.query(
        `${BATCH_SELECT}
         WHERE b.deleted_at IS NULL
           AND ($1::text = '' OR b.batch_code ILIKE $1 OR p.farmer_name ILIKE $1 OR b.process_method ILIKE $1)
         ORDER BY b.created_at DESC, b.id DESC
         LIMIT $2 OFFSET $3`,
        [searchPattern, pageSize, (safePage - 1) * pageSize]
      );
      rows = result.rows;
    }

    return res.status(200).json({
      status: 'SUCCESS',
      data: rows,
      pagination: { page: safePage, pageSize, pageCount, total },
      summary: summaryResult.rows[0],
      formula_version: FORMULA_VERSION,
    });
  } catch (err) {
    console.error('Fetch SCM batches error:', err);
    return res.status(500).json({ error: 'Gagal mengambil data batch panen.' });
  }
};

// POST /api/scm/batches
export const createScmBatch = async (req, res) => {
  const { plot_id, weight_kg, drying_days, grade, process_method, cupping_score, status, harvest_date } = req.body;

  if (!plot_id) {
    return res.status(400).json({ error: 'Lahan (plot_id) wajib dipilih untuk mencatat batch panen.' });
  }

  const weight = Number(weight_kg);
  const drying = drying_days === undefined ? 14 : Number(drying_days);
  const cupping = cupping_score === undefined || cupping_score === '' ? null : Number(cupping_score);
  const method = process_method || 'Natural Process';
  const batchStatus = status || 'Pengeringan';
  const batchGrade = grade || 'Specialty Grade';

  if (!Number.isFinite(weight) || weight <= 0) {
    return res.status(400).json({ error: 'Berat panen harus lebih besar dari nol.' });
  }
  if (!Number.isInteger(drying) || drying < 0 || drying > 60) {
    return res.status(400).json({ error: 'Lama pengeringan harus 0-60 hari.' });
  }
  if (!VALID_PROCESS_METHODS.includes(method)) {
    return res.status(400).json({ error: 'Metode proses tidak valid.' });
  }
  if (!VALID_BATCH_STATUSES.includes(batchStatus)) {
    return res.status(400).json({ error: 'Status batch tidak valid.' });
  }
  if (!VALID_GRADES.includes(batchGrade)) {
    return res.status(400).json({ error: 'Grade kopi tidak valid.' });
  }
  if (cupping !== null && (!Number.isFinite(cupping) || cupping < 0 || cupping > 100)) {
    return res.status(400).json({ error: 'Skor cupping harus 0-100.' });
  }

  try {
    const plot = await pool.query(
      'SELECT id FROM coffee_plots WHERE id = $1 AND deleted_at IS NULL',
      [plot_id]
    );
    if (plot.rows.length === 0) {
      return res.status(404).json({ error: 'Lahan panen tidak ditemukan.' });
    }

    const seq = await pool.query("SELECT nextval('harvest_batch_code_seq') AS seq");
    const year = new Date().getFullYear();
    const batchCode = `KCR-${year}-${String(seq.rows[0].seq).padStart(3, '0')}`;

    const result = await pool.query(
      `WITH inserted AS (
         INSERT INTO harvest_batches
           (batch_code, plot_id, weight_kg, drying_days, grade, process_method, cupping_score, status, harvest_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, CURRENT_DATE))
         RETURNING *
       )
       SELECT i.id, i.batch_code, i.plot_id, i.weight_kg, i.drying_days, i.grade,
              i.process_method, i.cupping_score, i.status, i.harvest_date, i.created_at,
              p.farmer_name, p.coffee_type, p.elevation,
              (p.geom)[0] AS lng, (p.geom)[1] AS lat
       FROM inserted i
       LEFT JOIN coffee_plots p ON i.plot_id = p.id`,
      [batchCode, plot_id, weight, drying, batchGrade, method, cupping, batchStatus, harvest_date || null]
    );

    return res.status(201).json({ status: 'SUCCESS', data: result.rows[0] });
  } catch (err) {
    console.error('Create SCM batch error:', err);
    return res.status(500).json({ error: 'Gagal menyimpan batch panen.' });
  }
};

const buildTraceability = (batch) => {
  const baseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  const traceUrl = `${baseUrl.replace(/\/$/, '')}/trace/${encodeURIComponent(batch.batch_code)}`;
  return {
    ...batch,
    origin_village: 'Desa Kucur, Kec. Dau, Kab. Malang',
    origin_coordinates:
      batch.lat !== null && batch.lng !== null ? { lat: Number(batch.lat), lng: Number(batch.lng) } : null,
    elevation_mdpl: batch.elevation,
    certification: 'Organik Desa Kucur & Indikasi Geografis Gunung Kawi',
    trace_url: traceUrl,
    qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(traceUrl)}`,
  };
};

// GET /api/scm/traceability/:batchCode
export const getTraceability = async (req, res) => {
  const { batchCode } = req.params;
  try {
    const result = await pool.query(
      `${BATCH_SELECT} WHERE LOWER(b.batch_code) = LOWER($1) AND b.deleted_at IS NULL`,
      [batchCode]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'ERROR', message: 'Batch SCM tidak ditemukan' });
    }
    return res.status(200).json({ status: 'SUCCESS', data: buildTraceability(result.rows[0]) });
  } catch (err) {
    console.error('Traceability query error:', err);
    return res.status(500).json({ error: 'Gagal mengambil data traceability.' });
  }
};

// GET /api/scm/offtakers
export const getOfftakers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM scm_contracts WHERE deleted_at IS NULL ORDER BY created_at DESC, id DESC'
    );
    return res.status(200).json({ status: 'SUCCESS', data: result.rows });
  } catch (err) {
    console.error('Fetch SCM contracts error:', err);
    return res.status(500).json({ error: 'Gagal mengambil data kontrak offtaker.' });
  }
};

// POST /api/scm/offtakers
export const createOfftaker = async (req, res) => {
  const { buyer_name, coffee_type, volume_kg, price_per_kg, delivery_date } = req.body;

  if (!buyer_name || !delivery_date) {
    return res.status(400).json({ error: 'Nama pembeli dan tanggal pengiriman wajib diisi.' });
  }

  const volume = Number(volume_kg);
  const price = Number(price_per_kg);
  if (!Number.isFinite(volume) || volume <= 0) {
    return res.status(400).json({ error: 'Volume kontrak harus lebih besar dari nol.' });
  }
  if (!Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ error: 'Harga per kg harus lebih besar dari nol.' });
  }

  try {
    const seq = await pool.query("SELECT nextval('scm_contract_code_seq') AS seq");
    const year = new Date().getFullYear();
    const contractCode = `CTR-${year}-${String(seq.rows[0].seq).padStart(2, '0')}`;

    const result = await pool.query(
      `INSERT INTO scm_contracts
         (contract_code, buyer_name, coffee_type, volume_kg, price_per_kg, total_value, delivery_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'AKTIF')
       RETURNING *`,
      [contractCode, buyer_name, coffee_type || null, volume, price, volume * price, delivery_date]
    );

    return res.status(201).json({ status: 'SUCCESS', data: result.rows[0] });
  } catch (err) {
    console.error('Create SCM contract error:', err);
    return res.status(500).json({ error: 'Gagal menyimpan kontrak offtaker.' });
  }
};

// GET /api/scm/forecast
// Real series derived from recorded contracts; no hardcoded price history.
export const getForecast = async (req, res) => {
  try {
    const history = await pool.query(`
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS period,
             ROUND(AVG(price_per_kg) FILTER (WHERE coffee_type ILIKE 'Arabica%')) AS arabica,
             ROUND(AVG(price_per_kg) FILTER (WHERE coffee_type ILIKE 'Robusta%')) AS robusta
      FROM scm_contracts
      WHERE deleted_at IS NULL AND created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '7 months'
      GROUP BY date_trunc('month', created_at)
      ORDER BY date_trunc('month', created_at) ASC
    `);

    const upcoming = await pool.query(`
      SELECT to_char(date_trunc('month', delivery_date), 'YYYY-MM') AS period,
             SUM(volume_kg) AS forecast_kg,
             ROUND(AVG(price_per_kg)) AS price_projected,
             STRING_AGG(DISTINCT buyer_name, ', ') AS target_buyer
      FROM scm_contracts
      WHERE deleted_at IS NULL AND status = 'AKTIF' AND delivery_date >= CURRENT_DATE
      GROUP BY date_trunc('month', delivery_date)
      ORDER BY date_trunc('month', delivery_date) ASC
    `);

    return res.status(200).json({
      status: 'SUCCESS',
      data: {
        basis: 'Realisasi harga & volume kontrak offtaker tersimpan',
        price_history: history.rows.map((r) => ({
          month: r.period,
          arabica: r.arabica === null ? null : Number(r.arabica),
          robusta: r.robusta === null ? null : Number(r.robusta),
        })),
        demand_forecast: upcoming.rows.map((r) => ({
          month: r.period,
          forecast_kg: Number(r.forecast_kg),
          price_projected: Number(r.price_projected),
          target_buyer: r.target_buyer,
        })),
      },
    });
  } catch (err) {
    console.error('Forecast query error:', err);
    return res.status(500).json({ error: 'Gagal menghitung proyeksi SCM.' });
  }
};
