"use client";

import { useState, FormEvent } from "react";

interface FormField {
  key: string;
  label: string;
  type: string;
  required?: boolean;
}

interface FormBlockProps {
  fields: FormField[];
  submitText: string;
  successMessage: string;
  emailTo: string;
  emailSubject: string;
}

export function FormBlock({ fields, submitText, successMessage, emailTo, emailSubject }: FormBlockProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");

    try {
      // 构建邮件内容
      const messageParts = fields.map((f) => {
        const value = formData[f.key] || "(empty)";
        return `<strong>${f.label}:</strong> ${value}`;
      });
      const htmlMessage = messageParts.join("<br/>\n");

      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailTo || undefined,
          subject: emailSubject || "New Website Inquiry",
          message: htmlMessage,
          reply_to: formData.email || undefined,
          from_name: formData.name || "Website Visitor",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }

      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send. Please try again later.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <p style={{ fontSize: 16, color: "#374151" }}>{successMessage}</p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 14,
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: "0 auto" }}>
      {fields.map((f) => (
        <div key={f.key} style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontWeight: 500,
              marginBottom: 4,
              fontSize: 14,
              color: "#374151",
            }}
          >
            {f.label}
            {f.required && <span style={{ color: "#dc2626", marginLeft: 2 }}>*</span>}
          </label>

          {f.type === "textarea" ? (
            <textarea
              rows={4}
              value={formData[f.key] || ""}
              onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
              required={f.required}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          ) : (
            <input
              type={f.type === "email" ? "email" : "text"}
              value={formData[f.key] || ""}
              onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
              required={f.required}
              style={inputStyle}
            />
          )}
        </div>
      ))}

      {error && (
        <div
          style={{
            padding: "10px 14px",
            background: "#fef2f2",
            color: "#dc2626",
            borderRadius: 6,
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={sending}
        style={{
          padding: "12px 32px",
          background: sending ? "#fca5a5" : "#dc2626",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 15,
          fontWeight: 600,
          cursor: sending ? "not-allowed" : "pointer",
          transition: "background 0.15s",
        }}
      >
        {sending ? "Sending..." : submitText}
      </button>
    </form>
  );
}
