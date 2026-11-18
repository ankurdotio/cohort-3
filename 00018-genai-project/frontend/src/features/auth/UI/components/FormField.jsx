import { Eye, EyeOff } from 'lucide-react';

export function FormField({ label, name, error, hint, showPassword, onToggle, ...inputProps }) {
  const description = error ? `${name}-error` : hint ? `${name}-hint` : undefined;
  return (
    <div>
      <label htmlFor={name} className="mb-2.5 block text-[13px] font-medium">{label}</label>
      <div className="relative">
        <input
          {...inputProps}
          id={name}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={description}
          className={`form-input ${onToggle ? 'pr-14' : ''} ${error ? 'border-error' : ''}`}
        />
        {onToggle && (
          <button
            type="button"
            className="absolute inset-y-0 right-1 flex w-12 items-center justify-center rounded-lg text-muted hover:text-forest"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            onClick={onToggle}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error
        ? <p id={`${name}-error`} className="mt-2 text-xs leading-5 text-error">{error}</p>
        : hint && <p id={`${name}-hint`} className="mt-2 text-xs leading-5 text-muted">{hint}</p>}
    </div>
  );
}
