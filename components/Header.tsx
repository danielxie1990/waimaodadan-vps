"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { localizeUrl, LOCALE_NAMES } from "@/lib/locale";
import { getWebpUrl } from "@/lib/webp-url";
import EditButton from "@/components/EditButton";

const DEFAULT_MENU: any[] = [
  { title: "Home", url: "/" },
  { title: "Products", url: "/products" },
  { title: "About", url: "/about" },
  { title: "Contact", url: "/contact" },
];

// ── Locale helpers ──
function getCleanPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && Object.keys(LOCALE_NAMES).includes(segments[0])) {
    return "/" + segments.slice(1).join("/");
  }
  return pathname;
}

function navigateToLanguage(code: string) {
  if (typeof window === "undefined") return code === "en" ? "/" : `/${code}`;
  const pathname = window.location.pathname;
  const clean = getCleanPath(pathname);
  if (!code || code === "en") return clean || "/";
  const path = clean === "/" ? "" : clean;
  return `/${code}${path}`;
}

function useCurrentLocale(): string {
  const pathname = usePathname();
  const [locale, setLocale] = useState("en");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const segments = window.location.pathname.split("/").filter(Boolean);
    if (segments.length > 0 && Object.keys(LOCALE_NAMES).includes(segments[0])) {
      setLocale(segments[0]);
    } else {
      setLocale("en");
    }
  }, [pathname]);
  return locale;
}

// ════════════════════════════════════════════════
// MOBILE ACCORDION
// ════════════════════════════════════════════════

function MobileAccordion({ item, locale, onNavigate }: { item: any; locale: string; onNavigate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  if (!item.children) {
    return (
      <Link href={localizeUrl(item.url, locale)} onClick={onNavigate}
        style={{ display: "block", padding: "12px 20px", color: "#333", textDecoration: "none", fontSize: 14, borderBottom: "1px solid #f3f4f6" }}>
        {item.title}
      </Link>
    );
  }
  return (
    <div style={{ borderBottom: "1px solid #f3f4f6" }}>
      <div onClick={() => setExpanded(!expanded)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", cursor: "pointer" }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{item.title}</span>
        <span style={{ fontSize: 12, color: "#9ca3af", transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
      </div>
      {expanded && (
        <div style={{ background: "#f8fafc", padding: "4px 0" }}>
          {item.children.map((child: any, i: number) => (
            child.children ? (
              <MobileNestedAccordion key={i} child={child} locale={locale} onNavigate={onNavigate} />
            ) : (
              <Link key={i} href={localizeUrl(child.url, locale)} onClick={onNavigate}
                style={{ display: "block", padding: "10px 20px 10px 32px", color: "#555", textDecoration: "none", fontSize: 13 }}>
                {child.title}
              </Link>
            )
          ))}
        </div>
      )}
    </div>
  );
}

function MobileNestedAccordion({ child, locale, onNavigate }: { child: any; locale: string; onNavigate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <div onClick={() => setExpanded(!expanded)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px 10px 32px", cursor: "pointer" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{child.title}</span>
        <span style={{ fontSize: 11, color: "#9ca3af" }}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div style={{ background: "#f1f5f9" }}>
          {child.children.map((gc: any, j: number) => (
            <Link key={j} href={localizeUrl(gc.url, locale)} onClick={onNavigate}
              style={{ display: "block", padding: "8px 20px 8px 44px", color: "#666", textDecoration: "none", fontSize: 12 }}>
              {gc.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════
// DESKTOP - CLASSIC NAV
// ════════════════════════════════════════════════

function DesktopClassicNavItem({ item, locale, textColor }: { item: any; locale: string; textColor: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", paddingBottom: 12, marginBottom: -12 }}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Link href={localizeUrl(item.url, locale)}
        style={{ color: textColor || "#333", textDecoration: "none", fontSize: 14, fontWeight: 500, padding: "28px 12px", display: "block" }}>
        {item.title}
      </Link>
      {item.children && open && (
        <div style={{ position: "absolute", left: 0, top: "100%", marginTop: -12, background: "#fff", border: "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", minWidth: 200, zIndex: 100, padding: "8px 0" }}>
          {item.children.map((child: any) => (
            <div key={child.url || child.id}>
              {child.children ? <DesktopClassicSubNav child={child} locale={locale} /> : (
                <Link href={localizeUrl(child.url, locale)} style={{ display: "block", padding: "8px 16px", color: "#333", textDecoration: "none", fontSize: 13 }}>
                  {child.title}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DesktopClassicSubNav({ child, locale }: { child: any; locale: string }) {
  const [subOpen, setSubOpen] = useState(false);
  return (
    <div style={{ position: "relative", paddingRight: 12, marginRight: -12 }}
      onMouseEnter={() => setSubOpen(true)} onMouseLeave={() => setSubOpen(false)}>
      <span style={{ display: "block", padding: "8px 16px", color: "#333", fontSize: 13, fontWeight: 600, cursor: "default" }}>
        {child.title} ›
      </span>
      {subOpen && (
        <div style={{ position: "absolute", top: 0, left: "100%", marginLeft: -12, background: "#fff", border: "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", minWidth: 200, zIndex: 101, padding: "8px 0" }}>
          {child.children.map((gc: any) => (
            <Link key={gc.url || gc.id} href={localizeUrl(gc.url, locale)} style={{ display: "block", padding: "6px 16px", color: "#555", textDecoration: "none", fontSize: 12 }}>
              {gc.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════
// DESKTOP - MEGA NAV (only handles opening)
// ════════════════════════════════════════════════

function DesktopMegaNav({ items, locale, primaryColor, hoveredId, onHover, textColor }
  : { items: any[]; locale: string; primaryColor: string; hoveredId: string | null; onHover: (id: string | null) => void; textColor: string }) {

  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleEnter(navId: string) {
    const nav = items.find(n => n.id === navId);
    const hasChildren = nav?.children?.some((c: any) => c.enabled !== false);
    if (!hasChildren) return;
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => onHover(navId), 80);
  }

  function handleLeave() {
    if (openTimer.current) clearTimeout(openTimer.current);
    // Signal parent to schedule close
    onHover(null);
  }

  useEffect(() => () => { if (openTimer.current) clearTimeout(openTimer.current); }, []);

  const hasAnyChildren = items.some((n: any) => n.children?.some((c: any) => c.enabled !== false));
  if (!hasAnyChildren) {
    return (
      <nav style={{ display: "flex", alignItems: "stretch" }}>
        {items.map((nav: any) => (
          <Link key={nav.id || nav.url} href={localizeUrl(nav.url, locale)}
            style={{ color: "#333", textDecoration: "none", fontSize: 14, fontWeight: 500, padding: "28px 12px", display: "block" }}>
            {nav.title}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav style={{ display: "flex", alignItems: "stretch" }}>
      {items.map((nav: any) => (
        <div
          key={nav.id}
          onMouseEnter={() => handleEnter(nav.id)}
          onMouseLeave={handleLeave}
          style={{ position: "relative" }}
        >
          <Link
            href={localizeUrl(nav.url, locale)}
            style={{
              color: textColor || "#111",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              padding: "28px 16px",
              display: "block",
              letterSpacing: "0.3px",
              borderBottom: hoveredId === nav.id ? `2px solid ${primaryColor}` : "2px solid transparent",
              transition: "border-color 0.2s",
            }}
          >
            {nav.title}
          </Link>
        </div>
      ))}
    </nav>
  );
}

// ════════════════════════════════════════════════
// HEADER
// ════════════════════════════════════════════════

export default function Header() {
  const currentLocale = useCurrentLocale();
  const pathname = usePathname();
  // Don't render on admin pages
  if (pathname?.startsWith("/admin")) return null;
  const router = useRouter();
  const [langOpen, setLangOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [menuData, setMenuData] = useState<any[]>(DEFAULT_MENU);
  const [menuStyle, setMenuStyle] = useState<"classic" | "mega">("classic");
  const [enabledLangs, setEnabledLangs] = useState<{ code: string; name: string; flag: string }[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [customNavItems, setCustomNavItems] = useState<{ id: string; label: string; url: string; enabled: boolean }[]>([]);

  // ── Unified mega menu hover state (shared timer) ──
  const [megaHoverId, setMegaHoverId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const megaPanelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // One shared close timer - called when mouse leaves nav or panel
  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setMegaHoverId(null);
    }, 300);
  }, []);

  // Cancel close - called when mouse enters nav or panel
  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  // Called by DesktopMegaNav when a nav item is hovered or unhovered
  const handleNavHover = useCallback((navId: string | null) => {
    if (navId) {
      // Hovering a nav item - cancel close, set new id
      cancelClose();
      setMegaHoverId(navId);
    } else {
      // Left a nav item - schedule close (panel may catch the mouse)
      scheduleClose();
    }
  }, [cancelClose, scheduleClose]);

  // Close immediately (overlay click)
  const closeMegaNow = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMegaHoverId(null);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  }, []);

  // ── Header height measurement ──
  useEffect(() => {
    function updateHeight() {
      if (headerRef.current) {
        const h = headerRef.current.offsetHeight;
        if (h > 0) document.documentElement.style.setProperty("--header-height", `${h}px`);
      }
    }
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    if (headerRef.current) observer.observe(headerRef.current);
    window.addEventListener("resize", updateHeight);
    return () => { observer.disconnect(); window.removeEventListener("resize", updateHeight); };
  }, []);

  // ── Load settings ──
  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        setSettings(data);
        if (data.menu_style === "mega" || data.menu_style === "classic") setMenuStyle(data.menu_style);
        if (data.menu) {
          try {
            const parsed = JSON.parse(data.menu);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const deepFilter = (list: any[]): any[] =>
                list.filter((i: any) => i.enabled !== false).map((i: any) => ({
                  ...i,
                  children: i.children ? deepFilter(i.children) : undefined,
                }));
              setMenuData(deepFilter(parsed));
            }
          } catch {}
        }
        if (data.megaCustomNav) {
          try {
            const parsed = JSON.parse(data.megaCustomNav);
            if (Array.isArray(parsed)) setCustomNavItems(parsed);
          } catch {}
        }
        if (data.enabled_languages) {
          try {
            const codes: string[] = JSON.parse(data.enabled_languages);
            if (Array.isArray(codes)) {
              setEnabledLangs(codes.map(c => ({
                code: c,
                name: LOCALE_NAMES[c]?.name || c,
                flag: LOCALE_NAMES[c]?.flag || "🌐",
              })));
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // Close drawer on resize
  useEffect(() => {
    function handleResize() { if (window.innerWidth > 768) setDrawerOpen(false); }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const headerLayout = settings.header_layout || "logo-left";
  const headerH = settings.header_height ? parseInt(settings.header_height) : 80;
  const isSticky = settings.sticky_header === "true";
  const showTopBar = settings.top_bar_enabled === "true";
  const showLang = settings.enable_lang_switcher === "true";
  const showCTA = settings.show_cta_button !== "false";
  const ctaHref = settings.cta_url || "/contact";
  const ctaLabel = settings.cta_text || "Contact Us";
  const primaryColor = settings.primary_color || "#2563eb";
  const logoWidth = settings.logo_width ? parseInt(settings.logo_width) : 160;
  const headerBg = settings.header_bg || (settings.header_transparent === "true" ? "transparent" : "");
  const headerTextColor = settings.header_text_color || "";
  const headerTransparent = settings.header_transparent === "true";
  const headerBorder = settings.header_border !== "false";
  const topBarBg = settings.top_bar_bg || "var(--bg-darker)";
  const topBarColor = settings.top_bar_color || "";
  const topBarHeight = settings.top_bar_height ? parseInt(settings.top_bar_height) : 0;
  const langsToShow = enabledLangs.length > 0 ? enabledLangs : Object.entries(LOCALE_NAMES).slice(0, 6).map(([code, info]) => ({ code, ...info }));

  const headerContainer: React.CSSProperties = {
    display: "flex", justifyContent: "space-between", alignItems: "center", height: headerH,
  };
  const stackedContainer: React.CSSProperties = {
    display: "flex", flexDirection: "column", alignItems: "center",
  };

  const hoveredNav = megaHoverId ? menuData.find(n => n.id === megaHoverId) : null;
  const columns = hoveredNav?.children?.filter((c: any) => c.enabled !== false) || [];
  const panelVisible = !!megaHoverId && columns.length > 0;

  // ── Sticky header scroll shadow ──
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    if (isSticky) {
      window.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [isSticky]);

  // ── Push main content down when header is fixed ──
  useEffect(() => {
    if (isSticky) {
      const style = document.createElement("style");
      style.id = "__header_offset__";
      style.textContent = `main { padding-top: var(--header-height, 80px) !important; }`;
      document.head.appendChild(style);
      return () => {
        const el = document.getElementById("__header_offset__");
        if (el) el.remove();
      };
    }
  }, [isSticky]);

  // ── Scroll lock when mega panel is open ──
  useEffect(() => {
    if (menuStyle === "mega" && panelVisible) {
      document.body.style.overflow = "hidden";
    } else if (!drawerOpen) {
      document.body.style.overflow = "";
    }
  }, [panelVisible, menuStyle, drawerOpen]);

  return (
    <>
      <header ref={headerRef} style={{
        background: headerBg || "var(--bg)",
        borderBottom: headerBorder ? `1px solid var(--border)` : "none",
        position: isSticky ? "fixed" as const : "relative" as const,
        top: 0,
        left: 0,
        right: 0,
        width: "100%",
        zIndex: 160,
        boxShadow: isSticky && scrolled ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
        transition: "box-shadow 0.2s, background 0.2s",
        color: headerTextColor || undefined,
      }}>
        {/* Top Bar (inside header so it's fixed too) */}
        {showTopBar && (
          <div style={{
            background: topBarBg,
            color: topBarColor || "#fff",
            textAlign: "center",
            padding: topBarHeight > 0 ? `${topBarHeight}px 20px` : "8px 20px",
            fontSize: 13,
            position: "relative",
          }}>
            {settings.top_bar_text || ""}
            <EditButton href="/admin/settings/header" label="Edit Top Bar" position="top-right" />
          </div>
        )}
        <div className="container" style={headerLayout === "stacked" ? stackedContainer : headerContainer}>
          {/* Logo */}
          <div style={{ position: "relative", display: "inline-block" }}>
          <Link href={localizeUrl("/", currentLocale)} style={{
            display: "flex", alignItems: "center", gap: 10, textDecoration: "none",
          }}>
            {settings.logo_url ? (
              <img src={getWebpUrl(settings.logo_url)} alt={settings.site_name || "My Company"}
                style={{ width: logoWidth, height: "auto", maxHeight: 60, objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: 20, fontWeight: 700, color: headerTextColor || "var(--primary)", lineHeight: 1.2 }}>
                {settings.site_name || "My Company"}
              </span>
            )}
          </Link>
          <EditButton href="/admin/settings/branding" label="Edit Logo & Branding" position="top-right" />
          </div>

          {/* Desktop Nav */}
          <div className="header-nav" style={{ display: "flex", alignItems: "center", gap: 4, position: "relative" } as React.CSSProperties}>
            <div style={{ position: "relative" }}>
            {menuStyle === "mega" ? (
              <DesktopMegaNav
                items={menuData}
                locale={currentLocale}
                primaryColor={primaryColor}
                hoveredId={megaHoverId}
                onHover={handleNavHover}
                textColor={headerTextColor}
              />
            ) : (
              <nav style={{ display: "flex", alignItems: "stretch" }}>
                {menuData.map((item: any, i: number) => (
                  <DesktopClassicNavItem key={item.id || i} item={item} locale={currentLocale} textColor={headerTextColor} />
                ))}
              </nav>
            )}
            <EditButton href="/admin/menu" label="Edit Navigation Menu" position="top-right" />
            </div>

            {showLang && (
              <div style={{ position: "relative" }}>
                <EditButton href="/admin/settings/languages" label="Edit Language Switcher" position="top-left" />
                <button onClick={() => setLangOpen(!langOpen)}
                  style={{ background: "none", border: "1px solid #ddd", borderRadius: 4, padding: "6px 10px", cursor: "pointer", fontSize: 13, marginLeft: 4 }}>
                  {LOCALE_NAMES[currentLocale]?.flag || "🌐"} {langOpen ? "▲" : "▼"}
                </button>
                {langOpen && (
                  <div style={{ position: "absolute", top: "100%", right: 0, background: "#fff", border: "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", minWidth: 180, zIndex: 200, padding: "8px 0", marginTop: 4, maxHeight: 300, overflow: "auto" }}>
                    {langsToShow.map((lang) => {
                      const url = navigateToLanguage(lang.code);
                      return (
                        <a key={lang.code} href={url} onClick={(e) => { e.preventDefault(); setLangOpen(false); router.push(url); }}
                          style={{ padding: "6px 16px", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: lang.code === currentLocale ? "#2563eb" : "#333", background: lang.code === currentLocale ? "#eff6ff" : "transparent", fontWeight: lang.code === currentLocale ? 600 : 400 }}>
                          <span>{lang.flag}</span><span>{lang.name}</span>
                          {lang.code === currentLocale && <span style={{ fontSize: 11, color: "#2563eb" }}>✓</span>}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {showCTA && (
              <div style={{ position: "relative" }}>
              <Link href={localizeUrl(ctaHref, currentLocale)} style={{
                background: "var(--primary)", color: "#fff", padding: "10px 20px",
                borderRadius: 4, textDecoration: "none", fontWeight: 600, fontSize: 13, marginLeft: 8, whiteSpace: "nowrap",
              }}>
                {ctaLabel}
              </Link>
              <EditButton href="/admin/settings/header" label="Edit CTA Button" position="top-right" />
              </div>
            )}

            <EditButton href="/admin/settings/header" label="Edit Header Style" position="top-right" />

          </div>

          <button className="mobile-toggle" onClick={() => setDrawerOpen(!drawerOpen)}
            style={{ background: "none", border: "none", fontSize: 28, cursor: "pointer", display: "none", zIndex: 301, position: "relative", padding: 8, lineHeight: 1 } as React.CSSProperties}>
            {drawerOpen ? "✕" : "☰"}
          </button>
        </div>

        {drawerOpen && (
          <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 250 }} />
        )}

        <div style={{
          position: "fixed", top: 0, right: drawerOpen ? 0 : "-300px",
          width: 280, height: "100vh", background: "#fff", zIndex: 300,
          boxShadow: "-4px 0 12px rgba(0,0,0,0.1)", overflowY: "auto",
          transition: "right 0.25s ease", paddingTop: 80,
        }}>
          {menuData.map((item, i) => (
            <MobileAccordion key={i} item={item} locale={currentLocale} onNavigate={() => setDrawerOpen(false)} />
          ))}
          {showCTA && (
            <div style={{ padding: 16 }}>
              <Link href={localizeUrl(ctaHref, currentLocale)} onClick={() => setDrawerOpen(false)}
                style={{ display: "block", background: "var(--primary)", color: "#fff", padding: "14px 20px", borderRadius: 6, textDecoration: "none", fontWeight: 600, fontSize: 14, textAlign: "center" }}>
                📩 {ctaLabel}
              </Link>
            </div>
          )}
          {showLang && (
            <div style={{ padding: "0 16px 20px" }}>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>Languages</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {langsToShow.map((lang) => {
                  const url = navigateToLanguage(lang.code);
                  return (
                    <a key={lang.code} href={url} onClick={(e) => { e.preventDefault(); setDrawerOpen(false); router.push(url); }}
                      style={{ padding: "6px 10px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, borderRadius: 4, textDecoration: "none", color: lang.code === currentLocale ? "#2563eb" : "#333", background: lang.code === currentLocale ? "#eff6ff" : "transparent", fontWeight: lang.code === currentLocale ? 600 : 400 }}>
                      <span>{lang.flag}</span><span>{lang.name}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Mega Menu: Overlay ── */}
      {panelVisible && (
        <div
          onClick={closeMegaNow}
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 150,
            opacity: 1,
            transition: "opacity 0.3s ease",
          }}
        />
      )}

      {/* ── Mega Menu: Panel (mouseEnter cancels close, mouseLeave schedules close) ── */}
      {panelVisible && (
        <div
          ref={megaPanelRef}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          style={{
            position: "fixed",
            top: "var(--header-height, 80px)",
            left: 0, right: 0,
            zIndex: 151,
            background: "#fff",
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
            maxHeight: "600px",
            opacity: 1,
            overflow: "hidden",
            transition: "max-height 0.4s ease, opacity 0.3s ease",
          }}
        >
          <div className="container" style={{ padding: "36px 20px" }}>
            {(() => {
            const navItem_ = megaHoverId ? menuData.find((n: any) => n.id === megaHoverId) : null;
            const customLinks = navItem_?.customLinks?.filter((l: any) => l.enabled !== false) || [];
            const enabledCustomNav = customNavItems.filter((l: any) => l.enabled && l.label.trim()) || [];
            const tCols = columns.length + (customLinks.length > 0 ? 1 : 0) + (enabledCustomNav.length > 0 ? 1 : 0);
            return (
            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(tCols, 5)}, 1fr)`,
              gap: 28,
              maxWidth: 1200,
              margin: "0 auto",
            }}>
              {columns.map((col: any, idx: number) => (
                <div
                  key={col.id}
                  style={{
                    textAlign: "center",
                    animation: `megaColIn 0.4s ease ${0.1 + idx * 0.08}s both`,
                  }}
                >
                  {col.image ? (
                    <a href={localizeUrl(col.url, currentLocale)} style={{ display: "block", textDecoration: "none", marginBottom: 12 }}>
                      <div style={{ width: "100%", aspectRatio: "1.5", borderRadius: 8, overflow: "hidden", background: "#f5f5f5", border: "1px solid #eee" }}>
                        <img src={getWebpUrl(col.image)} alt={col.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.3s" }}
                          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
                          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")} />
                      </div>
                    </a>
                  ) : (
                    <a href={localizeUrl(col.url, currentLocale)} style={{ display: "block", textDecoration: "none", marginBottom: 12 }}>
                      <div style={{ width: "100%", aspectRatio: "1.5", borderRadius: 8, background: "#f5f5f5", border: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: 24, fontWeight: 600 }}>
                        {col.title?.[0] || "?"}
                      </div>
                    </a>
                  )}

                  <a href={localizeUrl(col.url, currentLocale)}
                    style={{ display: "block", fontSize: 15, fontWeight: 600, color: "#111", textDecoration: "none", marginBottom: 8 }}>
                    {col.title}
                  </a>

                  <a href={localizeUrl(col.url, currentLocale)}
                    style={{ display: "inline-block", fontSize: 13, color: primaryColor, textDecoration: "underline", textUnderlineOffset: 3, fontWeight: 500 }}>
                    View Details →
                  </a>
                </div>
              ))}
              {customLinks.length > 0 && (
                <div
                  key="custom-column"
                  style={{
                    textAlign: "center",
                    animation: `megaColIn 0.4s ease ${0.1 + columns.length * 0.08}s both`,
                  }}
                >
                  <div style={{
                    width: "100%", aspectRatio: "1.5", borderRadius: 8,
                    background: "linear-gradient(135deg, #f8f9fa, #e9ecef)",
                    border: "1px solid #eee",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#adb5bd", fontSize: 28, fontWeight: 600, marginBottom: 12,
                  }}>
                    ⋮
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {customLinks.map((link: any) => (
                      <Link key={link.id || link.label} href={localizeUrl(link.url, currentLocale)}
                        style={{
                          display: "block", fontSize: 13, color: "#374151",
                          textDecoration: "none", padding: "5px 0",
                          transition: "color 0.15s",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = primaryColor;
                          e.currentTarget.style.textDecoration = "underline";
                          e.currentTarget.style.textUnderlineOffset = "3px";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = "#374151";
                          e.currentTarget.style.textDecoration = "none";
                        }}>
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {enabledCustomNav.length > 0 && (
                <div
                  key="custom-nav-column"
                  style={{
                    textAlign: "left",
                    paddingLeft: 12,
                    borderLeft: "1px solid #d1d5db",
                    animation: `megaColIn 0.4s ease ${0.15 + (columns.length + (customLinks.length > 0 ? 1 : 0)) * 0.08}s both`,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {enabledCustomNav.map((item: any) => (
                      <Link key={item.id || item.label} href={localizeUrl(item.url, currentLocale)}
                        style={{
                          display: "block", fontSize: 13, color: "#374151",
                          textDecoration: "none", padding: "4px 0",
                          transition: "color 0.15s",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = primaryColor;
                          e.currentTarget.style.textDecoration = "underline";
                          e.currentTarget.style.textUnderlineOffset = "3px";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = "#374151";
                          e.currentTarget.style.textDecoration = "none";
                        }}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            );
            })()}
          </div>
        </div>
      )}

      {/* Inject column animation keyframes once */}
      <StyleInject />
    </>
  );
}

// ── Injects the mega column animation keyframes ──
function StyleInject() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById("__mega_style__")) return;
    const style = document.createElement("style");
    style.id = "__mega_style__";
    style.textContent = `
      @keyframes megaColIn {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }, []);
  return null;
}
