"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { LOCALE_NAMES } from "@/lib/locale";

// ─── Types ──────────────────────────────────

interface Job {
  id: string;
  locale: string;
  localeName: string;
  status: "pending" | "running" | "completed" | "failed";
  totalItems: number;
  completedItems: number;
  failedItems: number;
  skippedItems: number;
  currentItem: string;
  log: string[];
  startedAt: string;
  completedAt?: string;
}

interface LangStatus {
  pages: { total: number; translated: number; pending: number; pendingList: any[]; completedList: any[] };
  products: { total: number; translated: number; pending: number; pendingList: any[]; completedList: any[] };
  posts: { total: number; translated: number; pending: number; pendingList: any[]; completedList: any[] };
  categories: { total: number; translated: number; pending: number; pendingList: any[]; completedList: any[] };
}

// ─── Helpers ────────────────────────────────

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString();
  } catch { return ""; }
}

function elapsedMs(startIso: string): number {
  return Date.now() - new Date(startIso).getTime();
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function estimatedRemaining(job: Job): string {
  if (job.completedItems <= 0 || job.status !== "running") return "—";
  const elapsed = elapsedMs(job.startedAt);
  const perItem = elapsed / job.completedItems;
  const remaining = perItem * (job.totalItems - job.completedItems);
  if (remaining < 1000) return "< 1s";
  return formatDuration(Math.round(remaining));
}

// ─── Component ──────────────────────────────

export default function TranslationSettings() {
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  // API provider info (read-only, from API settings page)
  const [apiProvider, setApiProvider] = useState<{ name: string; key: string; icon: string; hasKey: boolean } | null>(null);

  // Status data (pending/completed counts)
  const [status, setStatus] = useState<Record<string, LangStatus> | null>(null);
  const [activeLang, setActiveLang] = useState("");

  // Content type filters
  const [translateTypes, setTranslateTypes] = useState({
    pages: true,
    categories: true,
    products: true,
    posts: true,
  });

  // Active job
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [historyJobs, setHistoryJobs] = useState<Job[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentJob?.log]);

  // Force refresh counter (for manual refresh)
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Load settings + status
  const loadData = useCallback(async (isRefresh?: boolean) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [settingsRes, statusRes, jobsRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/translate/status"),
        fetch("/api/translate/jobs"),
      ]);
      const settingsData = await settingsRes.json();
      const statusData = await statusRes.json();
      const jobsData = await jobsRes.json();

      // Read API provider from API settings (shared)
      const defaultKey = settingsData.default_api_provider || "deepseek";
      let providerName = "DeepSeek";
      let providerIcon = "🔮";
      let hasKey = false;
      if (settingsData.api_providers) {
        try {
          const providers = JSON.parse(settingsData.api_providers);
          const p = providers[defaultKey];
          if (p) {
            providerName = defaultKey.charAt(0).toUpperCase() + defaultKey.slice(1);
            if (defaultKey === "anthropic") providerName = "Anthropic";
            if (defaultKey === "deepseek") { providerName = "DeepSeek"; providerIcon = "🔮"; }
            if (defaultKey === "openai") { providerName = "OpenAI"; providerIcon = "🤖"; }
            if (defaultKey === "gemini") { providerName = "Gemini"; providerIcon = "🌍"; }
            if (defaultKey === "azure") { providerName = "Azure OpenAI"; providerIcon = "☁️"; }
            if (defaultKey === "anthropic") { providerName = "Claude"; providerIcon = "🟣"; }
            hasKey = !!(p.enabled && p.apiKey);
          }
        } catch {}
      }
      // Fallback to old settings
      if (!hasKey && settingsData.translation_api_key) hasKey = true;
      setApiProvider({ name: providerName, key: defaultKey, icon: providerIcon, hasKey });

      if (statusData?.languages) {
        setStatus(statusData.languages);
        const codes = Object.keys(statusData.languages);
        // Always select first language when refreshing
        if (codes.length > 0) {
          setActiveLang(prev => codes.includes(prev) ? prev : codes[0]);
        }
      }

      const allJobs: Job[] = jobsData.jobs || [];
      setActiveJobs(allJobs.filter(j => j.status === "running" || j.status === "pending"));
      setHistoryJobs(allJobs.filter(j => j.status === "completed" || j.status === "failed").slice(0, 20));
    } catch {}
    setLoading(false);
    if (isRefresh) setTimeout(() => setRefreshing(false), 500);
  }, []);

  useEffect(() => { loadData(true); }, [refreshKey]);

  // Poll active job
  useEffect(() => {
    if (!currentJob || currentJob.status === "completed" || currentJob.status === "failed") {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/translate/jobs/${currentJob.id}`);
        const data = await res.json();
        if (data.job) {
          setCurrentJob(data.job);
          if (data.job.status === "completed" || data.job.status === "failed") {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            // Reload
            loadData();
          }
        }
      } catch {}
    }, 1000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [currentJob?.id, currentJob?.status]);

  async function startTranslation(locale: string) {
    try {
      const res = await fetch("/api/translate/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, types: translateTypes }),
      });
      const data = await res.json();
      if (data.jobId) {
        // Fetch the job
        const jobRes = await fetch(`/api/translate/jobs/${data.jobId}`);
        const jobData = await jobRes.json();
        if (jobData.job) setCurrentJob(jobData.job);
      }
    } catch (err: any) {
      alert("Failed to start translation: " + err.message);
    }
  }

  function viewJob(job: Job) {
    setCurrentJob(job);
  }

  function closeJobView() {
    setCurrentJob(null);
    loadData();
  }

  // Computed
  const langCodes = status ? Object.keys(status) : [];

  function langTotal(lang: LangStatus | undefined): { pending: number; total: number } {
    if (!lang) return { pending: 0, total: 0 };
    const p = (lang.pages?.pending || 0) + (lang.products?.pending || 0) + (lang.posts?.pending || 0) + (lang.categories?.pending || 0);
    const t = (lang.pages?.total || 0) + (lang.products?.total || 0) + (lang.posts?.total || 0) + (lang.categories?.total || 0);
    return { pending: p, total: t };
  }

  // Filtered pending count based on checkbox selection
  const filteredPendingCount = (() => {
    const s = status?.[activeLang];
    if (!s) return 0;
    let count = 0;
    if (translateTypes.pages) count += s.pages?.pending || 0;
    if (translateTypes.categories) count += s.categories?.pending || 0;
    if (translateTypes.products) count += s.products?.pending || 0;
    if (translateTypes.posts) count += s.posts?.pending || 0;
    return count;
  })();

  const activeJobProgress = currentJob && (currentJob.status === "running" || currentJob.status === "pending");
  const progressPct = currentJob && currentJob.totalItems > 0
    ? Math.round((currentJob.completedItems / currentJob.totalItems) * 100) : 0;

  if (loading) return <p style={{ color: "#6b7280" }}>Loading...</p>;

  return (
    <div>
      {/* ══════════════════════════════════════
         API Status Banner (read from shared API settings)
         ══════════════════════════════════════ */}
      <div style={{
        background: apiProvider?.hasKey ? "#f0fdf4" : "#fffbeb",
        borderRadius: 8, padding: "16px 20px", marginBottom: 20,
        border: apiProvider?.hasKey ? "1px solid #bbf7d0" : "1px solid #fde68a",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span style={{ fontSize: 24 }}>{apiProvider?.hasKey ? "✅" : "⚠️"}</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: apiProvider?.hasKey ? "#16a34a" : "#92400e", margin: "0 0 4px" }}>
            {apiProvider?.hasKey
              ? `Translation API configured: ${apiProvider.icon} ${apiProvider.name}`
              : "Translation API not configured"}
          </p>
          <p style={{ fontSize: 13, color: apiProvider?.hasKey ? "#166534" : "#92400e", margin: 0 }}>
            {apiProvider?.hasKey
              ? `Using default provider. API keys are managed in `
              : `Configure your API key in `}
            <a href="/admin/settings/api" style={{ color: "#2563eb", textDecoration: "underline" }}>Settings → API</a>
            {apiProvider?.hasKey ? "." : " before running translations."}
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════
         Active / Current Job Console
         ══════════════════════════════════════ */}
      {activeJobProgress && currentJob && (
        <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#22c55e", animation: "pulse 1.5s infinite" }} />
                Translating to {currentJob.localeName}
              </h3>
            </div>
            <button onClick={closeJobView}
              style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af", padding: "4px 8px" }}>
              ✕
            </button>
          </div>

          {/* Progress Summary */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
            {/* Progress Bar */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
                <span>{progressPct}% complete</span>
                <span>{currentJob.completedItems} / {currentJob.totalItems} items</span>
              </div>
              <div style={{ background: "#e5e7eb", borderRadius: 10, height: 10, overflow: "hidden" }}>
                <div style={{
                  width: `${progressPct}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #3b82f6, #2563eb)",
                  borderRadius: 10,
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 24, fontSize: 12, color: "#6b7280" }}>
              <div>⏱ Elapsed: <strong>{formatDuration(elapsedMs(currentJob.startedAt))}</strong></div>
              <div>⏳ ETA: <strong>{estimatedRemaining(currentJob)}</strong></div>
              <div>✅ <span style={{ color: "#22c55e" }}>{currentJob.completedItems}</span></div>
              <div>⏭️ <span style={{ color: "#f59e0b" }}>{currentJob.skippedItems}</span></div>
              <div>❌ <span style={{ color: "#ef4444" }}>{currentJob.failedItems}</span></div>
            </div>

            {/* Current Item */}
            {currentJob.currentItem && (
              <div style={{ marginTop: 8, padding: "8px 12px", background: "#eff6ff", borderRadius: 6, fontSize: 13, color: "#2563eb", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", animation: "pulse 1.5s infinite" }} />
                {currentJob.currentItem}
              </div>
            )}
          </div>

          {/* Log */}
          <div style={{ maxHeight: 300, overflow: "auto", padding: "8px 0", background: "#1e293b", fontFamily: "monospace", fontSize: 12 }}>
            {(currentJob.log || []).map((msg, i) => (
              <div key={i} style={{
                padding: "2px 16px",
                color: msg.includes("❌") ? "#f87171"
                     : msg.includes("✅") ? "#4ade80"
                     : msg.includes("⏭️") ? "#fbbf24"
                     : msg.includes("🔄") ? "#60a5fa"
                     : msg.includes("🎉") ? "#34d399"
                     : "#94a3b8",
                whiteSpace: "pre-wrap",
              }}>
                {msg}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>

          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.4; }
            }
          `}</style>
        </div>
      )}

      {/* ══════════════════════════════════════
         Translation Panel (Language Tabs + Pending/Completed)
         ══════════════════════════════════════ */}
      {!activeJobProgress && (
        <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          {/* ── Language Tabs ── */}
          <div style={{ borderBottom: "1px solid #e5e7eb", padding: "0 16px", display: "flex", gap: 4, overflow: "auto" }}>
            {/* Refresh button */}
            <button onClick={() => setRefreshKey(k => k + 1)}
              disabled={refreshing}
              title="Reload language list from Settings"
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "8px 12px", fontSize: 13, fontWeight: 500,
                border: "none", borderBottom: "2px solid transparent",
                background: "transparent",
                color: refreshing ? "#93c5fd" : "#94a3b8",
                cursor: refreshing ? "wait" : "pointer",
                whiteSpace: "nowrap", flexShrink: 0, marginRight: 8,
                transition: "color 0.2s",
              }}>
              <span style={{
                display: "inline-block",
                animation: refreshing ? "spin 0.8s linear infinite" : "none",
              }}>
                {refreshing ? "⏳" : "🔄"}
              </span>
              {refreshing ? "Loading..." : "Refresh"}
            </button>
            {langCodes.map(code => {
              const info = LOCALE_NAMES[code];
              const t = langTotal(status![code]);
              const isActive = code === activeLang;
              return (
                <button key={code} onClick={() => setActiveLang(code)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "12px 16px", fontSize: 13, fontWeight: 500,
                    border: "none", borderBottom: isActive ? "2px solid #2563eb" : "2px solid transparent",
                    background: isActive ? "#eff6ff" : "transparent",
                    color: isActive ? "#2563eb" : "#64748b",
                    cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                  }}>
                  <span>{info?.flag || "🌐"}</span>
                  <span>{info?.name || code}</span>
                  {t.pending > 0 && (
                    <span style={{
                      background: "#dc2626", color: "#fff", borderRadius: 10,
                      padding: "1px 7px", fontSize: 11, fontWeight: 600,
                    }}>
                      {t.pending}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Content ── */}
          {activeLang && status?.[activeLang] && (
            <div style={{ display: "flex", minHeight: 450 }}>
              {/* ═══ Left: Pending ═══ */}
              <div style={{ flex: 1, padding: 20, borderRight: "1px solid #e5e7eb" }}>
                {/* ── Content type checkboxes ── */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 8 }}>Content to translate:</p>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {[
                      { key: "pages" as const, icon: "📄", label: "Pages", count: status?.[activeLang]?.pages?.pending || 0 },
                      { key: "categories" as const, icon: "🏷️", label: "Categories", count: status?.[activeLang]?.categories?.pending || 0 },
                      { key: "products" as const, icon: "📦", label: "Products", count: status?.[activeLang]?.products?.pending || 0 },
                      { key: "posts" as const, icon: "✏️", label: "Posts", count: status?.[activeLang]?.posts?.pending || 0 },
                    ].map(t => (
                      <label key={t.key} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "6px 12px", borderRadius: 6, cursor: "pointer",
                        fontSize: 13, fontWeight: 500,
                        background: translateTypes[t.key] ? "#eff6ff" : "#f9fafb",
                        border: translateTypes[t.key] ? "1px solid #93c5fd" : "1px solid #e5e7eb",
                        color: translateTypes[t.key] ? "#2563eb" : "#6b7280",
                        transition: "all 0.15s",
                      }}>
                        <input
                          type="checkbox"
                          checked={translateTypes[t.key]}
                          onChange={() => setTranslateTypes(prev => ({ ...prev, [t.key]: !prev[t.key] }))}
                          style={{ margin: 0, accentColor: "#2563eb" }}
                        />
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                        <span style={{ fontSize: 11, opacity: 0.6 }}>({t.count})</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* ── Filtered pending items list ── */}
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "#374151", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#dc2626" }}>⏳</span> Pending Translation
                  <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>
                    ({filteredPendingCount} items selected)
                  </span>
                </h3>

                {filteredPendingCount === 0 ? (
                  <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>{langTotal(status?.[activeLang]).pending === 0 ? "✅" : "📭"}</div>
                    <p style={{ fontSize: 14 }}>
                      {langTotal(status?.[activeLang]).pending === 0
                        ? `All items translated for ${LOCALE_NAMES[activeLang]?.name}!`
                        : "No types selected. Check the boxes above to see pending items."}
                    </p>
                  </div>
                ) : (
                  <>
                    {translateTypes.pages && status?.[activeLang]?.pages?.pending > 0 && (
                      <ItemGroup type="page" items={status?.[activeLang]?.pages?.pendingList || []} />
                    )}
                    {translateTypes.categories && status?.[activeLang]?.categories?.pending > 0 && (
                      <ItemGroup type="category" items={status?.[activeLang]?.categories?.pendingList || []} />
                    )}
                    {translateTypes.products && status?.[activeLang]?.products?.pending > 0 && (
                      <ItemGroup type="product" items={status?.[activeLang]?.products?.pendingList || []} />
                    )}
                    {translateTypes.posts && status?.[activeLang]?.posts?.pending > 0 && (
                      <ItemGroup type="post" items={status?.[activeLang]?.posts?.pendingList || []} />
                    )}
                  </>
                )}

                {(() => {
                  const allDone = filteredPendingCount === 0;
                  return (
                    <button
                      onClick={() => {
                        if (allDone && !confirm(`Re-run translation for ${LOCALE_NAMES[activeLang]?.name || activeLang}? This will supplement any missing categories.`)) return;
                        startTranslation(activeLang);
                      }}
                      disabled={!apiProvider?.hasKey}
                      style={{
                        marginTop: 20, padding: "12px 28px", width: "100%",
                        background: !apiProvider?.hasKey ? "#93c5fd" : allDone ? "#059669" : "#2563eb",
                        color: "#fff", border: "none", borderRadius: 8, fontSize: 14,
                        fontWeight: 600, cursor: apiProvider?.hasKey ? "pointer" : "not-allowed",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      }}>
                      {allDone ? `🔄 Supplement ${LOCALE_NAMES[activeLang]?.name || activeLang}` : `🚀 Translate to ${LOCALE_NAMES[activeLang]?.name || activeLang}`}
                      {allDone && <span style={{ fontSize: 11, opacity: 0.8 }}>(re-check)</span>}
                    </button>
                  );
                })()}
              </div>

              {/* ═══ Right: Completed ═══ */}
              <div style={{ flex: 1, padding: 20, background: "#fafafa" }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "#374151", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#22c55e" }}>✅</span> Translated
                  <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>
                    ({langTotal(status?.[activeLang]).total - langTotal(status?.[activeLang]).pending} items)
                  </span>
                </h3>

                {status?.[activeLang]?.pages?.completedList?.length > 0 && (
                  <ItemList type="page" items={status?.[activeLang]?.pages?.completedList || []} />
                )}
                {status?.[activeLang]?.products?.completedList?.length > 0 && (
                  <ItemList type="product" items={status?.[activeLang]?.products?.completedList || []} />
                )}
                {status?.[activeLang]?.posts?.completedList?.length > 0 && (
                  <ItemList type="post" items={status?.[activeLang]?.posts?.completedList || []} />
                )}
                {status?.[activeLang]?.categories?.completedList?.length > 0 && (
                  <ItemList type="category" items={status?.[activeLang]?.categories?.completedList || []} />
                )}

                {langTotal(status?.[activeLang]).total - langTotal(status?.[activeLang]).pending === 0 && (
                  <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                    <p style={{ fontSize: 14 }}>No translated items yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!activeLang && (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
              <p>No languages configured. Go to Settings → Languages to enable languages.</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
         Translation History
         ══════════════════════════════════════ */}
      {activeJobs.length > 0 && currentJob === null && (
        <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginTop: 20 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>⏳ Active Jobs</h3>
          </div>
          {activeJobs.map(job => (
            <div key={job.id} onClick={() => viewJob(job)} style={{
              padding: "12px 20px", borderBottom: "1px solid #f3f4f6", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 12,
              transition: "background 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={e => (e.currentTarget.style.background = "")}
            >
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontWeight: 500, fontSize: 14 }}>{job.localeName}</span>
              <span style={{ fontSize: 12, color: "#6b7280" }}>
                {job.completedItems}/{job.totalItems} • {formatDuration(elapsedMs(job.startedAt))}
              </span>
              <span style={{ marginLeft: "auto", color: "#3b82f6", fontSize: 12 }}>View →</span>
            </div>
          ))}
        </div>
      )}

      {historyJobs.length > 0 && currentJob === null && (
        <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginTop: 20 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>📋 History</h3>
          </div>
          {historyJobs.map(job => (
            <div key={job.id} onClick={() => viewJob(job)} style={{
              padding: "12px 20px", borderBottom: "1px solid #f3f4f6", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 12,
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={e => (e.currentTarget.style.background = "")}
            >
              <span>{job.status === "completed" ? "✅" : "❌"}</span>
              <span style={{ fontWeight: 500, fontSize: 14 }}>{job.localeName}</span>
              <span style={{ fontSize: 12, color: "#6b7280" }}>
                {job.completedItems}/{job.totalItems} • {formatDuration(elapsedMs(job.startedAt))}
              </span>
              <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: "auto" }}>
                {formatTime(job.startedAt)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════
         Danger Zone: Clear All Translations
         ══════════════════════════════════════ */}
      {currentJob === null && (
        <div style={{
          marginTop: 32, padding: "20px 24px",
          background: "#fff", borderRadius: 8,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          border: "1px solid #fecaca",
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: "#dc2626" }}>⚠️ Danger Zone</h3>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
            Clear all translated content. English content will NOT be affected.
            After clearing, re-run translation to regenerate with correct categories and slugs.
          </p>
          <button
            onClick={async () => {
              if (!confirm("⚠️ This will DELETE all non-English translations!\n\nAre you sure?")) return;
              if (!confirm("Final confirmation: Delete ALL translated content? This cannot be undone.")) return;
              setClearing(true);
              try {
                const res = await fetch("/api/translate/clear", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale: "all" }) });
                const data = await res.json();
                if (data.success) {
                  alert(`✅ Cleared: ${data.summary.pages} pages, ${data.summary.products} products, ${data.summary.posts} posts, ${data.summary.categories} categories`);
                  setRefreshKey(k => k + 1);
                }
              } catch (e: any) {
                alert("❌ Failed: " + e.message);
              }
              setClearing(false);
            }}
            disabled={clearing}
            style={{
              padding: "10px 24px",
              background: clearing ? "#fca5a5" : "#dc2626",
              color: "#fff", border: "none", borderRadius: 6,
              fontSize: 14, fontWeight: 600,
              cursor: clearing ? "not-allowed" : "pointer",
            }}
          >
            {clearing ? "Clearing..." : "🗑️ Clear All Translations"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────

const TYPE_ICONS: Record<string, string> = { page: "📄", product: "📦", post: "✏️", category: "🏷️" };
const TYPE_LABELS: Record<string, string> = { page: "Pages", product: "Products", post: "Posts", category: "Categories" };

function ItemGroup({ type, items }: { type: string; items: any[] }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h4 style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
        <span>{TYPE_ICONS[type]}</span>
        <span>{TYPE_LABELS[type]}</span>
        <span style={{ fontWeight: 400, color: "#94a3b8" }}>({items.length})</span>
      </h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map((item: any) => (
          <div key={item.id} style={{
            padding: "6px 10px", fontSize: 13, color: "#374151",
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 4,
          }}>
            {item.title || item.name}
          </div>
        ))}
      </div>
    </div>
  );
}

function ItemList({ type, items }: { type: string; items: any[] }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h4 style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
        <span>{TYPE_ICONS[type]}</span>
        <span>{TYPE_LABELS[type]}</span>
        <span style={{ fontWeight: 400, color: "#94a3b8" }}>({items.length})</span>
      </h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map((item: any) => (
          <div key={item.id} style={{
            padding: "5px 10px", fontSize: 12, color: "#6b7280",
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 4,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ color: "#22c55e", fontSize: 14 }}>✓</span>
            <span>{item.title || item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
