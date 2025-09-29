// packages/api/src/providerGuard.ts
export function isProviderAllowed(name: string, env: Record<string,string>): boolean {
  // Comma list of allowed providers (default: 'local' only)
  const allow = (env.ALLOW_PROVIDERS || 'local')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(name.toLowerCase());
}

export function assertProviderAllowed(name: string, env: Record<string,string>) {
  if (!isProviderAllowed(name, env)) {
    const msg = `provider '${name}' is disabled by ALLOW_PROVIDERS`;
    // Prefer 403 so callers see a clear, intentional policy block
    throw Object.assign(new Error(msg), { status: 403 });
  }
}
