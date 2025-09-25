import pg from "pg";
const { Pool } = pg;

// No connection is made until you run a query.
// Set DATABASE_URL in prod (e.g., postgres://...).
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10
});

export async function q(text, params){
  const c = await pool.connect();
  try { return await c.query(text, params); }
  finally { c.release(); }
}
