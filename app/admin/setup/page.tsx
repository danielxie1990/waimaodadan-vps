"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type Step = "welcome" | "admin" | "done";

export default function SetupPage() {
  const [step, setStep] = useState<Step>("welcome");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Form fields
  const [siteName, setSiteName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetch("/api/setup/")
      .then((r) => r.json())
      .then((data) => {
        if (!data.needsSetup) {
          // Already set up — redirect to dashboard (or login)
          router.push("/admin/login/");
          return;
        }
        setLoading(false);
      })
      .catch(() => {
        // DB not ready yet — show setup
        setLoading(false);
      });
  }, [router]);

  async function handleStart(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (adminPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!siteName.trim()) {
      setError("Please enter your company or website name.");
      return;
    }
    if (!adminEmail.trim()) {
      setError("Please enter an admin email.");
      return;
    }
    if (adminPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/setup/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: siteName.trim(),
          adminName: adminName.trim() || "Admin",
          adminEmail: adminEmail.trim(),
          adminPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Setup failed. Please try again.");
        setSaving(false);
        return;
      }

      setStep("done");
    } catch {
      setError("Network error. Please check your connection and try again.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, border: "3px solid rgba(255,255,255,0.2)",
            borderTopColor: "#3b82f6", borderRadius: "50%", margin: "0 auto 16px",
            animation: "spin 0.8s linear infinite",
          }} />
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Checking system...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: 20,
      }}>
        <div style={{
          background: "#fff", borderRadius: 16, padding: "48px 40px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)", maxWidth: 480, width: "100%",
          textAlign: "center",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", background: "#065f46",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px", fontSize: 28, color: "#fff",
          }}>✓</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px", color: "#0f172a" }}>
            All set! 🎉
          </h1>
          <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.6, margin: "0 0 28px" }}>
            Your website is ready. You can now log in to the admin panel
            and start customizing your site.
          </p>
          <div style={{
            background: "#f8fafc", borderRadius: 8, padding: 16,
            marginBottom: 28, textAlign: "left", fontSize: 13, color: "#475569",
          }}>
            <strong>Login credentials saved.</strong>
            <br />Email: <strong>{adminEmail}</strong>
          </div>
          <button
            onClick={() => router.push("/admin/login/")}
            style={{
              width: "100%", padding: "14px", background: "#2563eb", color: "#fff",
              border: "none", borderRadius: 8, fontSize: 16, fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Go to Admin Login →
          </button>
        </div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", border: "1px solid #d1d5db",
    borderRadius: 8, fontSize: 15, boxSizing: "border-box",
    outline: "none",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "48px 40px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)", maxWidth: 500, width: "100%",
      }}>
        {/* Step indicator */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32, justifyContent: "center" }}>
          {["welcome", "admin"].map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: step === s ? "#2563eb" : "#e2e8f0",
                color: step === s ? "#fff" : "#94a3b8",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 600,
              }}>{i + 1}</div>
              {i < 1 && <div style={{
                width: 40, height: 2, background: step === "admin" ? "#2563eb" : "#e2e8f0",
              }} />}
            </div>
          ))}
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px", color: "#0f172a" }}>
            Welcome! 👋
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
            Let&apos;s set up your website in just a minute.
          </p>
        </div>

        {error && (
          <div style={{
            background: "#fef2f2", color: "#dc2626", padding: "12px 14px",
            borderRadius: 8, fontSize: 14, marginBottom: 20, border: "1px solid #fecaca",
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleStart}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
              Company / Website Name *
            </label>
            <input
              type="text"
              value={siteName}
              onChange={e => setSiteName(e.target.value)}
              placeholder="e.g. My Company"
              required
              style={inputStyle}
              autoFocus
            />
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
              This will appear on your website header and browser tabs.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
              Your Name
            </label>
            <input
              type="text"
              value={adminName}
              onChange={e => setAdminName(e.target.value)}
              placeholder="e.g. John"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
              Admin Email *
            </label>
            <input
              type="email"
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              placeholder="admin@yourcompany.com"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
              Password *
            </label>
            <input
              type="password"
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
              Confirm Password *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              required
              minLength={6}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              width: "100%", padding: "14px", background: saving ? "#93c5fd" : "#2563eb",
              color: "#fff", border: "none", borderRadius: 8, fontSize: 16,
              fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {saving ? "Setting up your website..." : "Complete Setup →"}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, marginTop: 20 }}>
          Your data is stored locally. No third-party services.
        </p>
      </div>
    </div>
  );
}
