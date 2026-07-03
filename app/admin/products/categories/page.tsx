"use client";

import { useEffect, useState, useRef } from "react";
import RichEditor from "@/components/admin/RichEditor";
import LanguageFilterBar from "@/components/admin/LanguageFilterBar";
import Pagination from "@/components/admin/Pagination";
import { LOCALE_NAMES } from "@/lib/locale";

interface Category {
  id: number;
  name: string;
  slug: string;
  locale: string;
  description: string;
  image: string | null;
  sortOrder: number;
  createdAt: string;
}

export default function CategoriesPage() {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", image: "" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [locale, setLocale] = useState("en");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json())
      .then(data => { setAllCategories(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Filter by locale
  const categories = allCategories.filter(c => c.locale === locale);

  // Stats per language
  const stats = allCategories.reduce<Record<string, number>>((acc, c) => {
    acc[c.locale] = (acc[c.locale] || 0) + 1;
    return acc;
  }, {});

  // Reset page when locale or pageSize changes
  useEffect(() => { setPage(1); }, [locale, pageSize]);

  const paginated = categories.slice((page - 1) * pageSize, page * pageSize);

  function resetForm() {
    setForm({ name: "", slug: "", description: "", image: "" });
    setEditing(null);
    setShowForm(false);
  }

  function openNew() {
    setPage(1);
    resetForm();
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setForm({ name: cat.name, slug: cat.slug, description: cat.description, image: cat.image || "" });
    setEditing(cat);
    setShowForm(true);
  }

  function slugify(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function save() {
    if (!form.name || !form.slug) return;
    setSaving(true);

    const body = {
      ...form,
      image: form.image || null,
      sortOrder: editing?.sortOrder || 0,
      locale: editing?.locale || locale,
    };
    const url = editing ? `/api/categories/${editing.id}` : "/api/categories";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const saved = await res.json();
      if (editing) {
        setAllCategories(prev => prev.map(c => c.id === saved.id ? saved : c));
      } else {
        setAllCategories(prev => [...prev, saved]);
      }
      resetForm();
    }
    setSaving(false);
  }

  async function remove(id: number) {
    if (!confirm("Delete this category? Products using it will not be affected.")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) setAllCategories(prev => prev.filter(c => c.id !== id));
  }

  async function uploadImage(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/media", { method: "POST", body: fd });
    if (res.ok) {
      const media = await res.json();
      setForm(prev => ({ ...prev, image: media.url }));
    }
  }

  if (loading) return <p>Loading...</p>;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
          Product Categories
          <span style={{ fontSize: 14, fontWeight: 400, color: "#6b7280", marginLeft: 8 }}>
            ({categories.length})
          </span>
        </h1>
        <button onClick={openNew} style={{ padding: "10px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>
          + Add Category
        </button>
      </div>

      <LanguageFilterBar
        current={locale}
        onChange={setLocale}
        stats={Object.entries(stats).map(([code, count]) => ({ code, count }))}
        total={allCategories.length}
        label="Total across all languages"
      />

      {/* ── Form ── */}
      {showForm && (
        <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#374151" }}>
            {editing ? "Edit Category" : "New Category"}
          </h2>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
            Language: <strong>{locale.toUpperCase()}</strong>
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Slug *</label>
              <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} style={inputStyle} />
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                Frontend URL: <strong>/categories/{form.slug || "..."}</strong>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Description</label>
            <RichEditor
              value={form.description}
              onChange={html => setForm({ ...form, description: html })}
              placeholder="Enter category description..."
              minHeight={200}
            />
          </div>

          <div style={{ marginBottom: 16, marginTop: 12 }}>
            <label style={labelStyle}>Category Image</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              {form.image ? (
                <img src={form.image} alt="" style={{ width: 80, height: 80, borderRadius: 6, objectFit: "cover" }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: 6, background: "#f3f4f6", flexShrink: 0 }} />
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); if (fileRef.current) fileRef.current.value = ""; }} />
              <div>
                <button type="button" onClick={() => fileRef.current?.click()}
                  style={{ padding: "6px 16px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13 }}>
                  Upload Image
                </button>
                {form.image && (
                  <button type="button" onClick={() => setForm({ ...form, image: "" })}
                    style={{ padding: "6px 12px", border: "none", background: "transparent", color: "#dc2626", cursor: "pointer", fontSize: 13, marginLeft: 8 }}>
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={save} disabled={saving}
              style={{ padding: "8px 20px", background: saving ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={resetForm}
              style={{ padding: "8px 20px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", fontSize: 14, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── List ── */}
      {categories.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 8, padding: 40, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <p style={{ color: "#6b7280" }}>No categories in this language.</p>
        </div>
      ) : (
        <>
          <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Image</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Name</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Slug</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Language</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Description</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(cat => {
                  const langInfo = LOCALE_NAMES[cat.locale];
                  return (
                    <tr key={cat.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px 16px" }}>
                        {cat.image ? (
                          <img src={cat.image} alt="" style={{ width: 48, height: 48, borderRadius: 4, objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: 48, height: 48, borderRadius: 4, background: "#f3f4f6" }} />
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 500, fontSize: 14 }}>{cat.name}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>
                        /categories/{cat.slug}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13 }}>
                        <span>{langInfo?.flag || "🌐"}</span>
                        <span style={{ marginLeft: 4, color: "#6b7280" }}>{cat.locale.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {cat.description?.replace(/<[^>]*>/g, "").slice(0, 60) || "-"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <a href={`/categories/${cat.slug}`} target="_blank" rel="noopener noreferrer" title="Preview"
                          style={{ color: "#059669", fontSize: 16, marginRight: 12, textDecoration: "none", cursor: "pointer" }}>👁️</a>
                        <button onClick={() => openEdit(cat)}
                          style={{ color: "#2563eb", fontSize: 13, border: "none", background: "none", cursor: "pointer", marginRight: 12 }}>Edit</button>
                        <button onClick={() => remove(cat.id)}
                          style={{ color: "#dc2626", fontSize: 13, border: "none", background: "none", cursor: "pointer" }}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            total={categories.length}
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

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "#374151",
};
