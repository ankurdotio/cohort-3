import { ArrowRight, LockKeyhole } from 'lucide-react';
import { Link } from 'react-router';
import { useAuthForm } from '../../Hooks/useAuthForm.js';
import { useAuth } from '../../Hooks/useAuth.js';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { FormField } from '../components/FormField.jsx';
import { ErrorMessage, Spinner } from '../components/Feedback.jsx';

export function LoginPage() {
  const form = useAuthForm('login');
  const { sessionError } = useAuth();
  return (
    <AuthLayout>
      <p className="eyebrow mb-4">A fresh start, familiar space</p>
      <h2 className="font-display text-[34px] leading-tight font-semibold tracking-[-1.2px] sm:text-[38px]">
        Welcome back.
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted">Sign in and pick up where possibility begins.</p>

      <form noValidate onSubmit={form.submit} className="mt-9 space-y-5" aria-busy={form.pending}>
        <ErrorMessage>{form.error || sessionError}</ErrorMessage>
        <fieldset disabled={form.pending} className="space-y-5 disabled:opacity-70">
          <legend className="sr-only">Sign in</legend>
          <FormField
            label="Email address" name="email" type="email" autoComplete="email" autoCapitalize="none"
            spellCheck={false} placeholder="you@example.com" required
            value={form.values.email} onChange={form.updateField} error={form.fieldErrors.email}
          />
          <FormField
            label="Password" name="password" type={form.showPassword ? 'text' : 'password'}
            autoComplete="current-password" placeholder="Enter your password" required
            value={form.values.password} onChange={form.updateField} error={form.fieldErrors.password}
            showPassword={form.showPassword} onToggle={form.togglePassword}
          />
          <button type="submit" className="button-primary mt-2 w-full" disabled={form.pending}>
            {form.pending ? <><Spinner /> Signing in...</> : <>Sign in <ArrowRight size={17} /></>}
          </button>
        </fieldset>
      </form>

      <p className="mt-7 text-center text-[13px] text-muted">
        New to Downbot?{' '}
        <Link to="/register" className="text-link inline-flex min-h-11 items-center">Create an account</Link>
      </p>
      <div className="mt-8 flex items-center justify-center gap-2 border-t border-line pt-6 text-[11px] text-muted">
        <LockKeyhole size={13} aria-hidden="true" />
        Your space starts with a secure sign-in.
      </div>
    </AuthLayout>
  );
}
