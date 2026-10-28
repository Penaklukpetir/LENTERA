-- =========================================================================
-- LENTERA: Additive business-process migration (idempotent)
-- Aligns runtime PostgreSQL with SDD: SCM, tourism, SOS, MLR audit,
-- sponsorship workflow, soft-delete, and temporary admin credentials.
-- Safe to run repeatedly.
-- =========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- 1. Sponsorship workflow: company identity + two-stage curation + audit
-- -------------------------------------------------------------------------
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS sponsor_name VARCHAR(100);
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS contact VARCHAR(100);
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS plot_owner VARCHAR(100);
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS curated_by INT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS curated_at TIMESTAMP;
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS curation_notes TEXT;
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS approved_by INT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS rejected_by INT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS disbursed_by INT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS disbursed_at TIMESTAMP;
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE IF EXISTS sponsorships ALTER COLUMN sponsor_id DROP NOT NULL;
ALTER TABLE IF EXISTS sponsorships ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Runtime table was created with a 3-state CHECK; extend it for the
-- two-stage curation and disbursement workflow.
ALTER TABLE sponsorships DROP CONSTRAINT IF EXISTS sponsorships_status_check;
ALTER TABLE sponsorships
  ADD CONSTRAINT sponsorships_status_check
  CHECK (status IN ('PENDING', 'CURATED', 'APPROVED', 'REJECTED', 'DISBURSED'));

UPDATE sponsorships s
SET sponsor_name = COALESCE(s.sponsor_name, u.full_name)
FROM users u
WHERE s.sponsor_id = u.id AND s.sponsor_name IS NULL;

CREATE INDEX IF NOT EXISTS idx_sponsorships_status ON sponsorships(status) WHERE deleted_at IS NULL;

-- -------------------------------------------------------------------------
-- 2. SCM: harvest batches + offtaker contracts
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS harvest_batches (
    id SERIAL PRIMARY KEY,
    batch_code VARCHAR(50) UNIQUE NOT NULL,
    plot_id INT REFERENCES coffee_plots(id) ON DELETE SET NULL,
    weight_kg NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (weight_kg >= 0),
    drying_days INT DEFAULT 14,
    grade VARCHAR(50) DEFAULT 'Specialty Grade',
    process_method VARCHAR(50) DEFAULT 'Natural Process',
    cupping_score NUMERIC(4,1),
    status VARCHAR(50) DEFAULT 'Pengeringan',
    harvest_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS harvest_batch_code_seq;

CREATE TABLE IF NOT EXISTS scm_contracts (
    id SERIAL PRIMARY KEY,
    contract_code VARCHAR(50) UNIQUE NOT NULL,
    buyer_name VARCHAR(150) NOT NULL,
    coffee_type VARCHAR(100),
    volume_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
    price_per_kg NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_value NUMERIC(18,2) NOT NULL DEFAULT 0,
    delivery_date DATE,
    status VARCHAR(30) DEFAULT 'AKTIF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS scm_contract_code_seq;

CREATE INDEX IF NOT EXISTS idx_harvest_batches_plot ON harvest_batches(plot_id);
CREATE INDEX IF NOT EXISTS idx_harvest_batches_created ON harvest_batches(created_at);

-- Seed batches only for plots that actually exist, and only once per code.
INSERT INTO harvest_batches (batch_code, plot_id, weight_kg, drying_days, grade, process_method, cupping_score, status, harvest_date)
SELECT 'KCR-2026-001', 1, 850, 18, 'Specialty Grade', 'Natural Process', 87.5, 'Gudang Green Bean', CURRENT_DATE - INTERVAL '20 days'
WHERE EXISTS (SELECT 1 FROM coffee_plots WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM harvest_batches WHERE batch_code = 'KCR-2026-001');

INSERT INTO harvest_batches (batch_code, plot_id, weight_kg, drying_days, grade, process_method, cupping_score, status, harvest_date)
SELECT 'KCR-2026-002', 2, 1200, 12, 'Specialty Grade', 'Full Washed', 84.0, 'Pengeringan', CURRENT_DATE - INTERVAL '13 days'
WHERE EXISTS (SELECT 1 FROM coffee_plots WHERE id = 2)
  AND NOT EXISTS (SELECT 1 FROM harvest_batches WHERE batch_code = 'KCR-2026-002');

INSERT INTO harvest_batches (batch_code, plot_id, weight_kg, drying_days, grade, process_method, cupping_score, status, harvest_date)
SELECT 'KCR-2026-003', 3, 650, 15, 'Specialty Grade', 'Honey Process', 88.0, 'Siap Kirim', CURRENT_DATE - INTERVAL '9 days'
WHERE EXISTS (SELECT 1 FROM coffee_plots WHERE id = 3)
  AND NOT EXISTS (SELECT 1 FROM harvest_batches WHERE batch_code = 'KCR-2026-003');

INSERT INTO scm_contracts (contract_code, buyer_name, coffee_type, volume_kg, price_per_kg, total_value, delivery_date, status)
SELECT 'CTR-2026-01', 'Roastery Kopi Senja Malang', 'Arabica', 500, 125000, 62500000, CURRENT_DATE + INTERVAL '15 days', 'AKTIF'
WHERE NOT EXISTS (SELECT 1 FROM scm_contracts WHERE contract_code = 'CTR-2026-01');

INSERT INTO scm_contracts (contract_code, buyer_name, coffee_type, volume_kg, price_per_kg, total_value, delivery_date, status)
SELECT 'CTR-2026-02', 'PT Indokopi Ekspor Surabaya', 'Robusta', 2000, 75000, 150000000, CURRENT_DATE + INTERVAL '30 days', 'AKTIF'
WHERE NOT EXISTS (SELECT 1 FROM scm_contracts WHERE contract_code = 'CTR-2026-02');

INSERT INTO scm_contracts (contract_code, buyer_name, coffee_type, volume_kg, price_per_kg, total_value, delivery_date, status)
SELECT 'CTR-2026-03', 'Kedai Kopi Lereng Kawi', 'Arabica', 300, 140000, 42000000, CURRENT_DATE - INTERVAL '3 days', 'TERKIRIM'
WHERE NOT EXISTS (SELECT 1 FROM scm_contracts WHERE contract_code = 'CTR-2026-03');

-- Keep code sequences beyond any seeded / pre-existing suffix.
DO $$
DECLARE
  batch_max INT;
  contract_max INT;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(batch_code, '^.*-', ''), '')::INT), 0) INTO batch_max FROM harvest_batches;
  PERFORM setval('harvest_batch_code_seq', GREATEST(batch_max, 1), batch_max > 0);

  SELECT COALESCE(MAX(NULLIF(regexp_replace(contract_code, '^.*-', ''), '')::INT), 0) INTO contract_max FROM scm_contracts;
  PERFORM setval('scm_contract_code_seq', GREATEST(contract_max, 1), contract_max > 0);
END $$;

-- -------------------------------------------------------------------------
-- 3. MLR model governance: prediction history
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mlr_yield_predictions (
    id SERIAL PRIMARY KEY,
    plot_id INT NOT NULL REFERENCES coffee_plots(id) ON DELETE CASCADE,
    land_area_input NUMERIC(10,2) NOT NULL,
    elevation_input INT NOT NULL,
    tree_count_input INT NOT NULL,
    mlr_formula_version VARCHAR(50) DEFAULT 'MLR-v1.2-Kucur',
    predicted_kg NUMERIC(10,2) NOT NULL,
    calculated_by INT REFERENCES users(id) ON DELETE SET NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mlr_predictions_plot ON mlr_yield_predictions(plot_id, calculated_at DESC);

INSERT INTO mlr_yield_predictions (plot_id, land_area_input, elevation_input, tree_count_input, mlr_formula_version, predicted_kg, calculated_at)
SELECT p.id, p.land_area, p.elevation, p.tree_count, 'MLR-v1.2-Kucur', p.predicted_yield, COALESCE(p.updated_at, p.created_at)
FROM coffee_plots p
WHERE NOT EXISTS (SELECT 1 FROM mlr_yield_predictions m WHERE m.plot_id = p.id);

-- -------------------------------------------------------------------------
-- 4. Agrotourism: destinations, guides, bookings, SOS alerts
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tourist_destinations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    tag VARCHAR(50) NOT NULL,
    elevation VARCHAR(50) DEFAULT '950 MDPL',
    price VARCHAR(100) DEFAULT 'Rp 15.000 / orang',
    hours VARCHAR(100) DEFAULT '08:00 - 18:00 WIB',
    img_url TEXT NOT NULL,
    description TEXT NOT NULL,
    highlights TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tour_guides (
    id SERIAL PRIMARY KEY,
    guide_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    specialization VARCHAR(100) DEFAULT 'Agronomi Kopi & Edukasi Petik Ceri',
    rating NUMERIC(2,1) DEFAULT 4.9,
    status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ON_TOUR', 'OFFLINE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guide_bookings (
    id SERIAL PRIMARY KEY,
    guide_id INT REFERENCES tour_guides(id) ON DELETE SET NULL,
    visitor_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    visit_date DATE NOT NULL,
    visitors_count INT NOT NULL DEFAULT 1,
    target_dest VARCHAR(150) DEFAULT 'Semua Destinasi',
    notes TEXT,
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emergency_sos_alerts (
    id SERIAL PRIMARY KEY,
    latitude NUMERIC(10,7) NOT NULL,
    longitude NUMERIC(10,7) NOT NULL,
    notes TEXT,
    status VARCHAR(30) DEFAULT 'ALERT_ACTIVE' CHECK (status IN ('ALERT_ACTIVE', 'DISPATCHED', 'RESOLVED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guide_bookings_status ON guide_bookings(status);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_status ON emergency_sos_alerts(status);

INSERT INTO tourist_destinations (name, tag, elevation, price, hours, img_url, description, highlights)
SELECT v.name, v.tag, v.elevation, v.price, v.hours, v.img_url, v.description, v.highlights
FROM (VALUES
  ('Terasering Zamrud Kucur', 'Alam & Fotografi', '950 MDPL', 'Rp 15.000 / orang', '08:00 - 18:00 WIB',
   'https://images.unsplash.com/photo-1578507065211-17b2d564c20f?auto=format&fit=crop&q=80&w=600',
   'Pemandangan panorama menakjubkan dari lereng Gunung Kawi dengan sistem irigasi subak pegunungan alami.',
   ARRAY['Spot Foto Panoramic', 'Udara Segar Pegunungan', 'Dekat Parkir Utama']),
  ('Kebun Kopi High Altitude (1.250 MDPL)', 'Edukasi Tani', '1250 MDPL', 'Rp 25.000 / orang (Termasuk Seduh Kopi)', '08:00 - 16:30 WIB',
   'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=600',
   'Jelajah hamparan kebun kopi Arabika organik lereng tinggi, belajar perawatan bibit & pemetikan ceri pilihan.',
   ARRAY['Petik Ceri Kopi', 'Edukasi Agronomi', 'Free Coffee Tasting']),
  ('Greenhouse Penjemuran Ceri Natural', 'Pasca-Panen', '1100 MDPL', 'Gratis (Kunjungan Edukasi)', '09:00 - 16:00 WIB',
   'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=600',
   'Melihat langsung proses pengeringan ceri kopi Natural, Washed, & Honey Process di atas meja gantung higienis.',
   ARRAY['Proses Olah Kopi', 'Aroma Kopi Alami', 'Panduan Petani']),
  ('Sentra UMKM Kriya & Kopi Kucur', 'Budaya & Belanja', '850 MDPL', 'Gratis Masuk', '08:00 - 20:00 WIB',
   'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
   'Pusat oleh-oleh bubuk kopi kemasan asli Desa Kucur, kerajinan anyaman kriya bambu, dan kuliner tradisional.',
   ARRAY['Oleh-oleh Asli Desa', 'Kerajinan Bambu', 'Kedai Kopi Pokdarwis']),
  ('Wisata Edukasi Petik Ceri Merah', 'Edukasi Tani', '1200 MDPL', 'Rp 35.000 / orang', 'Panen Raya (08:00 - 14:00)',
   'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&q=80&w=600',
   'Pengalaman interaktif memetik buah ceri merah matang langsung di pohon bersama bimbingan petani lokal Kucur.',
   ARRAY['Pengalaman Petik Langsung', 'Keranjang Tradisional', 'Sertifikat Edukasi']),
  ('Spot Sunset Lereng Gunung Kawi', 'Alam & Fotografi', '1350 MDPL', 'Rp 10.000 / kendaraan', '15:30 - 18:30 WIB',
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600',
   'Titik pandang tertinggi Desa Kucur untuk menikmati matahari terbenam dengan latar belakang samudera awan.',
   ARRAY['Sunrise/Sunset Point', 'Area Camping Light', 'Warung Kopi Hangat'])
) AS v(name, tag, elevation, price, hours, img_url, description, highlights)
WHERE NOT EXISTS (SELECT 1 FROM tourist_destinations d WHERE d.name = v.name AND d.deleted_at IS NULL);

INSERT INTO tour_guides (guide_name, phone_number, specialization, rating, status)
SELECT v.guide_name, v.phone_number, v.specialization, v.rating, v.status
FROM (VALUES
  ('Pak Sugeng', '081234567891', 'Agronomi Kopi & Edukasi Petik Ceri', 4.9, 'AVAILABLE'),
  ('Bu Sumiati', '081234567893', 'Pasca-Panen & Pengolahan Kopi', 4.8, 'AVAILABLE'),
  ('Mas Bagus Pratama', '081234567895', 'Fotografi Lanskap & Jalur Terasering', 4.7, 'ON_TOUR'),
  ('Mbak Rina Wati', '081234567897', 'Budaya Lokal & Kriya Bambu', 4.9, 'AVAILABLE')
) AS v(guide_name, phone_number, specialization, rating, status)
WHERE NOT EXISTS (SELECT 1 FROM tour_guides g WHERE g.guide_name = v.guide_name AND g.deleted_at IS NULL);

-- -------------------------------------------------------------------------
-- 5. Soft-delete across operational tables
-- -------------------------------------------------------------------------
ALTER TABLE coffee_plots ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE e_resources ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE education_modules ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- -------------------------------------------------------------------------
-- 6. Admin credentials: forced reset flag
-- -------------------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;

COMMIT;
