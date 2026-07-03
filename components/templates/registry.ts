// ========================================================================
// 模板注册中心
// 所有模板在此统一注册，新增一个模板只需在这里加一条记录
// ========================================================================

export type TemplateSlug = "default" | "blank" | "minimal" | "full-width";

export interface TemplateDefinition {
  slug: TemplateSlug;
  name: string;
  description: string;
  hasSidebar: boolean;
  hasHeader: boolean;
  hasFooter: boolean;
  suitableFor: string[];
}

export const templateRegistry: Record<TemplateSlug, TemplateDefinition> = {
  default: {
    slug: "default",
    name: "默认模板（无侧边栏）",
    description: "标准内容布局。内容区居中显示，无侧边栏。适合大多数公开页（关于我们、隐私政策、博客等）。",
    hasSidebar: false,
    hasHeader: false,
    hasFooter: false,
    suitableFor: ["about", "privacy", "blog", "general"],
  },
  blank: {
    slug: "blank",
    name: "空白模板（无侧边栏）",
    description: "干净的全宽布局。无导航、无页脚。适合登录页、落地页、特殊营销页。",
    hasSidebar: false,
    hasHeader: false,
    hasFooter: false,
    suitableFor: ["login", "register", "landing", "error"],
  },
  minimal: {
    slug: "minimal",
    name: "简约模板（带侧边栏）",
    description: "带左侧导航侧边栏 + 内容区。适合产品分类页、帮助中心、需要导航的页面。",
    hasSidebar: true,
    hasHeader: false,
    hasFooter: false,
    suitableFor: ["category", "help", "docs", "navigation"],
  },
  "full-width": {
    slug: "full-width",
    name: "全宽模板（带侧边栏）",
    description: "带侧边栏，内容区无宽度限制撑满。适合数据密集的页面、看板页。",
    hasSidebar: true,
    hasHeader: false,
    hasFooter: false,
    suitableFor: ["report", "dashboard", "analytics"],
  },
};

/** 获取所有模板选项（供下拉/选择器使用） */
export function getTemplateOptions() {
  return Object.values(templateRegistry).map((t) => ({
    value: t.slug,
    label: t.name,
    description: t.description,
    hasSidebar: t.hasSidebar,
  }));
}

/** 根据 slug 获取模板定义 */
export function getTemplate(slug: string): TemplateDefinition | null {
  return templateRegistry[slug as TemplateSlug] ?? null;
}
