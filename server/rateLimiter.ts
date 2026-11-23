import type { Request } from 'express';

interface Bucket {
  timestamps: number[];
  dayKey: string;
  dayCount: number;
}

const aiBuckets = new Map<string, Bucket>();
const uploadBuckets = new Map<string, number[]>();

export const AI_RATE_LIMIT_PER_MIN = 25;
export const AI_DAILY_LIMIT = 150;
export const UPLOAD_LIMIT_PER_10_MIN = 15;

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getClientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) {
    return fwd.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function checkAiRateLimit(req: Request): {
  allowed: boolean;
  retryAfterSec?: number;
  remainingToday: number;
  dailyLimit: number;
  reason?: string;
} {
  const ip = getClientIp(req);
  const now = Date.now();
  const oneMinAgo = now - 60_000;
  const today = getTodayKey();

  let bucket = aiBuckets.get(ip);
  if (!bucket) {
    bucket = { timestamps: [], dayKey: today, dayCount: 0 };
    aiBuckets.set(ip, bucket);
  }

  if (bucket.dayKey !== today) {
    bucket.dayKey = today;
    bucket.dayCount = 0;
  }

  bucket.timestamps = bucket.timestamps.filter((t) => t > oneMinAgo);

  if (bucket.dayCount >= AI_DAILY_LIMIT) {
    return {
      allowed: false,
      retryAfterSec: 3600,
      remainingToday: 0,
      dailyLimit: AI_DAILY_LIMIT,
      reason: `Daily usage limit (${AI_DAILY_LIMIT} AI requests/day) reached. Please resume tomorrow.`,
    };
  }

  if (bucket.timestamps.length >= AI_RATE_LIMIT_PER_MIN) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + 60_000 - now) / 1000));
    return {
      allowed: false,
      retryAfterSec,
      remainingToday: Math.max(0, AI_DAILY_LIMIT - bucket.dayCount),
      dailyLimit: AI_DAILY_LIMIT,
      reason: `Rate limit reached (${AI_RATE_LIMIT_PER_MIN} requests/minute). Please wait ${retryAfterSec}s.`,
    };
  }

  bucket.timestamps.push(now);
  bucket.dayCount += 1;

  return {
    allowed: true,
    remainingToday: Math.max(0, AI_DAILY_LIMIT - bucket.dayCount),
    dailyLimit: AI_DAILY_LIMIT,
  };
}

export function getAiUsageStatus(req: Request): {
  remainingToday: number;
  dailyLimit: number;
  perMinuteLimit: number;
} {
  const ip = getClientIp(req);
  const today = getTodayKey();
  const bucket = aiBuckets.get(ip);
  const usedToday = bucket && bucket.dayKey === today ? bucket.dayCount : 0;
  return {
    remainingToday: Math.max(0, AI_DAILY_LIMIT - usedToday),
    dailyLimit: AI_DAILY_LIMIT,
    perMinuteLimit: AI_RATE_LIMIT_PER_MIN,
  };
}

const authBuckets = new Map<string, number[]>();

export function checkUploadRateLimit(req: Request): { allowed: boolean; reason?: string } {
  const ip = getClientIp(req);
  const now = Date.now();
  const tenMinAgo = now - 10 * 60_000;
  const list = (uploadBuckets.get(ip) ?? []).filter((t) => t > tenMinAgo);
  if (list.length >= UPLOAD_LIMIT_PER_10_MIN) {
    return {
      allowed: false,
      reason: 'Too many document uploads in a short window. Please wait a few minutes.',
    };
  }
  list.push(now);
  uploadBuckets.set(ip, list);
  return { allowed: true };
}

export function checkAuthRateLimit(req: Request): { allowed: boolean; reason?: string } {
  const ip = getClientIp(req);
  const now = Date.now();
  const fiveMinAgo = now - 5 * 60_000;
  const list = (authBuckets.get(ip) ?? []).filter((t) => t > fiveMinAgo);
  if (list.length >= 15) {
    return {
      allowed: false,
      reason: 'Too many authentication attempts. Please wait a few minutes before retrying.',
    };
  }
  list.push(now);
  authBuckets.set(ip, list);
  return { allowed: true };
}

