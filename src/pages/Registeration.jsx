import { useState } from 'react';
import { UserPlus, ArrowLeft, CheckCircle2, Copy } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  // Using snake_case to perfectly match your FastAPI Redoc schema
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    whatsapp_same_as_phone: true,
    whatsapp_number: '',
    dob: '',
    location_zone: '',
    contact_person_name: '',
    contact_person_relation: ''
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // New state to hold the generated user data for the success screen
  const [registeredUser, setRegisteredUser] = useState(null); 
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Prepare payload: if whatsapp is same as phone, we can send null or the phone number
      const payload = { ...formData };
      if (payload.whatsapp_same_as_phone) {
        payload.whatsapp_number = null; 
      }

      const response = await fetch('http://localhost:8000/api/users/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed. Please check your inputs.');
      }

      // Success! We save the returned user object (which contains the new serial_number)
      // to display on the success screen.
      setRegisteredUser(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(registeredUser.serial_number);
    alert('Copied to clipboard!');
  };

  // ==========================================
  // SUCCESS SCREEN (Shown after successful API call)
  // ==========================================
  if (registeredUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center animate-in zoom-in duration-300">
          <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
            <CheckCircle2 size={40} />
          </div>
          
          <h1 className="font-display text-2xl text-brand-dark font-bold mb-2">Registration Complete!</h1>
          <p className="text-slate-500 mb-8">Welcome to HORYC, {registeredUser.first_name}. Your profile has been successfully created.</p>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8">
            <p className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">Your Login Password / ID</p>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-3xl font-bold text-brand-blue tracking-wider">
                {registeredUser.serial_number}
              </span>
              <button onClick={copyToClipboard} className="p-2 text-slate-400 hover:text-brand-blue transition-colors">
                <Copy size={20} />
              </button>
            </div>
            <p className="text-xs text-red-500 font-medium mt-4 bg-red-50 p-2 rounded-lg">
              ⚠️ Please copy or screenshot this ID. You will use this as your password for your first login!
            </p>
          </div>

          <button 
            onClick={() => navigate('/login')}
            className="w-full text-white py-3.5 rounded-xl font-bold bg-brand-blue hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
          >
            Proceed to Login
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // REGISTRATION FORM
  // ==========================================
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 py-12">
      <div className="w-full max-w-lg bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100">
        
        <div className="text-center mb-8">
          <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <UserPlus size={32} />
          </div>
          <h1 className="font-display text-2xl text-brand-dark font-bold">Join HORYC</h1>
          <p className="text-slate-500 text-sm mt-2">Fill in your details to generate your QR Pass</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl text-center border border-red-100 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          
          {/* PERSONAL DETAILS */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 uppercase tracking-wider">Personal Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">First Name *</label>
                <input 
                  type="text" name="first_name" value={formData.first_name} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Last Name *</label>
                <input 
                  type="text" name="last_name" value={formData.last_name} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Date of Birth *</label>
                <input 
                  type="date" name="dob" value={formData.dob} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors text-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Location Zone *</label>
                <input 
                  type="text" name="location_zone" placeholder="e.g., Jimeta, Yola" value={formData.location_zone} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
            </div>
          </div>

          {/* CONTACT DETAILS */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 uppercase tracking-wider">Contact Details</h3>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Phone Number *</label>
              <input 
                type="tel" name="phone_number" placeholder="08000000000" value={formData.phone_number} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input 
                type="checkbox" id="whatsapp_same" name="whatsapp_same_as_phone" 
                checked={formData.whatsapp_same_as_phone} onChange={handleChange}
                className="w-4 h-4 text-brand-blue rounded border-slate-300"
              />
              <label htmlFor="whatsapp_same" className="text-sm text-slate-600 cursor-pointer">
                My WhatsApp number is the same as my phone number
              </label>
            </div>

            {!formData.whatsapp_same_as_phone && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">WhatsApp Number</label>
                <input 
                  type="tel" name="whatsapp_number" placeholder="08000000000" value={formData.whatsapp_number} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
            )}
          </div>

          {/* EMERGENCY CONTACT */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 uppercase tracking-wider">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Contact Name *</label>
                <input 
                  type="text" name="contact_person_name" placeholder="Full Name" value={formData.contact_person_name} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Relationship *</label>
                <input 
                  type="text" name="contact_person_relation" placeholder="e.g., Parent, Sibling" value={formData.contact_person_relation} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full text-white py-4 rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2 mt-4 
              ${isLoading ? 'bg-emerald-400 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'}`}
          >
            {isLoading ? 'Creating Profile...' : 'Complete Registration'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-blue transition-colors font-medium">
            <ArrowLeft size={16} />
            Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}