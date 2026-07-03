"use client";

import { useEffect, useState } from "react";

interface SpecField {
  label: string;
  type: "text" | "number" | "textarea" | "select" | "multiselect" | "checkbox";
  unit: string;
  placeholder: string;
  required: boolean;
  defaultValue: string;
  options: string[]; // for select/multiselect
}

interface ProductType {
  id: number;
  name: string;
  slug: string;
  specFields: string;
}

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "textarea", label: "Textarea" },
  { value: "select", label: "Select (Dropdown)" },
  { value: "multiselect", label: "Multi Select" },
  { value: "checkbox", label: "Checkbox (Yes/No)" },
] as const;

function emptyField(): SpecField {
  return {
    label: "",
    type: "text",
    unit: "",
    placeholder: "",
    required: false,
    defaultValue: "",
    options: [],
  };
}

export default function ProductTypesPage() {
  const [types, setTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ProductType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "" });
  const [specItems, setSpecItems] = useState<SpecField[]>([]);

  useEffect(() => {
    fetch("/api/products/types")
      .then(r => r.json())
      .then(data => { setTypes(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function resetForm() {
    setForm({ name: "", slug: "" });
    setSpecItems([]);
    setEditing(null);
    setShowForm(false);
  }

  function openNew() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(t: ProductType) {
    setForm({ name: t.name, slug: t.slug });
    try {
      const fields = JSON.parse(t.specFields || "[]");
      setSpecItems(fields.map((f: any) => ({
        label: f.label || "",
        type: f.type || "text",
        unit: f.unit || "",
        placeholder: f.placeholder || "",
        required: f.required || false,
        defaultValue: f.defaultValue || "",
        options: Array.isArray(f.options) ? f.options : [],
      })));
    } catch {
      setSpecItems([]);
    }
    setEditing(t);
    setShowForm(true);
  }

  function slugify(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function addField() {
    setSpecItems(prev => [...prev, emptyField()]);
  }

  function updateField(index: number, updates: Partial<SpecField>) {
    setSpecItems(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
  }

  function removeField(index: number) {
    setSpecItems(prev => prev.filter((_, i) => i !== index));
  }

  function addOption(fieldIdx: number) {
    setSpecItems(prev => prev.map((f, i) => i === fieldIdx ? { ...f, options: [...f.options, ""] } : f));
  }

  function updateOption(fieldIdx: number, optIdx: number, value: string) {
    setSpecItems(prev => prev.map((f, i) =>
      i === fieldIdx ? { ...f, options: f.options.map((o, j) => j === optIdx ? value : o) } : f
    ));
  }

  function removeOption(fieldIdx: number, optIdx: number) {
    setSpecItems(prev => prev.map((f, i) =>
      i === fieldIdx ? { ...f, options: f.options.filter((_, j) => j !== optIdx) } : f
    ));
  }

  async function save() {
    if (!form.name || !form.slug) return;
    setSaving(true);

    // Remove empty fields
    const cleanSpecs = specItems.filter(s => s.label.trim());
    const specFields = JSON.stringify(cleanSpecs);

    const body = { ...form, specFields };
    const url = "/api/products/types";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { ...body, id: editing.id } : body),
    });

    if (res.ok) {
      const saved = await res.json();
      if (editing) {
        setTypes(prev => prev.map(t => t.id === saved.id ? saved : t));
      } else {
        setTypes(prev => [...prev, saved]);
      }
      resetForm();
    }
    setSaving(false);
  }

  async function removeType(id: number) {
    if (!confirm("Delete this field group? Products using it will have their custom fields preserved but the template link will be removed.")) return;
    const res = await fetch("/api/products/types", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setTypes(prev => prev.filter(t => t.id !== id));
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 3,
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle, padding: "8px 10px",
  };

  const smInput: React.CSSProperties = {
    ...inputStyle, width: 90,
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
          Custom Fields
          <span style={{ fontSize: 14, fontWeight: 400, color: "#6b7280", marginLeft: 8 }}>
            ({types.length})
          </span>
        </h1>
        <button onClick={openNew}
          style={{ padding: "10px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>
          + Add Field Group
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
          Custom Fields let you define reusable field groups (like WordPress ACF). 
          Each field can be a different type: text, number, textarea, dropdown, multi-select, or checkbox.
        </p>
        <p style={{ fontSize: 13, color: "#6b7280" }}>
          When creating a product, select a Field Group and the fields will appear automatically.
        </p>
      </div>

      {/* ── Form ── */}
      {showForm && (
        <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#374151" }}>
            {editing ? "Edit Field Group" : "New Field Group"}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Group Name *</label>
              <input type="text" value={form.name} onChange={e => {
                setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) });
              }} style={inputStyle} placeholder="e.g. Furniture Specs" />
            </div>
            <div>
              <label style={labelStyle}>Slug *</label>
              <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} style={inputStyle} />
            </div>
          </div>

          {/* Fields Builder */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151" }}>
                Fields ({specItems.length})
              </label>
            </div>

            {specItems.length === 0 && (
              <div style={{ padding: "20px 0", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                No fields yet. Click &quot;+ Add Field&quot; to start.
              </div>
            )}

            {specItems.map((field, i) => (
              <div key={i} style={{
                border: "1px solid #e5e7eb", borderRadius: 6, padding: 12, marginBottom: 8,
                background: "#fafafa",
              }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-end" }}>
                  {/* Field Label */}
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Field Name</label>
                    <input type="text" value={field.label} onChange={e => updateField(i, { label: e.target.value })}
                      placeholder="e.g. Material, Weight, Color" style={inputStyle} />
                  </div>

                  {/* Field Type */}
                  <div>
                    <label style={labelStyle}>Type</label>
                    <select value={field.type} onChange={e => updateField(i, { type: e.target.value as any })}
                      style={{ ...selectStyle, width: 140 }}>
                      {FIELD_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Unit */}
                  <div>
                    <label style={labelStyle}>Unit</label>
                    <input type="text" value={field.unit} onChange={e => updateField(i, { unit: e.target.value })}
                      placeholder="g/cm" style={smInput} />
                  </div>

                  {/* Delete */}
                  <button type="button" onClick={() => removeField(i)}
                    style={{ padding: "6px 10px", border: "1px solid #fca5a5", borderRadius: 4, background: "#fff", color: "#dc2626", cursor: "pointer", fontSize: 12, marginBottom: 0 }}>
                    ✕
                  </button>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {/* Placeholder */}
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <label style={labelStyle}>Placeholder</label>
                    <input type="text" value={field.placeholder} onChange={e => updateField(i, { placeholder: e.target.value })}
                      placeholder="e.g. Enter material..." style={inputStyle} />
                  </div>

                  {/* Default Value */}
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <label style={labelStyle}>Default Value</label>
                    <input type="text" value={field.defaultValue} onChange={e => updateField(i, { defaultValue: e.target.value })}
                      placeholder="Optional" style={inputStyle} />
                  </div>

                  {/* Required */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4, paddingTop: 16 }}>
                    <input type="checkbox" id={`req-${i}`} checked={field.required}
                      onChange={e => updateField(i, { required: e.target.checked })}
                      style={{ accentColor: "#2563eb" }} />
                    <label htmlFor={`req-${i}`} style={{ fontSize: 12, color: "#374151", cursor: "pointer" }}>Required</label>
                  </div>
                </div>

                {/* Options (for select/multiselect) */}
                {(field.type === "select" || field.type === "multiselect") && (
                  <div style={{ marginTop: 8, paddingLeft: 0 }}>
                    <label style={{ ...labelStyle, marginBottom: 4 }}>Options (one per line)</label>
                    {field.options.map((opt, j) => (
                      <div key={j} style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                        <input type="text" value={opt} onChange={e => updateOption(i, j, e.target.value)}
                          placeholder={`Option ${j + 1}`}
                          style={{ flex: 1, padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13 }} />
                        <button type="button" onClick={() => removeOption(i, j)}
                          style={{ padding: "4px 8px", border: "1px solid #fca5a5", borderRadius: 4, background: "#fff", color: "#dc2626", cursor: "pointer", fontSize: 11 }}>✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addOption(i)}
                      style={{ padding: "4px 10px", border: "1px dashed #94a3b8", borderRadius: 4, background: "transparent", fontSize: 12, cursor: "pointer", color: "#64748b" }}>
                      + Add Option
                    </button>
                  </div>
                )}
              </div>
            ))}

            <button type="button" onClick={addField}
              style={{ padding: "8px 16px", border: "2px dashed #94a3b8", borderRadius: 6, background: "transparent", fontSize: 13, cursor: "pointer", color: "#64748b", width: "100%", marginTop: 4 }}>
              + Add Field
            </button>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
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
      {types.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 8, padding: 40, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <p style={{ color: "#6b7280" }}>No custom field groups yet.</p>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Name</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Fields</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {types.map(t => {
                let fields: SpecField[] = [];
                try { fields = JSON.parse(t.specFields); } catch {}
                return (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 14 }}>{t.name}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>
                      {fields.length === 0 ? (
                        <span style={{ color: "#9ca3af" }}>No fields</span>
                      ) : (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {fields.map((f, i) => (
                            <span key={i} style={{
                              display: "inline-flex", alignItems: "center", gap: 3,
                              background: "#f3f4f6", padding: "2px 8px", borderRadius: 4, fontSize: 12,
                            }}>
                              {f.label}
                              <span style={{ color: "#9ca3af", fontSize: 10 }}>{f.type}</span>
                              {f.required && <span style={{ color: "#dc2626", fontSize: 10 }}>*</span>}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button onClick={() => openEdit(t)}
                        style={{ color: "#2563eb", fontSize: 13, border: "none", background: "none", cursor: "pointer", marginRight: 12 }}>
                        Edit
                      </button>
                      <button onClick={() => removeType(t.id)}
                        style={{ color: "#dc2626", fontSize: 13, border: "none", background: "none", cursor: "pointer" }}>
                        Delete
                      </button>
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
