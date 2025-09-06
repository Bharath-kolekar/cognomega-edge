import { SignJWT } from "jose";
const secret = process.env.JWT;
if (!secret) { console.error("Set env JWT to your worker secret in $env:JWT"); process.exit(1); }
const enc = new TextEncoder().encode(secret);
const token = await new SignJWT({ role: "owner" })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuer("cognomega")
  .setAudience("cognomega-clients")
  .setSubject("owner@cognomega.com")
  .setIssuedAt()
  .setExpirationTime("5m")
  .sign(enc);
console.log(token);
