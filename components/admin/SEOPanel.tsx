"use client";

import { useMemo, useEffect } from "react";

interface SEOPanelProps {
  title: string;
  metaTitle: string;
  metaDesc: string;
  slug: string;
  targetKeyword: string;
  onMetaTitleChange: (v: string) => void;
  onMetaDescChange: (v: string) => void;
  onTargetKeywordChange: (v: string) => void;
}

const TITLE_MAX = 60;
const DESC_MAX = 160;

export default function SEOPanel({
  title, metaTitle, metaDesc, slug, targetKeyword,
  onMetaTitleChange, onMetaDescChange, onTargetKeywordChange,
}: SEOPanelProps) {
  const titleLen = metaTitle.length;
  const descLen = metaDesc.length;
  const titleOver = titleLen > TITLE_MAX;
  const descOver = descLen > DESC_MAX;

  // Auto-fill from keyword when targetKeyword changes
  useEffect(() => {
    if (!targetKeyword || metaTitle) return;
    const suggested = targetKeyword.charAt(0).toUpperCase() + targetKeyword.slice(1);
    onMetaTitleChange(suggested);
  }, [targetKeyword]);

  // SERP preview state
  const serpTitle = useMemo(() => {
    if (!metaTitle) return title || "Page Title";
    return metaTitle.length > 60 ? metaTitle.slice(0, 57) + "..." : metaTitle;
  }, [metaTitle, title]);

  const serpDesc = useMemo(() => {
    if (!metaDesc) return "Your page description will appear here...";
    return metaDesc.length > 160 ? metaDesc.slice(0, 157) + "..." : metaDesc;
  }, [metaDesc]);

  const serpUrl = useMemo(() => {
    const site = typeof window !== "undefined" ? window.location.hostname : "yoursite.com";
    return `${site}${slug.startsWith("/") ? slug : "/" + slug}`;
  }, [slug]);

  const completedCount = useMemo(() => {
    let count = 0;
    if (targetKeyword) count++;
    if (metaTitle && !titleOver) count++;
    if (metaDesc && !descOver) count++;
    if (slug && slug.length > 2) count++;
    return count;
  }, [targetKeyword, metaTitle, metaDesc, slug, titleOver, descOver]);

  return (
    <div>
      {/* SEO Score bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
            SEO Checklist
          </span>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            {completedCount}/4 completed
          </span>
        </div>
        <div style={{ height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 3,
            width: `${(completedCount / 4) * 100}%`,
            background: completedCount === 4 ? "#22c55e" : completedCount >= 2 ? "#eab308" : "#ef4444",
            transition: "width 0.3s, background 0.3s",
          }} />
        </div>
      </div>

      {/* 1. Target Keyword */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: targetKeyword ? "#22c55e" : "#374151" }}>
            {targetKeyword ? "✅" : "⬜"} 1. Target Keyword
          </span>
        </div>
        <input
          type="text"
          value={targetKeyword}
          onChange={(e) => onTargetKeywordChange(e.target.value)}
          placeholder="e.g. custom tin boxes"
          style={{
            width: "100%", padding: "8px 12px", border: "1px solid #d1d5db",
            borderRadius: 6, fontSize: 14, boxSizing: "border-box",
          }}
        />
        {targetKeyword && (
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
            Will auto-suggest Meta Title (you can edit it below)
          </div>
        )}
      </div>

      {/* 2. Meta Title */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: metaTitle && !titleOver ? "#22c55e" : "#374151" }}>
            {metaTitle && !titleOver ? "✅" : metaTitle ? "⚠️" : "⬜"} 2. Meta Title
          </span>
        </div>
        <input
          type="text"
          value={metaTitle}
          onChange={(e) => onMetaTitleChange(e.target.value)}
          placeholder={targetKeyword ? `e.g. ${targetKeyword} | Your Brand` : "Enter meta title..."}
          style={{
            width: "100%", padding: "8px 12px", border: `1px solid ${titleOver ? "#ef4444" : "#d1d5db"}`,
            borderRadius: 6, fontSize: 14, boxSizing: "border-box",
          }}
        />
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 2, fontSize: 11,
        }}>
          <span style={{ color: titleOver ? "#ef4444" : "#6b7280" }}>
            {titleLen}/{TITLE_MAX} characters
            {titleOver ? " ⚠️ Too long! Will be truncated in search." : ""}
            {!titleOver && titleLen > 50 ? " Good length." : ""}
          </span>
          {metaTitle && targetKeyword && (
            <span style={{ color: metaTitle.toLowerCase().includes(targetKeyword.toLowerCase()) ? "#22c55e" : "#eab308" }}>
              {metaTitle.toLowerCase().includes(targetKeyword.toLowerCase())
                ? "✅ Keyword found"
                : "⚠️ Keyword not in title"}
            </span>
          )}
        </div>
      </div>

      {/* 3. Meta Description */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: metaDesc && !descOver ? "#22c55e" : "#374151" }}>
            {metaDesc && !descOver ? "✅" : metaDesc ? "⚠️" : "⬜"} 3. Meta Description
          </span>
        </div>
        <textarea
          value={metaDesc}
          onChange={(e) => onMetaDescChange(e.target.value)}
          placeholder="Describe what this page is about..."
          rows={2}
          style={{
            width: "100%", padding: "8px 12px", border: `1px solid ${descOver ? "#ef4444" : "#d1d5db"}`,
            borderRadius: 6, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit",
            resize: "vertical",
          }}
        />
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 2, fontSize: 11,
        }}>
          <span style={{ color: descOver ? "#ef4444" : "#6b7280" }}>
            {descLen}/{DESC_MAX} characters
            {descOver ? " ⚠️ Too long!" : ""}
          </span>
          {metaDesc && targetKeyword && (
            <span style={{ color: metaDesc.toLowerCase().includes(targetKeyword.toLowerCase()) ? "#22c55e" : "#eab308" }}>
              {metaDesc.toLowerCase().includes(targetKeyword.toLowerCase())
                ? "✅ Keyword found"
                : "⚠️ Keyword not in description"}
            </span>
          )}
        </div>
      </div>

      {/* 4. Slug */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: slug && slug.length > 2 ? "#22c55e" : "#374151" }}>
            {slug && slug.length > 2 ? "✅" : "⬜"} 4. URL Slug
          </span>
        </div>
        <div style={{
          padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6,
          fontSize: 13, color: "#6b7280", background: "#f8fafc",
        }}>
          /{slug}
        </div>
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
          {slug.includes("_") && "⚠️ Use hyphens, not underscores. "}
          {slug.length > 60 && "⚠️ Slug is very long. "}
          {slug.match(/^\d/) && "⚠️ Avoid starting with numbers. "}
        </div>
      </div>

      {/* SERP Preview */}
      <div style={{
        background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8,
        padding: "12px 16px", marginBottom: 12,
      }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          🔍 Google SERP Preview
        </div>
        <div style={{ fontFamily: "arial, sans-serif" }}>
          {/* URL */}
          <div style={{ fontSize: 12, color: "#1a0dab", marginBottom: 1 }}>{serpUrl}</div>
          {/* Title */}
          <div style={{
            fontSize: 18, fontWeight: 400, color: "#1a0dab", lineHeight: 1.3,
            marginBottom: 2, cursor: "pointer",
          }}>
            {serpTitle}
          </div>
          {/* Description */}
          <div style={{ fontSize: 14, color: "#4d5156", lineHeight: 1.58 }}>
            {serpDesc}
          </div>
        </div>
      </div>

      {/* Tips */}
      {completedCount < 4 && (
        <div style={{ fontSize: 12, color: "#6b7280", borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
          <strong>💡 Tips:</strong>
          <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
            {!targetKeyword && <li>Start by entering a target keyword</li>}
            {targetKeyword && !metaTitle && <li>Meta Title will be auto-suggested from your keyword</li>}
            {targetKeyword && metaTitle && !titleOver && <li>Meta Title looks good!</li>}
            {metaTitle && !metaDesc && <li>Write a meta description that includes your keyword</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
