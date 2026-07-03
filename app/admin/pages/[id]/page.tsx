"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import BlockEditor from "@/components/admin/BlockEditor";
import { TemplateSelector } from "@/components/admin/TemplateSelector";
import SEOPanel from "@/components/admin/SEOPanel";

interface PageData {
  id: number;
  title: string;
  slug: string;
  content: string;
  templateSlug: string;
  metaTitle: string | null;
  metaDesc: string | null;
  targetKeyword: string | null;
  published: boolean;
}

export default function EditPagePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    templateSlug: "default",
    content: "",
    metaTitle: "",
    metaDesc: "",
    targetKeyword: "",
    published: true,
  });

  useEffect(() => {
    fetch(`/api/pages/${id}/`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data: PageData) => {
        setForm({
          title: data.title,
          slug: data.slug,
          templateSlug: data.templateSlug || "default",
          content: data.content || "",
          metaTitle: data.metaTitle || "",
          metaDesc: data.metaDesc || "",
          targetKeyword: data.targetKeyword || "",
          published: data.published,
        });
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch(`/api/pages/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    if (res.ok) router.push("/admin/pages");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 14,
    boxSizing: "border-box",
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading...</div>;
  }

  if (notFound) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "#dc2626" }}>Page Not Found</h2>
        <p style={{ color: "#6b7280", marginTop: 8 }}>The page you are trying to edit does not exist.</p>
        <button
          onClick={() => router.push("/admin/pages")}
          style={{
            marginTop: 16,
            padding: "8px 20px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Back to Pages
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        Edit Page: {form.title}
      </h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 1100 }}>
        {/* Page Info */}
        <div
          style={{
            background: "#fff",
            borderRadius: 8,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 16,
              color: "#374151",
            }}
          >
            页面信息
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <label style={labelStyle}>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) =>
                  setForm({ ...form, published: e.target.checked })
                }
                style={{ width: 16, height: 16 }}
              />
              Published
            </label>
          </div>
        </div>

        {/* Template Selection */}
        <div
          style={{
            background: "#fff",
            borderRadius: 8,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 16,
              color: "#374151",
            }}
          >
            模板选择
          </h2>
          <TemplateSelector
            value={form.templateSlug}
            onChange={(slug) => setForm({ ...form, templateSlug: slug })}
          />
        </div>

        {/* Page Content - Block Editor */}
        <div
          style={{
            background: "#fff",
            borderRadius: 8,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 4,
              color: "#374151",
            }}
          >
            页面内容
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "#6b7280",
              marginBottom: 16,
            }}
          >
            Drag-and-drop blocks to build your page. Hover over preview and click to edit.
          </p>
          <BlockEditor
            value={form.content}
            onChange={(json) => setForm({ ...form, content: json })}
          />
        </div>

        {/* SEO - Guided On-Page SEO Panel */}
        <div
          style={{
            background: "#fff",
            borderRadius: 8,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 12,
              color: "#374151",
            }}
          >
            🎯 On-Page SEO
          </h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
            Fill out the checklist below to optimize this page for search engines. Green = done.
          </p>
          <SEOPanel
            title={form.title}
            metaTitle={form.metaTitle}
            metaDesc={form.metaDesc}
            slug={form.slug}
            targetKeyword={form.targetKeyword}
            onMetaTitleChange={(v) => setForm({ ...form, metaTitle: v })}
            onMetaDescChange={(v) => setForm({ ...form, metaDesc: v })}
            onTargetKeywordChange={(v) => setForm({ ...form, targetKeyword: v })}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "10px 24px",
              background: saving ? "#93c5fd" : "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving..." : "Update Page"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/pages")}
            style={{
              padding: "10px 24px",
              background: "#fff",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!confirm(`Delete "${form.title}"? This cannot be undone.`)) return;
              const res = await fetch(`/api/pages/${id}/`, { method: "DELETE" });
              if (res.ok) router.push("/admin/pages");
            }}
            style={{
              marginLeft: "auto",
              padding: "10px 24px",
              background: "#fff",
              color: "#dc2626",
              border: "1px solid #fca5a5",
              borderRadius: 6,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Delete Page
          </button>
        </div>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 4,
  color: "#374151",
};
