"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export function AdminToolbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");
  const [checking, setChecking] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [pageInfo, setPageInfo] = useState<{ id: number | null; type: string | null; name: string | null } | null>(null);
  const pathname = usePathname();

  // Hide on admin pages
  if (pathname?.startsWith("/admin")) return null;

  // Auth check
  useEffect(() => {
    fetch("/api/auth/me/")
      .then((res) => {
        if (res.ok) {
          setIsAdmin(true);
          return res.json();
        }
        setIsAdmin(false);
        setChecking(false);
      })
      .then((data) => {
        if (data?.user?.name) setUserName(data.user.name);
        setChecking(false);
      })
      .catch(() => {
        setIsAdmin(false);
        setChecking(false);
      });
  }, []);

  // Auto-detect page info from URL
  useEffect(() => {
    if (!isAdmin || !pathname) return;
    const cleanPath = pathname.replace(/\/$/, "");
    fetch(`/api/page-info?path=${encodeURIComponent(cleanPath)}`)
      .then(r => r.json())
      .then(data => setPageInfo(data))
      .catch(() => {});
  }, [isAdmin, pathname]);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout/", { method: "POST" });
    window.location.reload();
  }, []);

  if (checking || !isAdmin) return null;

  // Build edit URL
  let editUrl = "";
  if (pageInfo?.id && pageInfo.type === "page") editUrl = `/admin/pages/${pageInfo.id}`;
  else if (pageInfo?.id && pageInfo.type === "product") editUrl = `/admin/products/${pageInfo.id}/edit`;
  else if (pageInfo?.id && pageInfo.type === "post") editUrl = `/admin/posts/${pageInfo.id}/edit`;

  const collapsedIconStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 12,
    right: 12,
    zIndex: 9999,
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#1e293b",
    color: "#fff",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.15s",
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={collapsedIconStyle}
        title="Open admin toolbar"
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        ⚙️
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#1e293b",
        color: "#fff",
        padding: "8px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 9999,
        fontSize: 13,
        boxShadow: "0 -2px 8px rgba(0,0,0,0.15)",
      }}
    >
      {/* Left: path + page name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ color: "#94a3b8", fontSize: 12 }}>{pathname}</span>
        {pageInfo?.name && (
          <span style={{
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: 4,
            background: "#334155",
            color: "#60a5fa",
            fontSize: 11,
            fontWeight: 500,
          }}>
            {pageInfo.name}
          </span>
        )}
      </div>

      {/* Right: actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {editUrl && (
          <a
            href={editUrl}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 6,
              background: "#2563eb",
              color: "#fff",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 500,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#1d4ed8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#2563eb"; }}
          >
            ✏️ 编辑此页面
          </a>
        )}
        {userName && (
          <span style={{ color: "#64748b", fontSize: 12, borderLeft: "1px solid #334155", paddingLeft: 8 }}>
            {userName}
          </span>
        )}
        {userName && (
          <button onClick={handleLogout}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 6,
              background: "transparent", color: "#f87171",
              border: "1px solid #f87171", fontSize: 12, cursor: "pointer",
            }}>
            退出登录
          </button>
        )}
        <a href="/admin/dashboard"
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "6px 12px", borderRadius: 6,
            background: "transparent", color: "#94a3b8",
            textDecoration: "none", fontSize: 12,
          }}>
          后台管理 →
        </a>
        <button onClick={() => setCollapsed(true)}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 24, height: 24, borderRadius: 4,
            background: "transparent", color: "#64748b",
            border: "1px solid #475569", fontSize: 12, cursor: "pointer",
            lineHeight: 1,
          }}
          title="Minimize">
          ▼
        </button>
      </div>
    </div>
  );
}
