import pg from "pg";

const connectionString =
  "postgresql://neondb_owner:npg_NJhT4IV8bDrx@ep-rough-voice-b4xapbff-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function main() {
  const pool = new pg.Pool({ connectionString });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_people (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      handle VARCHAR(100),
      role VARCHAR(100) DEFAULT 'Friend',
      status TEXT,
      avatar TEXT,
      link TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  `);
  console.log("site_people table created successfully!");
  const res = await pool.query("SELECT count(*) FROM site_people;");
  console.log("Current site_people count:", res.rows[0].count);
  await pool.end();
}

main().catch(console.error);
