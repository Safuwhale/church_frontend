import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

    try {
      // 1. Send credentials to FastAPI
      const response = await fetch('http://localhost:8000/api/users/login', {
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

      // 2. Check if the login failed
      if (!response.ok) {
        throw new Error(data.detail || 'Invalid phone number or password');
      }

      // 3. Success! Save the token to the browser's Local Storage
      localStorage.setItem('horyc_token', data.access_token);
      
      // 4. Send them to the Dashboard!
      navigate('/dashboard');

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

      </div>
    </div>
  );
}