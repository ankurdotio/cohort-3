import { useState } from 'react';

export default function FormField({
  name,
  label,
  type = 'text',
  hint,
  errors = [],
  ...inputProps
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const error = errors.find((item) => item.field === name)?.message;
  const descriptionIds = [];

  if (hint) descriptionIds.push(`${name}-hint`);
  if (error) descriptionIds.push(`${name}-error`);

  const input = (
    <input
      {...inputProps}
      id={name}
      name={name}
      type={isPassword && showPassword ? 'text' : type}
      required
      aria-invalid={Boolean(error)}
      aria-describedby={descriptionIds.join(' ') || undefined}
    />
  );

  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {isPassword ? (
        <div className="password-input">
          {input}
          <button
            type="button"
            className="show-password"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
              {showPassword && (
                <path d="m3 3 18 18" stroke="currentColor" strokeWidth="1.6" />
              )}
            </svg>
          </button>
        </div>
      ) : input}
      {hint && <small id={`${name}-hint`} className="field-hint">{hint}</small>}
      {error && <small id={`${name}-error`} className="field-error">{error}</small>}
    </div>
  );
}
