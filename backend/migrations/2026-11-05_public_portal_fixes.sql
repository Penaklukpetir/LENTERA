-- Pengaturan kontak desa (SOS & pemandu)
CREATE TABLE IF NOT EXISTS village_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    sos_phone VARCHAR(30) NOT NULL DEFAULT '6281234567890',
    guide_phone VARCHAR(30) NOT NULL DEFAULT '6281234567890',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO village_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Galeri gambar dan kontak pemandu per destinasi wisata
ALTER TABLE tourist_destinations ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE tourist_destinations ADD COLUMN IF NOT EXISTS guide_name VARCHAR(100);
ALTER TABLE tourist_destinations ADD COLUMN IF NOT EXISTS guide_phone VARCHAR(30);

UPDATE tourist_destinations
SET images = ARRAY[img_url]
WHERE images IS NULL;
