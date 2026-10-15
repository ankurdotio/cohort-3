import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { signIn } from '../features/auth/authSlice.js';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';

export default function LoginPage() {
  const dispatch = useDispatch();
  const { pending, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: '', password: '' });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previousForm) => ({ ...previousForm, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    dispatch(signIn(form));
  }

  return (
    <AuthLayout
      eyebrow="A FAMILIAR PLACE"
      title="Welcome back."
      description="Pick up right where you left off."
    >
      <form onSubmit={handleSubmit}>
        <FormField
          name="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          disabled={pending}
          errors={error?.errors}
        />
        <FormField
          name="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          disabled={pending}
          errors={error?.errors}
        />
        <button className="primary-button" disabled={pending} type="submit">
          {pending ? 'One moment...' : 'Sign in'}
          <span aria-hidden="true">→</span>
        </button>
      </form>
      <p className="alternate-action">
        New around here? <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
