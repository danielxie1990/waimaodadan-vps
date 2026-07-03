export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getAllProductSlugs, getSiteSettings } from "@/lib/db";
import { getLocaleFromHeaders } from "@/lib/locale";
import ProductDetailClient from "./ProductDetailClient";

export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params, searchParams }: { params: { slug: string }; searchParams: { __locale?: string } }): Promise<Metadata> {
  const locale = getLocaleFromHeaders(searchParams);
  const product = await getProductBySlug(params.slug, locale);
  if (!product) return {};
  const settings = await getSiteSettings();
  return {
    title: (product.metaTitle || product.title) + " | " + settings.site_name,
    description: product.metaDesc || undefined,
  };
}

export default async function ProductPage({ params, searchParams }: { params: { slug: string }; searchParams: { __locale?: string } }) {
  const locale = getLocaleFromHeaders(searchParams);
  const product = await getProductBySlug(params.slug, locale);
  if (!product) return notFound();
  const settings = await getSiteSettings();

  return <ProductDetailClient product={JSON.parse(JSON.stringify(product))} settings={settings} locale={locale} />;
}
