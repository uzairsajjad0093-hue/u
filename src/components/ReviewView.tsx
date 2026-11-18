import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { SURVEY_SECTIONS } from '../shared/surveySchema';

interface ReviewViewProps {
  participantName: string;
  consent: boolean;
  answers: Record<number, string>;
  surveyOpen: boolean;
  isSubmitting: boolean;
  submitError: string;
  onEditWelcome: () => void;
  onEditSection: (sectionIndex: number) => void;
  onBackToLastSection: () => void;
  onSubmit: () => void;
}

export function ReviewView({
  participantName,
  consent,
  answers,
  surveyOpen,
  isSubmitting,
  submitError,
  onEditWelcome,
  onEditSection,
  onBackToLastSection,
  onSubmit,
}: ReviewViewProps) {
  const answeredCount = Object.values(answers).filter((v) => Boolean(v && v.trim())).length;

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-12">
      <div className="rounded-2xl border border-[#e7dfe8] bg-white p-6 sm:p-10 shadow-[0_10px_36px_rgba(70,54,74,0.04)]">
        <div className="border-b border-[#efe9f0] pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#775777]">
            Final Review
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-medium tracking-tight text-[#292535]">
            Review your answers
          </h1>
          <p className="mt-2 text-sm text-[#766b7a]">
            You have answered <strong className="font-mono-tabular text-[#5a3c5a]">{answeredCount}</strong>{' '}
            of 21 questions. Skipped questions will remain blank.
          </p>
        </div>

        {/* Participant Details Summary */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#efe7ef] bg-[#faf6fa] px-5 py-4 text-sm">
          <div>
            <span className="text-[#766b7a]">Participant name: </span>
            <strong className="text-[#292535]">
              {participantName.trim() ? participantName.trim() : 'Not provided'}
            </strong>
          </div>
          <button
            type="button"
            onClick={onEditWelcome}
            className="text-xs font-medium text-[#775777] underline underline-offset-4 hover:text-[#5a3c5a]"
          >
            Edit name &amp; consent
          </button>
        </div>

        {/* All 5 Sections Review */}
        <div className="mt-8 space-y-8">
          {SURVEY_SECTIONS.map((section, idx) => (
            <section key={section.id}>
              <div className="flex items-center justify-between border-b border-[#e7dfe8] pb-2.5">
                <h2 className="font-sans text-sm font-semibold text-[#292535]">
                  {String(section.id).padStart(2, '0')}. {section.title}
                </h2>
                <button
                  type="button"
                  onClick={() => onEditSection(idx)}
                  className="text-xs font-medium text-[#775777] underline underline-offset-4 hover:text-[#5a3c5a]"
                >
                  Edit answers
                </button>
              </div>

              <div className="divide-y divide-[#f3edf4]">
                {section.questions.map((q) => {
                  const ans = answers[q.id];
                  return (
                    <div
                      key={q.id}
                      className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 text-sm"
                    >
                      <p className="text-[#5d5466]">
                        <span className="mr-2 font-mono-tabular text-xs text-[#9b8a9c]">
                          Q{q.id}
                        </span>
                        {q.text}
                      </p>
                      <span
                        className={`shrink-0 text-sm ${
                          ans
                            ? 'font-semibold text-[#5a3c5a]'
                            : 'italic text-[#9c90a0]'
                        }`}
                      >
                        {ans || 'Skipped'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {!consent && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-[#f0d2cf] bg-[#fff3f2] p-4 text-sm text-[#9a443c]"
          >
            Consent confirmation is required before submitting.{' '}
            <button
              type="button"
              onClick={onEditWelcome}
              className="font-semibold underline underline-offset-2"
            >
              Return to Welcome page
            </button>
          </div>
        )}

        {!surveyOpen && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-[#e6d5dc] bg-[#fdf4f6] p-4 text-sm text-[#7a3f51]"
          >
            Survey submissions are currently closed by the administrator.
          </div>
        )}

        {submitError && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-[#f0d2cf] bg-[#fff3f2] p-4 text-sm text-[#9a443c]"
          >
            {submitError}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#efe9f0] pt-6">
          <button
            type="button"
            onClick={onBackToLastSection}
            disabled={isSubmitting}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#6e6374] transition-colors hover:bg-[#f5eff5] hover:text-[#292535] disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!surveyOpen || !consent || isSubmitting}
            className="inline-flex min-h-[44px] min-w-[180px] items-center justify-center gap-2.5 rounded-lg bg-[#775777] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#634263] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Submitting response…</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>Submit Survey</span>
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
