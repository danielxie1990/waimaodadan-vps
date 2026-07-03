// ========================================================================
// PageShell - 模板动态选择器
//
// 用法：
//   import { PageShell } from "@/components/templates";
//
//   <PageShell template="default" pageId={1} pageType="page">
//     <h1>页面内容</h1>
//   </PageShell>
//
// 如果未指定 template，默认使用 "default"
// pageId / pageType 用于登录后显示编辑按钮
// ========================================================================

import type { TemplateSlug } from "./registry";
import { DefaultTemplate } from "./DefaultTemplate";
import { BlankTemplate } from "./BlankTemplate";
import { MinimalTemplate } from "./MinimalTemplate";
import { FullWidthTemplate } from "./FullWidthTemplate";

interface PageShellProps {
  template?: TemplateSlug;
  children: React.ReactNode;
  pageId?: number;
  pageType?: "page" | "product" | "post";
}

const templateComponents: Record<
  TemplateSlug,
  React.ComponentType<{
    children: React.ReactNode;
    templateSlug?: string;
    pageId?: number;
    pageType?: "page" | "product" | "post";
  }>
> = {
  default: DefaultTemplate,
  blank: BlankTemplate,
  minimal: MinimalTemplate,
  "full-width": FullWidthTemplate,
};

const FallbackTemplate = DefaultTemplate;

export function PageShell({ template = "default", children, pageId, pageType }: PageShellProps) {
  const Template = templateComponents[template] ?? FallbackTemplate;
  return (
    <Template templateSlug={template} pageId={pageId} pageType={pageType}>
      {children}
    </Template>
  );
}
