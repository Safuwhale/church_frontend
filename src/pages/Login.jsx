import { useState } from 'react';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { setAuthState } from '../store/authStore';

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        credentials: 'include',
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

      const meRes = await fetch(`${API_BASE}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
        credentials: 'include',
      });

      if (!meRes.ok) {
        throw new Error('Signed in, but could not load your profile.');
      }

      const user = await meRes.json();

      setAuthState({
        accessToken: data.access_token,
        role: user.role || 'member',
        user,
        hydrated: true,
      });

      const userRole = user.role || 'member';
      
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
            <div className="relative">
              <input 
                // Dynamically change the input type based on the state
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-blue transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
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
        <div className="mt-8 text-center border-t border-slate-100 pt-6 space-y-2">
          <p className="text-sm text-slate-500">
            First time here?{' '}
            <Link to="/register" className="font-bold text-brand-blue hover:text-blue-700 transition-colors">
              Create a new profile
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}