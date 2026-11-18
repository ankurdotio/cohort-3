import { CircleAlert, LoaderCircle } from 'lucide-react';

export function ErrorMessage({ children }) {
  if (!children) return null;
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-error-line bg-error-soft p-4 text-sm leading-6 text-error">
      <CircleAlert size={18} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function Spinner({ className = '' }) {
  return <LoaderCircle aria-hidden="true" size={18} className={`animate-spin motion-reduce:animate-none ${className}`} />;
}
