import { Link } from 'react-router';

export function Brand({ compact = false }) {
  return (
    <Link to="/" aria-label="Downbot home" className="inline-flex items-center gap-3 rounded-lg text-forest">
      <svg className="size-10" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect width="40" height="40" rx="12" fill="currentColor" />
        <path d="M12 12h16v13H17l-5 4V12Z" stroke="var(--color-canvas)" strokeWidth="2" strokeLinejoin="round" />
        <path d="m16 18 4 4 4-4" stroke="var(--color-canvas)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact && <span className="font-display text-[25px] font-bold tracking-[-1.2px]">downbot</span>}
    </Link>
  );
}
