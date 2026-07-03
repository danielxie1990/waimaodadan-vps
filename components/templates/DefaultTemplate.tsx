// ========================================================================
// 默认模板：标准内容布局（无侧边栏）
// ========================================================================

interface DefaultTemplateProps {
  children: React.ReactNode;
  templateSlug?: string;
  pageId?: number;
  pageType?: "page" | "product" | "post";
}

export function DefaultTemplate({ children }: DefaultTemplateProps) {
  return (
    <div className="page-content">
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
        {children}
      </div>
    </div>
  );
}
