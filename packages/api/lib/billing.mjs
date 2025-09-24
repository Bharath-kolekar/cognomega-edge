import { q } from "./db.mjs";
import { PRICING, creditsForUsage } from "../config/pricing.mjs";
import { randomUUID } from "crypto";

/** Creates user if not exists (by email). */
export async function ensureUser(email){
  const r = await q("SELECT id FROM users WHERE email=$1",[email]);
  if (r.rowCount) return r.rows[0].id;
  const ins = await q("INSERT INTO users(email) VALUES($1) RETURNING id",[email]);
  return ins.rows[0].id;
}

export async function getBalance(userId){
  const r = await q("SELECT COALESCE(SUM(amount_credits),0) AS bal FROM credit_txn WHERE user_id=$1",[userId]);
  return r.rowCount ? Number(r.rows[0].bal) : 0;
}

export async function topup(userId, amount, reason="manual-topup", meta={}){
  await q("INSERT INTO credit_txn(user_id, amount_credits, reason, meta) VALUES($1,$2,$3,$4)",[userId, amount, reason, meta]);
}

export async function charge(userId, route, usage, requestId){
  const cost = creditsForUsage({
    tokensIn: usage.tokens_in||0,
    tokensOut: usage.tokens_out||0,
    r2A: usage.r2_class_a||0,
    r2B: usage.r2_class_b||0,
    r2Gb: usage.r2_gb_retrieved||0
  });
  await q("BEGIN");
  try {
    await q(`INSERT INTO usage_event(user_id, route, tokens_in, tokens_out, r2_class_a, r2_class_b, r2_gb_retrieved, cost_credits, request_id)
             VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [userId, route, usage.tokens_in||0, usage.tokens_out||0, usage.r2_class_a||0, usage.r2_class_b||0, usage.r2_gb_retrieved||0, cost, requestId]);
    await q(`INSERT INTO credit_txn(user_id, amount_credits, reason, meta)
             VALUES($1,$2,$3,$4)`,
      [userId, -cost, `usage:${route}`, usage]);
    await q("COMMIT");
  } catch(e){ await q("ROLLBACK"); throw e; }
  return cost;
}

/** Express middleware: blocks when balance too low; attaches req.chargeUsage() */
export function billingGuard(){
  return async (req,res,next)=>{
    try{
      const email = (req.user?.email) || (req.auth?.email) || req.headers["x-user-email"];
      if(!email) return res.status(401).json({error:"unauthorized"});
      const userId = await ensureUser(email);
      const bal = await getBalance(userId);
      if (bal < PRICING.HARD_STOP_BELOW){
        res.setHeader("X-Credits-Balance", bal);
        return res.status(402).json({error:"insufficient_credits", balance: bal});
      }
      req.userId = userId;

      // No default param expression; compute inside to avoid parser quirks
      req.chargeUsage = async (usage, requestId)=>{
        const id = requestId || req.id || randomUUID();
        const routePath = (req.route && req.route.path) ? req.route.path : req.path;
        const cost = await charge(userId, routePath, usage, id);
        const newBal = await getBalance(userId);
        res.setHeader("X-Request-ID", id);
        res.setHeader("X-Credits-Used", cost);
        res.setHeader("X-Credits-Balance", newBal);
        return { cost, balance: newBal };
      };

      next();
    } catch(e){ next(e); }
  };
}
