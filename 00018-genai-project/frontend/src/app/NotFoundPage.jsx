import { Link } from 'react-router';
import { PageShell } from '../features/auth/UI/components/PageShell.jsx';

export function NotFoundPage() {
  return (
    <PageShell>
      <div className="space-y-5 py-24 text-center">
        <p className="eyebrow">404 / A little off track</p>
        <h1 className="font-display text-3xl font-semibold">This space doesn&apos;t exist.</h1>
        <Link to="/" className="text-link inline-flex min-h-11 items-center">Back to Downbot</Link>
      </div>
    </PageShell>
  );
}
