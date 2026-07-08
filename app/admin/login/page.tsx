"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if setup has been completed
    fetch("/api/setup/")
      .then((r) => r.json())
      .then((data) => {
        if (data.needsSetup) {
          setNeedsSetup(true);
        }
        setChecking(false);
      })
      .catch(() => {
        setChecking(false);
      });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      router.push("/admin/dashboard/");
    } catch {
      setError("Login failed. Please try again.");
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }}>
        <p style={{ color: "#666" }}>Loading...</p>
      </div>
    );
  }

  if (needsSetup) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
        <div style={{ background: "#fff", padding: "48px 40px", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", width: 420, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px", color: "#0f172a" }}>Welcome to Your CMS!</h1>
          <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, margin: "0 0 28px" }}>
            Your website isn&apos;t set up yet. Let&apos;s get started —
            it only takes a minute.
          </p>
          <button
            onClick={() => router.push("/admin/setup/")}
            style={{
              width: "100%", padding: "14px", background: "#2563eb", color: "#fff",
              border: "none", borderRadius: 8, fontSize: 16, fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Set Up Your Website →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }}>
      <div style={{ background: "#fff", padding: "40px", borderRadius: 8, boxShadow: "0 2px 10px rgba(0,0,0,0.1)", width: 360 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>Admin Login</h1>
        <p style={{ color: "#666", fontSize: 14, textAlign: "center", marginBottom: 24 }}>
          Sign in to manage your website
        </p>

        {error && (
          <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: 6, fontSize: 14, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6, color: "#333" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
              placeholder="admin@example.com"
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6, color: "#333" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "12px", background: loading ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <a
            href="/admin/login/forgot-password/"
            style={{ color: "#2563eb", fontSize: 14, textDecoration: "none" }}
          >
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  );
}
