import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db.js';

// Controller handler to register a new user in db
export const registerUser = async (req, res) => {
  const { username, password, email, role, full_name } = req.body;

  if (!username || !password || !email || !role || !full_name) {
    return res.status(400).json({ error: 'Missing parameters. All registration fields are required.' });
  }

  // Public self-registration is limited to sponsor accounts; admin/village
  // accounts are provisioned by the Kepala Desa through the dashboard.
  if (role !== 'sponsor') {
    return res.status(403).json({ error: 'Registrasi publik hanya tersedia untuk akun sponsor.' });
  }

  try {
    // Check if duplicate user exists
    const checkUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (checkUser.rows.length > 0) {
      return res.status(409).json({ error: 'Conflict: username or email is already registered.' });
    }

    // Encrypt security password using bcryptjs
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save transaction
    const insertResult = await pool.query(
      'INSERT INTO users (username, password_hash, email, role, full_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, full_name',
      [username, passwordHash, email, role, full_name]
    );

    return res.status(201).json({
      message: 'Registration successful.',
      user: insertResult.rows[0]
    });

  } catch (err) {
    console.error('Database insertion registration exception:', err);
    return res.status(500).json({ error: 'Internal database error during user creation.' });
  }
};

// Controller handler to authenticate credentials and issue JWT
export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    // Check user existence (soft-deleted accounts cannot authenticate).
    // Sponsors log in with their email, privileged accounts use their username.
    const queryResult = await pool.query(
      'SELECT * FROM users WHERE (username = $1 OR email = $1) AND deleted_at IS NULL',
      [username]
    );
    if (queryResult.rows.length === 0) {
      return res.status(401).json({ error: 'Access denied: invalid credentials.' });
    }

    const user = queryResult.rows[0];

    // Validate password comparisons
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Access denied: invalid credentials.' });
    }

    // SDD requires a 120-minute session lifetime for privileged accounts.
    const jwtToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '120m' }
    );

    return res.status(200).json({
      message: 'Login successful.',
      token: jwtToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        must_change_password: user.must_change_password === true,
      }
    });

  } catch (err) {
    console.error('Authentication query database exception:', err);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

export const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Kata sandi saat ini dan kata sandi baru wajib diisi.' });
  }
  if (new_password.length < 8) {
    return res.status(400).json({ error: 'Kata sandi baru minimal 8 karakter.' });
  }
  if (current_password === new_password) {
    return res.status(400).json({ error: 'Kata sandi baru harus berbeda dari kata sandi saat ini.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, password_hash FROM users WHERE id = $1 AND deleted_at IS NULL',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Akun tidak ditemukan.' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Kata sandi saat ini tidak sesuai.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(new_password, salt);

    await pool.query(
      `UPDATE users
       SET password_hash = $1, must_change_password = FALSE,
           password_changed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [passwordHash, req.user.id]
    );

    return res.status(200).json({ message: 'Kata sandi berhasil diperbarui.' });
  } catch (err) {
    console.error('Change password exception:', err);
    return res.status(500).json({ error: 'Gagal memperbarui kata sandi.' });
  }
};
