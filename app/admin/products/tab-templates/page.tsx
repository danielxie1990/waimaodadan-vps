"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import IconPicker from "@/components/admin/IconPicker";

interface TabTemplate {
  id: number;
  name: string;
  slug: string;
  tabDefs: string;
  _count?: { products: number };
}



export default function TabTemplatesPage() {
  const [templates, setTemplates] = useState<TabTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TabTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", tabDefs: "[]" });
  const [editingDefs, setEditingDefs] = useState<{ icon: string; name: string }[]>([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    const res = await fetch("/api/products/tab-templates");
    const data = await res.json();
    setTemplates(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({ name: "", slug: "", tabDefs: "[]" });
    setEditingDefs([{ icon: "fa-file-lines", name: "Tab 1" }]);
    setShowForm(true);
  }

  function openEdit(t: TabTemplate) {
    setEditing(t);
    setForm({ name: t.name, slug: t.slug, tabDefs: t.tabDefs });
    try {
      setEditingDefs(JSON.parse(t.tabDefs || "[]"));
    } catch {
      setEditingDefs([{ icon: "fa-file-lines", name: "Tab 1" }]);
    }
    setShowForm(true);
  }

  function addTabDef() {
    setEditingDefs([...editingDefs, { icon: "fa-file-lines", name: `Tab ${editingDefs.length + 1}` }]);
  }

  function updateTabDef(i: number, field: string, val: string) {
    const arr = [...editingDefs];
    (arr as any)[i][field] = val;
    setEditingDefs(arr);
  }

  function removeTabDef(i: number) {
    setEditingDefs(editingDefs.filter((_, j) => j !== i));
  }

  function slugify(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function saveForm() {
    const body = {
      ...form,
      slug: form.slug || slugify(form.name),
      tabDefs: JSON.stringify(editingDefs),
    };

    const url = "/api/products/tab-templates";
    const method = editing ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { ...body, id: editing.id } : body),
    });

    setShowForm(false);
    setEditing(null);
    fetchTemplates();
  }

  async function deleteTemplate(id: number) {
    if (!confirm("Delete this tab template?")) return;
    await fetch(`/api/products/tab-templates?id=${id}`, { method: "DELETE" });
    fetchTemplates();
  }

  const LS: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "#374151" };
  const IS: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
          Tab Templates
          <span style={{ fontSize: 14, fontWeight: 400, color: "#6b7280", marginLeft: 8 }}>({templates.length})</span>
        </h1>
        {!showForm && (
          <button onClick={openNew}
            style={{ padding: "10px 20px", background: "#2563eb", color: "#fff", borderRadius: 6, border: "none", fontSize: 14, cursor: "pointer" }}>
            + New Template
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#374151" }}>
            {editing ? "Edit" : "New"} Tab Template
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <label style={LS}>Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
                style={IS} placeholder="e.g. Product Details" />
            </div>
            <div>
              <label style={LS}>Slug</label>
              <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} style={IS} />
            </div>
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "#374151" }}>Tab Definitions</h3>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
            Define the tabs that will appear on product pages. Each tab has a Font Awesome icon class and a name.
          </p>

          {editingDefs.map((def, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <IconPicker value={def.icon} onChange={val => updateTabDef(i, "icon", val)} />
              <input type="text" value={def.name} onChange={e => updateTabDef(i, "name", e.target.value)}
                placeholder="Tab name" style={{ flex: 1, ...IS, padding: "6px 8px" }} />
              <button type="button" onClick={() => removeTabDef(i)}
                style={{ padding: "6px 10px", border: "1px solid #fca5a5", borderRadius: 4, background: "#fff", color: "#dc2626", cursor: "pointer", fontSize: 12 }}>✕</button>
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="button" onClick={addTabDef}
              style={{ padding: "6px 14px", border: "1px dashed #94a3b8", borderRadius: 4, background: "transparent", fontSize: 13, cursor: "pointer", color: "#64748b" }}>
              + Add Tab
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button onClick={saveForm}
              style={{ padding: "10px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {editing ? "Update" : "Create"}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); }}
              style={{ padding: "10px 24px", background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Template List */}
      {templates.length === 0 && !showForm ? (
        <div style={{ background: "#fff", borderRadius: 8, padding: 40, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <p style={{ color: "#6b7280" }}>No tab templates yet. Create one to quickly add tabs to your products.</p>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Name</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Tabs</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Products</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => {
                let defs: { icon: string; name: string }[] = [];
                try { defs = JSON.parse(t.tabDefs || "[]"); } catch {}
                return (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 500, fontSize: 14 }}>{t.name}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>
                      {defs.map((d, i) => (
                        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f3f4f6", padding: "2px 8px", borderRadius: 4, marginRight: 4, fontSize: 12 }}>
                          <i className={`fas ${d.icon}`} style={{ fontSize: 10 }} /> {d.name}
                        </span>
                      ))}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>{t._count?.products || 0}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button onClick={() => openEdit(t)}
                        style={{ color: "#2563eb", fontSize: 13, marginRight: 12, border: "none", background: "none", cursor: "pointer" }}>Edit</button>
                      <button onClick={() => deleteTemplate(t.id)}
                        style={{ color: "#dc2626", fontSize: 13, border: "none", background: "none", cursor: "pointer" }}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
