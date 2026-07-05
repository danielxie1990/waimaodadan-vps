/**
 * Domain types for the CMS.
 * Shared across pages, API routes, and components.
 * Using `interface` for object shapes and `type` for unions/primitives.
 */

// ─── User ─────────────────────────────────────

export interface UserData {
  id: number;
  name: string;
  email: string;
}

// ─── Page ─────────────────────────────────────

export interface PageData {
  id: number;
  slug: string;
  title: string;
  content: string; // JSON string (blocks) or raw HTML
  metaTitle: string | null;
  metaDesc: string | null;
  targetKeyword: string | null;
  templateSlug: string;
  locale: string;
  translationGroupId: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Category ─────────────────────────────────

export interface CategoryData {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  sortOrder: number;
  locale: string;
  translationGroupId: string | null;
}

// ─── Product Type ─────────────────────────────

export interface ProductTypeData {
  id: number;
  name: string;
  slug: string;
  specFields: string; // JSON string: [{ label, unit }]
  createdAt: string;
  updatedAt: string;
}

// ─── Product Image ────────────────────────────

export interface ProductImageData {
  id: number;
  url: string;
  alt: string | null;
  sortOrder: number;
  productId: number;
}

// ─── Product Spec ─────────────────────────────

export interface ProductSpecData {
  id: number;
  productId: number;
  label: string;
  value: string;
  sortOrder: number;
}

// ─── Product Tab ──────────────────────────────

export interface ProductTabData {
  id: number;
  productId: number;
  icon: string;
  name: string;
  content: string; // HTML
  sortOrder: number;
}

// ─── Product Category (join table) ────────────

export interface ProductCategoryLink {
  id: number;
  name: string;
  slug: string;
  productId: number;
}

// ─── Product ──────────────────────────────────

export interface ProductData {
  id: number;
  legacyId: number | null;
  title: string;
  slug: string;
  description: string;
  image: string | null;
  shape: string | null;
  diameter: string | null;
  height: string | null;
  width: string | null;
  length: string | null;
  depth: string | null;
  volume: string | null;
  weight: string | null;
  tinplate: string | null;
  sku: string | null;
  application: string | null;
  keywords: string | null;
  metaTitle: string | null;
  metaDesc: string | null;
  targetKeyword: string | null;
  video: string | null;
  supplierId: number | null;
  locale: string;
  translationGroupId: string | null;
  published: boolean;
  moreDescription: string;
  typeId: number | null;
  type: ProductTypeData | null;
  categories: ProductCategoryLink[];
  images: ProductImageData[];
  specs: ProductSpecData[];
  tabs: ProductTabData[];
  tabTemplateId: number | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Product Grid (lightweight, no tabs/specs) ─

export interface ProductGridData {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  categories: ProductCategoryLink[];
  images: Pick<ProductImageData, "url" | "alt" | "sortOrder">[];
}

// ─── Post ─────────────────────────────────────

export interface PostData {
  id: number;
  legacyId: number | null;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  metaTitle: string | null;
  metaDesc: string | null;
  image: string | null;
  locale: string;
  translationGroupId: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Media ────────────────────────────────────

export interface MediaData {
  id: number;
  filename: string;
  url: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  alt: string | null;
  category: string;
  webpUrl: string | null;
  thumbUrl: string | null;
  mediumUrl: string | null;
  deletedAt: string | null;
  createdAt: string;
}

// ─── Site Settings ────────────────────────────

export interface SiteSettings {
  site_name: string;
  site_tagline: string;
  site_description: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  product_label: string;
  product_slug: string;
  category_slug: string;
  cta_text: string;
  cta_url: string;
  inquiry_button_text: string;
  back_to_catalog_text: string;
  admin_brand: string;
  footer_copyright: string;
  primary_color: string;
  [key: string]: string;
}

// ─── Block / Section (Elementor-style) ────────

export interface BlockField {
  key: string;
  label: string;
  type: "text" | "textarea" | "rich" | "color" | "number" | "select" | "image";
  placeholder?: string;
  rows?: number;
  options?: { label: string; value: string }[];
}

export interface BlockDefinition {
  type: string;
  label: string;
  icon: string;
  defaultData: Record<string, any>;
  fields: BlockField[];
  component: React.ComponentType<{ data: Record<string, any> }>;
}

export interface BlockData {
  id: string;
  type: string;
  data: Record<string, any>;
}

export type LayoutPreset =
  | "1" | "1-2" | "1-3" | "1-4"
  | "1-3-2-3" | "2-3-1-3";

export interface ColumnBlock {
  id: string;
  width: string;
  blocks: SectionContent[];
}

export interface SectionBlock {
  id: string;
  type: "section";
  layout: LayoutPreset;
  columns: ColumnBlock[];
  contentWidth?: "boxed" | "fullwidth";
  minHeight?: string;
  verticalAlign?: "top" | "center" | "bottom";
  bgType?: "solid" | "image" | "gradient" | "video";
  bgColor?: string;
  bgImage?: string;
  bgOverlay?: string;
  bgOverlayOpacity?: string;
  bgGradient?: string;
  bgVideo?: string;
  paddingTop?: string;
  paddingBottom?: string;
  marginTop?: string;
  marginBottom?: string;
}

export type SectionContent = BlockData | SectionBlock;
export type PageDocument = SectionBlock[];

// ─── API Response ─────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Column Item Types ────────────────────────

export interface ColumnItem {
  type: "image" | "heading" | "text" | "button";
  data: Record<string, any>;
}
