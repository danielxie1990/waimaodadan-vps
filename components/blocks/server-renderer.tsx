import type { ReactNode } from "react";
import Link from "next/link";
import { getPublishedProducts, getPublishedPosts } from "@/lib/db";
import { getWebpUrl } from "@/lib/webp-url";

const containerStyle: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", padding: "0 24px" };

// ── FormBlock (lazy-loaded client component) ──
import dynamic from "next/dynamic";
const FormBlockClientWrapper = dynamic(
  () => import("./FormBlock").then((mod) => ({ default: mod.FormBlock })),
  { ssr: false }
);

// ── Hex to RGBA helper ──
function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2) || "00", 16);
  const g = parseInt(c.substring(2, 4) || "00", 16);
  const b = parseInt(c.substring(4, 6) || "00", 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export async function renderBlocks(blocks: any[]): Promise<ReactNode> {
  const [products, posts] = await Promise.all([getPublishedProducts(), getPublishedPosts()]);

  // New format: SectionBlock[]
  if (blocks.length > 0 && blocks[0]?.type === "section") {
    return (
      <>
        {blocks.map((section: any, si: number) => {
          // Build background style for the full-width outer wrapper
          const outerBg: React.CSSProperties = {};
          if (section.bgType === "image" && section.bgImage) {
            const overlay = section.bgOverlay ? hexToRgba(section.bgOverlay, parseInt(section.bgOverlayOpacity || "50") / 100) : "";
            outerBg.backgroundImage = [overlay ? `linear-gradient(${overlay}, ${overlay})` : "", `url(${section.bgImage})`].filter(Boolean).join(", ");
            outerBg.backgroundSize = "cover";
            outerBg.backgroundPosition = "center";
          } else if (section.bgType === "gradient" && section.bgGradient) {
            outerBg.background = section.bgGradient;
          } else if (section.bgColor) {
            outerBg.background = section.bgColor;
          }
          return (
            <div key={section.id || si} className="block-section" style={{
              ...outerBg,
              marginTop: section.marginTop !== undefined && section.marginTop !== "" ? `${section.marginTop}px` : undefined,
              marginBottom: section.marginBottom !== undefined && section.marginBottom !== "" ? `${section.marginBottom}px` : undefined,
              display: "flex",
              flexDirection: "column",
              justifyContent: section.verticalAlign === "center" ? "center" : section.verticalAlign === "bottom" ? "flex-end" : "flex-start",
              minHeight: section.minHeight ? `${section.minHeight}px` : undefined,
            }}>
              {renderSection(section, products, posts)}
            </div>
          );
        })}
      </>
    );
  }

  // Old format: flat BlockData[]
  return (
    <>
      {blocks.map((block: any, i: number) => (
        <BlockRenderer key={block.id || i} block={block} products={products} posts={posts} />
      ))}
    </>
  );
}

function renderSection(section: any, products: any[], posts: any[]): ReactNode {
  const columns = section.columns || [];

  const isBoxed = (section.contentWidth || "boxed") === "boxed";

  return (
    <div
      className="block-section-inner"
      style={{
        display: "flex",
        gap: 16,
        maxWidth: isBoxed ? 1200 : undefined,
        margin: isBoxed ? "0 auto" : undefined,
        paddingTop: section.paddingTop !== undefined && section.paddingTop !== "" ? `${section.paddingTop}px` : "0",
        paddingBottom: section.paddingBottom !== undefined && section.paddingBottom !== "" ? `${section.paddingBottom}px` : "0",
        paddingLeft: "24px",
        paddingRight: "24px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {columns.map((col: any, ci: number) => (
        <div
          key={col.id || ci}
          className={`block-column ${col.width === "100%" ? "col-full" : "col-multi"}`}
          style={{
            flex: col.width === "100%" ? "1" : `0 0 ${col.width}`,
            minWidth: 0,
          }}
        >
          {(col.blocks || []).map((content: any, bi: number) => {
            if (content?.type === "section") {
              return (
                <div key={content.id || `ns-${bi}`} style={{ margin: "8px 0" }}>
                  {renderSection(content, products, posts)}
                </div>
              );
            }
            return (
              <BlockRenderer
                key={content.id || bi}
                block={content}
                products={products}
                posts={posts}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function renderItem(item: any, idx: number) {
  const d = item.data || {};
  switch (item.type) {
    case "image":
      return d.url ? <img key={idx} src={getWebpUrl(d.url)} alt={d.alt || ""} style={{ width: "100%", borderRadius: 8, marginBottom: 12 }} /> : null;
    case "heading":
      const Tag = d.tag || "h2";
      const hSize = d.tag === "h1" ? 28 : d.tag === "h2" ? 20 : 16;
      const hWeight = d.tag === "h1" ? 700 : 600;
      return <Tag key={idx} style={{ fontSize: hSize, fontWeight: hWeight, marginBottom: 10, textAlign: d.align || "left" }}>{d.text}</Tag>;
    case "text":
      return <div key={idx} className="rich-content" style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: d.content }} />;
    case "button": {
      if (!d.text) return null;
      const isSolid = d.style !== "outline";
      return (
        <div key={idx} style={{ marginBottom: 8 }}>
          <a href={d.url || "#"} style={{ display: "inline-block", padding: "10px 24px", borderRadius: 6, fontSize: 14, fontWeight: 600, textDecoration: "none", background: isSolid ? "#dc2626" : "transparent", color: isSolid ? "#fff" : "#dc2626", border: isSolid ? "none" : "1px solid #dc2626" }}>{d.text}</a>
        </div>
      );
    }
    default:
      return null;
  }
}

function BlockRenderer({ block, products, posts }: { block: any; products: any[]; posts: any[] }) {
  const d = block.data || {};

  switch (block.type) {
    // ── Hero ──
    case "hero":
      return (
        <section style={{ background: d.bg_color || "#111827", textAlign: "center" }}>
          <div style={containerStyle}>
            <h1 style={{ fontSize: 44, fontWeight: 700, marginBottom: 20, lineHeight: 1.15, color: "#fff", letterSpacing: "-0.02em" }}>{d.title}</h1>
            {d.subtitle && <p style={{ fontSize: 18, color: "#9ca3af", maxWidth: 640, margin: "0 auto 36px", lineHeight: 1.65 }}>{d.subtitle}</p>}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {d.btn1_text && <Link href={d.btn1_url || "#"} style={{ padding: "14px 32px", background: "#dc2626", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 15 }}>{d.btn1_text}</Link>}
              {d.btn2_text && <Link href={d.btn2_url || "#"} style={{ padding: "14px 32px", background: "transparent", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 15, border: "1px solid #374151" }}>{d.btn2_text}</Link>}
            </div>
          </div>
        </section>
      );

    // ── Text ──
    case "text":
      return (
        <section style={{ background: d.bg_color || "transparent", padding: d.padding || undefined }}>
          <div style={containerStyle}>
            <div className="rich-content" style={{
              fontSize: d.fontSize ? `${d.fontSize}px` : 16,
              lineHeight: d.lineHeight || 1.8,
              color: d.fontColor || "#374151",
              fontFamily: d.fontFamily || undefined,
              fontWeight: d.fontWeight || undefined,
            }}
              dangerouslySetInnerHTML={{ __html: d.content }} />
          </div>
        </section>
      );

    // ── Image ──
    case "image": {
      const imgStyle: React.CSSProperties = {
        maxWidth: d.max_width ? `${d.max_width}px` : "100%",
        width: d.width ? `${d.width}px` : "100%",
        height: d.height ? `${d.height}px` : "auto",
        borderRadius: 8,
        objectFit: "contain",
      };
      const alignMap: Record<string, React.CSSProperties> = {
        left: { textAlign: "left" as const },
        center: { textAlign: "center" as const },
        right: { textAlign: "right" as const },
      };
      const img = <img src={getWebpUrl(d.url)} alt={d.alt || ""} style={imgStyle} />;
      return (
        <section>
          <div style={{ ...containerStyle, ...(alignMap[d.align] || alignMap.center) }}>
            {d.link_url ? (
              <a href={d.link_url} target={d.link_target || "_self"} style={{ display: "inline-block" }}>
                {img}
              </a>
            ) : img}
            {d.caption && <p style={{ color: "#6b7280", fontSize: 13, marginTop: 8 }}>{d.caption}</p>}
          </div>
        </section>
      );
    }

    // ── Text & Image ──
    case "text_image":
      return (
        <section style={{ background: d.bg_color || "transparent" }}>
          <div style={containerStyle}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center", direction: d.layout === "right" ? "rtl" : "ltr" }}>
              <div style={{ direction: "ltr" }} className="rich-content" dangerouslySetInnerHTML={{ __html: d.content }} />
              <div style={{ direction: "ltr", textAlign: "center" }}>
                {d.image_url && <img src={getWebpUrl(d.image_url)} alt={d.image_alt || ""} style={{ maxWidth: "100%", borderRadius: 8 }} />}
              </div>
            </div>
          </div>
        </section>
      );

    // ── Features Grid ──
    case "features": {
      const items = Array.isArray(d.items) ? d.items : [];
      return (
        <section style={{ background: d.bg_color || "#f8fafc" }}>
          <div style={containerStyle}>
            {d.title && <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 40, textAlign: "center", color: "#111827" }}>{d.title}</h2>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 }}>
              {items.map((f: any, i: number) => (
                <div key={i} style={{ background: "#fff", padding: 32, borderRadius: 12, border: "1px solid #f1f5f9", textAlign: "center" }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "#111827" }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    // ── CTA ──
    case "cta":
      return (
        <section style={{ background: d.bg_color || "#111827", textAlign: "center" }}>
          <div style={containerStyle}>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, color: "#fff" }}>{d.title}</h2>
            <p style={{ color: "#9ca3af", marginBottom: 28, maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.6 }}>{d.subtitle}</p>
            {d.btn_text && <Link href={d.btn_url || "/contact"} style={{ padding: "14px 32px", background: "#dc2626", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 15 }}>{d.btn_text}</Link>}
          </div>
        </section>
      );

    // ── Heading ──
    case "heading": {
      const baseSize = d.tag === "h1" ? 36 : d.tag === "h2" ? 28 : 20;
      const hSize = d.fontSize ? parseInt(d.fontSize) : baseSize;
      const hWeight = d.tag === "h1" ? 700 : 700;
      const hStyles: React.CSSProperties = {
        textAlign: d.align || "left",
        color: d.color || undefined,
        margin: "0 0 12px",
        fontFamily: d.fontFamily || undefined,
        fontSize: hSize,
        fontWeight: d.fontWeight || hWeight,
        lineHeight: d.lineHeight || 1.25,
        letterSpacing: d.letterSpacing ? `${d.letterSpacing}px` : undefined,
      };
      return (
        <section>
          <div style={containerStyle}>
            {d.tag === "h1" && <h1 style={hStyles}>{d.text}</h1>}
            {d.tag === "h2" && <h2 style={hStyles}>{d.text}</h2>}
            {d.tag === "h3" && <h3 style={hStyles}>{d.text}</h3>}
          </div>
        </section>
      );
    }

    // ── Columns ──
    case "columns": {
      const colCount = parseInt(d.columns || "2");
      const colGap = parseInt(d.gap || "24");
      const colItems = d.col_items || {};
      return (
        <section style={{ background: d.bg_color || "transparent" }}>
          <div style={containerStyle}>
            <div className="block-columns-grid" style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)`, gap: colGap }}>
              {Array.from({ length: colCount }, (_, i) => {
                const colNum = String(i + 1);
                const items = colItems[colNum] || [];
                return (
                  <div key={i} style={{ minWidth: 0 }}>
                    {items.map((item: any, idx: number) => renderItem(item, idx))}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    // ── Products (dynamic) ──
    case "products": {
      const featured = products.slice(0, parseInt(d.count || "8"));
      if (featured.length === 0) return null;
      return (
        <section style={{ background: d.bg_color || "transparent" }}>
          <div className="container">
            {d.title && <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{d.title}</h2>}
            {d.subtitle && <p style={{ color: "#6b7280", marginBottom: 32 }}>{d.subtitle}</p>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 20 }}>
              {featured.map((p: any) => (
                <Link key={p.id} href={`/products/${p.slug}`} style={{ textDecoration: "none", color: "inherit", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ height: 200, background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={getWebpUrl(p.image || p.images?.[0]?.url || "")} alt={p.title} style={{ maxWidth: "80%", maxHeight: "80%", objectFit: "contain" }} />
                  </div>
                  <div style={{ padding: "16px" }}><h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{p.title}</h3></div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      );
    }

    // ── Blog Posts (dynamic) ──
    case "posts": {
      const recent = posts.slice(0, parseInt(d.count || "3"));
      if (recent.length === 0) return null;
      return (
        <section style={{ background: d.bg_color || "transparent" }}>
          <div className="container">
            {d.title && <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{d.title}</h2>}
            {d.subtitle && <p style={{ color: "#6b7280", marginBottom: 32 }}>{d.subtitle}</p>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {recent.map((post: any) => (
                <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: "none", color: "inherit", background: "#fff", padding: 24, borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 8 }}>{new Date(post.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })}</p>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px", lineHeight: 1.3 }}>{post.title}</h3>
                  <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>{(post.excerpt || post.content || "").replace(/<[^>]*>/g, "").slice(0, 120)}...</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      );
    }

    // ── Form ──
    case "form": {
      return (
        <section style={{ background: d.bg_color || "transparent" }}>
          <div style={containerStyle}>
            {d.title && <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, textAlign: "center" }}>{d.title}</h2>}
            <FormBlockClientWrapper
              fields={Array.isArray(d.fields) ? d.fields : []}
              submitText={d.submit_text || "Send Message"}
              successMessage={d.success_message || "Thank you!"}
              emailTo={d.email_to || ""}
              emailSubject={d.email_subject || "New Website Inquiry"}
            />
          </div>
        </section>
      );
    }

    default:
      return null;
  }
}
