import { CheckCircle2 } from 'lucide-react';
import { SURVEY_METADATA } from '../shared/surveySchema';

interface ConfirmationViewProps {
  submissionId: string;
  submittedAt: string;
  onStartNewResponse: () => void;
}

export function ConfirmationView({
  submissionId,
  submittedAt,
  onStartNewResponse,
}: ConfirmationViewProps) {
  const formattedTime = submittedAt
    ? new Date(submittedAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '';

  return (
    <main className="mx-auto max-w-2xl px-5 py-14 sm:px-8 sm:py-20">
      <section className="rounded-2xl border border-[#e7dfe8] bg-white p-8 sm:p-12 text-center shadow-[0_10px_36px_rgba(70,54,74,0.04)]">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#f5eff5] text-[#775777]">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </div>

        <p className="mt-6 text-[11px] font-semibold uppercase tracking-widest text-[#775777]">
          Response Confirmed
        </p>

        <h1 className="mt-3 text-3xl sm:text-4xl font-medium tracking-tight text-[#292535] text-balance">
          Thank you for sharing your experience.
        </h1>

        <p className="mt-4 text-base leading-relaxed text-[#4e4558]">
          {SURVEY_METADATA.thankYouMessage}
        </p>

        <div className="mt-7 rounded-xl border border-[#efe7ef] bg-[#faf6fa] p-4 text-xs text-[#6b6070] space-y-1">
          <p>
            Submission Reference:{' '}
            <span className="font-mono-tabular font-medium text-[#292535]">{submissionId}</span>
          </p>
          {formattedTime && (
            <p>
              Recorded: <span className="font-mono-tabular">{formattedTime}</span>
            </p>
          )}
          <p>
            Status: <span className="font-medium text-[#5a3c5a]">Saved to survey database</span>
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-xs text-[#766b7a]">You may safely close this window now.</p>
          <button
            type="button"
            onClick={onStartNewResponse}
            className="text-xs font-medium text-[#775777] underline underline-offset-4 hover:text-[#5a3c5a]"
          >
            Submit another response
          </button>
        </div>
      </section>
    </main>
  );
}
