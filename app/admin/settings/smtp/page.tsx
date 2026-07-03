"use client";

import { useEffect, useState } from "react";
import { inputStyle } from "@/components/admin/SettingsShared";

export default function SmtpSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState("");
  const [testDetails, setTestDetails] = useState("");
  const [form, setForm] = useState({
    smtp_host: "",
    smtp_port: "587",
    smtp_encryption: "tls",
    smtp_autotls: "true",
    smtp_auth: "true",
    smtp_user: "",
    smtp_pass: "",
    smtp_from_email: "",
    smtp_from_name: "Admin Panel",
  });

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => {
      setForm(prev => ({ ...prev, ...data }));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setTestResult("");
    setTestDetails("");
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
  };

  const testEmail = async () => {
    setTestSending(true);
    setTestResult("");
    setTestDetails("");
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: form.smtp_from_email || form.smtp_user,
          subject: "SMTP Test from gytinbox.com",
          message: "This is a test email to verify SMTP configuration.",
          test_mode: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult("✅ Test email sent successfully!");
        if (data.details) setTestDetails(data.details);
      } else {
        setTestResult("❌ " + (data.error || "Failed"));
        if (data.details) setTestDetails(data.details);
      }
    } catch (err: any) {
      setTestResult("❌ " + err.message);
    } finally {
      setTestSending(false);
    }
  };

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6,
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    background: "#fff",
    cursor: "pointer",
  };

  const checkboxStyle: React.CSSProperties = {
    width: 18, height: 18, accentColor: "#2563eb", cursor: "pointer",
  };

  const rowStyle: React.CSSProperties = {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
  };

  if (loading) return <p style={{ color: "#6b7280" }}>Loading...</p>;

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "#374151" }}>SMTP Email Settings</h2>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
        Used for: contact form, password reset emails, and other system notifications
      </p>

      {/* Server Settings */}
      <div style={{ ...rowStyle, marginBottom: 8 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>SMTP Host *</label>
          <input type="text" value={form.smtp_host}
            onChange={e => update("smtp_host", e.target.value)}
            style={inputStyle} placeholder="smtp.hostinger.com" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>SMTP Port *</label>
          <input type="text" value={form.smtp_port}
            onChange={e => update("smtp_port", e.target.value.replace(/\D/g, ""))}
            style={inputStyle} placeholder="587" />
        </div>
      </div>

      {/* Encryption */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Encryption</label>
        <select value={form.smtp_encryption}
          onChange={e => {
            const v = e.target.value;
            update("smtp_encryption", v);
            // Auto-set port based on encryption
            if (v === "ssl") update("smtp_port", "465");
            else if (v === "tls" && form.smtp_port === "465") update("smtp_port", "587");
          }}
          style={selectStyle}>
          <option value="tls">TLS (STARTTLS, port 587)</option>
          <option value="ssl">SSL (port 465)</option>
          <option value="none">None (no encryption)</option>
        </select>
        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
          {form.smtp_encryption === "tls" && "Recommended. Starts with unencrypted then upgrades to TLS via STARTTLS."}
          {form.smtp_encryption === "ssl" && "SSL/TLS from the start. Common for port 465."}
          {form.smtp_encryption === "none" && "No encryption. Use only for local/trusted networks."}
        </p>
      </div>

      {/* Checkbox Row: Auto TLS + Auth */}
      <div style={{ display: "flex", gap: 32, marginBottom: 20 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
          <input type="checkbox" checked={form.smtp_autotls === "true"}
            onChange={e => update("smtp_autotls", e.target.checked ? "true" : "false")}
            style={checkboxStyle} />
          <div>
            <div style={{ fontWeight: 500, color: "#374151" }}>Auto TLS</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Require STARTTLS if available</div>
          </div>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
          <input type="checkbox" checked={form.smtp_auth === "true"}
            onChange={e => update("smtp_auth", e.target.checked ? "true" : "false")}
            style={checkboxStyle} />
          <div>
            <div style={{ fontWeight: 500, color: "#374151" }}>Authentication</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Require login credentials</div>
          </div>
        </label>
      </div>

      {/* Credentials */}
      <div style={rowStyle}>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>SMTP Username *</label>
          <input type="text" value={form.smtp_user}
            onChange={e => update("smtp_user", e.target.value)}
            style={inputStyle} placeholder="admin@fulimachine.com" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>SMTP Password *</label>
          <input type="password" value={form.smtp_pass}
            onChange={e => update("smtp_pass", e.target.value)}
            style={inputStyle} placeholder="Your email password" />
        </div>
      </div>

      {/* Sender Info */}
      <div style={rowStyle}>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>From Email</label>
          <input type="email" value={form.smtp_from_email}
            onChange={e => update("smtp_from_email", e.target.value)}
            style={inputStyle} placeholder={form.smtp_user || "admin@fulimachine.com"} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>From Name</label>
          <input type="text" value={form.smtp_from_name}
            onChange={e => update("smtp_from_name", e.target.value)}
            style={inputStyle} placeholder="Admin Panel" />
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "20px 0" }} />

      {/* Connection Summary */}
      <div style={{
        background: "#f8fafc", padding: "12px 16px", borderRadius: 6,
        fontSize: 13, color: "#374151", marginBottom: 20, fontFamily: "monospace",
      }}>
        <div><strong>Connection Preview:</strong></div>
        <div style={{ marginTop: 4, color: "#6b7280" }}>
          {form.smtp_host
            ? `${form.smtp_encryption === "ssl" ? "🔒 SSL" : form.smtp_encryption === "tls" ? "🔒 TLS" : "🔓 None"} — ${form.smtp_host}:${form.smtp_port} — Auth: ${form.smtp_auth === "true" ? "Yes" : "No"} — AutoTLS: ${form.smtp_autotls === "true" ? "Yes" : "No"}`
            : "Enter host to see preview"}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={save} disabled={saving}
          style={{
            padding: "10px 32px", background: saving ? "#93c5fd" : "#2563eb",
            color: "#fff", border: "none", borderRadius: 6,
            fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
          }}>
          {saving ? "Saving..." : "Save Settings"}
        </button>
        <button onClick={testEmail} disabled={testSending || !form.smtp_host}
          style={{
            padding: "10px 20px", background: "#fff", color: "#374151",
            border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14,
            cursor: testSending ? "not-allowed" : "pointer",
          }}>
          {testSending ? "Sending..." : "Send Test Email"}
        </button>
      </div>

      {testResult && (
        <div style={{
          marginTop: 12, padding: "10px 14px", borderRadius: 6, fontSize: 13,
          background: testResult.startsWith("✅") ? "#f0fdf4" : "#fef2f2",
          color: testResult.startsWith("✅") ? "#16a34a" : "#dc2626",
        }}>
          <div>{testResult}</div>
          {testDetails && (
            <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
              {testDetails}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
