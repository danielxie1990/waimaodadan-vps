export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getWebpUrl } from "@/lib/webp-url";

export default async function BlogListPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, color: "#065f46", marginBottom: 8 }}>Packaging Blog</h1>
      <p style={{ color: "#6b7280", marginBottom: 32 }}>Insights, tips, and stories about tin packaging.</p>

      <div style={{ display: "grid", gap: 24 }}>
        {posts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`}
            style={{ display: "flex", gap: 20, textDecoration: "none", background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20, transition: "box-shadow 0.15s" }}>
            {post.image && (
              <div style={{ flex: "0 0 200px", borderRadius: 6, overflow: "hidden" }}>
                <img src={getWebpUrl(post.image)} alt={post.title} style={{ width: "100%", height: 140, objectFit: "cover" }} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111", margin: "0 0 8px" }}>{post.title}</h2>
              {post.excerpt && <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 12px", lineHeight: 1.6 }}>{post.excerpt}</p>}
              <span style={{ fontSize: 12, color: "#9ca3af" }}>{new Date(post.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
          </Link>
        ))}
        {posts.length === 0 && (
          <p style={{ color: "#9ca3af", textAlign: "center", padding: 40 }}>No blog posts yet.</p>
        )}
      </div>
    </div>
  );
}
