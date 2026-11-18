import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { INITIAL_CLEAN_RESPONSES } from './src/shared/initialCleanData.ts';
import {
  ALL_QUESTIONS,
  computeSurveyAnalytics,
  validateSurveyPayload,
  type SurveySubmissionRecord,
} from './src/shared/surveySchema.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_PATH = path.resolve(DATA_DIR, 'survey-store.json');

const ADMIN_PASSWORD = 'Uzairsajjad@12';

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  crypto.createHash('sha256').update(`whs:${ADMIN_PASSWORD}`).digest('hex');

const COOKIE_NAME = 'whs_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

interface SurveyConfig {
  surveyOpen: boolean;
  updatedAt: string;
}

interface StoreData {
  config: SurveyConfig;
  responses: SurveySubmissionRecord[];
}

function getDefaultStore(): StoreData {
  return {
    config: {
      surveyOpen: true,
      updatedAt: new Date().toISOString(),
    },
    responses: [...INITIAL_CLEAN_RESPONSES],
  };
}

function sanitizeStoredRecord(raw: unknown): SurveySubmissionRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.submissionId !== 'string' || typeof r.timestamp !== 'string') return null;
  const answers: Record<string, string> = {};
  if (r.answers && typeof r.answers === 'object') {
    for (const [k, v] of Object.entries(r.answers as Record<string, unknown>)) {
      if (typeof v === 'string') {
        answers[k] = v;
      }
    }
  }
  return {
    submissionId: r.submissionId,
    timestamp: r.timestamp,
    name: typeof r.name === 'string' ? r.name : '',
    consent: Boolean(r.consent),
    answers,
  };
}

function loadStore(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      const initial = getDefaultStore();
      writeStore(initial);
      return initial;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    const defaults = getDefaultStore();
    const rawConfig = (parsed.config || {}) as Partial<SurveyConfig>;
    const cleanResponses = Array.isArray(parsed.responses)
      ? parsed.responses
          .map(sanitizeStoredRecord)
          .filter((item): item is SurveySubmissionRecord => item !== null)
      : [];

    return {
      config: {
        surveyOpen:
          typeof rawConfig.surveyOpen === 'boolean'
            ? rawConfig.surveyOpen
            : defaults.config.surveyOpen,
        updatedAt:
          typeof rawConfig.updatedAt === 'string'
            ? rawConfig.updatedAt
            : defaults.config.updatedAt,
      },
      responses: cleanResponses,
    };
  } catch {
    return getDefaultStore();
  }
}

function writeStore(data: StoreData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, STORE_PATH);
}

let store: StoreData = loadStore();

// Simple sliding-window rate limiter (per IP)
const rateBuckets = new Map<string, number[]>();
function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (rateBuckets.get(key) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxRequests) {
    rateBuckets.set(key, timestamps);
    return true;
  }
  timestamps.push(now);
  rateBuckets.set(key, timestamps);
  return false;
}

function getClientIp(req: express.Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) {
    return fwd.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function parseCookies(req: express.Request): Record<string, string> {
  const header = req.headers.cookie || '';
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}

function createSessionToken(): string {
  const payload = Buffer.from(
    JSON.stringify({
      role: 'admin',
      exp: Date.now() + SESSION_TTL_MS,
      nonce: crypto.randomBytes(8).toString('hex'),
    }),
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
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

function getAdminTokenFromRequest(req: express.Request): string | undefined {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return bearer;
  }
  const cookies = parseCookies(req);
  return cookies[COOKIE_NAME];
}

function verifyAdminPassword(candidate: string): boolean {
  const trimmed = candidate.trim();
  if (!trimmed) return false;
  const a = crypto.createHash('sha256').update(trimmed).digest();
  const b = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest();
  return crypto.timingSafeEqual(a, b);
}

function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const token = getAdminTokenFromRequest(req);
  if (!verifySessionToken(token)) {
    res.status(401).json({ ok: false, message: 'Administrator authentication required.' });
    return;
  }
  next();
}

function escapeCsvCell(value: string): string {
  const raw = String(value ?? '');
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

async function startServer(): Promise<void> {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));

  // Public survey status (no participant data exposed)
  app.get('/api/status', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      ok: true,
      surveyOpen: store.config.surveyOpen,
      totalQuestions: ALL_QUESTIONS.length,
    });
  });

  // Public survey submission endpoint (saved directly to built-in backend store)
  app.post('/api/responses', (req, res) => {
    const ip = getClientIp(req);
    if (isRateLimited(`submit:${ip}`, 30, 60_000)) {
      res.status(429).json({
        ok: false,
        message: 'Too many submission attempts. Please wait a minute and try again.',
      });
      return;
    }

    if (!store.config.surveyOpen) {
      res.status(403).json({
        ok: false,
        message: 'Survey submissions are currently closed by the administrator.',
      });
      return;
    }

    const validation = validateSurveyPayload(req.body);
    if (!validation.valid || !validation.sanitized) {
      res.status(400).json({
        ok: false,
        message: validation.error || 'Invalid survey submission.',
      });
      return;
    }

    const { submissionId, name, consent, answers } = validation.sanitized;

    const existing = store.responses.find((r) => r.submissionId === submissionId);
    if (existing) {
      res.status(200).json({
        ok: true,
        duplicate: true,
        submissionId: existing.submissionId,
        timestamp: existing.timestamp,
        message: 'This survey response has already been recorded.',
      });
      return;
    }

    const record: SurveySubmissionRecord = {
      submissionId,
      timestamp: new Date().toISOString(),
      name,
      consent,
      answers,
    };

    store.responses.push(record);
    writeStore(store);

    res.status(201).json({
      ok: true,
      submissionId: record.submissionId,
      timestamp: record.timestamp,
      message: 'Response recorded successfully.',
    });
  });

  // Admin session check (supports both Authorization Bearer token and cookie)
  app.get('/api/admin/session', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const authenticated = verifySessionToken(getAdminTokenFromRequest(req));
    res.json({
      ok: true,
      authenticated,
    });
  });

  // Admin login — returns Bearer token in JSON AND sets iframe-safe cookie
  app.post('/api/admin/login', (req, res) => {
    const ip = getClientIp(req);
    if (isRateLimited(`login:${ip}`, 15, 60_000)) {
      res.status(429).json({
        ok: false,
        message: 'Too many attempts. Please wait a minute.',
      });
      return;
    }

    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!verifyAdminPassword(password)) {
      res.status(401).json({ ok: false, message: 'Incorrect password.' });
      return;
    }

    const token = createSessionToken();
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: isSecure ? 'none' : 'lax',
      secure: isSecure,
      maxAge: SESSION_TTL_MS,
      path: '/',
    });

    res.json({ ok: true, token });
  });

  // Admin logout
  app.post('/api/admin/logout', (_req, res) => {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.json({ ok: true });
  });

  // Admin overview (analytics, rankings, and all submitted records)
  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const analytics = computeSurveyAnalytics(store.responses);

    res.json({
      ok: true,
      config: {
        surveyOpen: store.config.surveyOpen,
        updatedAt: store.config.updatedAt,
      },
      analytics,
      responses: [...store.responses].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    });
  });

  // Admin survey open/close toggle
  app.patch('/api/admin/config', requireAdmin, (req, res) => {
    const body = req.body as Record<string, unknown>;
    if (typeof body?.surveyOpen !== 'boolean') {
      res.status(400).json({ ok: false, message: 'Invalid configuration update.' });
      return;
    }

    store.config = {
      surveyOpen: body.surveyOpen,
      updatedAt: new Date().toISOString(),
    };
    writeStore(store);

    res.json({
      ok: true,
      config: store.config,
    });
  });

  // Admin delete single response
  app.delete('/api/admin/responses/:submissionId', requireAdmin, (req, res) => {
    const targetId = req.params.submissionId;
    const before = store.responses.length;
    store.responses = store.responses.filter((r) => r.submissionId !== targetId);
    if (store.responses.length === before) {
      res.status(404).json({ ok: false, message: 'Submission record not found.' });
      return;
    }
    writeStore(store);
    res.json({ ok: true });
  });

  // Admin clear all responses
  app.delete('/api/admin/responses', requireAdmin, (_req, res) => {
    store.responses = [];
    writeStore(store);
    res.json({ ok: true });
  });

  // Admin authorized export (CSV or JSON)
  app.get('/api/admin/export', requireAdmin, (req, res) => {
    const format = req.query.format === 'json' ? 'json' : 'csv';
    const sorted = [...store.responses].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="womens-health-survey-responses-${new Date().toISOString().slice(0, 10)}.json"`,
      );
      res.send(
        JSON.stringify(
          { exportedAt: new Date().toISOString(), count: sorted.length, responses: sorted },
          null,
          2,
        ),
      );
      return;
    }

    const headers = [
      'Submission ID',
      'Timestamp',
      'Name',
      'Consent',
      ...ALL_QUESTIONS.map((q) => `Q${q.id}: ${q.text}`),
    ];
    const lines = [headers.map(escapeCsvCell).join(',')];

    for (const r of sorted) {
      const row = [
        r.submissionId,
        r.timestamp,
        r.name || '',
        r.consent ? 'Yes' : 'No',
        ...ALL_QUESTIONS.map((q) => r.answers[String(q.id)] || ''),
      ];
      lines.push(row.map(escapeCsvCell).join(','));
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="womens-health-survey-responses-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    res.send(`\uFEFF${lines.join('\r\n')}`);
  });

  // Ensure unknown /api/* routes and API errors always return JSON (never HTML)
  app.use('/api', (_req, res) => {
    res.status(404).json({ ok: false, message: 'API endpoint not found.' });
  });

  app.use(
    '/api',
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      const msg = err instanceof Error ? err.message : 'Unexpected server error.';
      res.status(500).json({ ok: false, message: msg });
    },
  );

  // Mount Vite dev middleware or serve built dist/
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Women's Health Survey server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
