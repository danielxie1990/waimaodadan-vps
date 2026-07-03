"use client";

import { useEffect, useState } from "react";
import { InputField, SaveButton } from "@/components/admin/SettingsShared";

export default function SmtpSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState("");
  const [form, setForm] = useState({
    smtp_host: "", smtp_port: "587", smtp_user: "", smtp_pass: "",
    smtp_from_email: "", smtp_from_name: "",
  });

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => {
      setForm(prev => ({ ...prev, ...data }));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
  };

  const testEmail = async () => {
    setTestSending(true);
    setTestResult("");
    try {
      const res = await fetch("/api/email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: form.smtp_from_email || form.smtp_user,
          subject: "SMTP Test from gytinbox.com",
          message: "This is a test email to verify SMTP configuration.",
        }),
      });
      const data = await res.json();
      if (res.ok) setTestResult("✅ Test email sent successfully!");
      else setTestResult("❌ " + (data.error || "Failed"));
    } catch (err: any) {
      setTestResult("❌ " + err.message);
    } finally { setTestSending(false); }
  };

  if (loading) return <p style={{ color: "#6b7280" }}>Loading...</p>;

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "#374151" }}>SMTP Email Settings</h2>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
        Used by form blocks and contact page to send emails
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <InputField label="SMTP Host" value={form.smtp_host} onChange={v => setForm({ ...form, smtp_host: v })} placeholder="smtp.gmail.com" />
        <InputField label="SMTP Port" value={form.smtp_port} onChange={v => setForm({ ...form, smtp_port: v })} placeholder="587" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <InputField label="SMTP Username" value={form.smtp_user} onChange={v => setForm({ ...form, smtp_user: v })} />
        <InputField label="SMTP Password" value={form.smtp_pass} onChange={v => setForm({ ...form, smtp_pass: v })} type="password" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <InputField label="From Email" value={form.smtp_from_email} onChange={v => setForm({ ...form, smtp_from_email: v })} />
        <InputField label="From Name" value={form.smtp_from_name} onChange={v => setForm({ ...form, smtp_from_name: v })} placeholder="Website Contact" />
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
        <SaveButton saving={saving} onClick={save} />
        <button onClick={testEmail} disabled={testSending || !form.smtp_host}
          style={{ padding: "10px 20px", background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, cursor: testSending ? "not-allowed" : "pointer" }}>
          {testSending ? "Sending..." : "Send Test Email"}
        </button>
      </div>

      {testResult && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: testResult.startsWith("✅") ? "#f0fdf4" : "#fef2f2", borderRadius: 6, fontSize: 13 }}>
          {testResult}
        </div>
      )}
    </div>
  );
}
