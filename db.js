const { Pool, types } = require("pg");

// due_datetime/created_at are Postgres "timestamp without time zone" (OID 1114).
// By default node-postgres parses those into JS Date objects using the
// process's local timezone, and Express's res.json() then serializes Date
// objects via toISOString() — which stamps a "Z" (UTC) suffix onto a value
// that was never actually UTC. The frontend correctly reads that "Z" as UTC
// and converts it to the browser's local time, producing the 5:30 drift.
// Returning the raw text instead keeps the value exactly as stored/submitted.
types.setTypeParser(1114, (value) => value);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
 
module.exports = {
  query: (text, params, callback) => pool.query(text, params, callback),
};
 