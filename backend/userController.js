import pool from './db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const ROLE_MAP = {
  DESA: 'village',
  KEPALA_DESA: 'village',
  village: 'village',
  KARANGTARUNA: 'admin',
  ADMIN: 'admin',
  admin: 'admin',
};

const generateTemporaryPassword = () => {
  const token = crypto.randomBytes(9).toString('base64url').replace(/[^A-Za-z0-9]/g, '').slice(0, 10);
  return `Lntra#${token}`;
};

export const getAdminUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, role, full_name, must_change_password, created_at
       FROM users
       WHERE role IN ('admin', 'village') AND deleted_at IS NULL
       ORDER BY id DESC`
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
    return res.status(400).json({ error: 'Nama dan email wajib diisi.' });
  }

  const normalizedRole = ROLE_MAP[role] || ROLE_MAP[String(role || '').toUpperCase()] || 'admin';

  try {
    const username = email.split('@')[0] || `admin_${Date.now()}`;
    const duplicate = await pool.query(
      'SELECT id FROM users WHERE (username = $1 OR email = $2) AND deleted_at IS NULL',
      [username, email]
    );
    if (duplicate.rows.length > 0) {
      return res.status(409).json({ error: 'Username atau email sudah terdaftar.' });
    }

    const temporaryPassword = generateTemporaryPassword();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(temporaryPassword, salt);

    const result = await pool.query(
      `INSERT INTO users (username, password_hash, email, role, full_name, must_change_password)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, username, email, role, full_name, must_change_password, created_at`,
      [username, passwordHash, email, normalizedRole, name]
    );

    return res.status(201).json({
      message: 'Akun admin dibuat. Sampaikan kata sandi sementara; pengguna wajib menggantinya saat login pertama.',
      user: result.rows[0],
      temporary_password: temporaryPassword,
    });
  } catch (err) {
    console.error('Create admin user error:', err);
    return res.status(500).json({ error: 'Failed to create admin account: ' + err.message });
  }
};

export const deleteAdminUser = async (req, res) => {
  const { id } = req.params;

  if (req.user && Number(req.user.id) === Number(id)) {
    return res.status(400).json({ error: 'Anda tidak dapat menghapus akun yang sedang digunakan.' });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND role IN ('admin', 'village') AND deleted_at IS NULL
       RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Akun admin tidak ditemukan.' });
    }
    return res.status(200).json({ message: 'Akun admin dihapus (soft delete).' });
  } catch (err) {
    console.error('Delete admin user error:', err);
    return res.status(500).json({ error: 'Failed to delete admin user.' });
  }
};
