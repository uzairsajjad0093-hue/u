import { useEffect, useRef, useState } from 'react';
import { fetchSurveyStatus, submitSurveyResponse } from './lib/surveyApi';
import { AdminDashboard } from './components/AdminDashboard';
import { ConfirmationView } from './components/ConfirmationView';
import { Header, type AppView } from './components/Header';
import { PrivacyNoticeView } from './components/PrivacyNoticeView';
import { ReviewView } from './components/ReviewView';
import { SurveyWorkspace } from './components/SurveyWorkspace';
import { WelcomeView } from './components/WelcomeView';

const DRAFT_STORAGE_KEY = 'whs_survey_draft_v1';

interface DraftState {
  participantName: string;
  consent: boolean;
  answers: Record<number, string>;
  activeSectionIndex: number;
}

function getInitialViewFromLocation(): AppView {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.toLowerCase();
    if (hash === '#/admin' || hash === '#admin') return 'admin';
    if (hash === '#/privacy' || hash === '#privacy') return 'privacy';

    const p = window.location.pathname.toLowerCase();
    if (p.endsWith('/admin') || p.includes('/admin/')) return 'admin';
    if (p.endsWith('/privacy')) return 'privacy';
  }
  return 'welcome';
}

function createSubmissionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `whs-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function App() {
  const [view, setView] = useState<AppView>(getInitialViewFromLocation);
  const [surveyOpen, setSurveyOpen] = useState(true);

  const [participantName, setParticipantName] = useState('');
  const [consent, setConsent] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [websiteHoneypot, setWebsiteHoneypot] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmation, setConfirmation] = useState<{
    submissionId: string;
    submittedAt: string;
  } | null>(null);

  const submissionIdRef = useRef<string>(createSubmissionId());

  // Load any in-progress session draft
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DraftState>;
        if (typeof parsed.participantName === 'string') setParticipantName(parsed.participantName);
        if (typeof parsed.consent === 'boolean') setConsent(parsed.consent);
        if (parsed.answers && typeof parsed.answers === 'object') setAnswers(parsed.answers);
        if (typeof parsed.activeSectionIndex === 'number') {
          setActiveSectionIndex(Math.min(4, Math.max(0, parsed.activeSectionIndex)));
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Save draft changes during session
  useEffect(() => {
    try {
      const payload: DraftState = {
        participantName,
        consent,
        answers,
        activeSectionIndex,
      };
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage errors
    }
  }, [participantName, consent, answers, activeSectionIndex]);

  // Fetch survey status (open by default)
  useEffect(() => {
    fetchSurveyStatus()
      .then((res) => setSurveyOpen(res.surveyOpen))
      .catch(() => {});
  }, []);

  // Use hash navigation so routes work cleanly on both Node hosting and GitHub Pages subpaths
  function navigateTo(nextView: AppView) {
    setView(nextView);
    setSubmitError('');
    if (typeof window !== 'undefined') {
      const nextHash =
        nextView === 'admin' ? '#/admin' : nextView === 'privacy' ? '#/privacy' : '';
      if (window.location.hash !== nextHash) {
        if (nextHash) {
          window.location.hash = nextHash;
        } else {
          window.history.replaceState(
            null,
            '',
            window.location.pathname + window.location.search,
          );
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  useEffect(() => {
    const onHashOrPop = () => {
      setView(getInitialViewFromLocation());
    };
    window.addEventListener('hashchange', onHashOrPop);
    window.addEventListener('popstate', onHashOrPop);
    return () => {
      window.removeEventListener('hashchange', onHashOrPop);
      window.removeEventListener('popstate', onHashOrPop);
    };
  }, []);

  const answeredCount = Object.values(answers).filter((v) => Boolean(v && v.trim())).length;

  function handleSelectAnswer(questionId: number, option: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  }

  function handleClearAnswer(questionId: number) {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  }

  function handleStartSurvey() {
    setHasStarted(true);
    navigateTo('survey');
  }

  async function handleSubmitSurvey() {
    if (isSubmitting || !surveyOpen || !consent) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await submitSurveyResponse({
        submissionId: submissionIdRef.current,
        name: participantName.trim(),
        consent: true,
        answers,
        website: websiteHoneypot,
      });

      setConfirmation({
        submissionId: result.submissionId,
        submittedAt: result.timestamp,
      });

      // Reset form state & prepare fresh ID for any future response
      setParticipantName('');
      setConsent(false);
      setAnswers({});
      setActiveSectionIndex(0);
      setHasStarted(false);
      setWebsiteHoneypot('');
      submissionIdRef.current = createSubmissionId();
      try {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // Ignore
      }

      navigateTo('confirmed');
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Unable to submit your response. Please check your connection and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleHeaderPrimaryAction() {
    if (view === 'admin' || view === 'privacy' || view === 'confirmed') {
      navigateTo('welcome');
      return;
    }
    if (view === 'survey') {
      navigateTo('review');
      return;
    }
    if (view === 'review') {
      handleSubmitSurvey();
      return;
    }
    if (consent && surveyOpen) {
      handleStartSurvey();
    } else {
      const el = document.getElementById('welcome-participant-name');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  const primaryLabel =
    view === 'admin' || view === 'privacy' || view === 'confirmed'
      ? 'Return to Survey'
      : view === 'survey'
        ? 'Review Answers'
        : view === 'review'
          ? 'Submit Survey'
          : hasStarted && answeredCount > 0
            ? 'Continue Survey'
            : 'Start Survey';

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        currentView={view}
        onNavigate={navigateTo}
        onPrimaryAction={handleHeaderPrimaryAction}
        primaryLabel={primaryLabel}
        surveyOpen={surveyOpen}
      />

      <div className="flex-1">
        {view === 'welcome' && (
          <WelcomeView
            participantName={participantName}
            onNameChange={setParticipantName}
            consent={consent}
            onConsentChange={setConsent}
            surveyOpen={surveyOpen}
            hasStarted={hasStarted}
            answeredCount={answeredCount}
            onStartSurvey={handleStartSurvey}
            onOpenPrivacy={() => navigateTo('privacy')}
          />
        )}

        {view === 'survey' && (
          <SurveyWorkspace
            activeSectionIndex={activeSectionIndex}
            answers={answers}
            onSelectAnswer={handleSelectAnswer}
            onClearAnswer={handleClearAnswer}
            onChangeSection={setActiveSectionIndex}
            onBackToWelcome={() => navigateTo('welcome')}
            onGoToReview={() => navigateTo('review')}
            websiteHoneypot={websiteHoneypot}
            onHoneypotChange={setWebsiteHoneypot}
          />
        )}

        {view === 'review' && (
          <ReviewView
            participantName={participantName}
            consent={consent}
            answers={answers}
            surveyOpen={surveyOpen}
            isSubmitting={isSubmitting}
            submitError={submitError}
            onEditWelcome={() => navigateTo('welcome')}
            onEditSection={(idx) => {
              setActiveSectionIndex(idx);
              navigateTo('survey');
            }}
            onBackToLastSection={() => {
              setActiveSectionIndex(4);
              navigateTo('survey');
            }}
            onSubmit={handleSubmitSurvey}
          />
        )}

        {view === 'confirmed' && confirmation && (
          <ConfirmationView
            submissionId={confirmation.submissionId}
            submittedAt={confirmation.submittedAt}
            onStartNewResponse={() => {
              setConfirmation(null);
              navigateTo('welcome');
            }}
          />
        )}

        {view === 'privacy' && (
          <PrivacyNoticeView onBack={() => navigateTo('welcome')} />
        )}

        {view === 'admin' && (
          <AdminDashboard onSurveyOpenChanged={(open) => setSurveyOpen(open)} />
        )}
      </div>

      {view !== 'admin' && (
        <footer className="border-t border-[#e7dfe8] bg-white/70">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 text-xs text-[#766b7a] sm:px-8">
            <span className="font-medium text-[#5a3c5a]">
              Women&rsquo;s Health Survey · ICT Educational Research Project
            </span>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => navigateTo('privacy')}
                className="hover:text-[#292535] underline underline-offset-4"
              >
                Confidentiality &amp; Privacy
              </button>
              <button
                type="button"
                onClick={() => navigateTo('admin')}
                className="hover:text-[#292535] underline underline-offset-4"
              >
                Admin
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
