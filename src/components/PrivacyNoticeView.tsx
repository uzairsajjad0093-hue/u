import { ArrowLeft, ShieldCheck } from 'lucide-react';

interface PrivacyNoticeViewProps {
  onBack: () => void;
}

export function PrivacyNoticeView({ onBack }: PrivacyNoticeViewProps) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <article className="rounded-2xl border border-[#e7dfe8] bg-white p-7 sm:p-11 shadow-[0_10px_36px_rgba(70,54,74,0.04)]">
        <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-widest text-[#775777]">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <span>Privacy &amp; Data Governance</span>
        </div>

        <h1 className="mt-3 text-3xl sm:text-4xl font-medium tracking-tight text-[#292535]">
          Confidentiality &amp; Privacy Notice
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-[#6b6070]">
          This notice explains how information submitted through the Women&rsquo;s Health Survey is
          collected, stored, and protected.
        </p>

        <div className="mt-8 space-y-6 border-t border-[#efe9f0] pt-7 text-sm leading-relaxed text-[#4e4558]">
          <section>
            <h2 className="font-sans text-base font-semibold text-[#292535]">
              1. Educational Purpose
            </h2>
            <p className="mt-1.5">
              All survey responses are collected strictly for an undergraduate/university ICT
              educational research project studying experiences and awareness regarding menstrual
              health, pregnancy, and spine or back pain. Data is not sold, shared with advertisers,
              or used for commercial profiling.
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-[#292535]">
              2. Voluntary Participation &amp; Minimal Collection
            </h2>
            <p className="mt-1.5">
              Participation is completely voluntary. Every one of the 21 survey questions is
              optional and may be skipped. The survey does not ask for email addresses, phone
              numbers, home addresses, or government identifiers.
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-[#292535]">
              3. Optional Name &amp; Confidentiality
            </h2>
            <p className="mt-1.5">
              The participant name field is entirely optional. If you leave it blank, your
              submission is recorded without your name. If you voluntarily enter your name, please
              note that your response is no longer strictly anonymous to the research organizer,
              though it remains confidential and restricted to the project team.
            </p>
          </section>

          <section>
            <h2 className="font-sans text-base font-semibold text-[#292535]">
              4. Access Controls &amp; Security
            </h2>
            <p className="mt-1.5">
              Survey submissions are transmitted over HTTPS, validated server-side, and stored in a
              protected research database accessible only to the authorized project administrator.
              Individual responses are never published on public pages, and third-party behavioral
              analytics trackers are disabled.
            </p>
          </section>

          <section className="rounded-xl border border-[#efe7ef] bg-[#faf6fa] p-5">
            <h2 className="font-sans text-base font-semibold text-[#292535]">
              5. Organizer Contact Details
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#5c4f61]">
              If you have questions about this study or wish to request removal of an identifiable
              response, please contact the research organizer:
            </p>
            <dl className="mt-3 space-y-1 text-xs sm:text-sm text-[#3d3547]">
              <div>
                <dt className="inline font-semibold">Organizer / Research Team: </dt>
                <dd className="inline">[Organizer Name / ICT Project Team]</dd>
              </div>
              <div>
                <dt className="inline font-semibold">Institution: </dt>
                <dd className="inline">[Department &amp; University Name]</dd>
              </div>
              <div>
                <dt className="inline font-semibold">Email: </dt>
                <dd className="inline">[organizer-email@university.edu]</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="mt-8 border-t border-[#efe9f0] pt-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#775777] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#634263]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to Survey</span>
          </button>
        </div>
      </article>
    </main>
  );
}
