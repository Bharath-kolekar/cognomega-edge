import { apiReady, apiHealthz } from "@/lib/api/healthcheck";

import { fetchJson, ensureApiEndpoints } from "./apiBase";

export async function apiReady() {
  const { ready } = await ensureApiEndpoints();
  return fetchJson(ready);
}

export async function apiHealthz() {
  const { healthz } = await ensureApiEndpoints();
  return fetchJson(healthz);
}

