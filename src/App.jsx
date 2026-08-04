import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useSyncExternalStore } from 'react';

// Pages
import Login from './pages/Login';
import Register from './pages/Registeration'; // Using your exact spelling
import MemberPortal from './pages/MemberPortal';
import AdminPortal from './pages/AdminPortal';
import UsherDashboard from './pages/UsherDashboard';
import Scanner from './pages/Scanner'; 
import ClaimProfile from './pages/ClaimProfile';
import { getAuthState, setAuthState, subscribeAuthState } from './store/authStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function ProtectedRoute({ children, roles }) {
  const auth = useSyncExternalStore(subscribeAuthState, getAuthState, getAuthState);

  if (!auth.hydrated) return null;

  if (!auth.accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (roles && auth.role && !roles.includes(auth.role)) {
    return <Navigate to={auth.role === 'member' || auth.role === 'leader' ? '/portal' : '/admin'} replace />;
  }

  return children;
}



export default function App() {
  useEffect(() => {
    const bootstrap = async () => {
      const authRoutes = ['/login', '/register', '/claim-profile'];
      if (authRoutes.includes(window.location.pathname)) {
        setAuthState({ hydrated: true });
        return;
      }

      const auth = getAuthState();
      if (auth.hydrated) return;

      try {
        const refreshRes = await fetch(`${API_BASE}/api/users/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (!refreshRes.ok) {
          setAuthState({ hydrated: true });
          return;
        }

        const refreshData = await refreshRes.json();
        setAuthState({ accessToken: refreshData.access_token });

        const meRes = await fetch(`${API_BASE}/api/users/me`, {
          headers: { Authorization: `Bearer ${refreshData.access_token}` },
          credentials: 'include',
        });

        if (meRes.ok) {
          const user = await meRes.json();
          setAuthState({ role: user.role, user, hydrated: true });
        } else {
          setAuthState({ hydrated: true });
        }
      } catch {
        setAuthState({ hydrated: true });
      }
    };

    bootstrap();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/claim-profile" element={<ClaimProfile />} />

        {/* Dashboards & Portals */}
        <Route path="/portal" element={<ProtectedRoute roles={["member", "leader"]}><MemberPortal /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={["hod", "admin"]}><AdminPortal /></ProtectedRoute>} />
        <Route path="/usher-dashboard" element={<ProtectedRoute roles={["usher", "hod"]}><UsherDashboard /></ProtectedRoute>} />
        
        {/* Dynamic Scanner Route for the specific Service */}
        <Route path="/scanner/:id" element={<ProtectedRoute roles={["usher", "hod"]}><Scanner /></ProtectedRoute>} />
        
        {/* Catch-all route to handle 404s cleanly */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
