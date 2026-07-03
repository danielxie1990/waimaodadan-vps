"use client";

import { useEffect, useState, FormEvent, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import RichEditor from "@/components/admin/RichEditor";
import ImageUploader from "@/components/admin/ImageUploader";
import CategorySelect from "@/components/admin/CategorySelect";
import MediaPicker from "@/components/admin/MediaPicker";
import SEOPanel from "@/components/admin/SEOPanel";

interface SpecField { label: string; type?: string; unit?: string; placeholder?: string; required?: boolean; defaultValue?: string; options?: string[]; }
interface ProductSpec { id?: number; label: string; value: string; sortOrder: number; }

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customFields, setCustomFields] = useState<SpecField[]>([]);
  const [customFieldList, setCustomFieldList] = useState<{ id: number; name: string; slug: string; specFields: string }[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "", slug: "", image: "", video: "",
    metaTitle: "", metaDesc: "", targetKeyword: "",
  });
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
  const [images, setImages] = useState<{ url: string; alt?: string }[]>([]);
  const [specs, setSpecs] = useState<ProductSpec[]>([]);
  const [tabs, setTabs] = useState<{ icon: string; name: string; content: string }[]>([]);
  const [tabTemplateList, setTabTemplateList] = useState<{ id: number; name: string; slug: string; tabDefs: string }[]>([]);
  const [selectedTabTemplateId, setSelectedTabTemplateId] = useState<number | null>(null);
  const [locale, setLocale] = useState("en");
  const [mediaPickerMode, setMediaPickerMode] = useState<"main" | "gallery" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);

  const isNew = params.id === "new";

  useEffect(() => {
    // Fetch tab templates
    fetch("/api/products/tab-templates").then(r => r.json()).then((data: any[]) => {
      setTabTemplateList(Array.isArray(data) ? data : []);
    }).catch(() => {});

    fetch("/api/products/types").then(r => r.json()).then((types: any[]) => {
      setCustomFieldList(Array.isArray(types) ? types : []);
    }).catch(() => {});
    if (isNew) { setLoading(false); return; }
    fetch(`/api/products/${params.id}`).then(r => r.json()).then((p: any) => {
      if (p.error) return;
      setForm({
        title: p.title || "", slug: p.slug || "",
        image: p.image || "", video: p.video || "",
        metaTitle: p.metaTitle || "", metaDesc: p.metaDesc || "", targetKeyword: p.targetKeyword || p.keywords || "",
      });
      setCategories((p.categories || []).map((c: any) => ({ name: c.name, slug: c.slug })));
      setImages(p.images?.map((i: any) => ({ url: i.url, alt: i.alt })) || []);
      setTabs((p.tabs || []).map((t: any) => ({ icon: t.icon || 'fa-file-lines', name: t.name || 'Tab', content: t.content || '' })));
      if (p.tabTemplateId) setSelectedTabTemplateId(p.tabTemplateId);
      setLocale(p.locale || "en");
      const existing: ProductSpec[] = (p.specs || []).map((s: any) => ({ id: s.id, label: s.label, value: s.value, sortOrder: s.sortOrder }));
      setSpecs(existing);
      setSelectedFieldId(p.typeId || null);
      if (p.typeId) {
        fetch("/api/products/types").then(r => r.json()).then((types: any[]) => {
          if (Array.isArray(types)) {
            setCustomFieldList(types);
            const match = types.find((t: any) => t.id === p.typeId);
            if (match) {
              try {
                const fields: SpecField[] = JSON.parse(match.specFields || "[]");
                setCustomFields(fields.map(f => ({ ...f, type: f.type || "text", options: f.options || [] })));
                mergeSpecs(fields, existing);
              } catch {}
            }
          }
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id, isNew]);

  function onSelectCustomField(id: number | null) {
    setSelectedFieldId(id);
    if (!id) { setCustomFields([]); return; }
    const found = customFieldList.find(t => t.id === id);
    if (found) {
      try {
        const fields: SpecField[] = JSON.parse(found.specFields || "[]");
        const normalized = fields.map(f => ({ ...f, type: f.type || "text", options: f.options || [] }));
        setCustomFields(normalized);
        mergeSpecs(normalized, []);
      } catch {}
    }
  }

  function mergeSpecs(fields: SpecField[], existing: ProductSpec[]) {
    setSpecs(fields.map((f, i) => existing.find(s => s.label === f.label) || { label: f.label, value: f.defaultValue || "", sortOrder: i }));
  }

  function updateSpec(index: number, value: string) { setSpecs(prev => prev.map((s, i) => i === index ? { ...s, value } : s)); }
  function addCustomSpec() { setSpecs(prev => [...prev, { label: "", value: "", sortOrder: prev.length }]); }
  function updateCustomSpecLabel(index: number, label: string) { setSpecs(prev => prev.map((s, i) => i === index ? { ...s, label } : s)); }
  function removeSpec(index: number) { setSpecs(prev => prev.filter((_, i) => i !== index)); }

  function onSelectTabTemplate(id: number | null) {
    setSelectedTabTemplateId(id);
    if (!id) return;
    const found = tabTemplateList.find(t => t.id === id);
    if (found) {
      try {
        const defs: { icon: string; name: string }[] = JSON.parse(found.tabDefs || "[]");
        setTabs(defs.map(d => ({ icon: d.icon || 'fa-file-lines', name: d.name || 'Tab', content: '' })));
      } catch {}
    }
  }

  async function uploadGalleryImage(file: File) {
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/media/", { method: "POST", body: fd });
    if (res.ok) { const m = await res.json(); setImages(prev => [...prev, { url: m.url }]); }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const mainImage = images.length > 0 ? images[0].url : form.image;
    const body = {
      title: form.title, slug: form.slug, description: "", moreDescription: "", tabTemplateId: selectedTabTemplateId,
      image: mainImage, video: form.video,
      metaTitle: form.metaTitle, metaDesc: form.metaDesc,
      targetKeyword: form.targetKeyword, keywords: form.targetKeyword,
      categories, images, specs: specs.filter(s => s.label && s.value), tabs,
      typeId: selectedFieldId, published: true, locale,
    };
    const url = isNew ? "/api/products" : `/api/products/${params.id}`;
    const method = isNew ? "POST" : "PUT";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) router.push("/admin/products");
  }

  if (loading) return <p>Loading...</p>;

  const LS: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "#374151" };
  const IS: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" };

  return (
    <div>
      {mediaPickerMode === "gallery" && (
        <MediaPicker
          multiSelect
          onSelect={url => { setImages(prev => [...prev, { url }]); }}
          onSelectMultiple={urls => { setImages(prev => [...prev, ...urls.map(url => ({ url }))]); setMediaPickerMode(null); }}
          onClose={() => setMediaPickerMode(null)} />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{isNew ? "New Product" : "Edit Product"}</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 960 }}>
        {/* ════ Row 1: Title + Slug ════ */}
        <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#374151" }}>Basic Info</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={LS}>Title *</label><input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={IS} /></div>
            <div><label style={LS}>Slug *</label><input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} style={IS} placeholder="auto-generated" /></div>
          </div>
        </div>

        {/* ════ Media ════ */}
        <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#374151" }}>📷 Media</h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>First gallery image automatically becomes the main product image.</p>

          <div style={{ marginBottom: 16 }}>
            <label style={LS}>Product Video (YouTube URL)</label>
            <input type="text" value={form.video} onChange={e => setForm({ ...form, video: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..." style={IS} />
            {form.video && (() => {
              const match = form.video.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
              const vid = match?.[1];
              return vid ? (
                <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: 6, marginTop: 8 }}>
                  <iframe src={`https://www.youtube.com/embed/${vid}`} title="Product Video"
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none", borderRadius: 6 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              ) : <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>⚠️ Invalid YouTube URL</p>;
            })()}
          </div>

          <label style={LS}>Image Gallery</label>
          <ImageUploader images={images} onChange={setImages} />
        </div>

        {/* ════ Categories ════ */}
        <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
          <CategorySelect selected={categories} onChange={setCategories} locale={locale} />
        </div>

        {/* ════ Custom Fields ════ */}
        <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#374151" }}>Custom Fields</h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
            Select a template or add custom specs. Manage templates in <a href="/admin/products/types" style={{ color: "#2563eb" }}>Custom Fields</a>.
          </p>
          <div style={{ marginBottom: 12 }}>
            <label style={LS}>Field Template</label>
            <select value={selectedFieldId ?? ""} onChange={e => onSelectCustomField(e.target.value ? parseInt(e.target.value) : null)}
              style={{ ...IS, padding: "8px 10px" }}>
              <option value="">-- No template --</option>
              {customFieldList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          {customFields.length > 0 && (
            <div style={{ marginBottom: 12, padding: "12px 16px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e5e7eb" }}>
              {customFields.map((field, i) => {
                const v = specs[i]?.value || field.defaultValue || "";
                const pl = field.placeholder || `Enter ${field.label.toLowerCase()}...`;
                const requiredMark = field.required && !v ? { borderColor: "#dc2626" } : {};
                const lbl = `${field.label}${field.unit ? ` (${field.unit})` : ""}${field.required ? " *" : ""}`;
                return (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <label style={LS}>{lbl}</label>
                    {(field.type || "text") === "textarea" ? (
                      <textarea value={v} onChange={e => updateSpec(i, e.target.value)} placeholder={pl} rows={3}
                        style={{ ...IS, fontFamily: "inherit", resize: "vertical", minHeight: 80, ...requiredMark }} />
                    ) : (field.type || "text") === "select" ? (
                      <select value={v} onChange={e => updateSpec(i, e.target.value)} style={{ ...IS, padding: "8px 10px", ...requiredMark }}>
                        <option value="">{pl}</option>{(field.options || []).map((o, j) => <option key={j} value={o}>{o}</option>)}
                      </select>
                    ) : (field.type || "text") === "multiselect" ? (
                      <select multiple value={v ? v.split(", ") : []} onChange={e => updateSpec(i, Array.from(e.target.selectedOptions, o => o.value).join(", "))}
                        style={{ ...IS, minHeight: 80, ...requiredMark }}>
                        {(field.options || []).map((o, j) => <option key={j} value={o}>{o}</option>)}
                      </select>
                    ) : (field.type || "text") === "checkbox" ? (
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                        <input type="checkbox" checked={v === "true"} onChange={e => updateSpec(i, e.target.checked ? "true" : "false")} style={{ accentColor: "#2563eb", width: 18, height: 18 }} />
                        {field.placeholder || "Yes"}
                      </label>
                    ) : (field.type || "text") === "number" ? (
                      <input type="number" value={v} onChange={e => updateSpec(i, e.target.value)} placeholder={pl} style={{ ...IS, ...requiredMark }} />
                    ) : (
                      <input type="text" value={v} onChange={e => updateSpec(i, e.target.value)} placeholder={pl} style={{ ...IS, ...requiredMark }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {specs.slice(customFields.length).map((spec, i) => {
            const idx = customFields.length + i;
            return (
              <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <input type="text" value={spec.label} onChange={e => updateCustomSpecLabel(idx, e.target.value)} placeholder="Custom field name" style={{ flex: "0 0 140px", ...IS }} />
                <input type="text" value={spec.value} onChange={e => updateSpec(idx, e.target.value)} placeholder="Value" style={{ flex: 1, ...IS }} />
                <button type="button" onClick={() => removeSpec(idx)} style={{ padding: "6px 10px", border: "1px solid #fca5a5", borderRadius: 4, background: "#fff", color: "#dc2626", cursor: "pointer", fontSize: 12 }}>✕</button>
              </div>
            );
          })}
          <button type="button" onClick={addCustomSpec} style={{ padding: "6px 14px", border: "1px dashed #94a3b8", borderRadius: 4, background: "transparent", fontSize: 13, cursor: "pointer", color: "#64748b", marginTop: 4 }}>+ Add Custom Field</button>
        </div>

  

        {/* ════ Product Tabs ════ */}
        <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#374151" }}>📑 Product Tabs</h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
            Select a Tab Template to auto-generate tabs, or manually add/remove tabs below.
            Manage templates in <a href="/admin/products/tab-templates" style={{ color: "#2563eb" }}>Tab Templates</a>.
          </p>

          {/* Tab Template selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={LS}>Tab Template</label>
            <select value={selectedTabTemplateId ?? ""} onChange={e => onSelectTabTemplate(e.target.value ? parseInt(e.target.value) : null)}
              style={{ ...IS, padding: "8px 10px" }}>
              <option value="">-- No template --</option>
              {tabTemplateList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {tabs.map((tab, i) => (
            <div key={i} style={{ marginBottom: 16, padding: 16, border: "1px solid #e5e7eb", borderRadius: 8, background: "#f9fafb" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <input type="text" value={tab.icon} onChange={e => { const t = [...tabs]; t[i].icon = e.target.value; setTabs(t); }}
                  placeholder="fa-cube" style={{ flex: "0 0 120px", ...IS, fontFamily: "monospace", fontSize: 12 }} />
                <input type="text" value={tab.name} onChange={e => { const t = [...tabs]; t[i].name = e.target.value; setTabs(t); }}
                  placeholder="Tab name" style={{ flex: 1, ...IS }} />
                <button type="button" onClick={() => setTabs(tabs.filter((_, j) => j !== i))}
                  style={{ padding: "6px 10px", border: "1px solid #fca5a5", borderRadius: 4, background: "#fff", color: "#dc2626", cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}>✕ Remove</button>
              </div>
              <RichEditor value={tab.content} onChange={html => { const t = [...tabs]; t[i].content = html; setTabs(t); }}
                placeholder="Tab content..." minHeight={200} disableImageUpload={false} />
            </div>
          ))}
          <button type="button" onClick={() => setTabs([...tabs, { icon: 'fa-file-lines', name: 'New Tab', content: '' }])}
            style={{ padding: "8px 16px", border: "1px dashed #94a3b8", borderRadius: 6, background: "transparent", fontSize: 13, cursor: "pointer", color: "#64748b" }}>
            + Add Tab
          </button>
        </div>

        {/* ════ SEO Panel ════ */}
        <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#374151" }}>🔍 SEO</h2>
          <SEOPanel
            title={form.title}
            metaTitle={form.metaTitle}
            metaDesc={form.metaDesc}
            slug={form.slug}
            targetKeyword={form.targetKeyword}
            onMetaTitleChange={v => setForm({ ...form, metaTitle: v })}
            onMetaDescChange={v => setForm({ ...form, metaDesc: v })}
            onTargetKeywordChange={v => setForm({ ...form, targetKeyword: v })}
          />
        </div>

        {/* ════ Save ════ */}
        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" disabled={saving}
            style={{ padding: "10px 24px", background: saving ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving..." : "Save Product"}
          </button>
          <button type="button" onClick={() => router.back()}
            style={{ padding: "10px 24px", background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
