import { getPageBySlug, getSiteSettings } from "./db";
import { notFound } from "next/navigation";
import { renderBlocks } from "@/components/blocks/server-renderer";
import { PageShell } from "@/components/templates";
import type { TemplateSlug } from "@/components/templates/registry";
import { getLocaleFromHeaders } from "./locale";

export async function renderPage(
  slug: string,
  locale?: string,
  searchParams?: { __locale?: string }
) {
  const loc = locale || getLocaleFromHeaders(searchParams);
  const page = await getPageBySlug(slug, loc);
  if (!page) return notFound();

  const templateSlug = (page.templateSlug ?? "default") as TemplateSlug;

  let content = null;
  if (page.content) {
    if (page.content.trim().startsWith("[")) {
      try {
        content = await renderBlocks(JSON.parse(page.content));
      } catch {}
    } else {
      content = (
        <div
          className="elementor-content rich-content"
          id="wp-content"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      );
    }
  }

  return (
    <PageShell template={templateSlug} pageId={page.id} pageType="page">
      {content ?? (
        <div
          className="container"
          style={{ padding: "60px 0", textAlign: "center" }}
        >
          <h1 style={{ fontSize: 28, marginBottom: 16 }}>{page.title}</h1>
          <p style={{ color: "#6b7280" }}>Content pending update.</p>
        </div>
      )}
    </PageShell>
  );
}

export async function renderPageMeta(
  slug: string,
  locale?: string,
  searchParams?: { __locale?: string }
): Promise<{ title: string; description?: string }> {
  const loc = locale || getLocaleFromHeaders(searchParams);
  const settings = await getSiteSettings();
  const page = await getPageBySlug(slug, loc);
  if (!page) return { title: "Page Not Found" };
  return {
    title: page.metaTitle || `${page.title} | ${settings.site_name}`,
    description: page.metaDesc || undefined,
  };
}
