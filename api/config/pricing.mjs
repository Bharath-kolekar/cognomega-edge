export const PRICING = {
  TOKENS_PER_CREDIT: 1000,
  R2_CLASS_A_PER_CREDIT: 12500,
  R2_CLASS_B_PER_CREDIT: 277777,
  R2_GB_RETRIEVE_PER_CREDIT: 10,
  WARN_CREDITS: 10,
  HARD_STOP_BELOW: 1
};

export function creditsForUsage({tokensIn=0,tokensOut=0,r2A=0,r2B=0,r2Gb=0}){
  const t = (tokensIn+tokensOut)/PRICING.TOKENS_PER_CREDIT;
  const a = r2A/PRICING.R2_CLASS_A_PER_CREDIT;
  const b = r2B/PRICING.R2_CLASS_B_PER_CREDIT;
  const g = r2Gb/PRICING.R2_GB_RETRIEVE_PER_CREDIT;
  return +(t+a+b+g).toFixed(6);
}
