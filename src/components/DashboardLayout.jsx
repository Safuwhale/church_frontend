import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ScanLine, Menu } from 'lucide-react';

export default function DashboardLayout({ userData, menuItems, activeTab, setActiveTab, children }) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('horyc_token');
    localStorage.removeItem('horyc_role');
    localStorage.removeItem('horyc_name');
    localStorage.removeItem('horyc_id');
    navigate('/login');
  };

  // Failsafe: if data isn't loaded yet, don't render the shell
  if (!userData) return null;

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex font-sans">
      
      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed md:sticky top-0 left-0 h-[100dvh] w-72 bg-brand-dark text-white flex flex-col z-50 transition-transform duration-300 shadow-2xl md:shadow-none ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        
        {/* Scrollable internal container so the sidebar never exceeds mobile screen height */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6">
          
          {/* LOGO AREA */}
          <div className="flex items-center gap-3 mb-8 shrink-0">
            <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/20 shrink-0">
              H
            </div>
            <div>
              <h1 className="font-display text-sm font-bold leading-tight tracking-wide text-white">
                House of Refuge<br />Youth Church
              </h1>
              <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mt-1">
                {userData.role === 'hod' ? 'HOD' : userData.role} Portal
              </p>
            </div>
          </div>

          {/* PROFILE CARD */}
          <div className="bg-slate-800/50 p-4 rounded-2xl mb-8 border border-slate-700 backdrop-blur-sm flex items-center gap-3 shrink-0">
            {userData.profile_photo_url ? (
              <img 
                src={userData.profile_photo_url} 
                alt="Profile" 
                className="w-11 h-11 rounded-full object-cover border-2 border-brand-blue/30 bg-slate-800 shrink-0"
              />
            ) : (
              <div className="w-11 h-11 bg-brand-blue rounded-full flex items-center justify-center font-display font-bold text-lg text-white shadow-md shrink-0">
                {userData.first_name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-slate-400 mb-0.5 font-medium">Hello,</p>
              <p className="font-bold text-sm text-white truncate leading-tight mb-1">{userData.first_name}</p>
              <span className="inline-block text-[10px] font-mono bg-brand-blue/20 text-brand-light px-2 py-0.5 rounded border border-brand-blue/30">
                {userData.serial_number}
              </span>
            </div>
          </div>

          {/* DYNAMIC NAVIGATION MENU */}
          <nav className="flex-1 space-y-2 mb-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500'} />
                  {item.label}
                </button>
              );
            })}

            {/* SPECIAL USHER BUTTON (External link to Kiosk Mode) */}
            {userData.role === 'usher' && (
              <div className="pt-4 mt-4 border-t border-slate-800">
                <button
                  onClick={() => navigate('/usher-dashboard')}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all duration-200"
                >
                  <ScanLine size={18} />
                  Open Gate Scanner
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* LOGOUT BUTTON (Sticky at bottom of sidebar) */}
        <div className="p-6 border-t border-slate-800 shrink-0">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all font-medium text-sm"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative">
        
        {/* MOBILE HEADER */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-brand-dark rounded-lg flex items-center justify-center font-display font-bold text-white text-sm">
                H
              </div>
              <span className="font-display font-bold text-brand-dark">HORYC</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* INJECTED PORTAL CONTENT GOES HERE */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}