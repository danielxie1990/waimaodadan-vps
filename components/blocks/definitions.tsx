import Link from "next/link";
import type { BlockDefinition } from "@/lib/block-types";
import { getWebpUrl } from "@/lib/webp-url";

const containerStyle: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", padding: "0 20px" };

const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Arial / Helvetica", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia / Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Inter / System", value: "'Inter', system-ui, sans-serif" },
  { label: "Roboto", value: "'Roboto', sans-serif" },
  { label: "Open Sans", value: "'Open Sans', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
];

// ── Hero ──
export const heroBlock: BlockDefinition = {
  type: "hero", label: "Hero", icon: "🖼️",
  defaultData: { title: "Your Trusted China Tin Box Manufacturer", subtitle: "Professional custom tin packaging solutions for global businesses.", btn1_text: "Custom Tins", btn1_url: "/custom-tins", btn2_text: "View Products", btn2_url: "/products", bg_color: "#111827" },
  fields: [
    { key: "title", label: "Title", type: "text", placeholder: "Hero 标题" },
    { key: "subtitle", label: "Subtitle", type: "textarea", placeholder: "Hero 副标题" },
    { key: "btn1_text", label: "Button 1 Text", type: "text" },
    { key: "btn1_url", label: "Button 1 URL", type: "text" },
    { key: "btn2_text", label: "Button 2 Text", type: "text" },
    { key: "btn2_url", label: "Button 2 URL", type: "text" },
    { key: "bg_color", label: "Background Color", type: "color" },
  ],
  component: ({ data }) => (
    <section style={{ background: data.bg_color || "#111827", textAlign: "center" }}>
      <div style={containerStyle}>
        <h1 style={{ fontSize: 44, fontWeight: 700, marginBottom: 20, lineHeight: 1.15, color: "#fff", letterSpacing: "-0.02em" }}>{data.title}</h1>
        <p style={{ fontSize: 18, color: "#9ca3af", maxWidth: 640, margin: "0 auto 36px", lineHeight: 1.65 }}>{data.subtitle}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {data.btn1_text && <Link href={data.btn1_url || "#"} style={{ padding: "14px 32px", background: "#dc2626", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 15 }}>{data.btn1_text}</Link>}
          {data.btn2_text && <Link href={data.btn2_url || "#"} style={{ padding: "14px 32px", background: "transparent", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 15, border: "1px solid #374151" }}>{data.btn2_text}</Link>}
        </div>
      </div>
    </section>
  ),
};

// ── Text ──
export const textBlock: BlockDefinition = {
  type: "text", label: "Text", icon: "📝",
  defaultData: { content: "<p>在这里输入内容..</p>", bg_color: "", padding: "", fontFamily: "", fontSize: "", fontColor: "", lineHeight: "", fontWeight: "" },
  fields: [
    { key: "content", label: "Content", type: "rich", placeholder: "输入内容" },
    { key: "fontFamily", label: "Font Family", type: "select", options: FONT_FAMILIES },
    { key: "fontSize", label: "Font Size (px)", type: "text", placeholder: "16" },
    { key: "fontColor", label: "Font Color", type: "color" },
    { key: "fontWeight", label: "Font Weight", type: "select", options: [{ label: "Normal (400)", value: "400" }, { label: "Medium (500)", value: "500" }, { label: "Semi Bold (600)", value: "600" }, { label: "Bold (700)", value: "700" }] },
    { key: "lineHeight", label: "Line Height", type: "text", placeholder: "1.8" },
    { key: "bg_color", label: "Background Color", type: "color" },
    { key: "padding", label: "Padding", type: "text", placeholder: "60px 0" },
  ],
  component: ({ data }) => (
    <section style={{ background: data.bg_color || "transparent", padding: data.padding || undefined }}>
      <div style={containerStyle}>
        <div className="rich-content" style={{
          fontSize: data.fontSize ? `${data.fontSize}px` : 16,
          lineHeight: data.lineHeight || 1.8,
          color: data.fontColor || "#374151",
          fontFamily: data.fontFamily || undefined,
          fontWeight: data.fontWeight || undefined,
        }}
          dangerouslySetInnerHTML={{ __html: data.content }} />
      </div>
    </section>
  ),
};

// ── Image ──
export const imageBlock: BlockDefinition = {
  type: "image", label: "Image", icon: "🖼️",
  defaultData: { url: "", alt: "", caption: "", width: "", height: "", max_width: "800", align: "center", link_url: "", link_target: "_self" },
  fields: [
    { key: "url", label: "Image URL", type: "image" },
    { key: "alt", label: "Alt Text", type: "text" },
    { key: "width", label: "Width (px, 留空=自动)", type: "text", placeholder: "自动" },
    { key: "height", label: "Height (px, 留空=自动)", type: "text", placeholder: "自动" },
    { key: "align", label: "Alignment", type: "select", options: [{ label: "Left", value: "left" }, { label: "Center", value: "center" }, { label: "Right", value: "right" }] },
    { key: "max_width", label: "Max Width (px)", type: "text", placeholder: "800" },
    { key: "caption", label: "Caption", type: "text" },
    { key: "link_url", label: "Link URL (可以?", type: "text", placeholder: "点击图片跳转的链接" },
    { key: "link_target", label: "Link Target", type: "select", options: [{ label: "Same Window", value: "_self" }, { label: "New Tab", value: "_blank" }] },
  ],
  component: ({ data }) => {
    const imgStyle: React.CSSProperties = {
      maxWidth: data.max_width ? `${data.max_width}px` : "100%",
      width: data.width ? `${data.width}px` : "100%",
      height: data.height ? `${data.height}px` : "auto",
      borderRadius: 8,
      objectFit: "contain",
    };
    const alignMap: Record<string, React.CSSProperties> = {
      left: { textAlign: "left" as const },
      center: { textAlign: "center" as const },
      right: { textAlign: "right" as const },
    };
    const img = <img src={getWebpUrl(data.url)} alt={data.alt || ""} style={imgStyle} />;
    return (
      <section>
        <div style={{ ...containerStyle, ...(alignMap[data.align] || alignMap.center) }}>
          {data.link_url ? (
            <Link href={data.link_url} target={data.link_target || "_self"} style={{ display: "inline-block" }}>
              {img}
            </Link>
          ) : img}
          {data.caption && <p style={{ color: "#6b7280", fontSize: 13, marginTop: 8 }}>{data.caption}</p>}
        </div>
      </section>
    );
  },
};

// ── Text & Image ──
export const textImageBlock: BlockDefinition = {
  type: "text_image", label: "Text & Image", icon: "📸",
  defaultData: { content: "<p>输入文字...</p>", image_url: "", image_alt: "", layout: "left", bg_color: "" },
  fields: [
    { key: "content", label: "Content", type: "rich" },
    { key: "image_url", label: "Image URL", type: "image" },
    { key: "image_alt", label: "Image Alt", type: "text" },
    { key: "layout", label: "Layout", type: "select", options: [{ label: "Text Left, Image Right", value: "left" }, { label: "Image Left, Text Right", value: "right" }] },
    { key: "bg_color", label: "Background Color", type: "color" },
  ],
  component: ({ data }) => (
    <section style={{ background: data.bg_color || "transparent" }}>
      <div style={containerStyle}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center", direction: data.layout === "right" ? "rtl" : "ltr" }}>
          <div style={{ direction: "ltr" }} className="rich-content" dangerouslySetInnerHTML={{ __html: data.content }} />
          <div style={{ direction: "ltr", textAlign: "center" }}>
            {data.image_url && <img src={getWebpUrl(data.image_url)} alt={data.image_alt || ""} style={{ maxWidth: "100%", borderRadius: 8 }} />}
          </div>
        </div>
      </div>
    </section>
  ),
};

// ── Features ──
export const featuresBlock: BlockDefinition = {
  type: "features", label: "Features", icon: "✨",
  defaultData: { title: "Why Choose Us", bg_color: "#f8fafc", items: [{ title: "Custom Design", desc: "Fully customizable" }, { title: "Free Samples", desc: "Evaluate before bulk orders" }, { title: "3D Mockups", desc: "See your design before production" }, { title: "Global Shipping", desc: "Reliable worldwide" }] },
  fields: [
    { key: "title", label: "Section Title", type: "text" },
    { key: "bg_color", label: "Background Color", type: "color" },
  ],
  component: ({ data }) => {
    const items = Array.isArray(data.items) ? data.items : [];
    return (
      <section style={{ background: data.bg_color || "#f8fafc" }}>
        <div style={containerStyle}>
          {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32, textAlign: "center" }}>{data.title}</h2>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 24 }}>
            {items.map((f: any, i: number) => (
              <div key={i} style={{ background: "#fff", padding: 24, borderRadius: 8, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  },
};

// ── Products ──
export const productsBlock: BlockDefinition = {
  type: "products", label: "Products", icon: "📦",
  defaultData: { title: "Our Products", subtitle: "Popular tin packaging solutions", count: 8, bg_color: "" },
  fields: [
    { key: "title", label: "Section Title", type: "text" },
    { key: "subtitle", label: "Subtitle", type: "text" },
    { key: "count", label: "Number to Show", type: "number", placeholder: "8" },
    { key: "bg_color", label: "Background Color", type: "color" },
  ],
  component: ({ data }) => "RENDERED_BY_SERVER",
};

// ── Blog Posts ──
export const postsBlock: BlockDefinition = {
  type: "posts", label: "Blog Posts", icon: "✏️",
  defaultData: { title: "From Our Blog", subtitle: "Packaging industry insights", count: 3, bg_color: "" },
  fields: [
    { key: "title", label: "Section Title", type: "text" },
    { key: "subtitle", label: "Subtitle", type: "text" },
    { key: "count", label: "Number to Show", type: "number", placeholder: "3" },
    { key: "bg_color", label: "Background Color", type: "color" },
  ],
  component: ({ data }) => "RENDERED_BY_SERVER",
};

// ── CTA ──
export const ctaBlock: BlockDefinition = {
  type: "cta", label: "CTA Banner", icon: "📢",
  defaultData: { title: "Ready to Get Started?", subtitle: "Contact us today for a free quote", btn_text: "Contact Us", btn_url: "/contact", bg_color: "#111827" },
  fields: [
    { key: "title", label: "Title", type: "text" },
    { key: "subtitle", label: "Subtitle", type: "textarea" },
    { key: "btn_text", label: "Button Text", type: "text" },
    { key: "btn_url", label: "Button URL", type: "text" },
    { key: "bg_color", label: "Background Color", type: "color" },
  ],
  component: ({ data }) => (
    <section style={{ background: data.bg_color || "#111827", textAlign: "center" }}>
      <div style={containerStyle}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, color: "#fff" }}>{data.title}</h2>
        <p style={{ color: "#9ca3af", marginBottom: 28, maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.6 }}>{data.subtitle}</p>
        {data.btn_text && <Link href={data.btn_url || "/contact"} style={{ padding: "14px 32px", background: "#dc2626", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 15 }}>{data.btn_text}</Link>}
      </div>
    </section>
  ),
};

// ── Spacer ──
export const spacerBlock: BlockDefinition = {
  type: "spacer", label: "Spacer", icon: "✨",
  defaultData: { height: "40" },
  fields: [{ key: "height", label: "Height (px)", type: "text", placeholder: "40" }],
  component: ({ data }) => <div style={{ height: parseInt(data.height || "40") }} />,
};

// 10. Heading
// ═════════════════════════════════════════════
export const headingBlock: BlockDefinition = {
  type: "heading", label: "Heading", icon: "🔤",
  defaultData: { tag: "h2", text: "Section Title", align: "left", color: "", fontFamily: "", fontSize: "", lineHeight: "", letterSpacing: "" },
  fields: [
    { key: "tag", label: "Heading Tag", type: "select", options: [{ label: "H1", value: "h1" }, { label: "H2", value: "h2" }, { label: "H3", value: "h3" }] },
    { key: "text", label: "Text", type: "text", placeholder: "输入标题..." },
    { key: "align", label: "Alignment", type: "select", options: [{ label: "Left", value: "left" }, { label: "Center", value: "center" }, { label: "Right", value: "right" }] },
    { key: "color", label: "Color", type: "color" },
    { key: "fontFamily", label: "Font Family", type: "select", options: FONT_FAMILIES },
    { key: "fontSize", label: "Font Size (px, 留空=tag默认)", type: "text", placeholder: "自动" },
    { key: "lineHeight", label: "Line Height", type: "text", placeholder: "1.3" },
    { key: "letterSpacing", label: "Letter Spacing (px)", type: "text", placeholder: "0" },
  ],
  component: ({ data }) => {
    const styles: React.CSSProperties = {
      textAlign: data.align || "left",
      color: data.color || undefined,
      margin: "0 0 12px",
      fontFamily: data.fontFamily || undefined,
      fontSize: data.fontSize ? `${data.fontSize}px` : undefined,
      lineHeight: data.lineHeight || 1.3,
      letterSpacing: data.letterSpacing ? `${data.letterSpacing}px` : undefined,
    };
    const size = data.fontSize ? parseInt(data.fontSize) : (data.tag === "h1" ? 36 : data.tag === "h2" ? 28 : 20);
    const weight = data.tag === "h1" ? 700 : data.tag === "h2" ? 700 : 600;
    return (
      <section>
        <div style={containerStyle}>
          {data.tag === "h1" && <h1 style={{ ...styles, fontSize: size, fontWeight: weight, padding: 0 }}>{data.text}</h1>}
          {data.tag === "h2" && <h2 style={{ ...styles, fontSize: size, fontWeight: weight, padding: 0 }}>{data.text}</h2>}
          {data.tag === "h3" && <h3 style={{ ...styles, fontSize: size, fontWeight: weight, padding: 0 }}>{data.text}</h3>}
        </div>
      </section>
    );
  },
};

// 11. Columns (Grid)
// ── sub-item types for columns ──
const COLUMN_ITEM_TYPES = [
  { type: "image", icon: "🖼️", label: "Image", defaultData: { url: "", alt: "" } },
  { type: "heading", icon: "🔤", label: "Heading", defaultData: { tag: "h2", text: "Section Title", align: "left" } },
  { type: "text", icon: "📝", label: "Text", defaultData: { content: "<p>Enter text content...</p>" } },
  { type: "button", icon: "🔘", label: "Button", defaultData: { text: "Learn More", url: "/contact", style: "solid" } },
];

function renderColItem(item: any, idx: number) {
  const d = item.data || {};
  switch (item.type) {
    case "image":
      return d.url ? <img key={idx} src={getWebpUrl(d.url)} alt={d.alt || ""} style={{ width: "100%", borderRadius: 8, marginBottom: 12 }} /> : null;
    case "heading":
      const hSize = d.tag === "h1" ? 28 : d.tag === "h2" ? 20 : 16;
      const hWeight = d.tag === "h1" ? 700 : d.tag === "h2" ? 600 : 600;
      const Tag = d.tag || "h2";
      return <Tag key={idx} style={{ fontSize: hSize, fontWeight: hWeight, marginBottom: 10, textAlign: d.align || "left" }}>{d.text}</Tag>;
    case "text":
      return <div key={idx} className="rich-content" style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: d.content }} />;
    case "button":
      const isSolid = d.style !== "outline";
      const btnKey = idx;
      if (!d.text) return null;
      // Can't use Link in client component, use a
      const btn = <a href={d.url || "#"} key={btnKey} style={{ display: "inline-block", padding: "10px 24px", borderRadius: 6, fontSize: 14, fontWeight: 600, textDecoration: "none", marginBottom: 8, background: isSolid ? "#dc2626" : "transparent", color: isSolid ? "#fff" : "#dc2626", border: isSolid ? "none" : "1px solid #dc2626" }}>{d.text}</a>;
      return <div key={btnKey} style={{ marginBottom: 8 }}>{btn}</div>;
    default:
      return null;
  }
}

export const columnsBlock: BlockDefinition = {
  type: "columns", label: "Columns", icon: "📐",
  defaultData: {
    columns: 2,
    bg_color: "",
    gap: "24",
    col_items: {"1": [], "2": [], "3": [], "4": []},
  },
  fields: [
    { key: "columns", label: "Number of Columns", type: "select", options: [{ label: "1 Column", value: "1" }, { label: "2 Columns", value: "2" }, { label: "3 Columns", value: "3" }, { label: "4 Columns", value: "4" }] },
    { key: "bg_color", label: "Background Color", type: "color" },
    { key: "gap", label: "Gap (px)", type: "text", placeholder: "24" },
  ],
  component: ({ data }) => {
    const count = parseInt(data.columns || "2");
    const gap = parseInt(data.gap || "24");
    const colItems = data.col_items || {};
    return (
      <section style={{ background: data.bg_color || "transparent", }}>
        <div style={containerStyle}>
          <div className="block-columns-grid" style={{ gridTemplateColumns: `repeat(${count}, 1fr)`, gap, textAlign: "left" }}>
            {Array.from({ length: count }, (_, i) => {
              const colNum = String(i + 1);
              const items = colItems[colNum] || [];
              return (
                <div key={i} style={{ minWidth: 0 }}>
                  {items.map((item: any, idx: number) => renderColItem(item, idx))}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  },
};

// ── Form (Contact Form) ──
export const formBlock: BlockDefinition = {
  type: "form", label: "Form", icon: "📋",
  defaultData: {
    title: "Send Inquiry",
    submit_text: "Send Message",
    bg_color: "",
    fields: [
      { key: "name", label: "Your Name", type: "text", required: true },
      { key: "email", label: "Your Email", type: "email", required: true },
      { key: "phone", label: "Phone", type: "text", required: false },
      { key: "message", label: "Message", type: "textarea", required: true },
    ],
    email_to: "",
    email_subject: "New Website Inquiry",
    success_message: "Thank you! We will get back to you shortly.",
  },
  fields: [
    { key: "title", label: "Section Title", type: "text", placeholder: "Send Inquiry" },
    { key: "submit_text", label: "Submit Button Text", type: "text", placeholder: "Send Message" },
    { key: "bg_color", label: "Background Color", type: "color" },
    { key: "email_to", label: "Send To Email (留空=使用SMTP默认)", type: "text", placeholder: "留空则发送到SMTP配置的邮件" },
    { key: "email_subject", label: "Email Subject", type: "text", placeholder: "New Website Inquiry" },
    { key: "success_message", label: "Success Message", type: "text", placeholder: "Thank you!" },
  ],
  component: ({ data }) => "RENDERED_BY_SERVER",
};

// Register
// ═════════════════════════════════════════════
export const ALL_BLOCKS: BlockDefinition[] = [
  heroBlock, textBlock, imageBlock, textImageBlock, featuresBlock,
  productsBlock, postsBlock, ctaBlock, spacerBlock, headingBlock, columnsBlock,
  formBlock,
];

export const BLOCK_MAP = new Map(ALL_BLOCKS.map((b) => [b.type, b]));
