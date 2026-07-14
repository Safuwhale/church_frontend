import { useState, useRef } from 'react';
import { UserCheck, Camera, ArrowRight, CheckCircle, Copy, LogIn } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function ClaimProfile() {
  // Wizard State
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Data State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [maskedName, setMaskedName] = useState('');
  const [typedName, setTypedName] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  
  // Profile Completion State
  const [email, setEmail] = useState('');
  const [sex, setSex] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // --- STEP 1: Phone Lookup ---
  const handleLookup = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Phone number not found.');
      
      setMaskedName(data.masked_name);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- STEP 2: Name Verification (Fuzzy Match) ---
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/verify-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber, typed_name: typedName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Name verification failed.');
      
      setVerificationToken(data.verification_token);
      setSerialNumber(data.serial_number);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- STEP 3: Handle Image Selection ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be smaller than 5MB");
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  // --- STEP 3: Claim Profile & Cloudinary Upload ---
  const handleClaim = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      let photoUrl = null;

      // 1. If photo exists, upload to Cloudinary first
      if (photoFile) {
        // Get Signature from FastAPI
        const sigRes = await fetch(`${API_BASE}/api/users/generate-upload-signature`);
        if (!sigRes.ok) throw new Error('Failed to initiate secure upload.');
        const sigData = await sigRes.json();

        // Push directly to Cloudinary
        const formData = new FormData();
        formData.append('file', photoFile);
        formData.append('api_key', sigData.api_key);
        formData.append('timestamp', sigData.timestamp);
        formData.append('signature', sigData.signature);
        formData.append('folder', sigData.folder);

        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloud_name}/image/upload`, {
          method: 'POST',
          body: formData
        });
        const cloudData = await cloudRes.json();
        if (!cloudRes.ok) throw new Error('Image upload failed.');
        
        photoUrl = cloudData.secure_url;
      }

      // 2. Update Profile in FastAPI
      const claimRes = await fetch(`${API_BASE}/api/users/claim`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${verificationToken}` 
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          email: email || null,
          sex: sex || null,
          contact_person_phone: contactPhone || null,
          profile_photo_url: photoUrl
        })
      });

      if (!claimRes.ok) {
        const data = await claimRes.json();
        throw new Error(data.detail || 'Failed to claim account.');
      }

      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(serialNumber);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        
        {/* Dynamic Header */}
        <div className="text-center mb-6">
          <div className="bg-brand-light w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-blue">
            {step === 4 ? <CheckCircle size={32} /> : <UserCheck size={32} />}
          </div>
          <h1 className="font-display text-2xl text-brand-dark font-bold">
            {step === 1 && "Find Your Account"}
            {step === 2 && "Verify It's You"}
            {step === 3 && "Complete Profile"}
            {step === 4 && "Account Secured!"}
          </h1>
          {step === 1 && <p className="text-slate-500 text-sm mt-2">Enter your phone number to get started</p>}
        </div>

        {/* Global Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center border border-red-100">
            {error}
          </div>
        )}

        {/* STEP 1: Phone Lookup */}
        {step === 1 && (
          <form onSubmit={handleLookup} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">Phone Number</label>
              <input 
                type="tel" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="08000000000"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-brand-blue hover:bg-blue-700 text-white py-3.5 rounded-xl font-medium transition-colors shadow-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
            >
              {isLoading ? 'Searching...' : 'Find Account'} <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2: Name Verification */}
        {step === 2 && (
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="bg-brand-light p-4 rounded-xl text-center mb-4 border border-blue-100">
              <p className="text-sm text-slate-500 mb-1">Found account for:</p>
              <p className="text-xl font-bold tracking-widest text-brand-blue">{maskedName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">Type your full name to verify</label>
              <input 
                type="text" 
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="First Last"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-brand-blue hover:bg-blue-700 text-white py-3.5 rounded-xl font-medium transition-colors shadow-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
            >
              {isLoading ? 'Verifying...' : 'Verify Identity'} <ArrowRight size={18} />
            </button>
            <button type="button" onClick={() => setStep(1)} className="w-full text-slate-500 text-sm mt-2 font-medium">
              Not you? Go back.
            </button>
          </form>
        )}

        {/* STEP 3: Complete Details */}
        {step === 3 && (
          <form onSubmit={handleClaim} className="space-y-4">
            {/* Image Upload Avatar UI */}
            <div className="flex flex-col items-center mb-6">
              <input 
                type="file" 
                accept="image/jpeg, image/png, image/webp" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImageChange}
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="relative w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100 flex items-center justify-center group"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={32} className="text-slate-400 group-hover:text-brand-blue transition-colors" />
                )}
                <div className="absolute bottom-0 w-full bg-black/50 py-1 text-[10px] text-white text-center opacity-0 group-hover:opacity-100 transition-opacity">
                  Upload
                </div>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">Email Address (Optional)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">Sex</label>
              <select value={sex} onChange={(e) => setSex(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white">
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">Emergency Contact Phone</label>
              <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="08000000000" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-brand-blue hover:bg-blue-700 text-white py-3.5 rounded-xl font-medium transition-colors shadow-lg flex items-center justify-center gap-2 mt-6 disabled:opacity-70">
              {isLoading ? 'Saving...' : 'Secure My Account'}
            </button>
          </form>
        )}

        {/* STEP 4: Success & Credentials */}
        {step === 4 && (
          <div className="text-center space-y-5">
            <p className="text-slate-600">Your profile is completely set up. Here are your login details:</p>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number</p>
                <p className="font-medium text-slate-800">{phoneNumber}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Default Password & Member ID</p>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-xl text-brand-blue tracking-wider">{serialNumber}</p>
                  <button onClick={copyToClipboard} className="p-2 text-slate-400 hover:text-brand-blue transition-colors bg-white rounded-lg border border-slate-200 shadow-sm">
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-sm text-amber-700 font-medium">Keep this password safe. You will use it to log in and access your QR pass.</p>
            </div>

            <Link to="/login" className="w-full bg-brand-dark hover:bg-slate-800 text-white py-3.5 rounded-xl font-medium transition-colors shadow-lg flex items-center justify-center gap-2 mt-6">
              Go to Login <LogIn size={18} />
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}