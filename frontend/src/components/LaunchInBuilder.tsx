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

// Type guard to avoid TS union narrowing issues
function isErr(resp: SketchToAppResponse): resp is Extract<SketchToAppResponse, { ok: false }> {
  return (resp as any)?.ok === false;
}

export default function LaunchInBuilder({
  defaultName = "",
  defaultPages = "Home,Dashboard,Chat",
  defaultDesc = "",
  baseUrl,
}: Props) {
  const [name, setName] = useState(defaultName);
  const [pages, setPages] = useState(defaultPages);
  const [desc, setDesc] = useState(defaultDesc);
  const [tier, setTier] = useState<IntelligenceTier>("advanced");

  // Advanced Coding AI skills (UI toggles; merged into /api/si/ask)
  const [skills, setSkills] = useState({
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
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobInfo | null>(null);

  const pollTimer = useRef<number | null>(null);
  const pollStart = useRef<number>(0);

  const builderBase = useMemo(() => {
    if (baseUrl) return baseUrl;
    try {
      const h = window.location.hostname;
      if (h.includes("cognomega.com") && h.startsWith("builder.")) {
        return `${window.location.origin}`;
      }
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
        pollTimer.current = window.setTimeout(
          () => pollOnce(id),
          POLL_INTERVAL_MS
        );
      } catch {
        // Keep polling on transient errors with backoff
        pollTimer.current = window.setTimeout(
          () => pollOnce(id),
          POLL_INTERVAL_MS * 2
        );
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

    try {
      const resp: SketchToAppResponse = await startSketchToApp({
        name: name.trim() || "MyApp",
        pages: (pages || "").trim(),
        description: (desc || "").trim(),
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
    } catch (e: any) {
      setError(e?.message || "Failed to start plan");
    } finally {
      setBusy(false);
    }
  };

  const canLaunch = true;
  const canGenerate = name.trim().length > 0 && desc.trim().length > 0 && !busy;

  const toggle = (k: keyof typeof skills) =>
    setSkills((s) => ({ ...s, [k]: !s[k] }));

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
        />
        <input
          className={fieldCls}
          placeholder="Pages (comma-separated)"
          aria-label="Pages"
          data-voice-hint="Enter comma-separated pages. We’ll pre-seed the Builder with these screens."
          value={pages}
          onChange={(e) => setPages(e.target.value)}
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
      />

      {/* Advanced Coding AI (collapsible-style simple grid) */}
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
                checked={skills[key]}
                onChange={() => toggle(key)}
                aria-label={label}
              />
              <span>{label}</span>
            </label>
          ))}
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
            </div>
          )}

          {job?.status?.toLowerCase() === "error" && (
            <div className="text-red-600">
              Build failed.
              {job?.message ? (
                <span> Details: {String(job.message)}</span>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
