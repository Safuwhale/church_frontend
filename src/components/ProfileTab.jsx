import { useEffect, useState, useRef } from 'react';
import { User, Lock, Save, CheckCircle2, AlertCircle, IdCard, Eye, EyeOff, Camera, Loader2, Mail, Phone, MapPin, Cake, Trash2, Shield, Heart } from 'lucide-react';
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

// Pure UI helper — not tied to save logic, purely cosmetic feedback for the user.
const getPasswordStrength = (pwd) => {
  if (!pwd) return null;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const levels = [
    { label: 'Weak', width: '25%', bar: 'bg-red-500', text: 'text-red-600' },
    { label: 'Fair', width: '50%', bar: 'bg-amber-500', text: 'text-amber-600' },
    { label: 'Good', width: '75%', bar: 'bg-blue-500', text: 'text-blue-600' },
    { label: 'Strong', width: '100%', bar: 'bg-emerald-500', text: 'text-emerald-600' },
  ];
  return levels[Math.max(0, Math.min(score - 1, 3))];
};

// Shared input shell so every field gets a consistent icon + focus treatment.
const FieldShell = ({ icon: Icon, children }) => (
  <div className="relative">
    {Icon && <Icon size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />}
    {children}
  </div>
);

const inputBase = "w-full py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white text-sm text-slate-800 placeholder:text-slate-400";

export default function ProfileTab({ userData }) {
  const fileInputRef = useRef(null);
  const [profileData, setProfileData] = useState(() => buildProfileState(userData));
  const [activeTab, setActiveTab] = useState('profile');

  // Local Photo States
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

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
  const [statusMsg, setStatusMsg] = useState(null);
  const [loadingText, setLoadingText] = useState('');

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

  // --- LOCAL PREVIEW ONLY ---
  const handlePhotoSelection = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatusMsg({ type: 'error', text: 'Image must be less than 5MB.' });
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setStatusMsg(null);
  };

  // Cosmetic-only: clears local preview + queues photo_url for removal on next save.
  // Feeds the same "" -> null cleanup loop that already runs in handleSaveProfile.
  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setProfileData((prev) => ({ ...prev, profile_photo_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- SAVE PROFILE & UPLOAD PHOTO ---
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setStatusMsg(null);
    setIsSavingProfile(true);
    setLoadingText('Saving details...');

    try {
      let finalPhotoUrl = profileData.profile_photo_url;

      // 1. Upload to Cloudinary FIRST (Only if a new photo was selected)
      if (photoFile) {
        setLoadingText('Uploading photo...');
        const sigResponse = await secureFetch(`/api/users/generate-upload-signature?identifier=${userData.serial_number}`);
        if (!sigResponse.ok) throw new Error("Could not connect to secure upload server.");

        const { timestamp, signature, folder, api_key, cloud_name, public_id } = await sigResponse.json();

        const formData = new FormData();
        formData.append('file', photoFile);
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
        if (!cloudinaryRes.ok) throw new Error("Image upload failed");

        finalPhotoUrl = cloudinaryData.secure_url;
      }

      setLoadingText('Updating profile...');

      // 2. Prepare Payload
      const payload = {
        ...profileData,
        profile_photo_url: finalPhotoUrl, // Attach the new URL!
        whatsapp_number: profileData.whatsapp_same_as_phone ? profileData.phone_number : profileData.whatsapp_number,
      };

      // 3. Strict Cleanup Loop
      Object.keys(payload).forEach(key => {
        if (payload[key] === "") {
          payload[key] = null;
        }
      });

      // 4. Save to Database
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

      // Cleanup local states on success
      setProfileData(prev => ({ ...prev, profile_photo_url: finalPhotoUrl }));
      setPhotoFile(null);
      setPhotoPreview(null);

      setStatusMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update profile. Please try again.' });
    } finally {
      setIsSavingProfile(false);
      setLoadingText('');
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

  const strength = getPasswordStrength(passwordData.new_password);
  const hasPhoto = Boolean(photoPreview || profileData.profile_photo_url);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-6">
      <div className="mb-2">
        <h2 className="font-display text-3xl font-bold text-slate-900">Profile Settings</h2>
        <p className="text-slate-500 mt-1">Manage your personal information and security preferences.</p>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border ${
          statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 size={20} className="flex-shrink-0" /> : <AlertCircle size={20} className="flex-shrink-0" />}
          <p className="font-medium text-sm">{statusMsg.text}</p>
        </div>
      )}

      {/* IDENTITY HERO — avatar, name, Member ID and role live in one place */}
      <div className="relative bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-6 md:p-8 overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-brand-blue/5" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="relative flex-shrink-0 mx-auto sm:mx-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-gradient-to-br from-blue-50 to-slate-100 border-4 border-white shadow-md ring-1 ring-slate-100 flex items-center justify-center">
              {hasPhoto ? (
                <img src={photoPreview || profileData.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-display font-bold text-brand-blue/40">
                  {profileData.first_name ? profileData.first_name.charAt(0).toUpperCase() : '?'}
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={isSavingProfile}
              onClick={() => fileInputRef.current?.click()}
              aria-label={hasPhoto ? 'Change photo' : 'Upload photo'}
              className="absolute bottom-0 right-0 p-2 bg-brand-blue text-white rounded-full shadow-md border-2 border-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Camera size={14} />
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handlePhotoSelection}
              className="hidden"
            />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-display text-xl font-bold text-slate-900">
              {profileData.first_name || profileData.last_name
                ? `${profileData.first_name} ${profileData.last_name}`.trim()
                : 'Complete your profile'}
            </h3>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-mono font-bold tracking-widest">
                <IdCard size={12} />
                {userData?.serial_number || 'N/A'}
              </span>
              {userData?.role && userData.role !== 'member' && (
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-wider border border-amber-200">
                  {userData.role}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-3">
              JPG or PNG, up to 5MB.
              {hasPhoto && (
                <button type="button" onClick={handleRemovePhoto} className="text-red-500 hover:text-red-600 font-semibold ml-2 hover:underline">
                  Remove photo
                </button>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION SWITCHER */}
      <div className="inline-flex p-1 bg-slate-100 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'profile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <User size={16} />
          Profile Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'security' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield size={16} />
          Security
        </button>
      </div>

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* BASIC INFO */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-blue-50 text-brand-blue rounded-lg">
                <User size={20} />
              </div>
              <h3 className="font-bold text-lg text-slate-800">Basic Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">First Name</label>
                <input type="text" name="first_name" value={profileData.first_name} onChange={handleProfileChange} required className={inputBase + " px-4"} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Last Name</label>
                <input type="text" name="last_name" value={profileData.last_name} onChange={handleProfileChange} required className={inputBase + " px-4"} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                <FieldShell icon={Mail}>
                  <input type="email" name="email" value={profileData.email} onChange={handleProfileChange} className={inputBase + " pl-11 pr-4"} />
                </FieldShell>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sex</label>
                <div className="relative">
                  <select name="sex" value={profileData.sex} onChange={handleProfileChange} className={inputBase + " pl-4 pr-10 appearance-none cursor-pointer"}>
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date of Birth</label>
                <FieldShell icon={Cake}>
                  <input type="date" name="dob" value={profileData.dob} onChange={handleProfileChange} className={inputBase + " pl-11 pr-4"} />
                </FieldShell>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Location Zone</label>
                <FieldShell icon={MapPin}>
                  <input type="text" name="location_zone" value={profileData.location_zone} onChange={handleProfileChange} className={inputBase + " pl-11 pr-4"} />
                </FieldShell>
              </div>
            </div>
          </div>

          {/* CONTACT */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-blue-50 text-brand-blue rounded-lg">
                <Phone size={20} />
              </div>
              <h3 className="font-bold text-lg text-slate-800">Contact</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
                <FieldShell icon={Phone}>
                  <input type="tel" name="phone_number" value={profileData.phone_number} onChange={handleProfileChange} required className={inputBase + " pl-11 pr-4"} />
                </FieldShell>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp Number</label>
                  <label className="relative inline-flex items-center cursor-pointer gap-2">
                    <span className="text-[11px] font-semibold text-slate-400">Same as phone</span>
                    <span className="relative">
                      <input
                        type="checkbox"
                        name="whatsapp_same_as_phone"
                        checked={profileData.whatsapp_same_as_phone}
                        onChange={handleProfileChange}
                        className="sr-only peer"
                      />
                      <span className="block w-9 h-5 rounded-full bg-slate-200 peer-checked:bg-brand-blue transition-colors" />
                      <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                    </span>
                  </label>
                </div>
                <FieldShell icon={Phone}>
                  <input
                    type="tel"
                    name="whatsapp_number"
                    value={profileData.whatsapp_number}
                    onChange={handleProfileChange}
                    placeholder={profileData.whatsapp_same_as_phone ? 'Same as phone' : 'Enter WhatsApp number'}
                    disabled={profileData.whatsapp_same_as_phone}
                    className={inputBase + " pl-11 pr-4 disabled:opacity-50 disabled:cursor-not-allowed"}
                  />
                </FieldShell>
              </div>
            </div>
          </div>

          {/* EMERGENCY CONTACT */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                <Heart size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">Emergency Contact</h3>
                <p className="text-xs text-slate-400 mt-0.5">Who should we reach if we can't reach you?</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contact Name</label>
                <input type="text" name="contact_person_name" value={profileData.contact_person_name} onChange={handleProfileChange} className={inputBase + " px-4"} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Relationship</label>
                <input type="text" name="contact_person_relation" value={profileData.contact_person_relation} onChange={handleProfileChange} className={inputBase + " px-4"} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contact Phone</label>
                <input type="tel" name="contact_person_phone" value={profileData.contact_person_phone} onChange={handleProfileChange} className={inputBase + " px-4"} />
              </div>
            </div>
          </div>

          {/* STICKY SAVE BAR */}
          <div className="sticky bottom-4 z-10">
            <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-2xl shadow-xl shadow-slate-300/30 p-3 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400 hidden sm:block pl-2">Changes save directly to your member profile.</p>
              <button
                type="submit"
                disabled={isSavingProfile}
                className={`ml-auto px-6 py-3 rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2 text-white text-sm ${
                  isSavingProfile ? 'bg-brand-blue/70 cursor-not-allowed shadow-none' : 'bg-brand-blue hover:bg-blue-700 shadow-blue-600/30'
                }`}
              >
                {isSavingProfile ? <><Loader2 size={18} className="animate-spin" /> {loadingText}</> : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SECURITY TAB */}
      {activeTab === 'security' && (
        <form onSubmit={handleSavePassword} className="space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                <Lock size={20} />
              </div>
              <h3 className="font-bold text-lg text-slate-800">Password</h3>
            </div>

            <p className="text-sm text-slate-500 mb-6">Update your secure login password.</p>

            <div className="space-y-5 max-w-md">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    className={inputBase + " px-4 pr-12"}
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
                    className={inputBase + " px-4 pr-12"}
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-blue transition-colors">
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {strength && (
                  <div className="mt-2.5">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.bar}`} style={{ width: strength.width }} />
                    </div>
                    <p className={`text-[11px] font-bold mt-1.5 ${strength.text}`}>{strength.label} password</p>
                  </div>
                )}
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
                    className={inputBase + " px-4 pr-12"}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-blue transition-colors">
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordData.confirm_new_password && passwordData.new_password !== passwordData.confirm_new_password && (
                  <p className="text-[11px] font-bold mt-1.5 text-red-500">Passwords don't match yet</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-8 mt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSavingPassword}
                className={`px-6 py-3 rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2 text-white text-sm ${
                  isSavingPassword ? 'bg-slate-500 cursor-not-allowed shadow-none' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-600/30'
                }`}
              >
                {isSavingPassword ? <><Loader2 size={18} className="animate-spin" /> Updating...</> : (
                  <>
                    <Lock size={18} />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}