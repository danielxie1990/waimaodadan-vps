"use client";

import { useState, useMemo, useCallback } from "react";
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

const PAGE_SIZE = 12;

export default function ProductGrid({ products, currentPage, totalPages, total, locale = "en" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  // Filter products by search query (client-side for instant response)
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.categories?.some((c) => c.name.toLowerCase().includes(q)) ||
        p.slug.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const filteredTotal = filteredProducts.length;
  const filteredPages = Math.ceil(filteredTotal / PAGE_SIZE);
  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    const qs = params.toString();
    const base = localizeUrl("/tin-containers/", locale);
    router.push(`${base}?${qs}`);
  }

  function handleSearch(value: string) {
    setSearchQuery(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("q", value.trim());
    } else {
      params.delete("q");
    }
    params.delete("page"); // Reset to page 1 on new search
    const qs = params.toString();
    const base = localizeUrl("/tin-containers/", locale);
    router.push(qs ? `${base}?${qs}` : base);
  }

  const getPageNumbers = useCallback((): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    const pagesTotal = searchQuery.trim() ? filteredPages : totalPages;
    if (pagesTotal <= 7) {
      for (let i = 1; i <= pagesTotal; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(pagesTotal - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < pagesTotal - 2) pages.push("...");
      pages.push(pagesTotal);
    }
    return pages;
  }, [currentPage, searchQuery, filteredPages, totalPages]);

  const activePageCount = searchQuery.trim() ? filteredPages : totalPages;

  return (
    <div style={{ padding: "40px 0" }}>
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Our Products</h1>
            <p style={{ color: "#6b7280", marginTop: 4, marginBottom: 0, fontSize: 14 }}>
              Showing {displayedProducts.length} of {filteredTotal} product{filteredTotal !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Search input */}
          <div style={{ position: "relative", minWidth: 240 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              style={{
                width: "100%",
                padding: "10px 14px 10px 36px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
            <span style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
              fontSize: 16,
              pointerEvents: "none",
            }}>
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => handleSearch("")}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  fontSize: 16,
                  padding: 4,
                }}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {displayedProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#6b7280" }}>
            <p style={{ fontSize: 18, marginBottom: 8 }}>No products found</p>
            <p style={{ fontSize: 14 }}>Try a different search term or browse our categories.</p>
          </div>
        ) : (
          <div className="product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 }}>
            {displayedProducts.map((product) => {
              const thumb = product.image || product.images?.[0]?.url || null;
              return (
                <Link
                  key={product.id}
                  href={localizeUrl(`/tin-containers/${cleanSlug(product.slug)}`, locale)}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    background: "#fff",
                    borderRadius: 8,
                    overflow: "hidden",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    transition: "box-shadow 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "none"; }}
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
        )}

        {/* Pagination */}
        {activePageCount > 1 && (
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
                  onClick={() => goToPage(p as number)}
                  style={{
                    padding: "8px 14px",
                    border: "1px solid",
                    borderRadius: 6,
                    borderColor: currentPage === p ? "var(--primary, #dc2626)" : "#d1d5db",
                    background: currentPage === p ? "var(--primary, #dc2626)" : "#fff",
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
              disabled={currentPage >= activePageCount}
              style={{
                padding: "8px 14px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                background: currentPage >= activePageCount ? "#f9fafb" : "#fff",
                color: currentPage >= activePageCount ? "#9ca3af" : "#374151",
                cursor: currentPage >= activePageCount ? "not-allowed" : "pointer",
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
