import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../../Hooks/useAuth.js';
import { PageShell } from './PageShell.jsx';
import { ErrorMessage, Spinner } from './Feedback.jsx';

export function SessionGate() {
  const { status, sessionError, retrySession } = useAuth();
  if (status === 'checking' || status === 'error') {
    return (
      <PageShell>
        <div className="mx-auto w-full max-w-sm space-y-6 py-24 text-center">
          {status === 'checking' ? (
            <p role="status" className="flex items-center justify-center gap-3 text-sm text-muted"><Spinner /> Finding your space...</p>
          ) : (
            <>
              <h1 className="font-display text-2xl font-semibold">Let&apos;s try that again.</h1>
              <ErrorMessage>{sessionError}</ErrorMessage>
              <button onClick={retrySession} className="button-primary w-full">Retry connection</button>
            </>
          )}
        </div>
      </PageShell>
    );
  }
  return <Outlet />;
}

export function ProtectedRoute() {
  const { status } = useAuth();
  return status === 'authenticated' ? <Outlet /> : <Navigate to="/login" replace />;
}

export function GuestRoute() {
  const { status } = useAuth();
  return status === 'authenticated' ? <Navigate to="/account" replace /> : <Outlet />;
}
