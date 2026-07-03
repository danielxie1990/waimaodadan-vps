// ========================================================================
// 空白模板：全屏内容，无内外边距限制
// ========================================================================

interface BlankTemplateProps {
  children: React.ReactNode;
  templateSlug?: string;
  pageId?: number;
  pageType?: "page" | "product" | "post";
}

export function BlankTemplate({ children }: BlankTemplateProps) {
  return (
    <div className="page-content blank-template" style={{ minHeight: "100vh" }}>
      {children}
    </div>
  );
}
