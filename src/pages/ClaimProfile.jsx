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

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
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

      // 🌟 STRICT DATA CLEANUP LOOP 🌟
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 bg-slate-50">
      <div className={`w-full bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 transition-all ${step === 3 ? 'max-w-2xl' : 'max-w-sm'}`}>
        
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
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl text-center border border-red-100 font-medium animate-in slide-in-from-top-2">
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
              <label className="block text-sm font-medium text-brand-dark mb-1">Type your name to verify</label>
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
            <button type="button" onClick={() => setStep(1)} className="w-full text-slate-500 text-sm mt-2 font-medium hover:text-brand-blue">
              Not you? Go back.
            </button>
          </form>
        )}

        {/* STEP 3: Complete Details (Expanded View) */}
        {step === 3 && (
          <form onSubmit={handleClaim} className="space-y-6">
            
            {/* Image Upload UI */}
            <div className="flex flex-col items-center justify-center space-y-4 mb-4">
              <div className="relative w-28 h-28 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile preview" className="w-full h-full object-cover" />
                ) : (
                  <UserCheck size={32} className="text-slate-300" />
                )}
              </div>
              <input 
                type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" 
              />
              <button 
                type="button" disabled={isLoading} onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
              >
                <Camera size={16} />
                {photoPreview ? 'Change Photo' : 'Upload Photo'}
              </button>
            </div>

            {/* EXPANDED GRID FIELDS */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2 uppercase tracking-wider">Missing Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Sex *</label>
                  <select name="sex" value={formData.sex} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white appearance-none">
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date of Birth *</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white text-slate-700" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Location *</label>
                  <input type="text" name="location_zone" placeholder="Home address" value={formData.location_zone} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">WhatsApp Number</label>
                  <input type="tel" name="whatsapp_number" placeholder={formData.whatsapp_same_as_phone ? `Same as ${phoneNumber}` : '08000000000'} value={formData.whatsapp_number} onChange={handleChange} disabled={formData.whatsapp_same_as_phone} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white disabled:opacity-50" />
                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" id="whatsapp_same" name="whatsapp_same_as_phone" checked={formData.whatsapp_same_as_phone} onChange={handleChange} className="w-4 h-4 text-brand-blue rounded border-slate-300" />
                    <label htmlFor="whatsapp_same" className="text-sm text-slate-600 cursor-pointer">Same as my registered phone number</label>
                  </div>
                </div>
              </div>
            </div>

            {/* EMERGENCY CONTACT */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2 uppercase tracking-wider">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Contact Name *</label>
                  <input type="text" name="contact_person_name" placeholder="Full Name" value={formData.contact_person_name} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Relationship *</label>
                  <input type="text" name="contact_person_relation" placeholder="e.g., Parent, Sibling" value={formData.contact_person_relation} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Contact Phone *</label>
                  <input type="tel" name="contact_person_phone" placeholder="08000000000" value={formData.contact_person_phone} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-brand-blue hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2 mt-6 disabled:opacity-70">
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
              <p className="text-sm text-amber-700 font-medium">Keep this password safe. You will use it to log in and access your QR Code.</p>
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