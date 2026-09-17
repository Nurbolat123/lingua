import * as argon2 from 'argon2';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from './schema';

try { process.loadEnvFile(); } catch { /* optional */ }

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@lingua.local').trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password || password.length < 12) throw new Error('SEED_ADMIN_PASSWORD (min 12 chars) is required');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  await db
    .insert(users)
    .values({ email, passwordHash: await argon2.hash(password), role: 'ADMIN', firstName: 'Admin' })
    .onConflictDoNothing({ target: users.email });
  await pool.end();
  console.log(`Admin ready: ${email}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
