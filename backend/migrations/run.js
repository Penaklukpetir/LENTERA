import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = process.argv[2];

if (!target) {
  console.error('Usage: node migrations/run.js <file.sql>');
  process.exit(1);
}

const filePath = path.resolve(__dirname, target);
const sql = fs.readFileSync(filePath, 'utf8');

try {
  await pool.query(sql);
  console.log(`Migration applied: ${path.basename(filePath)}`);
} catch (err) {
  console.error(`Migration failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
