import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { authApi } from './session.js';
import { getApiError } from '../API/auth.api.js';
import { sessionReceived } from '../State/auth.slice.js';

export function useAuthForm(mode) {
  const dispatch = useDispatch();
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const isRegister = mode === 'register';

  const updateField = (event) => {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }));
    setError(null);
  };

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    const errors = {};
    if (isRegister && (values.name.trim().length < 2 || values.name.trim().length > 50)) {
      errors.name = 'Name must be 2-50 characters';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      errors.email = 'Enter a valid email address';
    }
    if (isRegister && (values.password.length < 8 || !/[a-z]/i.test(values.password)
      || !/\d/.test(values.password))) {
      errors.password = 'Use at least 8 characters, including a letter and a number';
    } else if (!values.password) {
      errors.password = 'Enter your password';
    }
    if (isRegister && new TextEncoder().encode(values.password).length > 72) {
      errors.password = 'Password must be at most 72 UTF-8 bytes';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError('Please check the highlighted fields.');
      return;
    }
    setPending(true);
    try {
      const input = { email: values.email.trim(), password: values.password };
      if (isRegister) input.name = values.name.trim();
      const session = await authApi[mode](input);
      dispatch(sessionReceived(session));
    } catch (error) {
      const failure = getApiError(error);
      setError(failure.message);
      setFieldErrors(Object.fromEntries(failure.fields.map(({ field, message }) => [field, message])));
    } finally {
      setPending(false);
    }
  }

  return {
    values, pending, error, fieldErrors, showPassword, updateField, submit,
    togglePassword: () => setShowPassword((value) => !value),
  };
}
