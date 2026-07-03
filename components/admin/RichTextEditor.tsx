"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useCallback } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  compact?: boolean;
}

// ─── Toolbar button style ───────────────────────
const tbBtn = (active: boolean = false): React.CSSProperties => ({
  padding: "4px 8px",
  border: active ? "1px solid #3b82f6" : "1px solid transparent",
  borderRadius: 4,
  background: active ? "#eff6ff" : "transparent",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
  color: active ? "#2563eb" : "#475569",
  lineHeight: 1,
  transition: "all 0.1s",
});

const tbSep: React.CSSProperties = {
  width: 1,
  height: 20,
  background: "#e2e8f0",
  margin: "0 4px",
};

export default function RichTextEditor({ value, onChange, placeholder, minHeight = 200, compact }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      Placeholder.configure({
        placeholder: placeholder || "Start typing...",
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync content and focus on compact mode
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (value !== currentHtml) {
      editor.commands.setContent(value || "");
    }
    if (compact) {
      editor.commands.focus();
    }
  }, [value, editor, compact]);

  // Set link
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Link URL", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return <div style={{ minHeight, border: "1px solid #e2e8f0", borderRadius: 6, background: "#fafbfc" }} />;

  return (
    <div style={compact ? { borderBottom: "2px solid #3b82f6" } : { border: "1px solid #e2e8f0", borderRadius: 6, overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 2,
        padding: compact ? "4px 6px" : "6px 8px",
        borderBottom: compact ? "1px solid #e2e8f0" : "1px solid #e2e8f0",
        background: "#f8fafc", alignItems: "center",
      }}>
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
          style={tbBtn(editor.isActive("bold"))} title="Bold"><strong>B</strong></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
          style={tbBtn(editor.isActive("italic"))} title="Italic"><em>I</em></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()}
          style={tbBtn(editor.isActive("underline"))} title="Underline"><u>U</u></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()}
          style={tbBtn(editor.isActive("strike"))} title="Strikethrough"><s>S</s></button>

        <div style={tbSep} />

        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          style={tbBtn(editor.isActive("heading", { level: 1 }))} title="H1">H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          style={tbBtn(editor.isActive("heading", { level: 2 }))} title="H2">H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          style={tbBtn(editor.isActive("heading", { level: 3 }))} title="H3">H3</button>

        <div style={tbSep} />

        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
          style={tbBtn(editor.isActive("bulletList"))} title="Bullet List">• List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}
          style={tbBtn(editor.isActive("orderedList"))} title="Ordered List">1. List</button>

        <div style={tbSep} />

        <button type="button" onClick={setLink}
          style={tbBtn(editor.isActive("link"))} title="Insert Link">🔗 Link</button>
        {editor.isActive("link") && (
          <button type="button" onClick={() => editor.chain().focus().unsetLink().run()}
            style={{ ...tbBtn(), color: "#dc2626" }} title="Remove Link">✕</button>
        )}

        <div style={tbSep} />

        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}
          style={tbBtn(editor.isActive("blockQuote"))} title="Blockquote">💬</button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()}
          style={tbBtn()} title="Horizontal Rule">—</button>

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 11, color: "#94a3b8" }}>
          {editor.storage.characterCount?.characters?.() || editor.getText().length} chars
        </span>
      </div>

      {/* Editor content */}
      <div style={{
        padding: compact ? "4px 8px" : "8px 12px",
        minHeight: compact ? Math.min(minHeight, 120) : minHeight,
        cursor: "text",
      }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
