"use client";

import { useState } from "react";
import type { PageDocument, BlockData } from "@/lib/block-types";
import { LAYOUT_PRESETS } from "@/lib/block-types";
import { BLOCK_MAP } from "@/components/blocks/definitions";

// Keep a local icon map for blocks missing from BLOCK_MAP
const FALLBACK_ICONS: Record<string, string> = {
  heading: "🔤",
  text: "📝",
  image: "🖼️",
  hero: "🖼️",
  text_image: "📸",
  features: "⭐",
  products: "📦",
  posts: "✏️",
  cta: "📢",
  spacer: "␣",
  columns: "📐",
  form: "📋",
  divider: "➖",
  button: "🔘",
};

interface NavigatorProps {
  doc: PageDocument;
  editingBlockPath: string | null;
  onSelectBlock: (path: string | null) => void;
  onMoveSection: (fromIdx: number, toIdx: number) => void;
  onMoveBlock: (source: { sectionIdx: number; colIdx: number; blockIdx: number }, target: { sectionIdx: number; colIdx: number; blockIdx: number }) => void;
}

export default function Navigator({ doc, editingBlockPath, onSelectBlock, onMoveSection, onMoveBlock }: NavigatorProps) {
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  if (doc.length === 0) {
    return (
      <div style={{ padding: 12, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>
        No sections yet
      </div>
    );
  }

  // Shared handler for dragOver - shows guide line and prevents default
  function handleDragOver(e: React.DragEvent, key: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverKey !== key) setDragOverKey(key);
  }

  function handleDragLeave(e: React.DragEvent, key: string) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverKey((prev) => prev === key ? null : prev);
    }
  }

  return (
    <div style={{ padding: "4px 0", fontSize: 12 }}>
      {doc.map((section, sectionIdx) => {
        const preset = LAYOUT_PRESETS.find(p => p.value === section.layout);
        const isSelected = editingBlockPath === `section-${sectionIdx}`;
        const blockCount = section.columns.reduce((sum, col) => sum + col.blocks.length, 0);
        const sectionKey = `section-${sectionIdx}`;

        return (
          <div key={section.id} style={{ borderBottom: "1px solid #f1f5f9", userSelect: "none" }}>
            {/* Section header row - draggable + droppable */}
            <div
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", String(sectionIdx));
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => handleDragOver(e, sectionKey)}
              onDragLeave={(e) => handleDragLeave(e, sectionKey)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverKey(null);
                // Section-to-section drop
                const fromIdx = parseInt(e.dataTransfer.getData("text/plain"));
                if (!isNaN(fromIdx) && fromIdx !== sectionIdx) {
                  onMoveSection(fromIdx, sectionIdx);
                  return;
                }
                // Block-to-section drop
                try {
                  const data = JSON.parse(e.dataTransfer.getData("application/json"));
                  if (data.type === "block") {
                    const cols = doc[sectionIdx].columns;
                    if (cols.length > 0) {
                      onMoveBlock(
                        { sectionIdx: data.sectionIdx, colIdx: data.colIdx, blockIdx: data.blockIdx },
                        { sectionIdx, colIdx: 0, blockIdx: cols[0].blocks.length }
                      );
                    }
                  }
                } catch {}
              }}
              onClick={() => onSelectBlock(`section-${sectionIdx}`)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                cursor: "pointer",
                background: isSelected ? "#eff6ff" : "transparent",
                borderLeft: isSelected ? "3px solid #3b82f6" : "3px solid transparent",
                ...(dragOverKey === sectionKey ? { boxShadow: "inset 0 2px 0 #3b82f6" } : {}),
                transition: "box-shadow 0.1s",
              }}
            >
              <span style={{ color: "#94a3b8", cursor: "grab", fontSize: 14, lineHeight: 1, flexShrink: 0 }}>⠿</span>
              <span style={{ flexShrink: 0 }}>📐</span>
              <span style={{ fontWeight: 500, color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {preset?.label || section.layout}
              </span>
              <span style={{ fontSize: 10, color: "#94a3b8", background: "#f1f5f9", padding: "1px 6px", borderRadius: 8, flexShrink: 0 }}>
                {blockCount}
              </span>
            </div>

            {/* Blocks inside */}
            {(isSelected || blockCount > 0) && (
              <div style={{ paddingLeft: 24 }}>
                {section.columns.map((col, colIdx) =>
                  col.blocks.map((content, blockIdx) => {
                    if (content.type === "section") {
                      return (
                        <div key={content.id} style={{ padding: "4px 8px", color: "#64748b", fontSize: 11, fontStyle: "italic" }}>
                          📐 Nested section
                        </div>
                      );
                    }
                    const block = content as BlockData;
                    const def = BLOCK_MAP.get(block.type);
                    const icon = def?.icon || FALLBACK_ICONS[block.type] || "📄";
                    const label = def?.label || block.type;
                    const blockPath = `s${sectionIdx}c${colIdx}b${blockIdx}`;
                    const isBlockSelected = editingBlockPath === blockPath;
                    const dropKey = `block-${sectionIdx}-${colIdx}-${blockIdx}`;
                    const preview = getBlockPreview(block);

                    return (
                      <div
                        key={block.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("application/json", JSON.stringify({ type: "block", sectionIdx, colIdx, blockIdx }));
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragOver={(e) => handleDragOver(e, dropKey)}
                        onDragLeave={(e) => handleDragLeave(e, dropKey)}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverKey(null);
                          try {
                            const data = JSON.parse(e.dataTransfer.getData("application/json"));
                            if (data.type === "block") {
                              const source = { sectionIdx: data.sectionIdx, colIdx: data.colIdx, blockIdx: data.blockIdx };
                              const target = { sectionIdx, colIdx, blockIdx };
                              if (source.sectionIdx === target.sectionIdx && source.colIdx === target.colIdx && source.blockIdx === target.blockIdx) return;
                              onMoveBlock(source, target);
                            }
                          } catch {}
                        }}
                        onClick={() => onSelectBlock(blockPath)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "3px 8px",
                          cursor: "grab",
                          borderRadius: 3,
                          background: isBlockSelected ? "#eff6ff" : "transparent",
                          color: isBlockSelected ? "#2563eb" : "#475569",
                          fontSize: 11,
                          fontWeight: isBlockSelected ? 500 : 400,
                          ...(dragOverKey === dropKey ? { boxShadow: "inset 0 2px 0 #3b82f6" } : {}),
                          transition: "box-shadow 0.1s",
                        }}
                        onMouseEnter={e => { if (!isBlockSelected) (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                        onMouseLeave={e => { if (!isBlockSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <span>{icon}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>
                          {preview || label}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function getBlockPreview(block: BlockData): string {
  const d = block.data || {};
  switch (block.type) {
    case "heading":
      return d.text || "Heading";
    case "text":
      const text = (d.content || "").replace(/<[^>]*>/g, "").trim();
      return text.slice(0, 40) || "Text";
    case "image":
      return d.alt || d.caption || "Image";
    case "hero":
      return d.title || "Hero";
    case "text_image":
      return d.image_alt || "Text & Image";
    case "features":
      return d.title || "Features";
    case "products":
      return d.title || "Products";
    case "posts":
      return d.title || "Blog Posts";
    case "cta":
      return d.title || "CTA";
    case "button":
      return d.text || "Button";
    case "columns":
      return `${d.columns || 2} Columns`;
    case "spacer":
      return `${d.height || 40}px spacer`;
    case "form":
      return d.title || "Form";
    case "divider":
      return "Divider";
    default:
      return "";
  }
}
