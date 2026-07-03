"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [stats, setStats] = useState({ products: 0, pages: 0, posts: 0, media: 0 });

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then(r => r.json()),
      fetch("/api/pages").then(r => r.json()),
      fetch("/api/posts").then(r => r.json()),
      fetch("/api/media").then(r => r.json()),
    ]).then(([products, pages, posts, media]) => {
      setStats({
        products: Array.isArray(products) ? products.length : 0,
        pages: Array.isArray(pages) ? pages.length : 0,
        posts: Array.isArray(posts) ? posts.length : 0,
        media: Array.isArray(media) ? media.length : 0,
      });
    });
  }, []);

  const cards = [
    { label: "Products", value: stats.products, color: "#2563eb", href: "/admin/products" },
    { label: "Pages", value: stats.pages, color: "#059669", href: "/admin/pages" },
    { label: "Blog Posts", value: stats.posts, color: "#d97706", href: "/admin/posts" },
    { label: "Media Files", value: stats.media, color: "#7c3aed", href: "/admin/media" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {cards.map((card) => (
          <a key={card.label} href={card.href} style={{ textDecoration: "none" }}>
            <div style={{
              background: "#fff",
              borderRadius: 8,
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              borderLeft: `4px solid ${card.color}`,
            }}>
              <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 8px" }}>{card.label}</p>
              <p style={{ fontSize: 36, fontWeight: 700, margin: 0, color: card.color }}>{card.value}</p>
            </div>
          </a>
        ))}
      </div>

      <div style={{ marginTop: 32, background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Quick Actions</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="/admin/products/new" style={{ padding: "10px 20px", background: "#2563eb", color: "#fff", borderRadius: 6, textDecoration: "none", fontSize: 14 }}>+ New Product</a>
          <a href="/admin/pages" style={{ padding: "10px 20px", background: "#059669", color: "#fff", borderRadius: 6, textDecoration: "none", fontSize: 14 }}>Edit Pages</a>
          <a href="/admin/posts/new" style={{ padding: "10px 20px", background: "#d97706", color: "#fff", borderRadius: 6, textDecoration: "none", fontSize: 14 }}>+ New Blog Post</a>
          <a href="/" target="_blank" style={{ padding: "10px 20px", background: "#6b7280", color: "#fff", borderRadius: 6, textDecoration: "none", fontSize: 14 }}>View Site →</a>
        </div>
      </div>
    </div>
  );
}
