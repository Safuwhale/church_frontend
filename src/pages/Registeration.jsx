import { useState, useRef } from 'react';
import { UserPlus, ArrowLeft, CheckCircle2, Copy, Camera, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const fileInputRef = useRef(null);
  
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
  
  // NEW: States to hold the file locally before upload
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

  // --- LOCAL PREVIEW ONLY ---
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB.');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError('');
  };

  // --- REGISTRATION FLOW ---
  const handleRegister = async (e) => {
    e.preventDefault();
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

  // ==========================================
  // SUCCESS SCREEN
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
  // REGISTRATION FORM
  // ==========================================
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 py-12">
      <div className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100">
        
        <div className="text-center mb-8">
          <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <UserPlus size={32} />
          </div>
          <h1 className="font-display text-2xl text-brand-dark font-bold">House of Refuge Youth Church</h1>
          <p className="text-slate-500 text-sm mt-2">Fill in your complete details to register</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl text-center border border-red-100 font-medium animate-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-8">
          
          {/* PROFILE PHOTO UPLOAD (Local Preview Only) */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-28 h-28 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile preview" className="w-full h-full object-cover" />
              ) : (
                <UserPlus size={32} className="text-slate-300" />
              )}
            </div>
            
            <input 
              type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" 
            />
            <button 
              type="button" disabled={isLoading} onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
            >
              <Camera size={16} />
              {photoPreview ? 'Change Photo' : 'Upload Photo'}
            </button>
          </div>

          {/* PERSONAL DETAILS */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 uppercase tracking-wider">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">First Name *</label>
                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required disabled={isLoading} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Last Name *</label>
                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required disabled={isLoading} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={isLoading} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Sex</label>
                <select name="sex" value={formData.sex} onChange={handleChange} disabled={isLoading} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white appearance-none disabled:opacity-50">
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Date of Birth *</label>
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} required disabled={isLoading} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white text-slate-700 disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Location *</label>
                <input type="text" name="location_zone" placeholder="Home Address" value={formData.location_zone} onChange={handleChange} required disabled={isLoading} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white disabled:opacity-50" />
              </div>
            </div>
          </div>

          {/* CONTACT DETAILS */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 uppercase tracking-wider">Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Phone Number *</label>
                <input type="tel" name="phone_number" placeholder="08000000000" value={formData.phone_number} onChange={handleChange} required disabled={isLoading} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">WhatsApp Number</label>
                <input type="tel" name="whatsapp_number" placeholder={formData.whatsapp_same_as_phone ? 'Same as phone' : '08000000000'} value={formData.whatsapp_number} onChange={handleChange} disabled={formData.whatsapp_same_as_phone || isLoading} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white disabled:opacity-50" />
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="whatsapp_same" name="whatsapp_same_as_phone" checked={formData.whatsapp_same_as_phone} onChange={handleChange} disabled={isLoading} className="w-4 h-4 text-brand-blue rounded border-slate-300 disabled:opacity-50" />
                  <label htmlFor="whatsapp_same" className="text-sm text-slate-600 cursor-pointer">Same as phone number</label>
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
                <input type="text" name="contact_person_name" placeholder="Full Name" value={formData.contact_person_name} onChange={handleChange} required disabled={isLoading} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Relationship *</label>
                <input type="text" name="contact_person_relation" placeholder="e.g., Parent, Sibling" value={formData.contact_person_relation} onChange={handleChange} required disabled={isLoading} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Contact Phone</label>
                <input type="tel" name="contact_person_phone" placeholder="08000000000" value={formData.contact_person_phone} onChange={handleChange} disabled={isLoading} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white disabled:opacity-50" />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full text-white py-4 rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2 mt-4 
              ${isLoading ? 'bg-emerald-400 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'}`}
          >
            {isLoading ? <><Loader2 size={20} className="animate-spin"/> {loadingText}</> : 'Complete Registration'}
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