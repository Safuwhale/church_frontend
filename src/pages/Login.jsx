import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const API_BASE = import.meta.env.VITE_API_BASE_URL;
    try {
      const response = await fetch(`${API_BASE}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Invalid phone number or password');
      }

      // THE FIX: We target data.user to pull the nested details from FastAPI
      localStorage.setItem('horyc_token', data.access_token);
      
      // Ensure we safely check if data.user exists before pulling properties
      if (data.user) {
        localStorage.setItem('horyc_role', data.user.role || 'member');
        localStorage.setItem('horyc_name', data.user.first_name || 'Member');
        localStorage.setItem('horyc_id', data.user.serial_number || 'HORYC-000');
      } else {
        // Fallbacks just in case the backend payload shape changes
        localStorage.setItem('horyc_role', 'member');
        localStorage.setItem('horyc_name', 'Member');
      }
      
      // Route them based on the newly mapped role!
      // Route them based on their specific role
      const userRole = data.user?.role || 'member';
      
      if (userRole === 'hod') {
        navigate('/admin');
      } else if (userRole === 'usher') {
        navigate('/usher-dashboard'); // <-- Ushers go straight to the gate!
      } else {
        navigate('/portal'); // Members and Leaders go to their personal hub
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        
        <div className="text-center mb-8">
          <div className="bg-brand-light w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-blue">
            <LogIn size={32} />
          </div>
          <h1 className="font-display text-2xl text-brand-dark font-bold">Welcome Back</h1>
          <p className="text-slate-500 text-sm mt-2">Enter your details to sign in</p>
        </div>

        {/* Error Message Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">Phone Number</label>
            <input 
              type="tel" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="08000000000"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full text-white py-3.5 rounded-xl font-medium transition-colors shadow-lg flex items-center justify-center gap-2 mt-4 
              ${isLoading ? 'bg-blue-400 cursor-not-allowed shadow-none' : 'bg-brand-blue hover:bg-blue-700 shadow-blue-600/30'}`}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-500">
            First time here?{' '}
            <Link to="/register" className="font-bold text-brand-blue hover:text-blue-700 transition-colors">
              Create your profile
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}