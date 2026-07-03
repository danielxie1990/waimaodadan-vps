"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface User {
  id: number;
  name: string;
  email: string;
}

type NavItem = { type?: "link"; href: string; label: string; icon: string }
  | { type: "group"; label: string; icon: string; items: { href: string; label: string }[] };

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { type: "group", label: "Products", icon: "📦", items: [
    { href: "/admin/products", label: "All Products" },
    { href: "/admin/products/categories", label: "Categories" },
    { href: "/admin/products/types", label: "Custom Fields" },
    { href: "/admin/products/tab-templates", label: "Tab Templates" },
  ]},
  { href: "/admin/pages", label: "Pages", icon: "📄" },
  { href: "/admin/posts", label: "Blog Posts", icon: "✏️" },
  { href: "/admin/media", label: "Media", icon: "🖼️" },
  { href: "/admin/menu", label: "Menu", icon: "🧭" },
  { href: "/admin/updates", label: "Updates", icon: "🔄" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [siteName, setSiteName] = useState("Admin Panel");
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Products"]);

  function toggleGroup(label: string) {
    setExpandedGroups(prev => prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]);
  }
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/admin/login/" || pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }
    Promise.all([
      fetch("/api/auth/me/"),
      fetch("/api/settings"),
    ]).then(async ([authRes, settingsRes]) => {
      if (!authRes.ok) throw new Error("Unauthorized");
      const authData = await authRes.json();
      try {
        const s = await settingsRes.json();
        setSiteName(s.admin_brand || s.site_name || "Admin Panel");
      } catch {}
      setUser(authData.user);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
      router.push("/admin/login/");
    });
  }, [isLoginPage, router]);

  // Close sidebar on nav (mobile)
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }}>
        <p style={{ color: "#666" }}>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const sidebarStyle: React.CSSProperties = {
    width: 240,
    background: "#1e293b",
    color: "#fff",
    padding: "24px 0",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Mobile hamburger toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="admin-hamburger"
        style={{
          position: "fixed", top: 8, left: 8, zIndex: 101,
          background: "#1e293b", color: "#fff", border: "none",
          borderRadius: 4, padding: "6px 10px", fontSize: 18,
          cursor: "pointer",
        }}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>

      {/* Mobile overlay */}
      <div
        className={`admin-overlay${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`admin-sidebar${sidebarOpen ? " open" : ""}`}
        style={sidebarStyle as React.CSSProperties}
      >
        <div style={{ padding: "0 20px", marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{siteName}</h2>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{user.name}</p>
        </div>
        <nav>
          {NAV_ITEMS.map((item) => {
            if (item.type === "group") {
              const isExpanded = expandedGroups.includes(item.label);
              const groupActive = item.items.some(sub => pathname.startsWith(sub.href));
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleGroup(item.label)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", padding: "10px 20px",
                      color: groupActive ? "#fff" : "#94a3b8",
                      background: "transparent",
                      border: "none", borderLeft: groupActive ? "3px solid #3b82f6" : "3px solid transparent",
                      fontSize: 14, cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <span>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    <span style={{ fontSize: 10, transition: "transform 0.2s", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                  </button>
                  {isExpanded && item.items.map(sub => {
                    const subActive = pathname === sub.href || (sub.href !== "/admin/products" && pathname.startsWith(sub.href + "/")) || (sub.href === "/admin/products" && pathname === "/admin/products");
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "8px 20px 8px 48px",
                          color: subActive ? "#fff" : "#94a3b8",
                          background: subActive ? "#334155" : "transparent",
                          textDecoration: "none", fontSize: 13,
                          borderLeft: subActive ? "3px solid #3b82f6" : "3px solid transparent",
                        }}
                      >
                        <span>{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            }
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 20px",
                  color: active ? "#fff" : "#94a3b8",
                  background: active ? "#334155" : "transparent",
                  textDecoration: "none",
                  fontSize: 14,
                  borderLeft: active ? "3px solid #3b82f6" : "3px solid transparent",
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div style={{ marginTop: "auto", borderTop: "1px solid #334155", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          <a href="/" target="_blank" rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px",
              background: "#1e293b", color: "#e2e8f0",
              border: "1px solid #475569", borderRadius: 6,
              fontSize: 13, cursor: "pointer",
              textDecoration: "none",
            }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>👁️</span>
            <span>View Site</span>
          </a>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout/", { method: "POST" });
              router.push("/admin/login/");
            }}
            style={{ width: "100%", padding: "8px 12px", background: "transparent", color: "#94a3b8", border: "1px solid #475569", borderRadius: 6, fontSize: 13, cursor: "pointer" }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, background: "#f8fafc", overflowY: "auto", height: "100vh" }}>
        <div style={{ padding: "24px 32px" }}>
          {/* Mobile: top padding for hamburger button */}
          <div className="show-mobile" style={{ height: 32 }} />
          {children}
        </div>
      </main>
    </div>
  );
}
