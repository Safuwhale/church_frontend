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
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-brand-dark text-white p-6 flex flex-col z-30 transition-transform duration-300 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center font-display font-bold text-xl shadow-lg shadow-blue-500/20">
            H
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-wide">HORYC</h1>
            <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">Portal</p>
          </div>
        </div>

        {/* PROFILE CARD */}
        <div className="bg-slate-800/50 p-4 rounded-2xl mb-8 border border-slate-700 backdrop-blur-sm">
          <p className="text-sm text-slate-400 mb-1">Welcome back,</p>
          <p className="font-bold text-lg text-white mb-2">{userData.first_name}</p>
          <div className="flex gap-2">
            <span className="text-xs font-mono bg-brand-blue/20 text-brand-light px-2 py-1 rounded-md border border-brand-blue/30">
              {userData.serial_number}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider bg-slate-700 text-slate-300 px-2 py-1 rounded-md border border-slate-600">
              {userData.role}
            </span>
          </div>
        </div>

        {/* DYNAMIC NAVIGATION MENU */}
        <nav className="flex-1 space-y-2">
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
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500'} />
                {item.label}
              </button>
            );
          })}

          {/* SPECIAL USHER BUTTON (External link to Kiosk Mode) */}
          {userData.role === 'usher' && (
            <div className="pt-4 mt-4 border-t border-slate-800">
              <button
                onClick={() => navigate('/scanner')}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all duration-200"
              >
                <ScanLine size={20} />
                Open Gate Scanner
              </button>
            </div>
          )}
        </nav>

        <button 
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 px-4 py-3.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all font-medium"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* MOBILE HEADER */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
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