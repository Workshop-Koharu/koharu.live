import pg from "pg";

const connectionString = "postgresql://neondb_owner:npg_NJhT4IV8bDrx@ep-rough-voice-b4xapbff-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function main() {
  const pool = new pg.Pool({ connectionString });
  const bio = "🌸 개발과 창작을 좋아하는 코하루의 공간입니다.\n🎮 인디 게임 & 웹 프로젝트 제작\n✨ 비공식 스텔라이브 팬서버를 함께 운영하고 있어요!";
  await pool.query("UPDATE site_profile SET bio = $1 WHERE id = 1;", [bio]);
  console.log("Updated bio successfully!");
  await pool.end();
}

main().catch(console.error);
