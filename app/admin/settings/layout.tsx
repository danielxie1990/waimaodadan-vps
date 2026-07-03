"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { label: "General", href: "/admin/settings/general", icon: "⚙️" },
  { label: "Theme", href: "/admin/settings/theme", icon: "🎨" },
  { label: "Header", href: "/admin/settings/header", icon: "🖥️" },
  { label: "Branding", href: "/admin/settings/branding", icon: "🏷️" },
  { label: "Contact Info", href: "/admin/settings/contact", icon: "📞" },
  { label: "Sidebar Links", href: "/admin/settings/sidebar", icon: "🧭" },
  { label: "Footer", href: "/admin/settings/footer", icon: "📋" },
  { label: "Languages", href: "/admin/settings/languages", icon: "🌐" },
  { label: "Translation", href: "/admin/settings/translation", icon: "🤖" },
  { label: "API", href: "/admin/settings/api", icon: "🔌" },
  { label: "SMTP Email", href: "/admin/settings/smtp", icon: "📧" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Site Settings</h1>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* Sidebar */}
        <nav style={{
          width: 200, flexShrink: 0, background: "#fff",
          borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          overflow: "hidden", position: "sticky", top: 24,
        }}>
          {menuItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "12px 16px", textDecoration: "none", fontSize: 14,
                  color: active ? "#2563eb" : "#475569",
                  background: active ? "#eff6ff" : "transparent",
                  borderLeft: active ? "3px solid #2563eb" : "3px solid transparent",
                  transition: "all 0.1s",
                }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Content */}
        <div style={{ flex: 1, maxWidth: 700 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
