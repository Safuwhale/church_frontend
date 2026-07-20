import { useState } from 'react';
import { UserCheck, ArrowRight, CheckCircle, CheckCircle2, Copy, LogIn, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import PhotoCaptureInput from '../components/PhotoCaptureInput';

const STEPS = [
  { id: 1, label: 'Find Account' },
  { id: 2, label: 'Verify' },
  { id: 3, label: 'Complete Profile' },
];

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

  // Profile Completion State (Consolidated like Registration)
  const [formData, setFormData] = useState({
    email: '',
    sex: '',
    whatsapp_same_as_phone: true,
    whatsapp_number: '',
    dob: '',
    location_zone: '',
    contact_person_name: '',
    contact_person_relation: '',
    contact_person_phone: ''
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handlePhotoCapture = (file, preview) => {
    setPhotoFile(file);
    setPhotoPreview(preview);
    setError('');
  };

  const handlePhotoRemove = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

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

  // --- STEP 3: Claim Profile & Cloudinary Upload ---
  const handleClaim = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      let photoUrl = null;

      // 1. If photo exists, upload to Cloudinary first
      if (photoFile) {
        const sigRes = await fetch(`${API_BASE}/api/users/generate-upload-signature?identifier=${serialNumber}`);
        if (!sigRes.ok) throw new Error('Failed to initiate secure upload.');
        const sigData = await sigRes.json();

        const uploadData = new FormData();
        uploadData.append('file', photoFile);
        uploadData.append('api_key', sigData.api_key);
        uploadData.append('timestamp', sigData.timestamp);
        uploadData.append('signature', sigData.signature);
        uploadData.append('folder', sigData.folder);
        uploadData.append('public_id', sigData.public_id);

        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloud_name}/image/upload`, {
          method: 'POST',
          body: uploadData
        });
        const cloudData = await cloudRes.json();
        if (!cloudRes.ok) throw new Error('Image upload failed.');

        photoUrl = cloudData.secure_url;
      }

      // 2. Prepare payload exactly like Registration
      const payload = { ...formData };
      if (payload.whatsapp_same_as_phone) {
        payload.whatsapp_number = phoneNumber; // Automatically use their looked-up phone number
      }
      delete payload.whatsapp_same_as_phone;

      // STRICT DATA CLEANUP LOOP
      // Converts any empty string into `null` to prevent FastAPI 422 errors
      Object.keys(payload).forEach(key => {
        if (payload[key] === "") {
          payload[key] = null;
        }
      });

      // 3. Update Profile in FastAPI
      const claimRes = await fetch(`${API_BASE}/api/users/claim`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${verificationToken}`
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          profile_photo_url: photoUrl,
          ...payload // Spreads all the cleaned fields into the body
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

  const inputBase = "w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white disabled:opacity-50";

  // ==========================================
  // STEP 4: SUCCESS SCREEN (separate, no stepper — mirrors Registration)
  // ==========================================
  if (step === 4) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 text-center animate-in zoom-in-95 duration-300">
          <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
            <CheckCircle size={40} />
          </div>

          <h1 className="font-display text-2xl text-brand-dark font-bold mb-2">Account Secured!</h1>
          <p className="text-slate-500 mb-8">Your profile is completely set up. Here are your login details.</p>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6 text-left space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone Number</p>
              <p className="font-medium text-slate-800">{phoneNumber}</p>
            </div>
            <div className="pt-3 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Default Password & Member ID</p>
              <div className="flex items-center justify-between">
                <p className="font-mono font-bold text-2xl text-brand-blue tracking-wider">{serialNumber}</p>
                <button onClick={copyToClipboard} className="p-2 text-slate-400 hover:text-brand-blue transition-colors bg-white rounded-lg border border-slate-200 shadow-sm">
                  <Copy size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl mb-6">
            <p className="text-sm text-amber-700 font-medium">Keep this password safe. You will use it to log in and access your QR Code.</p>
          </div>

          <Link
            to="/login"
            className="w-full bg-brand-dark hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            Go to Login <LogIn size={18} />
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // STEPS 1–3: CLAIM WIZARD
  // ==========================================
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 bg-slate-50">
      <div className={`w-full bg-white p-6 md:p-10 rounded-[2rem] shadow-xl border border-slate-100 transition-all ${step === 3 ? 'max-w-2xl' : 'max-w-sm'}`}>

        <div className="text-center mb-6">
          <div className="bg-brand-light w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-blue">
            <UserCheck size={32} />
          </div>
          <h1 className="font-display text-2xl text-brand-dark font-bold">
            {step === 1 && "Find Your Account"}
            {step === 2 && "Verify It's You"}
            {step === 3 && "Complete Profile"}
          </h1>
          {step === 1 && <p className="text-slate-500 text-sm mt-2">Enter your phone number to get started</p>}
        </div>

        {/* PROGRESS STEPPER */}
        <div className="flex items-center mb-8 px-1">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step > s.id ? 'bg-emerald-500 text-white' :
                  step === s.id ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/30' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {step > s.id ? <CheckCircle2 size={14} /> : s.id}
                </div>
                <span className={`text-[9px] sm:text-[10px] font-semibold whitespace-nowrap hidden sm:block ${step >= s.id ? 'text-slate-700' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1.5 sm:mx-2 rounded-full transition-colors ${step > s.id ? 'bg-emerald-400' : 'bg-slate-100'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl text-center border border-red-100 font-medium animate-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {/* STEP 1: Phone Lookup */}
        {step === 1 && (
          <form onSubmit={handleLookup} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="08000000000"
                className={inputBase}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-blue hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? 'Searching...' : 'Find Account'} <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2: Name Verification */}
        {step === 2 && (
          <form onSubmit={handleVerify} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-brand-light p-4 rounded-xl text-center mb-4 border border-blue-100">
              <p className="text-sm text-slate-500 mb-1">Found account for:</p>
              <p className="text-xl font-bold tracking-widest text-brand-blue">{maskedName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">Type your name to verify</label>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="First Last"
                className={inputBase}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-blue hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? 'Verifying...' : 'Verify Identity'} <ArrowRight size={18} />
            </button>
            <button type="button" onClick={() => { setError(''); setStep(1); }} className="w-full flex items-center justify-center gap-1.5 text-slate-500 text-sm mt-2 font-medium hover:text-brand-blue transition-colors">
              <ArrowLeft size={14} />
              Not you? Go back.
            </button>
          </form>
        )}

        {/* STEP 3: Complete Details (Expanded View) */}
        {step === 3 && (
          <form onSubmit={handleClaim} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">

            <PhotoCaptureInput
              previewUrl={photoPreview}
              onCapture={handlePhotoCapture}
              onRemove={photoPreview ? handlePhotoRemove : undefined}
              disabled={isLoading}
            />

            {/* EXPANDED GRID FIELDS */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2 uppercase tracking-wider">Missing Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={isLoading} className={inputBase} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Sex *</label>
                  <select name="sex" value={formData.sex} onChange={handleChange} required disabled={isLoading} className={inputBase + " appearance-none"}>
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date of Birth *</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} required disabled={isLoading} className={inputBase + " text-slate-700"} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Location *</label>
                  <input type="text" name="location_zone" placeholder="Home address" value={formData.location_zone} onChange={handleChange} required disabled={isLoading} className={inputBase} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">WhatsApp Number</label>
                  <input type="tel" name="whatsapp_number" placeholder={formData.whatsapp_same_as_phone ? `Same as ${phoneNumber}` : '08000000000'} value={formData.whatsapp_number} onChange={handleChange} disabled={formData.whatsapp_same_as_phone || isLoading} className={inputBase} />
                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" id="whatsapp_same" name="whatsapp_same_as_phone" checked={formData.whatsapp_same_as_phone} onChange={handleChange} disabled={isLoading} className="w-4 h-4 text-brand-blue rounded border-slate-300 disabled:opacity-50" />
                    <label htmlFor="whatsapp_same" className="text-sm text-slate-600 cursor-pointer">Same as my registered phone number</label>
                  </div>
                </div>
              </div>
            </div>

            {/* EMERGENCY CONTACT */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2 uppercase tracking-wider">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Contact Name *</label>
                  <input type="text" name="contact_person_name" placeholder="Full Name" value={formData.contact_person_name} onChange={handleChange} required disabled={isLoading} className={inputBase} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Relationship *</label>
                  <input type="text" name="contact_person_relation" placeholder="e.g., Parent, Sibling" value={formData.contact_person_relation} onChange={handleChange} required disabled={isLoading} className={inputBase} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Contact Phone *</label>
                  <input type="tel" name="contact_person_phone" placeholder="08000000000" value={formData.contact_person_phone} onChange={handleChange} required disabled={isLoading} className={inputBase} />
                </div>
              </div>
            </div>

            <button
              type="submit" disabled={isLoading}
              className="w-full bg-brand-blue hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-colors shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? 'Saving...' : 'Secure My Account'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}