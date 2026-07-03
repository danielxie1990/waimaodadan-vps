// ========================================================================
// 简约模板：带侧边栏 + 窄内容区
// 侧边栏显示子导航/分类/联系信息
// 适合：产品分类页、帮助中心、博客归档
// ========================================================================

"use client";

import { useState } from "react";
import { PublicSidebar } from "./PublicSidebar";

interface MinimalTemplateProps {
  children: React.ReactNode;
  templateSlug?: string;
  pageId?: number;
  pageType?: "page" | "product" | "post";
}

export function MinimalTemplate({ children, templateSlug, pageId, pageType }: MinimalTemplateProps) {
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
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 20px",
          gap: 32,
        }}
      >
        {/* 侧边栏 */}
        <aside className={`public-sidebar${sidebarOpen ? " open" : ""}`}>
          <PublicSidebar />
        </aside>

        {/* 内容区 */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
