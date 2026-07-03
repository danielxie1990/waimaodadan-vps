"use client";

import { useEffect, useState, useRef } from "react";
import { v4 as uuid } from "uuid";
import MediaBrowser from "@/components/admin/MediaBrowser";

interface MenuItem {
  id: string;
  title: string;
  url: string;
  enabled: boolean;
  image?: string;
  children?: MenuItem[];
  customLinks?: CustomLink[];
}

interface CustomLink {
  id: string;
  label: string;
  url: string;
  enabled: boolean;
}

interface UrlOption {
  label: string;
  url: string;
  type: "page" | "post" | "product" | "category";
}

const MAX_DEPTH = 2;

const TYPE_MAP: Record<string, string> = { pages: "page", posts: "post", products: "product", categories: "category" };
function typeMatch(type: string, tab: string): boolean { return type === TYPE_MAP[tab]; }

const DEFAULT_MENU: MenuItem[] = [
  { id: uuid(), title: "Home", url: "/", enabled: true },
  {
    id: uuid(), title: "Products", url: "#", enabled: true, children: [
      { id: uuid(), title: "Tin Boxes", url: "/category-1", enabled: true, image: "", children: [
        { id: uuid(), title: "Round Tins", url: "/product-a", enabled: true },
        { id: uuid(), title: "Square Tins", url: "/product-b", enabled: true },
      ]},
      { id: uuid(), title: "Services", url: "/category-2", enabled: true, image: "" },
    ],
  },
  { id: uuid(), title: "About", url: "/about", enabled: true },
  { id: uuid(), title: "Contact", url: "/contact", enabled: true },
];

export default function MenuPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Menu data
  const [items, setItems] = useState<MenuItem[]>([]);
  const [menuStyle, setMenuStyle] = useState<"classic" | "mega">("classic");
  const [customNavItems, setCustomNavItems] = useState<{ id: string; label: string; url: string; enabled: boolean }[]>([]);

  // Edit modal state
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editItemDepth, setEditItemDepth] = useState(0);

  // Media browser
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);

  // Tree expand state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Drag refs
  const dragRef = useRef<string | null>(null);
  const dropZoneRef = useRef<{ targetId: string; position: "before" | "child" | "after" } | null>(null);

  // URL autocomplete
  const [urlPickerOpen, setUrlPickerOpen] = useState(false);
  const [urlTab, setUrlTab] = useState<"pages" | "posts" | "products" | "categories">("pages");
  const [urlSearch, setUrlSearch] = useState("");
  const [urlOptions, setUrlOptions] = useState<UrlOption[]>([]);
  const [urlLoading, setUrlLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestRef = useRef<HTMLDivElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // ── Load Data ──
  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        if (data.menu) {
          try {
            const parsed = JSON.parse(data.menu);
            if (Array.isArray(parsed) && parsed.length > 0) setItems(parsed);
            else setItems(DEFAULT_MENU);
          } catch { setItems(DEFAULT_MENU); }
        } else {
          setItems(DEFAULT_MENU);
        }
        if (data.menu_style === "mega" || data.menu_style === "classic") {
          setMenuStyle(data.menu_style as "classic" | "mega");
        }
        if (data.megaCustomNav) {
          try {
            const parsed = JSON.parse(data.megaCustomNav);
            if (Array.isArray(parsed) && parsed.length > 0) setCustomNavItems(parsed);
          } catch {}
        }
        setLoading(false);
      })
      .catch(() => { setItems(DEFAULT_MENU); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!showSuggestions) return;
    const handle = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node) &&
          urlInputRef.current && !urlInputRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showSuggestions]);

  useEffect(() => {
    if (!showModal) return;
    loadUrlOptions();
  }, [showModal]);

  function loadUrlOptions() {
    if (urlOptions.length > 0) return;
    setUrlLoading(true);
    const promises: Promise<void>[] = [];
    promises.push(
      fetch("/api/pages").then(r => r.json()).then((data: any[]) => {
        if (Array.isArray(data)) {
          setUrlOptions(prev => {
            const filtered = prev.filter(o => o.type !== "page");
            return [...filtered, ...data.map((p: any) => ({ label: p.title, url: `/${p.slug}`, type: "page" as const }))];
          });
        }
      }).catch(() => {})
    );
    promises.push(
      fetch("/api/posts").then(r => r.json()).then((data: any[]) => {
        if (Array.isArray(data)) {
          setUrlOptions(prev => {
            const filtered = prev.filter(o => o.type !== "post");
            return [...filtered, ...data.map((p: any) => ({ label: p.title, url: `/blog/${p.slug}`, type: "post" as const }))];
          });
        }
      }).catch(() => {})
    );
    promises.push(
      fetch("/api/products").then(r => r.json()).then((data: any[]) => {
        if (Array.isArray(data)) {
          setUrlOptions(prev => {
            const filtered = prev.filter(o => o.type !== "product");
            return [...filtered, ...data.map((p: any) => ({ label: p.title, url: `/products/${p.slug}`, type: "product" as const }))];
          });
        }
      }).catch(() => {})
    );
    promises.push(
      fetch("/api/categories").then(r => r.json()).then((data: any[]) => {
        if (Array.isArray(data)) {
          setUrlOptions(prev => {
            const filtered = prev.filter(o => o.type !== "category");
            return [...filtered, ...data.map((c: any) => ({ label: c.name, url: `/categories/${c.slug}`, type: "category" as const }))];
          });
        }
      }).catch(() => {})
    );
    Promise.all(promises).then(() => setUrlLoading(false));
  }

  // ── Local state updates (no auto-save) ──
  function persistMenu(next: MenuItem[]) {
    setItems(next);
    markDirty();
  }

  function persistStyle(style: "classic" | "mega") {
    setMenuStyle(style);
    markDirty();
  }

  function persistCustomNav(next: { id: string; label: string; url: string; enabled: boolean }[]) {
    setCustomNavItems(next);
    markDirty();
  }

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  function markDirty() { setUnsavedChanges(true); }

  const [saveMessage, setSaveMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function saveAll() {
    setSaving(true);
    setSaveMessage(null);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menu: JSON.stringify(items),
          menu_style: menuStyle,
          megaCustomNav: JSON.stringify(customNavItems),
        }),
      });
      setUnsavedChanges(false);
      setSaveMessage({ text: "✅ 保存成功", type: "success" });
      setTimeout(() => setSaveMessage(null), 2000);
    } catch {
      setSaveMessage({ text: "❌ 保存失败", type: "error" });
      setTimeout(() => setSaveMessage(null), 2000);
    }
    setSaving(false);
  }

  function addCustomNavItem() {
    const newItem = { id: uuid(), label: "", url: "/", enabled: true };
    persistCustomNav([...customNavItems, newItem]);
  }

  function updateCustomNavItem(id: string, field: "label" | "url" | "enabled", value: string | boolean) {
    const next = customNavItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    persistCustomNav(next);
  }

  function removeCustomNavItem(id: string) {
    if (!confirm("Delete this custom nav link?")) return;
    persistCustomNav(customNavItems.filter(item => item.id !== id));
  }

  function toggleCustomNavItem(id: string) {
    const next = customNavItems.map(item =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    persistCustomNav(next);
  }

  // ── Depth check ──
  function getItemDepth(list: MenuItem[], id: string, depth = 0): number {
    for (const item of list) {
      if (item.id === id) return depth;
      if (item.children) {
        const d = getItemDepth(item.children, id, depth + 1);
        if (d >= 0) return d;
      }
    }
    return -1;
  }

  // ── Tree helpers ──
  function getDepth(list: MenuItem[], id: string, depth = 0): number {
    for (const item of list) {
      if (item.id === id) return depth;
      if (item.children) {
        const d = getDepth(item.children, id, depth + 1);
        if (d >= 0) return d;
      }
    }
    return -1;
  }

  function removeById(list: MenuItem[], id: string): MenuItem[] {
    return list.filter(i => {
      if (i.id === id) return false;
      if (i.children) i.children = removeById(i.children, id);
      return true;
    });
  }

  function insertNear(list: MenuItem[], sourceId: string, targetId: string, position: "before" | "after" | "child"): MenuItem[] {
    const flat = flatten(list);
    const source = flat.find(i => i.id === sourceId);
    if (!source) return list;
    const sourceCopy = JSON.parse(JSON.stringify(source));
    let result = removeById(JSON.parse(JSON.stringify(list)), sourceId);
    if (position === "child") {
      const targetDepth = getDepth(result, targetId);
      if (targetDepth >= MAX_DEPTH - 1) return list;
      return addChildById(result, targetId, sourceCopy);
    }
    const resultFlat = flatten(result);
    const tgtIdx = resultFlat.findIndex(i => i.id === targetId);
    if (tgtIdx < 0) return list;
    const insertIdx = position === "before" ? tgtIdx : tgtIdx + 1;
    resultFlat.splice(insertIdx, 0, sourceCopy);
    return rebuildNested(resultFlat, result);
  }

  // ── CRUD ──
  function openNew(parentId?: string) {
    const newItem: MenuItem = { id: uuid(), title: "", url: "/", enabled: true, image: "" };
    setEditItem(newItem);
    setEditItemDepth(parentId ? 1 : 0);
    setShowModal(true);
    if (parentId) {
      const next = insertNear(JSON.parse(JSON.stringify(items)), newItem.id, parentId, "child");
      persistMenu(next);
    }
  }

  function openEdit(item: MenuItem) {
    const depth = getItemDepth(items, item.id);
    setEditItem({ ...item });
    setEditItemDepth(depth);
    setShowModal(true);
  }

  function saveItem() {
    if (!editItem || !editItem.title.trim()) return;
    const next = JSON.parse(JSON.stringify(items)) as MenuItem[];
    const cleanItem = { ...editItem };
    // Top-level items don't need image
    if (editItemDepth === 0) cleanItem.image = "";
    if (upsertItem(next, cleanItem)) { persistMenu(next); }
    else { persistMenu([...next, { ...cleanItem, children: [] }]); }
    setShowModal(false);
    setEditItem(null);
    setUrlPickerOpen(false);
  }

  function remove(itemId: string) {
    if (!confirm("Delete this menu item?")) return;
    const next = removeById(JSON.parse(JSON.stringify(items)), itemId);
    persistMenu(next);
  }

  function addSub(parentId: string) {
    const newItem: MenuItem = { id: uuid(), title: "", url: "/", enabled: true, image: "", children: [] };
    const next = addChildById(JSON.parse(JSON.stringify(items)), parentId, newItem);
    persistMenu(next);
    setEditItem({ ...newItem });
    setEditItemDepth(1);
    setShowModal(true);
    setExpandedIds(prev => { const s = new Set(prev); s.add(parentId); return s; });
  }

  function indent(itemId: string) {
    const item = findById(items, itemId);
    if (!item) return;
    const parent = findParent(items, itemId);
    if (!parent) return;
    const next = removeById(JSON.parse(JSON.stringify(items)), itemId);
    const grandparent = findParent(next, parent.id);
    const list = grandparent ? grandparent.children! : next;
    const parentIdx = list.findIndex(i => i.id === parent.id);
    if (parentIdx >= 0) list.splice(parentIdx + 1, 0, JSON.parse(JSON.stringify(item)));
    persistMenu(next);
  }

  function toggleEnabled(itemId: string) {
    const next = JSON.parse(JSON.stringify(items)) as MenuItem[];
    const item = findById(next, itemId);
    if (item) { item.enabled = !item.enabled; persistMenu(next); }
  }

  // ── Custom Links ──
  function addCustomLink() {
    if (!editItem) return;
    const newLink: CustomLink = { id: uuid(), label: "", url: "/", enabled: true };
    setEditItem({
      ...editItem,
      customLinks: [...(editItem.customLinks || []), newLink],
    });
  }

  function removeCustomLink(linkId: string) {
    if (!editItem) return;
    setEditItem({
      ...editItem,
      customLinks: (editItem.customLinks || []).filter(l => l.id !== linkId),
    });
  }

  function updateCustomLink(linkId: string, field: "label" | "url" | "enabled", value: string | boolean) {
    if (!editItem) return;
    setEditItem({
      ...editItem,
      customLinks: (editItem.customLinks || []).map(l =>
        l.id === linkId ? { ...l, [field]: value } : l
      ),
    });
  }

  // ── Select Image from Media ──
  function selectMedia(url: string) {
    if (editItem) setEditItem({ ...editItem, image: url });
    setShowMediaBrowser(false);
  }

  // ── Drag & Drop ──
  function handleDragStart(e: React.DragEvent, itemId: string) {
    dragRef.current = itemId;
    e.dataTransfer.setData("text/plain", itemId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!dragRef.current || dragRef.current === targetId) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const h = rect.height;
    const targetDepth = getDepth(items, targetId);
    let position: "before" | "child" | "after";
    if (y < h * 0.25) position = "before";
    else if (y < h * 0.65 && targetDepth < MAX_DEPTH - 1) position = "child";
    else position = "after";
    dropZoneRef.current = { targetId, position };
    (e.currentTarget as HTMLElement).style.outline = position === "child" ? "2px dashed #2563eb" : "2px solid #93c5fd";
    (e.currentTarget as HTMLElement).style.outlineOffset = position === "child" ? "2px" : "-2px";
  }

  function handleDragLeave(e: React.DragEvent) {
    (e.currentTarget as HTMLElement).style.outline = "";
    (e.currentTarget as HTMLElement).style.outlineOffset = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).style.outline = "";
    (e.currentTarget as HTMLElement).style.outlineOffset = "";
    const sourceId = dragRef.current;
    const zone = dropZoneRef.current;
    dragRef.current = null;
    dropZoneRef.current = null;
    if (!sourceId || !zone || sourceId === zone.targetId) return;
    const next = insertNear(JSON.parse(JSON.stringify(items)), sourceId, zone.targetId, zone.position);
    if (next) {
      persistMenu(next);
      if (zone.position === "child") {
        setExpandedIds(prev => { const s = new Set(prev); s.add(zone.targetId); return s; });
      }
    }
  }

  // ── URL Autocomplete ──
  function handleUrlChange(val: string) {
    setEditItem(prev => prev ? { ...prev, url: val } : prev);
    const shouldShow = val.startsWith("/") && val.length >= 2;
    setShowSuggestions(shouldShow);
    if (shouldShow && urlOptions.length === 0 && !urlLoading) loadUrlOptions();
  }

  function selectSuggestion(opt: UrlOption) {
    if (editItem) setEditItem({ ...editItem, url: opt.url, title: opt.label });
    setShowSuggestions(false);
    setUrlPickerOpen(false);
  }

  function toggleExpand(id: string) {
    setExpandedIds(prev => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  }

  // ── Render Tree ──
  function renderTree(list: MenuItem[], depth = 0): React.ReactNode {
    return list.map((item) => {
      const hasChildren = !!item.children && item.children.length > 0;
      const isExpanded = expandedIds.has(item.id);
      const depthBadge = ["", "Secondary", "Tertiary"][depth] || `L${depth + 1}`;
      const hasImage = !!item.image;
      return (
        <div key={item.id}>
          <div draggable onDragStart={(e) => handleDragStart(e, item.id)} onDragOver={(e) => handleDragOver(e, item.id)}
            onDragLeave={handleDragLeave} onDrop={handleDrop}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 12px",
              background: item.enabled ? "#fff" : "#f9fafb",
              border: `1px solid ${item.enabled ? "#e5e7eb" : "#f3f4f6"}`,
              borderRadius: 6, marginBottom: 4, marginLeft: depth * 28,
              cursor: "grab", position: "relative", opacity: item.enabled ? 1 : 0.55,
            }}>
            <input type="checkbox" checked={item.enabled}
              onChange={() => toggleEnabled(item.id)} title={item.enabled ? "Disable" : "Enable"}
              onClick={e => e.stopPropagation()}
              style={{ cursor: "pointer", width: 15, height: 15, accentColor: "#2563eb" }} />
            {hasChildren ? (
              <button type="button" onClick={() => toggleExpand(item.id)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#94a3b8", padding: 0, lineHeight: 1 }}>
                {isExpanded ? "▼" : "▶"}
              </button>
            ) : <span style={{ width: 14 }} />}
            <span style={{ color: "#94a3b8", fontSize: 14, cursor: "grab", lineHeight: 1 }}>⠿</span>
            {hasImage && depth > 0 && <span style={{ fontSize: 12 }}>🖼️</span>}
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.title || <span style={{ color: "#d1d5db", fontStyle: "italic" }}>(no title)</span>}
            </span>
            <span style={{ fontSize: 10, color: "#94a3b8", background: "#f3f4f6", padding: "1px 6px", borderRadius: 3 }}>{depthBadge}</span>
            <span style={{ fontSize: 11, color: "#94a3b8", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.url}</span>
            <button type="button" onClick={() => openEdit(item)} style={{ padding: "2px 8px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", fontSize: 11, cursor: "pointer" }}>✏️</button>
            {depth < MAX_DEPTH - 1 && <button type="button" onClick={() => addSub(item.id)} style={{ padding: "2px 6px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", fontSize: 11, cursor: "pointer" }}>+Sub</button>}
            {depth > 0 && <button type="button" onClick={() => indent(item.id)} title="Move left" style={{ padding: "2px 6px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", fontSize: 11, cursor: "pointer" }}>◀</button>}
            <button type="button" onClick={() => remove(item.id)} style={{ padding: "2px 6px", border: "1px solid #fca5a5", borderRadius: 4, background: "#fff", color: "#dc2626", fontSize: 11, cursor: "pointer" }}>🗑️</button>
          </div>
          {hasChildren && isExpanded && renderTree(item.children!, depth + 1)}
          {hasChildren && !isExpanded && (
            <div style={{ marginLeft: (depth + 1) * 28 + 14, fontSize: 11, color: "#94a3b8", padding: "2px 0 6px" }}>
              {item.children!.length} sub-item{item.children!.length > 1 ? "s" : ""}
            </div>
          )}
        </div>
      );
    });
  }

  // ── Mega Preview ──
  function renderMegaPreview(): React.ReactNode {
    const enabledTop = items.filter(i => i.enabled !== false);
    if (enabledTop.length === 0) {
      return <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 13 }}>No enabled menu items.</div>;
    }
    return (
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
        <div style={{ display: "flex", gap: 0, padding: "0 24px", borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
          {enabledTop.map(nav => (
            <div key={nav.id} style={{ padding: "14px 20px", fontSize: 13, fontWeight: 500, color: "#111", letterSpacing: "0.3px", cursor: "default" }}>
              {nav.title}
            </div>
          ))}
        </div>
        {(() => {
          const navWithChildren = enabledTop.find(n => n.children && n.children.length > 0);
          if (!navWithChildren) return <div style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>Hover a nav item with sub-items to expand the mega panel.</div>;
          const cols = navWithChildren.children!.filter(c => c.enabled !== false);
          const hasCustom = navWithChildren.customLinks && navWithChildren.customLinks.some(l => l.enabled);
          const enabledCustomNav = customNavItems.filter(l => l.enabled && l.label.trim());
          return (
            <div style={{ padding: "28px 32px", display: "flex", gap: 32, background: "#fafafa" }}>
              {cols.map(child => (
                <div key={child.id} style={{ flex: 1, minWidth: 160, textAlign: "center" }}>
                  <div style={{
                    width: "100%", aspectRatio: "1.6", background: "#f0f0f0", borderRadius: 6, marginBottom: 10,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#ccc",
                    border: "1px solid #e5e7eb",
                  }}>
                    {child.image ? <img src={child.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} /> : "🖼️"}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 6 }}>{child.title}</div>
                  <a style={{ fontSize: 12, color: "#2563eb", textDecoration: "underline", cursor: "pointer" }}>{child.url}</a>
                </div>
              ))}
              {hasCustom && (
                <div key="custom-links" style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Custom</div>
                  {navWithChildren.customLinks!.filter(l => l.enabled).map(link => (
                    <a key={link.id} style={{ display: "block", fontSize: 13, color: "#374151", textDecoration: "none", padding: "4px 0" }}>
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
              {enabledCustomNav.length > 0 && (
                <div key="custom-nav-column" style={{
                  flex: 1, minWidth: 160, paddingLeft: 28, marginLeft: 4,
                  borderLeft: "1px solid #d1d5db",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Quick Links</div>
                  {enabledCustomNav.map(navItem => (
                    <a key={navItem.id} style={{ display: "block", fontSize: 13, color: "#374151", textDecoration: "none", padding: "4px 0" }}>
                      {navItem.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    );
  }

  // ════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <style>{`
        @keyframes saveFlash {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>📋 Menu Manager</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {unsavedChanges && <span style={{ fontSize: 12, color: "#f59e0b" }}>⚠️ Unsaved changes</span>}
          <button onClick={saveAll} disabled={!unsavedChanges || saving}
            style={{
              padding: "8px 20px",
              background: unsavedChanges ? "#2563eb" : "#d1d5db",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: unsavedChanges ? "pointer" : "default",
            }}>
            {saving ? "⏳ Saving..." : "💾 Save All Settings"}
          </button>
          {saveMessage && (
            <span style={{
              fontSize: 13,
              fontWeight: 500,
              color: saveMessage.type === "success" ? "#16a34a" : "#dc2626",
              animation: "saveFlash 0.3s ease",
              whiteSpace: "nowrap",
            }}>
              {saveMessage.text}
            </span>
          )}
        </div>
      </div>

      {/* ── Style Toggle ── */}
      <div style={{
        marginBottom: 24,
        background: "#fff",
        borderRadius: 8,
        padding: "16px 20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 20,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Menu Style:</span>
        <div style={{ display: "flex", gap: 0, border: "1px solid #d1d5db", borderRadius: 6, overflow: "hidden" }}>
          <button onClick={() => persistStyle("classic")}
            style={{
              padding: "8px 20px",
              border: "none",
              background: menuStyle === "classic" ? "#2563eb" : "#fff",
              color: menuStyle === "classic" ? "#fff" : "#374151",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}>
            Classic Navigation
          </button>
          <button onClick={() => persistStyle("mega")}
            style={{
              padding: "8px 20px",
              border: "none",
              borderLeft: "1px solid #d1d5db",
              background: menuStyle === "mega" ? "#2563eb" : "#fff",
              color: menuStyle === "mega" ? "#fff" : "#374151",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}>
            Mega Menu (Full Canvas)
          </button>
        </div>
      </div>

      {/* ── Menu Tree Editor ── */}
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
        Drag ⠿ to reorder or nest. ☑ checkbox to enable/disable. {menuStyle === "mega" && <span style={{ color: "#2563eb" }}>Level 2 items become columns with image + link in mega menu.</span>}
      </p>

      {items.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 8, padding: 40, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <p style={{ color: "#6b7280", marginBottom: 8 }}>No menu items yet</p>
          <button onClick={() => openNew()} style={{ padding: "8px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>+ Add First Item</button>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#94a3b8", padding: "0 12px" }}>
              <span>Level 1 (Nav Item)</span><span>Level 2 (Column)</span>
            </div>
            <button type="button" onClick={() => openNew()} style={{ padding: "6px 14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>+ Add Item</button>
          </div>
          {renderTree(items)}
        </div>
      )}

      {/* ── Custom Navigation ── */}
      {menuStyle === "mega" && (
        <div style={{ background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>📋 Custom Navigation</h3>
            <button type="button" onClick={addCustomNavItem}
              style={{ padding: "6px 14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>+ Add Link</button>
          </div>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
            Enabled items appear as the rightmost column in the mega menu, separated by a vertical divider.
          </p>
          {customNavItems.length === 0 ? (
            <div style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: 24, border: "1px dashed #d1d5db", borderRadius: 6 }}>
              No custom navigation links yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {customNavItems.map((item, idx) => (
                <div key={item.id} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 6,
                  background: item.enabled ? "#fff" : "#f9fafb",
                  opacity: item.enabled ? 1 : 0.55,
                }}>
                  <span style={{ fontSize: 12, color: "#94a3b8", minWidth: 20 }}>{idx + 1}.</span>
                  <input type="checkbox" checked={item.enabled}
                    onChange={() => toggleCustomNavItem(item.id)}
                    style={{ width: 14, height: 14, accentColor: "#2563eb", cursor: "pointer" }} />
                  <input type="text" value={item.label} placeholder="Label"
                    onChange={e => updateCustomNavItem(item.id, "label", e.target.value)}
                    style={{ flex: 1, padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 12 }} />
                  <input type="text" value={item.url} placeholder="/url"
                    onChange={e => updateCustomNavItem(item.id, "url", e.target.value)}
                    style={{ width: 160, padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 12 }} />
                  <button type="button" onClick={() => removeCustomNavItem(item.id)}
                    style={{ padding: "2px 6px", border: "1px solid #fca5a5", borderRadius: 4, background: "#fff", color: "#dc2626", fontSize: 11, cursor: "pointer" }}>🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Mega Preview ── */}
      {menuStyle === "mega" && (
        <div style={{ background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600 }}>Mega Menu Preview</h3>
          <div style={{ background: "#f9fafb", borderRadius: 6, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            {renderMegaPreview()}
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showModal && editItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => { setShowModal(false); setUrlPickerOpen(false); setShowMediaBrowser(false); }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 640, maxWidth: "95vw", maxHeight: "90vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>
              {items.some(i => i.id === editItem.id) ? "Edit Menu Item" : "Add Menu Item"}
            </h3>

            {/* Title */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 4 }}>Title</label>
              <input type="text" value={editItem.title} onChange={e => setEditItem({ ...editItem, title: e.target.value })}
                placeholder="Menu label" autoFocus
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }} />
            </div>

            {/* Enabled */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={editItem.enabled} onChange={e => setEditItem({ ...editItem, enabled: e.target.checked })}
                  style={{ width: 15, height: 15, accentColor: "#2563eb", cursor: "pointer" }} />
                <label style={{ fontSize: 13, color: "#374151", cursor: "pointer" }}>Enabled</label>
              </div>
            </div>

            {/* URL */}
            <div style={{ marginBottom: 12, position: "relative" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 4 }}>URL</label>
              <div style={{ display: "flex", gap: 6 }}>
                <input ref={urlInputRef} type="text" value={editItem.url} onChange={e => handleUrlChange(e.target.value)}
                  onFocus={() => editItem.url.startsWith("/") && editItem.url.length >= 2 && setShowSuggestions(true)}
                  placeholder="/page-slug" style={{ flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }} />
                <button type="button" onClick={() => setUrlPickerOpen(!urlPickerOpen)}
                  style={{ padding: "8px 14px", border: "1px solid #2563eb", borderRadius: 6, background: urlPickerOpen ? "#eff6ff" : "#fff", color: "#2563eb", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
                  {urlPickerOpen ? "▲ Browse" : "📂 Browse"}
                </button>
              </div>
              {showSuggestions && urlOptions.filter(o => o.url.includes(editItem.url)).length > 0 && (
                <div ref={suggestRef} style={{ position: "absolute", top: "100%", left: 0, right: 60, zIndex: 101, background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, boxShadow: "0 8px 20px rgba(0,0,0,0.12)", maxHeight: 220, overflowY: "auto", marginTop: 2 }}>
                  {urlOptions.filter(o => o.url.includes(editItem.url)).slice(0, 20).map((opt, i) => (
                    <button key={i} type="button" onClick={() => selectSuggestion(opt)}
                      style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 12px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontSize: 13 }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#374151" }}>{opt.label}</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{opt.url}</span>
                    </button>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Type / to search URLs.</div>
            </div>

            {/* Image Upload - only for sub-items (Level 2+) */}
            {editItemDepth >= 1 && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                  Image <span style={{ fontWeight: 400, color: "#94a3b8" }}>(for mega menu column)</span>
                </label>
                {editItem.image && (
                  <div style={{ marginBottom: 8, position: "relative", display: "inline-block" }}>
                    <img src={editItem.image} alt="" style={{ maxWidth: 200, maxHeight: 120, borderRadius: 6, border: "1px solid #e5e7eb", objectFit: "cover" }} />
                    <button onClick={() => setEditItem({ ...editItem, image: "" })}
                      style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", border: "1px solid #fca5a5", background: "#fff", color: "#dc2626", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>✕</button>
                  </div>
                )}
                <div style={{ display: "flex", gap: 6 }}>
                  <input type="text" value={editItem.image || ""} onChange={e => setEditItem({ ...editItem, image: e.target.value })}
                    placeholder="Image URL" style={{ flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }} />
                  <button type="button" onClick={() => setShowMediaBrowser(true)}
                    style={{ padding: "8px 14px", border: "1px solid #2563eb", borderRadius: 6, background: "#fff", color: "#2563eb", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
                    📁 Media
                  </button>
                </div>
              </div>
            )}

            {editItemDepth === 0 && (
              <div style={{ marginBottom: 16, fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>
                Image upload is available for sub-items (Level 2+) used as mega menu columns.
              </div>
            )}

            {/* Custom Links - only for Level 1 in mega style */}
            {editItemDepth === 0 && menuStyle === "mega" && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                    Custom Links <span style={{ fontWeight: 400, color: "#94a3b8" }}>(extra mega menu column)</span>
                  </label>
                  <button type="button" onClick={addCustomLink}
                    style={{ padding: "4px 12px", border: "1px solid #2563eb", borderRadius: 4, background: "#fff", color: "#2563eb", fontSize: 12, cursor: "pointer" }}>+ Add Link</button>
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>
                  This column appears alongside child-item columns in the mega menu dropdown.
                </div>
                {(editItem.customLinks || []).length === 0 ? (
                  <div style={{ fontSize: 12, color: "#d1d5db", textAlign: "center", padding: 12, border: "1px dashed #e5e7eb", borderRadius: 6 }}>
                    No custom links yet. Click &quot;+ Add Link&quot; to add one.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {(editItem.customLinks || []).map(link => (
                      <div key={link.id} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 6,
                        background: link.enabled ? "#fff" : "#f9fafb", opacity: link.enabled ? 1 : 0.55,
                      }}>
                        <input type="checkbox" checked={link.enabled}
                          onChange={e => updateCustomLink(link.id, "enabled", e.target.checked)}
                          style={{ width: 14, height: 14, accentColor: "#2563eb", cursor: "pointer" }} />
                        <input type="text" value={link.label} placeholder="Label"
                          onChange={e => updateCustomLink(link.id, "label", e.target.value)}
                          style={{ flex: 1, padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 12, minWidth: 0 }} />
                        <input type="text" value={link.url} placeholder="/url"
                          onChange={e => updateCustomLink(link.id, "url", e.target.value)}
                          style={{ width: 120, padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 12 }} />
                        <button type="button" onClick={() => removeCustomLink(link.id)}
                          style={{ padding: "2px 6px", border: "1px solid #fca5a5", borderRadius: 4, background: "#fff", color: "#dc2626", fontSize: 11, cursor: "pointer" }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* URL Picker */}
            {urlPickerOpen && (
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 16, overflow: "hidden" }}>
                <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
                  {(["pages", "posts", "products", "categories"] as const).map(tab => (
                    <button key={tab} type="button" onClick={() => setUrlTab(tab)}
                      style={{ flex: 1, padding: "10px 8px", border: "none", background: urlTab === tab ? "#fff" : "transparent", color: urlTab === tab ? "#2563eb" : "#6b7280", fontWeight: urlTab === tab ? 600 : 400, fontSize: 13, cursor: "pointer", borderBottom: urlTab === tab ? "2px solid #2563eb" : "2px solid transparent" }}>
                      {tab === "pages" ? "📄 Pages" : tab === "posts" ? "✏️ Posts" : tab === "products" ? "📦 Products" : "🏷️ Categories"}
                    </button>
                  ))}
                </div>
                <div style={{ padding: "8px" }}>
                  <input type="text" value={urlSearch} onChange={e => setUrlSearch(e.target.value)}
                    placeholder={`Search ${urlTab}...`}
                    style={{ width: "100%", padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13, boxSizing: "border-box" }} />
                </div>
                <div style={{ maxHeight: 200, overflowY: "auto", padding: "0 8px 8px" }}>
                  {urlLoading ? (
                    <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: 20 }}>Loading...</p>
                  ) : (
                    <>
                      {urlOptions.filter(o => typeMatch(o.type, urlTab)).length === 0 && (
                        <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: 20 }}>No {urlTab} found.</p>
                      )}
                      {urlOptions.filter(o => typeMatch(o.type, urlTab) && (o.label.toLowerCase().includes(urlSearch.toLowerCase()) || o.url.includes(urlSearch))).map((opt, i) => (
                        <button key={i} type="button" onClick={() => { setEditItem({ ...editItem, url: opt.url }); setUrlPickerOpen(false); }}
                          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 10px", border: "none", borderRadius: 4, background: editItem.url === opt.url ? "#eff6ff" : "transparent", cursor: "pointer", textAlign: "left", fontSize: 13 }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                          onMouseLeave={e => { if (editItem.url !== opt.url) e.currentTarget.style.background = "transparent"; }}>
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#374151" }}>{opt.label}</span>
                          <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>{opt.url}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => { setShowModal(false); setUrlPickerOpen(false); setShowMediaBrowser(false); }}
                style={{ padding: "8px 20px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", fontSize: 14, cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={saveItem}
                style={{ padding: "8px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer", fontWeight: 600 }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Media Browser ── */}
      {showMediaBrowser && (
        <MediaBrowser onSelect={selectMedia} onClose={() => setShowMediaBrowser(false)} />
      )}
    </div>
    </>
  );
}

// ── Tree helpers ──

function flatten(list: MenuItem[]): MenuItem[] {
  const result: MenuItem[] = [];
  for (const item of list) { result.push(item); if (item.children) result.push(...flatten(item.children)); }
  return result;
}

function rebuildNested(flat: MenuItem[], original: MenuItem[]): MenuItem[] {
  const parentMap = new Map<string, string>();
  const findParents = (list: MenuItem[], parentId?: string) => {
    for (const item of list) { if (parentId) parentMap.set(item.id, parentId); if (item.children) findParents(item.children, item.id); }
  };
  findParents(JSON.parse(JSON.stringify(original)));
  const childrenOf = new Map<string, MenuItem[]>();
  const roots: MenuItem[] = [];
  for (const item of flat) {
    const pid = parentMap.get(item.id);
    if (pid && childrenOf.has(pid)) { const arr = childrenOf.get(pid)!; if (!arr.find(i => i.id === item.id)) arr.push(item); }
    else if (pid) { childrenOf.set(pid, [item]); }
    else { if (!roots.find(i => i.id === item.id)) roots.push(item); }
  }
  const assign = (list: MenuItem[]) => { for (const item of list) { const cl = childrenOf.get(item.id); if (cl && cl.length > 0) { item.children = cl; assign(cl); } else { item.children = undefined; } } };
  assign(roots);
  return roots;
}

function upsertItem(list: MenuItem[], item: MenuItem): boolean {
  const idx = list.findIndex(i => i.id === item.id);
  if (idx >= 0) { list[idx] = { ...item }; return true; }
  for (const i of list) { if (i.children && upsertItem(i.children, item)) return true; }
  return false;
}

function findById(list: MenuItem[], id: string): MenuItem | undefined {
  for (const item of list) { if (item.id === id) return item; if (item.children) { const found = findById(item.children, id); if (found) return found; } }
  return undefined;
}

function findParent(list: MenuItem[], id: string): MenuItem | undefined {
  for (const item of list) { if (item.children) { if (item.children.some(c => c.id === id)) return item; const found = findParent(item.children, id); if (found) return found; } }
  return undefined;
}

function addChildById(list: MenuItem[], parentId: string, child: MenuItem): MenuItem[] {
  const result = JSON.parse(JSON.stringify(list));
  function walk(arr: MenuItem[]): boolean { for (const item of arr) { if (item.id === parentId) { if (!item.children) item.children = []; if (!item.children.find(c => c.id === child.id)) item.children.push(child); return true; } if (item.children && walk(item.children)) return true; } return false; }
  walk(result);
  return result;
}
