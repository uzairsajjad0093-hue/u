import { useRef, useState } from 'react';
import { ArrowRight, Flower2, ShieldCheck } from 'lucide-react';
import { SURVEY_METADATA } from '../shared/surveySchema';

interface WelcomeViewProps {
  participantName: string;
  onNameChange: (value: string) => void;
  consent: boolean;
  onConsentChange: (checked: boolean) => void;
  surveyOpen: boolean;
  hasStarted: boolean;
  answeredCount: number;
  onStartSurvey: () => void;
  onOpenPrivacy: () => void;
}

export function WelcomeView({
  participantName,
  onNameChange,
  consent,
  onConsentChange,
  surveyOpen,
  hasStarted,
  answeredCount,
  onStartSurvey,
  onOpenPrivacy,
}: WelcomeViewProps) {
  const [consentError, setConsentError] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const consentRef = useRef<HTMLInputElement>(null);

  function handleStart() {
    if (!surveyOpen) return;
    if (!consent) {
      setConsentError('Please confirm that you have read the introduction and voluntarily agree to participate.');
      consentRef.current?.focus();
      return;
    }
    setConsentError('');
    onStartSurvey();
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      {!surveyOpen && (
        <div
          role="status"
          className="mb-8 rounded-xl border border-[#e6d5dc] bg-[#fdf4f6] px-5 py-4 text-sm text-[#7a3f51]"
        >
          This survey is currently closed by the administrator and is not accepting new submissions at this time.
        </div>
      )}

      <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
        {/* Main Welcome & Consent Card */}
        <section className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-[#e7dfe8] bg-white p-7 sm:p-10 shadow-[0_10px_36px_rgba(70,54,74,0.04)]">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-[#775777]">
              University ICT Research Project
            </p>

            <h1 className="mt-3 text-3xl sm:text-4xl lg:text-[42px] font-medium leading-[1.18] tracking-tight text-[#292535] text-balance">
              {SURVEY_METADATA.title}
            </h1>

            <p className="mt-2.5 text-base sm:text-lg italic text-[#5e4c63]">
              {SURVEY_METADATA.subtitle}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[#766b7a]">
              <span>21 questions</span>
              <span aria-hidden="true">·</span>
              <span>5 sections</span>
              <span aria-hidden="true">·</span>
              <span>All questions optional</span>
              <span aria-hidden="true">·</span>
              <span>No email or phone required</span>
            </div>

            <div className="mt-7 rounded-xl border border-[#efe7ef] bg-[#faf6fa] p-5 text-sm leading-relaxed text-[#4e4558]">
              {SURVEY_METADATA.introduction}
            </div>

            <div className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="welcome-participant-name"
                  className="block text-sm font-semibold text-[#292535]"
                >
                  Participant name{' '}
                  <span className="ml-1 text-xs font-normal text-[#8b7f8f]">(optional)</span>
                </label>
                <input
                  id="welcome-participant-name"
                  type="text"
                  value={participantName}
                  onChange={(e) => onNameChange(e.target.value)}
                  maxLength={100}
                  autoComplete="off"
                  placeholder="Enter your name or leave blank"
                  className="mt-2 w-full rounded-lg border border-[#dfd5e2] bg-white px-4 py-3 text-sm text-[#292535] placeholder:text-[#a89ca9] transition-colors focus:border-[#775777] focus:outline-none"
                />
                <p className="mt-1.5 text-xs text-[#766b7a]">
                  Leave blank if you prefer not to share your name. Note: if you enter your name, your
                  response will be identifiable to the research team.
                </p>
              </div>

              <div className="pt-1">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e9e0ea] bg-[#fdfbfd] p-4 transition-colors hover:border-[#cbb7cc]">
                  <input
                    ref={consentRef}
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      onConsentChange(e.target.checked);
                      if (e.target.checked) setConsentError('');
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#cbb7cc] accent-[#775777]"
                  />
                  <span className="text-sm leading-relaxed text-[#3d3547]">
                    {SURVEY_METADATA.consentStatement}{' '}
                    <span className="font-semibold text-[#775777]" aria-label="required">
                      *
                    </span>
                  </span>
                </label>
                {consentError && (
                  <p
                    role="alert"
                    className="mt-2.5 rounded-lg border border-[#f0d2cf] bg-[#fff3f2] px-3.5 py-2.5 text-xs font-medium text-[#9a443c]"
                  >
                    {consentError}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#efe9f0] pt-6">
            <button
              type="button"
              onClick={handleStart}
              disabled={!surveyOpen}
              className="inline-flex min-h-[44px] items-center justify-center gap-3 rounded-lg bg-[#775777] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#634263] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{hasStarted && answeredCount > 0 ? 'Continue Survey' : 'Start Survey'}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onOpenPrivacy}
              className="text-xs font-medium text-[#775777] underline underline-offset-4 hover:text-[#5a3c5a]"
            >
              Read full confidentiality &amp; data notice
            </button>
          </div>
        </section>

        {/* Visual Editorial & Confidentiality Column */}
        <aside className="lg:col-span-5 flex flex-col justify-between gap-6 rounded-2xl border border-[#e7dfe8] bg-white p-7 sm:p-8 shadow-[0_10px_36px_rgba(70,54,74,0.04)]">
          <div className="overflow-hidden rounded-xl border border-[#efe7ef] bg-[#f8f1f5]">
            {!imageFailed ? (
              <img
                src="/src/assets/images/survey_editorial_botanical_1795000009587.jpg"
                alt="Botanical lavender and blush illustration representing women's health research"
                referrerPolicy="no-referrer"
                onError={() => setImageFailed(true)}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] w-full flex-col items-center justify-center bg-gradient-to-br from-[#f5eff5] via-[#f9f1f4] to-[#efe4ef] p-6 text-center">
                <Flower2 className="h-12 w-12 text-[#8f6c8d]" aria-hidden="true" />
                <p className="mt-3 text-xs font-medium text-[#6e566d]">
                  Women&rsquo;s Health Academic Study
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#775777]" aria-hidden="true" />
              <div>
                <h2 className="text-base font-semibold text-[#292535] font-sans">
                  Confidentiality &amp; Minimal Data
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-[#6b6070]">
                  We do not collect email addresses, phone numbers, or unnecessary personal details.
                  You may skip any of the 21 survey questions, and your responses are used strictly
                  for educational ICT project analysis.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#efe7ef] bg-[#faf7fa] p-4 text-xs leading-relaxed text-[#6b6070]">
              <p className="font-semibold text-[#3d3547]">Research Organizer Contact</p>
              <p className="mt-1">
                Project Lead: [Organizer Name / Student Team] · [Department / University Name]
              </p>
              <p className="mt-0.5">
                Data Inquiries: [organizer-email@university.edu]
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
