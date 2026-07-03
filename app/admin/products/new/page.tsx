"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "@/components/admin/RichEditor";
import ImageUploader from "@/components/admin/ImageUploader";
import CategorySelect from "@/components/admin/CategorySelect";
import MediaPicker from "@/components/admin/MediaPicker";
import SEOPanel from "@/components/admin/SEOPanel";

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", slug: "", image: "", video: "",
    metaTitle: "", metaDesc: "", targetKeyword: "",
  });
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
  const [images, setImages] = useState<{ url: string; alt?: string }[]>([]);
  const [tabs, setTabs] = useState<{ icon: string; name: string; content: string }[]>([]);
  const [mediaPickerMode, setMediaPickerMode] = useState<"gallery" | null>(null);

  // Custom Fields
  const [customFieldList, setCustomFieldList] = useState<{ id: number; name: string; slug: string; specFields: string }[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [specs, setSpecs] = useState<{ label: string; value: string; sortOrder: number }[]>([]);

  // Tab Templates
  const [tabTemplateList, setTabTemplateList] = useState<{ id: number; name: string; slug: string; tabDefs: string }[]>([]);
  const [selectedTabTemplateId, setSelectedTabTemplateId] = useState<number | null>(null);



  useEffect(() => {
    fetch("/api/products/types").then(r => r.json()).then((types: any[]) => {
      setCustomFieldList(Array.isArray(types) ? types : []);
    }).catch(() => {});
    fetch("/api/products/tab-templates").then(r => r.json()).then((data: any[]) => {
      setTabTemplateList(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  function slugify(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function onSelectCustomField(id: number | null) {
    setSelectedFieldId(id);
    if (!id) { setCustomFields([]); setSpecs([]); return; }
    const found = customFieldList.find(t => t.id === id);
    if (found) {
      try {
        const fields = JSON.parse(found.specFields || "[]").map((f: any) => ({ ...f, type: f.type || "text", options: f.options || [] }));
        setCustomFields(fields);
        setSpecs(fields.map((f: any, i: number) => ({ label: f.label, value: f.defaultValue || "", sortOrder: i })));
      } catch {}
    }
  }

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    const categoriesData = categories.length > 0 ? categories : [];
    const mainImage = images.length > 0 ? images[0].url : "";

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form, image: mainImage, description: "", moreDescription: "",
        categories: categoriesData, images, tabs,
        specs: specs.filter(s => s.label && s.value),
        typeId: selectedFieldId,
        tabTemplateId: selectedTabTemplateId,
        published: true,
      }),
    });

    setSaving(false);
    if (res.ok) router.push("/admin/products");
  }

  const LS: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "#374151" };
  const IS: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" };

  return (
    <div>
      {mediaPickerMode === "gallery" && (
        <MediaPicker multiSelect onSelect={url => setImages(prev => [...prev, { url }])}
          onSelectMultiple={urls => { setImages(prev => [...prev, ...urls.map(url => ({ url }))]); setMediaPickerMode(null); }}
          onClose={() => setMediaPickerMode(null)} />
      )}

      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>New Product</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 960 }}>
        {/* Basic Info */}
        <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#374151" }}>Basic Info</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={LS}>Title *</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })} style={IS} /></div>
            <div><label style={LS}>Slug *</label>
              <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} style={IS} placeholder="auto-generated" /></div>
          </div>
        </div>

        {/* Media */}
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

        {/* Categories */}
        <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
          <CategorySelect selected={categories} onChange={setCategories} locale="en" />
        </div>

        {/* Custom Fields */}
        <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#374151" }}>🔧 Custom Fields</h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
            Manage templates in <a href="/admin/products/types" style={{ color: "#2563eb" }}>Custom Fields</a>.
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
            <div style={{ padding: "12px 16px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e5e7eb" }}>
              {customFields.map((field, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <label style={LS}>{field.label}{field.unit ? ` (${field.unit})` : ""}</label>
                  <input type="text" value={specs[i]?.value || ""} onChange={e => {
                    const s = [...specs]; s[i] = { ...s[i], value: e.target.value }; setSpecs(s);
                  }} placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`} style={IS} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Tabs */}
        <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#374151" }}>📑 Product Tabs</h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
            Select a Tab Template to auto-generate tabs. Manage in <a href="/admin/products/tab-templates" style={{ color: "#2563eb" }}>Tab Templates</a>.
          </p>
          <div style={{ marginBottom: 16 }}>
            <label style={LS}>Tab Template</label>
            <select value={selectedTabTemplateId ?? ""} onChange={e => onSelectTabTemplate(e.target.value ? parseInt(e.target.value) : null)}
              style={{ ...IS, padding: "8px 10px" }}>
              <option value="">-- No template --</option>
              {tabTemplateList.map(t => <option key={t.id} value={t.id}>{t.name} ({JSON.parse(t.tabDefs || "[]").length} tabs)</option>)}
            </select>
          </div>
          {tabs.map((tab, i) => (
            <div key={i} style={{ marginBottom: 16, padding: 16, border: "1px solid #e5e7eb", borderRadius: 8, background: "#f9fafb" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <input type="text" value={tab.icon} onChange={e => { const t = [...tabs]; t[i].icon = e.target.value; setTabs(t); }}
                  placeholder="fa-cube" style={{ flex: "0 0 100px", ...IS, fontFamily: "monospace", fontSize: 12 }} />
                <input type="text" value={tab.name} onChange={e => { const t = [...tabs]; t[i].name = e.target.value; setTabs(t); }}
                  placeholder="Tab name" style={{ flex: 1, ...IS }} />
                <button type="button" onClick={() => setTabs(tabs.filter((_, j) => j !== i))}
                  style={{ padding: "6px 10px", border: "1px solid #fca5a5", borderRadius: 4, background: "#fff", color: "#dc2626", cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}>✕</button>
              </div>
              <RichEditor value={tab.content} onChange={html => { const t = [...tabs]; t[i].content = html; setTabs(t); }}
                placeholder="Tab content..." minHeight={200} />
            </div>
          ))}
          <button type="button" onClick={() => setTabs([...tabs, { icon: 'fa-file-lines', name: 'New Tab', content: '' }])}
            style={{ padding: "8px 16px", border: "1px dashed #94a3b8", borderRadius: 6, background: "transparent", fontSize: 13, cursor: "pointer", color: "#64748b" }}>
            + Add Tab
          </button>
        </div>

        {/* SEO */}
        <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#374151" }}>🔍 SEO</h2>
          <SEOPanel
            title={form.title} metaTitle={form.metaTitle} metaDesc={form.metaDesc}
            slug={form.slug} targetKeyword={form.targetKeyword}
            onMetaTitleChange={v => setForm({ ...form, metaTitle: v })}
            onMetaDescChange={v => setForm({ ...form, metaDesc: v })}
            onTargetKeywordChange={v => setForm({ ...form, targetKeyword: v })} />
        </div>

        {/* Save */}
        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" disabled={saving}
            style={{ padding: "10px 24px", background: saving ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving..." : "Create Product"}
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
