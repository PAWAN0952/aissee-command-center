import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { NextFunction, Request, Response } from 'express';

const KNOWLEDGE_DIR = path.resolve(process.cwd(), 'data', 'knowledge');
const ADMIN_AUTH_FILE = path.resolve(KNOWLEDGE_DIR, 'admin-auth.json');

// Verify path confinement strictly inside KNOWLEDGE_DIR
if (!ADMIN_AUTH_FILE.startsWith(KNOWLEDGE_DIR + path.sep)) {
  throw new Error('Invalid admin auth storage path');
}

const RUNTIME_SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16
    ? process.env.SESSION_SECRET.trim()
    : crypto.randomBytes(32).toString('hex');

interface StoredAdminHash {
  salt: string;
  hash: string;
  claimedAt: string;
}

function ensureKnowledgeDir() {
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
  }
}

function getEnvPasscode(): string {
  const val = process.env.ADMIN_PASSCODE;
  return typeof val === 'string' ? val.trim() : '';
}

function readClaimedHash(): StoredAdminHash | null {
  try {
    if (!fs.existsSync(ADMIN_AUTH_FILE)) return null;
    const raw = fs.readFileSync(ADMIN_AUTH_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoredAdminHash>;
    if (typeof parsed.salt === 'string' && typeof parsed.hash === 'string') {
      return {
        salt: parsed.salt,
        hash: parsed.hash,
        claimedAt: typeof parsed.claimedAt === 'string' ? parsed.claimedAt : new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function getAdminAuthStatus(): {
  configuredViaEnv: boolean;
  needsInitialSetup: boolean;
} {
  const envPass = getEnvPasscode();
  if (envPass.length > 0) {
    return { configuredViaEnv: true, needsInitialSetup: false };
  }
  const claimed = readClaimedHash();
  return {
    configuredViaEnv: false,
    needsInitialSetup: claimed === null,
  };
}

export function claimInitialAdminPasscode(passcode: string): { ok: boolean; error?: string } {
  const envPass = getEnvPasscode();
  if (envPass.length > 0) {
    return { ok: false, error: 'Admin passcode is already configured via server secrets.' };
  }
  if (readClaimedHash() !== null) {
    return { ok: false, error: 'Admin passcode has already been claimed. Please sign in.' };
  }
  if (passcode.length < 6 || passcode.length > 100) {
    return { ok: false, error: 'Passcode must be between 6 and 100 characters.' };
  }

  ensureKnowledgeDir();
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(passcode, salt, 64).toString('hex');
  const payload: StoredAdminHash = {
    salt,
    hash: derived,
    claimedAt: new Date().toISOString(),
  };

  // Exclusive flag 'wx' ensures atomic one-time claim
  try {
    fs.writeFileSync(ADMIN_AUTH_FILE, JSON.stringify(payload, null, 2), { flag: 'wx', mode: 0o600 });
    return { ok: true };
  } catch {
    return { ok: false, error: 'Admin passcode has already been claimed.' };
  }
}

export function verifyAdminPasscode(passcode: string): boolean {
  const envPass = getEnvPasscode();
  if (envPass.length > 0) {
    const a = Buffer.from(passcode);
    const b = Buffer.from(envPass);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  const stored = readClaimedHash();
  if (!stored) return false;

  const derived = crypto.scryptSync(passcode, stored.salt, 64);
  const expected = Buffer.from(stored.hash, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

export function issueAdminToken(): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + 8 * 60 * 60 * 1000; // 8 hours
  const nonce = crypto.randomBytes(12).toString('hex');
  const payload = Buffer.from(JSON.stringify({ role: 'admin', exp: expiresAt, nonce })).toString('base64url');
  const sig = crypto
    .createHmac('sha256', RUNTIME_SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return {
    token: `${payload}.${sig}`,
    expiresAt,
  };
}

export function verifyAdminToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  if (!payload || !sig) return false;

  const expectedSig = crypto
    .createHmac('sha256', RUNTIME_SESSION_SECRET)
    .update(payload)
    .digest('base64url');

  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return false;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
      role?: string;
      exp?: number;
    };
    return decoded.role === 'admin' && typeof decoded.exp === 'number' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Administrator sign-in required to modify study materials.' });
    return;
  }
  const token = authHeader.slice(7).trim();
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: 'Administrator session expired or invalid. Please sign in again.' });
    return;
  }
  next();
}
