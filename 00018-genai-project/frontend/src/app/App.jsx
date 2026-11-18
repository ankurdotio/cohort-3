import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { AuthPage } from '../features/auth/UI/pages/AuthPage.jsx';
import { AccountPage } from '../features/auth/UI/pages/AccountPage.jsx';
import { GuestRoute, ProtectedRoute, SessionGate } from '../features/auth/UI/components/SessionGate.jsx';
import { PageShell } from '../features/auth/UI/components/PageShell.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<SessionGate />}>
        <Route path="/" element={<Navigate to="/account" replace />} />
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<AuthPage key="login" mode="login" />} />
          <Route path="/register" element={<AuthPage key="register" mode="register" />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/account" element={<AccountPage />} />
        </Route>
        <Route path="*" element={
          <PageShell>
            <div className="space-y-5 py-24 text-center">
              <p className="eyebrow">404 / A little off track</p>
              <h1 className="font-display text-3xl font-semibold">This space doesn&apos;t exist.</h1>
              <Link to="/" className="text-link inline-flex min-h-11 items-center">Back to Downbot</Link>
            </div>
          </PageShell>
        } />
      </Route>
    </Routes>
  );
}
