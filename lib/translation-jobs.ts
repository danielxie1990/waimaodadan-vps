/**
 * 翻译任务管理器
 * 基于文件的持久化存储，支持后台处理和页面刷新恢复
 */

import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export interface TranslationJobItem {
  type: "page" | "product" | "post";
  title: string;
  id: number;
}

export interface TranslationJob {
  id: string;
  locale: string;
  localeName: string;
  status: "pending" | "running" | "completed" | "failed";
  /** 总项目数 */
  totalItems: number;
  /** 已完成项目数 */
  completedItems: number;
  /** 失败项目数 */
  failedItems: number;
  /** 已跳过项目数 */
  skippedItems: number;
  /** 当前正在翻译的项目描述 */
  currentItem: string;
  /** 日志条目 */
  log: string[];
  /** 开始时间 ISO */
  startedAt: string;
  /** 最后更新时间 ISO */
  updatedAt: string;
  /** 完成时间 ISO */
  completedAt?: string;
}

const JOBS_DIR = path.join(process.cwd(), "data", "translation-jobs");

function ensureDir() {
  if (!fs.existsSync(JOBS_DIR)) {
    fs.mkdirSync(JOBS_DIR, { recursive: true });
  }
}

function jobPath(id: string): string {
  return path.join(JOBS_DIR, `${id}.json`);
}

export function createJob(locale: string, localeName: string, totalItems: number): TranslationJob {
  ensureDir();
  const job: TranslationJob = {
    id: uuidv4(),
    locale,
    localeName,
    status: "pending",
    totalItems,
    completedItems: 0,
    failedItems: 0,
    skippedItems: 0,
    currentItem: "",
    log: [],
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(jobPath(job.id), JSON.stringify(job, null, 2));
  return job;
}

export function updateJob(id: string, updates: Partial<TranslationJob>) {
  const filePath = jobPath(id);
  if (!fs.existsSync(filePath)) return;
  try {
    const current = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
  } catch {}
}

export function getJob(id: string): TranslationJob | null {
  const filePath = jobPath(id);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

export function getAllJobs(): TranslationJob[] {
  ensureDir();
  try {
    const files = fs.readdirSync(JOBS_DIR).filter(f => f.endsWith(".json"));
    const jobs = files.map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(JOBS_DIR, f), "utf-8"));
      } catch { return null; }
    }).filter(Boolean) as TranslationJob[];
    // Sort by startedAt descending
    return jobs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  } catch {
    return [];
  }
}

export function addLog(id: string, message: string) {
  const job = getJob(id);
  if (!job) return;
  const log = [...(job.log || []), `[${new Date().toLocaleTimeString()}] ${message}`];
  updateJob(id, { log });
}

export function deleteJob(id: string) {
  const filePath = jobPath(id);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
