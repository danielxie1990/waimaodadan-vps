"use client";

import { useEffect, useState } from "react";

interface UpdateManifest {
  version: string;
  files: Record<string, { hash?: string; changed?: string }>;
  changelog: { version: string; date: string; changes: string[] }[];
}

export default function UpdatesPage() {
  const [manifest, setManifest] = useState<UpdateManifest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/updates")
      .then(r => r.json())
      .then(data => { setManifest(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!manifest) return <p>Failed to load update manifest.</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>🔄 Version Updates</h1>
        <span style={{
          padding: "6px 16px", borderRadius: 6,
          background: "#dbeafe", color: "#1d4ed8",
          fontSize: 13, fontWeight: 600,
        }}>
          v{manifest.version}
        </span>
      </div>

      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        This page shows the version history of the website framework. Updates are pushed from the central development server.
      </p>

      {/* Current Version Info */}
      <div style={{ background: "#fff", borderRadius: 8, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px", color: "#374151" }}>
          📦 Current Version — v{manifest.version}
        </h2>
        <div style={{ fontSize: 13, color: "#6b7280" }}>
          <span>{Object.keys(manifest.files).length} tracked files</span>
        </div>
      </div>

      {/* Changelog */}
      <div style={{ background: "#fff", borderRadius: 8, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: "#374151" }}>
          📋 Changelog
        </h2>

        {manifest.changelog.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9ca3af" }}>No changelog entries yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {manifest.changelog.map((entry, i) => (
              <div key={i} style={{
                padding: "16px", borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: i === 0 ? "#f0fdf4" : "#fff",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
                    v{entry.version}
                    {i === 0 && <span style={{ marginLeft: 8, fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#16a34a", color: "#fff", fontWeight: 500 }}>Current</span>}
                  </span>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{entry.date}</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#4b5563", lineHeight: 1.8 }}>
                  {entry.changes.map((c, j) => <li key={j}>{c}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
