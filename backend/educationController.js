import pool from './db.js';

export const getEducationModules = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, slug, title, category, sub_info, description, image_url, created_at FROM education_modules ORDER BY id DESC'
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Fetch education_modules error:', err);
    return res.status(500).json({ error: 'Internal server error while fetching education modules.' });
  }
};

export const createEducationModule = async (req, res) => {
  const { slug, title, category, sub_info, description, image_url } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required.' });
  }

  try {
    const moduleSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const result = await pool.query(
      'INSERT INTO education_modules (slug, title, category, sub_info, description, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [moduleSlug, title, category || 'KOPI', sub_info || '12 Modul', description || '', image_url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300']
    );
    return res.status(201).json({ message: 'Education module created.', module: result.rows[0] });
  } catch (err) {
    console.error('Create education_module error:', err);
    return res.status(500).json({ error: 'Failed to create education module.' });
  }
};

export const deleteEducationModule = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM education_modules WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Education module deleted.' });
  } catch (err) {
    console.error('Delete education_module error:', err);
    return res.status(500).json({ error: 'Failed to delete education module.' });
  }
};
