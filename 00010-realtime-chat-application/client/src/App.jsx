import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes } from 'react-router-dom';
import { initializeSession } from './features/auth/authSlice.js';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import Brand from './components/Brand.jsx';
import ChatPage from './pages/ChatPage.jsx';

function ProtectedRoute({ children }) {
  const { user, error } = useSelector((state) => state.auth);
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ sessionExpired: error?.status === 401 }}
      />
    );
  }

  return children;
}

export default function App() {
  const dispatch = useDispatch();
  const { user, bootstrap, error } = useSelector((state) => state.auth);
  useEffect(() => {
    dispatch(initializeSession());
  }, [dispatch]);

  if (bootstrap === 'failed') {
    return (
      <main className="session-screen">
        <Brand />
        <h1>Let&apos;s reconnect.</h1>
        <p role="alert">{error.message}</p>
        <button
          className="primary-button"
          onClick={() => dispatch(initializeSession())}
        >
          Try again <span aria-hidden="true">→</span>
        </button>
      </main>
    );
  }

  if (bootstrap !== 'ready') {
    return (
      <main className="session-screen">
        <Brand />
        <p role="status">Getting your space ready...</p>
      </main>
    );
  }

  const homePath = user ? '/account' : '/login';

  return (
    <Routes>
      <Route path="/" element={<Navigate to={homePath} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={homePath} replace />} />
    </Routes>
  );
}
