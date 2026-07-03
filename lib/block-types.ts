// ─── Block Types ───────────────────────────────────

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

// ─── Section/Layout Types (Elementor-style) ───────

export type LayoutPreset =
  | "1"       // 1 column (full)
  | "1-2"     // 1/2 + 1/2
  | "1-3"     // 1/3 + 1/3 + 1/3
  | "1-4"     // 1/4 + 1/4 + 1/4 + 1/4
  | "1-3-2-3" // 1/3 + 2/3
  | "2-3-1-3";// 2/3 + 1/3

export interface ColumnBlock {
  id: string;
  width: string; // CSS width, e.g. "100%", "50%", "33.33%", "66.66%"
  blocks: SectionContent[];
}

/** A section: a layout with columns containing blocks (or nested sections) */
export interface SectionBlock {
  id: string;
  type: "section";
  layout: LayoutPreset;
  columns: ColumnBlock[];
  // ── Layout ──
  contentWidth?: "boxed" | "fullwidth";
  minHeight?: string;      // px
  verticalAlign?: "top" | "center" | "bottom";
  // ── Style ──
  bgType?: "solid" | "image" | "gradient" | "video";
  bgColor?: string;        // hex
  bgImage?: string;        // URL
  bgOverlay?: string;      // overlay hex color
  bgOverlayOpacity?: string; // 0-100
  bgGradient?: string;     // CSS gradient
  bgVideo?: string;        // video URL (iframe embed)
  // ── Advanced (spacing) ──
  paddingTop?: string;
  paddingBottom?: string;
  marginTop?: string;
  marginBottom?: string;
}

/** Content inside a column: either a regular block or a nested section */
export type SectionContent = BlockData | SectionBlock;

/** Top-level document: array of sections */
export type PageDocument = SectionBlock[];

// ─── Layout helpers ───────────────────────────────

export const LAYOUT_PRESETS: { value: LayoutPreset; label: string; columns: string[] }[] = [
  { value: "1",       label: "1 Column (Full)",       columns: ["100%"] },
  { value: "1-2",     label: "1/2 + 1/2",             columns: ["50%", "50%"] },
  { value: "1-3",     label: "1/3 + 1/3 + 1/3",      columns: ["33.33%", "33.33%", "33.33%"] },
  { value: "1-4",     label: "1/4 + 1/4 + 1/4 + 1/4", columns: ["25%", "25%", "25%", "25%"] },
  { value: "1-3-2-3", label: "1/3 + 2/3",             columns: ["33.33%", "66.66%"] },
  { value: "2-3-1-3", label: "2/3 + 1/3",             columns: ["66.66%", "33.33%"] },
];

export function createSection(layout: LayoutPreset): SectionBlock {
  const preset = LAYOUT_PRESETS.find(p => p.value === layout)!;
  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    type: "section",
    layout,
    contentWidth: "boxed",
    minHeight: "",
    verticalAlign: "top",
    bgType: "solid",
    bgColor: "",
    bgImage: "",
    bgOverlay: "",
    bgOverlayOpacity: "",
    bgGradient: "",
    bgVideo: "",
    paddingTop: "60",
    paddingBottom: "60",
    marginTop: "0",
    marginBottom: "0",
    columns: preset.columns.map(w => ({
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      width: w,
      blocks: [],
    })),
  };
}
