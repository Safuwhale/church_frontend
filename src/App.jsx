import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Login from './pages/Login';
import Register from './pages/Registeration'; // Using your exact spelling
import MemberPortal from './pages/MemberPortal';
import AdminPortal from './pages/AdminPortal';
import UsherDashboard from './pages/UsherDashboard';
import Scanner from './pages/Scanner'; 



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
        <Route path="/portal" element={<MemberPortal />} />
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="/usher-dashboard" element={<UsherDashboard />} />
        
        {/* Dynamic Scanner Route for the specific Service */}
        <Route path="/scanner/:id" element={<Scanner />} />
        
        {/* Catch-all route to handle 404s cleanly */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
