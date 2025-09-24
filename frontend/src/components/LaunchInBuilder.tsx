import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  startSketchToApp,
  getJobStatus,
  downloadJobArtifact,
  type IntelligenceTier,
  type JobInfo,
  type SketchToAppResponse,
} from "../lib/api/sketchToApp";
import { readUserEmail } from "../lib/api/apiBase";

/* ------------------------------ Local prefs ------------------------------ */

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;
const PREFS_KEY = "launch_in_builder_pref";

type Prefs = {
  name?: string;
  pages?: string;
  tier?: IntelligenceTier;
  modelHint?: string;
  skills?: Record<string, boolean>;
};

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Prefs;
  } catch {
    return {};
  }
}
function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {}
}

/* ------------------------------ UI constants ----------------------------- */

const fieldCls =
  "w-full rounded-2xl border border-white/40 bg-white/70 px-4 py-2.5 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-slate-950 backdrop-blur placeholder:text-slate-500 dark:placeholder:text-slate-400";

const checkboxCls =
  "h-4 w-4 rounded border-white/40 bg-white/80 text-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-400 dark:border-white/20 dark:bg-slate-900/70 dark:text-indigo-300";

/* ------------------------------ Skill defaults --------------------------- */

const DEFAULT_SKILLS: Record<string, boolean> = {
  codegen_plus: true,
  generate_unit_tests: true,
  generate_e2e_tests: false,
  security_scan: true,
  refactor_suggestions: true,
  typed_api_clients: true,
  i18n_scaffold: false,
  analytics_wiring: true,
  performance_budget: false,
  docs_and_comments: true,
  error_boundaries: true,
  playwright_specs: false,
  rag_scaffold: false,
};

/* ------------------------------ Helpers ---------------------------------- */

type Props = {
  defaultName?: string;
  defaultPages?: string;
  defaultDesc?: string;
  /** allow overriding (falls back to builder.cognomega.com) */
  baseUrl?: string;
};

// Type guard to avoid TS union narrowing issues
function isErr(
  resp: SketchToAppResponse
): resp is Extract<SketchToAppResponse, { ok: false }> {
  return (resp as any)?.ok === false;
}

/** Keep <textarea> description synced with parent default until user edits */
function useSyncedDefaultDesc(external?: string) {
  const [dirty, setDirty] = useState(false);
  const [val, setVal] = useState(() => (external ?? "").toString());
  const lastExternal = useRef(external ?? "");

  useEffect(() => {
    const ext = external ?? "";
    if (!dirty && ext !== lastExternal.current) {
      setVal(ext);
      lastExternal.current = ext;
    }
  }, [external, dirty]);

  const set = useCallback((s: string) => {
    setDirty(true);
    setVal(s);
  }, []);

  return [val, set] as const;
}

/* -------------------------------- Component ------------------------------- */

export default function LaunchInBuilder({
  defaultName,
  defaultPages,
  defaultDesc,
  baseUrl,
}: Props) {
  const prefs = useMemo(() => loadPrefs(), []);
  const [name, setName] = useState(
    () => prefs.name ?? defaultName ?? "MyApp"
  );
  const [pages, setPages] = useState(
    () => prefs.pages ?? defaultPages ?? "Home,Dashboard,Chat"
  );
  const [desc, setDesc] = useSyncedDefaultDesc(prefs?.name ? prefs.name : defaultDesc);
  const [tier, setTier] = useState<IntelligenceTier>(
    () => (prefs.tier as IntelligenceTier) ?? "advanced"
  );
  const [modelHint, setModelHint] = useState(() => prefs.modelHint ?? "");
  const [skills, setSkills] = useState<Record<string, boolean>>(
    () => ({ ...DEFAULT_SKILLS, ...(prefs.skills || {}) })
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobInfo | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [contentUrl, setContentUrl] = useState<string | null>(null);

  const pollTimer = useRef<number | null>(null);
  const pollStart = useRef<number>(0);

  // Store prefs as user types
  useEffect(() => {
    savePrefs({ name, pages, tier, modelHint, skills });
  }, [name, pages, tier, modelHint, skills]);

  const email = useMemo(() => readUserEmail() || "", []);
  const builderBase = useMemo(() => {
    if (baseUrl) return baseUrl;
    try {
      const { hostname, origin } = window.location;
      // If already on builder.* use same origin
      if (hostname.startsWith("builder.") && hostname.includes("cognomega.com")) {
        return origin;
      }
      // Pages preview mapping: app-*.pages.dev -> builder-*.pages.dev
      const pagesMatch = hostname.match(/^app-(.+)\.pages\.dev$/i);
      if (pagesMatch)
        return `${window.location.protocol}//builder-${pagesMatch[1]}.pages.dev`;
    } catch {}
    return "https://builder.cognomega.com";
  }, [baseUrl]);

  const canLaunch = (!!name || !!pages || !!desc) && !busy;
  const canGenerate = ( (!!name && !!pages) || !!desc ) && !busy;

  const launch = () => {
    const qp = new URLSearchParams({
      name: name || "MyApp",
      pages: pages || "Home,Dashboard,Chat",
      desc: desc || "",
      autogen: "1",
      tier,
    });
    if (modelHint.trim()) qp.set("model_hint", modelHint.trim());
    const url = `${builderBase}/?${qp.toString()}`;
    window.open(url, "_blank", "noopener");
  };

  const clearPoll = useCallback(() => {
    if (pollTimer.current) {
      window.clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const pollOnce = useCallback(
    async (id: string) => {
      try {
        const js = await getJobStatus(id);
        setJob(js);
        if ((js as any)?.slug) setSlug((js as any).slug);
        if ((js as any)?.content_url) setContentUrl((js as any).content_url);

        const state = (js?.status || "").toLowerCase();
        if (state === "done" || state === "error") {
          clearPoll();
          setBusy(false);
          setInfo(state === "done" ? "Build complete." : null);
          if (state === "error") setError(js?.message ? String(js.message) : "Build failed.");
          return;
        }

        if (Date.now() - pollStart.current > POLL_TIMEOUT_MS) {
          clearPoll();
          setBusy(false);
          setError("Timed out waiting for job to complete.");
          return;
        }

        pollTimer.current = window.setTimeout(() => pollOnce(id), POLL_INTERVAL_MS);
      } catch (err: any) {
        clearPoll();
        setBusy(false);
        setError(String(err?.message || err || "Failed to poll job."));
      }
    },
    [clearPoll]
  );

  const onGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setBusy(true);
    setError(null);
    setInfo("Generating plan…");

    try {
      const resp = (await startSketchToApp({
        name,
        pages,
        desc,
        tier,
        modelHint: modelHint || undefined,
        skills,
      } as any)) as SketchToAppResponse;

      if (isErr(resp)) {
        setBusy(false);
        setError(resp?.error || "Failed to start plan.");
        setInfo(null);
        return;
      }

      const id = (resp as any)?.job_id ?? (resp as any)?.id ?? null;
      const returnedSlug = (resp as any)?.slug ?? null;
      setJobId(id);
      setSlug(returnedSlug);

      pollStart.current = Date.now();
      if (id) {
        pollTimer.current = window.setTimeout(() => pollOnce(id), POLL_INTERVAL_MS);
      } else {
        setBusy(false);
        setInfo(null);
        setError("No job id returned.");
      }
    } catch (err: any) {
      setBusy(false);
      setInfo(null);
      setError(String(err?.message || err || "Failed to start plan."));
    }
  }, [canGenerate, name, pages, desc, tier, modelHint, skills, pollOnce]);

  useEffect(() => () => clearPoll(), [clearPoll]);

  const toggle = (k: keyof typeof DEFAULT_SKILLS) =>
    setSkills((s) => ({ ...s, [k]: !s[k] }));

  const onKeySubmit = (e: React.KeyboardEvent) => {
    // Submit on Ctrl/Cmd + Enter
    // @ts-expect-error: nativeEvent may have isComposing
    if (e.isComposing || e.nativeEvent?.isComposing) return;
    const isEnter = e.key === "Enter" || e.key === "NumpadEnter";
    if (isEnter && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (canGenerate) void onGenerate();
    }
  };

  const builderFromSlug = useMemo(() => {
    if (!slug) return null;
    // Prefer a typed URL returned by backend if present
    if (contentUrl) return contentUrl;
    // Fallback: pass slug in query for builder to load plan
    return `${builderBase}/?slug=${encodeURIComponent(slug)}`;
  }, [slug, contentUrl, builderBase]);

  return (
    <div
      className="glass-card space-y-6 px-6 py-6 text-sm text-slate-700 shadow-glass dark:text-slate-200 sm:px-8 sm:py-8"
      data-role="builder"
      data-user-email={email}
      data-voice-hint="Open the real-time App Builder. It generates apps from your description and pages."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
            Realtime builder
          </span>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Ship while you sketch
          </h2>
        </div>
        <span className="rounded-full border border-white/40 bg-white/70 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300">
          Opens in a new tab
        </span>
      </div>

      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        Describe your app and we’ll spin up a Builder session with suggested
        pages, AI skills, and wiring.
      </p>

      <div className="grid gap-3 lg:grid-cols-[1.1fr_1.1fr_0.9fr]">
        <input
          className={fieldCls}
          placeholder="Sketch/App name (e.g. Sales Dashboard)"
          aria-label="App name"
          data-voice-hint="Name your app. This appears in the Builder header."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onKeySubmit}
        />
        <input
          className={fieldCls}
          placeholder="Pages (comma-separated)"
          aria-label="Pages"
          data-voice-hint="Enter comma-separated pages. We’ll pre-seed the Builder with these screens."
          value={pages}
          onChange={(e) => setPages(e.target.value)}
          onKeyDown={onKeySubmit}
        />
        <select
          className={fieldCls}
          value={tier}
          onChange={(e) => setTier(e.target.value as IntelligenceTier)}
          title="Intelligence tier"
          aria-label="Intelligence Tier"
          data-voice-hint="Choose your Intelligence Tier: Human-like, Advanced, or Super."
        >
          <option value="human">Human-like</option>
          <option value="advanced">Advanced</option>
          <option value="super">Super</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={launch}
          disabled={!canLaunch}
          className="btn-base btn-primary"
          data-role="launch-builder"
          data-voice-hint="Open the Real-time App Builder in a new tab. Your name, pages, and description are passed through."
        >
          Launch in Builder
        </button>
        <button
          onClick={onGenerate}
          disabled={!canGenerate}
          className="btn-base btn-secondary disabled:opacity-60"
          title="Start App Maker plan and monitor build"
          data-role="generate-plan"
          data-voice-hint="Generate a plan in App Maker and monitor build progress here."
        >
          {busy ? "Generating…" : "Generate"}
        </button>
      </div>

      <textarea
        className={`${fieldCls} min-h-[120px]`}
        placeholder="Description (optional)"
        aria-label="Description"
        rows={3}
        data-voice-hint="Describe your app or requirements. The Builder uses this to generate a better starting point."
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        onKeyDown={onKeySubmit}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div
          className="glass-surface-soft rounded-2xl border border-white/40 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60"
          data-voice-hint="Toggle advanced coding AI capabilities such as tests, security scans, and performance budgets."
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Advanced coding AI
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure scaffolding, tests, and guardrails for generated code.
              </p>
            </div>
            <span className="rounded-full border border-white/50 bg-white/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.25em] text-slate-500 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-400">
              Skills
            </span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["codegen_plus", "Codegen+"],
                ["generate_unit_tests", "Unit tests"],
                ["generate_e2e_tests", "E2E tests"],
                ["security_scan", "Security scan"],
                ["refactor_suggestions", "Refactor suggestions"],
                ["typed_api_clients", "Typed API clients"],
                ["i18n_scaffold", "i18n scaffold"],
                ["analytics_wiring", "Analytics wiring"],
                ["performance_budget", "Performance budget"],
                ["docs_and_comments", "Docs & comments"],
                ["error_boundaries", "Error boundaries"],
                ["playwright_specs", "Playwright specs"],
                ["rag_scaffold", "RAG scaffold"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/40 bg-white/60 px-3 py-2 text-sm shadow-sm backdrop-blur transition hover:border-indigo-300/60 dark:border-white/10 dark:bg-slate-900/60 dark:hover:border-indigo-400/40"
              >
                <span>{label}</span>
                <input
                  type="checkbox"
                  className={checkboxCls}
                  checked={(skills as any)[key]}
                  onChange={() => toggle(key as keyof typeof DEFAULT_SKILLS)}
                  aria-label={label}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="glass-surface-soft flex flex-col gap-3 rounded-2xl border border-white/40 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
          <div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Advanced options
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Control model preferences and resume a generated plan.
            </p>
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400">
              Model hint (optional)
            </label>
            <input
              className={fieldCls}
              placeholder="e.g., prefer gpt-4o-mini or llama-3.1"
              value={modelHint}
              onChange={(e) => setModelHint(e.target.value)}
              onKeyDown={onKeySubmit}
            />
          </div>
          {slug && (
            <a
              href={builderFromSlug || "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-500 transition hover:text-indigo-400"
              title="Open Builder with your generated plan"
            >
              Open Builder with plan ↗
            </a>
          )}
        </div>
      </div>

      {(info || error) && (
        <div className="space-y-2">
          {info && (
            <div className="message-bubble" data-tone="info">
              {info}
            </div>
          )}
          {error && (
            <div className="message-bubble" data-tone="error">
              {error}
            </div>
          )}
        </div>
      )}

      {jobId && (
        <div className="glass-surface-soft space-y-3 rounded-2xl border border-white/40 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-[0.28em]">Job</span>
            <span className="rounded-full border border-white/50 bg-white/70 px-3 py-1 font-mono text-[11px] text-slate-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200">
              {jobId}
            </span>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              State:
            </span>{" "}
            {job?.status ?? "queued"}
            {typeof job?.progress === "number" ? ` — ${Math.round(job.progress)}%` : ""}
          </div>

          {job?.status?.toLowerCase() === "done" && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => jobId && downloadJobArtifact(jobId)}
                className="btn-base btn-primary"
                data-voice-hint="Your artifact is ready. Click to download the generated output."
              >
                Download artifact
              </button>
              {builderFromSlug && (
                <a
                  href={builderFromSlug}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-base btn-ghost"
                >
                  Open in Builder ↗
                </a>
              )}
            </div>
          )}

          {job?.status?.toLowerCase() === "error" && (
            <div className="message-bubble" data-tone="error">
              Build failed.{job?.message ? ` Details: ${String(job.message)}` : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
