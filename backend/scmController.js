import pool from './db.js';

// In-Memory Fallback Seed Data for SCM Hub (if Postgres table is not populated yet)
let dummyBatches = [
  {
    id: 1,
    batch_code: 'KCR-2026-001',
    plot_id: 1,
    farmer_name: 'Pak Sugeng (Poktan Gemah Ripah 1)',
    coffee_type: 'Arabica',
    process_method: 'Natural Process',
    weight_kg: 850,
    drying_days: 18,
    grade: 'Specialty Grade',
    cupping_score: 87.5,
    status: 'Gudang Green Bean',
    created_at: '2026-08-10T08:00:00.000Z'
  },
  {
    id: 2,
    batch_code: 'KCR-2026-002',
    plot_id: 2,
    farmer_name: 'Ibu Sumiati (KWT 1)',
    coffee_type: 'Robusta',
    process_method: 'Full Washed',
    weight_kg: 1200,
    drying_days: 12,
    grade: 'Specialty Grade',
    cupping_score: 84.0,
    status: 'Pengeringan',
    created_at: '2026-08-15T09:30:00.000Z'
  },
  {
    id: 3,
    batch_code: 'KCR-2026-003',
    plot_id: 3,
    farmer_name: 'Pak Bambang (Poktan Gemah Ripah 3)',
    coffee_type: 'Arabica',
    process_method: 'Honey Process',
    weight_kg: 650,
    drying_days: 15,
    grade: 'Specialty Grade',
    cupping_score: 88.0,
    status: 'Siap Kirim',
    created_at: '2026-08-18T11:00:00.000Z'
  },
  {
    id: 4,
    batch_code: 'KCR-2026-004',
    plot_id: 4,
    farmer_name: 'Pak Slamet (Poktan Gemah Ripah 2)',
    coffee_type: 'Robusta',
    process_method: 'Natural Process',
    weight_kg: 1400,
    drying_days: 14,
    grade: 'Commercial Grade',
    cupping_score: 79.5,
    status: 'Gudang Green Bean',
    created_at: '2026-08-20T14:15:00.000Z'
  }
];

let dummyOfftakers = [
  {
    id: 1,
    contract_code: 'CTR-2026-01',
    buyer_name: 'Roastery Kopi Senja Malang',
    coffee_type: 'Arabica Specialty',
    volume_kg: 500,
    price_per_kg: 125000,
    total_value: 62500000,
    delivery_date: '2026-09-15',
    status: 'AKTIF'
  },
  {
    id: 2,
    contract_code: 'CTR-2026-02',
    buyer_name: 'PT Indokopi Ekspor Surabaya',
    coffee_type: 'Robusta Washed',
    volume_kg: 2000,
    price_per_kg: 75000,
    total_value: 150000000,
    delivery_date: '2026-10-01',
    status: 'AKTIF'
  },
  {
    id: 3,
    contract_code: 'CTR-2026-03',
    buyer_name: 'Kedai Kopi Lereng Kawi',
    coffee_type: 'Arabica Honey Process',
    volume_kg: 300,
    price_per_kg: 140000,
    total_value: 42000000,
    delivery_date: '2026-08-25',
    status: 'TERKIRIM'
  }
];

// Price Trends & Demand Forecast Data
const priceTrendsAndForecast = {
  price_history: [
    { month: 'Jan', arabica: 110000, robusta: 62000 },
    { month: 'Feb', arabica: 112000, robusta: 63500 },
    { month: 'Mar', arabica: 115000, robusta: 65000 },
    { month: 'Apr', arabica: 118000, robusta: 66000 },
    { month: 'Mei', arabica: 120000, robusta: 68000 },
    { month: 'Jun', arabica: 122000, robusta: 70000 },
    { month: 'Jul', arabica: 125000, robusta: 72000 },
    { month: 'Agu', arabica: 128000, robusta: 75000 }
  ],
  demand_forecast: [
    { month: 'Sep 2026', forecast_kg: 4200, price_projected: 130000, target_buyer: 'Roastery Malang & Surabaya' },
    { month: 'Okt 2026', forecast_kg: 4800, price_projected: 132000, target_buyer: 'Eksportir PT Indokopi' },
    { month: 'Nov 2026', forecast_kg: 3900, price_projected: 135000, target_buyer: 'Kafe Agrowisata Local' },
    { month: 'Des 2026', forecast_kg: 5500, price_projected: 138000, target_buyer: 'Festival Kopi Kawi' },
    { month: 'Jan 2027', forecast_kg: 3200, price_projected: 140000, target_buyer: 'Stok Cadangan Gudang' },
    { month: 'Feb 2027', forecast_kg: 3600, price_projected: 142000, target_buyer: 'Mitra Kedai Nasional' }
  ]
};

// GET /api/scm/batches
export const getScmBatches = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM harvest_batches ORDER BY created_at DESC');
    if (result.rows && result.rows.length > 0) {
      return res.status(200).json({ status: 'SUCCESS', data: result.rows });
    }
    return res.status(200).json({ status: 'SUCCESS', data: dummyBatches });
  } catch (err) {
    console.warn('Postgres harvest_batches query fallback to memory:', err.message);
    return res.status(200).json({ status: 'SUCCESS', data: dummyBatches });
  }
};

// POST /api/scm/batches
export const createScmBatch = async (req, res) => {
  const { farmer_name, coffee_type, process_method, weight_kg, drying_days, grade, cupping_score, status, plot_id } = req.body;
  const newId = dummyBatches.length + 1;
  const batch_code = `KCR-2026-${String(newId).padStart(3, '0')}`;

  const newBatch = {
    id: newId,
    batch_code,
    plot_id: plot_id || 1,
    farmer_name: farmer_name || 'Petani Kucur',
    coffee_type: coffee_type || 'Arabica',
    process_method: process_method || 'Natural Process',
    weight_kg: parseFloat(weight_kg) || 500,
    drying_days: parseInt(drying_days) || 14,
    grade: grade || 'Specialty Grade',
    cupping_score: parseFloat(cupping_score) || 85.0,
    status: status || 'Pengeringan',
    created_at: new Date().toISOString()
  };

  try {
    const query = `
      INSERT INTO harvest_batches (batch_code, plot_id, farmer_name, coffee_type, process_method, weight_kg, drying_days, grade, cupping_score, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const values = [batch_code, newBatch.plot_id, newBatch.farmer_name, newBatch.coffee_type, newBatch.process_method, newBatch.weight_kg, newBatch.drying_days, newBatch.grade, newBatch.cupping_score, newBatch.status];
    const result = await pool.query(query, values);
    return res.status(201).json({ status: 'SUCCESS', data: result.rows[0] });
  } catch (err) {
    console.warn('Postgres harvest_batches insert fallback to memory:', err.message);
    dummyBatches.unshift(newBatch);
    return res.status(201).json({ status: 'SUCCESS', data: newBatch });
  }
};

// GET /api/scm/traceability/:batchCode
export const getTraceability = async (req, res) => {
  const { batchCode } = req.params;
  let batch = dummyBatches.find(b => b.batch_code.toLowerCase() === batchCode.toLowerCase());

  try {
    const result = await pool.query('SELECT * FROM harvest_batches WHERE LOWER(batch_code) = LOWER($1)', [batchCode]);
    if (result.rows && result.rows.length > 0) {
      batch = result.rows[0];
    }
  } catch (err) {
    console.warn('Postgres traceability query fallback:', err.message);
  }

  if (!batch) {
    return res.status(404).json({ status: 'ERROR', message: 'Batch SCM tidak ditemukan' });
  }

  // Attach spatial origin metadata (Kebun Desa Kucur)
  const traceabilityResponse = {
    ...batch,
    origin_village: 'Desa Kucur, Kec. Dau, Kab. Malang',
    origin_coordinates: { lat: -7.9152, lng: 112.5201 },
    elevation_mdpl: batch.coffee_type === 'Arabica' ? 1250 : 850,
    certification: 'Organik Desa Kucur & Indikasi Geografis Gunung Kawi',
    qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://lentera-kucur.desa.id/trace/${batch.batch_code}`
  };

  return res.status(200).json({ status: 'SUCCESS', data: traceabilityResponse });
};

// GET /api/scm/offtakers
export const getOfftakers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM scm_contracts ORDER BY created_at DESC');
    if (result.rows && result.rows.length > 0) {
      return res.status(200).json({ status: 'SUCCESS', data: result.rows });
    }
    return res.status(200).json({ status: 'SUCCESS', data: dummyOfftakers });
  } catch (err) {
    console.warn('Postgres scm_contracts query fallback:', err.message);
    return res.status(200).json({ status: 'SUCCESS', data: dummyOfftakers });
  }
};

// POST /api/scm/offtakers
export const createOfftaker = async (req, res) => {
  const { buyer_name, coffee_type, volume_kg, price_per_kg, delivery_date } = req.body;
  const newId = dummyOfftakers.length + 1;
  const contract_code = `CTR-2026-${String(newId).padStart(2, '0')}`;
  const vol = parseFloat(volume_kg) || 500;
  const price = parseFloat(price_per_kg) || 100000;
  const total_value = vol * price;

  const newContract = {
    id: newId,
    contract_code,
    buyer_name: buyer_name || 'Mitra Roastery Kopi',
    coffee_type: coffee_type || 'Arabica Specialty',
    volume_kg: vol,
    price_per_kg: price,
    total_value,
    delivery_date: delivery_date || '2026-10-15',
    status: 'AKTIF'
  };

  try {
    const query = `
      INSERT INTO scm_contracts (contract_code, buyer_name, coffee_type, volume_kg, price_per_kg, total_value, delivery_date, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [contract_code, newContract.buyer_name, newContract.coffee_type, vol, price, total_value, newContract.delivery_date, 'AKTIF'];
    const result = await pool.query(query, values);
    return res.status(201).json({ status: 'SUCCESS', data: result.rows[0] });
  } catch (err) {
    console.warn('Postgres scm_contracts insert fallback:', err.message);
    dummyOfftakers.unshift(newContract);
    return res.status(201).json({ status: 'SUCCESS', data: newContract });
  }
};

// GET /api/scm/forecast
export const getForecast = async (req, res) => {
  return res.status(200).json({ status: 'SUCCESS', data: priceTrendsAndForecast });
};
