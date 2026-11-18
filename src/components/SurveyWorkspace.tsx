import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check, LockKeyhole, ShieldCheck } from 'lucide-react';
import { SURVEY_SECTIONS } from '../shared/surveySchema';

interface SurveyWorkspaceProps {
  activeSectionIndex: number;
  answers: Record<number, string>;
  onSelectAnswer: (questionId: number, option: string) => void;
  onClearAnswer: (questionId: number) => void;
  onChangeSection: (nextIndex: number) => void;
  onBackToWelcome: () => void;
  onGoToReview: () => void;
  websiteHoneypot: string;
  onHoneypotChange: (val: string) => void;
}

export function SurveyWorkspace({
  activeSectionIndex,
  answers,
  onSelectAnswer,
  onClearAnswer,
  onChangeSection,
  onBackToWelcome,
  onGoToReview,
  websiteHoneypot,
  onHoneypotChange,
}: SurveyWorkspaceProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const section = SURVEY_SECTIONS[activeSectionIndex];
  const answeredCount = Object.values(answers).filter((v) => Boolean(v && v.trim())).length;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const timer = setTimeout(() => {
      headingRef.current?.focus({ preventScroll: true });
    }, 60);
    return () => clearTimeout(timer);
  }, [activeSectionIndex]);

  function isSectionComplete(secIndex: number) {
    const sec = SURVEY_SECTIONS[secIndex];
    return sec.questions.some((q) => Boolean(answers[q.id]));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      {/* Compact Mobile Section Progress Bar (< 15% viewport height) */}
      <div className="mb-5 md:hidden">
        <div className="flex items-center justify-between text-xs font-medium text-[#6b6070]">
          <span>
            Section {activeSectionIndex + 1} of {SURVEY_SECTIONS.length} · {section.title}
          </span>
          <span className="font-mono-tabular text-[#775777]">{answeredCount}/21</span>
        </div>
        <div className="mt-2 grid grid-cols-5 gap-1.5" role="tablist" aria-label="Survey sections">
          {SURVEY_SECTIONS.map((sec, idx) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => onChangeSection(idx)}
              aria-label={`Section ${idx + 1}: ${sec.title}`}
              aria-current={idx === activeSectionIndex ? 'step' : undefined}
              className={`h-2 rounded-full transition-colors ${
                idx === activeSectionIndex
                  ? 'bg-[#775777]'
                  : idx < activeSectionIndex || isSectionComplete(idx)
                    ? 'bg-[#b99bb8]'
                    : 'bg-[#e6dce6]'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
        {/* Desktop Sticky Sidebar */}
        <aside className="hidden md:block sticky top-6 space-y-6">
          <div>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-[#8c7f8f]">
              Survey Sections
            </p>
            <nav aria-label="Survey sections" className="mt-3 space-y-1.5">
              {SURVEY_SECTIONS.map((sec, idx) => {
                const isActive = idx === activeSectionIndex;
                const visited = idx < activeSectionIndex;
                const hasAny = isSectionComplete(idx);
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => onChangeSection(idx)}
                    aria-current={isActive ? 'step' : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                      isActive
                        ? 'bg-[#eee5ed] text-[#5a3c5a]'
                        : 'text-[#665d6e] hover:bg-[#f4edf4]'
                    }`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-mono-tabular transition-colors ${
                        isActive
                          ? 'border-[#775777] bg-[#775777] text-white'
                          : visited || hasAny
                            ? 'border-[#c8b2c7] bg-[#f6eff6] text-[#775777]'
                            : 'border-[#dfd6e1] bg-white text-[#766b7a]'
                      }`}
                    >
                      {visited && !isActive ? (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        String(sec.id).padStart(2, '0')
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className={`block truncate text-xs sm:text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>
                        {sec.title}
                      </span>
                      <span className="block truncate text-[11px] text-[#8c7f8f]">
                        {sec.subtitle}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-[#e7dfe8] px-3 pt-5">
            <div className="flex items-center justify-between text-xs text-[#766b7a]">
              <span>Questions answered</span>
              <strong className="font-mono-tabular text-[#775777]">{answeredCount} / 21</strong>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#e8e0e8]">
              <div
                className="h-full rounded-full bg-[#8f6c8d] transition-[width] duration-300"
                style={{ width: `${(answeredCount / 21) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-[#8c7f8f]">
              Every question is optional; skip any you prefer not to answer.
            </p>
          </div>

          <div className="rounded-xl border border-[#ebe2e6] bg-[#f7f2f6] p-4">
            <ShieldCheck className="h-5 w-5 text-[#775777]" aria-hidden="true" />
            <h3 className="mt-2.5 text-xs font-semibold text-[#5a3c5a]">
              Confidential participation
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[#766b7a]">
              Your responses are saved only when you select Submit Survey on the review screen.
            </p>
          </div>
        </aside>

        {/* Main Section Question Card */}
        <main className="rounded-2xl border border-[#e7dfe8] bg-white p-6 sm:p-9 shadow-[0_10px_36px_rgba(70,54,74,0.04)]">
          <div className="border-b border-[#efe9f0] pb-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#775777]">
              Section {String(activeSectionIndex + 1).padStart(2, '0')} of 05
            </p>
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="mt-2 text-2xl sm:text-3xl font-medium tracking-tight text-[#292535] focus:outline-none"
            >
              {section.title}
            </h2>
            {section.instruction && (
              <p className="mt-2.5 rounded-lg border border-[#efe7ef] bg-[#faf6fa] px-4 py-3 text-xs sm:text-sm leading-relaxed text-[#5c4f61]">
                {section.instruction}
              </p>
            )}
          </div>

          <div className="divide-y divide-[#f1ebf2]">
            {section.questions.map((question) => {
              const selected = answers[question.id] || '';
              const isLongList = question.id === 21;
              return (
                <fieldset key={question.id} className="py-6 first:pt-7 last:pb-2">
                  <legend className="flex w-full items-start gap-3 text-sm sm:text-[15px] font-semibold leading-snug text-[#292535]">
                    <span className="mt-0.5 shrink-0 font-mono-tabular text-xs font-medium text-[#9f8a9f]">
                      {String(question.id).padStart(2, '0')}
                    </span>
                    <span>{question.text}</span>
                  </legend>

                  {question.helperText && (
                    <p className="mt-1.5 pl-7 text-xs text-[#766b7a]">{question.helperText}</p>
                  )}

                  <div
                    className={`mt-4 grid gap-2.5 pl-0 sm:pl-7 ${
                      isLongList ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
                    }`}
                  >
                    {question.options.map((option) => {
                      const isChecked = selected === option;
                      return (
                        <label
                          key={option}
                          className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-xs sm:text-sm leading-snug transition-colors ${
                            isChecked
                              ? 'border-[#b89ab6] bg-[#f6f0f6] font-medium text-[#5a3c5a]'
                              : 'border-[#e7dfe8] bg-white text-[#574f5f] hover:border-[#cdbbcd] hover:bg-[#fcf9fc]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option}
                            checked={isChecked}
                            onChange={() => onSelectAnswer(question.id, option)}
                            className="h-4 w-4 shrink-0 accent-[#775777]"
                          />
                          <span className="flex-1">{option}</span>
                          {isChecked && (
                            <Check className="h-4 w-4 shrink-0 text-[#775777]" aria-hidden="true" />
                          )}
                        </label>
                      );
                    })}
                  </div>

                  {selected && (
                    <div className="mt-2.5 pl-0 sm:pl-7">
                      <button
                        type="button"
                        onClick={() => onClearAnswer(question.id)}
                        className="text-xs font-medium text-[#8b7088] underline underline-offset-4 hover:text-[#5a3c5a]"
                      >
                        Clear answer
                      </button>
                    </div>
                  )}
                </fieldset>
              );
            })}
          </div>

          {/* Honeypot field hidden from human users */}
          <label className="sr-only" aria-hidden="true">
            Website
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={websiteHoneypot}
              onChange={(e) => onHoneypotChange(e.target.value)}
            />
          </label>

          <div className="mt-8 flex items-center justify-between gap-4 border-t border-[#efe9f0] pt-6">
            <button
              type="button"
              onClick={() => {
                if (activeSectionIndex === 0) {
                  onBackToWelcome();
                } else {
                  onChangeSection(activeSectionIndex - 1);
                }
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#6e6374] transition-colors hover:bg-[#f5eff5] hover:text-[#292535]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>{activeSectionIndex === 0 ? 'Welcome' : 'Previous'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (activeSectionIndex < SURVEY_SECTIONS.length - 1) {
                  onChangeSection(activeSectionIndex + 1);
                } else {
                  onGoToReview();
                }
              }}
              className="inline-flex min-h-[44px] items-center justify-center gap-2.5 rounded-lg bg-[#775777] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#634263]"
            >
              <span>
                {activeSectionIndex === SURVEY_SECTIONS.length - 1 ? 'Review Answers' : 'Next'}
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-[#8c7f8f]">
            <LockKeyhole className="h-3 w-3" aria-hidden="true" />
            <span>Your answers are sent only when you choose Submit Survey.</span>
          </p>
        </main>
      </div>
    </div>
  );
}
