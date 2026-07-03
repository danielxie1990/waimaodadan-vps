"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LanguageFilterBar from "@/components/admin/LanguageFilterBar";
import Pagination from "@/components/admin/Pagination";
import { getTemplate } from "@/components/templates/registry";

interface Page {
  id: number;
  title: string;
  slug: string;
  locale: string;
  templateSlug?: string;
  published: boolean;
  updatedAt: string;
}

export default function AdminPagesPage() {
  const [allPages, setAllPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState("en");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetch("/api/pages")
      .then(r => r.json())
      .then(data => { setAllPages(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Filter by locale
  const pages = allPages.filter(p => p.locale === locale);

  // Reset page when locale or pageSize changes
  useEffect(() => { setPage(1); }, [locale, pageSize]);

  const paginated = pages.slice((page - 1) * pageSize, page * pageSize);

  // Stats per language
  const stats = allPages.reduce<Record<string, number>>((acc, p) => {
    acc[p.locale] = (acc[p.locale] || 0) + 1;
    return acc;
  }, {});

  async function deletePage(id: number) {
    if (!confirm("Delete this page? This cannot be undone.")) return;
    const res = await fetch(`/api/pages/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAllPages(prev => prev.filter(p => p.id !== id));
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
          Pages
          <span style={{ fontSize: 14, fontWeight: 400, color: "#6b7280", marginLeft: 8 }}>
            ({pages.length})
          </span>
        </h1>
        <Link href="/admin/pages/new" style={{ padding: "10px 20px", background: "#059669", color: "#fff", borderRadius: 6, textDecoration: "none", fontSize: 14 }}>
          + New Page
        </Link>
      </div>

      <LanguageFilterBar
        current={locale}
        onChange={setLocale}
        stats={Object.entries(stats).map(([code, count]) => ({ code, count }))}
        total={allPages.length}
        label="Total across all languages"
      />

      {pages.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 8, padding: 40, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <p style={{ color: "#6b7280" }}>No pages in this language.</p>
        </div>
      ) : (
        <>
          <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Title</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Slug</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Template</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Updated</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 500, fontSize: 14 }}>{p.title}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>/ {p.slug}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 500,
                        background: p.templateSlug ? "#eff6ff" : "#f3f4f6",
                        color: p.templateSlug ? "#2563eb" : "#6b7280",
                      }}>
                        {p.templateSlug ? (getTemplate(p.templateSlug)?.name ?? p.templateSlug) : "default"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>{new Date(p.updatedAt).toLocaleDateString()}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <Link href={`/admin/pages/${p.id}`} style={{ color: "#2563eb", fontSize: 13, textDecoration: "none" }}>Edit</Link>
                      <a href={`/${p.slug}`} target="_blank" style={{ color: "#6b7280", fontSize: 13, marginLeft: 12, textDecoration: "none" }}>View</a>
                      <button onClick={() => deletePage(p.id)} style={{ color: "#dc2626", fontSize: 13, border: "none", background: "none", cursor: "pointer", marginLeft: 12 }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            total={pages.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </div>
  );
}
