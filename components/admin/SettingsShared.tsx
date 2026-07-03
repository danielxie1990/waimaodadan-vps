"use client";

import React, { useEffect, useRef, useState } from "react";

export const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 6,
  fontSize: 14, boxSizing: "border-box",
};

export function InputField({ label, value, onChange, type, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{label}</label>
      <input type={type || "text"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={inputStyle} />
    </div>
  );
}

export function TextareaField({ label, value, onChange, rows }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows || 3}
        style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical", minHeight: 80 }} />
    </div>
  );
}

export function ImageUploadCard({ label, field, currentUrl, onUpload, uploading }: {
  label: string; field: string; currentUrl: string;
  onUpload: (field: string, file: File) => void;
  uploading: boolean;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: field === "favicon_url" ? 48 : 160,
          height: 48, borderRadius: 8, border: "2px dashed #d1d5db",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", background: "#f9fafb", flexShrink: 0,
        }}>
          {currentUrl ? (
            <img src={currentUrl} alt={label}
              style={{ width: "100%", height: "100%", objectFit: field === "favicon_url" ? "cover" : "contain" }} />
          ) : (
            <span style={{ fontSize: 12, color: "#9ca3af" }}>None</span>
          )}
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(field, f); if (fileRef.current) fileRef.current.value = ""; }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ padding: "6px 16px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: uploading ? "wait" : "pointer", fontSize: 13 }}>
            {uploading ? "Uploading..." : "Upload Image"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  const prevSaving = useRef(saving);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (prevSaving.current && !saving) {
      // Save just completed (transitioned from true to false)
      setMsg({ text: "✅ Saved", type: "success" });
      setTimeout(() => setMsg(null), 2000);
    }
    prevSaving.current = saving;
  }, [saving]);

  return (
    <div style={{
      position: "sticky", bottom: 0, background: "#fff",
      borderTop: "1px solid #e5e7eb", padding: "16px 0", marginTop: 24,
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <button onClick={onClick} disabled={saving}
        style={{ padding: "10px 32px", background: saving ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
        {saving ? "Saving..." : "Save Settings"}
      </button>
      {msg && (
        <span style={{
          fontSize: 13, fontWeight: 500,
          color: msg.type === "success" ? "#16a34a" : "#dc2626",
          animation: "settingsFlash 0.25s ease",
        }}>
          {msg.text}
        </span>
      )}
    </div>
  );
}
