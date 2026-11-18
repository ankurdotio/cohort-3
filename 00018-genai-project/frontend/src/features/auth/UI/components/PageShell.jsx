import { Brand } from './Brand.jsx';

export function PageShell({ children, headerAction }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only z-50 rounded bg-forest p-3 text-on-forest focus:not-sr-only focus:absolute">
        Skip to content
      </a>
      <header className="mx-auto flex w-full max-w-[1360px] items-center justify-between gap-6 px-6 py-7 sm:px-10 lg:px-14">
        <Brand />
        {headerAction || <span className="hidden text-xs text-muted sm:block">A little less noise. A lot more possibility.</span>}
      </header>
      <main id="main" className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col justify-center px-6 py-6 sm:px-10 lg:px-14 lg:py-10">
        {children}
      </main>
      <footer className="mx-auto flex w-full max-w-[1360px] flex-col justify-between gap-3 px-6 py-7 text-xs text-muted sm:flex-row sm:px-10 lg:px-14">
        <p>A calmer place for your next big idea.</p>
        <p>Downbot <span aria-hidden="true">&middot;</span> Your space to think</p>
      </footer>
    </div>
  );
}
