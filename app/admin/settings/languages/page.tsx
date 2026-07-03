"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { InputField, SaveButton } from "@/components/admin/SettingsShared";
import { LOCALE_NAMES } from "@/lib/locale";

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

const ALL_LANGUAGES = [
  { code: "en", name: "English", native: "English", flag: "🇬🇧", default: true },
  { code: "zh", name: "Chinese", native: "中文", flag: "🇨🇳" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦" },
  { code: "ja", name: "Japanese", native: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", native: "한국어", flag: "🇰🇷" },
  { code: "ru", name: "Russian", native: "Русский", flag: "🇷🇺" },
  { code: "it", name: "Italian", native: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇧🇷" },
  { code: "th", name: "Thai", native: "ไทย", flag: "🇹🇭" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", flag: "🇻🇳" },
  { code: "nl", name: "Dutch", native: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polish", native: "Polski", flag: "🇵🇱" },
  { code: "tr", name: "Turkish", native: "Türkçe", flag: "🇹🇷" },
  { code: "sv", name: "Swedish", native: "Svenska", flag: "🇸🇪" },
  { code: "da", name: "Danish", native: "Dansk", flag: "🇩🇰" },
  { code: "fi", name: "Finnish", native: "Suomi", flag: "🇫🇮" },
  { code: "nb", name: "Norwegian", native: "Norsk", flag: "🇳🇴" },
  { code: "cs", name: "Czech", native: "Čeština", flag: "🇨🇿" },
  { code: "hu", name: "Hungarian", native: "Magyar", flag: "🇭🇺" },
  { code: "ro", name: "Romanian", native: "Română", flag: "🇷🇴" },
  { code: "el", name: "Greek", native: "Ελληνικά", flag: "🇬🇷" },
  { code: "he", name: "Hebrew", native: "עברית", flag: "🇮🇱" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇧🇩" },
  { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "Telugu", native: "తెలుగు", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", native: "मराठी", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "ur", name: "Urdu", native: "اردو", flag: "🇵🇰" },
  { code: "my", name: "Burmese", native: "မြန်မာဘာသာ", flag: "🇲🇲" },
  { code: "km", name: "Khmer", native: "ភាសាខ្មែរ", flag: "🇰🇭" },
  { code: "lo", name: "Lao", native: "ລາວ", flag: "🇱🇦" },
  { code: "mn", name: "Mongolian", native: "Монгол", flag: "🇲🇳" },
  { code: "ne", name: "Nepali", native: "नेपाली", flag: "🇳🇵" },
  { code: "si", name: "Sinhala", native: "සිංහල", flag: "🇱🇰" },
  { code: "am", name: "Amharic", native: "አማርኛ", flag: "🇪🇹" },
  { code: "sw", name: "Swahili", native: "Kiswahili", flag: "🇹🇿" },
  { code: "ha", name: "Hausa", native: "Hausa", flag: "🇳🇬" },
  { code: "yo", name: "Yoruba", native: "Yorùbá", flag: "🇳🇬" },
  { code: "ig", name: "Igbo", native: "Igbo", flag: "🇳🇬" },
  { code: "zu", name: "Zulu", native: "isiZulu", flag: "🇿🇦" },
  { code: "xh", name: "Xhosa", native: "isiXhosa", flag: "🇿🇦" },
  { code: "af", name: "Afrikaans", native: "Afrikaans", flag: "🇿🇦" },
  { code: "cy", name: "Welsh", native: "Cymraeg", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  { code: "ga", name: "Irish", native: "Gaeilge", flag: "🇮🇪" },
  { code: "gd", name: "Scottish Gaelic", native: "Gàidhlig", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { code: "mt", name: "Maltese", native: "Malti", flag: "🇲🇹" },
  { code: "et", name: "Estonian", native: "Eesti", flag: "🇪🇪" },
  { code: "lv", name: "Latvian", native: "Latviešu", flag: "🇱🇻" },
  { code: "lt", name: "Lithuanian", native: "Lietuvių", flag: "🇱🇹" },
  { code: "sq", name: "Albanian", native: "Shqip", flag: "🇦🇱" },
  { code: "mk", name: "Macedonian", native: "Македонски", flag: "🇲🇰" },
  { code: "bs", name: "Bosnian", native: "Bosanski", flag: "🇧🇦" },
  { code: "hr", name: "Croatian", native: "Hrvatski", flag: "🇭🇷" },
  { code: "sr", name: "Serbian", native: "Српски", flag: "🇷🇸" },
  { code: "sl", name: "Slovenian", native: "Slovenščina", flag: "🇸🇮" },
  { code: "sk", name: "Slovak", native: "Slovenčina", flag: "🇸🇰" },
  { code: "bg", name: "Bulgarian", native: "Български", flag: "🇧🇬" },
  { code: "uk", name: "Ukrainian", native: "Українська", flag: "🇺🇦" },
  { code: "be", name: "Belarusian", native: "Беларуская", flag: "🇧🇾" },
  { code: "kk", name: "Kazakh", native: "Қазақ", flag: "🇰🇿" },
  { code: "uz", name: "Uzbek", native: "Oʻzbek", flag: "🇺🇿" },
  { code: "az", name: "Azerbaijani", native: "Azərbaycan", flag: "🇦🇿" },
  { code: "hy", name: "Armenian", native: "Հայերեն", flag: "🇦🇲" },
  { code: "ka", name: "Georgian", native: "ქართული", flag: "🇬🇪" },
  { code: "kmr", name: "Kurmanji", native: "Kurmancî", flag: "🏳️" },
  { code: "ps", name: "Pashto", native: "پښتو", flag: "🇦🇫" },
  { code: "fa", name: "Persian", native: "فارسی", flag: "🇮🇷" },
  { code: "ku", name: "Kurdish", native: "Kurdî", flag: "🏳️" },
  { code: "sd", name: "Sindhi", native: "سنڌي", flag: "🇵🇰" },
  { code: "tk", name: "Turkmen", native: "Türkmen", flag: "🇹🇲" },
  { code: "ky", name: "Kyrgyz", native: "Кыргызча", flag: "🇰🇬" },
  { code: "tg", name: "Tajik", native: "Тоҷикӣ", flag: "🇹🇯" },
  { code: "mn", name: "Mongolian", native: "Монгол", flag: "🇲🇳" },
  { code: "bo", name: "Tibetan", native: "བོད་སྐད", flag: "🏳️" },
  { code: "dz", name: "Dzongkha", native: "རྫོང་ཁ", flag: "🇧🇹" },
] as const;

export default function LanguageSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<string[]>(["en"]);
  const [enableLangSwitcher, setEnableLangSwitcher] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [translations, setTranslations] = useState<Record<string, { site_name: string; site_description: string }>>({});

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        if (data.enabled_languages) {
          try { setEnabled(JSON.parse(data.enabled_languages)); } catch {}
        }
        if (data.enable_lang_switcher === "true") setEnableLangSwitcher(true);
        if (data.translations) {
          try { setTranslations(JSON.parse(data.translations)); } catch {}
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function toggleLang(code: string) {
    setEnabled(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  }

  function updateTranslation(code: string, key: string, value: string) {
    setTranslations(prev => ({
      ...prev,
      [code]: { ...prev[code], [key]: value },
    }));
  }

  async function save() {
    setSaving(true);
    setSavedMsg(null);
    const enabledStr = JSON.stringify(enabled);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled_languages: enabledStr,
          target_languages: enabledStr,  // Keep in sync for translation APIs
          enable_lang_switcher: enableLangSwitcher ? "true" : "false",
          translations: JSON.stringify(translations),
        }),
      });
      if (res.ok) {
        setSavedMsg("✅ Settings saved successfully!");
        setTimeout(() => setSavedMsg(null), 3000);
      } else {
        setSavedMsg("❌ Save failed. Please try again.");
        setTimeout(() => setSavedMsg(null), 4000);
      }
    } catch {
      setSavedMsg("❌ Network error. Please try again.");
      setTimeout(() => setSavedMsg(null), 4000);
    }
    setSaving(false);
  }

  if (loading) return <p style={{ color: "#6b7280" }}>Loading...</p>;

  // Filtered languages based on search query
  const filteredLangs = searchQuery
    ? ALL_LANGUAGES.filter(l => {
        const q = searchQuery.toLowerCase().trim();
        return (
          l.code.toLowerCase().includes(q) ||
          l.name.toLowerCase().includes(q) ||
          l.native.toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <div>
      {/* ═══ Multi-language Toggle ═══ */}
      <div style={{
        background: "#fff", borderRadius: 8, padding: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "#374151" }}>🌐 Multi-Language Mode</h2>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
              When enabled, visitors can switch languages on the frontend.
              When disabled, only English is shown.
            </p>
          </div>
          <label style={{
            position: "relative", display: "inline-block", width: 52, height: 28, cursor: "pointer",
          }}>
            <input type="checkbox" checked={enableLangSwitcher}
              onChange={e => setEnableLangSwitcher(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{
              position: "absolute", inset: 0, borderRadius: 28,
              background: enableLangSwitcher ? "#2563eb" : "#d1d5db",
              transition: "0.3s",
            }}>
              <span style={{
                position: "absolute", top: 3, left: enableLangSwitcher ? 26 : 3,
                width: 22, height: 22, borderRadius: "50%", background: "#fff",
                transition: "0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </span>
          </label>
        </div>
      </div>

      {/* ═══ Enabled Languages ═══ */}
      <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#374151" }}>🌐 Enabled Languages</h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
          English is always enabled. Search and add languages below.
        </p>

        {/* ── Search Box ── */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <input
            type="text"
            placeholder="🔍 Search languages... (e.g. 中文, Deutsch, 阿拉伯语, Spanish...)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: "100%", padding: "10px 14px", fontSize: 14,
              border: "2px solid #e5e7eb", borderRadius: 8,
              outline: "none", boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
            onFocus={e => e.target.style.borderColor = "#3b82f6"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"}
          />
        </div>

        {/* ── Search Results ── */}
        {searchQuery && (
          <div style={{
            background: "#f9fafb", borderRadius: 8, padding: 12,
            marginBottom: 16, minHeight: 48,
          }}>
            {filteredLangs.length === 0 ? (
              <p style={{ fontSize: 13, color: "#ef4444", textAlign: "center", padding: 12 }}>
                ❌ No language found matching "{searchQuery}"
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {filteredLangs.map(lang => {
                  const isOn = enabled.includes(lang.code);
                  const isEnglish = lang.code === "en";
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => !isEnglish && toggleLang(lang.code)}
                      disabled={isEnglish}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "8px 14px", borderRadius: 8, cursor: isEnglish ? "default" : "pointer",
                        border: isOn ? "2px solid #3b82f6" : "2px solid #d1d5db",
                        background: isOn ? "#eff6ff" : "#fff",
                        color: isEnglish ? "#94a3b8" : (isOn ? "#2563eb" : "#374151"),
                        fontSize: 13, fontWeight: isOn ? 600 : 400,
                        opacity: isEnglish ? 0.5 : 1,
                        transition: "all 0.1s",
                      }}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>{lang.code}</span>
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>{lang.native}</span>
                      {isOn && <span style={{ fontSize: 12, color: "#22c55e" }}>✓</span>}
                      {!isOn && <span style={{ fontSize: 12, color: "#94a3b8" }}>+</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Currently Enabled (tags) ── */}
        {enabled.filter(c => c !== "en").length > 0 && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 8 }}>
              Currently enabled ({enabled.length - 1}):
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {enabled.filter(c => c !== "en").map(code => {
                const lang = ALL_LANGUAGES.find(l => l.code === code);
                if (!lang) return null;
                return (
                  <span key={code} style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "6px 10px", borderRadius: 6,
                    background: "#eff6ff", border: "1px solid #bfdbfe",
                    fontSize: 13, color: "#1e40af",
                  }}>
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                    <span style={{ fontSize: 10, color: "#60a5fa" }}>{code}</span>
                    <button
                      type="button"
                      onClick={() => toggleLang(code)}
                      style={{
                        background: "none", border: "none",
                        color: "#ef4444", cursor: "pointer",
                        fontSize: 14, padding: "0 2px",
                        lineHeight: 1,
                      }}
                      title={`Remove ${lang.name}`}
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {enabled.filter(c => c !== "en").length === 0 && (
          <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: 12 }}>
            No additional languages enabled. Use the search box above to add languages.
          </p>
        )}
      </div>

      {/* ═══ Site Name per Language ═══ */}
      <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#374151" }}>
          🏷️ Site Name & Description per Language
        </h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
          Customize site name and description for each enabled language.
        </p>
        {enabled.map((code) => {
          const lang = ALL_LANGUAGES.find(l => l.code === code);
          if (!lang) return null;
          const trans = translations[code] || { site_name: "", site_description: "" };
          return (
            <div key={code} style={{
              border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginBottom: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>{lang.flag}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>{lang.name}</span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>({code})</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
                  Site Name ({code})
                </label>
                <input type="text"
                  value={trans.site_name}
                  onChange={e => updateTranslation(code, "site_name", e.target.value)}
                  placeholder={`${lang.name} site name`}
                  style={{
                    width: "100%", padding: "8px 12px", border: "1px solid #d1d5db",
                    borderRadius: 6, fontSize: 14, boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
                  Site Description ({code})
                </label>
                <input type="text"
                  value={trans.site_description}
                  onChange={e => updateTranslation(code, "site_description", e.target.value)}
                  placeholder={`${lang.name} site description`}
                  style={{
                    width: "100%", padding: "8px 12px", border: "1px solid #d1d5db",
                    borderRadius: 6, fontSize: 14, boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          );
        })}
        {savedMsg && (
          <div style={{
            padding: "8px 16px", borderRadius: 6, marginBottom: 12,
            fontSize: 13, fontWeight: 500,
            background: savedMsg.startsWith("✅") ? "#f0fdf4" : "#fef2f2",
            color: savedMsg.startsWith("✅") ? "#16a34a" : "#dc2626",
            border: savedMsg.startsWith("✅") ? "1px solid #bbf7d0" : "1px solid #fecaca",
          }}>
            {savedMsg}
          </div>
        )}
        <SaveButton saving={saving} onClick={save} />
      </div>

      {/* ══════════════════════════════════════
         Translation Section
         ══════════════════════════════════════ */}
      <TranslationSection enabledLanguages={enabled} />
    </div>
  );
}

// ─── Translation Sub-Component ──────────────

function TranslationSection({ enabledLanguages }: { enabledLanguages: string[] }) {
  const [translateLang, setTranslateLang] = useState("");
  const [translateTypes, setTranslateTypes] = useState({ pages: true, categories: true, products: true, posts: true });
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [translating, setTranslating] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        setHasApiKey(!!data.translation_api_key || !!data.default_api_provider);
        if (!data.default_api_provider) setTranslateLang(enabledLanguages.filter(c => c !== "en")[0] || "");
        else setTranslateLang(enabledLanguages.filter(c => c !== "en")[0] || "");
      })
      .catch(() => {});
  }, [enabledLanguages]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentJob?.log]);

  // Poll active job
  useEffect(() => {
    if (!currentJob || currentJob.status === "completed" || currentJob.status === "failed") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/translate/jobs/${currentJob.id}`);
        const data = await res.json();
        if (data.job) {
          setCurrentJob(data.job);
          if (data.job.status === "completed" || data.job.status === "failed") {
            clearInterval(interval);
            setTranslating(false);
          }
        }
      } catch {}
    }, 1000);
    return () => clearInterval(interval);
  }, [currentJob?.id, currentJob?.status]);

  async function startTranslation() {
    if (!translateLang) return;
    setTranslating(true);
    try {
      const res = await fetch("/api/translate/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: translateLang, types: translateTypes }),
      });
      const data = await res.json();
      if (data.jobId) {
        const jobRes = await fetch(`/api/translate/jobs/${data.jobId}`);
        const jobData = await jobRes.json();
        if (jobData.job) setCurrentJob(jobData.job);
      }
    } catch (e: any) {
      alert("Failed: " + e.message);
      setTranslating(false);
    }
  }

  const isRunning = currentJob && (currentJob.status === "running" || currentJob.status === "pending");
  const progressPct = currentJob && currentJob.totalItems > 0
    ? Math.round((currentJob.completedItems / currentJob.totalItems) * 100) : 0;

  // Default to first non-English enabled language
  const nonEnglishLangs = enabledLanguages.filter(c => c !== "en");
  if (nonEnglishLangs.length === 0) {
    return null; // Nothing to translate if only English is enabled
  }

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "#374151" }}>🤖 Translate Content</h2>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
        Automatically translate all content to an enabled language. Configure API providers in{" "}
        <a href="/admin/settings/api" style={{ color: "#2563eb" }}>Settings → API</a> first.
      </p>

      {!isRunning ? (
        <>
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#374151" }}>Target Language</label>
              <select value={translateLang} onChange={e => setTranslateLang(e.target.value)}
                style={{
                  width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6,
                  fontSize: 14, boxSizing: "border-box",
                }}>
                {nonEnglishLangs.map(code => {
                  const info = (LOCALE_NAMES as any)[code];
                  return (
                    <option key={code} value={code}>
                      {info?.flag || "🌐"} {info?.name || code} ({code})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 8, color: "#374151" }}>Content Types</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { key: "pages" as const, label: "📄 Pages" },
                { key: "categories" as const, label: "🏷️ Categories" },
                { key: "products" as const, label: "📦 Products" },
                { key: "posts" as const, label: "✏️ Posts" },
              ].map(t => (
                <label key={t.key} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: 6, cursor: "pointer",
                  fontSize: 13, fontWeight: 500,
                  background: translateTypes[t.key] ? "#eff6ff" : "#f9fafb",
                  border: translateTypes[t.key] ? "1px solid #93c5fd" : "1px solid #e5e7eb",
                  color: translateTypes[t.key] ? "#2563eb" : "#6b7280",
                }}>
                  <input type="checkbox" checked={translateTypes[t.key]}
                    onChange={() => setTranslateTypes(prev => ({ ...prev, [t.key]: !prev[t.key] }))}
                    style={{ accentColor: "#2563eb" }} />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          <button onClick={startTranslation} disabled={translating || !hasApiKey}
            style={{
              padding: "10px 24px",
              background: (translating || !hasApiKey) ? "#93c5fd" : "#2563eb",
              color: "#fff", border: "none", borderRadius: 6,
              fontSize: 14, fontWeight: 600,
              cursor: (translating || !hasApiKey) ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}>
            🚀 Translate to {translateLang ? (LOCALE_NAMES as any)[translateLang]?.name || translateLang : "..."}
          </button>
          {!hasApiKey && (
            <p style={{ fontSize: 12, color: "#dc2626", marginTop: 8 }}>
              ⚠️ No API key configured. Go to <a href="/admin/settings/api" style={{ color: "#2563eb" }}>Settings → API</a> first.
            </p>
          )}

          <div style={{ marginTop: 16 }}>
            <a href="/admin/settings/translation" style={{ fontSize: 13, color: "#6b7280" }}>
              📋 View detailed translation history & logs →
            </a>
          </div>
        </>
      ) : (
        /* ── Active Job Progress ── */
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
            <span>{progressPct}% complete</span>
            <span>{currentJob?.completedItems} / {currentJob?.totalItems} items</span>
          </div>
          <div style={{ background: "#e5e7eb", borderRadius: 10, height: 10, overflow: "hidden", marginBottom: 12 }}>
            <div style={{
              width: `${progressPct}%`, height: "100%",
              background: "linear-gradient(90deg, #3b82f6, #2563eb)",
              borderRadius: 10, transition: "width 0.5s ease",
            }} />
          </div>

          {currentJob?.currentItem && (
            <div style={{ padding: "8px 12px", background: "#eff6ff", borderRadius: 6, fontSize: 13, color: "#2563eb", marginBottom: 8 }}>
              🔄 {currentJob.currentItem}
            </div>
          )}

          <div style={{ maxHeight: 200, overflow: "auto", padding: "8px 0", background: "#1e293b", borderRadius: 6, fontFamily: "monospace", fontSize: 11 }}>
            {(currentJob?.log || []).slice(-20).map((msg, i) => (
              <div key={i} style={{
                padding: "1px 12px",
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
        </div>
      )}
    </div>
  );
}
