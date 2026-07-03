export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { requireAuth, ok } from "@/lib/api";
import fs from "fs/promises";
import path from "path";

const MANIFEST_PATH = path.join(process.cwd(), "updates", "manifest.json");

// GET /api/updates — returns local manifest
export async function GET() {
  requireAuth();
  try {
    const raw = await fs.readFile(MANIFEST_PATH, "utf8");
    const manifest = JSON.parse(raw);
    return ok(manifest);
  } catch {
    return ok({ version: "1.0.0", files: {}, changelog: [] });
  }
}

// POST /api/updates — apply an update (receive pushed file from central server)
export async function POST(req: NextRequest) {
  requireAuth();
  const body = await req.json();

  // body: { filePath: "components/Header.tsx", content: "...", hash: "abc123" }
  const { filePath, content, hash, version, changelogEntry } = body;
  if (!filePath || !content) {
    return new Response(JSON.stringify({ error: "Missing filePath or content" }), { status: 400 });
  }

  // Security: only allow safe paths
  const allowedPrefixes = ["components/", "lib/", "app/api/", "styles/"];
  const safe = allowedPrefixes.some(p => filePath.startsWith(p));
  if (!safe) {
    return new Response(JSON.stringify({ error: "Path not allowed" }), { status: 403 });
  }

  // Backup current file
  const fullPath = path.join(process.cwd(), filePath);
  try {
    const existing = await fs.readFile(fullPath, "utf8");
    const backupDir = path.join(process.cwd(), "updates", "backups");
    await fs.mkdir(backupDir, { recursive: true });
    const backupName = `${filePath.replace(/[/\\]/g, "_")}.${Date.now()}.bak`;
    await fs.writeFile(path.join(backupDir, backupName), existing);
  } catch {}

  // Write new file
  await fs.writeFile(fullPath, content, "utf8");

  // Update manifest
  try {
    const raw = await fs.readFile(MANIFEST_PATH, "utf8");
    const manifest = JSON.parse(raw);
    if (version) manifest.version = version;
    if (filePath) manifest.files[filePath] = { hash, changed: new Date().toISOString().split("T")[0] };
    if (changelogEntry) {
      manifest.changelog.unshift({
        version: version || manifest.version,
        date: new Date().toISOString().split("T")[0],
        changes: Array.isArray(changelogEntry) ? changelogEntry : [changelogEntry],
      });
    }
    await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
  } catch {}

  return ok({ applied: true, filePath });
}
