import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_NJhT4IV8bDrx@ep-rough-voice-b4xapbff-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

async function run() {
  console.log('[DB] Altering columns to TEXT for file uploads...');
  await sql.query('ALTER TABLE site_profile ALTER COLUMN avatar_url TYPE TEXT;');
  await sql.query('ALTER TABLE site_profile ALTER COLUMN banner_url TYPE TEXT;');
  await sql.query('ALTER TABLE blog_posts ALTER COLUMN cover_url TYPE TEXT;');
  console.log('[DB] Migration complete: avatar_url, banner_url, cover_url are now TEXT!');
}

run().catch((e) => {
  console.error('[DB] Migration error:', e);
  process.exit(1);
});
