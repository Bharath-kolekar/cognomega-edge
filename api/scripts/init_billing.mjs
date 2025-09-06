import pkg from "pg";
const { Pool } = pkg;

const conn = process.env.DATABASE_URL;
if (!conn) {
  console.error("DATABASE_URL not set"); process.exit(1);
}

// If sslmode=require is in URL (e.g., Neon), allow TLS
const ssl = /\bsslmode=require\b/i.test(conn || "") ? { rejectUnauthorized: false } : undefined;
const pool = new Pool({ connectionString: conn, ssl });

const DDL = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT COALESCE(gen_random_uuid(), uuid_generate_v4()),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credit_txn (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_credits NUMERIC(18,6) NOT NULL,
  reason TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usage_event (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  route TEXT NOT NULL,
  tokens_in INT NOT NULL DEFAULT 0,
  tokens_out INT NOT NULL DEFAULT 0,
  r2_class_a INT NOT NULL DEFAULT 0,
  r2_class_b INT NOT NULL DEFAULT 0,
  r2_gb_retrieved NUMERIC(18,6) NOT NULL DEFAULT 0,
  cost_credits NUMERIC(18,6) NOT NULL DEFAULT 0,
  request_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_txn_user_time ON credit_txn(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_event_user_time ON usage_event(user_id, created_at DESC);
`;

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(DDL);
    await client.query("COMMIT");
    console.log("✅ Schema ready");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Schema failed:", e.message);
    process.exit(1);
  } finally {
    client.release();
  }

  const email = process.env.ADMIN_EMAIL || "bharath@cognomega"; // change if needed
  const credits = Number(process.env.BOOTSTRAP_CREDITS || "50");

  const client2 = await pool.connect();
  try {
    await client2.query("BEGIN");
    const u = await client2.query(
      `INSERT INTO users(email) VALUES ($1)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      [email]
    );
    const userId = u.rows[0].id;
    await client2.query(
      `INSERT INTO credit_txn(user_id, amount_credits, reason, meta)
       VALUES ($1, $2, $3, $4)`,
      [userId, credits, "bootstrap-topup", {}]
    );
    await client2.query("COMMIT");
    console.log(`✅ Top-up added: ${credits} credits for ${email}`);
  } catch (e) {
    await client2.query("ROLLBACK");
    console.warn("Top-up skipped (likely already topped up):", e.message);
  } finally {
    client2.release();
  }

  await pool.end();
}

main().catch((e)=>{ console.error(e); process.exit(1); });
