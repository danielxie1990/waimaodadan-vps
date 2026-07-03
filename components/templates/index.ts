// ========================================================================
// 模板系统 - 统一导出
//
// 外部只需：
//   import { PageShell, getTemplateOptions } from "@/components/templates";
// ========================================================================

export { PageShell } from "./PageShell";
export { templateRegistry, getTemplateOptions, getTemplate } from "./registry";
export type { TemplateSlug, TemplateDefinition } from "./registry";
