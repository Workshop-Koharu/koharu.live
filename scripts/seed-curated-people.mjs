import pg from "pg";

const connectionString =
  "postgresql://neondb_owner:npg_NJhT4IV8bDrx@ep-rough-voice-b4xapbff-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";

const CURATED_PEOPLE = [
  { name: "선아", handle: "sx0n._.a", role: "Discord Friend 💖" },
  { name: "코블", handle: "_koble_", role: "Discord Friend 🌸" },
  { name: "소성", handle: "seosungdev", role: "Developer ✨" },
  { name: "수냥", handle: "aer.unnynag0214", role: "Discord Friend 🐱" },
  { name: "제이", handle: "jxayx._.", role: "Discord Friend 💫" },
  { name: "김치", handle: "kimchi090113", role: "Discord Friend 🥬" },
  { name: "현이", handle: "07lee_hyun", role: "Discord Friend 🌿" },
  { name: "치킨무", handle: "chimu314", role: "Discord Friend 🍗" },
];

async function main() {
  const pool = new pg.Pool({ connectionString });
  await pool.query("DELETE FROM site_people;");
  console.log("Cleared site_people table.");

  for (const p of CURATED_PEOPLE) {
    await pool.query(
      "INSERT INTO site_people (name, handle, role, avatar, link, created_at) VALUES ($1, $2, $3, NULL, NULL, NOW());",
      [p.name, p.handle, p.role]
    );
  }

  const count = await pool.query("SELECT count(*) FROM site_people;");
  console.log("Seeded exact 8 people to Neon DB! Total count:", count.rows[0].count);
  await pool.end();
}

main().catch(console.error);
