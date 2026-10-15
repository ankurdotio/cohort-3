import { useDispatch, useSelector } from 'react-redux';
import { loadProfile, signOut } from '../features/auth/authSlice.js';
import Brand from '../components/Brand.jsx';

export default function AccountPage() {
  const dispatch = useDispatch();
  const { user, pending, error } = useSelector((state) => state.auth);
  const firstName = user.name.split(' ')[0];
  const initial = user.name.charAt(0).toUpperCase();
  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  function handleSignOut() {
    dispatch(signOut());
  }

  function handleRefresh() {
    dispatch(loadProfile());
  }

  return (
    <div className="account-page">
      <header className="account-header">
        <Brand />
        <button className="secondary-button" onClick={handleSignOut} disabled={pending}>
          Sign out <span aria-hidden="true">↗</span>
        </button>
      </header>
      <main className="account-content">
        <span className="eyebrow">
          <span className="tiny-dot" /> YOU&apos;RE RIGHT WHERE YOU BELONG
        </span>
        <h1>Hello, {firstName}<span className="brand-dot">.</span></h1>
        <p className="account-intro">You&apos;re all set. This is your little corner of Gather.</p>
        <section className="profile-card" aria-labelledby="profile-heading">
          <div className="profile-card-heading">
            <div className="profile-avatar">{initial}</div>
            <div>
              <h2 id="profile-heading">Your account</h2>
              <span className="status-pill">
                <span className="tiny-dot" /> Signed in
              </span>
            </div>
          </div>
          {error && (
            <div className="error-banner" role="alert">{error.message}</div>
          )}
          <dl>
            <div>
              <dt>Full name</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>Email address</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Member since</dt>
              <dd>{memberSince}</dd>
            </div>
          </dl>
          <button
            className="secondary-button profile-refresh"
            disabled={pending}
            onClick={handleRefresh}
          >
            {pending ? 'One moment...' : 'Refresh profile'}
            {' '}<span aria-hidden="true">↻</span>
          </button>
        </section>
        <p className="account-note">
          The foundation is here. More connections come next.<br />
          <span>This version includes account authentication only.</span>
        </p>
      </main>
      <footer className="account-footer">A place for your next hello.</footer>
    </div>
  );
}
