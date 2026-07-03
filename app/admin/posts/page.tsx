"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LanguageFilterBar from "@/components/admin/LanguageFilterBar";
import Pagination from "@/components/admin/Pagination";
import { LOCALE_NAMES } from "@/lib/locale";

interface Post {
  id: number;
  title: string;
  slug: string;
  locale: string;
  published: boolean;
  createdAt: string;
}

export default function AdminPostsPage() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState("en");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetch("/api/posts")
      .then(r => r.json())
      .then(data => { setAllPosts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Filter by locale
  const posts = allPosts.filter(p => p.locale === locale);

  // Reset page when locale or pageSize changes
  useEffect(() => { setPage(1); }, [locale, pageSize]);

  const paginated = posts.slice((page - 1) * pageSize, page * pageSize);

  // Stats per language
  const stats = allPosts.reduce<Record<string, number>>((acc, p) => {
    acc[p.locale] = (acc[p.locale] || 0) + 1;
    return acc;
  }, {});

  async function togglePublish(id: number, current: boolean) {
    const res = await fetch(`/api/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !current }),
    });
    if (res.ok) setAllPosts(prev => prev.map(p => p.id === id ? { ...p, published: !current } : p));
  }

  async function deletePost(id: number) {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) setAllPosts(prev => prev.filter(p => p.id !== id));
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
          Blog Posts
          <span style={{ fontSize: 14, fontWeight: 400, color: "#6b7280", marginLeft: 8 }}>
            ({posts.length})
          </span>
        </h1>
        <Link href="/admin/posts/new" style={{ padding: "10px 20px", background: "#d97706", color: "#fff", borderRadius: 6, textDecoration: "none", fontSize: 14 }}>+ New Post</Link>
      </div>

      <LanguageFilterBar
        current={locale}
        onChange={setLocale}
        stats={Object.entries(stats).map(([code, count]) => ({ code, count }))}
        total={allPosts.length}
        label="Total across all languages"
      />

      <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Title</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Slug</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Language</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Date</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Status</th>
              <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "12px 16px", fontWeight: 500, fontSize: 14 }}>{p.title}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>{p.slug}</td>
                <td style={{ padding: "12px 16px", fontSize: 13 }}>
                  <span style={{ fontSize: 14 }}>{LOCALE_NAMES[p.locale]?.flag || "🌐"}</span>
                  <span style={{ marginLeft: 4, color: "#6b7280" }}>{p.locale.toUpperCase()}</span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: "12px 16px" }}>
                  <button onClick={() => togglePublish(p.id, p.published)}
                    style={{ padding: "4px 10px", fontSize: 12, border: "none", borderRadius: 4, cursor: "pointer", background: p.published ? "#d1fae5" : "#fef3c7", color: p.published ? "#065f46" : "#92400e" }}>
                    {p.published ? "Published" : "Draft"}
                  </button>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" title="Preview"
                    style={{ color: "#059669", fontSize: 16, marginRight: 12, textDecoration: "none", cursor: "pointer" }}>👁️</a>
                  <Link href={`/admin/posts/${p.id}/edit`} style={{ color: "#2563eb", fontSize: 13, marginRight: 12, textDecoration: "none" }}>Edit</Link>
                  <button onClick={() => deletePost(p.id)} style={{ color: "#dc2626", fontSize: 13, border: "none", background: "none", cursor: "pointer" }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        total={posts.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
