"use client";

import { useEffect, useState } from "react";
import { InputField, SaveButton } from "@/components/admin/SettingsShared";

export default function ContactSettings() {
  const [form, setForm] = useState({ contact_email: "", contact_phone: "", address: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => {
      setForm({ contact_email: data.contact_email || "", contact_phone: data.contact_phone || "", address: data.address || "" });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
  };

  if (loading) return <p style={{ color: "#6b7280" }}>Loading...</p>;

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#374151" }}>Contact Info</h2>
      <InputField label="Contact Email" value={form.contact_email} onChange={v => setForm({ ...form, contact_email: v })} />
      <InputField label="Contact Phone" value={form.contact_phone} onChange={v => setForm({ ...form, contact_phone: v })} />
      <InputField label="Address" value={form.address} onChange={v => setForm({ ...form, address: v })} />
      <SaveButton saving={saving} onClick={save} />
    </div>
  );
}
