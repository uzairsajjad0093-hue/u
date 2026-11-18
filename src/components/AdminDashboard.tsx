import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Download,
  Eye,
  EyeOff,
  Filter,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  Table2,
  Trash2,
  X,
} from 'lucide-react';
import {
  adminLogin,
  adminLogout,
  checkAdminSession,
  clearAllAdminResponses,
  deleteAdminResponse,
  exportAdminResponses,
  fetchAdminOverview,
  getStoredAdminToken,
  setStoredAdminToken,
  toggleAdminSurveyOpen,
  type OverviewResponse,
} from '../lib/surveyApi';
import {
  SURVEY_SECTIONS,
  type QuestionAnalytics,
  type SurveyAnalyticsReport,
  type SurveySubmissionRecord,
} from '../shared/surveySchema';

const CHART_PALETTE = ['#775777', '#9b7499', '#be9abc', '#d9bdd8', '#ecdae9'];

function SectionOverviewChart({ analytics }: { analytics: SurveyAnalyticsReport }) {
  return (
    <div className="rounded-xl border border-[#e7dfe8] bg-white p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-sans text-base font-semibold text-[#292535]">
          Section Completion Graph
        </h2>
        <span className="font-mono-tabular text-xs text-[#766b7a]">
          Average answer rate across 5 sections
        </span>
      </div>

      <div className="mt-5 grid grid-cols-5 items-end gap-3 sm:gap-5 h-44 border-b border-[#efe9f0] pb-3">
        {analytics.sections.map((sec) => {
          const heightPct = Math.max(4, Math.min(100, sec.averageCompletionRate));
          return (
            <div key={sec.sectionId} className="flex h-full flex-col items-center justify-end gap-2">
              <span className="font-mono-tabular text-xs font-semibold text-[#5a3c5a]">
                {sec.averageCompletionRate.toFixed(0)}%
              </span>
              <div className="flex w-full max-w-[54px] flex-1 items-end rounded-t-lg bg-[#f6f1f7] p-0.5">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-[#775777] to-[#a986a7] transition-[height] duration-300"
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-5 gap-3 sm:gap-5 text-center">
        {analytics.sections.map((sec) => (
          <div key={sec.sectionId}>
            <p className="font-mono-tabular text-[11px] font-semibold text-[#775777]">
              S{sec.sectionId}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-[#5d5466]" title={sec.title}>
              {sec.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function KeyHighlightsGraph({ analytics }: { analytics: SurveyAnalyticsReport }) {
  const highlightIds = [1, 3, 5, 14];
  const highlighted = highlightIds
    .map((id) => analytics.questions.find((q) => q.id === id))
    .filter((q): q is QuestionAnalytics => Boolean(q));

  return (
    <div className="rounded-xl border border-[#e7dfe8] bg-white p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-sans text-base font-semibold text-[#292535]">
          Key Research Indicators
        </h2>
        <span className="font-mono-tabular text-xs text-[#766b7a]">
          Top ranked response per key indicator
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {highlighted.map((q) => {
          const leader = q.options[0];
          const pct = leader ? leader.percentage : 0;
          return (
            <div key={q.id} className="rounded-lg border border-[#efe9f0] bg-[#fcfafc] p-3.5">
              <p className="text-[11px] font-medium text-[#775777]">Q{q.id}</p>
              <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-[#292535]" title={q.text}>
                {q.text}
              </p>
              <div className="mt-2.5 flex items-baseline justify-between gap-2">
                <span className="truncate text-xs font-medium text-[#4e4558]">
                  {q.answeredCount > 0 && leader ? leader.option : 'No data yet'}
                </span>
                <span className="font-mono-tabular shrink-0 text-sm font-semibold text-[#5a3c5a]">
                  {pct.toFixed(1)}%
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#efe7ef]">
                <div
                  className="h-full rounded-full bg-[#775777] transition-[width] duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuestionDonutChart({ question }: { question: QuestionAnalytics }) {
  const total = question.answeredCount;
  if (total === 0) {
    return (
      <div className="flex h-[116px] items-center justify-center rounded-xl border border-dashed border-[#e7dfe8] bg-[#fcfafc] px-4 text-center text-xs text-[#8c7f8f]">
        No answers recorded yet
      </div>
    );
  }

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offsetAccumulator = 0;

  return (
    <div className="flex items-center gap-5">
      <svg
        width="112"
        height="112"
        viewBox="0 0 112 112"
        role="img"
        aria-label={`Distribution graph for Question ${question.id}`}
        className="shrink-0"
      >
        <circle cx="56" cy="56" r={radius} fill="none" stroke="#f2ecf3" strokeWidth="15" />
        {question.options.map((opt, idx) => {
          if (opt.count === 0) return null;
          const fraction = opt.count / total;
          const dashLength = fraction * circumference;
          const dashOffset = -offsetAccumulator;
          offsetAccumulator += dashLength;
          return (
            <circle
              key={opt.option}
              cx="56"
              cy="56"
              r={radius}
              fill="none"
              stroke={CHART_PALETTE[idx % CHART_PALETTE.length]}
              strokeWidth="15"
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 56 56)"
            />
          );
        })}
        <text
          x="56"
          y="53"
          textAnchor="middle"
          className="fill-[#292535] text-[14px] font-semibold font-mono-tabular"
        >
          {total}
        </text>
        <text x="56" y="68" textAnchor="middle" className="fill-[#766b7a] text-[10px]">
          answers
        </text>
      </svg>

      <ul className="min-w-0 flex-1 space-y-1.5 text-xs">
        {question.options.map((opt, idx) => (
          <li key={opt.option} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2 text-[#4e4558]">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: CHART_PALETTE[idx % CHART_PALETTE.length] }}
              />
              <span className="truncate">{opt.option}</span>
            </span>
            <span className="font-mono-tabular shrink-0 font-semibold text-[#292535]">
              {opt.percentage.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminDashboard({
  onSurveyOpenChanged,
}: {
  onSurveyOpenChanged: (open: boolean) => void;
}) {
  const [authState, setAuthState] = useState<'checking' | 'unauthenticated' | 'authenticated'>(
    'checking',
  );
  const tokenRef = useRef<string | null>(getStoredAdminToken());
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<'analytics' | 'responses'>('analytics');
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [overviewError, setOverviewError] = useState('');
  const [togglingOpen, setTogglingOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<'csv' | 'json' | null>(null);

  // Filters
  const [sectionFilter, setSectionFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modal & Delete confirmation
  const [selectedResponse, setSelectedResponse] = useState<SurveySubmissionRecord | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    setOverviewError('');
    try {
      const data = await fetchAdminOverview(tokenRef.current);
      setOverview(data);
      onSurveyOpenChanged(data.config.surveyOpen);
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        tokenRef.current = null;
        setStoredAdminToken(null);
        setAuthState('unauthenticated');
        return;
      }
      setOverviewError(err instanceof Error ? err.message : 'Failed to load dashboard.');
    } finally {
      setLoadingOverview(false);
    }
  }, [onSurveyOpenChanged]);

  useEffect(() => {
    checkAdminSession(tokenRef.current)
      .then((authenticated) => {
        if (authenticated) {
          setAuthState('authenticated');
          loadOverview();
        } else {
          tokenRef.current = null;
          setStoredAdminToken(null);
          setAuthState('unauthenticated');
        }
      })
      .catch(() => setAuthState('unauthenticated'));
  }, [loadOverview]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const token = await adminLogin(passwordInput);
      tokenRef.current = token;
      setPasswordInput('');
      setShowPassword(false);
      setAuthState('authenticated');
      await loadOverview();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Incorrect password.');
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    tokenRef.current = null;
    await adminLogout();
    setOverview(null);
    setSelectedResponse(null);
    setAuthState('unauthenticated');
  }

  async function handleToggleSurveyOpen() {
    if (!overview) return;
    setTogglingOpen(true);
    try {
      const nextCfg = await toggleAdminSurveyOpen(tokenRef.current, !overview.config.surveyOpen);
      onSurveyOpenChanged(nextCfg.surveyOpen);
      setOverview((prev) => (prev ? { ...prev, config: nextCfg } : prev));
    } catch (err) {
      setOverviewError(err instanceof Error ? err.message : 'Status update failed.');
    } finally {
      setTogglingOpen(false);
    }
  }

  async function handleDeleteResponse(submissionId: string) {
    setDeletingId(submissionId);
    try {
      await deleteAdminResponse(tokenRef.current, submissionId);
      setPendingDeleteId(null);
      if (selectedResponse?.submissionId === submissionId) {
        setSelectedResponse(null);
      }
      await loadOverview();
    } catch (err) {
      setOverviewError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleClearAllResponses() {
    setClearingAll(true);
    try {
      await clearAllAdminResponses(tokenRef.current);
      setConfirmClearAll(false);
      setSelectedResponse(null);
      await loadOverview();
    } catch (err) {
      setOverviewError(err instanceof Error ? err.message : 'Clear failed.');
    } finally {
      setClearingAll(false);
    }
  }

  async function handleExport(format: 'csv' | 'json') {
    setExportingFormat(format);
    try {
      const blob = await exportAdminResponses(tokenRef.current, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `womens-health-survey-responses-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        tokenRef.current = null;
        setStoredAdminToken(null);
        setAuthState('unauthenticated');
        return;
      }
      setOverviewError(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setExportingFormat(null);
    }
  }

  const filteredResponses = useMemo(() => {
    const list = overview?.responses || [];
    const q = searchQuery.trim().toLowerCase();
    return list.filter((item) => {
      if (q) {
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesId = item.submissionId.toLowerCase().includes(q);
        if (!matchesName && !matchesId) return false;
      }
      if (countryFilter !== 'all' && item.answers['3'] !== countryFilter) return false;
      if (ageFilter !== 'all' && item.answers['1'] !== ageFilter) return false;
      if (dateFrom) {
        const ts = new Date(item.timestamp).getTime();
        const start = new Date(`${dateFrom}T00:00:00`).getTime();
        if (ts < start) return false;
      }
      if (dateTo) {
        const ts = new Date(item.timestamp).getTime();
        const end = new Date(`${dateTo}T23:59:59.999`).getTime();
        if (ts > end) return false;
      }
      return true;
    });
  }, [overview?.responses, searchQuery, countryFilter, ageFilter, dateFrom, dateTo]);

  const filteredQuestions = useMemo(() => {
    const questions = overview?.analytics.questions || [];
    if (sectionFilter === 'all') return questions;
    return questions.filter((q) => q.sectionId === sectionFilter);
  }, [overview?.analytics.questions, sectionFilter]);

  if (authState === 'checking') {
    return (
      <main className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-5">
        <Loader2 className="h-6 w-6 animate-spin text-[#775777]" aria-label="Loading" />
      </main>
    );
  }

  // Minimal clean password-only prompt (zero extra headings, notes, or clutter above/below)
  if (authState === 'unauthenticated') {
    return (
      <main className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-5 py-12">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl border border-[#e7dfe8] bg-white p-6 shadow-[0_10px_36px_rgba(70,54,74,0.04)]"
        >
          <label htmlFor="admin-password" className="sr-only">
            Password
          </label>
          <div className="relative">
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                if (loginError) setLoginError('');
              }}
              required
              autoFocus
              autoComplete="current-password"
              placeholder="Password"
              className="w-full rounded-lg border border-[#dfd5e2] bg-white py-3 pl-3.5 pr-10 text-sm text-[#292535] placeholder:text-[#9c90a0] focus:border-[#775777] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#8c7f8f] hover:text-[#292535]"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>

          {loginError && (
            <p
              role="alert"
              className="mt-3 rounded-lg border border-[#f0d2cf] bg-[#fff3f2] px-3 py-2 text-xs text-[#9a443c]"
            >
              {loginError}
            </p>
          )}

          <button
            type="submit"
            disabled={loggingIn}
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#775777] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#634263] disabled:opacity-60"
          >
            {loggingIn && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            <span>{loggingIn ? 'Checking…' : 'Open'}</span>
          </button>
        </form>
      </main>
    );
  }

  const analytics = overview?.analytics;
  const config = overview?.config;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      {/* Top Workspace Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e7dfe8] pb-5">
        <div>
          <p className="text-xs font-medium text-[#766b7a]">
            Admin / Women&rsquo;s Health Survey
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-medium tracking-tight text-[#292535]">
            Survey Analytics &amp; Records
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {config && (
            <button
              type="button"
              onClick={handleToggleSurveyOpen}
              disabled={togglingOpen}
              className="inline-flex items-center gap-2 rounded-lg border border-[#dfd5e2] bg-white px-3.5 py-2 text-xs font-medium text-[#292535] whitespace-nowrap shrink-0 transition-colors hover:bg-[#faf6fa]"
            >
              <span>Survey:</span>
              <strong className={config.surveyOpen ? 'text-[#1d6b43]' : 'text-[#9a443c]'}>
                {config.surveyOpen ? 'Open' : 'Closed'}
              </strong>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleExport('csv')}
            disabled={exportingFormat !== null}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfd5e2] bg-white px-3.5 py-2 text-xs font-medium text-[#292535] whitespace-nowrap shrink-0 transition-colors hover:bg-[#faf6fa]"
          >
            <Download className="h-3.5 w-3.5 text-[#775777]" aria-hidden="true" />
            <span>{exportingFormat === 'csv' ? 'Exporting…' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            onClick={loadOverview}
            disabled={loadingOverview}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfd5e2] bg-white px-3.5 py-2 text-xs font-medium text-[#4e4558] whitespace-nowrap shrink-0 transition-colors hover:bg-[#faf6fa]"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loadingOverview ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfd5e2] bg-white px-3.5 py-2 text-xs font-medium text-[#6e6374] whitespace-nowrap shrink-0 transition-colors hover:bg-[#fdf4f6] hover:text-[#9a443c]"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Dashboard sections"
          className="inline-flex rounded-xl border border-[#e7dfe8] bg-white p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'analytics'
                ? 'bg-[#775777] text-white'
                : 'text-[#6b6070] hover:text-[#292535]'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Graphs, Percentages &amp; Rankings</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'responses'}
            onClick={() => setActiveTab('responses')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'responses'
                ? 'bg-[#775777] text-white'
                : 'text-[#6b6070] hover:text-[#292535]'
            }`}
          >
            <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Submitted Records ({analytics?.totalSubmissions ?? 0})</span>
          </button>
        </div>
      </div>

      {overviewError && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-[#f0d2cf] bg-[#fff3f2] p-4 text-sm text-[#9a443c]"
        >
          {overviewError}
        </div>
      )}

      {/* KPI Strip */}
      {analytics && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#e7dfe8] bg-white p-5">
            <p className="text-xs font-medium text-[#766b7a]">Total Respondents</p>
            <p className="mt-2 font-mono-tabular text-3xl font-semibold text-[#292535]">
              {analytics.totalSubmissions}
            </p>
            <p className="mt-1 text-[11px] text-[#8c7f8f]">Recorded survey submissions</p>
          </div>

          <div className="rounded-xl border border-[#e7dfe8] bg-white p-5">
            <p className="text-xs font-medium text-[#766b7a]">Overall Completion Rate</p>
            <p className="mt-2 font-mono-tabular text-3xl font-semibold text-[#292535]">
              {analytics.overallCompletionRate.toFixed(1)}%
            </p>
            <p className="mt-1 text-[11px] text-[#8c7f8f]">Across all 21 questions</p>
          </div>

          <div className="rounded-xl border border-[#e7dfe8] bg-white p-5">
            <p className="text-xs font-medium text-[#766b7a]">Survey Scope</p>
            <p className="mt-2 font-mono-tabular text-3xl font-semibold text-[#292535]">21</p>
            <p className="mt-1 text-[11px] text-[#8c7f8f]">Questions across 5 sections</p>
          </div>

          <div className="rounded-xl border border-[#e7dfe8] bg-white p-5">
            <p className="text-xs font-medium text-[#766b7a]">Latest Submission</p>
            <p className="mt-2 font-mono-tabular text-sm font-semibold text-[#292535]">
              {analytics.latestSubmissionAt
                ? new Date(analytics.latestSubmissionAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : 'No submissions yet'}
            </p>
            <p className="mt-1 text-[11px] text-[#8c7f8f]">Built-in research database</p>
          </div>
        </div>
      )}

      {/* TAB 1: QUESTION ANALYTICS, GRAPHS, PERCENTAGES & RANKINGS */}
      {activeTab === 'analytics' && analytics && (
        <div className="mt-8 space-y-8">
          {/* Overview Charts Row */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionOverviewChart analytics={analytics} />
            <KeyHighlightsGraph analytics={analytics} />
          </section>

          {/* Section Filter Strip */}
          <section>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-sans text-base font-semibold text-[#292535]">
                Question-by-Question Graphs &amp; Rankings
              </h2>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSectionFilter('all')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    sectionFilter === 'all'
                      ? 'bg-[#775777] text-white'
                      : 'border border-[#e7dfe8] bg-white text-[#6b6070] hover:text-[#292535]'
                  }`}
                >
                  All Sections (21)
                </button>
                {SURVEY_SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSectionFilter(s.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      sectionFilter === s.id
                        ? 'bg-[#775777] text-white'
                        : 'border border-[#e7dfe8] bg-white text-[#6b6070] hover:text-[#292535]'
                    }`}
                  >
                    S{s.id}. {s.title}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {analytics.totalSubmissions === 0 && (
            <div className="rounded-xl border border-[#e7dfe8] bg-white p-8 text-center">
              <p className="text-base font-semibold text-[#292535]">
                No survey submissions recorded yet
              </p>
              <p className="mt-1.5 text-sm text-[#766b7a]">
                Percentages, bar graphs, distribution charts, and option rankings for all 21
                questions will update automatically as participants submit the survey.
              </p>
            </div>
          )}

          {/* Question-wise Graphs, Percentages & Rankings */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredQuestions.map((q) => (
              <article
                key={q.id}
                className="flex flex-col justify-between rounded-xl border border-[#e7dfe8] bg-white p-6"
              >
                <div>
                  <p className="text-[11px] font-medium text-[#775777]">
                    Question {q.id} · {q.sectionTitle}
                  </p>
                  <h3 className="mt-1 text-sm sm:text-base font-semibold text-[#292535]">
                    {q.text}
                  </h3>

                  <div className="mt-2 flex flex-wrap items-center gap-2.5 text-xs text-[#766b7a] font-mono-tabular">
                    <span>Answered: {q.answeredCount}</span>
                    <span aria-hidden="true">·</span>
                    <span>Skipped: {q.skippedCount}</span>
                    <span aria-hidden="true">·</span>
                    <span>Rate: {q.responseRate.toFixed(1)}%</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Top: {q.topOptions.length > 0 ? q.topOptions.join(', ') : '—'}
                    </span>
                  </div>

                  {/* Horizontal Proportion Bar Graph */}
                  <div className="mt-5 space-y-2.5">
                    {q.options.map((opt) => (
                      <div key={opt.option}>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="flex min-w-0 items-center gap-2 text-[#3d3547]">
                            <span className="font-mono-tabular w-6 shrink-0 text-[11px] font-semibold text-[#775777]">
                              {opt.rank !== null ? `#${opt.rank}` : '—'}
                            </span>
                            <span className="truncate">{opt.option}</span>
                          </span>
                          <span className="font-mono-tabular shrink-0 text-[#5a3c5a]">
                            {opt.count} ({opt.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-[#f3edf4]">
                          <div
                            className={`h-full rounded-full transition-[width] duration-300 ${
                              opt.rank === 1 ? 'bg-[#775777]' : 'bg-[#b391b1]'
                            }`}
                            style={{ width: `${opt.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Donut Distribution Graph */}
                  <div className="mt-5 border-t border-[#f2ecf3] pt-4">
                    <QuestionDonutChart question={q} />
                  </div>
                </div>

                {/* Ranking & Percentage Table */}
                <div className="mt-5 overflow-x-auto border-t border-[#efe9f0] pt-4">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#efe9f0] text-[#766b7a]">
                        <th className="py-1.5 pr-3 font-semibold">Rank</th>
                        <th className="py-1.5 pr-3 font-semibold">Option</th>
                        <th className="py-1.5 px-3 text-right font-semibold">Responses</th>
                        <th className="py-1.5 pl-3 text-right font-semibold">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f5eff6]">
                      {q.options.map((opt) => (
                        <tr key={opt.option} className="text-[#292535]">
                          <td className="py-2 pr-3 font-mono-tabular font-semibold text-[#775777]">
                            {opt.rank !== null ? `#${opt.rank}` : '—'}
                          </td>
                          <td className="py-2 pr-3">{opt.option}</td>
                          <td className="py-2 px-3 text-right font-mono-tabular">{opt.count}</td>
                          <td className="py-2 pl-3 text-right font-mono-tabular font-medium">
                            {opt.percentage.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </section>
        </div>
      )}

      {/* TAB 2: ALL SUBMITTED RECORDS */}
      {activeTab === 'responses' && overview && (
        <div className="mt-8 space-y-5">
          {/* Search, Filters & Export */}
          <div className="rounded-xl border border-[#e7dfe8] bg-white p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-4">
                <label htmlFor="resp-search" className="block text-[11px] font-medium text-[#766b7a]">
                  Search by Name or Submission ID
                </label>
                <div className="relative mt-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8c7f8f]"
                    aria-hidden="true"
                  />
                  <input
                    id="resp-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search…"
                    className="w-full rounded-lg border border-[#dfd5e2] py-2 pl-8 pr-3 text-xs text-[#292535] focus:border-[#775777] focus:outline-none"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="filter-country" className="block text-[11px] font-medium text-[#766b7a]">
                  Country (Q3)
                </label>
                <select
                  id="filter-country"
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#dfd5e2] bg-white px-2.5 py-2 text-xs text-[#292535]"
                >
                  <option value="all">All countries</option>
                  <option value="Pakistan">Pakistan</option>
                  <option value="India">India</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="filter-age" className="block text-[11px] font-medium text-[#766b7a]">
                  Age Group (Q1)
                </label>
                <select
                  id="filter-age"
                  value={ageFilter}
                  onChange={(e) => setAgeFilter(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#dfd5e2] bg-white px-2.5 py-2 text-xs text-[#292535]"
                >
                  <option value="all">All ages</option>
                  <option value="Under 18">Under 18</option>
                  <option value="18–25">18–25</option>
                  <option value="26–35">26–35</option>
                  <option value="36–45">36–45</option>
                  <option value="Above 45">Above 45</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="filter-from" className="block text-[11px] font-medium text-[#766b7a]">
                  From Date
                </label>
                <input
                  id="filter-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#dfd5e2] px-2.5 py-2 text-xs text-[#292535]"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="filter-to" className="block text-[11px] font-medium text-[#766b7a]">
                  To Date
                </label>
                <input
                  id="filter-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#dfd5e2] px-2.5 py-2 text-xs text-[#292535]"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#f1ebf2] pt-4">
              <div className="flex items-center gap-2 text-xs text-[#766b7a]">
                <Filter className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="font-mono-tabular">
                  Showing {filteredResponses.length} of {overview.responses.length} submissions
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleExport('csv')}
                  disabled={exportingFormat !== null}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfd5e2] bg-white px-3.5 py-2 text-xs font-medium text-[#292535] whitespace-nowrap shrink-0 transition-colors hover:bg-[#faf6fa]"
                >
                  <Download className="h-3.5 w-3.5 text-[#775777]" aria-hidden="true" />
                  <span>{exportingFormat === 'csv' ? 'Exporting…' : 'Export CSV'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('json')}
                  disabled={exportingFormat !== null}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfd5e2] bg-white px-3.5 py-2 text-xs font-medium text-[#292535] whitespace-nowrap shrink-0 transition-colors hover:bg-[#faf6fa]"
                >
                  <Download className="h-3.5 w-3.5 text-[#775777]" aria-hidden="true" />
                  <span>{exportingFormat === 'json' ? 'Exporting…' : 'Export JSON'}</span>
                </button>

                {overview.responses.length > 0 &&
                  (confirmClearAll ? (
                    <span className="inline-flex items-center gap-2 rounded-lg border border-[#f0d2cf] bg-[#fff3f2] px-3 py-1.5 text-xs">
                      <button
                        type="button"
                        onClick={handleClearAllResponses}
                        disabled={clearingAll}
                        className="font-semibold text-[#9a443c] underline underline-offset-4"
                      >
                        {clearingAll ? 'Clearing…' : 'Confirm Clear All'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearAll(false)}
                        className="text-[#6b6070] hover:text-[#292535]"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClearAll(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#f0d2cf] bg-white px-3.5 py-2 text-xs font-medium text-[#9a443c] whitespace-nowrap shrink-0 transition-colors hover:bg-[#fff3f2]"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Clear All</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Responses Table */}
          <div className="overflow-x-auto rounded-xl border border-[#e7dfe8] bg-white">
            {filteredResponses.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#766b7a]">
                {overview.responses.length === 0
                  ? 'No one has submitted the survey yet.'
                  : 'No matching survey responses found.'}
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e7dfe8] bg-[#faf6fa] text-[#5d5466]">
                    <th className="px-4 py-3 font-semibold">#</th>
                    <th className="px-4 py-3 font-semibold">Submitted At</th>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Age · Status</th>
                    <th className="px-4 py-3 font-semibold">Country · Occupation</th>
                    <th className="px-4 py-3 text-right font-semibold">Answered</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1ebf2]">
                  {filteredResponses.map((r, index) => {
                    const answered = Object.values(r.answers).filter(Boolean).length;
                    const isConfirmingDelete = pendingDeleteId === r.submissionId;
                    return (
                      <tr key={r.submissionId} className="hover:bg-[#fcf9fc]">
                        <td className="px-4 py-3 font-mono-tabular text-[#8c7f8f]">
                          {filteredResponses.length - index}
                        </td>
                        <td className="px-4 py-3 font-mono-tabular whitespace-nowrap text-[#4e4558]">
                          {new Date(r.timestamp).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#292535]">
                          {r.name || <span className="italic text-[#9c90a0]">Anonymous</span>}
                        </td>
                        <td className="px-4 py-3 text-[#5d5466]">
                          {(r.answers['1'] || '—') + ' · ' + (r.answers['2'] || '—')}
                        </td>
                        <td className="px-4 py-3 text-[#5d5466]">
                          {(r.answers['3'] || '—') + ' · ' + (r.answers['4'] || '—')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono-tabular font-medium text-[#292535]">
                          {answered}/21
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {isConfirmingDelete ? (
                            <span className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDeleteResponse(r.submissionId)}
                                disabled={deletingId === r.submissionId}
                                className="font-semibold text-[#9a443c] underline underline-offset-4"
                              >
                                {deletingId === r.submissionId ? 'Deleting…' : 'Confirm'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDeleteId(null)}
                                className="text-[#766b7a] hover:text-[#292535]"
                              >
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setSelectedResponse(r)}
                                className="font-medium text-[#775777] underline underline-offset-4 hover:text-[#5a3c5a]"
                              >
                                View Answers
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDeleteId(r.submissionId)}
                                aria-label="Delete submission"
                                className="rounded p-1 text-[#9c90a0] hover:bg-[#fff3f2] hover:text-[#9a443c]"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Individual Response Detail Modal */}
      {selectedResponse && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Response details"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#292535]/40 p-4 backdrop-blur-xs"
        >
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#e7dfe8] bg-white p-6 sm:p-8 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#efe9f0] pb-4">
              <div>
                <p className="font-mono-tabular text-xs text-[#775777]">
                  {selectedResponse.submissionId}
                </p>
                <h2 className="mt-1 font-sans text-lg font-semibold text-[#292535]">
                  {selectedResponse.name || 'Anonymous Participant'}
                </h2>
                <p className="mt-0.5 text-xs text-[#766b7a]">
                  Submitted {new Date(selectedResponse.timestamp).toLocaleString()} · Consent:{' '}
                  {selectedResponse.consent ? 'Confirmed' : 'No'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                aria-label="Close response details"
                className="rounded-lg p-2 text-[#766b7a] hover:bg-[#f5eff5] hover:text-[#292535]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-6">
              {SURVEY_SECTIONS.map((section) => (
                <div key={section.id}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#775777]">
                    {section.numberLabel} · {section.title}
                  </p>
                  <div className="mt-2 divide-y divide-[#f2ecf3] border-t border-[#efe9f0]">
                    {section.questions.map((q) => {
                      const ans = selectedResponse.answers[String(q.id)];
                      return (
                        <div
                          key={q.id}
                          className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 text-xs"
                        >
                          <span className="text-[#5d5466]">
                            <strong className="mr-1.5 font-mono-tabular text-[#8c7f8f]">
                              Q{q.id}.
                            </strong>
                            {q.text}
                          </span>
                          <span
                            className={
                              ans
                                ? 'shrink-0 font-semibold text-[#5a3c5a]'
                                : 'shrink-0 italic text-[#9c90a0]'
                            }
                          >
                            {ans || 'Skipped'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
