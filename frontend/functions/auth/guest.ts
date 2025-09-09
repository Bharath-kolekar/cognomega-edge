export const onRequestPost: PagesFunction = async ({ request, env }) => {
  // client puts the token in header (App.tsx does this when available)
  const token = request.headers.get("CF-Turnstile-Token") ?? "";

  // Verify with Turnstile
  const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET,   // ← server-side secret
      response: token,
    }),
  }).then(r => r.json());

  if (!verify.success) {
    return new Response(JSON.stringify({ error: "turnstile_failed" }), { status: 403 });
  }

  // Issue your guest token (stubbed)
  const tokenPayload = { sub: "guest", exp: Math.floor(Date.now()/1000) + 600 };
  // sign a JWT or return your existing guest token here
  return Response.json({ token: "your-guest-token", exp: tokenPayload.exp });
};
