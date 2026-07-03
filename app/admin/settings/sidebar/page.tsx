"use client";

import { useEffect, useState } from "react";
import { SaveButton } from "@/components/admin/SettingsShared";

const defaultLinks = [
  { id: "1", label: "所有产品", url: "/products", icon: "📦" },
  { id: "2", label: "方形铁盒", url: "/tins-category/rectangle-tin-box", icon: "📦" },
  { id: "3", label: "圆形铁盒", url: "/tins-category/round-tin-can", icon: "📦" },
  { id: "4", label: "铁盒配件", url: "/tin-accessories", icon: "🔧" },
  { id: "5", label: "定制服务", url: "/custom-tins", icon: "🎨" },
  { id: "6", label: "关于我们", url: "/about-us", icon: "ℹ️" },
  { id: "7", label: "联系我们", url: "/contact", icon: "✉️" },
  { id: "8", label: "包装博客", url: "/packaging-blog", icon: "📝" },
];

export default function SidebarSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState(defaultLinks);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => {
      if (data.sidebar_links) {
        try {
          const parsed = JSON.parse(data.sidebar_links);
          if (Array.isArray(parsed) && parsed.length > 0) setItems(parsed);
        } catch {}
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sidebar_links: JSON.stringify(items) }),
    });
    setSaving(false);
  };

  const addItem = () => setItems([...items, { id: String(Date.now()), label: "新链接", url: "/", icon: "🔗" }]);
  const updateItem = (id: string, field: string, val: string) =>
    setItems(items.map(item => item.id === id ? { ...item, [field]: val } : item));
  const removeItem = (id: string) => setItems(items.filter(item => item.id !== id));
  const moveItem = (index: number, dir: number) => {
    const ni = index + dir;
    if (ni < 0 || ni >= items.length) return;
    const arr = [...items]; [arr[index], arr[ni]] = [arr[ni], arr[index]]; setItems(arr);
  };
  const resetToDefault = () => setItems(defaultLinks);

  const inputSt: React.CSSProperties = { padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13, boxSizing: "border-box" };
  const rowSt: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #f0f0f0" };

  if (loading) return <p style={{ color: "#6b7280" }}>Loading...</p>;

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "#374151" }}>侧边栏导航链接</h2>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>在 minimal / full-width 模板中显示</p>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={addItem} style={{ padding: "6px 14px", background: "#059669", color: "#fff", border: "none", borderRadius: 4, fontSize: 13, cursor: "pointer" }}>+ 添加链接</button>
        <button onClick={resetToDefault} style={{ padding: "6px 14px", background: "#fff", color: "#6b7280", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13, cursor: "pointer" }}>恢复默认</button>
      </div>

      {items.map((item, i) => (
        <div key={item.id} style={rowSt}>
          <span style={{ fontSize: 18, width: 24, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
          <input style={{ ...inputSt, width: 40 }} value={item.icon} onChange={e => updateItem(item.id, "icon", e.target.value)} title="Emoji 图标" />
          <input style={{ ...inputSt, flex: 1, minWidth: 80 }} value={item.label} onChange={e => updateItem(item.id, "label", e.target.value)} placeholder="名称" />
          <input style={{ ...inputSt, flex: 1, minWidth: 80 }} value={item.url} onChange={e => updateItem(item.id, "url", e.target.value)} placeholder="/路径" />
          <div style={{ flexShrink: 0, display: "flex", gap: 2 }}>
            <button onClick={() => moveItem(i, -1)} disabled={i === 0} style={{ padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: i === 0 ? "not-allowed" : "pointer", fontSize: 12, opacity: i === 0 ? 0.4 : 1 }}>↑</button>
            <button onClick={() => moveItem(i, 1)} disabled={i === items.length - 1} style={{ padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: i === items.length - 1 ? "not-allowed" : "pointer", fontSize: 12, opacity: i === items.length - 1 ? 0.4 : 1 }}>↓</button>
            <button onClick={() => removeItem(item.id)} style={{ padding: "4px 8px", border: "1px solid #ef4444", borderRadius: 4, background: "#fff", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>✕</button>
          </div>
        </div>
      ))}
      <SaveButton saving={saving} onClick={save} />
    </div>
  );
}
