export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { renderPage, renderPageMeta } from "@/lib/page-renderer";
import { getLocaleFromHeaders } from "@/lib/locale";
import { getSiteSettings } from "@/lib/db";

type Props = { params: { slug: string }; searchParams: { __locale?: string } };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const locale = getLocaleFromHeaders(searchParams);
  return await renderPageMeta(params.slug, locale);
}

export default async function Page({ params, searchParams }: Props) {
  const locale = getLocaleFromHeaders(searchParams);
  const { slug } = params;
  const settings = await getSiteSettings();

  const productRoute = settings.product_slug || "products";
  const categoryRoute = settings.category_slug || "categories";

  // If the slug is the product listing route, render the product listing
  if (slug === productRoute) {
    const { renderProductListingPage } = await import("@/lib/product-page");
    return renderProductListingPage(locale);
  }

  // Default: CMS page
  return renderPage(slug, locale);
}
