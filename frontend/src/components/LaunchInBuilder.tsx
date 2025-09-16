// frontend/src/components/LaunchInBuilder.tsx
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

type Props = {
  defaultName?: string;
  defaultPages?: string;
  defaultDesc?: string;
  /** allow overriding (falls back to builder.cognomega.com) */
  baseUrl?: string;
};

const fieldCls =
  "w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;
const PREFS_KEY = "launch_in_builder_pref";

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

  const onChange = useCallback((v: string) => {
    setDirty(true);
    setVal(v);
  }, []);

  return [val, onChange] as const;
}

type StoredPrefs = {
  name?: string;
  pages?: string;
  tier?: IntelligenceTier;
  modelHint?: string | null;
  skills?: Partial<typeof DEFAULT_SKILLS>;
};

function loadPrefs(): StoredPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return {};
    const j = JSON.parse(raw);
    if (!j || typeof j !== "object") return {};
    return {
      name: typeof j.name === "string" ? j.name : undefined,
      pages: typeof j.pages === "string" ? j.pages : undefined,
      tier:
        j.tier === "human" || j.tier === "advanced" || j.tier === "super"
          ? (j.tier as IntelligenceTier)
          : undefined,
      modelHint: typeof j.modelHint === "string" ? j.modelHint : undefined,
      skills: typeof j.skills === "object" ? j.skills : undefined,
    };
  } catch {
    return {};
  }
}

function savePrefs(p: StoredPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

const DEFAULT_SKILLS = {
  codegen_plus: true,
  generate_unit_tests: true,
  generate_e2e_tests: true,
  security_scan: true,
  refactor_suggestions: true,
  typed_api_clients: true,
  i18n_scaffold: false,
  analytics_wiring: false,
  performance_budget: true,
  docs_and_comments: true,
  error_boundaries: true,
  playwright_specs: true,
  rag_scaffold: false,
};

export default function LaunchInBuilder({
  defaultName = "",
  defaultPages = "Home,Dashboard,Chat",
  defaultDesc = "",
  baseUrl,
}: Props) {
  // restore saved prefs (if any)
  const restored = useMemo(() => loadPrefs(), []);
  const [name, setName] = useState(restored.name ?? defaultName);
  const [pages, setPages] = useState(restored.pages ?? defaultPages);
  const [desc, setDesc] = useSyncedDefaultDesc(defaultDesc);
  const [tier, setTier] = useState<IntelligenceTier>(restored.tier ?? "advanced");
  const [modelHint, setModelHint] = useState<string>(restored.modelHint ?? "");

  // Advanced Coding AI skills (UI toggles; merged into /api/si/ask)
  const [skills, setSkills] = useState({
    ...DEFAULT_SKILLS,
    ...(restored.skills ?? {}),
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobInfo | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [contentUrl, setContentUrl] = useState<string | null>(null);

  const pollTimer = useRef<number | null>(null);
  const pollStart = useRef<number>(0);

  useEffect(() => {
    savePrefs({ name, pages, tier, modelHint, skills });
  }, [name, pages, tier, modelHint, skills]);

  const builderBase = useMemo(() => {
    if (baseUrl) return baseUrl;
    try {
      const { hostname, origin } = window.location;
      // If already on builder.* use same origin
      if (hostname.startsWith("builder.") && hostname.includes("cognomega.com")) {
        return origin;
      }
      // Pages preview mapping: app-*.pages.dev -> builder-*.pages.dev
      const pages = hostname.match(/^app-(.+)\.pages\.dev$/i);
      if (pages) return `${window.location.protocol}//builder-${pages[1]}.pages.dev`;
    } catch {}
    return "https://builder.cognomega.com";
  }, [baseUrl]);

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
        if (Date.now() - pollStart.current > POLL_TIMEOUT_MS) {
          setInfo(null);
          setError("Timed out waiting for build to finish.");
          clearPoll();
          return;
        }
        const j = await getJobStatus(id);
        setJob(j);

        const s = (j.status || "").toLowerCase();
        if (s === "done" || s === "error" || s === "failed") {
          clearPoll();
          setInfo(s === "done" ? "Build finished." : "Build failed.");
          return;
        }
        pollTimer.current = window.setTimeout(() => pollOnce(id), POLL_INTERVAL_MS);
      } catch {
        // Keep polling on transient errors with backoff
        pollTimer.current = window.setTimeout(() => pollOnce(id), POLL_INTERVAL_MS * 2);
      }
    },
    [clearPoll]
  );

  const startPolling = useCallback(
    (id: string) => {
      clearPoll();
      pollStart.current = Date.now();
      pollTimer.current = window.setTimeout(() => pollOnce(id), 500);
    },
    [clearPoll, pollOnce]
  );

  useEffect(() => {
    return () => clearPoll();
  }, [clearPoll]);

  const onGenerate = async () => {
    setBusy(true);
    setError(null);
    setInfo("Starting plan in App Maker…");
    setJobId(null);
    setJob(null);
    setSlug(null);
    setContentUrl(null);

    try {
      const resp: SketchToAppResponse = await startSketchToApp({
        name: name.trim() || "MyApp",
        pages: (pages || "").trim(),
        description: (desc || "").trim(),
        modelHint: modelHint.trim() || undefined,
        intelligenceTier: tier,
        settings: {
          source: "app_maker",
          builder_base: builderBase,
          user_email: readUserEmail() || undefined,
          skills_overrides: skills, // pass UI toggles to backend
        },
      });

      if (isErr(resp)) throw new Error(resp.error || "Failed to start plan");

      const id = resp.jobId || null;
      if (id) {
        setJobId(id);
        setInfo("Build started…");
        startPolling(id);
      } else {
        setInfo(resp.content ? "Plan created." : "Request accepted.");
      }

      const s = (resp as any)?.slug as string | undefined;
      if (s && typeof s === "string" && s.trim()) setSlug(s.trim());

      const contentStr =
        typeof (resp as any)?.content === "string" ? ((resp as any).content as string) : null;
      if (contentStr && /^https?:\/\//i.test(contentStr)) setContentUrl(contentStr);
    } catch (e: any) {
      setError(e?.message || "Failed to start plan");
    } finally {
      setBusy(false);
    }
  };

  const canLaunch = true;
  const canGenerate = name.trim().length > 0 && desc.trim().length > 0 && !busy;

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
      className="space-y-4"
      data-role="builder"
      data-voice-hint="Open the real-time App Builder. It generates apps from your description and pages."
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Realtime Builder</h2>
        <span className="text-xs text-slate-500">Opens in a new tab</span>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
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
        <div className="flex gap-2">
          <button
            onClick={launch}
            disabled={!canLaunch}
            className="flex-1 rounded-xl bg-black px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-60"
            data-role="launch-builder"
            data-voice-hint="Open the Real-time App Builder in a new tab. Your name, pages, and description are passed through."
          >
            Launch in Builder
          </button>
          <button
            onClick={onGenerate}
            disabled={!canGenerate}
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
            title="Start App Maker plan and monitor build"
            data-role="generate-plan"
            data-voice-hint="Generate a plan in App Maker and monitor build progress here."
          >
            {busy ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>

      <textarea
        className={fieldCls}
        placeholder="Description (optional)"
        aria-label="Description"
        rows={2}
        data-voice-hint="Describe your app or requirements. The Builder uses this to generate a better starting point."
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        onKeyDown={onKeySubmit}
      />

      {/* Advanced (model hint) */}
      <div className="grid md:grid-cols-[1fr_280px] gap-3">
        <div
          className="rounded-xl border border-slate-200 p-3"
          data-voice-hint="Toggle advanced coding AI capabilities such as tests, security scans, and performance budgets."
        >
          <div className="text-sm font-medium mb-2">Advanced Coding AI</div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
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
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(skills as any)[key]}
                  onChange={() => toggle(key as keyof typeof DEFAULT_SKILLS)}
                  aria-label={label}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <div className="text-sm font-medium mb-2">Advanced options</div>
          <label className="text-xs text-slate-600 mb-1 block">Model hint (optional)</label>
          <input
            className={fieldCls}
            placeholder="e.g., prefer gpt-4o-mini or llama-3.1"
            value={modelHint}
            onChange={(e) => setModelHint(e.target.value)}
            onKeyDown={onKeySubmit}
          />
          {slug && (
            <a
              href={builderFromSlug || "#"}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-indigo-600 hover:underline text-sm"
              title="Open Builder with your generated plan"
            >
              Open Builder with plan ↗
            </a>
          )}
        </div>
      </div>

      {(info || error) && (
        <div className="text-sm">
          {info && <div className="text-green-700">{info}</div>}
          {error && <div className="text-red-600">{error}</div>}
        </div>
      )}

      {jobId && (
        <div className="text-sm space-y-2">
          <div className="text-slate-700">
            Job:&nbsp;
            <code className="px-1 py-0.5 bg-gray-100 rounded">{jobId}</code>
          </div>
          <div>
            <span className="font-medium">State:</span>{" "}
            <span>{job?.status ?? "queued"}</span>
            {typeof job?.progress === "number" && (
              <span> — {Math.round(job.progress)}%</span>
            )}
          </div>

          {job?.status?.toLowerCase() === "done" && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => jobId && downloadJobArtifact(jobId)}
                className="px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white"
                data-voice-hint="Your artifact is ready. Click to download the generated output."
              >
                Download
              </button>
              {builderFromSlug && (
                <a
                  href={builderFromSlug}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  Open in Builder ↗
                </a>
              )}
            </div>
          )}

          {job?.status?.toLowerCase() === "error" && (
            <div className="text-red-600">
              Build failed.
              {job?.message ? <span> Details: {String(job.message)}</span> : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
