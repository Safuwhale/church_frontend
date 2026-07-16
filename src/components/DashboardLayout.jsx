import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ScanLine, Menu, ChevronRight, X } from 'lucide-react';

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

  // Purely derived UI state — lets the profile card act as a real shortcut
  // when the host portal actually has a "profile" tab registered.
  const hasProfileTab = menuItems.some((item) => item.id === 'profile');
  const goToProfile = () => {
    if (!hasProfileTab) return;
    setActiveTab('profile');
    setIsSidebarOpen(false);
  };

  // Orients mobile users who can't see the sidebar once it's collapsed.
  const activeLabel = menuItems.find((item) => item.id === activeTab)?.label || 'Dashboard';

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
          <div className="flex items-center justify-between mb-8 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/20 shrink-0">
                H
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-sm font-bold leading-tight tracking-wide text-white truncate">
                  House of Refuge<br />Youth Church
                </h1>
                <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mt-1">
                  {userData.role === 'hod' ? 'HOD' : userData.role} Portal
                </p>
              </div>
            </div>
            {/* Close button, mobile only — sidebar is otherwise dismissed via the overlay tap */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 -mr-1.5 text-slate-500 hover:text-white rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* PROFILE CARD — doubles as a shortcut into Profile Settings */}
          <button
            onClick={goToProfile}
            disabled={!hasProfileTab}
            className={`bg-slate-800/50 p-4 rounded-2xl mb-8 border border-slate-700 backdrop-blur-sm flex items-center gap-3 shrink-0 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
              hasProfileTab ? 'hover:bg-slate-800 hover:border-slate-600 cursor-pointer' : 'cursor-default'
            }`}
          >
            <div className="relative shrink-0">
              {userData.profile_photo_url ? (
                <img
                  src={userData.profile_photo_url}
                  alt="Profile"
                  className="w-11 h-11 rounded-full object-cover border-2 border-brand-blue/30 bg-slate-800"
                />
              ) : (
                <div className="w-11 h-11 bg-brand-blue rounded-full flex items-center justify-center font-display font-bold text-lg text-white shadow-md">
                  {userData.first_name.charAt(0)}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-800" title="Active session" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-slate-400 mb-0.5 font-medium">Hello,</p>
              <p className="font-bold text-sm text-white truncate leading-tight mb-1">{userData.first_name}</p>
              <span className="inline-block text-[10px] font-mono bg-brand-blue/20 text-brand-light px-2 py-0.5 rounded border border-brand-blue/30">
                {userData.serial_number}
              </span>
            </div>
            {hasProfileTab && <ChevronRight size={16} className="text-slate-500 shrink-0" />}
          </button>

          {/* DYNAMIC NAVIGATION MENU */}
          <nav className="flex-1 space-y-1.5 mb-6">
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
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
                    isActive
                      ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-0.5'
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
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <ScanLine size={18} />
                  Open QR Scanner
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* LOGOUT BUTTON (Sticky at bottom of sidebar) */}
        <div className="p-6 border-t border-slate-800 shrink-0" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative">

        {/* MOBILE HEADER — now shows where you are, not just the logo */}
        <header
          className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10 shrink-0"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-brand-dark rounded-lg flex items-center justify-center font-display font-bold text-white text-sm shrink-0">
              H
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-brand-dark text-sm leading-tight truncate">{activeLabel}</p>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">HORYC Portal</p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue shrink-0"
            aria-label="Open menu"
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