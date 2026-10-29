-- =========================================================================
-- DATABASE SCHEMA: LENTERA WEB-GIS COFFEE MAPPING & AGROTOURISM
-- RDBMS: PostgreSQL with PostGIS Extension
-- Architecture: Enterprise 3NF Normalized Relational Database (18 Tables)
-- Author: Alan Assidiqqi Pratama (NIM: 322310022)
-- Description: Complete production DDL script with relations, PostGIS GIS spatial indexes, and initial seed datasets.
-- =========================================================================

-- 1. Enable PostGIS Extension (Wajib dijalankan sebagai superuser PostgreSQL)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Drop existing tables in reverse dependency order (Clean state re-initialization)
DROP TABLE IF EXISTS visitor_reviews CASCADE;
DROP TABLE IF EXISTS sponsorships CASCADE;
DROP TABLE IF EXISTS education_modules CASCADE;
DROP TABLE IF EXISTS e_resources CASCADE;
DROP TABLE IF EXISTS emergency_sos_alerts CASCADE;
DROP TABLE IF EXISTS guide_bookings CASCADE;
DROP TABLE IF EXISTS tour_guides CASCADE;
DROP TABLE IF EXISTS tourist_destinations CASCADE;
DROP TABLE IF EXISTS cupping_evaluations CASCADE;
DROP TABLE IF EXISTS harvest_batches CASCADE;
DROP TABLE IF EXISTS mlr_yield_predictions CASCADE;
DROP TABLE IF EXISTS agroclimate_records CASCADE;
DROP TABLE IF EXISTS coffee_plots CASCADE;
DROP TABLE IF EXISTS processing_methods CASCADE;
DROP TABLE IF EXISTS coffee_varieties CASCADE;
DROP TABLE IF EXISTS farmers CASCADE;
DROP TABLE IF EXISTS farmer_groups CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =========================================================================
-- SECTION A: MASTER DATA & AKUN PENGGUNA (5 TABEL)
-- =========================================================================

-- TABEL 1: users (Autentikasi & Role-Based Access Control / RBAC)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('ADMIN', 'DESA', 'KARANGTARUNA', 'SPONSOR', 'VISITOR')),
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABEL 2: farmer_groups (Kelompok Tani / Poktan Desa Kucur)
CREATE TABLE farmer_groups (
    id SERIAL PRIMARY KEY,
    group_name VARCHAR(100) UNIQUE NOT NULL,
    village_unit VARCHAR(100) DEFAULT 'Desa Kucur, Dau, Malang',
    head_name VARCHAR(100) NOT NULL,
    total_members INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABEL 3: farmers (Data Diri & Master Petani Kopi Desa)
CREATE TABLE farmers (
    id SERIAL PRIMARY KEY,
    farmer_group_id INT REFERENCES farmer_groups(id) ON DELETE SET NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(30),
    address TEXT,
    years_experience INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABEL 4: coffee_varieties (Master Varietas Kopi Agronomi)
CREATE TABLE coffee_varieties (
    id SERIAL PRIMARY KEY,
    variety_name VARCHAR(50) UNIQUE NOT NULL, -- Arabica, Robusta, Liberica, Excelsa
    ideal_elevation_min INT DEFAULT 800, -- MDPL
    ideal_elevation_max INT DEFAULT 1500, -- MDPL
    characteristics TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABEL 5: processing_methods (Master Metode Pengolahan Pasca-Panen)
CREATE TABLE processing_methods (
    id SERIAL PRIMARY KEY,
    method_name VARCHAR(50) UNIQUE NOT NULL, -- Natural Process, Full Washed, Honey Process, Wet Hulled
    drying_days_avg INT DEFAULT 14,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- SECTION B: SPASIAL GIS, AGROKLIMATOLOGI & MLR PREDIKSI (3 TABEL)
-- =========================================================================

-- TABEL 6: coffee_plots (Pemetaan Spasial GIS Lahan Kopi)
CREATE TABLE coffee_plots (
    id SERIAL PRIMARY KEY,
    farmer_id INT REFERENCES farmers(id) ON DELETE CASCADE,
    variety_id INT REFERENCES coffee_varieties(id) ON DELETE RESTRICT,
    geom GEOMETRY(Point, 4326) NOT NULL, -- Point (Longitude, Latitude) SRID 4326 WGS84
    tree_count INT NOT NULL CHECK (tree_count >= 0),
    elevation INT NOT NULL CHECK (elevation >= 0), -- MDPL
    land_area NUMERIC(10,2) NOT NULL DEFAULT 0.00, -- Luas Lahan m2
    predicted_yield NUMERIC(10,2) NOT NULL DEFAULT 0.00, -- Prediksi Panen MLR (Kg/tahun)
    description TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Spatial Index GIST untuk Query Spasial Kecepatan Tinggi
CREATE INDEX idx_coffee_plots_geom ON coffee_plots USING gist(geom);

-- TABEL 7: agroclimate_records (Telemetri Kondisi Tanah & Iklim Lahan)
CREATE TABLE agroclimate_records (
    id SERIAL PRIMARY KEY,
    plot_id INT NOT NULL REFERENCES coffee_plots(id) ON DELETE CASCADE,
    temperature_c NUMERIC(4,1) NOT NULL, -- Suhu Udara Celcius
    humidity_percent NUMERIC(4,1) NOT NULL, -- Kelembaban Udara %
    soil_ph NUMERIC(3,1) NOT NULL, -- pH Tanah (5.5 - 6.5)
    rainfall_mm INT NOT NULL, -- Curah Hujan Tahunan mm
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABEL 8: mlr_yield_predictions (Riwayat Log Model Regresi Linear Berganda)
CREATE TABLE mlr_yield_predictions (
    id SERIAL PRIMARY KEY,
    plot_id INT NOT NULL REFERENCES coffee_plots(id) ON DELETE CASCADE,
    land_area_input NUMERIC(10,2) NOT NULL,
    elevation_input INT NOT NULL,
    tree_count_input INT NOT NULL,
    mlr_formula_version VARCHAR(50) DEFAULT 'MLR-v1.2-Kucur',
    predicted_kg NUMERIC(10,2) NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- SECTION C: SUPPLY CHAIN & QUALTIY ASSURANCE (2 TABEL)
-- =========================================================================

-- TABEL 9: harvest_batches (Pencatatan Hasil Panen Realisasi SCM)
CREATE TABLE harvest_batches (
    id SERIAL PRIMARY KEY,
    batch_code VARCHAR(50) UNIQUE NOT NULL,
    plot_id INT REFERENCES coffee_plots(id) ON DELETE SET NULL,
    method_id INT REFERENCES processing_methods(id) ON DELETE RESTRICT,
    weight_kg NUMERIC(10,2) NOT NULL CHECK (weight_kg >= 0),
    drying_days INT DEFAULT 14,
    grade VARCHAR(50) DEFAULT 'Specialty Grade',
    status VARCHAR(50) DEFAULT 'Pengeringan',
    harvest_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABEL 10: cupping_evaluations (Penilaian Kualitas Q-Grader & Biji Specialty)
CREATE TABLE cupping_evaluations (
    id SERIAL PRIMARY KEY,
    batch_id INT NOT NULL REFERENCES harvest_batches(id) ON DELETE CASCADE,
    evaluator_name VARCHAR(100) NOT NULL,
    fragrance_score NUMERIC(3,1) CHECK (fragrance_score BETWEEN 0 AND 10),
    acidity_score NUMERIC(3,1) CHECK (acidity_score BETWEEN 0 AND 10),
    body_score NUMERIC(3,1) CHECK (body_score BETWEEN 0 AND 10),
    total_cupping_score NUMERIC(4,1) NOT NULL CHECK (total_cupping_score BETWEEN 0 AND 100),
    notes TEXT,
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- SECTION D: AGROWISATA & LAYANAN WISATAWAN (4 TABEL)
-- =========================================================================

-- TABEL 11: tourist_destinations (Katalog Agrowisata & Destinasi Desa Kucur)
CREATE TABLE tourist_destinations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    tag VARCHAR(50) NOT NULL, -- Alam & Fotografi, Edukasi Tani, Pasca-Panen, Budaya & Belanja
    elevation VARCHAR(50) DEFAULT '950 MDPL',
    price VARCHAR(100) DEFAULT 'Rp 15.000 / orang',
    hours VARCHAR(100) DEFAULT '08:00 - 18:00 WIB',
    img_url TEXT NOT NULL,
    description TEXT NOT NULL,
    highlights TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABEL 12: tour_guides (Data Master Pemandu Wisata Tani Pokdarwis Desa)
CREATE TABLE tour_guides (
    id SERIAL PRIMARY KEY,
    guide_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    specialization VARCHAR(100) DEFAULT 'Agronomi Kopi & Edukasi Petik Ceri',
    rating NUMERIC(2,1) DEFAULT 4.9,
    status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ON_TOUR', 'OFFLINE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABEL 13: guide_bookings (Pemesanan Pemandu Wisata Tani / Request Guide)
CREATE TABLE guide_bookings (
    id SERIAL PRIMARY KEY,
    guide_id INT REFERENCES tour_guides(id) ON DELETE SET NULL,
    visitor_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    visit_date DATE NOT NULL,
    visitors_count INT NOT NULL DEFAULT 1,
    target_dest VARCHAR(150) DEFAULT 'Semua Destinasi',
    notes TEXT,
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABEL 14: emergency_sos_alerts (Panggilan Kedaruratan SOS Wisatawan)
CREATE TABLE emergency_sos_alerts (
    id SERIAL PRIMARY KEY,
    latitude NUMERIC(10,7) NOT NULL,
    longitude NUMERIC(10,7) NOT NULL,
    notes TEXT,
    status VARCHAR(30) DEFAULT 'ALERT_ACTIVE' CHECK (status IN ('ALERT_ACTIVE', 'DISPATCHED', 'RESOLVED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- SECTION E: INFORMASI, EDUKASI & KEMITRAAN B2B (4 TABEL)
-- =========================================================================

-- TABEL 15: e_resources (Perpustakaan Digital & Panduan Informasi Desa)
CREATE TABLE e_resources (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(180) UNIQUE NOT NULL,
    type VARCHAR(30) DEFAULT 'TEXT' CHECK (type IN ('TEXT', 'VIDEO', 'PDF')),
    status VARCHAR(20) DEFAULT 'AKTIF' CHECK (status IN ('AKTIF', 'NONAKTIF')),
    content TEXT NOT NULL,
    attachment_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABEL 16: education_modules (Modul Pembelajaran Edukasi Wisata Tani)
CREATE TABLE education_modules (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    sub_info VARCHAR(100),
    description TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABEL 17: sponsorships (Kemitraan Investasi B2B & Proposal PDF)
CREATE TABLE sponsorships (
    id SERIAL PRIMARY KEY,
    sponsor_name VARCHAR(100) NOT NULL,
    contact VARCHAR(100),
    plot_owner VARCHAR(100),
    funding_amount DECIMAL(15, 2) NOT NULL CHECK (funding_amount >= 0),
    proposal_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABEL 18: visitor_reviews (Moderasi Ulasan & Testimoni Wisatawan)
CREATE TABLE visitor_reviews (
    id SERIAL PRIMARY KEY,
    visitor_name VARCHAR(100) NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    visited_location VARCHAR(100) DEFAULT 'Kebun Kopi Kucur',
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- INITIAL SEED DATASET FOR DESA KUCUR
-- =========================================================================

-- 1. Seed Users
INSERT INTO users (username, password_hash, email, role, full_name) VALUES
('kades', '$2a$10$vQ1z6u1L8f/V4S/S3dK8y.8OQy4Z7G8Z9V4S/S3dK8y.8OQy4Z7G8', 'kades@kucur.desa.id', 'DESA', 'Kepala Desa Kucur'),
('admin_gis', '$2a$10$vQ1z6u1L8f/V4S/S3dK8y.8OQy4Z7G8Z9V4S/S3dK8y.8OQy4Z7G8', 'admin@kucur.desa.id', 'ADMIN', 'Admin GIS Perangkat Desa');

-- 2. Seed Farmer Groups
INSERT INTO farmer_groups (group_name, head_name, total_members) VALUES
('Poktan Gemah Ripah 1', 'Pak Sugeng', 18),
('Poktan Tani Maju', 'Pak Slamet', 24),
('Poktan Gemah Ripah 2', 'Ibu Sumiati', 15);

-- 3. Seed Farmers
INSERT INTO farmers (farmer_group_id, full_name, phone_number, address) VALUES
(1, 'Pak Sugeng', '081234567891', 'Dusun Krajan RT 02/RW 01 Desa Kucur'),
(2, 'Pak Slamet', '081234567892', 'Dusun Kebon Kopi RT 05/RW 02 Desa Kucur'),
(3, 'Bu Sumiati', '081234567893', 'Dusun Lereng Kawi RT 01/RW 04 Desa Kucur');

-- 4. Seed Coffee Varieties
INSERT INTO coffee_varieties (variety_name, ideal_elevation_min, ideal_elevation_max, characteristics) VALUES
('Arabica', 1000, 1600, 'Aroma floral manis dengan keasaman segar alami.'),
('Robusta', 600, 1000, 'Bodi tebal, aroma cokelat pekat, & kafein tinggi.'),
('Liberica', 400, 900, 'Ukuran biji besar beraroma nangka segar.'),
('Excelsa', 500, 1000, 'Cita rasa unik buah tart & nutty.');

-- 5. Seed Processing Methods
INSERT INTO processing_methods (method_name, drying_days_avg, description) VALUES
('Natural Process', 18, 'Ceri kopi dijemur utuh di atas meja gantung raised beds.'),
('Full Washed', 12, 'Kulit ceri dikupas dan difermentasi air jernih pegunungan.'),
('Honey Process', 15, 'Ceri dikupas menyisakan lapisan lendir mukilase manis.');

-- 6. Seed Coffee Plots
INSERT INTO coffee_plots (farmer_id, variety_id, geom, tree_count, elevation, land_area, predicted_yield, description) VALUES
(1, 1, ST_SetSRID(ST_Point(112.5201, -7.9152), 4326), 180, 1250, 1200, 850.50, 'Lahan Arabika organik lereng tinggi.'),
(2, 2, ST_SetSRID(ST_Point(112.5185, -7.9120), 4326), 220, 850, 1500, 1100.00, 'Kebun Robusta produktif dengan peneduh.'),
(3, 1, ST_SetSRID(ST_Point(112.5240, -7.9180), 4326), 150, 1300, 1000, 720.00, 'Kebun kopi Arabika lereng tinggi.');

-- 7. Seed Agroclimate
INSERT INTO agroclimate_records (plot_id, temperature_c, humidity_percent, soil_ph, rainfall_mm) VALUES
(1, 21.5, 82.0, 6.2, 2100),
(2, 24.8, 76.0, 6.5, 1850);

-- 8. Seed Harvest Batches
INSERT INTO harvest_batches (batch_code, plot_id, method_id, weight_kg, drying_days, grade, status) VALUES
('KCR-2026-001', 1, 1, 850, 18, 'Specialty Grade', 'Gudang Green Bean'),
('KCR-2026-002', 2, 2, 1200, 12, 'Commercial Grade', 'Siap Kirim');

-- 9. Seed Cupping Evaluations
INSERT INTO cupping_evaluations (batch_id, evaluator_name, fragrance_score, acidity_score, body_score, total_cupping_score, notes) VALUES
(1, 'Q-Grader Asosiasi Kopi Malang', 8.8, 8.7, 8.5, 87.5, 'Skor manis karamel sangat dominan.');

-- 10. Seed Tourist Destinations
INSERT INTO tourist_destinations (name, tag, elevation, price, hours, img_url, description, highlights) VALUES
('Terasering Zamrud Kucur', 'Alam & Fotografi', '950 MDPL', 'Rp 15.000 / orang', '08:00 - 18:00 WIB', 'https://images.unsplash.com/photo-1578507065211-17b2d564c20f?w=600', 'Pemandangan panorama lereng Gunung Kawi dengan sistem irigasi subak pegunungan alami.', ARRAY['Spot Foto', 'Udara Segar', 'Parkir Utama']),
('Kebun Kopi High Altitude (1.250 MDPL)', 'Edukasi Tani', '1250 MDPL', 'Rp 25.000 / orang', '08:00 - 16:30 WIB', 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600', 'Jelajah hamparan kebun kopi Arabika organik lereng tinggi.', ARRAY['Petik Ceri', 'Agronomi', 'Free Coffee']);

-- 11. Seed Tour Guides
INSERT INTO tour_guides (guide_name, phone_number, specialization, rating, status) VALUES
('Mas Dian Pokdarwis', '081234567890', 'Pemandu Jelajah Kebun Kopi & Pemetikan Ceri', 4.9, 'AVAILABLE'),
('Pak Bambang Kucur', '081234567899', 'Pemandu Edukasi Pasca-Panen & Processing', 4.8, 'AVAILABLE');

-- 12. Seed E-Resources
INSERT INTO e_resources (title, slug, type, status, content) VALUES
('SOP Budidaya Kopi Organic High Altitude', 'sop-budidaya-kopi', 'TEXT', 'AKTIF', 'Panduan tata cara pemeliharaan tanaman kopi lereng tinggi.'),
('SOP Pengeringan Natural Process Greenhouse', 'sop-pengeringan-natural', 'PDF', 'AKTIF', 'Standar operasional penjemuran ceri kopi.');

-- 13. Seed Education Modules
INSERT INTO education_modules (slug, title, category, sub_info, description, image_url) VALUES
('pemetikan-merah', 'Pemetikan Ceri Merah (Selective Picking)', 'Panen & Pasca-Panen', '12 Modul Pembelajaran', 'Panduan pemetikan ceri kopi matang sempurna.', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300');

-- 14. Seed Visitor Reviews
INSERT INTO visitor_reviews (visitor_name, rating, comment, visited_location, is_approved) VALUES
('Rini Handayani', 5, 'Kebun kopi lereng tinggi Kucur sangat indah!', 'Kebun Kopi High Altitude', TRUE);
