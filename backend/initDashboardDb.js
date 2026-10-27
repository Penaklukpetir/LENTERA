import pool from './db.js';

async function initDb() {
  try {
    console.log('--- Initializing LENTERA Dashboard Database Tables ---');

    // 1. Create education_modules table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS education_modules (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(100) UNIQUE NOT NULL,
        title VARCHAR(150) NOT NULL,
        category VARCHAR(50) NOT NULL,
        sub_info VARCHAR(100),
        description TEXT,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Table education_modules verified.');

    // 2. Ensure e_resources has columns: type, status
    await pool.query(`
      CREATE TABLE IF NOT EXISTS e_resources (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        slug VARCHAR(150),
        type VARCHAR(20) DEFAULT 'TEXT',
        status VARCHAR(20) DEFAULT 'AKTIF',
        content TEXT,
        attachment_url TEXT,
        author_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE e_resources ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'TEXT';
      ALTER TABLE e_resources ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'AKTIF';
      ALTER TABLE e_resources ALTER COLUMN author_id DROP NOT NULL;
    `);
    console.log('✓ Table e_resources verified.');

    // 3. Seed initial e_resources if empty
    const resCount = await pool.query('SELECT COUNT(*) FROM e_resources');
    if (parseInt(resCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO e_resources (title, slug, type, status, content) VALUES
        ('Pengumuman Kerja Bakti', 'pengumuman-kerja-bakti', 'TEXT', 'AKTIF', 'Jadwal kerja bakti pembersihan saluran irigasi kebun kopi desa.'),
        ('Video Edukasi Kopi', 'video-edukasi-kopi', 'VIDEO', 'AKTIF', 'Panduan video teknik pemangkasan cabang tanaman kopi Robusta.'),
        ('Dokumen Profil Desa (PDF)', 'dokumen-profil-desa', 'PDF', 'AKTIF', 'Berkas PDF profil potensi wisata dan agribisnis Desa Kucur.');
      `);
      console.log('✓ Seeded initial e_resources data.');
    }

    // 4. Seed initial education_modules if empty
    const eduCount = await pool.query('SELECT COUNT(*) FROM education_modules');
    if (parseInt(eduCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO education_modules (slug, title, category, sub_info, description, image_url) VALUES
        ('kopi', 'Pengetahuan Kopi', 'KOPI', 'Sejarah & Asal • 12 Modul', 'Pelajari sejarah 200 tahun budidaya kopi di tanah Kucur serta karakteristik varietas.', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300'),
        ('tani', 'Kelompok Tani', 'TANI', 'Pahlawan Lokal • 15 Kelompok', 'Temui 15 kelompok koperasi yang mengelola perkebunan secara berkelanjutan.', 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=300'),
        ('produksi', 'Proses Produksi', 'PRODUKSI', 'Perjalanan Interaktif', 'Perjalanan interaktif langkah demi langkah pencucian, fermentasi, pengeringan, hingga sangrai.', 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=300');
      `);
      console.log('✓ Seeded initial education_modules data.');
    }
    // 5. Create & Seed reviews table if empty
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        visitor_name VARCHAR(100) NOT NULL,
        rating INT NOT NULL DEFAULT 5,
        comment TEXT NOT NULL,
        visited_location VARCHAR(100) DEFAULT 'Kebun Kopi Kucur',
        is_approved BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS visited_location VARCHAR(100) DEFAULT 'Kebun Kopi Kucur';
    `);
    console.log('✓ Table reviews verified.');

    const revCount = await pool.query('SELECT COUNT(*) FROM reviews');
    if (parseInt(revCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO reviews (visitor_name, rating, comment, visited_location, is_approved) VALUES
        ('Sarah Jenkins', 5, 'Wisata edukasinya sangat berkesan. Pemandu lokal sangat berpengetahuan tentang spesies tanaman lokal.', 'Hutan Bambu • 12 Okt', true),
        ('Marcus Thorne', 5, 'Peluang fotografi yang luar biasa. Keramahtamahan para tetua desa selama kunjungan ke kebun kopi adalah puncak perjalanan saya.', 'Lembah Gunung Sari • 08 Okt', true),
        ('Elena Rossi', 5, 'Melihat proses sangrai kopi tradisional sangat menarik. Saya membeli beberapa bungkus kopi bubuk Arabika.', 'Sentra Kerajinan • 02 Okt', false);
      `);
      console.log('✓ Seeded initial reviews data.');
    }

    // 6. Create harvest_batches table (Penyimpanan & Batch Hasil Panen)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS harvest_batches (
        id SERIAL PRIMARY KEY,
        batch_code VARCHAR(50) UNIQUE NOT NULL,
        plot_id INT REFERENCES coffee_plots(id) ON DELETE SET NULL,
        farmer_name VARCHAR(100) NOT NULL,
        coffee_type VARCHAR(50) NOT NULL,
        process_method VARCHAR(50) NOT NULL,
        weight_kg NUMERIC(10,2) NOT NULL,
        drying_days INT DEFAULT 14,
        grade VARCHAR(50) DEFAULT 'Specialty Grade',
        cupping_score NUMERIC(4,2) DEFAULT 85.00,
        status VARCHAR(50) DEFAULT 'Pengeringan',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Table harvest_batches with plot_id FK verified.');

    console.log('--- LENTERA Dashboard DB Initialization Completed Successfully ---');
    process.exit(0);
  } catch (err) {
    console.error('Database initialization exception:', err);
    process.exit(1);
  }
}

initDb();
