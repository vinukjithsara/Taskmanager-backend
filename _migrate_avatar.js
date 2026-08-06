require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    const before = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position"
    );
    console.log("BEFORE:", before.rows.map((r) => r.column_name).join(", "));

    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT");

    const after = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position"
    );
    console.log("AFTER:", after.rows.map((r) => r.column_name).join(", "));

    await pool.end();
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
})();
