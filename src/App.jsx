import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useMemo } from 'react';

// Pages
import Login from './pages/Login';
import Register from './pages/Registeration'; // Using your exact spelling
import MemberPortal from './pages/MemberPortal';
import AdminPortal from './pages/AdminPortal';
import UsherDashboard from './pages/UsherDashboard';
import Scanner from './pages/Scanner'; 

function ProtectedRoute({ children, roles }) {
  const token = localStorage.getItem('horyc_token');
  const role = localStorage.getItem('horyc_role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to={role === 'member' || role === 'leader' ? '/portal' : '/admin'} replace />;
  }

  return children;
}



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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
