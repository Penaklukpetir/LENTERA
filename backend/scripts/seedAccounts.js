import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Pool } = pg;

const apply = process.argv.includes('--apply');
const keepPasswords = process.argv.includes('--keep-passwords');
const sslEnabled = process.env.DB_SSL === 'true' || /sslmode=require/i.test(process.env.DATABASE_URL || '');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
      }
    : {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'lentera_db',
        ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
      }
);

const ACCOUNTS = [
  {
    username: 'admin',
    password: process.env.SEED_ADMIN_PASSWORD || 'admin123',
    email: 'admin@lentera.id',
    role: 'admin',
    fullName: 'Admin GIS Perangkat Desa',
  },
  {
    username: 'kades',
    password: process.env.SEED_KADES_PASSWORD || 'kades123',
    email: 'kades@lentera.id',
    role: 'village',
    fullName: 'Kepala Desa Kucur',
  },
];

const target = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace(/:\/\/([^:]+):[^@]*@/, '://$1:***@')
  : `${process.env.DB_NAME || 'lentera_db'} @ ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`;

const log = (...args) => console.log(...args);

const usersTableExists = async () => {
  const { rows } = await pool.query("SELECT to_regclass('public.users') AS name");
  return Boolean(rows[0]?.name);
};

const readUsers = async () => {
  const { rows: columnRows } = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
  );
  const columns = new Set(columnRows.map((row) => row.column_name));
  const select = [
    'id',
    'username',
    columns.has('email') ? 'email' : "'' AS email",
    columns.has('role') ? 'role' : "'' AS role",
    columns.has('deleted_at') ? 'deleted_at' : 'NULL::timestamp AS deleted_at',
    columns.has('must_change_password') ? 'must_change_password' : 'NULL::boolean AS must_change_password',
  ];
  const { rows } = await pool.query(`SELECT ${select.join(', ')} FROM users ORDER BY id`);
  return rows;
};

const readRoleConstraint = async () => {
  const { rows } = await pool.query(
    "SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = 'users'::regclass AND contype = 'c'"
  );
  return rows.map((row) => row.def).find((def) => def?.includes('role'));
};

const printState = async (users, roleCheck) => {
  log(`\nTarget database : ${target}`);
  log(`Mode            : ${apply ? 'APPLY (menulis perubahan)' : 'CHECK (hanya membaca)'}`);
  log(`Akun terdaftar  : ${users.length}`);
  users.forEach((user) => {
    const flags = [
      user.role,
      user.deleted_at ? 'terhapus' : 'aktif',
      user.must_change_password ? 'wajib ganti sandi' : null,
    ].filter(Boolean);
    log(`  - id ${user.id}  ${user.username.padEnd(12)} ${user.email}  [${flags.join(', ')}]`);
  });
  log(`Role constraint : ${roleCheck || '(tidak ada)'}`);
};

const ensureColumns = async () => {
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `);
};

const ensureRoleConstraint = async (roleCheck) => {
  if (roleCheck && !roleCheck.includes('village')) {
    log('\n! Constraint role memakai nilai lama (huruf besar). Mengganti ke admin/village/sponsor...');
    await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
    await pool.query(
      "ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'sponsor', 'village'))"
    );
    await pool.query("UPDATE users SET role = 'admin' WHERE role = 'ADMIN'");
    await pool.query("UPDATE users SET role = 'village' WHERE role = 'DESA'");
    await pool.query("UPDATE users SET role = 'sponsor' WHERE role = 'SPONSOR'");
    return true;
  }
  return false;
};

const resolveEmail = async (account) => {
  const { rows } = await pool.query('SELECT username FROM users WHERE email = $1', [account.email]);
  if (rows.length === 0 || rows[0].username === account.username) return account.email;
  return `${account.username}@lentera.local`;
};

const upsertAccount = async (account) => {
  const passwordHash = await bcrypt.hash(account.password, 10);
  const email = await resolveEmail(account);
  const forceChange = !keepPasswords;

  const { rows } = await pool.query('SELECT id FROM users WHERE username = $1', [account.username]);

  if (rows.length > 0) {
    await pool.query(
      `UPDATE users
       SET password_hash = $1, role = $2, full_name = $3,
           deleted_at = NULL, must_change_password = $4,
           password_changed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [passwordHash, account.role, account.fullName, forceChange, rows[0].id]
    );
    log(`  ~ ${account.username} diperbarui (role ${account.role})`);
    return;
  }

  await pool.query(
    `INSERT INTO users (username, password_hash, email, role, full_name, must_change_password, password_changed_at)
     VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
    [account.username, passwordHash, email, account.role, account.fullName, forceChange]
  );
  log(`  + ${account.username} dibuat (${email}, role ${account.role})`);
};

const main = async () => {
  if (!(await usersTableExists())) {
    log(`\nTabel "users" tidak ditemukan di ${target}.`);
    log('Database belum punya skema aplikasi. Impor skema terbaru/migrasi dulu, baru jalankan skrip ini.');
    return;
  }

  const users = await readUsers();
  const roleCheck = await readRoleConstraint();
  await printState(users, roleCheck);

  if (!apply) {
    log('\nTidak ada perubahan. Jalankan dengan --apply untuk membuat/menyegarkan akun admin & kades.');
    return;
  }

  log('\nMenerapkan perubahan...');
  await ensureColumns();
  await ensureRoleConstraint(roleCheck);
  for (const account of ACCOUNTS) {
    await upsertAccount(account);
  }

  if (keepPasswords) {
    log('\nSelesai. must_change_password = false.');
  } else {
    log('\nSelesai. Kedua akun wajib mengganti sandi saat login pertama.');
  }
  log(`Login: ${ACCOUNTS.map((a) => a.username).join(' / ')} dengan sandi dari env SEED_*_PASSWORD (default admin123, kades123).`);
};

main()
  .catch((err) => {
    console.error('\nGagal:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
