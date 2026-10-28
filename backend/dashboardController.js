import pool from './db.js';

const ALLOWED_RANGES = [7, 30, 365];

const toNumber = (value) => (value === null || value === undefined ? 0 : Number(value));

const pad = (n) => String(n).padStart(2, '0');

const buildDailyBuckets = (range) => {
  const buckets = [];
  for (let offset = range - 1; offset >= 0; offset -= 1) {
    const day = new Date();
    day.setHours(12, 0, 0, 0);
    day.setDate(day.getDate() - offset);
    buckets.push({
      period: `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`,
      label: day.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    });
  }
  return buckets;
};

const buildMonthlyBuckets = (months) => {
  const buckets = [];
  const now = new Date();
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const month = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const period = `${month.getFullYear()}-${pad(month.getMonth() + 1)}`;
    buckets.push({
      period,
      label: month.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
    });
  }
  return buckets;
};

export const getDashboardSummary = async (req, res) => {
  const requested = Number(req.query.range);
  const range = ALLOWED_RANGES.includes(requested) ? requested : 30;
  const isYearly = range === 365;
  const buckets = isYearly ? buildMonthlyBuckets(12) : buildDailyBuckets(range);

  const startDate = isYearly
    ? `${buckets[0].period}-01`
    : buckets[0].period;

  const periodExpr = isYearly
    ? "to_char(date_trunc('month', harvest_date), 'YYYY-MM')"
    : "to_char(harvest_date, 'YYYY-MM-DD')";

  try {
    const [plots, sponsors, harvest, queuedGuides, sos, contracts, priceBasis, bucketsResult] =
      await Promise.all([
        pool.query(
          `SELECT COUNT(*)::int AS plots, COALESCE(SUM(predicted_yield), 0) AS predicted_yield_kg
           FROM coffee_plots WHERE deleted_at IS NULL`
        ),
        pool.query(
          `SELECT
             COUNT(*) FILTER (WHERE status IN ('APPROVED', 'DISBURSED'))::int AS active_sponsors,
             COUNT(*) FILTER (WHERE status IN ('PENDING', 'CURATED'))::int AS pending_sponsorships,
             COALESCE(SUM(funding_amount) FILTER (WHERE status IN ('APPROVED', 'DISBURSED')), 0) AS approved_funding
           FROM sponsorships WHERE deleted_at IS NULL`
        ),
        pool.query(
          `SELECT COALESCE(SUM(weight_kg), 0) AS harvest_kg, COUNT(*)::int AS batches
           FROM harvest_batches
           WHERE deleted_at IS NULL AND harvest_date >= $1`,
          [startDate]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS pending_guides FROM guide_bookings
           WHERE deleted_at IS NULL AND status = 'PENDING'`
        ),
        pool.query(
          `SELECT COUNT(*)::int AS active_sos FROM emergency_sos_alerts
           WHERE deleted_at IS NULL AND status = 'ALERT_ACTIVE'`
        ),
        pool.query(
          `SELECT COUNT(*) FILTER (WHERE status = 'AKTIF')::int AS active_contracts,
                  COALESCE(SUM(volume_kg) FILTER (WHERE status = 'AKTIF'), 0) AS contract_volume_kg
           FROM scm_contracts WHERE deleted_at IS NULL`
        ),
        pool.query(
          `SELECT COALESCE(SUM(total_value) / NULLIF(SUM(volume_kg), 0), 0) AS avg_price
           FROM scm_contracts
           WHERE deleted_at IS NULL AND status IN ('AKTIF', 'TERKIRIM')`
        ),
        pool.query(
          `SELECT ${periodExpr} AS period,
                  COALESCE(SUM(weight_kg), 0) AS harvest_kg,
                  COUNT(*)::int AS batch_count
           FROM harvest_batches
           WHERE deleted_at IS NULL AND harvest_date >= $1
           GROUP BY 1 ORDER BY 1 ASC`,
          [startDate]
        ),
      ]);

    const avgPrice = toNumber(priceBasis.rows[0].avg_price);
    const byPeriod = new Map(bucketsResult.rows.map((row) => [row.period, row]));

    const series = buckets.map(({ period, label }) => {
      const row = byPeriod.get(period);
      const harvestKg = toNumber(row?.harvest_kg);
      return {
        period,
        label,
        harvest_kg: Math.round(harvestKg * 100) / 100,
        batch_count: row ? row.batch_count : 0,
        estimated_value: Math.round(harvestKg * avgPrice),
      };
    });

    return res.status(200).json({
      status: 'SUCCESS',
      range,
      generated_at: new Date().toISOString(),
      price_basis: {
        avg_contract_price_per_kg: Math.round(avgPrice),
        note: avgPrice > 0
          ? 'Estimasi nilai memakai harga rata-rata kontrak offtaker tersimpan.'
          : 'Belum ada kontrak offtaker; estimasi nilai ditampilkan 0.',
      },
      kpi: {
        plots: plots.rows[0].plots,
        predicted_yield_kg: toNumber(plots.rows[0].predicted_yield_kg),
        harvest_kg: toNumber(harvest.rows[0].harvest_kg),
        batches: harvest.rows[0].batches,
        active_sponsors: sponsors.rows[0].active_sponsors,
        pending_sponsorships: sponsors.rows[0].pending_sponsorships,
        approved_funding: toNumber(sponsors.rows[0].approved_funding),
        pending_guides: queuedGuides.rows[0].pending_guides,
        active_sos: sos.rows[0].active_sos,
        active_contracts: contracts.rows[0].active_contracts,
        contract_volume_kg: toNumber(contracts.rows[0].contract_volume_kg),
      },
      series,
    });
  } catch (err) {
    console.error('Dashboard summary query error:', err);
    return res.status(500).json({ error: 'Gagal menghitung ringkasan dashboard.' });
  }
};
