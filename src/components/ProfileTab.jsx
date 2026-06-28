import { useState, useEffect } from 'react';
import { User, Lock, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfileTab({ userData }) {
  // Mock initial data - in Phase 4, we will fetch this directly from your database
  const [profileData, setProfileData] = useState({
    first_name: userData?.first_name || '',
    last_name: userData?.last_name || '',
    phone_number: '',
    whatsapp_same_as_phone: true,
    whatsapp_number: '',
    dob: '',
    location_zone: '',
    contact_person_name: '',
    contact_person_relation: ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'success' | 'error', text: '' }

  // Handlers for input changes
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

    // Password validation if they are trying to update it
    if (passwordData.new_password) {
      if (!passwordData.current_password) {
        setStatusMsg({ type: 'error', text: 'You must enter your current password to set a new one.' });
        return;
      }
      if (passwordData.new_password !== passwordData.confirm_new_password) {
        setStatusMsg({ type: 'error', text: 'New passwords do not match.' });
        return;
      }
    }

    setIsLoading(true);

    try {
      // TODO (Phase 4): Replace with actual PUT /api/users/me fetch request
      console.log("Saving Profile Data:", profileData);
      if (passwordData.new_password) {
        console.log("Updating Password...");
      }

      // Simulating network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStatusMsg({ type: 'success', text: 'Profile updated successfully!' });
      
      // Clear password fields on success
      setPasswordData({ current_password: '', new_password: '', confirm_new_password: '' });

    } catch (error) {
      setStatusMsg({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsLoading(false);
      // Auto-hide success message after 4 seconds
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

      <form onSubmit={handleSaveProfile} className="space-y-6">
        
        {/* PERSONAL INFO CARD */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-brand-blue rounded-lg">
              <User size={20} />
            </div>
            <h3 className="font-bold text-lg text-slate-800">Personal Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">First Name</label>
              <input type="text" name="first_name" value={profileData.first_name} onChange={handleProfileChange} required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Last Name</label>
              <input type="text" name="last_name" value={profileData.last_name} onChange={handleProfileChange} required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
              <input type="tel" name="phone_number" value={profileData.phone_number} onChange={handleProfileChange} required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">WhatsApp Number</label>
              <input type="tel" name="whatsapp_number" value={profileData.whatsapp_number} onChange={handleProfileChange} placeholder={profileData.whatsapp_same_as_phone ? "Same as phone" : "Enter WhatsApp..."} disabled={profileData.whatsapp_same_as_phone}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed" />
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="update_wa_same" name="whatsapp_same_as_phone" checked={profileData.whatsapp_same_as_phone} onChange={handleProfileChange} className="rounded border-slate-300 text-brand-blue" />
                <label htmlFor="update_wa_same" className="text-xs text-slate-500 cursor-pointer">Same as phone number</label>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date of Birth</label>
              <input type="date" name="dob" value={profileData.dob} onChange={handleProfileChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Location Zone</label>
              <input type="text" name="location_zone" value={profileData.location_zone} onChange={handleProfileChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-700 mb-4">Emergency Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contact Name</label>
                <input type="text" name="contact_person_name" value={profileData.contact_person_name} onChange={handleProfileChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Relationship</label>
                <input type="text" name="contact_person_relation" value={profileData.contact_person_relation} onChange={handleProfileChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
              </div>
            </div>
          </div>
        </div>

        {/* SECURITY CARD */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2 bg-red-50 text-red-500 rounded-lg">
              <Lock size={20} />
            </div>
            <h3 className="font-bold text-lg text-slate-800">Update Password</h3>
          </div>
          
          <p className="text-sm text-slate-500 mb-6">Leave these fields blank if you do not wish to change your password.</p>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Password</label>
              <input type="password" name="current_password" value={passwordData.current_password} onChange={handlePasswordChange} placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
              <input type="password" name="new_password" value={passwordData.new_password} onChange={handlePasswordChange} placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm New Password</label>
              <input type="password" name="confirm_new_password" value={passwordData.confirm_new_password} onChange={handlePasswordChange} placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue transition-colors bg-slate-50 focus:bg-white" />
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex justify-end pt-4 pb-12">
          <button 
            type="submit" 
            disabled={isLoading}
            className={`px-8 py-4 rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2 text-white
              ${isLoading ? 'bg-brand-blue/70 cursor-not-allowed shadow-none' : 'bg-brand-blue hover:bg-blue-700 shadow-blue-600/30'}`}
          >
            {isLoading ? 'Saving Changes...' : (
              <>
                <Save size={20} />
                Save Profile
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}