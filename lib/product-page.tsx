import { getPublishedProducts } from "@/lib/db";
import { getLocaleFromHeaders } from "@/lib/locale";
import { getSiteSettings } from "@/lib/db";
import React from "react";

// Shared export: renders the product listing for any route
export async function renderProductListingPage(locale?: string) {
  const settings = await getSiteSettings();
  const productLabel = settings.product_label || "Products";
  const allProducts = await getPublishedProducts(locale);

  const { default: ProductGrid } = await import("@/app/products/ProductGrid");

  const PAGE_SIZE = 12;
  const total = allProducts.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const products = allProducts.slice(0, PAGE_SIZE);

  return <ProductGrid products={products} currentPage={1} totalPages={totalPages} total={total} locale={locale || "en"} />;
}
