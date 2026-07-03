"use client";

import { useEffect, useState } from "react";

interface ProviderConfig {
  name: string;
  key: string;
  icon: string;
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  model: string;
  models: string[];
  docsUrl: string;
}

const PROVIDER_TEMPLATES: ProviderConfig[] = [
  {
    name: "OpenAI",
    key: "openai",
    icon: "🤖",
    enabled: false,
    apiKey: "",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    name: "DeepSeek",
    key: "deepseek",
    icon: "🔮",
    enabled: true,
    apiKey: "",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"],
    docsUrl: "https://platform.deepseek.com",
  },
  {
    name: "Anthropic (Claude)",
    key: "anthropic",
    icon: "🟣",
    enabled: false,
    apiKey: "",
    baseUrl: "https://api.anthropic.com/v1",
    model: "claude-3-haiku-20240307",
    models: ["claude-3-haiku-20240307", "claude-3-sonnet-20240229", "claude-3-opus-20240229", "claude-3-5-sonnet-20241022"],
    docsUrl: "https://console.anthropic.com/",
  },
  {
    name: "Google Gemini",
    key: "gemini",
    icon: "🌍",
    enabled: false,
    apiKey: "",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    model: "gemini-2.0-flash",
    models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
    docsUrl: "https://aistudio.google.com/apikey",
  },
  {
    name: "Azure OpenAI",
    key: "azure",
    icon: "☁️",
    enabled: false,
    apiKey: "",
    baseUrl: "https://YOUR_RESOURCE.openai.azure.com",
    model: "gpt-4o-mini",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-35-turbo"],
    docsUrl: "https://portal.azure.com",
  },
];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6,
  fontSize: 14, boxSizing: "border-box", fontFamily: "monospace",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 4,
};

export default function ApiSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderConfig[]>(PROVIDER_TEMPLATES);
  const [defaultProvider, setDefaultProvider] = useState("deepseek");
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; msg: string } | null>>({});

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        // Load saved providers config
        if (data.api_providers) {
          try {
            const saved: Record<string, any> = JSON.parse(data.api_providers);
            setProviders(prev => prev.map(p => ({
              ...p,
              enabled: saved[p.key]?.enabled ?? p.enabled,
              apiKey: saved[p.key]?.apiKey || p.apiKey,
              baseUrl: saved[p.key]?.baseUrl || p.baseUrl,
              model: saved[p.key]?.model || p.model,
            })));
          } catch {}
        }
        if (data.default_api_provider) {
          setDefaultProvider(data.default_api_provider);
        }
        // Fallback: migrate old translation_provider/api_key
        if (data.translation_provider && !data.api_providers) {
          setProviders(prev => prev.map(p => ({
            ...p,
            enabled: p.key === data.translation_provider,
            apiKey: p.key === data.translation_provider ? (data.translation_api_key || "") : "",
          })));
          setDefaultProvider(data.translation_provider || "deepseek");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function updateProvider(key: string, updates: Partial<ProviderConfig>) {
    setProviders(prev => prev.map(p => p.key === key ? { ...p, ...updates } : p));
  }

  function toggleProvider(key: string) {
    setProviders(prev => prev.map(p =>
      p.key === key ? { ...p, enabled: !p.enabled } : p
    ));
  }

  async function testConnection(key: string) {
    const provider = providers.find(p => p.key === key);
    if (!provider || !provider.apiKey) {
      setTestResults(prev => ({ ...prev, [key]: { ok: false, msg: "API Key is required" } }));
      return;
    }
    setTestingId(key);
    setTestResults(prev => ({ ...prev, [key]: null }));

    try {
      let ok = false;
      let msg = "";

      if (key === "openai") {
        const res = await fetch(`${provider.baseUrl}/models`, {
          headers: { Authorization: `Bearer ${provider.apiKey}` },
        });
        ok = res.ok;
        msg = ok ? "✅ Connected" : `❌ ${res.status} ${res.statusText}`;
      } else if (key === "deepseek") {
        const res = await fetch(`${provider.baseUrl}/models`, {
          headers: { Authorization: `Bearer ${provider.apiKey}` },
        });
        ok = res.ok;
        msg = ok ? "✅ Connected" : `❌ ${res.status} ${res.statusText}`;
      } else if (key === "anthropic") {
        const res = await fetch(`${provider.baseUrl}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": provider.apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({ model: "claude-3-haiku-20240307", max_tokens: 1, messages: [{ role: "user", content: "hi" }] }),
        });
        ok = res.ok;
        msg = ok ? "✅ Connected" : `❌ ${res.status} ${res.statusText}`;
      } else if (key === "gemini") {
        const res = await fetch(`${provider.baseUrl}/models?key=${provider.apiKey}`);
        ok = res.ok;
        msg = ok ? "✅ Connected" : `❌ ${res.status} ${res.statusText}`;
      } else if (key === "azure") {
        const res = await fetch(`${provider.baseUrl}/openai/models?api-version=2024-02-01`, {
          headers: { "api-key": provider.apiKey },
        });
        ok = res.ok;
        msg = ok ? "✅ Connected" : `❌ ${res.status} ${res.statusText}`;
      } else {
        msg = "Tests not available for this provider";
      }

      setTestResults(prev => ({ ...prev, [key]: { ok, msg } }));
    } catch (e: any) {
      setTestResults(prev => ({ ...prev, [key]: { ok: false, msg: `❌ ${e.message}` } }));
    }
    setTestingId(null);
  }

  async function save() {
    setSaving(true);
    setSavedMsg(null);

    const providersObj: Record<string, any> = {};
    for (const p of providers) {
      providersObj[p.key] = {
        enabled: p.enabled,
        apiKey: p.apiKey,
        baseUrl: p.baseUrl,
        model: p.model,
      };
    }

    // Also keep old settings in sync for backward compat
    const defaultProv = providers.find(p => p.key === defaultProvider);
    const updates: Record<string, string> = {
      api_providers: JSON.stringify(providersObj),
      default_api_provider: defaultProvider,
      translation_provider: defaultProv?.key || "deepseek",
      translation_api_key: defaultProv?.apiKey || "",
    };

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    setSaving(false);
    if (res.ok) {
      setSavedMsg("✅ API settings saved!");
      setTimeout(() => setSavedMsg(null), 3000);
    } else {
      setSavedMsg("❌ Failed to save");
      setTimeout(() => setSavedMsg(null), 4000);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      {/* Default Provider Selector */}
      <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "#374151" }}>⭐ Default API Provider</h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
          Select which provider to use for automatic translation and other AI features.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {providers.filter(p => p.enabled).map(p => (
            <button key={p.key} type="button" onClick={() => setDefaultProvider(p.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 18px", borderRadius: 8, cursor: "pointer",
                border: defaultProvider === p.key ? "2px solid #2563eb" : "2px solid #e5e7eb",
                background: defaultProvider === p.key ? "#eff6ff" : "#fff",
                fontWeight: defaultProvider === p.key ? 600 : 400,
                fontSize: 14, color: defaultProvider === p.key ? "#2563eb" : "#374151",
              }}>
              <span style={{ fontSize: 18 }}>{p.icon}</span>
              <span>{p.name}</span>
              {defaultProvider === p.key && <span style={{ color: "#2563eb" }}>✓</span>}
            </button>
          ))}
          {providers.filter(p => p.enabled).length === 0 && (
            <p style={{ color: "#9ca3af", fontSize: 13 }}>Enable at least one provider below.</p>
          )}
        </div>
      </div>

      {/* Provider Cards */}
      {providers.map((provider) => (
        <div key={provider.key} style={{
          background: "#fff", borderRadius: 8, padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 16,
          borderLeft: provider.enabled ? "4px solid #2563eb" : "4px solid #e5e7eb",
          opacity: provider.enabled ? 1 : 0.6,
        }}>
          {/* Header with toggle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>{provider.icon}</span>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "#374151" }}>{provider.name}</h3>
                <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: "#2563eb", textDecoration: "none" }}>
                  Get API Key ↗
                </a>
              </div>
            </div>
            <label style={{
              position: "relative", display: "inline-block", width: 48, height: 26, cursor: "pointer",
            }}>
              <input type="checkbox" checked={provider.enabled}
                onChange={() => toggleProvider(provider.key)}
                style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{
                position: "absolute", inset: 0, borderRadius: 26,
                background: provider.enabled ? "#2563eb" : "#d1d5db",
                transition: "0.3s",
              }}>
                <span style={{
                  position: "absolute", top: 3, left: provider.enabled ? 24 : 3,
                  width: 20, height: 20, borderRadius: "50%", background: "#fff",
                  transition: "0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </span>
            </label>
          </div>

          {provider.enabled && (
            <>
              {/* API Key */}
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>API Key {provider.key === "azure" ? "or API Key" : ""}</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="password" value={provider.apiKey}
                    onChange={e => updateProvider(provider.key, { apiKey: e.target.value })}
                    placeholder={provider.key === "azure" ? "your-api-key" : "sk-..."}
                    style={{ flex: 1, ...inputStyle }} />
                  <button type="button" onClick={() => testConnection(provider.key)}
                    disabled={testingId === provider.key}
                    style={{
                      padding: "8px 14px", borderRadius: 6, fontSize: 13, cursor: testingId === provider.key ? "wait" : "pointer",
                      border: "1px solid #d1d5db", background: "#fff", whiteSpace: "nowrap",
                    }}>
                    {testingId === provider.key ? "⏳" : "🔍 Test"}
                  </button>
                </div>
                {testResults[provider.key] && (
                  <div style={{
                    marginTop: 4, fontSize: 12, padding: "4px 8px", borderRadius: 4,
                    background: testResults[provider.key]?.ok ? "#f0fdf4" : "#fef2f2",
                    color: testResults[provider.key]?.ok ? "#16a34a" : "#dc2626",
                  }}>
                    {testResults[provider.key]?.msg}
                  </div>
                )}
              </div>

              {/* Base URL */}
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Base URL</label>
                <input type="text" value={provider.baseUrl}
                  onChange={e => updateProvider(provider.key, { baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  style={inputStyle} />
              </div>

              {/* Model */}
              <div>
                <label style={labelStyle}>Model</label>
                <select value={provider.model}
                  onChange={e => updateProvider(provider.key, { model: e.target.value })}
                  style={{ ...inputStyle, padding: "8px 10px" }}>
                  {provider.models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      ))}

      {savedMsg && (
        <div style={{
          padding: "8px 16px", borderRadius: 6, marginBottom: 12, fontSize: 13, fontWeight: 500,
          background: savedMsg.startsWith("✅") ? "#f0fdf4" : "#fef2f2",
          color: savedMsg.startsWith("✅") ? "#16a34a" : "#dc2626",
          border: savedMsg.startsWith("✅") ? "1px solid #bbf7d0" : "1px solid #fecaca",
        }}>
          {savedMsg}
        </div>
      )}

      <div style={{ position: "sticky", bottom: 0, background: "#fff", borderTop: "1px solid #e5e7eb", padding: "16px 0", marginTop: 24 }}>
        <button onClick={save} disabled={saving}
          style={{
            padding: "10px 32px", background: saving ? "#93c5fd" : "#2563eb",
            color: "#fff", border: "none", borderRadius: 6, fontSize: 14,
            fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
          }}>
          {saving ? "Saving..." : "Save API Settings"}
        </button>
      </div>
    </div>
  );
}
