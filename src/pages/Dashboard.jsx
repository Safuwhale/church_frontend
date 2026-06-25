import { useState, useEffect } from 'react';
import { LogOut, LayoutDashboard, Users, BookOpen, Settings, QrCode, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // New state for mobile toggler
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('horyc_token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const response = await fetch('http://localhost:8000/api/users/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Session expired');
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        localStorage.removeItem('horyc_token');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('horyc_token');
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-brand-blue font-medium">Loading command center...</div>
      </div>
    );
  }

  // --- NAVIGATION CONFIGURATION ---
  const navigation = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, roles: ['member', 'usher', 'leader', 'hod', 'admin'] },
    { id: 'qr', label: 'My QR Code', icon: QrCode, roles: ['member', 'usher', 'leader', 'hod', 'admin'] },
    { id: 'directory', label: 'Members Directory', icon: Users, roles: ['leader', 'hod', 'admin'] },
    { id: 'registry', label: 'Attendance Registry', icon: BookOpen, roles: ['hod', 'admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['member', 'usher', 'leader', 'hod', 'admin'] },
  ];

  const allowedNav = navigation.filter(nav => nav.roles.includes(userData?.role));

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* MOBILE OVERLAY (Darkens background when menu is open) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-brand-dark tracking-tight">HORYC Portal</h1>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">
              {userData?.role} Account
            </p>
          </div>
          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {allowedNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false); // Auto-close on mobile when an item is clicked
                }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive 
                    ? 'bg-brand-blue text-white shadow-md shadow-blue-600/20' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-brand-dark'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto">
        <header className="p-6 md:p-10 pb-0 flex items-center gap-4">
          {/* Hamburger Menu Button (Mobile Only) */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors bg-white shadow-sm border border-slate-200"
          >
            <Menu size={24} />
          </button>
          
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-brand-dark">
              {allowedNav.find(n => n.id === activeTab)?.label}
            </h2>
            <p className="text-slate-500 mt-1 hidden sm:block">Welcome back, {userData?.first_name}.</p>
          </div>
        </header>

        {/* TAB CONTENT ROUTER */}
        <div className="p-6 md:p-10 flex-1">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 min-h-[60vh]">
            
            {activeTab === 'overview' && (
               <div className="text-center py-10">
                 <div className="bg-brand-light w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-blue">
                   <LayoutDashboard size={32} />
                 </div>
                 <h3 className="font-display text-xl font-bold">Dashboard Overview</h3>
                 <p className="text-slate-500 max-w-md mx-auto mt-2">
                   Quick stats and service controls will appear here.
                 </p>
               </div>
            )}

            {activeTab === 'directory' && (
               <div className="text-center py-10">
                 <Users size={48} className="mx-auto text-slate-300 mb-4" />
                 <h3 className="font-display text-xl font-bold">Members Directory</h3>
                 <p className="text-slate-500 max-w-md mx-auto mt-2">
                   List of all members, contact details, and role promotion tools will go here.
                 </p>
               </div>
            )}

            {activeTab === 'registry' && (
               <div className="text-center py-10">
                 <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                 <h3 className="font-display text-xl font-bold">Attendance Registry</h3>
                 <p className="text-slate-500 max-w-md mx-auto mt-2">
                   Historical data, graphs, and export features to track Sunday-to-Sunday impact.
                 </p>
               </div>
            )}

            {activeTab === 'settings' && (
               <div className="text-center py-10">
                 <Settings size={48} className="mx-auto text-slate-300 mb-4" />
                 <h3 className="font-display text-xl font-bold">Account Settings</h3>
                 <p className="text-slate-500 max-w-md mx-auto mt-2">
                   Profile updates, cell group assignment, and password changes.
                 </p>
               </div>
            )}

          </div>
        </div>
      </main>

    </div>
  );
}