"use client";

import { useState, useCallback } from "react";
import { getWebpUrl } from "@/lib/webp-url";
import EditButton from "@/components/EditButton";

interface Tab { icon: string; name: string; content: string; }
interface Product {
  id: number; title: string; image: string; video: string;
  images: { url: string; alt?: string }[]; categories: { name: string; slug: string }[];
  tabs: Tab[];
}

const FA_LINK = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";

export default function ProductDetailClient({ product, settings, locale }: { product: Product; settings: Record<string, string>; locale: string }) {
  const [activeTab, setActiveTab] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedThumb, setSelectedThumb] = useState(0);

  const galleryUrls = product.images.map(i => i.url);
  const allImages = galleryUrls.length > 0 ? galleryUrls : product.image ? [product.image] : [];

  const hasTabs = product.tabs && product.tabs.length > 0;
  const primaryColor = settings.primary_color || "#065f46";
  const inquiryLabel = settings.inquiry_button_text || "SEND INQUIRY";
  const activeTabContent = hasTabs && activeTab < product.tabs.length ? product.tabs[activeTab].content : "";

  const openLightbox = useCallback((idx: number) => { setLightboxIndex(idx); setLightboxOpen(true); }, []);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const renderHtml = (html: string) => {
    if (!html) return null;
    return <div className="rich-render" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <>
      <link rel="stylesheet" href={FA_LINK} />
      <style>{STYLES.replace(/\$primary/g, primaryColor)}</style>

      <div className="pdp-wrapper">
        {/* LEFT: Tabs + CTA */}
        <aside className="pdp-left">
          <nav className="pdp-tabs">
            {product.tabs.map((tab, i) => (
              <button key={i} className={`pdp-tab-btn${i === activeTab ? " active" : ""}`} onClick={() => setActiveTab(i)}>
                <i className={`fas ${tab.icon}`} />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
          <a href={`/${locale !== "en" ? locale + "/" : ""}contact`} className="pdp-btn-primary" style={{ background: primaryColor }}>
            {inquiryLabel}
          </a>
        </aside>

        {/* CENTER: Tab content */}
        <main className="pdp-center">
          {activeTabContent ? (
            <div className="pdp-tab-body">{renderHtml(activeTabContent)}</div>
          ) : hasTabs ? (
            <p className="pdp-select-tab">Select a tab to view content</p>
          ) : null}
        </main>

        {/* RIGHT: Images + Video */}
        <aside className="pdp-right">
          <div className="pdp-right-line" style={{ background: primaryColor }} />

          {allImages.length > 0 && (
            <div className="pdp-gallery">
            <EditButton href={`/admin/products/${product.id}/edit`} label="Edit Product Images" position="top-right" />
              <div className="pdp-main-img" onClick={() => openLightbox(selectedThumb)}>
                <img src={getWebpUrl(allImages[selectedThumb])} alt={product.title} />
                <div className="pdp-zoom-hint"><i className="fas fa-expand" /></div>
              </div>
              {allImages.length > 1 && (
                <div className="pdp-thumbs">
                  {allImages.map((url, i) => (
                    <button key={i} className={`pdp-thumb${i === selectedThumb ? " active" : ""}`} onClick={() => setSelectedThumb(i)}>
                      <img src={getWebpUrl(url)} alt={`${product.title} ${i + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {product.video && (() => {
            const match = product.video.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
            const vid = match?.[1];
            return vid ? (
              <div className="pdp-video">
                <iframe src={`https://www.youtube.com/embed/${vid}`} title="Product Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            ) : null;
          })()}

          {product.categories.length > 0 && (
            <div className="pdp-cats">
              {product.categories.map((c) => (<span key={c.slug} className="pdp-cat-tag">{c.name}</span>))}
            </div>
          )}
        </aside>
      </div>

      {/* MOBILE */}
      <div className="pdp-mobile">
        <div className="pdp-mobile-tabs">
          {product.tabs.map((tab, i) => (
            <button key={i} className={`pdp-mobile-tab-btn${i === activeTab ? " active" : ""}`} onClick={() => setActiveTab(i)}>
              <i className={`fas ${tab.icon}`} />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
        {activeTabContent && <div className="pdp-mobile-tab-body">{renderHtml(activeTabContent)}</div>}
        {allImages.length > 0 && (
          <div className="pdp-mobile-img" onClick={() => openLightbox(0)}>
            <img src={getWebpUrl(allImages[0])} alt={product.title} />
          </div>
        )}
        {allImages.length > 1 && (
          <div className="pdp-mobile-thumbs">
            {allImages.map((url, i) => (
              <button key={i} className={`pdp-mobile-thumb${i === selectedThumb ? " active" : ""}`} onClick={() => openLightbox(i)}>
                <img src={getWebpUrl(url)} alt={`${product.title} ${i + 1}`} />
              </button>
            ))}
          </div>
        )}
        <div className="pdp-mobile-cta">
          <a href={`/${locale !== "en" ? locale + "/" : ""}contact`} className="pdp-btn-primary" style={{ background: primaryColor }}>
            {inquiryLabel}
          </a>
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightboxOpen && (
        <div className="pdp-lightbox" onClick={closeLightbox}>
          <button className="pdp-lb-close" onClick={closeLightbox}><i className="fas fa-times" /></button>
          {allImages.length > 1 && <>
            <button className="pdp-lb-prev" onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + allImages.length) % allImages.length); }}>
              <i className="fas fa-chevron-left" /></button>
            <button className="pdp-lb-next" onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % allImages.length); }}>
              <i className="fas fa-chevron-right" /></button>
          </>}
          <img src={getWebpUrl(allImages[lightboxIndex])} alt={product.title} className="pdp-lb-img" onClick={(e) => e.stopPropagation()} />
          <div className="pdp-lb-counter">{lightboxIndex + 1} / {allImages.length}</div>
        </div>
      )}
    </>
  );
}

const STYLES = `
.pdp-wrapper { display: none; max-width: 1280px; margin: 0 auto; padding: 40px 20px; gap: 32px; background: #fff; }
@media (min-width: 769px) { .pdp-wrapper { display: flex; } }
.pdp-left { flex: 0 0 260px; display: flex; flex-direction: column; gap: 16px; }
.pdp-center { flex: 1; min-width: 0; }
.pdp-right { flex: 0 0 340px; }

.pdp-tabs { display: flex; flex-direction: column; gap: 2px; }
.pdp-tab-btn {
  display: flex; align-items: center; gap: 10px; padding: 12px 16px;
  border: 1px solid #e5e7eb; border-radius: 8px; background: #fff;
  cursor: pointer; font-size: 14px; color: #374151; text-align: left;
  transition: all 0.15s;
}
.pdp-tab-btn i { width: 18px; text-align: center; font-size: 15px; color: #6b7280; }
.pdp-tab-btn:hover { background: #f9fafb; border-color: #d1d5db; }
.pdp-tab-btn.active { background: $primary; border-color: $primary; color: #fff; font-weight: 600; }
.pdp-tab-btn.active i { color: #fff; }

.pdp-btn-primary {
  display: block; width: 100%; padding: 14px 20px;
  color: #fff; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 700; text-transform: uppercase;
  text-align: center; letter-spacing: 1px;
  cursor: pointer; text-decoration: none;
  transition: opacity 0.15s;
}
.pdp-btn-primary:hover { opacity: 0.9; }

.pdp-tab-body { font-size: 15px; line-height: 1.8; color: #4b5563; }
.pdp-tab-body p { margin: 0 0 14px; }
.pdp-tab-body ul, .pdp-tab-body ol { padding-left: 22px; margin: 10px 0; }
.pdp-tab-body li { margin-bottom: 6px; }
.pdp-tab-body img { max-width: 100%; height: auto; border-radius: 6px; margin: 12px 0; }
.pdp-tab-body table { width: 100%; border-collapse: collapse; margin: 12px 0; }
.pdp-tab-body th, .pdp-tab-body td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
.pdp-tab-body th { background: #f3f4f6; font-weight: 600; }
.pdp-tab-body blockquote { border-left: 4px solid #d1d5db; padding: 8px 16px; margin: 12px 0; color: #6b7280; }
.pdp-tab-body pre { background: #1e293b; color: #e2e8f0; padding: 12px 16px; border-radius: 6px; overflow-x: auto; }

.rich-render { font-size: 15px; line-height: 1.8; color: #4b5563; }
.rich-render p { margin: 0 0 14px; }
.rich-render ul, .rich-render ol { padding-left: 22px; margin: 10px 0; }
.rich-render li { margin-bottom: 6px; }
.rich-render img { max-width: 100%; height: auto; border-radius: 6px; margin: 12px 0; display: block; }
.rich-render table { width: 100%; border-collapse: collapse; margin: 12px 0; }
.rich-render th, .rich-render td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
.rich-render th { background: #f3f4f6; font-weight: 600; }
.rich-render blockquote { border-left: 4px solid #d1d5db; padding: 8px 16px; margin: 12px 0; color: #6b7280; background: #f9fafb; }
.rich-render pre { background: #1e293b; color: #e2e8f0; padding: 12px 16px; border-radius: 6px; overflow-x: auto; }
.rich-render code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-size: 13px; color: #dc2626; }
.rich-render hr { border: none; border-top: 2px solid #e5e7eb; margin: 20px 0; }

.pdp-right-line { width: 50px; height: 3px; margin-bottom: 16px; border-radius: 2px; }
.pdp-gallery { display: flex; flex-direction: column; gap: 10px; }
.pdp-main-img { position: relative; width: 100%; aspect-ratio: 1/1; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; background: #f9fafb; cursor: pointer; }
.pdp-main-img img { width: 100%; height: 100%; object-fit: contain; transition: transform 0.2s; }
.pdp-main-img:hover img { transform: scale(1.03); }
.pdp-zoom-hint { position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; background: rgba(0,0,0,0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; opacity: 0; }
.pdp-main-img:hover .pdp-zoom-hint { opacity: 1; }
.pdp-thumbs { display: flex; gap: 8px; }
.pdp-thumb { flex: 1; aspect-ratio: 1/1; border: 2px solid #e5e7eb; border-radius: 6px; overflow: hidden; cursor: pointer; background: #f9fafb; padding: 0; }
.pdp-thumb.active { border-color: $primary; }
.pdp-thumb img { width: 100%; height: 100%; object-fit: contain; }
.pdp-video { margin-top: 16px; position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; }
.pdp-video iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
.pdp-cats { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 16px; }
.pdp-cat-tag { font-size: 11px; background: #f3f4f6; color: #6b7280; padding: 4px 10px; border-radius: 20px; border: 1px solid #e5e7eb; }
.pdp-select-tab { color: #9ca3af; font-size: 15px; padding: 40px 0; text-align: center; }

.pdp-lightbox { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; cursor: pointer; }
.pdp-lb-img { max-width: 90vw; max-height: 90vh; object-fit: contain; cursor: default; }
.pdp-lb-close { position: absolute; top: 20px; right: 20px; background: none; border: none; color: #fff; font-size: 28px; cursor: pointer; z-index: 1; }
.pdp-lb-prev, .pdp-lb-next { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.15); border: none; color: #fff; font-size: 28px; padding: 16px; cursor: pointer; border-radius: 50%; }
.pdp-lb-prev { left: 20px; }
.pdp-lb-next { right: 20px; }
.pdp-lb-counter { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); color: #fff; font-size: 14px; background: rgba(0,0,0,0.5); padding: 6px 14px; border-radius: 20px; }

@media (max-width: 768px) { .pdp-wrapper { display: none; } }
.pdp-mobile { display: none; padding: 16px; background: #fff; flex-direction: column; gap: 16px; }
@media (max-width: 768px) { .pdp-mobile { display: flex; } }
.pdp-mobile-tabs { display: flex; gap: 6px; overflow-x: auto; padding: 4px 0; }
.pdp-mobile-tab-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid #e5e7eb; border-radius: 20px; background: #fff; cursor: pointer; font-size: 13px; color: #374151; white-space: nowrap; }
.pdp-mobile-tab-btn i { font-size: 12px; color: #6b7280; }
.pdp-mobile-tab-btn.active { background: $primary; color: #fff; border-color: $primary; }
.pdp-mobile-tab-btn.active i { color: #fff; }
.pdp-mobile-tab-body { font-size: 14px; line-height: 1.7; color: #4b5563; }
.pdp-mobile-img { width: 100%; aspect-ratio: 1/1; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; background: #f9fafb; cursor: pointer; }
.pdp-mobile-img img { width: 100%; height: 100%; object-fit: contain; }
.pdp-mobile-thumbs { display: flex; gap: 6px; }
.pdp-mobile-thumb { flex: 1; aspect-ratio: 1/1; border: 2px solid #e5e7eb; border-radius: 6px; overflow: hidden; background: #f9fafb; padding: 0; cursor: pointer; }
.pdp-mobile-thumb.active { border-color: $primary; }
.pdp-mobile-thumb img { width: 100%; height: 100%; object-fit: contain; }
.pdp-mobile-cta { padding: 8px 0 24px; }
`;
