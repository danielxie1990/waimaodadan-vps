"use client";

import { useEffect, useState } from "react";
import { InputField, inputStyle } from "@/components/admin/SettingsShared";

export default function AccountSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me/")
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setName(data.user.name || "");
          setEmail(data.user.email || "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function saveProfile() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/update-profile/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "✅ Profile updated", type: "success" });
      } else {
        setMessage({ text: "❌ " + (data.error || "Failed to update"), type: "error" });
      }
    } catch {
      setMessage({ text: "❌ Network error", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: "❌ Passwords do not match", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ text: "❌ Password must be at least 6 characters", type: "error" });
      return;
    }

    setPasswordSaving(true);
    setPasswordMessage(null);
    try {
      const res = await fetch("/api/auth/change-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMessage({ text: "✅ Password changed successfully", type: "success" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage({ text: "❌ " + (data.error || "Failed to change password"), type: "error" });
      }
    } catch {
      setPasswordMessage({ text: "❌ Network error", type: "error" });
    } finally {
      setPasswordSaving(false);
    }
  }

  if (loading) return <p style={{ color: "#6b7280" }}>Loading...</p>;

  const sectionStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 8,
    padding: 24,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    marginBottom: 20,
  };

  const btnStyle = (saving: boolean): React.CSSProperties => ({
    padding: "10px 32px",
    background: saving ? "#93c5fd" : "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: saving ? "not-allowed" : "pointer",
    marginTop: 8,
  });

  const msgStyle = (type: "success" | "error"): React.CSSProperties => ({
    marginTop: 12,
    padding: "10px 14px",
    borderRadius: 6,
    fontSize: 13,
    background: type === "success" ? "#f0fdf4" : "#fef2f2",
    color: type === "success" ? "#16a34a" : "#dc2626",
  });

  const dividerStyle: React.CSSProperties = {
    border: "none",
    borderTop: "1px solid #e5e7eb",
    margin: "24px 0",
  };

  return (
    <div>
      <div style={sectionStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "#374151" }}>👤 Admin Profile</h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
          Update your display name and login email address
        </p>

        <InputField label="Display Name" value={name}
          onChange={setName} placeholder="Admin" />
        <InputField label="Login Email" value={email}
          onChange={setEmail} placeholder="admin@example.com" type="email" />

        <button onClick={saveProfile} disabled={saving} style={btnStyle(saving)}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
        {message && <div style={msgStyle(message.type)}>{message.text}</div>}
      </div>

      <div style={sectionStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "#374151" }}>🔐 Change Password</h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
          Enter your current password and a new password
        </p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Current Password</label>
          <input type="password" value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            style={inputStyle} placeholder="Enter current password" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>New Password</label>
          <input type="password" value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            style={inputStyle} placeholder="At least 6 characters" minLength={6} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Confirm New Password</label>
          <input type="password" value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            style={inputStyle} placeholder="Repeat new password" minLength={6} />
        </div>

        <button onClick={changePassword} disabled={passwordSaving}
          style={{
            ...btnStyle(passwordSaving),
            background: passwordSaving ? "#93c5fd" : "#059669",
          }}>
          {passwordSaving ? "Changing..." : "Change Password"}
        </button>
        {passwordMessage && <div style={msgStyle(passwordMessage.type)}>{passwordMessage.text}</div>}
      </div>

      <div style={sectionStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "#374151" }}>📧 SMTP Setup Required</h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
          To use the "Forgot Password" feature, you need to configure SMTP email settings first.
          The verification code will be sent to your login email address.
        </p>
        <a href="/admin/settings/smtp/"
          style={{ padding: "10px 20px", background: "#fff", color: "#2563eb",
            border: "1px solid #2563eb", borderRadius: 6, fontSize: 14,
            textDecoration: "none", display: "inline-block" }}>
          Configure SMTP Settings →
        </a>
      </div>
    </div>
  );
}
