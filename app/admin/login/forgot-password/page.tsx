"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Step 1: Send verification code
  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "Check your email for a verification code.");
        setStep("reset");
      } else {
        setError(data.error || "Failed to send code");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify code and reset password
  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("done");
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f5f5",
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    padding: "40px",
    borderRadius: 8,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    width: 400,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 14,
    boxSizing: "border-box",
  };

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    background: loading ? "#93c5fd" : "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 15,
    fontWeight: 600,
    cursor: loading ? "not-allowed" : "pointer",
  };

  const errorStyle: React.CSSProperties = {
    background: "#fef2f2",
    color: "#dc2626",
    padding: "10px 14px",
    borderRadius: 6,
    fontSize: 14,
    marginBottom: 16,
  };

  const messageStyle: React.CSSProperties = {
    background: "#f0fdf4",
    color: "#16a34a",
    padding: "10px 14px",
    borderRadius: 6,
    fontSize: 14,
    marginBottom: 16,
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>
          {step === "email" && "Reset Password"}
          {step === "reset" && "Enter Reset Code"}
          {step === "done" && "Password Reset ✓"}
        </h1>
        <p style={{ color: "#666", fontSize: 14, textAlign: "center", marginBottom: 24 }}>
          {step === "email" && "Enter your admin email to receive a verification code."}
          {step === "reset" && `A 6-digit code was sent to ${email}`}
          {step === "done" && "Your password has been reset successfully."}
        </p>

        {error && <div style={errorStyle}>{error}</div>}
        {message && <div style={messageStyle}>{message}</div>}

        {step === "email" && (
          <form onSubmit={handleSendCode}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6, color: "#333" }}>
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={inputStyle}
                placeholder="admin@gytinbox.com"
              />
            </div>
            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleReset}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6, color: "#333" }}>
                Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                style={{ ...inputStyle, textAlign: "center", fontSize: 20, letterSpacing: 6 }}
                placeholder="000000"
                maxLength={6}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6, color: "#333" }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                style={inputStyle}
                placeholder="At least 6 characters"
                minLength={6}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6, color: "#333" }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                style={inputStyle}
                placeholder="Repeat new password"
                minLength={6}
              />
            </div>
            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {step === "done" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <p style={{ color: "#666", fontSize: 14, marginBottom: 24 }}>
              You can now log in with your new password.
            </p>
            <a
              href="/admin/login/"
              style={{
                display: "inline-block",
                padding: "12px 32px",
                background: "#2563eb",
                color: "#fff",
                borderRadius: 6,
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Back to Login
            </a>
          </div>
        )}

        {step !== "done" && (
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <Link
              href="/admin/login/"
              style={{ color: "#6b7280", fontSize: 14, textDecoration: "none" }}
            >
              ← Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
