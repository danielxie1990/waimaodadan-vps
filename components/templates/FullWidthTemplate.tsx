// ========================================================================
// 全宽模板：带侧边栏 + 内容区占满
// 适合：报表、数据密集页面、大型列表页
// ========================================================================

"use client";

import { useState } from "react";
import { PublicSidebar } from "./PublicSidebar";

interface FullWidthTemplateProps {
  children: React.ReactNode;
  templateSlug?: string;
  pageId?: number;
  pageType?: "page" | "product" | "post";
}

export function FullWidthTemplate({ children, templateSlug, pageId, pageType }: FullWidthTemplateProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="page-content" style={{ background: "#f8fafc" }}>
      {/* Mobile sidebar toggle */}
      <button
        className="public-sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {sidebarOpen ? "✕" : "☰ 导航"}
      </button>

      {/* Mobile overlay */}
      <div
        className={`public-sidebar-overlay${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div
        style={{
          display: "flex",
          padding: "40px 20px",
          gap: 32,
        }}
      >
        {/* 侧边栏 */}
        <aside className={`public-sidebar${sidebarOpen ? " open" : ""}`}>
          <PublicSidebar />
        </aside>

        {/* 内容区 - 不限制宽度 */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
