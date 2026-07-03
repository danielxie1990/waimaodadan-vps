export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await prisma.post.findFirst({
    where: { slug: params.slug, published: true },
  });
  if (!post) return {};
  return {
    title: (post.metaTitle || post.title) + " | Packaging Blog",
    description: post.metaDesc || post.excerpt || post.content?.replace(/<[^>]*>/g, "").slice(0, 160) || undefined,
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await prisma.post.findFirst({
    where: { slug: params.slug, published: true },
  });
  if (!post) return notFound();

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <Link href="/packaging-blog" style={{ color: "#065f46", fontSize: 14, textDecoration: "none", display: "inline-block", marginBottom: 24 }}>
        &larr; Back to Blog
      </Link>

      {post.image && (
        <div style={{ borderRadius: 8, overflow: "hidden", marginBottom: 24 }}>
          <img src={post.image} alt={post.title} style={{ width: "100%", maxHeight: 400, objectFit: "cover" }} />
        </div>
      )}

      <h1 style={{ fontSize: 28, fontWeight: 700, color: "#065f46", margin: "0 0 8px" }}>{post.title}</h1>
      <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 24 }}>
        {new Date(post.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      {post.excerpt && (
        <p style={{ fontSize: 15, color: "#6b7280", fontStyle: "italic", marginBottom: 24, padding: "12px 16px", background: "#f9fafb", borderRadius: 6, borderLeft: "3px solid #065f46" }}>
          {post.excerpt}
        </p>
      )}

      <div className="blog-content"
        dangerouslySetInnerHTML={{ __html: post.content }}
        style={{ fontSize: 15, lineHeight: 1.8, color: "#374151" }}
      />

      <style>{BLOG_STYLES}</style>
    </div>
  );
}

const BLOG_STYLES = `
.blog-content p { margin: 0 0 16px; }
.blog-content h2 { font-size: 22px; font-weight: 700; color: #111; margin: 28px 0 12px; }
.blog-content h3 { font-size: 18px; font-weight: 600; color: #1f2937; margin: 22px 0 10px; }
.blog-content ul, .blog-content ol { padding-left: 24px; margin: 12px 0; }
.blog-content li { margin-bottom: 6px; }
.blog-content img { max-width: 100%; height: auto; border-radius: 6px; margin: 16px 0; }
.blog-content blockquote { border-left: 4px solid #065f46; padding: 10px 20px; margin: 16px 0; color: #6b7280; background: #f9fafb; border-radius: 0 6px 6px 0; }
.blog-content pre { background: #1e293b; color: #e2e8f0; padding: 14px 18px; border-radius: 6px; overflow-x: auto; margin: 16px 0; }
.blog-content code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-size: 13px; color: #dc2626; }
.blog-content hr { border: none; border-top: 2px solid #e5e7eb; margin: 24px 0; }
.blog-content table { width: 100%; border-collapse: collapse; margin: 16px 0; }
.blog-content th, .blog-content td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
.blog-content th { background: #f3f4f6; font-weight: 600; }
.blog-content a { color: #065f46; text-decoration: underline; }
`;
