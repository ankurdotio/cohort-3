import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { signUp } from '../features/auth/authSlice.js';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const { pending, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previousForm) => ({ ...previousForm, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    dispatch(signUp(form));
  }

  return (
    <AuthLayout
      eyebrow="YOUR NEXT CHAPTER"
      title="Find your people."
      description="Create an account. Make room for connection."
    >
      <form onSubmit={handleSubmit}>
        <FormField
          name="name"
          label="Full name"
          placeholder="What should we call you?"
          autoComplete="name"
          minLength={2}
          maxLength={50}
          value={form.name}
          onChange={handleChange}
          disabled={pending}
          errors={error?.errors}
        />
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
          placeholder="Make it a strong one"
          autoComplete="new-password"
          minLength={8}
          pattern="(?=.*[a-zA-Z])(?=.*[0-9]).{8,}"
          hint="At least 8 characters, with a letter and a number. Maximum 72 bytes."
          value={form.password}
          onChange={handleChange}
          disabled={pending}
          errors={error?.errors}
        />
        <button className="primary-button" disabled={pending} type="submit">
          {pending ? 'One moment...' : 'Create your account'}
          <span aria-hidden="true">→</span>
        </button>
      </form>
      <p className="alternate-action">
        Already part of Gather? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
