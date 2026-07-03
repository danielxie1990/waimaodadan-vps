export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { renderPage, renderPageMeta } from "@/lib/page-renderer";
import { getLocaleFromHeaders } from "@/lib/locale";

export async function generateMetadata({ searchParams }: { searchParams: { __locale?: string } }): Promise<Metadata> {
  const locale = getLocaleFromHeaders(searchParams);
  return await renderPageMeta("home", locale);
}

export default async function HomePage({ searchParams }: { searchParams: { __locale?: string } }) {
  const locale = getLocaleFromHeaders(searchParams);
  return renderPage("home", locale);
}
