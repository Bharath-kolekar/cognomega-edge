import { Router } from "express";
import { runSkill, listSkills } from "../si/engine.mjs";
import { billingGuard } from "../lib/billing.mjs";

export const si = Router();

// Public: list skills (no billing)
si.get("/skills", (_req,res)=> res.json({ skills: listSkills() }) );

// Protected: ask (billed)
si.post("/ask", billingGuard(), async (req,res,next)=>{
  try{
    const { result, usage } = await runSkill(req.body||{});
    const { cost, balance } = await req.chargeUsage(usage);
    res.json({ ok:true, result, usage, cost, balance });
  }catch(e){ next(e); }
});
