"use client";

import { useEffect, useState, useRef } from "react";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Props {
  selected: { name: string; slug: string }[];
  onChange: (categories: { name: string; slug: string }[]) => void;
  locale?: string;
}

export default function CategorySelect({ selected, onChange, locale = "en" }: Props) {
  const [allCats, setAllCats] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/categories${locale ? `?locale=${locale}` : ""}`)
      .then(r => r.json())
      .then((data: Category[]) => {
        setAllCats(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [locale]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = allCats.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const isSelected = (slug: string) => selected.some(s => s.slug === slug);

  function toggleCat(cat: Category) {
    if (isSelected(cat.slug)) {
      onChange(selected.filter(s => s.slug !== cat.slug));
    } else {
      onChange([...selected, { name: cat.name, slug: cat.slug }]);
    }
  }

  function removeCat(slug: string) {
    onChange(selected.filter(s => s.slug !== slug));
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6,
    fontSize: 14, boxSizing: "border-box",
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "#374151" }}>
        Categories
      </label>

      {/* Selected tags */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
        {selected.map(cat => (
          <span key={cat.slug} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe",
            padding: "2px 8px", borderRadius: 4, fontSize: 12,
          }}>
            {cat.name}
            <button type="button" onClick={() => removeCat(cat.slug)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#2563eb", fontSize: 14, padding: 0, lineHeight: 1 }}>
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Search input */}
      <input
        type="text"
        value={search}
        onChange={e => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={loading ? "Loading categories..." : "Search categories..."}
        style={inputStyle}
      />

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: "#fff", border: "1px solid #d1d5db", borderRadius: 6,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxHeight: 240, overflow: "auto",
          marginTop: 4,
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "12px 16px", color: "#9ca3af", fontSize: 13 }}>
              {search ? "No matching categories" : loading ? "Loading..." : "No categories yet. Create one first."}
            </div>
          ) : (
            filtered.map(cat => (
              <div
                key={cat.id}
                onClick={() => toggleCat(cat)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 16px", cursor: "pointer", fontSize: 13,
                  background: isSelected(cat.slug) ? "#eff6ff" : "transparent",
                  borderBottom: "1px solid #f3f4f6",
                }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = isSelected(cat.slug) ? "#dbeafe" : "#f9fafb"; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = isSelected(cat.slug) ? "#eff6ff" : "transparent"; }}
              >
                <input type="checkbox" checked={isSelected(cat.slug)} readOnly
                  style={{ accentColor: "#2563eb" }} />
                <span style={{ fontWeight: isSelected(cat.slug) ? 600 : 400 }}>{cat.name}</span>
                <span style={{ color: "#9ca3af", fontSize: 11, marginLeft: "auto" }}>{cat.slug}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
