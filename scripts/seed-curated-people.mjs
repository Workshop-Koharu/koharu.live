import pg from "pg";

const connectionString =
  "postgresql://neondb_owner:npg_NJhT4IV8bDrx@ep-rough-voice-b4xapbff-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";

const CURATED_PEOPLE = [
  { name: "선아", handle: "@sx0n._.a", role: "Friend 💖", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80", link: "https://instagram.com/sx0n._.a" },
  { name: "코블", handle: "@_koble_", role: "Friend 🌸", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80", link: "https://instagram.com/_koble_" },
  { name: "소성", handle: "@seosungdev", role: "Developer ✨", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80", link: "https://instagram.com/seosungdev" },
  { name: "수냥", handle: "@aer.unnynag0214", role: "Friend 🐱", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80", link: "https://instagram.com/aer.unnynag0214" },
  { name: "제이", handle: "@jxayx._.", role: "Friend 💫", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80", link: "https://instagram.com/jxayx._." },
  { name: "김치", handle: "@kimchi090113", role: "Friend 🥬", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80", link: "https://instagram.com/kimchi090113" },
  { name: "현이", handle: "@07lee_hyun", role: "Friend 🌿", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80", link: "https://instagram.com/07lee_hyun" },
  { name: "치킨무", handle: "@chimu314", role: "Friend 🍗", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80", link: "https://instagram.com/chimu314" },
];

async function main() {
  const pool = new pg.Pool({ connectionString });
  await pool.query("DELETE FROM site_people;");
  console.log("Cleared site_people table.");

  for (const p of CURATED_PEOPLE) {
    await pool.query(
      "INSERT INTO site_people (name, handle, role, avatar, link, created_at) VALUES ($1, $2, $3, $4, $5, NOW());",
      [p.name, p.handle, p.role, p.avatar, p.link]
    );
  }

  const count = await pool.query("SELECT count(*) FROM site_people;");
  console.log("Seeded exact 8 people to Neon DB! Total count:", count.rows[0].count);
  await pool.end();
}

main().catch(console.error);
