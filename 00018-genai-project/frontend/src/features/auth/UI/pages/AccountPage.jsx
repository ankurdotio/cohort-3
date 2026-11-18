import { ArrowUpRight, Check, LogOut, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { useAccount } from '../../Hooks/useAuth.js';
import { PageShell } from '../components/PageShell.jsx';
import { ErrorMessage, Spinner } from '../components/Feedback.jsx';

export function AccountPage() {
  const { user, pending, error, notice, logout, reloadProfile } = useAccount();
  const firstName = user.name.split(' ')[0];
  return (
    <PageShell headerAction={
      <button onClick={logout} disabled={Boolean(pending)} className="button-secondary gap-2 px-4 text-xs">
        {pending === 'logout' ? <Spinner /> : <LogOut size={15} />}
        {pending === 'logout' ? 'Signing out...' : 'Sign out'}
      </button>
    }>
      <div className="mx-auto w-full max-w-[960px] py-6 sm:py-10">
        <div className="mb-10">
          <p className="eyebrow mb-4 flex items-center gap-2"><span className="size-1.5 rounded-full bg-forest" /> Your personal space</p>
          <h1 className="font-display text-4xl leading-tight font-semibold tracking-[-1.5px] sm:text-5xl">You&apos;re home, {firstName}.</h1>
          <p className="mt-4 text-sm leading-7 text-muted">A little space of your own. A world of possibility ahead.</p>
        </div>
        <div className="mb-6"><ErrorMessage>{error}</ErrorMessage></div>
        <div className="grid gap-6 md:grid-cols-[1fr_1.15fr]">
          <section className="rounded-2xl border border-line bg-surface p-7 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="flex size-12 items-center justify-center rounded-full bg-sage font-display text-xl font-semibold text-forest">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-sage px-3 py-1.5 text-[11px] font-medium text-forest">
                <Check size={12} /> Signed in
              </span>
            </div>
            <h2 className="mt-7 font-display text-xl font-semibold">Your account</h2>
            <dl className="mt-6 space-y-5 text-sm">
              <div><dt className="mb-1.5 text-xs text-muted">Name</dt><dd className="break-words font-medium">{user.name}</dd></div>
              <div><dt className="mb-1.5 text-xs text-muted">Email address</dt><dd className="break-all font-medium">{user.email}</dd></div>
              <div><dt className="mb-1.5 text-xs text-muted">Member since</dt><dd>{new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</dd></div>
            </dl>
            <button disabled={Boolean(pending)} onClick={reloadProfile} className="text-link mt-6 inline-flex min-h-11 items-center gap-2 text-xs">
              {pending === 'profile' ? <Spinner /> : <RefreshCw size={13} />}
              {pending === 'profile' ? 'Refreshing...' : 'Refresh account details'}
            </button>
            {notice && <p role="status" className="mt-2 text-xs leading-5 text-forest">{notice}</p>}
          </section>
          <section className="flex flex-col justify-between rounded-2xl bg-sage p-7 sm:p-9">
            <div>
              <div className="flex items-center justify-between">
                <Sparkles className="text-forest" size={25} strokeWidth={1.5} />
                <span className="rounded-full border border-chip-line px-3 py-1.5 text-[10px] font-medium tracking-wide text-forest uppercase">On the horizon</span>
              </div>
              <h2 className="mt-9 max-w-xs font-display text-3xl leading-tight font-semibold tracking-[-1px]">One space.<br />More perspectives.</h2>
              <p className="mt-5 max-w-sm text-sm leading-7 text-muted">
                We&apos;re imagining a calmer way to work with AI. Your favorite models, thoughtful conversations, and room for your next big idea.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {['Gemini', 'ChatGPT', 'Claude'].map((model) => (
                  <span key={model} className="rounded-full border border-chip-line px-3 py-1.5 text-xs text-forest">{model}</span>
                ))}
              </div>
            </div>
            <p className="mt-10 flex items-start gap-2 text-xs leading-6 text-muted">
              <ArrowUpRight size={16} className="mt-1 shrink-0" />
              Chat is not available yet. For now, your account is ready.
            </p>
          </section>
        </div>
        <p className="mt-7 flex items-center justify-center gap-2 text-[11px] text-muted">
          <ShieldCheck size={14} /> Signed in securely. This space is yours.
        </p>
      </div>
    </PageShell>
  );
}
