"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import UnderlineExtension from "@tiptap/extension-underline";
import PlaceholderExtension from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { TextAlign } from "@tiptap/extension-text-align";
import { Highlight } from "@tiptap/extension-highlight";
import { FontFamily } from "@tiptap/extension-font-family";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";

// ─── Props ──────────────────────────────────────
interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  disableImageUpload?: boolean;
}

// ─── Constants ──────────────────────────────────
const FONT_SIZES = [
  "12","14","16","18","20","24","28","32","36","48",
];

const FONT_FAMILIES = [
  { label: "默认", value: "" },
  { label: "宋体", value: "SimSun, serif" },
  { label: "黑体", value: "SimHei, sans-serif" },
  { label: "微软雅黑", value: "'Microsoft YaHei', sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Georgia", value: "Georgia, serif" },
];

const COLORS = [
  "#000000","#434343","#666666","#999999","#b7b7b7","#cccccc","#d9d9d9","#efefef","#f3f3f3","#ffffff",
  "#980000","#ff0000","#ff9900","#ffff00","#00ff00","#00ffff","#4a86e8","#0000ff","#9900ff","#ff00ff",
  "#e6b8af","#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#c9daf8","#cfe2f3","#d9d2e9","#ead1dc",
  "#dd7e6b","#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#a4c2f4","#9fc5e8","#b4a7d6","#d5a6bd",
  "#cc4125","#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6d9eeb","#6fa8dc","#8e7cc3","#c27ba0",
  "#a61c00","#cc0000","#e69138","#f1c232","#6aa84f","#45818e","#3c78d8","#3d85c6","#674ea7","#a64d79",
  "#85200c","#990000","#b45f06","#bf9000","#38761d","#134f5c","#1155cc","#0b5394","#351c75","#741b47",
  "#5b0f00","#660000","#783f04","#7f6000","#274e13","#0c343d","#1c4587","#073763","#20124d","#4c1130",
];

const TABLE_ITEMS = [
  { label: "上方插入行", action: "addRowBefore" },
  { label: "下方插入行", action: "addRowAfter" },
  { type: "divider" },
  { label: "左侧插入列", action: "addColumnBefore" },
  { label: "右侧插入列", action: "addColumnAfter" },
  { type: "divider" },
  { label: "删除行", action: "deleteRow" },
  { label: "删除列", action: "deleteColumn" },
  { label: "删除表格", action: "deleteTable" },
  { type: "divider" },
  { label: "合并单元格", action: "mergeCells" },
  { label: "拆分单元格", action: "splitCell" },
  { type: "divider" },
  { label: "切换表头行", action: "toggleHeaderRow" },
  { label: "切换表头列", action: "toggleHeaderColumn" },
];

// ─── Toolbar Button (leaf, no hooks) ───────────
function TBtn({ onClick, active, label, tip, sx }: {
  onClick: () => void;
  active?: boolean;
  label: React.ReactNode;
  tip?: string;
  sx?: React.CSSProperties;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      title={tip}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "5px 10px",
        border: "1px solid",
        borderColor: active ? "#3b82f6" : "transparent",
        borderRadius: 4,
        background: active ? "#eff6ff" : hover ? "#f1f5f9" : "transparent",
        color: active ? "#2563eb" : "#475569",
        cursor: "pointer",
        fontSize: 13,
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        transition: "all 0.1s",
        ...sx,
      }}
    >
      {label}
    </button>
  );
}

function TSep() {
  return <div style={{ width: 1, height: 24, background: "#e2e8f0", margin: "0 2px" }} />;
}

function TGroup({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginRight: 4 }}>
      {children}
    </span>
  );
}

// ─── Color Grid ────────────────────────────────
function ColorGrid({ onPick }: { onPick: (c: string) => void }) {
  return (
    <div style={{
      position: "absolute", top: "100%", left: 0, zIndex: 999,
      background: "#fff", borderRadius: 8, boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
      border: "1px solid #e5e7eb", padding: 10, width: 240,
      display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 3, marginTop: 2,
    }}>
      {COLORS.map((c) => (
        <button key={c} type="button" onClick={() => onPick(c)}
          style={{ width: 22, height: 22, background: c, border: c === "#ffffff" ? "1px solid #d1d5db" : "none", borderRadius: 3, cursor: "pointer" }} />
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────
export default function RichEditor({ value, onChange, placeholder, minHeight = 400, disableImageUpload }: Props) {
  // ── Hooks: ALL before conditional return ─────
  const fileRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [showColor, setShowColor] = useState(false);
  const [showBgColor, setShowBgColor] = useState(false);
  const [tableMenu, setTableMenu] = useState<{ x: number; y: number } | null>(null);
  const [dropdown, setDropdown] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      ImageExtension.configure({ inline: false, allowBase64: false }),
      LinkExtension.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      UnderlineExtension,
      PlaceholderExtension.configure({ placeholder }),
      TextStyle, Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      FontFamily,
      Table.configure({ resizable: true }), TableRow, TableCell, TableHeader,
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "rich-editor-content-v2",
        style: `min-height:${minHeight}px; padding:20px; max-width:800px; margin:0 auto; outline:none; line-height:1.8; font-size:15px; background:#fff;`,
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) { doUpload(event.dataTransfer.files[0]); return true; }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) { event.preventDefault(); const f = item.getAsFile(); if (f) doUpload(f); return true; }
        }
        return false;
      },
    },
  });

  // ── Effects ─────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setShowColor(false);
        setShowBgColor(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fullscreen) setFullscreen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [fullscreen]);

  // ── Upload ──────────────────────────────────
  const doUpload = useCallback(async (file: File) => {
    if (!editor || disableImageUpload) return;
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await fetch("/api/media/", { method: "POST", body: fd });
      if (res.ok) { const m = await res.json(); editor.chain().focus().setImage({ src: m.url, alt: m.alt }).run(); }
    } catch {}
  }, [editor, disableImageUpload]);

  // ── Link ────────────────────────────────────
  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("输入链接地址", prev || "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  // ── Table helpers ───────────────────────────
  const tableActions: Record<string, () => void> = {
    addRowBefore: () => editor?.chain().focus().addRowBefore().run(),
    addRowAfter: () => editor?.chain().focus().addRowAfter().run(),
    addColumnBefore: () => editor?.chain().focus().addColumnBefore().run(),
    addColumnAfter: () => editor?.chain().focus().addColumnAfter().run(),
    deleteRow: () => editor?.chain().focus().deleteRow().run(),
    deleteColumn: () => editor?.chain().focus().deleteColumn().run(),
    deleteTable: () => editor?.chain().focus().deleteTable().run(),
    mergeCells: () => editor?.chain().focus().mergeCells().run(),
    splitCell: () => editor?.chain().focus().splitCell().run(),
    toggleHeaderRow: () => editor?.chain().focus().toggleHeaderRow().run(),
    toggleHeaderColumn: () => editor?.chain().focus().toggleHeaderColumn().run(),
  };
  const runTableAction = useCallback((action: string) => {
    tableActions[action]?.();
    setTableMenu(null);
  }, [editor]);

  // ── Editor not ready ────────────────────────
  if (!editor) {
    return (
      <div style={{ border: "1px solid #d1d5db", borderRadius: 8, minHeight, background: "#fafbfc", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 14 }}>
        加载编辑器中...
      </div>
    );
  }

  const removeFormat = () => editor.chain().focus().clearNodes().unsetAllMarks().run();

  // ── Dropdown wrapper ────────────────────────
  const dd = (e: string) => setDropdown(dropdown === e ? null : e);
  const ddClose = () => setDropdown(null);

  // ── Editor stats ────────────────────────────
  const text = editor.getText();
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  // ── Render ──────────────────────────────────
  return (
    <div style={{
      border: "1px solid #d1d5db", borderRadius: 8, overflow: "hidden", background: "#f8fafc",
      display: "flex", flexDirection: "column",
      position: fullscreen ? "fixed" : "relative", top: fullscreen ? 0 : "auto",
      left: fullscreen ? 0 : "auto", right: fullscreen ? 0 : "auto", bottom: fullscreen ? 0 : "auto",
      zIndex: fullscreen ? 999 : "auto", height: fullscreen ? "100vh" : "auto",
    }}>
      {/* ═══ TOOLBAR ═══ */}
      <div style={{ display: "flex", flexDirection: "column", borderBottom: "1px solid #e2e8f0", background: "#fff", userSelect: "none" }}>
        {/* Row 1: Font / Style */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 2, padding: "6px 10px", alignItems: "center", borderBottom: "1px solid #f1f5f9" }}>
          <TGroup>字体</TGroup>

          {/* Font Family */}
          <Dropdown2 id="font" label="字体" open={dropdown} onToggle={dd} onClose={ddClose} width={180}>
            {FONT_FAMILIES.map((f) => (
              <DItem key={f.label} active={editor.getAttributes("textStyle").fontFamily === f.value}
                onClick={() => { f.value ? editor.chain().focus().setFontFamily(f.value).run() : editor.chain().focus().unsetFontFamily().run(); ddClose(); }}>
                <span style={{ fontFamily: f.value || "inherit" }}>{f.label}</span>
              </DItem>
            ))}
          </Dropdown2>

          {/* Font Size */}
          <Dropdown2 id="size" label={editor.getAttributes("textStyle").fontSize || "16"} open={dropdown} onToggle={dd} onClose={ddClose} width={80}>
            {FONT_SIZES.map((s) => (
              <DItem key={s} active={editor.getAttributes("textStyle").fontSize === s + "px"}
                onClick={() => { editor.chain().focus().setMark("textStyle", { fontSize: s + "px" }).run(); ddClose(); }}>
                <span style={{ fontSize: s + "px" }}>{s}</span>
              </DItem>
            ))}
          </Dropdown2>

          <TSep />
          <TBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} label={<b>加粗</b>} tip="Ctrl+B" />
          <TBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} label={<i>斜体</i>} tip="Ctrl+I" />
          <TBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} label={<u>下划线</u>} tip="Ctrl+U" />
          <TBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} label={<s>删除线</s>} />
          <TSep />

          {/* Color */}
          <div ref={colorRef} style={{ position: "relative", display: "inline-block" }}>
            <TBtn onClick={() => { setShowColor(!showColor); setShowBgColor(false); }} active={showColor}
              label={<span style={{ display: "flex", alignItems: "center", gap: 3 }}>颜色<span style={{ width: 14, height: 14, borderRadius: 2, border: "1px solid #d1d5db", background: editor.getAttributes("textStyle").color || "#000", display: "inline-block" }} /></span>} />
            {showColor && <ColorGrid onPick={(c) => { editor.chain().focus().setColor(c).run(); setShowColor(false); }} />}
          </div>

          {/* Highlight */}
          <div style={{ position: "relative", display: "inline-block" }}>
            <TBtn onClick={() => { setShowBgColor(!showBgColor); setShowColor(false); }} active={showBgColor}
              label={<span style={{ background: "#fef08a", padding: "0 4px", borderRadius: 2 }}>高亮</span>} />
            {showBgColor && <ColorGrid onPick={(c) => { editor.chain().focus().toggleHighlight({ color: c }).run(); setShowBgColor(false); }} />}
          </div>

          <TBtn onClick={removeFormat} label="清除格式" />
          <div style={{ flex: 1 }} />
          <TBtn onClick={() => setFullscreen(!fullscreen)} label={fullscreen ? "⇱ 退出全屏" : "⇲ 全屏"} sx={{ color: fullscreen ? "#2563eb" : "#64748b" }} />
        </div>

        {/* Row 2: Paragraph / Insert */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 2, padding: "6px 10px", alignItems: "center" }}>
          <TGroup>段落</TGroup>

          <Dropdown2 id="heading" label="段落样式" open={dropdown} onToggle={dd} onClose={ddClose} width={160}>
            <DItem active={!editor.isActive("heading")} onClick={() => { editor.chain().focus().setParagraph().run(); ddClose(); }}>正文</DItem>
            <DItem active={editor.isActive("heading", { level: 1 })} onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); ddClose(); }}><span style={{ fontSize: 18, fontWeight: 700 }}>标题 1</span></DItem>
            <DItem active={editor.isActive("heading", { level: 2 })} onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); ddClose(); }}><span style={{ fontSize: 16, fontWeight: 700 }}>标题 2</span></DItem>
            <DItem active={editor.isActive("heading", { level: 3 })} onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); ddClose(); }}><span style={{ fontSize: 14, fontWeight: 600 }}>标题 3</span></DItem>
            <DItem active={editor.isActive("heading", { level: 4 })} onClick={() => { editor.chain().focus().toggleHeading({ level: 4 }).run(); ddClose(); }}><span style={{ fontSize: 14, fontWeight: 600 }}>标题 4</span></DItem>
          </Dropdown2>

          <TSep />
          <TBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} label="左对齐" />
          <TBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} label="居中" />
          <TBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} label="右对齐" />
          <TSep />
          <TBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} label="• 无序列表" />
          <TBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} label="1. 有序列表" />
          <TSep />
          <TBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} label="❝ 引用" />
          <TBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} label="</> 代码" />
          <TBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} label="— 分割线" />
          <TSep />
          <TGroup>插入</TGroup>
          <TBtn onClick={setLink} active={editor.isActive("link")} label="🔗 链接" />
          {!disableImageUpload && (
            <><TBtn onClick={() => fileRef.current?.click()} label="🖼 图片" /><input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e: any) => { const f = e.target.files?.[0]; if (f) doUpload(f); e.target.value = ""; }} /></>
          )}

          <Dropdown2 id="table" label="▦ 表格" open={dropdown} onToggle={dd} onClose={ddClose} width={180}>
            <DItem onClick={() => { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); ddClose(); }}>插入表格 (3×3)</DItem>
            {editor.isActive("table") && <>
              <div style={{ height: 1, background: "#e5e7eb", margin: "4px 0" }} />
              {TABLE_ITEMS.filter(i => (i as any).type !== "divider").map((item: any, idx) => (
                <DItem key={idx} onClick={() => runTableAction(item.action)}>{item.label}</DItem>
              ))}
            </>}
          </Dropdown2>
        </div>
      </div>

      {/* ═══ FLOATING TOOLBAR (on selection) ═══ */}
      <FloatingToolbar editor={editor} setLink={setLink} />

      {/* ═══ EDITOR ═══ */}
      <div style={{ flex: 1, overflowY: "auto", padding: fullscreen ? "20px 40px" : "0", background: fullscreen ? "#e5e7eb" : "transparent" }}>
        <EditorContent editor={editor} />
      </div>

      {/* ═══ STATUS BAR ═══ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 11, color: "#94a3b8" }}>
        <span>{charCount} 字符 | {wordCount} 词</span>
        <span>{disableImageUpload ? "" : "拖放图片 / Ctrl+V 粘贴 · "}{editor.isActive("table") ? "表格操作：右键单元格" : ""}</span>
        <span>HTML</span>
      </div>

      {/* ═══ TABLE CONTEXT MENU ═══ */}
      {tableMenu && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onClick={() => setTableMenu(null)} />
          <div style={{ position: "fixed", left: tableMenu.x, top: tableMenu.y, zIndex: 999, background: "#fff", borderRadius: 8, boxShadow: "0 8px 30px rgba(0,0,0,0.2)", border: "1px solid #e5e7eb", minWidth: 160, padding: "6px 0" }}>
            <div style={{ padding: "4px 14px 8px", fontSize: 10, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", borderBottom: "1px solid #f3f4f6" }}>表格操作</div>
            {TABLE_ITEMS.map((item: any, i) =>
              item.type === "divider" ? <div key={i} style={{ height: 1, background: "#f3f4f6", margin: "4px 0" }} /> :
              <button key={i} type="button" onClick={() => runTableAction(item.action)}
                style={{ display: "block", width: "100%", padding: "7px 14px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, textAlign: "left", color: "#374151" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>{item.label}</button>
            )}
          </div>
        </>
      )}

      <style>{STYLES}</style>
    </div>
  );
}

// ─── Dropdown (no hooks inside) ────────────────
function Dropdown2({ id, label, open, onToggle, onClose, width, children }: {
  id: string; label: string; open: string | null; onToggle: (id: string) => void; onClose: () => void; width?: number; children: React.ReactNode;
}) {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <TBtn onClick={() => onToggle(id)} label={label + (open === id ? " ▲" : " ▼")} active={open === id} />
      {open === id && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onClick={onClose} />
          <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 999, background: "#fff", borderRadius: 8, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", border: "1px solid #e5e7eb", minWidth: width || 140, padding: "4px 0", marginTop: 2 }}>
            {children}
          </div>
        </>
      )}
    </div>
  );
}

function DItem({ onClick, active, children }: {
  onClick: () => void; active?: boolean; children: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "block", width: "100%", padding: "7px 14px", border: "none", background: active ? "#eff6ff" : hover ? "#f8fafc" : "transparent", cursor: "pointer", fontSize: 13, textAlign: "left", color: active ? "#2563eb" : "#374151" }}>
      {children}
    </button>
  );
}

// ─── Floating Toolbar ──────────────────────────
function FloatingToolbar({ editor, setLink }: { editor: any; setLink: () => void }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => {
      const { from, to } = editor.state.selection;
      if (from === to) { setVisible(false); return; }
      const { view } = editor;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);
      const editorEl = view.dom.closest("[class*='rich-editor-content']");
      const editorRect = editorEl?.getBoundingClientRect();
      if (!editorRect) return;
      const top = end.top - editorRect.top - 46;
      const left = (start.left + end.left) / 2 - editorRect.left - 100;
      setPos({ top: Math.max(top, 4), left: Math.max(left, 8) });
      setVisible(true);
    };
    editor.on("selectionUpdate", handler);
    return () => editor.off("selectionUpdate", handler);
  }, [editor]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setVisible(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!visible) return null;

  const FBtn = ({ onClick, active, children }: { onClick: () => void; active?: boolean; children: React.ReactNode }) => (
    <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); editor.commands.focus(); }}
      style={{ padding: "4px 8px", border: active ? "1px solid #3b82f6" : "1px solid transparent", borderRadius: 4, background: active ? "#eff6ff" : "transparent", color: active ? "#2563eb" : "#475569", cursor: "pointer", fontSize: 13, lineHeight: 1.3, whiteSpace: "nowrap" }}>
      {children}
    </button>
  );

  return (
    <div ref={menuRef} style={{ position: "absolute", top: pos.top, left: pos.left, zIndex: 100, display: "flex", gap: 2, background: "#fff", borderRadius: 8, boxShadow: "0 8px 30px rgba(0,0,0,0.2)", border: "1px solid #e5e7eb", padding: "4px 6px" }}>
      <FBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}><b>加粗</b></FBtn>
      <FBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}><i>斜体</i></FBtn>
      <FBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")}><u>下划线</u></FBtn>
      <div style={{ width: 1, height: 20, background: "#e2e8f0", margin: "0 4px", alignSelf: "center" }} />
      <FBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>H2</FBtn>
      <FBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}>H3</FBtn>
      <div style={{ width: 1, height: 20, background: "#e2e8f0", margin: "0 4px", alignSelf: "center" }} />
      <FBtn onClick={setLink} active={editor.isActive("link")}>🔗 链接</FBtn>
    </div>
  );
}

// ─── CSS ────────────────────────────────────────
const STYLES = `
.rich-editor-content-v2 {
  outline: none;
  font-size: 15px;
  line-height: 1.8;
}
.rich-editor-content-v2 h1 {
  font-size: 28px; font-weight: 700; margin: 24px 0 12px; line-height: 1.3; color: #111;
}
.rich-editor-content-v2 h2 {
  font-size: 22px; font-weight: 700; margin: 20px 0 10px; line-height: 1.3; color: #1f2937;
}
.rich-editor-content-v2 h3 {
  font-size: 18px; font-weight: 600; margin: 16px 0 8px; line-height: 1.3;
}
.rich-editor-content-v2 h4 {
  font-size: 16px; font-weight: 600; margin: 12px 0 6px; line-height: 1.3;
}
.rich-editor-content-v2 p {
  margin: 0 0 10px; min-height: 1.5em;
}
.rich-editor-content-v2 ul,
.rich-editor-content-v2 ol {
  padding-left: 28px; margin: 10px 0;
}
.rich-editor-content-v2 li {
  margin-bottom: 4px;
}
.rich-editor-content-v2 img {
  max-width: 100%; height: auto; border-radius: 6px; margin: 16px 0; display: block;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.rich-editor-content-v2 a {
  color: #2563eb; text-decoration: underline; cursor: pointer;
}
.rich-editor-content-v2 a:hover {
  color: #1d4ed8;
}
.rich-editor-content-v2 blockquote {
  border-left: 4px solid #3b82f6; padding: 12px 20px; margin: 16px 0;
  color: #4b5563; background: #f8fafc; border-radius: 0 8px 8px 0; font-style: italic;
}
.rich-editor-content-v2 pre {
  background: #1e293b; color: #e2e8f0; padding: 16px 20px; border-radius: 8px;
  font-size: 13px; overflow-x: auto; margin: 16px 0; font-family: 'Fira Code', 'Consolas', monospace;
}
.rich-editor-content-v2 code {
  background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-size: 13px; color: #dc2626;
}
.rich-editor-content-v2 hr {
  border: none; border-top: 2px solid #e5e7eb; margin: 24px 0;
}
.rich-editor-content-v2 p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}
.rich-editor-content-v2 [style*="text-align: center"] { text-align: center; }
.rich-editor-content-v2 [style*="text-align: right"] { text-align: right; }
.rich-editor-content-v2 table {
  width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.rich-editor-content-v2 th,
.rich-editor-content-v2 td {
  border: 1px solid #d1d5db; padding: 10px 14px; text-align: left; vertical-align: top; min-width: 80px;
}
.rich-editor-content-v2 th {
  background: #f3f4f6; font-weight: 600; color: #1f2937;
}
.rich-editor-content-v2 td {
  background: #fff;
}
.rich-editor-content-v2 th:first-child,
.rich-editor-content-v2 td:first-child {
  border-left: 1px solid #d1d5db;
}
.rich-editor-content-v2 table .selectedCell {
  background: #e0f2fe;
}
`;
