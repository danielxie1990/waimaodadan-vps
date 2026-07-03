"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { localizeUrl, LOCALE_NAMES } from "@/lib/locale";
import EditButton from "@/components/EditButton";

const DEFAULT_FOOTER = [
  {
    title: "About Us",
    type: "text",
    content: "Professional manufacturer with years of experience serving global clients.",
  },
  {
    title: "Quick Links",
    type: "links",
    items: [
      { label: "Home", url: "/" },
      { label: "Products", url: "/products" },
      { label: "About", url: "/about" },
      { label: "Contact", url: "/contact" },
    ],
  },
  {
    title: "Contact Info",
    type: "contact",
  },
];

function getLocaleFromUrl(): string {
  if (typeof window === "undefined") return "en";
  const segments = window.location.pathname.split("/").filter(Boolean);
  if (segments.length > 0 && Object.keys(LOCALE_NAMES).includes(segments[0])) {
    return segments[0];
  }
  return "en";
}

function withLocale(url: string, locale: string): string {
  if (!url || url === "#") return url;
  return localizeUrl(url, locale);
}

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  const [locale, setLocale] = useState("en");
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocale(getLocaleFromUrl());
    // Re-check locale on URL changes
    const handlePopState = () => setLocale(getLocaleFromUrl());
    window.addEventListener("popstate", handlePopState);

    fetch("/api/settings")
      .then(r => r.json())
      .then((data: Record<string, string>) => setSettings(data))
      .catch(() => {});

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Also update locale when link clicks change the URL
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newLocale = getLocaleFromUrl();
      if (newLocale !== locale) setLocale(newLocale);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [locale]);

  let footerColumns: any[] = DEFAULT_FOOTER;
  if (settings.footer_columns) {
    try {
      const parsed = JSON.parse(settings.footer_columns);
      if (Array.isArray(parsed) && parsed.length > 0) footerColumns = parsed;
    } catch {}
  }

  return (
    <footer style={{ background: "var(--bg-dark)", color: "#ccc", padding: "60px 0 30px" }}>
      <div className="container">
        <div style={{ position: "relative" }}>
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 30, marginBottom: 40 }}>
          {footerColumns.map((col: any, i: number) => (
            <div key={i}>
              <h4 style={{ color: "#fff", marginBottom: 16, fontSize: 18 }}>{col.title}</h4>

              {col.type === "text" && (
                <p style={{ fontSize: 14, lineHeight: 1.8 }}>{col.content || ""}</p>
              )}

              {col.type === "links" && Array.isArray(col.items) && (
                <ul style={{ listStyle: "none", fontSize: 14, padding: 0, margin: 0 }}>
                  {col.items.map((link: any, j: number) => (
                    <li key={j} style={{ marginBottom: 8 }}>
                      {link.url ? (
                        <Link href={withLocale(link.url, locale)} style={{ color: "#ccc", textDecoration: "none" }}>
                          {link.label}
                        </Link>
                      ) : (
                        <span>{link.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {col.type === "contact" && (
                <div style={{ fontSize: 14, lineHeight: 1.8, position: "relative" }}>
                  <EditButton href="/admin/settings/contact" label="Edit Contact Info" position="top-right" />
                  <p>Email: {settings.contact_email || "contact@example.com"}</p>
                  <p>Phone: {settings.contact_phone || "+1 (555) 000-0000"}</p>
                  {settings.address && <p>{settings.address}</p>}
                </div>
              )}

              {col.type === "social" && (
                <div style={{ display: "flex", gap: 12, fontSize: 20 }}>
                  {settings.facebook_url && <a href={settings.facebook_url} target="_blank" style={{ color: "#ccc", textDecoration: "none" }}>📘</a>}
                  {settings.twitter_url && <a href={settings.twitter_url} target="_blank" style={{ color: "#ccc", textDecoration: "none" }}>🐦</a>}
                  {settings.instagram_url && <a href={settings.instagram_url} target="_blank" style={{ color: "#ccc", textDecoration: "none" }}>📷</a>}
                  {settings.linkedin_url && <a href={settings.linkedin_url} target="_blank" style={{ color: "#ccc", textDecoration: "none" }}>💼</a>}
                  {settings.youtube_url && <a href={settings.youtube_url} target="_blank" style={{ color: "#ccc", textDecoration: "none" }}>▶️</a>}
                </div>
              )}

              {col.type === "html" && (
                <div style={{ fontSize: 14, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: col.content || "" }} />
              )}
            </div>
          ))}
          </div>
          <EditButton href="/admin/settings/footer" label="Edit Footer Columns" position="top-right" />
        </div>
        <div style={{ borderTop: "1px solid #333", paddingTop: 20, textAlign: "center", fontSize: 13, position: "relative" }}>
          <EditButton href="/admin/settings/footer" label="Edit Footer Text" position="top-right" />
          &copy; {new Date().getFullYear()} {settings.site_name || "My Company"}. All rights reserved.
          {settings.footer_text && <span> | {settings.footer_text}</span>}
        </div>
      </div>
    </footer>
  );
}
