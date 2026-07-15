import { useEffect, useState, useRef } from 'react';
import { User, Lock, Save, CheckCircle2, AlertCircle, IdCard, Eye, EyeOff, Camera, Loader2 } from 'lucide-react';
import { secureFetch } from '../api/api';

const buildProfileState = (userData) => ({
  first_name: userData?.first_name || '',
  last_name: userData?.last_name || '',
  email: userData?.email || '',
  sex: userData?.sex || '',
  phone_number: userData?.phone_number || '',
  whatsapp_same_as_phone: true,
  whatsapp_number: userData?.whatsapp_number || '',
  dob: userData?.dob || '',
  location_zone: userData?.location_zone || '',
  contact_person_name: userData?.contact_person_name || '',
  contact_person_relation: userData?.contact_person_relation || '',
  contact_person_phone: userData?.contact_person_phone || '',
  profile_photo_url: userData?.profile_photo_url || ''
});

export default function ProfileTab({ userData }) {
  const fileInputRef = useRef(null);
  const [profileData, setProfileData] = useState(() => buildProfileState(userData));
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    setProfileData(buildProfileState(userData));
  }, [userData]);

  const handleProfileChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setProfileData({ ...profileData, [e.target.name]: value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  // --- CLOUDINARY UPLOAD LOGIC ---
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatusMsg({ type: 'error', text: 'Image must be less than 5MB.' });
      return;
    }

    setIsUploadingPhoto(true);
    setStatusMsg(null);

    try {
      const sigResponse = await secureFetch(`/api/users/generate-upload-signature?identifier=${userData.serial_number}`);
      if (!sigResponse.ok) throw new Error("Could not connect to secure upload server.");
      const { timestamp, signature, folder, api_key, cloud_name, public_id } = await sigResponse.json();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', api_key);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', folder);
      formData.append('public_id', public_id);

      const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const cloudinaryData = await cloudinaryRes.json();
      
      if (!cloudinaryRes.ok) {
        throw new Error(cloudinaryData.error?.message || "Upload failed");
      }

      setProfileData(prev => ({ ...prev, profile_photo_url: cloudinaryData.secure_url }));
      setStatusMsg({ type: 'success', text: 'Photo uploaded! Remember to save your profile.' });
      
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Failed to upload photo. Please try again.' });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setStatusMsg(null);
    setIsSavingProfile(true);

    try {
      const payload = {
        ...profileData,
        whatsapp_number: profileData.whatsapp_same_as_phone ? profileData.phone_number : profileData.whatsapp_number,
      };

      // --- NEW CLEANUP LOGIC ---
      // Pydantic STRICTLY expects `null` for empty optional fields (like Dates and Enums).
      // This loop safely transforms all empty strings `""` into `null` before sending.
      Object.keys(payload).forEach(key => {
        if (payload[key] === "") {
          payload[key] = null;
        }
      });

      const response = await secureFetch('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update profile.');
      }

      if (data.first_name) {
        localStorage.setItem('horyc_name', data.first_name);
      }

      setStatusMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSavingProfile(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!passwordData.current_password || !passwordData.new_password) {
      setStatusMsg({ type: 'error', text: 'Fill in both password fields.' });
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_new_password) {
      setStatusMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsSavingPassword(true);

    try {
      const response = await secureFetch('/api/users/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update password.');
      }

      setStatusMsg({ type: 'success', text: data.message || 'Password updated successfully!' });
      setPasswordData({ current_password: '', new_password: '', confirm_new_password: '' });
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to update password. Please try again.' });
    } finally {
      setIsSavingPassword(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold text-slate-800">Profile Settings</h2>
        <p className="text-slate-500 mt-1">Manage your personal information and security preferences.</p>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border ${
          statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="font-medium text-sm">{statusMsg.text}</p>
        </div>
      )}

      {/* MEMBER ID CARD */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 text-white rounded-lg">
            <IdCard size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">Member ID</h3>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Use this for fast check-ins</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3">
          <span className="font-mono text-lg font-bold tracking-widest text-brand-blue">{userData?.serial_number || 'N/A'}</span>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-brand-blue rounded-lg">
              <User size={20} />
            </div>
            <h3 className="font-bold text-lg text-slate-800">Personal Information</h3>
          </div>

          {/* PHOTO UPLOAD SECTION */}
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="relative w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-md flex-shrink-0 flex items-center justify-center overflow-hidden">
              {profileData.profile_photo_url ? (
                <img src={profileData.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-display font-bold text-slate-400">
                  {profileData.first_name ? profileData.first_name.charAt(0) : '?'}
                </span>
              )}
              {isUploadingPhoto && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-sm">
                  <Loader2 className="animate-spin text-brand-blue" size={24} />
                </div>
              )}
            </div>
            
            <div className="text-center sm:text-left">
              <h4 className="font-bold text-slate-800 text-sm mb-1">Profile Photo</h4>
              <p className="text-xs text-slate-500 mb-3 max-w-xs">Upload a clear photo of your face for your digital ID card. Max size 5MB.</p>
              
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                className="hidden" 
              />
              <button 
                type="button" 
                disabled={isUploadingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50"
              >
                <Camera size={16} />
                {profileData.profile_photo_url ? 'Change Photo' : 'Upload Photo'}
              </button>
            </div>
          </div>

          {/* FORM GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">First Name</label>
              <input type="text" name="first_name" value={profileData.first_name} onChange={handleProfileChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Last Name</label>
              <input type="text" name="last_name" value={profileData.last_name} onChange={handleProfileChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
              <input type="email" name="email" value={profileData.email} onChange={handleProfileChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sex</label>
              <select name="sex" value={profileData.sex} onChange={handleProfileChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white appearance-none">
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
              <input type="tel" name="phone_number" value={profileData.phone_number} onChange={handleProfileChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">WhatsApp Number</label>
              <input type="tel" name="whatsapp_number" value={profileData.whatsapp_number} onChange={handleProfileChange} placeholder={profileData.whatsapp_same_as_phone ? 'Same as phone' : 'Enter WhatsApp...'} disabled={profileData.whatsapp_same_as_phone} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed" />
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="update_wa_same" name="whatsapp_same_as_phone" checked={profileData.whatsapp_same_as_phone} onChange={handleProfileChange} className="rounded border-slate-300 text-brand-blue cursor-pointer" />
                <label htmlFor="update_wa_same" className="text-xs text-slate-500 cursor-pointer font-medium">Same as phone number</label>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date of Birth</label>
              <input type="date" name="dob" value={profileData.dob} onChange={handleProfileChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Location Zone</label>
              <input type="text" name="location_zone" value={profileData.location_zone} onChange={handleProfileChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-700 mb-4">Emergency Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contact Name</label>
                <input type="text" name="contact_person_name" value={profileData.contact_person_name} onChange={handleProfileChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Relationship</label>
                <input type="text" name="contact_person_relation" value={profileData.contact_person_relation} onChange={handleProfileChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contact Phone</label>
                <input type="tel" name="contact_person_phone" value={profileData.contact_person_phone} onChange={handleProfileChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-8">
            <button type="submit" disabled={isSavingProfile} className={`px-8 py-4 rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2 text-white ${isSavingProfile ? 'bg-brand-blue/70 cursor-not-allowed shadow-none' : 'bg-brand-blue hover:bg-blue-700 shadow-blue-600/30'}`}>
              {isSavingProfile ? <><Loader2 size={20} className="animate-spin" /> Saving Changes...</> : (
                <>
                  <Save size={20} />
                  Update Profile
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* PASSWORD SECTION */}
      <form onSubmit={handleSavePassword} className="space-y-6">
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2 bg-red-50 text-red-500 rounded-lg">
              <Lock size={20} />
            </div>
            <h3 className="font-bold text-lg text-slate-800">Password</h3>
          </div>

          <p className="text-sm text-slate-500 mb-6">Update your secure login password.</p>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Password</label>
              <div className="relative">
                <input 
                  type={showCurrentPassword ? "text" : "password"} 
                  name="current_password" 
                  value={passwordData.current_password} 
                  onChange={handlePasswordChange} 
                  placeholder="••••••••" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all bg-slate-50 focus:bg-white pr-12" 
                />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-blue transition-colors">
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
              <div className="relative">
                <input 
                  type={showNewPassword ? "text" : "password"} 
                  name="new_password" 
                  value={passwordData.new_password} 
                  onChange={handlePasswordChange} 
                  placeholder="••••••••" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all bg-slate-50 focus:bg-white pr-12" 
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-blue transition-colors">
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm New Password</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  name="confirm_new_password" 
                  value={passwordData.confirm_new_password} 
                  onChange={handlePasswordChange} 
                  placeholder="••••••••" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all bg-slate-50 focus:bg-white pr-12" 
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-blue transition-colors">
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button type="submit" disabled={isSavingPassword} className={`px-8 py-4 rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2 text-white ${isSavingPassword ? 'bg-slate-500 cursor-not-allowed shadow-none' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-600/30'}`}>
              {isSavingPassword ? <><Loader2 size={20} className="animate-spin" /> Updating...</> : (
                <>
                  <Lock size={20} />
                  Update Password
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}