import { requireAuth } from "@/lib/api";
import { getAllJobs } from "@/lib/translation-jobs";

/**
 * GET /api/translate/jobs
 *
 * 返回所有翻译任务列表（按时间倒序）
 */
export async function GET() {
  requireAuth();
  const jobs = getAllJobs();
  return Response.json({ jobs });
}
