"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import OptimizedImage from "@/components/OptimizedImage";

interface MediaItem {
  id: number;
  filename: string;
  url: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  alt: string;
  category: string;
  webpUrl?: string | null;
  mediumUrl?: string | null;
  thumbUrl?: string | null;
  deletedAt: string | null;
  createdAt: string;
}

type ViewMode = "active" | "trash";
type MediaView = "original" | "webp";
type CategoryFilter = "" | "image" | "document";

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [view, setView] = useState<ViewMode>("active");
  const [mediaView, setMediaView] = useState<MediaView>("original");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("");
  const [monthFilter, setMonthFilter] = useState("");
  const [months, setMonths] = useState<string[]>([]);
  const [uploadCategory, setUploadCategory] = useState<"image" | "document">("image");
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMedia = useCallback(async () => {
    const params = new URLSearchParams();
    if (view === "trash") params.set("trash", "1");
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category", categoryFilter);
    if (monthFilter) params.set("month", monthFilter);

    const res = await fetch(`/api/media?${params.toString()}`);
    const data = await res.json();
    setMedia(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [view, search, categoryFilter, monthFilter]);

  const loadMonths = useCallback(async () => {
    try {
      const res = await fetch("/api/media/months");
      const data = await res.json();
      if (Array.isArray(data)) setMonths(data);
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    loadMedia();
    if (view === "active") loadMonths();
  }, [loadMedia, loadMonths, view]);

  useEffect(() => {
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, []);

  // ── Search ──
  function handleSearchChange(val: string) {
    setSearch(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => loadMedia(), 600);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      loadMedia();
    }
  }

  function handleSearchBlur() {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    loadMedia();
  }

  // ── Selection ──
  function handleItemClick(id: number) {
    if (selectMode) {
      setSelectedItems(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  }

  function toggleSelectMode() {
    setSelectMode(!selectMode);
    setSelectedItems(new Set());
  }

  async function deleteSelected() {
    const count = selectedItems.size;
    if (count === 0) return;
    const msg = view === "trash"
      ? `Permanently delete ${count} file${count > 1 ? "s" : ""}?`
      : `Move ${count} file${count > 1 ? "s" : ""} to trash?`;
    if (!confirm(msg)) return;
    for (const id of selectedItems) {
      await fetch(`/api/media/${id}`, { method: "DELETE" });
    }
    setSelectedItems(new Set());
    loadMedia();
  }

  // ── Upload ──
  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", uploadCategory);

    const res = await fetch("/api/media", { method: "POST", body: formData });
    if (res.ok) {
      setShowUploadModal(false);
      loadMedia();
      loadMonths();
      if (fileRef.current) fileRef.current.value = "";
    }
    setUploading(false);
  }

  async function deleteMedia(id: number) {
    if (view === "trash") {
      if (!confirm("Permanently delete this file?")) return;
    } else {
      if (!confirm("Move this file to trash?")) return;
    }
    await fetch(`/api/media/${id}`, { method: "DELETE" });
    loadMedia();
  }

  async function restoreMedia(id: number) {
    await fetch(`/api/media/${id}/restore`, { method: "POST" });
    loadMedia();
  }

  async function emptyTrash() {
    if (!confirm("Empty trash? This permanently deletes ALL trashed files.")) return;
    await fetch("/api/media/trash", { method: "DELETE" });
    loadMedia();
  }

  function getMonthLabel(m: string): string {
    const [y, mo] = m.split("-");
    const date = new Date(Number(y), Number(mo) - 1, 1);
    return `${date.toLocaleDateString("en-US", { year: "numeric", month: "long" })}`;
  }

  function groupByMonth(items: MediaItem[]): Map<string, MediaItem[]> {
    const groups = new Map<string, MediaItem[]>();
    for (const item of items) {
      const d = new Date(item.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return groups;
  }

  function formatSize(bytes: number) {
    if (!bytes) return "-";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(window.location.origin + url);
  }

  function fileIcon(mimeType: string): string {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("xlsx") || mimeType.includes("xls")) return "📊";
    if (mimeType.includes("word") || mimeType.includes("document") || mimeType.includes("docx") || mimeType.includes("doc")) return "📝";
    return "📎";
  }

  function fileTypeLabel(mimeType: string): string {
    if (mimeType.startsWith("image/")) return mimeType.split("/")[1].toUpperCase();
    if (mimeType.includes("pdf")) return "PDF";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("xlsx") || mimeType.includes("xls")) return "Excel";
    if (mimeType.includes("word") || mimeType.includes("document") || mimeType.includes("docx") || mimeType.includes("doc")) return "Word";
    return "File";
  }

  function getDisplayUrl(item: MediaItem): string {
    if (mediaView === "webp" && item.webpUrl) return item.webpUrl;
    return item.url;
  }

  if (loading) return <p>Loading media...</p>;

  const groups = view === "active" ? groupByMonth(media) : new Map([["trash", media]]);

  const btnBase: React.CSSProperties = {
    padding: "6px 14px", border: "1px solid #d1d5db", borderRadius: 6,
    background: "#fff", fontSize: 13, cursor: "pointer",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Media Library ({media.length})</h1>
          {view === "active" && (
            <button onClick={toggleSelectMode} style={{
              ...btnBase,
              background: selectMode ? "#ef4444" : "#fff",
              color: selectMode ? "#fff" : "#374151",
              borderColor: selectMode ? "#ef4444" : "#d1d5db",
            }}>
              {selectMode ? "✕ Cancel" : "Select Multiple"}
            </button>
          )}
          {selectMode && (
            <button onClick={deleteSelected} disabled={selectedItems.size === 0}
              style={{
                padding: "6px 14px", borderRadius: 6, fontSize: 13,
                cursor: selectedItems.size > 0 ? "pointer" : "default",
                border: selectedItems.size > 0 ? "1px solid #dc2626" : "1px solid #d1d5db",
                background: selectedItems.size > 0 ? "#dc2626" : "#f3f4f6",
                color: selectedItems.size > 0 ? "#fff" : "#9ca3af",
              }}>
              🗑️ Delete ({selectedItems.size})
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {view === "trash" && media.length > 0 && (
            <button onClick={emptyTrash} style={{ ...btnBase, color: "#dc2626", borderColor: "#fca5a5" }}>
              🗑️ Empty Trash
            </button>
          )}
          {!selectMode && (
            <button onClick={() => setShowUploadModal(true)}
              style={{ padding: "10px 20px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer", fontWeight: 600 }}>
              ↑ Upload
            </button>
          )}
        </div>
      </div>

      {/* Tabs: Original / WebP */}
      <div style={{ display: "flex", gap: 0, marginBottom: 12, borderBottom: "2px solid #e5e7eb" }}>
        <button onClick={() => { setMediaView("original"); setSelectedItems(new Set()); setSelectMode(false); }}
          style={{
            padding: "8px 20px", border: "none", background: "transparent",
            fontSize: 14, fontWeight: mediaView === "original" ? 600 : 400,
            color: mediaView === "original" ? "#2563eb" : "#6b7280",
            cursor: "pointer",
            borderBottom: mediaView === "original" ? "2px solid #2563eb" : "2px solid transparent",
            marginBottom: -2,
          }}>📷 Original</button>
        <button onClick={() => { setMediaView("webp"); setSelectedItems(new Set()); setSelectMode(false); }}
          style={{
            padding: "8px 20px", border: "none", background: "transparent",
            fontSize: 14, fontWeight: mediaView === "webp" ? 600 : 400,
            color: mediaView === "webp" ? "#16a34a" : "#6b7280",
            cursor: "pointer",
            borderBottom: mediaView === "webp" ? "2px solid #16a34a" : "2px solid transparent",
            marginBottom: -2,
          }}>🌐 WebP</button>
      </div>

      {/* Tabs: Active / Trash */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "2px solid #e5e7eb" }}>
        <button onClick={() => { setView("active"); setSelectedItems(new Set()); setSelectMode(false); }}
          style={{
            padding: "8px 20px", border: "none", background: "transparent",
            fontSize: 14, fontWeight: view === "active" ? 600 : 400,
            color: view === "active" ? "#2563eb" : "#6b7280",
            cursor: "pointer",
            borderBottom: view === "active" ? "2px solid #2563eb" : "2px solid transparent",
            marginBottom: -2,
          }}>All Files</button>
        <button onClick={() => { setView("trash"); setSelectedItems(new Set()); setSelectMode(false); }}
          style={{
            padding: "8px 20px", border: "none", background: "transparent",
            fontSize: 14, fontWeight: view === "trash" ? 600 : 400,
            color: view === "trash" ? "#dc2626" : "#6b7280",
            cursor: "pointer",
            borderBottom: view === "trash" ? "2px solid #dc2626" : "2px solid transparent",
            marginBottom: -2,
          }}>🗑️ Trash</button>
      </div>

      {/* Filters */}
      {view === "active" && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <input type="text" placeholder={`Search by filename...`}
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={handleSearchBlur}
            style={{
              flex: 1, minWidth: 200, padding: "7px 12px", border: "1px solid #d1d5db",
              borderRadius: 6, fontSize: 13, outline: "none",
            }} />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as CategoryFilter)}
            style={{ padding: "7px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, background: "#fff" }}>
            <option value="">All Types</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
          </select>
          <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
            style={{ padding: "7px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, background: "#fff" }}>
            <option value="">All Dates</option>
            {months.map(m => (
              <option key={m} value={m}>{getMonthLabel(m)}</option>
            ))}
          </select>
        </div>
      )}

      {view === "active" && mediaView === "webp" && media.length > 0 && (
        <div style={{ fontSize: 12, color: "#16a34a", marginBottom: 12, padding: "8px 12px", background: "#f0fdf4", borderRadius: 6 }}>
          Showing WebP versions. Use <strong>Copy WebP URL</strong> to get the optimized image link.
          {media.filter(m => !m.webpUrl).length > 0 && (
            <span> {media.filter(m => !m.webpUrl).length} item(s) without WebP (documents or pending conversion).</span>
          )}
        </div>
      )}

      {/* Bulk actions bar - trash */}
      {selectedItems.size > 0 && view === "trash" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "8px 12px", background: "#fef2f2", borderRadius: 6, fontSize: 13 }}>
          <span>{selectedItems.size} selected</span>
          <button onClick={async () => {
            for (const id of selectedItems) await fetch(`/api/media/${id}/restore`, { method: "POST" });
            setSelectedItems(new Set());
            loadMedia();
          }} style={{ padding: "4px 10px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: "pointer", fontSize: 12 }}>
            Restore All
          </button>
          <button onClick={async () => {
            if (!confirm("Permanently delete selected files?")) return;
            for (const id of selectedItems) await fetch(`/api/media/${id}`, { method: "DELETE" });
            setSelectedItems(new Set());
            loadMedia();
          }} style={{ padding: "4px 10px", border: "1px solid #fca5a5", borderRadius: 4, background: "#fff", color: "#dc2626", cursor: "pointer", fontSize: 12 }}>
            Delete Forever
          </button>
        </div>
      )}

      {/* Media grid */}
      {media.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 8, padding: 40, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <p style={{ color: "#9ca3af" }}>
            {view === "trash" ? "Trash is empty." : "No media files yet. Upload something!"}
          </p>
        </div>
      ) : (
        Array.from(groups.entries()).map(([monthKey, items]) => (
          <div key={monthKey} style={{ marginBottom: 24 }}>
            {view === "active" && (
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: "0 0 10px", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                📅 {getMonthLabel(monthKey)} <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: 12 }}>({items.length})</span>
              </h3>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
              {items.map(m => {
                const isImage = m.mimeType.startsWith("image/");
                const isSelected = selectedItems.has(m.id);
                const inSelectMode = selectMode && view === "active";
                const displayUrl = getDisplayUrl(m);
                const hasWebp = !!m.webpUrl;

                return (
                  <div key={m.id} onClick={() => inSelectMode && handleItemClick(m.id)}
                    style={{
                      background: "#fff", borderRadius: 8,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                      overflow: "hidden",
                      cursor: inSelectMode ? "pointer" : "default",
                      outline: isSelected ? "2px solid #2563eb" : undefined,
                      outlineOffset: isSelected ? "-2px" : undefined,
                      opacity: view === "trash" ? 0.75 : (inSelectMode && !isSelected ? 0.55 : 1),
                      transition: "opacity 0.15s, outline 0.15s",
                      position: "relative",
                    }}>
                    {isSelected && (
                      <div style={{
                        position: "absolute", top: 6, left: 6, zIndex: 2,
                        width: 22, height: 22, borderRadius: "50%",
                        background: "#2563eb", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700, lineHeight: 1,
                      }}>✓</div>
                    )}

                    {/* Thumbnail */}
                    <div style={{ position: "relative", height: 140, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isImage ? (
                        mediaView === "webp" && hasWebp ? (
                          <img src={m.webpUrl!} alt={m.alt}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <OptimizedImage src={m.url} alt={m.alt} size="thumb"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )
                      ) : (
                        <div style={{ textAlign: "center" }}>
                          <span style={{ fontSize: 36 }}>{fileIcon(m.mimeType)}</span>
                          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{fileTypeLabel(m.mimeType)}</div>
                        </div>
                      )}
                      <span style={{
                        position: "absolute", top: 6, right: 6,
                        fontSize: 10, padding: "2px 6px", borderRadius: 4,
                        background: m.category === "image" ? "#dbeafe" : "#fef3c7",
                        color: m.category === "image" ? "#1d4ed8" : "#92400e",
                        fontWeight: 500,
                      }}>
                        {m.category === "image" ? "Image" : "Doc"}
                      </span>
                      {mediaView === "webp" && hasWebp && (
                        <span style={{
                          position: "absolute", bottom: 6, right: 6,
                          fontSize: 9, padding: "1px 5px", borderRadius: 3,
                          background: "#052e16", color: "#bbf7d0", fontWeight: 600,
                        }}>
                          WEBP
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: 10 }}>
                      <p style={{ fontSize: 12, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {mediaView === "webp" && hasWebp ? m.filename.replace(/\.[^.]+$/, ".webp") : m.filename}
                      </p>
                      <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 4px" }}>
                        {formatSize(m.fileSize)} · {new Date(m.createdAt).toLocaleDateString()}
                      </p>
                      {!inSelectMode && (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          <button onClick={() => copyUrl(displayUrl)}
                            style={{ fontSize: 11, padding: "3px 8px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: "pointer" }}>
                            Copy {mediaView === "webp" ? "WebP" : "URL"}
                          </button>
                          {view === "trash" ? (
                            <>
                              <button onClick={() => restoreMedia(m.id)}
                                style={{ fontSize: 11, padding: "3px 8px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: "pointer", color: "#2563eb" }}>
                                Restore
                              </button>
                              <button onClick={() => deleteMedia(m.id)}
                                style={{ fontSize: 11, padding: "3px 8px", border: "1px solid #fca5a5", borderRadius: 4, background: "#fff", color: "#dc2626", cursor: "pointer" }}>
                                Delete
                              </button>
                            </>
                          ) : (
                            <button onClick={() => deleteMedia(m.id)}
                              style={{ fontSize: 11, padding: "3px 8px", border: "1px solid #fca5a5", borderRadius: 4, background: "#fff", color: "#dc2626", cursor: "pointer" }}>
                              {mediaView === "webp" ? "Del WebP" : "Trash"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => !uploading && setShowUploadModal(false)}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 420, maxWidth: "95vw" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>Upload File</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Type</label>
              <div style={{ display: "flex", gap: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 13 }}>
                  <input type="radio" name="cat" checked={uploadCategory === "image"} onChange={() => setUploadCategory("image")} />
                  🖼️ Image
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 13 }}>
                  <input type="radio" name="cat" checked={uploadCategory === "document"} onChange={() => setUploadCategory("document")} />
                  📄 Document
                </label>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>File</label>
              <div style={{
                border: "2px dashed #d1d5db", borderRadius: 8, padding: 24, textAlign: "center",
                background: "#f9fafb", cursor: "pointer",
              }} onClick={() => fileRef.current?.click()}>
                <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                  {uploading ? "Uploading..." : "Click to select a file"}
                </p>
                <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>
                  Images will be auto-converted to WebP (80% quality) + thumbnail
                </p>
              </div>
              <input type="file" ref={fileRef}
                accept={uploadCategory === "image" ? "image/*" : ".pdf,.xls,.xlsx,.doc,.docx,.csv"}
                onChange={handleUpload} style={{ display: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowUploadModal(false)} disabled={uploading}
                style={{ padding: "8px 20px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", fontSize: 14, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
