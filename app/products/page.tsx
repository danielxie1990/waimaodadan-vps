export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getPublishedProducts, getPageBySlug, getSiteSettings } from "@/lib/db";
import { getLocaleFromHeaders } from "@/lib/locale";
import ProductGrid from "./ProductGrid";
import { PageShell } from "@/components/templates";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const label = settings.product_label || "Products";
  return {
    title: `${label} | ${settings.site_name}`,
    description: `Browse our complete range of ${label.toLowerCase()}.`,
  };
}

const PAGE_SIZE = 12;

export default async function TinContainersPage({
  searchParams,
}: {
  searchParams: { page?: string; __locale?: string };
}) {
  const locale = getLocaleFromHeaders(searchParams);
  const allProducts = await getPublishedProducts(locale);
  const page = Math.max(1, parseInt(searchParams.page || "1") || 1);
  const total = allProducts.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const products = allProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 从 pages 表读取模板设置
  const cmsPage = await getPageBySlug("tin-containers", locale);
  const templateSlug = (cmsPage?.templateSlug ?? "default") as string;

  return (
    <PageShell template={templateSlug as any} pageId={cmsPage?.id} pageType="page">
      <ProductGrid
        products={products}
        currentPage={page}
        totalPages={totalPages}
        total={total}
        locale={locale}
      />
    </PageShell>
  );
}
