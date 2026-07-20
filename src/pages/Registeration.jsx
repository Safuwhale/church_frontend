import { useState } from 'react';
import { UserPlus, ArrowLeft, ArrowRight, CheckCircle2, Copy, Loader2, Pencil, Phone, MapPin, HeartPulse, Mail, Cake } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import PhotoCaptureInput from '../components/PhotoCaptureInput';

const STEPS = [
  { id: 1, label: 'About You' },
  { id: 2, label: 'Contact' },
  { id: 3, label: 'Emergency' },
  { id: 4, label: 'Review' },
];

export default function Register() {
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    sex: '',
    phone_number: '',
    whatsapp_same_as_phone: true,
    whatsapp_number: '',
    dob: '',
    location_zone: '',
    contact_person_name: '',
    contact_person_relation: '',
    contact_person_phone: ''
  });

  // States to hold the file locally before upload
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const [registeredUser, setRegisteredUser] = useState(null);
  const navigate = useNavigate();

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

  // --- STEP VALIDATION (gates the "Next" button; final submit is still guarded by handleRegister) ---
  const validateStep = (targetStep) => {
    if (targetStep === 1 && (!formData.first_name || !formData.last_name || !formData.dob)) {
      setError('Please fill in your first name, last name, and date of birth.');
      return false;
    }
    if (targetStep === 2 && (!formData.phone_number || !formData.location_zone)) {
      setError('Please fill in your phone number and location.');
      return false;
    }
    if (targetStep === 3 && (!formData.contact_person_name || !formData.contact_person_relation)) {
      setError('Please provide an emergency contact name and relationship.');
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setError('');
    setStep((s) => Math.min(s + 1, 4));
  };

  const goBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 1));
  };

  // Enter key inside an input advances the step instead of submitting the whole form early.
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && step < 4) {
      e.preventDefault();
      goNext();
    }
  };

  // --- REGISTRATION FLOW (unchanged) ---
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) { setStep(3); return; }

    setError('');
    setIsLoading(true);
    setLoadingText('Creating Profile...');

    try {
      const payload = { ...formData };

      if (payload.whatsapp_same_as_phone) {
        // Automatically grab the phone number they just typed!
        payload.whatsapp_number = payload.phone_number;
      }
      delete payload.whatsapp_same_as_phone;

      // STRICT DATA CLEANUP LOOP
      // Converts any empty string into `null` to prevent FastAPI 422 errors
      Object.keys(payload).forEach(key => {
        if (payload[key] === "") {
          payload[key] = null;
        }
      });

      const API_BASE = import.meta.env.VITE_API_BASE_URL;

      // STEP 1: Create the User
      const response = await fetch(`${API_BASE}/api/users/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const userData = await response.json();

      if (!response.ok) {
        const errorMsg = Array.isArray(userData.detail)
          ? userData.detail.map(err => err.msg).join(', ')
          : userData.detail;

        throw new Error(errorMsg || 'Registration failed. Please check your inputs.');
      }

      // STEP 2: Upload Photo to Cloudinary using their new Serial Number
      if (photoFile) {
        setLoadingText('Uploading Photo...');

        // Pass the serial_number to get a custom file name
        const sigResponse = await fetch(`${API_BASE}/api/users/generate-upload-signature?identifier=${userData.serial_number}`);

        if (!sigResponse.ok) {
           console.warn("User created, but failed to get upload signature.");
        } else {
          const { timestamp, signature, folder, api_key, cloud_name, public_id } = await sigResponse.json();

          const uploadData = new FormData();
          uploadData.append('file', photoFile);
          uploadData.append('api_key', api_key);
          uploadData.append('timestamp', timestamp);
          uploadData.append('signature', signature);
          uploadData.append('folder', folder);
          uploadData.append('public_id', public_id); // Forces Cloudinary to use the custom name

          const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
            method: 'POST',
            body: uploadData,
          });

          const cloudinaryData = await cloudinaryRes.json();

          if (cloudinaryRes.ok) {
            // STEP 3: Save the URL to their newly created profile
            setLoadingText('Finalizing...');

            await fetch(`${API_BASE}/api/users/${userData.id}/photo`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ profile_photo_url: cloudinaryData.secure_url })
            });

            userData.profile_photo_url = cloudinaryData.secure_url;
          }
        }
      }

      setRegisteredUser(userData);

    } catch (err) {
      setError(err.message);
      setStep(4);
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  const copyToClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(registeredUser.serial_number);
      alert('Copied to clipboard!');
    } else {
      alert('Clipboard not available on this browser. Please select and copy your ID manually.');
    }
  };

  const inputBase = "w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white disabled:opacity-50";

  // ==========================================
  // SUCCESS SCREEN
  // ==========================================
  if (registeredUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 text-center animate-in zoom-in-95 duration-300">
          <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
            <CheckCircle2 size={40} />
          </div>

          <h1 className="font-display text-2xl text-brand-dark font-bold mb-2">Registration Complete!</h1>
          <p className="text-slate-500 mb-8">Welcome to HORYC, {registeredUser.first_name}. Your profile has been successfully created.</p>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8">
            <p className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">Your Member ID/Password</p>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-3xl font-bold text-brand-blue tracking-wider">
                {registeredUser.serial_number}
              </span>
              <button onClick={copyToClipboard} className="p-2 text-slate-400 hover:text-brand-blue transition-colors">
                <Copy size={20} />
              </button>
            </div>
            <p className="text-xs text-red-500 font-medium mt-4 bg-red-50 p-2 rounded-lg">
              Please copy or screenshot this ID. It is your default Password!
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
  // REGISTRATION WIZARD
  // ==========================================
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50 py-10 sm:py-12">
      <div className="w-full max-w-2xl bg-white p-6 md:p-10 rounded-[2rem] shadow-xl border border-slate-100">

        <div className="text-center mb-8">
          <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <UserPlus size={32} />
          </div>
          <h1 className="font-display text-2xl text-brand-dark font-bold">House of Refuge Youth Church</h1>
          <p className="text-slate-500 text-sm mt-2">Let's get you registered — it only takes a minute.</p>
        </div>

        {/* PROGRESS STEPPER */}
        <div className="flex items-center mb-8 px-1 sm:px-4">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-colors ${
                  step > s.id ? 'bg-emerald-500 text-white' :
                  step === s.id ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/30' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {step > s.id ? <CheckCircle2 size={16} /> : s.id}
                </div>
                <span className={`text-[10px] sm:text-xs font-semibold whitespace-nowrap hidden sm:block ${step >= s.id ? 'text-slate-700' : 'text-slate-400'}`}>
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

        <form onSubmit={handleRegister} onKeyDown={handleKeyDown}>

          {/* STEP 1: PHOTO + BASIC INFO */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <PhotoCaptureInput
                previewUrl={photoPreview}
                onCapture={handlePhotoCapture}
                onRemove={photoPreview ? handlePhotoRemove : undefined}
                disabled={isLoading}
              />

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 border-b pb-2 uppercase tracking-wider">About You</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">First Name *</label>
                    <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required disabled={isLoading} className={inputBase} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Last Name *</label>
                    <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required disabled={isLoading} className={inputBase} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={isLoading} className={inputBase} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Sex</label>
                    <select name="sex" value={formData.sex} onChange={handleChange} disabled={isLoading} className={inputBase + " appearance-none"}>
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Date of Birth *</label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} required disabled={isLoading} className={inputBase + " text-slate-700"} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CONTACT & LOCATION */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2 uppercase tracking-wider">Contact & Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Phone Number *</label>
                  <input type="tel" name="phone_number" placeholder="08000000000" value={formData.phone_number} onChange={handleChange} required disabled={isLoading} className={inputBase} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">WhatsApp Number</label>
                  <input type="tel" name="whatsapp_number" placeholder={formData.whatsapp_same_as_phone ? 'Same as phone' : '08000000000'} value={formData.whatsapp_number} onChange={handleChange} disabled={formData.whatsapp_same_as_phone || isLoading} className={inputBase} />
                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" id="whatsapp_same" name="whatsapp_same_as_phone" checked={formData.whatsapp_same_as_phone} onChange={handleChange} disabled={isLoading} className="w-4 h-4 text-brand-blue rounded border-slate-300 disabled:opacity-50" />
                    <label htmlFor="whatsapp_same" className="text-sm text-slate-600 cursor-pointer">Same as phone number</label>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Location *</label>
                  <input type="text" name="location_zone" placeholder="Home Address" value={formData.location_zone} onChange={handleChange} required disabled={isLoading} className={inputBase} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: EMERGENCY CONTACT */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2 uppercase tracking-wider">Emergency Contact</h3>
              <p className="text-xs text-slate-400 -mt-2">Who should we reach if we can't reach you?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Contact Name *</label>
                  <input type="text" name="contact_person_name" placeholder="Full Name" value={formData.contact_person_name} onChange={handleChange} required disabled={isLoading} className={inputBase} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Relationship *</label>
                  <input type="text" name="contact_person_relation" placeholder="e.g., Parent, Sibling" value={formData.contact_person_relation} onChange={handleChange} required disabled={isLoading} className={inputBase} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Contact Phone</label>
                  <input type="tel" name="contact_person_phone" placeholder="08000000000" value={formData.contact_person_phone} onChange={handleChange} disabled={isLoading} className={inputBase} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2 uppercase tracking-wider">Review Your Details</h3>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <UserPlus size={22} className="text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{formData.first_name} {formData.last_name}</p>
                  <p className="text-xs text-slate-500">{formData.sex || 'Sex not specified'} · Born {formData.dob}</p>
                </div>
                <button type="button" onClick={() => setStep(1)} className="p-2 text-slate-400 hover:text-brand-blue transition-colors flex-shrink-0" aria-label="Edit basic info">
                  <Pencil size={16} />
                </button>
              </div>

              <div className="p-4 rounded-2xl border border-slate-100 flex items-start justify-between gap-3">
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-slate-700"><Phone size={14} className="text-slate-400" /> {formData.phone_number || '—'}</p>
                  {formData.email && <p className="flex items-center gap-2 text-slate-700"><Mail size={14} className="text-slate-400" /> {formData.email}</p>}
                  <p className="flex items-center gap-2 text-slate-700"><MapPin size={14} className="text-slate-400" /> {formData.location_zone || '—'}</p>
                </div>
                <button type="button" onClick={() => setStep(2)} className="p-2 text-slate-400 hover:text-brand-blue transition-colors flex-shrink-0" aria-label="Edit contact info">
                  <Pencil size={16} />
                </button>
              </div>

              <div className="p-4 rounded-2xl border border-slate-100 flex items-start justify-between gap-3">
                <div className="space-y-1 text-sm">
                  <p className="flex items-center gap-2 text-slate-700"><HeartPulse size={14} className="text-rose-400" /> {formData.contact_person_name || '—'} ({formData.contact_person_relation || '—'})</p>
                  {formData.contact_person_phone && <p className="text-xs text-slate-500 pl-6">{formData.contact_person_phone}</p>}
                </div>
                <button type="button" onClick={() => setStep(3)} className="p-2 text-slate-400 hover:text-brand-blue transition-colors flex-shrink-0" aria-label="Edit emergency contact">
                  <Pencil size={16} />
                </button>
              </div>
            </div>
          )}

          {/* NAVIGATION */}
          <div className="flex items-center gap-3 mt-8">
            {step > 1 && (
              <button
                type="button" onClick={goBack} disabled={isLoading}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                <ArrowLeft size={18} />
                Back
              </button>
            )}

            {step < 4 ? (
              <button
                type="button" onClick={goNext} disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 text-white py-3.5 rounded-xl font-bold bg-brand-blue hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 disabled:opacity-50"
              >
                Continue
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="submit" disabled={isLoading}
                className={`flex-1 text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2 ${
                  isLoading ? 'bg-emerald-400 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                }`}
              >
                {isLoading ? <><Loader2 size={20} className="animate-spin" /> {loadingText}</> : 'Complete Registration'}
              </button>
            )}
          </div>
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