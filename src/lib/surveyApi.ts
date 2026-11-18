import { INITIAL_CLEAN_RESPONSES } from '../shared/initialCleanData';
import {
  ALL_QUESTIONS,
  computeSurveyAnalytics,
  validateSurveyPayload,
  type SurveyAnalyticsReport,
  type SurveySubmissionRecord,
} from '../shared/surveySchema';
import { safeFetchJson } from './http';

const ADMIN_TOKEN_STORAGE_KEY = 'whs_admin_token_v1';
const LOCAL_STORE_KEY = 'whs_static_survey_store_v1';
const STATIC_ADMIN_TOKEN = 'static-admin-session-uzairsajjad12';

export interface AdminConfig {
  surveyOpen: boolean;
  updatedAt: string;
}

export interface OverviewResponse {
  ok: boolean;
  config: AdminConfig;
  analytics: SurveyAnalyticsReport;
  responses: SurveySubmissionRecord[];
}

interface LocalStoreData {
  config: AdminConfig;
  responses: SurveySubmissionRecord[];
}

function readLocalStore(): LocalStoreData {
  try {
    const raw = localStorage.getItem(LOCAL_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LocalStoreData>;
      if (parsed && Array.isArray(parsed.responses) && parsed.config) {
        return {
          config: {
            surveyOpen:
              typeof parsed.config.surveyOpen === 'boolean' ? parsed.config.surveyOpen : true,
            updatedAt:
              typeof parsed.config.updatedAt === 'string'
                ? parsed.config.updatedAt
                : new Date().toISOString(),
          },
          responses: parsed.responses,
        };
      }
    }
  } catch {
    // Ignore storage issues
  }
  const initial: LocalStoreData = {
    config: { surveyOpen: true, updatedAt: new Date().toISOString() },
    responses: [...INITIAL_CLEAN_RESPONSES],
  };
  writeLocalStore(initial);
  return initial;
}

function writeLocalStore(data: LocalStoreData): void {
  try {
    localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage issues
  }
}

export function getStoredAdminToken(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredAdminToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage issues
  }
}

function isApiMissing(status: number, data: unknown): boolean {
  return data === null && (status === 404 || status === 405 || status === 0 || status >= 500);
}

function escapeCsvCell(value: string): string {
  const raw = String(value ?? '');
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export async function fetchSurveyStatus(): Promise<{ surveyOpen: boolean }> {
  try {
    const res = await safeFetchJson<{ ok?: boolean; surveyOpen?: boolean }>('/api/status', {
      cache: 'no-store',
    });
    if (res.ok && res.data && typeof res.data.surveyOpen === 'boolean') {
      return { surveyOpen: res.data.surveyOpen };
    }
    if (!isApiMissing(res.status, res.data)) {
      return { surveyOpen: true };
    }
  } catch {
    // Static host (e.g. GitHub Pages) without Express backend
  }
  const local = readLocalStore();
  return { surveyOpen: local.config.surveyOpen };
}

export async function submitSurveyResponse(payload: {
  submissionId: string;
  name: string;
  consent: boolean;
  answers: Record<number, string>;
  website?: string;
}): Promise<{ submissionId: string; timestamp: string }> {
  try {
    const res = await safeFetchJson<{
      ok?: boolean;
      message?: string;
      submissionId?: string;
      timestamp?: string;
    }>('/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, id: payload.submissionId }),
    });

    if (res.data) {
      if (!res.ok || !res.data.ok) {
        throw new Error(res.data.message || 'Your response could not be saved.');
      }
      return {
        submissionId: res.data.submissionId || payload.submissionId,
        timestamp: res.data.timestamp || new Date().toISOString(),
      };
    }

    if (!isApiMissing(res.status, res.data)) {
      throw new Error(res.errorMessage || 'Your response could not be saved.');
    }
  } catch (err) {
    if (err instanceof Error && err.message && !err.message.toLowerCase().includes('fetch')) {
      throw err;
    }
  }

  // Static host fallback (GitHub Pages): validate identically and persist in localStorage
  const local = readLocalStore();
  if (!local.config.surveyOpen) {
    throw new Error('Survey submissions are currently closed by the administrator.');
  }

  const validation = validateSurveyPayload(payload);
  if (!validation.valid || !validation.sanitized) {
    throw new Error(validation.error || 'Invalid survey submission.');
  }

  const existing = local.responses.find(
    (r) => r.submissionId === validation.sanitized!.submissionId,
  );
  if (existing) {
    return { submissionId: existing.submissionId, timestamp: existing.timestamp };
  }

  const record: SurveySubmissionRecord = {
    submissionId: validation.sanitized.submissionId,
    timestamp: new Date().toISOString(),
    name: validation.sanitized.name,
    consent: true,
    answers: validation.sanitized.answers,
  };
  local.responses.push(record);
  writeLocalStore(local);
  return { submissionId: record.submissionId, timestamp: record.timestamp };
}

export async function checkAdminSession(token: string | null): Promise<boolean> {
  try {
    const res = await safeFetchJson<{ authenticated?: boolean }>('/api/admin/session', {
      cache: 'no-store',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.data) {
      return Boolean(res.ok && res.data.authenticated);
    }
    if (!isApiMissing(res.status, res.data)) {
      return false;
    }
  } catch {
    // Fallback to static mode
  }
  return token === STATIC_ADMIN_TOKEN;
}

export async function adminLogin(password: string): Promise<string> {
  try {
    const res = await safeFetchJson<{ ok?: boolean; token?: string; message?: string }>(
      '/api/admin/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      },
    );
    if (res.data) {
      if (!res.ok || !res.data.ok || !res.data.token) {
        throw new Error(res.data.message || 'Incorrect password.');
      }
      setStoredAdminToken(res.data.token);
      return res.data.token;
    }
    if (!isApiMissing(res.status, res.data)) {
      throw new Error(res.errorMessage || 'Incorrect password.');
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'Incorrect password.') {
      throw err;
    }
  }

  // Static host fallback (GitHub Pages)
  if (password.trim() !== 'Uzairsajjad@12') {
    throw new Error('Incorrect password.');
  }
  setStoredAdminToken(STATIC_ADMIN_TOKEN);
  return STATIC_ADMIN_TOKEN;
}

export async function adminLogout(): Promise<void> {
  setStoredAdminToken(null);
  await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
}

export async function fetchAdminOverview(token: string | null): Promise<OverviewResponse> {
  if (token !== STATIC_ADMIN_TOKEN) {
    try {
      const res = await safeFetchJson<OverviewResponse & { message?: string }>(
        '/api/admin/overview',
        {
          cache: 'no-store',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      if (res.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      if (res.data) {
        if (!res.ok || !res.data.ok) {
          throw new Error(res.data.message || 'Unable to load dashboard data.');
        }
        return res.data;
      }
      if (!isApiMissing(res.status, res.data)) {
        throw new Error(res.errorMessage || 'Unable to load dashboard data.');
      }
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message === 'UNAUTHORIZED' || err.message === 'Unable to load dashboard data.')
      ) {
        throw err;
      }
    }
  }

  const local = readLocalStore();
  const sorted = [...local.responses].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  return {
    ok: true,
    config: local.config,
    analytics: computeSurveyAnalytics(local.responses),
    responses: sorted,
  };
}

export async function toggleAdminSurveyOpen(
  token: string | null,
  surveyOpen: boolean,
): Promise<AdminConfig> {
  if (token !== STATIC_ADMIN_TOKEN) {
    try {
      const res = await safeFetchJson<{ ok?: boolean; message?: string; config?: AdminConfig }>(
        '/api/admin/config',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ surveyOpen }),
        },
      );
      if (res.data) {
        if (!res.ok || !res.data.ok || !res.data.config) {
          throw new Error(res.data.message || 'Could not update survey status.');
        }
        return res.data.config;
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Could not update survey status.') {
        throw err;
      }
    }
  }

  const local = readLocalStore();
  local.config = { surveyOpen, updatedAt: new Date().toISOString() };
  writeLocalStore(local);
  return local.config;
}

export async function deleteAdminResponse(
  token: string | null,
  submissionId: string,
): Promise<void> {
  if (token !== STATIC_ADMIN_TOKEN) {
    try {
      const res = await safeFetchJson<{ ok?: boolean; message?: string }>(
        `/api/admin/responses/${encodeURIComponent(submissionId)}`,
        {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      if (res.data) {
        if (!res.ok || !res.data.ok) {
          throw new Error(res.data.message || 'Could not delete record.');
        }
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Could not delete record.') {
        throw err;
      }
    }
  }

  const local = readLocalStore();
  local.responses = local.responses.filter((r) => r.submissionId !== submissionId);
  writeLocalStore(local);
}

export async function clearAllAdminResponses(token: string | null): Promise<void> {
  if (token !== STATIC_ADMIN_TOKEN) {
    try {
      const res = await safeFetchJson<{ ok?: boolean; message?: string }>(
        '/api/admin/responses',
        {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      if (res.data) {
        if (!res.ok || !res.data.ok) {
          throw new Error(res.data.message || 'Could not clear records.');
        }
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Could not clear records.') {
        throw err;
      }
    }
  }

  const local = readLocalStore();
  local.responses = [];
  writeLocalStore(local);
}

export async function exportAdminResponses(
  token: string | null,
  format: 'csv' | 'json',
): Promise<Blob> {
  if (token !== STATIC_ADMIN_TOKEN) {
    try {
      const res = await fetch(`/api/admin/export?format=${format}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      const ctype = res.headers.get('content-type') || '';
      if (res.ok && !ctype.includes('text/html')) {
        return await res.blob();
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        throw err;
      }
    }
  }

  const local = readLocalStore();
  const sorted = [...local.responses].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  if (format === 'json') {
    const json = JSON.stringify(
      { exportedAt: new Date().toISOString(), count: sorted.length, responses: sorted },
      null,
      2,
    );
    return new Blob([json], { type: 'application/json;charset=utf-8' });
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
  return new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
}
