import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api";
import { getJob, deleteJob } from "@/lib/translation-jobs";

/**
 * GET /api/translate/jobs/[id]
 *
 * 返回单个翻译任务的当前进度
 * 前端轮询此接口获取实时状态
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  requireAuth();
  const job = getJob(params.id);
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }
  return Response.json({ job });
}

/**
 * DELETE /api/translate/jobs/[id]
 *
 * 删除翻译任务记录
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  requireAuth();
  deleteJob(params.id);
  return Response.json({ success: true });
}
