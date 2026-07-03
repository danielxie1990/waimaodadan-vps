"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
        padding: 40,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 40,
          borderRadius: 8,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          textAlign: "center",
          maxWidth: 480,
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Something went wrong
        </h1>
        <p
          style={{
            color: "#6b7280",
            fontSize: 14,
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          An error occurred while loading this page.
          {error.message && (
            <span style={{ display: "block", marginTop: 8, fontSize: 12, color: "#9ca3af" }}>
              {error.message}
            </span>
          )}
        </p>
        <button
          onClick={reset}
          style={{
            padding: "10px 24px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
