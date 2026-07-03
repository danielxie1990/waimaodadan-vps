import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { EditModeProvider } from "@/lib/edit-mode";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { getSiteSettings } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const noindex = settings.noindex === "true";
  return {
    title: settings.site_name || "My Company",
    description: settings.site_description || "Professional manufacturer serving global clients.",
    robots: noindex ? { index: false, follow: false } : undefined,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  const themeVars: React.CSSProperties = {
    "--primary": settings.theme_primary_color || "#b22222",
    "--primary-dark": settings.theme_primary_dark || "#8b0000",
    "--primary-light": settings.theme_primary_light || "#ef4444",
    "--secondary": settings.theme_secondary_color || "#1e293b",
    "--secondary-dark": settings.theme_secondary_dark || "#0f172a",
    "--accent": settings.theme_accent_color || "#d4af37",
    "--font-family": settings.theme_font_family || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    "--border-radius": settings.theme_border_radius || "4px",
    "--button-style": settings.theme_button_style || "filled",
    "--container-max": settings.theme_container_width || "1200px",
  } as React.CSSProperties;

  return (
    <html lang="en">
      <body style={themeVars}>
        <EditModeProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <AdminToolbar />
        </EditModeProvider>
      </body>
    </html>
  );
}
