"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuid } from "uuid";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ALL_BLOCKS, BLOCK_MAP } from "@/components/blocks/definitions";
import RichTextEditor from "./RichTextEditor";
import Navigator from "./Navigator";
import MediaBrowser from "./MediaBrowser";
import SectionSettingsPanel from "./SectionSettingsPanel";
import type { BlockData, SectionBlock, ColumnBlock, SectionContent, LayoutPreset, PageDocument } from "@/lib/block-types";
import { LAYOUT_PRESETS, createSection } from "@/lib/block-types";

// ─── Config ────────────────────────────────────────
const INLINE_EDITABLE_TYPES = new Set(["heading", "text", "hero", "divider", "image"]);
const MODAL_REQUIRED_TYPES = new Set(["features", "gallery", "counter", "accordion", "tabs", "products", "posts", "form"]);

interface BlockEditorProps {
  value: string;
  onChange: (json: string) => void;
}

// ================================================================
//  HELPERS
// ================================================================

/** Convert old flat BlockData[] format → new section format */
function migrateOldFormat(blocks: BlockData[]): PageDocument {
  return [{
    id: uuid(),
    type: "section",
    layout: "1" as LayoutPreset,
    columns: [{ id: uuid(), width: "100%", blocks: blocks }],
  }];
}

/** Parse incoming JSON, supporting both old and new formats */
function parseDocument(value: string): PageDocument {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      // new format: SectionBlock[]
      if (parsed.length > 0 && parsed[0]?.type === "section") return parsed as PageDocument;
      // old format: BlockData[]
      return migrateOldFormat(parsed as BlockData[]);
    }
  } catch {}
  return [];
}

/** Get a default empty doc (one empty section) */
function emptyDocument(): PageDocument {
  return [createSection("1")];
}

// ================================================================
//  DROPPABLE ZONE IDs
// ================================================================

// ================================================================
//  PALETTE ITEM (draggable from left panel)
// ================================================================

function PaletteItem({ blockDef }: { blockDef: (typeof ALL_BLOCKS)[number] }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${blockDef.type}`,
    data: { type: "palette", blockType: blockDef.type },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 14px", background: isDragging ? "#eff6ff" : "#fff",
        border: "1px solid #e5e7eb", borderRadius: 6, cursor: "grab",
        fontSize: 13, opacity: isDragging ? 0.6 : 1,
        userSelect: "none", touchAction: "none",
        transition: "box-shadow 0.1s",
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
    >
      <span style={{ fontSize: 18 }}>{blockDef.icon}</span>
      <span style={{ fontWeight: 500 }}>{blockDef.label}</span>
    </div>
  );
}

// ================================================================
//  LAYOUT PICKER (the 6 preset options)
// ================================================================

const LAYOUT_PREVIEWS: { value: LayoutPreset; label: string; cols: number[] }[] = [
  { value: "1",       label: "1 Column",     cols: [1] },
  { value: "1-2",     label: "1/2 + 1/2",    cols: [1, 1] },
  { value: "1-3",     label: "1/3 + 1/3 + 1/3", cols: [1, 1, 1] },
  { value: "1-4",     label: "1/4 + 1/4 + 1/4 + 1/4", cols: [1, 1, 1, 1] },
  { value: "1-3-2-3", label: "1/3 + 2/3",    cols: [1, 2] },
  { value: "2-3-1-3", label: "2/3 + 1/3",    cols: [2, 1] },
];

function LayoutPicker({ onSelect }: { onSelect: (layout: LayoutPreset) => void }) {
  return (
    <div style={{ padding: "30px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#374151", margin: 0 }}>Choose Column Layout</h3>
        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Select a layout structure for this section</p>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {LAYOUT_PREVIEWS.map((lp) => {
          const total = lp.cols.reduce((a, b) => a + b, 0);
          return (
            <button
              key={lp.value}
              type="button"
              onClick={() => onSelect(lp.value)}
              style={{
                padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 8,
                background: "#fff", cursor: "pointer", transition: "all 0.15s",
                textAlign: "center", minWidth: 140,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#3b82f6"; (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 6px rgba(59,130,246,0.15)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              {/* Mini preview */}
              <div style={{ display: "flex", gap: 3, height: 24, marginBottom: 6, justifyContent: "center" }}>
                {lp.cols.map((c, i) => (
                  <div key={i} style={{
                    flex: c, background: "#dbeafe", borderRadius: 2,
                    border: "1px solid #93c5fd", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 8, color: "#2563eb",
                  }}>
                    {c === 2 ? "2/3" : c === 1 && total > 1 ? `${Math.round(100/total)}%` : ""}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#475569" }}>{lp.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ================================================================
//  BLOCK RENDERER (renders single block)
// ================================================================

function BlockRenderer({ block }: { block: BlockData }) {
  const def = BLOCK_MAP.get(block.type);
  if (!def) return <div style={{ padding: 16, color: "#9ca3af", fontSize: 12 }}>Unknown: {block.type}</div>;
  try {
    const Component = def.component;
    return <Component data={block.data} />;
  } catch {
    return <div style={{ padding: 16, color: "#dc2626", fontSize: 12 }}>Error: {block.type}</div>;
  }
}

// ================================================================
//  INLINE BLOCK EDITOR (WYSIWYG on canvas)
// ================================================================

function InlineBlockEditor({ block, onDataChange }: { block: BlockData; onDataChange: (data: any) => void }) {
  const def = BLOCK_MAP.get(block.type);
  const [data, setData] = useState({ ...block.data });
  const textRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const update = useCallback((key: string, value: any) => {
    const next = { ...data, [key]: value };
    setData(next);
    onDataChange(next);
  }, [data, onDataChange]);

  // On mount: clear default placeholder text for text-type fields only
  // (skip structural fields like tag, align, layout, color - don't clear dropdowns/options)
  useEffect(() => {
    const def = BLOCK_MAP.get(block.type);
    if (!def) return;
    const textKeys = new Set(
      def.fields
        .filter(f => f.type === "text" || f.type === "textarea" || f.type === "rich")
        .map(f => f.key)
    );
    const updates: Record<string, any> = {};
    let changed = false;
    for (const key of textKeys) {
      const dVal = def.defaultData[key];
      if (typeof dVal === "string" && dVal && data[key] === dVal) {
        updates[key] = "";
        changed = true;
      }
    }
    if (changed) {
      setData({ ...data, ...updates });
    }
  }, []);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "4px 8px", border: "1px solid #93c5fd",
    borderRadius: 4, fontSize: 14, background: "#fff",
    boxSizing: "border-box", outline: "none",
  };

  const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 500, color: "#6b7280", marginBottom: 2 };

  switch (block.type) {
    case "heading":
      return (
        <div style={{ padding: 8 }}>
          <input ref={textRef} type="text" value={data.text || ""} onChange={e => update("text", e.target.value)}
            style={{ ...inputStyle, fontSize: data.tag === "h1" ? 28 : data.tag === "h2" ? 22 : 18, fontWeight: 600,
              textAlign: data.align || "left", border: "none", borderBottom: "2px solid #3b82f6", borderRadius: 0 }}
            autoFocus />
          <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
            <select value={data.tag || "h2"} onChange={e => update("tag", e.target.value)}
              style={{ padding: "2px 6px", fontSize: 11, border: "1px solid #d1d5db", borderRadius: 4 }}>
              <option value="h1">H1</option><option value="h2">H2</option><option value="h3">H3</option>
            </select>
            <select value={data.align || "left"} onChange={e => update("align", e.target.value)}
              style={{ padding: "2px 6px", fontSize: 11, border: "1px solid #d1d5db", borderRadius: 4 }}>
              <option value="left">← Left</option><option value="center">↔ Center</option><option value="right">→ Right</option>
            </select>
          </div>
          {/* Font style fields */}
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
            <select value={data.fontFamily || ""} onChange={e => update("fontFamily", e.target.value)}
              style={{ padding: "2px 6px", fontSize: 11, border: "1px solid #d1d5db", borderRadius: 4, maxWidth: 140 }}>
              <option value="">Default Font</option>
              <option value="Arial, Helvetica, sans-serif">Arial</option>
              <option value="Georgia, 'Times New Roman', serif">Georgia</option>
              <option value="'Inter', system-ui, sans-serif">Inter</option>
              <option value="'Roboto', sans-serif">Roboto</option>
              <option value="'Open Sans', sans-serif">Open Sans</option>
            </select>
            <input type="text" value={data.fontSize || ""} onChange={e => update("fontSize", e.target.value)}
              placeholder="Size" style={{ width: 50, padding: "2px 4px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 11 }} />
            <input type="color" value={data.color || "#000000"} onChange={e => update("color", e.target.value)}
              style={{ width: 26, height: 26, padding: 0, border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer" }} title="Color" />
            <input type="text" value={data.letterSpacing || ""} onChange={e => update("letterSpacing", e.target.value)}
              placeholder="LS" style={{ width: 40, padding: "2px 4px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 11 }} />
          </div>
        </div>
      );
    case "text":
      return (
        <div style={{ padding: 8 }}>
          <RichTextEditor
            value={data.content || ""}
            onChange={(html) => update("content", html)}
            placeholder="在这里输入内容..."
            minHeight={150}
            compact
          />
          {/* Font style fields */}
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center", padding: "6px 8px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: "#6b7280" }}>Text Style:</span>
            <select value={data.fontFamily || ""} onChange={e => update("fontFamily", e.target.value)}
              style={{ padding: "2px 6px", fontSize: 11, border: "1px solid #d1d5db", borderRadius: 4, maxWidth: 130 }}>
              <option value="">Auto</option>
              <option value="Arial, Helvetica, sans-serif">Arial</option>
              <option value="Georgia, 'Times New Roman', serif">Georgia</option>
              <option value="'Inter', system-ui, sans-serif">Inter</option>
              <option value="'Roboto', sans-serif">Roboto</option>
            </select>
            <input type="text" value={data.fontSize || ""} onChange={e => update("fontSize", e.target.value)}
              placeholder="16px" style={{ width: 50, padding: "2px 4px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 11 }} />
            <input type="color" value={data.fontColor || "#374151"} onChange={e => update("fontColor", e.target.value)}
              style={{ width: 26, height: 26, padding: 0, border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer" }} title="Font Color" />
            <select value={data.fontWeight || ""} onChange={e => update("fontWeight", e.target.value)}
              style={{ padding: "2px 6px", fontSize: 11, border: "1px solid #d1d5db", borderRadius: 4 }}>
              <option value="">Weight</option>
              <option value="400">Normal</option>
              <option value="600">Semi Bold</option>
              <option value="700">Bold</option>
            </select>
            <input type="text" value={data.lineHeight || ""} onChange={e => update("lineHeight", e.target.value)}
              placeholder="LH" style={{ width: 40, padding: "2px 4px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 11 }} />
          </div>
        </div>
      );
    case "hero":
      return (
        <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          <input ref={textRef} type="text" value={data.title || ""} onChange={e => update("title", e.target.value)}
            placeholder="Hero title" style={{ ...inputStyle, fontSize: 20, fontWeight: 700, border: "none", borderBottom: "2px solid #3b82f6", borderRadius: 0 }}
            autoFocus />
          <textarea ref={textareaRef} value={data.subtitle || ""} onChange={e => update("subtitle", e.target.value)}
            placeholder="Hero subtitle" style={{ ...inputStyle, minHeight: 40, border: "none", borderBottom: "2px solid #3b82f6", borderRadius: 0, resize: "vertical" }} />
        </div>
      );
    case "image":
      return (
        <div style={{ padding: 8 }}>
          {/* Image preview + upload */}
          <ImageFieldInline value={data.url || ""} onChange={(url) => update("url", url)} />

          {/* Alt text */}
          <div style={{ marginTop: 8 }}>
            <label style={labelStyle}>Alt Text</label>
            <input type="text" value={data.alt || ""} onChange={e => update("alt", e.target.value)} style={inputStyle} />
          </div>

          {/* Width & Height */}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Width (px)</label>
              <input type="text" value={data.width || ""} onChange={e => update("width", e.target.value)}
                placeholder="自动" style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Height (px)</label>
              <input type="text" value={data.height || ""} onChange={e => update("height", e.target.value)}
                placeholder="自动" style={inputStyle} />
            </div>
          </div>

          {/* Max Width & Alignment */}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Max Width (px)</label>
              <input type="text" value={data.max_width || ""} onChange={e => update("max_width", e.target.value)}
                placeholder="800" style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Alignment</label>
              <select value={data.align || "center"} onChange={e => update("align", e.target.value)}
                style={{ ...inputStyle, padding: "4px 8px" }}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>

          {/* Caption */}
          <div style={{ marginTop: 8 }}>
            <label style={labelStyle}>Caption</label>
            <input type="text" value={data.caption || ""} onChange={e => update("caption", e.target.value)} style={inputStyle} />
          </div>

          {/* Link */}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Link URL</label>
              <input type="text" value={data.link_url || ""} onChange={e => update("link_url", e.target.value)}
                placeholder="点击图片跳转的链接" style={inputStyle} />
            </div>
            <div style={{ flex: 0, minWidth: 120 }}>
              <label style={labelStyle}>Target</label>
              <select value={data.link_target || "_self"} onChange={e => update("link_target", e.target.value)}
                style={{ ...inputStyle, padding: "4px 8px" }}>
                <option value="_self">Same Window</option>
                <option value="_blank">New Tab</option>
              </select>
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div style={{ padding: 8 }}>
          {(def?.fields || []).map(f => {
            const val = data[f.key] ?? "";
            return (
              <div key={f.key} style={{ marginBottom: 8 }}>
                <label style={labelStyle}>{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea value={val} onChange={e => update(f.key, e.target.value)} rows={f.rows || 3} style={inputStyle} />
                ) : f.type === "color" ? (
                  <input type="color" value={val || "#000000"} onChange={e => update(f.key, e.target.value)}
                    style={{ width: 40, height: 40, border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer" }} />
                ) : (
                  <input type="text" value={val} onChange={e => update(f.key, e.target.value)} style={inputStyle} />
                )}
              </div>
            );
          })}
        </div>
      );
  }
}

// ================================================================
//  BLOCK TOOLBAR (hover toolbar on blocks)
// ================================================================

const tbBtn: React.CSSProperties = {
  padding: "3px 6px", background: "#1e293b", color: "#fff",
  border: "none", cursor: "pointer", fontSize: 11, lineHeight: 1,
  display: "flex", alignItems: "center",
};

// ================================================================
//  INNER BLOCK (inside a column)
// ================================================================

function InnerBlock({
  content, path,
  onUpdate, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown,
  onStartEdit, onOpenModal, isEditing,
  onAddNestedSection,
}: {
  content: SectionContent; path: string;
  onUpdate: (updated: SectionContent) => void;
  onDelete: () => void; onMoveUp: () => void; onMoveDown: () => void;
  canMoveUp: boolean; canMoveDown: boolean;
  onStartEdit: () => void; onOpenModal: () => void;
  isEditing: boolean;
  onAddNestedSection: () => void;
}) {
  // If it's a nested section, render section content recursively
  if (content.type === "section") {
    return <MiniSectionBlock section={content as SectionBlock} path={path} onUpdate={onUpdate} onDelete={onDelete} onOpenModal={onOpenModal} onAddNestedSection={onAddNestedSection} />;
  }

  const block = content as BlockData;
  const def = BLOCK_MAP.get(block.type);

  return (
    <div
      onClick={(e) => { if (!isEditing) onStartEdit(); }}
      style={{ position: "relative", marginBottom: 4 }}
    >
      {/* Toolbar - always visible */}
      <div style={{
        height: 24, overflow: "hidden",
        display: "flex", alignItems: "center", gap: 2,
      }}>
        <span style={{ padding: "2px 6px", background: "#1e293b", color: "#fff", fontSize: 10, borderRadius: "4px 4px 0 0", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 3 }}>
          {def?.icon} {def?.label}
        </span>
        <button type="button" onClick={e => { e.stopPropagation(); if (INLINE_EDITABLE_TYPES.has(block.type)) { onStartEdit(); } else { onOpenModal(); } }} style={tbBtn} title="Edit">✏️</button>
        <button type="button" onClick={e => { e.stopPropagation(); onDelete(); }} style={{ ...tbBtn, color: "#fff", background: "#dc2626" }} title="Delete">🗑️</button>
      </div>

      <div style={{
        outline: isEditing ? "2px solid #3b82f6" : "1px solid #e2e8f0",
        outlineOffset: -1, borderRadius: 4,
        background: isEditing ? "rgba(59,130,246,0.03)" : "transparent",
      }}>
        {isEditing ? (
          <InlineBlockEditor block={block}
            onDataChange={(data) => onUpdate({ ...block, data } as SectionContent)} />
        ) : (
          <BlockRenderer block={block} />
        )}
      </div>
    </div>
  );
}

// ================================================================
//  MINI SECTION (nested section rendering in a column)
// ================================================================

function MiniSectionBlock({ section, path, onUpdate, onDelete, onOpenModal, onAddNestedSection }: {
  section: SectionBlock; path: string;
  onUpdate: (updated: SectionContent) => void;
  onDelete: () => void;
  onOpenModal: () => void;
  onAddNestedSection: () => void;
}) {
  const preset = LAYOUT_PRESETS.find(p => p.value === section.layout);
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ margin: 4, border: "1px dashed #cbd5e1", borderRadius: 6, padding: 4, background: "#fafbfc" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Section toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 6px", marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: "#64748b", fontWeight: 500, background: "#e2e8f0", padding: "1px 6px", borderRadius: 3 }}>
          📐 Section ({preset?.label || section.layout})
        </span>
        <button type="button" onClick={e => { e.stopPropagation(); onDelete(); }} style={{ ...tbBtn, fontSize: 10, background: "#dc2626", borderRadius: 3 }}>🗑️</button>
      </div>

      {/* Columns */}
      <div style={{ display: "flex", gap: 4 }}>
        {section.columns.map((col, colIdx) => (
          <NestedColumn
            key={col.id}
            column={col}
            colIdx={colIdx}
            sectionPath={path}
            columnWidth={col.width}
          />
        ))}
      </div>

      {/* Add nested section button */}
      <div style={{ textAlign: "center", marginTop: 4 }}>
        <button type="button" onClick={e => { e.stopPropagation(); onAddNestedSection(); }}
          style={{ padding: "2px 10px", border: "1px dashed #94a3b8", borderRadius: 4, background: "transparent", cursor: "pointer", fontSize: 10, color: "#64748b" }}>
          + Nest Section
        </button>
      </div>
    </div>
  );
}

// ================================================================
//  NESTED COLUMN (inside a nested section)
// ================================================================

function NestedColumn({ column, colIdx, sectionPath, columnWidth }: {
  column: ColumnBlock; colIdx: number; sectionPath: string;
  columnWidth: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);

  return (
    <div style={{ flex: columnWidth === "100%" ? "1" : `0 0 ${columnWidth}`, minWidth: 0, position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        border: "1px dashed #cbd5e1", borderRadius: 4, minHeight: 60,
        padding: 4, background: "#fff",
        outline: hovered ? "1px solid #93c5fd" : "none",
      }}>
        <div style={{ fontSize: 10, color: "#94a3b8", padding: "2px 4px", textAlign: "center" }}>
          {columnWidth}
        </div>

        {/* Blocks inside this column */}
        {column.blocks.map((content, i) => {
          const contentId = content.id;
          return (
            <div key={contentId || i}>
              {/* This is a read-only preview of nested blocks; full interaction handled by parent */}
              {content.type === "section" ? (
                <div style={{ fontSize: 11, color: "#64748b", padding: 6, background: "#f1f5f9", borderRadius: 4, textAlign: "center" }}>
                  📐 Nested section
                </div>
              ) : (
                <BlockRenderer block={content as BlockData} />
              )}
            </div>
          );
        })}

        {/* Add inner block button */}
        {hovered && (
          <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", padding: "4px 0" }}>
            {["heading", "text", "image", "button", "hero", "spacer", "divider"].map(type => {
              const d = BLOCK_MAP.get(type);
              return (
                <button key={type} type="button" title={d?.label || type}
                  onClick={() => {
                    // This is placeholder - actual handling done by parent
                  }}
                  style={{ padding: "2px 6px", border: "1px solid #e2e8f0", borderRadius: 3, background: "#fff", cursor: "pointer", fontSize: 10 }}>
                  {d?.icon || "➕"}
                </button>
              );
            })}
          </div>
        )}
        {!hovered && column.blocks.length === 0 && (
          <div style={{ textAlign: "center", padding: "12px 0", color: "#cbd5e1", fontSize: 11 }}>
            Drag elements here
          </div>
        )}
      </div>
    </div>
  );
}

// ================================================================
//  BLOCK DROP ZONE (guide line between blocks during drag)
// ================================================================

function BlockDropZone({ sectionIdx, colIdx, insertIdx }: { sectionIdx: number; colIdx: number; insertIdx: number }) {
  const dropId = `cd-${sectionIdx}-${colIdx}-${insertIdx}`;
  const { isOver, setNodeRef } = useDroppable({
    id: dropId,
    data: { type: "column-drop", sectionIdx, colIdx, blockIdx: insertIdx },
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        height: isOver ? 3 : 2,
        background: isOver ? "#3b82f6" : "transparent",
        borderRadius: 2,
        margin: 0,
        transition: "height 0.12s, background 0.12s",
      }}
    />
  );
}

// ================================================================
//  SECTION COLUMN (column in top-level section)
// ================================================================

function SectionColumn({
  column, colIdx, sectionIdx, columnWidth,
  onAddBlock, onUpdateBlock, onDeleteBlock, onMoveBlock,
  onUpdateColumn, onOpenModal,
  editingBlockPath, setEditingBlockPath,
  onAddNestedSection, previewMode,
}: {
  column: ColumnBlock; colIdx: number; sectionIdx: number;
  columnWidth: string;
  onAddBlock: (blockType: string) => void;
  onUpdateBlock: (blockIdx: number, data: any) => void;
  onDeleteBlock: (blockIdx: number) => void;
  onMoveBlock: (blockIdx: number, dir: "up" | "down") => void;
  onUpdateColumn: (blocks: SectionContent[]) => void;
  onOpenModal: (block: BlockData, blockIdx: number) => void;
  editingBlockPath: string | null;
  setEditingBlockPath: (path: string | null) => void;
  onAddNestedSection: () => void;
  previewMode: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [showBlockPicker, setShowBlockPicker] = useState(false);

  const isEditing = editingBlockPath === `s${sectionIdx}c${colIdx}`;

  const isResponsive = previewMode !== "desktop";

  return (
    <div
      style={{
        flex: isResponsive ? "1 1 100%" : columnWidth === "100%" ? "1" : `0 0 ${columnWidth}`,
        maxWidth: isResponsive ? "100%" : undefined,
        minWidth: 0, position: "relative",
        border: "1px dashed #e2e8f0",
        borderRadius: 6, minHeight: isResponsive ? undefined : 80,
        background: "#fcfcfd",
        padding: 4,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Column width indicator */}
      <div style={{ textAlign: "center", fontSize: 10, color: "#94a3b8", padding: "2px 0" }}>
        {columnWidth}
      </div>

      {/* Drop zone at top (before first block) */}
      <BlockDropZone sectionIdx={sectionIdx} colIdx={colIdx} insertIdx={0} />

      {/* Blocks inside column with drop zones between them */}
      {column.blocks.map((content, blockIdx) => {
        const path = `s${sectionIdx}c${colIdx}b${blockIdx}`;
        return (
          <div key={content.id || blockIdx}>
            {content.type === "section" ? (
              <div style={{ margin: "4px 0" }}>
                <MiniSectionBlock
                  section={content as SectionBlock}
                  path={path}
                  onUpdate={(updated) => {
                    const next = [...column.blocks];
                    next[blockIdx] = updated;
                    onUpdateColumn(next);
                  }}
                  onDelete={() => onDeleteBlock(blockIdx)}
                  onOpenModal={() => {}}
                  onAddNestedSection={() => onAddNestedSection()}
                />
              </div>
            ) : (
              <div style={{ margin: "4px 0" }}>
                <InnerBlock
                  content={content as BlockData}
                  path={path}
                  onUpdate={(updated) => {
                    const next = [...column.blocks];
                    next[blockIdx] = updated;
                    onUpdateColumn(next);
                  }}
                  onDelete={() => onDeleteBlock(blockIdx)}
                  onMoveUp={() => onMoveBlock(blockIdx, "up")}
                  onMoveDown={() => onMoveBlock(blockIdx, "down")}
                  canMoveUp={blockIdx > 0}
                  canMoveDown={blockIdx < column.blocks.length - 1}
                  onStartEdit={() => setEditingBlockPath(path)}
                  onOpenModal={() => onOpenModal(content as BlockData, blockIdx)}
                  isEditing={editingBlockPath === path}
                  onAddNestedSection={onAddNestedSection}
                />
              </div>
            )}
            {/* Drop zone after this block */}
            <BlockDropZone sectionIdx={sectionIdx} colIdx={colIdx} insertIdx={blockIdx + 1} />
          </div>
        );
      })}

      {/* Empty column hint */}
      {column.blocks.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px 0", color: "#cbd5e1", fontSize: 12 }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>➕</div>
          Drag blocks here
        </div>
      )}

      {/* Add block buttons on hover */}
      {hovered && (
        <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", padding: "4px", borderTop: "1px dashed #e2e8f0", marginTop: 4 }}>
          {["heading", "text", "image", "button", "hero", "spacer", "divider", "text_image", "cta", "features"].map(type => {
            const d = BLOCK_MAP.get(type);
            if (!d) return null;
            return (
              <button key={type} type="button" title={d.label}
                onClick={() => onAddBlock(type)}
                style={{ padding: "3px 8px", border: "1px solid #e2e8f0", borderRadius: 4, background: "#fff", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
                <span>{d.icon}</span>
              </button>
            );
          })}
          <button type="button" title="Nested Section"
            onClick={() => onAddNestedSection()}
            style={{ padding: "3px 8px", border: "1px dashed #94a3b8", borderRadius: 4, background: "#f8fafc", cursor: "pointer", fontSize: 11, color: "#64748b" }}>
            📐 +Section
          </button>
        </div>
      )}
    </div>
  );
}

// ── Hex to RGBA helper ──
function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2) || "00", 16);
  const g = parseInt(c.substring(2, 4) || "00", 16);
  const b = parseInt(c.substring(4, 6) || "00", 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ================================================================
//  TOP-LEVEL SECTION RENDERER
// ================================================================

function SectionRenderer({
  section, sectionIdx,
  onUpdateSection, onDeleteSection, onMoveUp, onMoveDown, canMoveUp, canMoveDown,
  onAddBlockToColumn, onUpdateBlockInColumn, onDeleteBlockFromColumn, onMoveBlockInColumn,
  onOpenModal,
  editingBlockPath, setEditingBlockPath,
  previewMode,
}: {
  section: SectionBlock; sectionIdx: number;
  onUpdateSection: (updated: SectionBlock) => void;
  onDeleteSection: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onAddBlockToColumn: (colIdx: number, blockType: string) => void;
  onUpdateBlockInColumn: (colIdx: number, blockIdx: number, data: any) => void;
  onDeleteBlockFromColumn: (colIdx: number, blockIdx: number) => void;
  onMoveBlockInColumn: (colIdx: number, blockIdx: number, dir: "up" | "down") => void;
  onOpenModal: (colIdx: number, block: BlockData, blockIdx: number) => void;
  editingBlockPath: string | null;
  previewMode: string;
  setEditingBlockPath: (path: string | null) => void;
}) {
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const preset = LAYOUT_PRESETS.find(p => p.value === section.layout);

  if (showLayoutPicker) {
    return (
      <div style={{ border: "2px dashed #3b82f6", borderRadius: 8, margin: "8px 0" }}>
        <LayoutPicker onSelect={(layout) => {
          const updated = { ...section, ...createSection(layout) };
          onUpdateSection(updated);
          setShowLayoutPicker(false);
        }} />
        <div style={{ textAlign: "center", padding: "0 0 12px" }}>
          <button type="button" onClick={() => setShowLayoutPicker(false)}
            style={{ padding: "4px 16px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: "pointer", fontSize: 12 }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 8, position: "relative",
        paddingTop: section.paddingTop !== undefined && section.paddingTop !== "" ? `${section.paddingTop}px` : undefined,
        paddingBottom: section.paddingBottom !== undefined && section.paddingBottom !== "" ? `${section.paddingBottom}px` : undefined,
        marginTop: section.marginTop !== undefined && section.marginTop !== "" ? `${section.marginTop}px` : undefined,
        marginBottom: section.marginBottom !== undefined && section.marginBottom !== "" ? `${section.marginBottom}px` : undefined,
        minHeight: section.minHeight ? `${section.minHeight}px` : undefined,
        display: "flex",
        flexDirection: "column",
        justifyContent: section.verticalAlign === "center" ? "center" : section.verticalAlign === "bottom" ? "flex-end" : "flex-start",
        ...(section.bgType === "image" && section.bgImage
          ? {
              backgroundImage: [
                section.bgOverlay ? `linear-gradient(${hexToRgba(section.bgOverlay, parseInt(section.bgOverlayOpacity || "50") / 100)}, ${hexToRgba(section.bgOverlay, parseInt(section.bgOverlayOpacity || "50") / 100)})` : "",
                `url(${section.bgImage})`,
              ].filter(Boolean).join(", "),
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : section.bgType === "gradient" && section.bgGradient
          ? { background: section.bgGradient }
          : section.bgColor
          ? { background: section.bgColor }
          : {}),
      }}
    >
      {/* Section toolbar - always visible */}
      <div style={{
        display: "flex", gap: 4, alignItems: "center",
        marginBottom: 8,
      }}>
        {/* Drag handle for section reorder */}
        <span style={{ color: "#94a3b8", cursor: "grab", fontSize: 14, lineHeight: 1 }} title="Drag to reorder">
          ⠿
        </span>
        <span style={{ fontSize: 10, color: "#64748b", background: "#e2e8f0", padding: "1px 8px", borderRadius: 3, fontWeight: 500 }}>
          📐 {preset?.label || section.layout}
        </span>
        <button type="button" onClick={() => setShowLayoutPicker(true)}
          style={{ ...tbBtn, fontSize: 10, background: "#475569", borderRadius: 3 }} title="Change Layout">
          🔄 Layout
        </button>
        <button type="button" onClick={onMoveUp}
          style={{ ...tbBtn, fontSize: 10, background: "#475569", borderRadius: 3 }} title="Move Section Up" disabled={canMoveUp === false}>
          ▲
        </button>
        <button type="button" onClick={onMoveDown}
          style={{ ...tbBtn, fontSize: 10, background: "#475569", borderRadius: 3 }} title="Move Section Down" disabled={canMoveDown === false}>
          ▼
        </button>
        <button type="button" onClick={() => setShowSettings(!showSettings)}
          style={{ ...tbBtn, fontSize: 10, background: showSettings ? "#3b82f6" : "#475569", borderRadius: 3, color: showSettings ? "#fff" : "inherit" }} title="Section Settings">
          ⚙️
        </button>
        <button type="button" onClick={onDeleteSection}
          style={{ ...tbBtn, fontSize: 10, background: "#dc2626", borderRadius: 3 }} title="Delete Section">
          🗑️
        </button>
      </div>

      {/* Section Settings Panel */}
      {showSettings && (
        <SectionSettingsPanel
          section={section}
          onChange={onUpdateSection}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Columns */}
      <div style={{
        display: "flex", gap: 8,
        flexDirection: previewMode !== "desktop" ? "column" : "row",
        maxWidth: (section.contentWidth || "boxed") === "boxed" ? 1200 : undefined,
        margin: (section.contentWidth || "boxed") === "boxed" ? "0 auto" : undefined,
        padding: (section.contentWidth || "boxed") === "boxed" ? "0 24px" : undefined,
        width: "100%",
      }}>
        {section.columns.map((col, colIdx) => {
          const colWidth = col.width || preset?.columns[colIdx] || "100%";
          return (
            <SectionColumn
              key={col.id}
              column={col}
              colIdx={colIdx}
              sectionIdx={sectionIdx}
              columnWidth={colWidth}
              previewMode={previewMode}
              onAddBlock={(blockType) => onAddBlockToColumn(colIdx, blockType)}
              onUpdateBlock={(blockIdx, data) => onUpdateBlockInColumn(colIdx, blockIdx, data)}
              onDeleteBlock={(blockIdx) => onDeleteBlockFromColumn(colIdx, blockIdx)}
              onMoveBlock={(blockIdx, dir) => onMoveBlockInColumn(colIdx, blockIdx, dir)}
              onUpdateColumn={(blocks) => {
                const updated = { ...section, columns: section.columns.map((c, i) => i === colIdx ? { ...c, blocks } : c) };
                onUpdateSection(updated);
              }}
              onOpenModal={(block, blockIdx) => onOpenModal(colIdx, block, blockIdx)}
              editingBlockPath={editingBlockPath}
              setEditingBlockPath={setEditingBlockPath}
              onAddNestedSection={() => {
                const nestedSec = createSection("1");
                const next = [...col.blocks, nestedSec];
                const updated = { ...section, columns: section.columns.map((c, i) => i === colIdx ? { ...c, blocks: next } : c) };
                onUpdateSection(updated);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ================================================================
//  MAIN BLOCK EDITOR
// ================================================================

export default function BlockEditor({ value, onChange }: BlockEditorProps) {
  const [doc, setDoc] = useState<PageDocument>(() => parseDocument(value));
  const [editingBlockPath, setEditingBlockPath] = useState<string | null>(null);
  const [showModalFor, setShowModalFor] = useState<{ colIdx: number; block: BlockData; blockIdx: number; sectionIdx: number } | null>(null);
  const [showEmptyLayoutPicker, setShowEmptyLayoutPicker] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // Sync doc → parent
  const syncDoc = useCallback((next: PageDocument) => {
    setDoc(next);
    onChange(JSON.stringify(next));
  }, [onChange]);

  // ── Section management ──
  function addSection(layout: LayoutPreset) {
    const next = [...doc, createSection(layout)];
    syncDoc(next);
    setShowEmptyLayoutPicker(false);
  }

  function updateSection(sectionIdx: number, updated: SectionBlock) {
    const next = doc.map((s, i) => i === sectionIdx ? updated : s);
    syncDoc(next);
  }

  function deleteSection(sectionIdx: number) {
    const next = doc.filter((_, i) => i !== sectionIdx);
    syncDoc(next.length === 0 ? emptyDocument() : next);
  }

  function moveSection(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) return;
    const next = [...doc];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    syncDoc(next);
  }

  function moveBlock(source: { sectionIdx: number; colIdx: number; blockIdx: number }, target: { sectionIdx: number; colIdx: number; blockIdx: number }) {
    const next = JSON.parse(JSON.stringify(doc)) as PageDocument;
    const srcSection = next[source.sectionIdx];
    const tgtSection = next[target.sectionIdx];
    if (!srcSection || !tgtSection) return;
    const srcCol = srcSection.columns[source.colIdx];
    const tgtCol = tgtSection.columns[target.colIdx];
    if (!srcCol || !tgtCol) return;

    // Remove from source
    const [removed] = srcCol.blocks.splice(source.blockIdx, 1);
    if (!removed) return;

    // Calculate destination index (adjust for same-section/same-col removal shift)
    let destIdx = target.blockIdx;
    if (source.sectionIdx === target.sectionIdx && source.colIdx === target.colIdx) {
      destIdx = target.blockIdx > source.blockIdx ? target.blockIdx - 1 : target.blockIdx;
    }
    tgtCol.blocks.splice(destIdx, 0, removed);

    syncDoc(next);
  }

  // ── Column block management ──
  function addBlockToColumn(sectionIdx: number, colIdx: number, blockType: string, insertIdx?: number) {
    const def = BLOCK_MAP.get(blockType);
    if (!def) return;
    const block: BlockData = { id: uuid(), type: blockType, data: { ...def.defaultData } };
    const next = [...doc];
    const col = next[sectionIdx].columns[colIdx];
    const idx = insertIdx !== undefined ? Math.min(insertIdx, col.blocks.length) : col.blocks.length;
    col.blocks = [...col.blocks.slice(0, idx), block, ...col.blocks.slice(idx)];
    syncDoc(next);
    setEditingBlockPath(`s${sectionIdx}c${colIdx}b${idx}`);
  }

  function updateBlockInColumn(sectionIdx: number, colIdx: number, blockIdx: number, data: any) {
    const next = [...doc];
    const col = next[sectionIdx].columns[colIdx];
    const block = col.blocks[blockIdx];
    if (block?.type === "section") return;
    (col.blocks[blockIdx] as BlockData).data = data;
    syncDoc(next);
  }

  function deleteBlockFromColumn(sectionIdx: number, colIdx: number, blockIdx: number) {
    const next = [...doc];
    next[sectionIdx].columns[colIdx].blocks =
      next[sectionIdx].columns[colIdx].blocks.filter((_, i) => i !== blockIdx);
    syncDoc(next);
    setEditingBlockPath(null);
  }

  function moveBlockInColumn(sectionIdx: number, colIdx: number, blockIdx: number, dir: "up" | "down") {
    const target = dir === "up" ? blockIdx - 1 : blockIdx + 1;
    const blocks = doc[sectionIdx].columns[colIdx].blocks;
    if (target < 0 || target >= blocks.length) return;
    const next = [...doc];
    const arr = next[sectionIdx].columns[colIdx].blocks;
    [arr[blockIdx], arr[target]] = [arr[target], arr[blockIdx]];
    syncDoc(next);
  }

  // ── Drag & Drop ──
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeData = active.data.current as any;

    if (activeData?.type === "palette") {
      const overData = over.data.current as any;
      let targetSecIdx = overData?.sectionIdx;
      let targetColIdx = overData?.colIdx;

      if (overData?.type !== "column-drop") {
        // Fallback: find the nearest section and use its first column
        // Try to extract sectionIdx from the droppable id or find first section
        const overId = String(over.id);
        if (overId.startsWith("sd-")) {
          // Dropped on a section drop zone
          targetSecIdx = parseInt(overId.replace("sd-", ""));
          targetColIdx = 0;
        } else if (doc.length > 0) {
          // Last resort: just add to the last section's first column
          targetSecIdx = doc.length - 1;
          targetColIdx = 0;
        }
      }

      const insertIdx = overData?.blockIdx !== undefined ? overData.blockIdx : undefined;
      if (targetSecIdx !== undefined && targetColIdx !== undefined) {
        addBlockToColumn(targetSecIdx, targetColIdx, activeData.blockType as string, insertIdx);
      }
      return;
    }
  }

  // Close inline editing only when clicking outside the canvas area
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      // Clicking inside the canvas → keep editing active
      if (target.closest(".editor-canvas")) return;
      // Clicking palette or header → keep editing active
      if (target.closest(".editor-palette")) return;
      if (target.closest(".editor-canvas-header")) return;
      if (target.closest("[data-keep-edit]")) return;
      if (editingBlockPath !== null) {
        setEditingBlockPath(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [editingBlockPath]);

  const totalSections = doc.length;

  return (
    <div className="editor-panel" style={{
      display: "flex", gap: 0, border: "1px solid #e5e7eb",
      borderRadius: 8, overflow: "hidden", minHeight: 500,
    }}>
      {/* ── DndContext wraps both panels ── */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={() => {}} onDragEnd={handleDragEnd}>
        {/* ── LEFT PALETTE ── */}
        <div className="editor-palette"
          style={{ width: 240, flexShrink: 0, background: "#f8fafc", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #e5e7eb", fontSize: 13, fontWeight: 600, color: "#374151", background: "#fff" }}>
            🧩 Elements
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: 10 }}>
            {/* Block types */}
            <div style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Blocks
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {ALL_BLOCKS.map((def) => (
                <PaletteItem key={def.type} blockDef={def} />
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT CANVAS ── */}
        <div className="editor-canvas" style={{ flex: 1, background: "#f9fafb", minHeight: 500, display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div className="editor-canvas-header" data-keep-edit="true"
            style={{ padding: "10px 16px", borderBottom: "1px solid #e5e7eb", fontSize: 12, color: "#6b7280", background: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
            <span>👁️ <strong>{totalSections} section{totalSections > 1 ? "s" : ""}</strong></span>
            <span style={{ color: "#d1d5db" }}>|</span>
            <span style={{ color: "#9ca3af", flex: 1 }}>
              {totalSections > 0 ? "Drag blocks from left panel into columns" : "Start by adding a section"}
            </span>
            {/* Preview mode buttons */}
            <div style={{ display: "flex", gap: 2, marginRight: 8 }}>
              {[
                { mode: "desktop" as const, icon: "🖥️", label: "Desktop" },
                { mode: "tablet" as const, icon: "📲", label: "Tablet" },
                { mode: "mobile" as const, icon: "📱", label: "Mobile" },
              ].map(({ mode, icon, label }) => (
                <button key={mode} type="button" onClick={() => setPreviewMode(mode)}
                  style={{
                    padding: "4px 8px", fontSize: 11, cursor: "pointer", lineHeight: 1,
                    background: previewMode === mode ? "#eff6ff" : "transparent",
                    border: previewMode === mode ? "1px solid #93c5fd" : "1px solid transparent",
                    borderRadius: 4, color: previewMode === mode ? "#2563eb" : "#94a3b8",
                    opacity: previewMode === mode ? 1 : 0.6,
                    transition: "all 0.15s",
                  }} title={label}>
                    {icon}
                  </button>
              ))}
            </div>
            {/* Navigator toggle */}
            <button type="button" onClick={() => setShowNavigator(!showNavigator)}
              style={{
                padding: "4px 10px", fontSize: 11, cursor: "pointer",
                background: showNavigator ? "#eff6ff" : "transparent",
                border: showNavigator ? "1px solid #93c5fd" : "1px solid #e2e8f0",
                borderRadius: 4, color: showNavigator ? "#2563eb" : "#64748b",
              }}>
              📋 {showNavigator ? "◀" : "▶"}
            </button>
          </div>

          {/* Canvas body */}
          <div style={{ flex: 1, overflow: "auto" }}>
            <div style={{ display: "flex", gap: showNavigator ? 16 : 0 }}>
              {/* Navigator panel */}
              {showNavigator && (
                <div style={{
                  width: 220, flexShrink: 0,
                  background: "#fff", borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  alignSelf: "flex-start",
                  position: "sticky", top: 0,
                }}>
                  <div style={{ padding: "8px 10px", borderBottom: "1px solid #e2e8f0", fontSize: 11, fontWeight: 600, color: "#374151", background: "#f8fafc" }}>
                    📋 Page Structure
                  </div>
                  <Navigator
                    doc={doc}
                    editingBlockPath={editingBlockPath}
                    onSelectBlock={(path) => setEditingBlockPath(path)}
                    onMoveSection={(fromIdx, toIdx) => moveSection(fromIdx, toIdx)}
                    onMoveBlock={(source, target) => moveBlock(source, target)}
                  />
                </div>
              )}

              {/* Sections area */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden", minHeight: 300,
                  maxWidth: previewMode === "tablet" ? 768 : previewMode === "mobile" ? 375 : undefined,
                  margin: previewMode !== "desktop" ? "0 auto" : undefined,
                }}>

                  {/* Render sections */}
                  {doc.map((section, sectionIdx) => (
                    <SectionRenderer
                      key={section.id}
                      section={section}
                      sectionIdx={sectionIdx}
                      previewMode={previewMode}
                      onUpdateSection={(updated) => updateSection(sectionIdx, updated)}
                      onDeleteSection={() => deleteSection(sectionIdx)}
                      onMoveUp={() => moveSection(sectionIdx, sectionIdx - 1)}
                      onMoveDown={() => moveSection(sectionIdx, sectionIdx + 1)}
                      canMoveUp={sectionIdx > 0}
                      canMoveDown={sectionIdx < doc.length - 1}
                      onAddBlockToColumn={(colIdx, blockType) => addBlockToColumn(sectionIdx, colIdx, blockType)}
                      onUpdateBlockInColumn={(colIdx, blockIdx, data) => updateBlockInColumn(sectionIdx, colIdx, blockIdx, data)}
                      onDeleteBlockFromColumn={(colIdx, blockIdx) => deleteBlockFromColumn(sectionIdx, colIdx, blockIdx)}
                      onMoveBlockInColumn={(colIdx, blockIdx, dir) => moveBlockInColumn(sectionIdx, colIdx, blockIdx, dir)}
                      onOpenModal={(colIdx, block, blockIdx) => setShowModalFor({ colIdx, block, blockIdx, sectionIdx })}
                      editingBlockPath={editingBlockPath}
                      setEditingBlockPath={setEditingBlockPath}
                    />
                  ))}

              {/* Add Section button */}
              {showEmptyLayoutPicker ? (
                <div style={{ border: "2px dashed #3b82f6", borderRadius: 8, margin: "16px 0" }}>
                  <LayoutPicker onSelect={(layout) => addSection(layout)} />
                  <div style={{ textAlign: "center", padding: "0 0 12px" }}>
                    <button type="button" onClick={() => setShowEmptyLayoutPicker(false)}
                      style={{ padding: "4px 16px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: "pointer", fontSize: 12 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <button type="button" onClick={() => setShowEmptyLayoutPicker(true)}
                    style={{
                      padding: "10px 24px", border: "2px dashed #94a3b8", borderRadius: 8,
                      background: "transparent", cursor: "pointer", fontSize: 14, color: "#64748b",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#3b82f6"; (e.currentTarget as HTMLElement).style.color = "#3b82f6"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#94a3b8"; (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
                  >
                    ➕ Add Section
                  </button>
                </div>
              )}
            </div>
            </div>
            </div>
          </div>
        </div>
      </DndContext>

      {/* Complex Block Modal */}
      {showModalFor && (
        <ComplexBlockForm
          block={showModalFor.block}
          onSave={(data) => {
            updateBlockInColumn(showModalFor.sectionIdx, showModalFor.colIdx, showModalFor.blockIdx, data);
            setShowModalFor(null);
          }}
          onCancel={() => setShowModalFor(null)}
        />
      )}
    </div>
  );
}

// ================================================================
//  COMPLEX BLOCK FORM (modal for features, columns, etc.)
// ================================================================

function ComplexBlockForm({ block, onSave, onCancel }: { block: BlockData; onSave: (data: any) => void; onCancel: () => void }) {
  const def = BLOCK_MAP.get(block.type);
  const [data, setData] = useState({ ...block.data });

  const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "#374151" };

  // Close on Escape key only, not on backdrop click (prevents accidental close)
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 640, maxWidth: "90vw", maxHeight: "85vh", overflow: "auto" }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>{def?.icon} {def?.label}</h3>

        {(def?.fields || []).map(field => {
          const val = data[field.key] ?? "";
          return (
            <div key={field.key} style={{ marginBottom: 12 }}>
              <label style={labelStyle}>{field.label}</label>
              {field.type === "textarea" ? (
                <textarea value={val} onChange={e => setData({ ...data, [field.key]: e.target.value })}
                  rows={field.rows || 3} style={{ ...inputStyle, fontFamily: "monospace", fontSize: 13 }} />
              ) : field.type === "color" ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="color" value={val || "#000000"} onChange={e => setData({ ...data, [field.key]: e.target.value })}
                    style={{ width: 40, height: 40, border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer" }} />
                  <input type="text" value={val} onChange={e => setData({ ...data, [field.key]: e.target.value })} style={inputStyle} />
                </div>
              ) : field.type === "select" ? (
                <select value={val} onChange={e => setData({ ...data, [field.key]: e.target.value })} style={inputStyle}>
                  {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : field.type === "image" ? (
                <ImageFieldInline value={val} onChange={v => setData({ ...data, [field.key]: v })} />
              ) : (
                <input type="text" value={val} onChange={e => setData({ ...data, [field.key]: e.target.value })} style={inputStyle} />
              )}
            </div>
          );
        })}

        {/* Features sub-items */}
        {block.type === "features" && Array.isArray(data.items) && (
          <div style={{ marginTop: 12 }}>
            <label style={{ ...labelStyle, fontWeight: 600 }}>Feature Items</label>
            {data.items.map((item: any, i: number) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#6b7280", fontWeight: 600, flexShrink: 0 }}>{i + 1}</span>
                <input type="text" value={item.title} onChange={e => { const n = [...data.items]; n[i] = { ...n[i], title: e.target.value }; setData({ ...data, items: n }); }}
                  placeholder="Title" style={{ ...inputStyle, flex: 1 }} />
                <input type="text" value={item.desc} onChange={e => { const n = [...data.items]; n[i] = { ...n[i], desc: e.target.value }; setData({ ...data, items: n }); }}
                  placeholder="Description" style={{ ...inputStyle, flex: 2 }} />
                <button type="button" onClick={() => setData({ ...data, items: data.items.filter((_: any, j: number) => j !== i) })}
                  style={{ padding: "4px 10px", border: "1px solid #fca5a5", borderRadius: 4, background: "#fff", color: "#dc2626", cursor: "pointer", fontSize: 12 }}>✕</button>
              </div>
            ))}
            <button type="button" onClick={() => setData({ ...data, items: [...data.items, { title: "", desc: "" }] })}
              style={{ padding: "6px 14px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: "pointer", fontSize: 12 }}>+ Add Feature</button>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
          <button type="button" onClick={onCancel}
            style={{ padding: "8px 20px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", fontSize: 14, cursor: "pointer" }}>Cancel</button>
          <button type="button" onClick={() => onSave(data)}
            style={{ padding: "8px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Image field helper ──
function ImageFieldInline({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showBrowser, setShowBrowser] = useState(false);

  async function uploadFile(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/media/", { method: "POST", body: fd });
    if (res.ok) {
      const m = await res.json();
      onChange(m.url);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {value && <img src={value} alt="" style={{ width: 64, height: 64, borderRadius: 6, objectFit: "cover" }} />}
      {!value && <div style={{ width: 64, height: 64, borderRadius: 6, background: "#f3f4f6", flexShrink: 0 }} />}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) { uploadFile(f); if (fileRef.current) fileRef.current.value = ""; } }} />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button type="button" onClick={() => fileRef.current?.click()}
          style={{ padding: "6px 14px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 12 }}>
          📁 Upload
        </button>
        <button type="button" onClick={() => setShowBrowser(true)}
          style={{ padding: "6px 14px", border: "1px solid #d1d5db", borderRadius: 6, background: "#f8fafc", cursor: "pointer", fontSize: 12 }}>
          🖼️ Browse Media
        </button>
        {value &&
          <button type="button" onClick={() => onChange("")}
            style={{ padding: "6px 12px", border: "none", background: "transparent", color: "#dc2626", cursor: "pointer", fontSize: 12 }}>
            Clear
          </button>}
      </div>

      {showBrowser && (
        <MediaBrowser
          onSelect={(url) => {
            onChange(url);
            setShowBrowser(false);
          }}
          onClose={() => setShowBrowser(false)}
        />
      )}
    </div>
  );
}
