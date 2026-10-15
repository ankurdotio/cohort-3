import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, NavLink, useLocation } from 'react-router-dom';
import { clearError } from '../features/auth/authSlice.js';
import Brand from './Brand.jsx';

export default function AuthLayout({ eyebrow, title, description, children }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, error } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch, location.pathname]);

  let alertMessage = error?.message;
  if (!error && location.state?.sessionExpired) {
    alertMessage = 'Your session has expired. Please sign in again.';
  }

  if (user) {
    return <Navigate to="/account" replace />;
  }

  return (
    <main className="auth-layout">
      <aside className="story-panel">
        <Brand />
        <div className="story-content">
          <span className="eyebrow">
            <span className="tiny-dot" /> A LITTLE CLOSER, EVERY DAY
          </span>
          <h1>
            Good things start<br />with a <span>hello.</span>
          </h1>
          <p>
            Your people. Your conversations.<br />
            A space to feel a little more connected.
          </p>
          <div className="conversation-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="message-card message-one">
              <span className="avatar avatar-peach">J</span>
              <div>
                <strong>Hey, you made it!</strong>
                <span>Glad you&apos;re here.</span>
              </div>
              <span className="wave">✦</span>
            </div>
            <div className="message-card message-two">
              <span className="avatar avatar-green">Y</span>
              <div>
                <strong>Wouldn&apos;t miss it.</strong>
                <span>Let&apos;s catch up soon.</span>
              </div>
            </div>
            <div className="typing-card">
              <i /><i /><i />
            </div>
            <span className="spark spark-one">✳</span>
            <span className="spark spark-two">✧</span>
          </div>
          <div className="story-note">
            <span className="note-line" /> MADE FOR REAL CONNECTIONS
          </div>
        </div>
        <span className="story-footer">A place for your next hello.</span>
      </aside>
      <section className="form-panel">
        <div className="mobile-brand">
          <Brand />
        </div>
        <div className="form-panel-top">
          <span className="secure-dot" /> YOUR ACCOUNT, YOUR SPACE
        </div>
        <div className="form-content">
          <span className="eyebrow form-eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p className="form-description">{description}</p>
          <nav className="auth-tabs" aria-label="Account access">
            <NavLink to="/login">Sign in</NavLink>
            <NavLink to="/register">Create account</NavLink>
          </nav>
          {alertMessage && (
            <div className="error-banner" role="alert">{alertMessage}</div>
          )}
          {children}
          <div className="form-divider" />
          <p className="quiet-note">A simple account. A world of possibilities.</p>
        </div>
        <footer className="form-footer">
          <span className="lock-icon" aria-hidden="true">◇</span>
          {' '}Secure sign-in. A fresh start.
        </footer>
      </section>
    </main>
  );
}
