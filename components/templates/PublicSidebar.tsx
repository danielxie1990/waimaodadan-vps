"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface SidebarLink {
  id: string;
  label: string;
  url: string;
  icon: string;
}

const DEFAULT_LINKS: SidebarLink[] = [
  { id: "1", label: "所有产品", url: "/products", icon: "📦" },
  { id: "2", label: "方形铁盒", url: "/tins-category/rectangle-tin-box", icon: "📦" },
  { id: "3", label: "圆形铁盒", url: "/tins-category/round-tin-can", icon: "📦" },
  { id: "4", label: "铁盒配件", url: "/tin-accessories", icon: "🔧" },
  { id: "5", label: "定制服务", url: "/custom-tins", icon: "🎨" },
  { id: "6", label: "关于我们", url: "/about-us", icon: "ℹ️" },
  { id: "7", label: "联系我们", url: "/contact", icon: "✉️" },
  { id: "8", label: "包装博客", url: "/packaging-blog", icon: "📝" },
];

export function PublicSidebar() {
  const pathname = usePathname();
  const [links, setLinks] = useState<SidebarLink[]>(DEFAULT_LINKS);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.sidebar_links) {
          try {
            const parsed = JSON.parse(data.sidebar_links);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setLinks(parsed);
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden", position: "sticky", top: 100 }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", fontWeight: 600, fontSize: 15, color: "#1e293b" }}>
        导航菜单
      </div>
      <nav>
        {links.map((link) => {
          const active = pathname === link.url || pathname.startsWith(link.url + "/");
          return (
            <Link key={link.id} href={link.url}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px",
                color: active ? "#2563eb" : "#475569", background: active ? "#eff6ff" : "transparent",
                textDecoration: "none", fontSize: 14,
                borderLeft: active ? "3px solid #2563eb" : "3px solid transparent",
                transition: "all 0.15s ease" }}
              onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#1e293b"; } }}
              onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; } }}>
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div style={{ padding: "16px 20px", borderTop: "1px solid #f0f0f0", fontSize: 12, color: "#94a3b8" }}>
        <p style={{ margin: "0 0 4px" }}>需要帮助？</p>
        <p style={{ margin: 0, color: "#64748b" }}>sales@goodyou-tin.com</p>
      </div>
    </div>
  );
}
