import { useEffect, useState } from 'react';
import { User, Lock, Save, CheckCircle2, AlertCircle, IdCard, Eye, EyeOff } from 'lucide-react';
import { secureFetch } from '../api/api';

const buildProfileState = (userData) => ({
  first_name: userData?.first_name || '',
  last_name: userData?.last_name || '',
  phone_number: userData?.phone_number || '',
  whatsapp_same_as_phone: true,
  whatsapp_number: userData?.whatsapp_number || '',
  dob: userData?.dob || '',
  location_zone: userData?.location_zone || '',
  contact_person_name: userData?.contact_person_name || '',
  contact_person_relation: userData?.contact_person_relation || ''
});

export default function ProfileTab({ userData }) {
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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setStatusMsg(null);
    setIsSavingProfile(true);

    try {
      const payload = {
        ...profileData,
        whatsapp_number: profileData.whatsapp_same_as_phone ? profileData.phone_number : profileData.whatsapp_number,
      };

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

      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-2 bg-slate-900 text-white rounded-lg">
            <IdCard size={20} />
          </div>
          <h3 className="font-bold text-lg text-slate-800">Member ID</h3>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">ID</span>
          <span className="font-mono text-sm font-semibold text-slate-800">{userData?.serial_number || 'N/A'}</span>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-brand-blue rounded-lg">
              <User size={20} />
            </div>
            <h3 className="font-bold text-lg text-slate-800">Profiles</h3>
          </div>

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
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
              <input type="tel" name="phone_number" value={profileData.phone_number} onChange={handleProfileChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">WhatsApp Number</label>
              <input type="tel" name="whatsapp_number" value={profileData.whatsapp_number} onChange={handleProfileChange} placeholder={profileData.whatsapp_same_as_phone ? 'Same as phone' : 'Enter WhatsApp...'} disabled={profileData.whatsapp_same_as_phone} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed" />
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="update_wa_same" name="whatsapp_same_as_phone" checked={profileData.whatsapp_same_as_phone} onChange={handleProfileChange} className="rounded border-slate-300 text-brand-blue" />
                <label htmlFor="update_wa_same" className="text-xs text-slate-500 cursor-pointer">Same as phone number</label>
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

          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-700 mb-4">Emergency Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contact Name</label>
                <input type="text" name="contact_person_name" value={profileData.contact_person_name} onChange={handleProfileChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Relationship</label>
                <input type="text" name="contact_person_relation" value={profileData.contact_person_relation} onChange={handleProfileChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={isSavingProfile} className={`px-8 py-4 rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2 text-white ${isSavingProfile ? 'bg-brand-blue/70 cursor-not-allowed shadow-none' : 'bg-brand-blue hover:bg-blue-700 shadow-blue-600/30'}`}>
              {isSavingProfile ? 'Saving Changes...' : (
                <>
                  <Save size={20} />
                  Update Profile
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <form onSubmit={handleSavePassword} className="space-y-6">
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2 bg-red-50 text-red-500 rounded-lg">
              <Lock size={20} />
            </div>
            <h3 className="font-bold text-lg text-slate-800">Password</h3>
          </div>

          <p className="text-sm text-slate-500 mb-6">Update your password.</p>

          <div className="space-y-4 max-w-md">
            {/* CURRENT PASSWORD */}
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
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-blue transition-colors"
                >
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* NEW PASSWORD */}
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
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-blue transition-colors"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* CONFIRM NEW PASSWORD */}
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
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-blue transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button type="submit" disabled={isSavingPassword} className={`px-8 py-4 rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2 text-white ${isSavingPassword ? 'bg-slate-500 cursor-not-allowed shadow-none' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-600/30'}`}>
              {isSavingPassword ? 'Updating Password...' : (
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