import pool from './db.js';
import bcrypt from 'bcryptjs';

export const getAdminUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, role, full_name, created_at FROM users WHERE role IN ('admin', 'village', 'DESA', 'KARANGTARUNA') ORDER BY id DESC"
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Fetch admin users error:', err);
    return res.status(500).json({ error: 'Internal server error fetching admin accounts.' });
  }
};

export const createAdminUser = async (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and Email are required.' });
  }

  try {
    const username = email.split('@')[0] || 'admin_' + Date.now();
    const defaultPassword = 'password123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    const result = await pool.query(
      'INSERT INTO users (username, password_hash, email, role, full_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, full_name, created_at',
      [username, passwordHash, email, role || 'admin', name]
    );

    return res.status(201).json({ message: 'Admin account created successfully.', user: result.rows[0] });
  } catch (err) {
    console.error('Create admin user error:', err);
    return res.status(500).json({ error: 'Failed to create admin account: ' + err.message });
  }
};

export const deleteAdminUser = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Admin user deleted successfully.' });
  } catch (err) {
    console.error('Delete admin user error:', err);
    return res.status(500).json({ error: 'Failed to delete admin user.' });
  }
};
