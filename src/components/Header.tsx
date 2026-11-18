import { LockKeyhole } from 'lucide-react';

export type AppView = 'welcome' | 'survey' | 'review' | 'confirmed' | 'privacy' | 'admin';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onPrimaryAction: () => void;
  primaryLabel: string;
  surveyOpen: boolean;
}

export function Header({
  currentView,
  onNavigate,
  onPrimaryAction,
  primaryLabel,
  surveyOpen,
}: HeaderProps) {
  return (
    <header className="border-b border-[#e7dfe8] bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-5 sm:px-8">
        <button
          type="button"
          onClick={() => onNavigate('welcome')}
          className="text-left text-base sm:text-lg font-semibold tracking-tight text-[#292535] whitespace-nowrap shrink-0 hover:text-[#634263] transition-colors"
        >
          Women&rsquo;s Health Survey
        </button>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#766b7a]"
        >
          <button
            type="button"
            onClick={() => onNavigate('welcome')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#292535] ${
              currentView === 'welcome' || currentView === 'survey' || currentView === 'review'
                ? 'text-[#5a3c5a] underline underline-offset-4 decoration-[#b89ab6]'
                : ''
            }`}
          >
            Survey
          </button>
          <button
            type="button"
            onClick={() => onNavigate('privacy')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#292535] ${
              currentView === 'privacy'
                ? 'text-[#5a3c5a] underline underline-offset-4 decoration-[#b89ab6]'
                : ''
            }`}
          >
            Privacy Notice
          </button>
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors hover:text-[#292535] ${
              currentView === 'admin'
                ? 'text-[#5a3c5a] underline underline-offset-4 decoration-[#b89ab6]'
                : ''
            }`}
          >
            <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
            Admin
          </button>
        </nav>

        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className="md:hidden text-xs font-medium text-[#766b7a] hover:text-[#292535] whitespace-nowrap shrink-0"
          >
            Admin
          </button>
          <button
            type="button"
            onClick={onPrimaryAction}
            disabled={!surveyOpen && currentView === 'welcome'}
            className="rounded-lg bg-[#775777] px-4 py-2 text-xs sm:text-sm font-medium text-white whitespace-nowrap shrink-0 transition-colors hover:bg-[#634263] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </header>
  );
}
