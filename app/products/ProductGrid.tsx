"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cleanSlug, localizeUrl } from "@/lib/locale";
import OptimizedImage from "@/components/OptimizedImage";

interface ProductCategory {
  name: string;
  slug: string;
}

interface ProductImage {
  id: number;
  url: string;
  alt: string | null;
  sortOrder: number;
}

interface Product {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  categories: ProductCategory[];
  images: ProductImage[];
}

interface Props {
  products: Product[];
  currentPage: number;
  totalPages: number;
  total: number;
  locale?: string;
}

export default function ProductGrid({ products, currentPage, totalPages, total, locale = "en" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set("page", String(page));
    } else {
      params.delete("page");
    }
    const qs = params.toString();
    const base = localizeUrl("/tin-containers/", locale);
    router.push(qs ? `${base}?${qs}` : base);
  }

  function getPageNumbers(): (number | "...")[] {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }

  return (
    <div style={{ padding: "40px 0" }}>
      <div className="container">
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Our Products</h1>
        <p style={{ color: "#6b7280", marginBottom: 32 }}>
          Showing {(currentPage - 1) * 12 + 1}&ndash;{Math.min(currentPage * 12, total)} of {total} products
        </p>

        <div className="product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 }}>
          {products.map((product) => {
            const thumb = product.image || product.images?.[0]?.url || null;
            const cleanSlugVal = cleanSlug(product.slug);
            return (
              <Link
                key={product.id}
                href={localizeUrl(`/tin-containers/${cleanSlugVal}`, locale)}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  background: "#fff",
                  borderRadius: 8,
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                <div style={{ height: 220, background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {thumb ? (
                    <OptimizedImage src={thumb} alt={product.title} size="medium"
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", padding: 16 }} />
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: 13 }}>No image</span>
                  )}
                </div>
                <div style={{ padding: "16px" }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px", lineHeight: 1.3 }}>{product.title}</h3>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {product.categories?.slice(0, 2).map((cat) => (
                      <span key={cat.slug} style={{ fontSize: 11, background: "#f3f4f6", padding: "2px 8px", borderRadius: 4, color: "#6b7280" }}>{cat.name}</span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 40 }}>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              style={{
                padding: "8px 14px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                background: currentPage <= 1 ? "#f9fafb" : "#fff",
                color: currentPage <= 1 ? "#9ca3af" : "#374151",
                cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                fontSize: 14,
              }}
            >
              &larr; Prev
            </button>

            {getPageNumbers().map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} style={{ padding: "8px 6px", color: "#9ca3af", fontSize: 14 }}>&hellip;</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  style={{
                    padding: "8px 14px",
                    border: "1px solid",
                    borderRadius: 6,
                    borderColor: currentPage === p ? "#dc2626" : "#d1d5db",
                    background: currentPage === p ? "#dc2626" : "#fff",
                    color: currentPage === p ? "#fff" : "#374151",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: currentPage === p ? 600 : 400,
                  }}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              style={{
                padding: "8px 14px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                background: currentPage >= totalPages ? "#f9fafb" : "#fff",
                color: currentPage >= totalPages ? "#9ca3af" : "#374151",
                cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                fontSize: 14,
              }}
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
