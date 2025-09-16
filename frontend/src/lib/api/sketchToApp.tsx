// frontend/src/lib/api/sketchToApp.tsx
/**
 * Sketch → App API utilities (production-grade)
 * Endpoints used:
 *   - /api/si/ask                 (skill router)
 *   - /api/upload/direct          (stream upload to R2)
 *   - /api/jobs/:id               (status polling)
 *   - /api/jobs/:id/download      (artifact)
 *
 * Enhancements:
 *   - Intelligence tiers (human/advanced/super) with presets & skills
 *   - A/B telemetry headers (X-Intelligence-Tier, X-AB-Variant, X-Client-Id…)
 *   - Body telemetry (tier, AB, client id, skills, etc.)
 *   - Safer parsing, header-size guards, and resilient job-id extraction
 */

import { apiUrl, authHeaders, fetchJson, readUserEmail } from "./apiBase";

/* --------------------------------- Types ----------------------------------- */

export type IntelligenceTier = "human" | "advanced" | "super";

export type SketchToAppRequest = {
  name: string;
  pages?: string;
  description: string;
  modelHint?: string | null;
  intelligenceTier?: IntelligenceTier;
  /**
   * Arbitrary server-side settings. We also merge tier presets here.
   * You can pass { skills_overrides: {...}, source, builder_base, ... }.
   */
  settings?: Record<string, unknown> & {
    builder_base?: string;
    source?: string;
    // optional skills overrides (free-form for backend)
    skills_overrides?: Partial<SkillsBundle>;
  };
};

export type SketchToAppResponse =
  | { ok: true; content?: string; jobId?: string; slug?: string; meta?: Record<string, unknown> }
  | { ok: false; error: string; meta?: Record<string, unknown> };

export type AppBuildJob = {
  id: string;
  status: "queued" | "working" | "done" | "error" | string;
  progress?: string | number | null;
  result?: unknown;
  message?: string | null;
};

export type CreateJobOk = {
  ok: true;
  jobId: string;
  status?: string;
  key?: string;
  meta?: Record<string, unknown>;
};
export type CreateJobErr = { ok: false; error: string; meta?: Record<string, unknown> };
export type CreateJobResult = CreateJobOk | CreateJobErr;

export type JobInfo = {
  id: string;
  status: "queued" | "working" | "done" | "error" | string;
  progress?: number | string | null;
  r2_url?: string | null;
  result_text?: string | null;
  result?: unknown;
  message?: string | null;
};
export type JobStatusResponse = { job?: Partial<JobInfo> };

/* --------------------------- Skills & Tier presets -------------------------- */

export type SkillsBundle = {
  codegen_plus: boolean;           // stronger codegen (multi-file, patterns)
  generate_unit_tests: boolean;
  generate_e2e_tests: boolean;
  security_scan: boolean;          // deps/secrets/vulns checks
  refactor_suggestions: boolean;   // propose refactors/cleanups
  typed_api_clients: boolean;      // OpenAPI synthesis → typed clients
  i18n_scaffold: boolean;
  analytics_wiring: boolean;       // basic events + plumbing
  performance_budget: boolean;     // chunking / lazy-loading hints
  docs_and_comments: boolean;      // docstrings/READMEs/changelogs
  error_boundaries: boolean;       // React error boundaries
  playwright_specs: boolean;       // playwright boilerplate
  rag_scaffold: boolean;           // vector search + RAG wiring
};

const SKILLS_SUPER: SkillsBundle = {
  codegen_plus: true,
  generate_unit_tests: true,
  generate_e2e_tests: true,
  security_scan: true,
  refactor_suggestions: true,
  typed_api_clients: true,
  i18n_scaffold: true,
  analytics_wiring: true,
  performance_budget: true,
  docs_and_comments: true,
  error_boundaries: true,
  playwright_specs: true,
  rag_scaffold: true,
};

const SKILLS_ADV: SkillsBundle = {
  ...SKILLS_SUPER,
  // (kept same defaults; tuned server-side)
  performance_budget: true,
  playwright_specs: true,
  rag_scaffold: true,
};

const SKILLS_HUMAN: SkillsBundle = {
  codegen_plus: true,
  generate_unit_tests: false,
  generate_e2e_tests: false,
  security_scan: false,
  refactor_suggestions: true,
  typed_api_clients: false,
  i18n_scaffold: false,
  analytics_wiring: false,
  performance_budget: false,
  docs_and_comments: true,
  error_boundaries: true,
  playwright_specs: false,
  rag_scaffold: false,
};

function presetForTier(tier: IntelligenceTier | undefined) {
  const t = tier ?? "advanced";

  if (t === "super") {
    return {
      intelligenceTier: "super",
      planner: "systematic",
      depth: "deep",
      critiquePasses: 2,
      temperature: 0.4,
      max_iterations: 4,
      model_policy: "best",
      toolset: [
        "ui", "api", "codegen", "schema", "tests", "planner_graph",
        "self_reflection", "critique_rewrite", "perf_budgeting",
        "security_scan", "analytics_wiring", "i18n_scaffold",
        "error_boundaries", "streaming_ui", "playwright_specs",
        "vector_search", "rag_scaffold", "vite_chunking",
        "cf_pages_deploy", "webworker_llm_runtime", "r2_upload_pipeline",
        "api_synthesis_openapi", "schema_inference_sqlite",
        "codegen_typescript_react", "ui_auto_layout",
      ],
      skills: SKILLS_SUPER,
    };
  }

  if (t === "human") {
    return {
      intelligenceTier: "human",
      planner: "human-like",
      depth: "shallow",
      critiquePasses: 0,
      temperature: 0.9,
      max_iterations: 1,
      model_policy: "fast",
      toolset: ["ui", "api"],
      skills: SKILLS_HUMAN,
    };
  }

  // advanced (default)
  return {
    intelligenceTier: "advanced",
    planner: "balanced",
    depth: "balanced",
    critiquePasses: 1,
    temperature: 0.7,
    max_iterations: 2,
    model_policy: "balanced",
    toolset: ["ui", "api", "codegen"],
    skills: SKILLS_ADV,
  };
}

/* -------------------------- Client identity & A/B --------------------------- */

const CID_KEY = "cm_client_id";

function getClientId(): string {
  try {
    const v = localStorage.getItem(CID_KEY);
    if (v && v.trim()) return v;
  } catch {}
  const id = genUuid();
  try { localStorage.setItem(CID_KEY, id); } catch {}
  return id;
}

function genUuid(): string {
  try {
    const g = (globalThis as any)?.crypto?.getRandomValues?.bind(globalThis.crypto);
    if (g) {
      const a = new Uint8Array(16);
      g(a);
      a[6] = (a[6] & 0x0f) | 0x40;
      a[8] = (a[8] & 0x3f) | 0x80;
      const h = [...a].map(x => x.toString(16).padStart(2, "0")).join("");
      return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
    }
  } catch {}
  return `cid_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function hash32(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return h >>> 0;
}
function abBucket(seed: string): "A" | "B" { return (hash32(seed) % 2) === 0 ? "A" : "B"; }

/* ------------------------------ Skill: start (SI) --------------------------- */

export async function startSketchToApp(
  req: SketchToAppRequest,
  extraHeaders: HeadersInit = {}
): Promise<SketchToAppResponse> {
  const tier = req.intelligenceTier ?? "advanced";
  const tierPreset = presetForTier(tier);

  const safeName = (req.name || "MyApp").toString().slice(0, 128);
  const safePages = (req.pages || "").toString().slice(0, 256);
  const description = (req.description || "").toString();
  const modelHint = req.modelHint ?? null;

  const client_id = getClientId();
  const user_email = readUserEmail();
  const seed = user_email || client_id;
  const abVariant = abBucket(seed);

  // Merge skills overrides for fine-grained control
  const skillsMerged =
    typeof req.settings?.skills_overrides === "object"
      ? { ...tierPreset.skills, ...(req.settings!.skills_overrides as object) }
      : tierPreset.skills;

  const settingsMerged = {
    ...tierPreset,
    ...(req.settings ?? {}),
    skills: skillsMerged,
  };

  // Tiny header-friendly skills summary (guard header size)
  const skillHeader = Object.entries(skillsMerged as Record<string, boolean>)
    .filter(([, v]) => !!v)
    .map(([k]) => k)
    .slice(0, 16)                      // keep compact
    .join(",");

  const body = {
    skill: "sketch_to_app",
    input: {
      name: safeName,
      pages: safePages,
      description,
      model_hint: modelHint,
      settings: settingsMerged,
      telemetry: {
        tier,
        ab: abVariant,
        client_id,
        client_ts: Date.now(),
        user_email: user_email ?? undefined,
        project: { name: safeName, pages: safePages },
        builder_base: (req.settings as any)?.builder_base,
        source: (req.settings as any)?.source || "app_maker",
        user_agent: (typeof navigator !== "undefined" && navigator.userAgent) || "unknown",
        skills_enabled: skillsMerged,
      },
    },
  };

  const url = apiUrl("/api/si/ask");

  // Compose headers: auth + A/B + skills
  const abHeaders: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Intelligence-Tier": tier,
    "X-AB-Variant": abVariant,
    "X-Client-Id": client_id,
    "X-Client-TS": String(Date.now()),
    "X-Project-Name": safeName,
    "X-Project-Pages": safePages,
    "X-Experiment": `SketchToApp_${tier}_${abVariant}`,
    "X-Skills": skillHeader,
    ...(user_email ? { "X-User-Email": user_email } : {}),
  };
  const merged = new Headers(authHeaders({ ...abHeaders, ...headersToObject(extraHeaders) }));

  const r = await fetch(url, {
    method: "POST",
    mode: "cors",
    credentials: "omit",
    headers: merged,
    body: JSON.stringify(body),
  });

  const ct = (r.headers.get("content-type") || "").toLowerCase();
  const data: any = ct.includes("application/json") ? await r.json() : await r.text();

  if (!r.ok) {
    const msg = (typeof data === "string" ? data : data?.error) || `${r.status} ${r.statusText}`;
    return { ok: false, error: String(msg), meta: safeMeta(data) };
  }

  return {
    ok: true,
    content: narrowContent(data),
    jobId:
      (data?.result?.jobId as string) ??
      (data?.jobId as string) ??
      (data?.job_id as string) ??
      undefined,
    slug: (data?.result?.slug as string) ?? (data?.slug as string) ?? undefined,
    meta: (data?.result?.meta as Record<string, unknown>) ?? data?.meta ?? undefined,
  };
}

/* ----------------------------- Create Job (upload) ------------------------- */

export async function createSketchToAppJob(
  file: File,
  prompt?: string,
  jwt?: string,
  email?: string
): Promise<CreateJobResult> {
  try {
    const qs = new URLSearchParams();
    qs.set("filename", file.name);
    if (prompt && prompt.trim()) qs.set("prompt", prompt.trim());

    const url = apiUrl(`/api/upload/direct?${qs.toString()}`);

    const baseHeaders: Record<string, string> = {
      "Content-Type": (file.type && file.type.trim()) || "application/octet-stream",
      Accept: "application/json",
      ...(prompt && prompt.trim() ? { "X-Upload-Notes": prompt.trim() } : {}),
    };

    const hdr = new Headers(authHeaders(baseHeaders));
    if (jwt) hdr.set("Authorization", `Bearer ${jwt}`);
    if (email) hdr.set("X-User-Email", email);

    const res = await fetch(url, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      headers: hdr,
      body: file,
    });

    // Handle 202 Accepted + Location/X-Job-Id patterns
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const data: any = ct.includes("application/json") ? await res.json() : await res.text();

    if (!res.ok) {
      const msg = (typeof data === "string" ? data : data?.error) || `${res.status} ${res.statusText}`;
      return { ok: false, error: String(msg), meta: safeMeta(data) };
    }

    let jobId = pickJobId(data, res.headers);
    if (!jobId) {
      const loc = res.headers.get("Location") || res.headers.get("location");
      const m = loc && /\/api\/jobs\/([^/?#]+)/i.exec(loc);
      if (m && m[1]) jobId = m[1];
    }

    const status = (data?.status as string) || (res.status === 202 ? "queued" : "working");
    const key = (data?.key as string) || undefined;

    if (jobId) return { ok: true, jobId, status, key, meta: safeMeta(data) };

    return {
      ok: true,
      jobId: "",
      status,
      key,
      meta: { note: "Upload succeeded but server did not return a job id.", ...safeMeta(data) },
    };
  } catch (e: any) {
    const msg = (e?.message || e)?.toString?.() || "upload failed";
    return { ok: false, error: msg };
  }
}

/* ------------------------------ Get Job Status ----------------------------- */

export async function getJobStatus(jobId: string): Promise<JobInfo> {
  const { data } = await fetchJson<JobStatusResponse>(`/api/jobs/${encodeURIComponent(jobId)}`);
  const job = (data && (data as any).job) || {};
  return normalizeJob(jobId, job);
}

/* --------------------------- Download Job Artifact -------------------------- */

export async function downloadJobArtifact(jobId: string): Promise<void> {
  const url = apiUrl(`/api/jobs/${encodeURIComponent(jobId)}/download`);
  const res = await fetch(url, {
    method: "GET",
    mode: "cors",
    credentials: "omit",
    headers: authHeaders({ Accept: "*/*" }),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

  const cd = res.headers.get("content-disposition") || "";
  const name = parseFilenameFromContentDisposition(cd) || `job_${jobId}.bin`;

  const blob = await res.blob();
  const durl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = durl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(durl);
}

/* --------------------------------- Helpers --------------------------------- */

function narrowContent(data: any): string | undefined {
  if (!data) return undefined;
  if (typeof data === "string") return data;
  return (
    (data?.result?.content as string) ??
    (data?.content as string) ??
    (data?.message as string) ??
    undefined
  );
}

function pickJobId(data: any, headers: Headers): string | null {
  const headerId = headers.get("X-Job-Id") || headers.get("x-job-id");
  if (headerId && headerId.trim()) return headerId.trim();
  const id = data?.jobId ?? data?.job_id ?? data?.id ?? data?.job?.id ?? null;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

function parseFilenameFromContentDisposition(cd: string): string | null {
  try {
    // Prefer RFC5987 filename* if present
    const star = cd.match(/filename\*=(?:UTF-8'')?([^;]+)/i);
    if (star && star[1]) {
      const raw = star[1].replace(/^"+|"+$/g, "");
      try { return decodeURIComponent(raw); } catch { return raw; }
    }
    const m = cd.match(/filename="?([^";]+)"?/i);
    if (m && m[1]) return m[1];
    return null;
  } catch { return null; }
}

function safeMeta(x: unknown): Record<string, unknown> | undefined {
  if (!x || typeof x !== "object") return undefined;
  try { return JSON.parse(JSON.stringify(x)); } catch { return undefined; }
}

function normalizeJob(jobId: string, job: Partial<JobInfo>): JobInfo {
  const statusRaw = (job.status ?? (job as any)?.state ?? "queued") as string;
  const status = typeof statusRaw === "string" ? statusRaw : String(statusRaw);
  let progress: number | string | null = null;

  const p = (job.progress as any);
  if (typeof p === "number") progress = p;
  else if (typeof p === "string") {
    const pct = p.trim().endsWith("%") ? parseFloat(p) : Number(p);
    progress = Number.isFinite(pct) ? pct : p;
  }

  return {
    id: String(job.id ?? jobId),
    status,
    progress,
    r2_url: (job.r2_url as any) ?? null,
    result_text: (job.result_text as any) ?? null,
    result: job.result,
    message: (job.message as any) ?? null,
  };
}

function headersToObject(h: HeadersInit): Record<string, string> {
  if (h instanceof Headers) {
    const out: Record<string, string> = {};
    h.forEach((v, k) => (out[k] = v));
    return out;
  }
  if (Array.isArray(h)) return Object.fromEntries(h);
  return { ...(h as Record<string, string>) };
}

/* --------------------------------- Export ----------------------------------- */

const api = {
  startSketchToApp,
  createSketchToAppJob,
  getJobStatus,
  downloadJobArtifact,
};
export default api;
