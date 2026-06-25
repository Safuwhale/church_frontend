import { useState } from 'react';
import { CalendarPlus, Power, Activity, Users, Clock } from 'lucide-react';

export default function OverviewTab({ token }) {
  // In the future, this will be fetched from the backend on load
  const [activeService, setActiveService] = useState(null); 
  const [newServiceName, setNewServiceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateService = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Connect to FastAPI POST /api/services endpoint
    console.log("Creating new service:", newServiceName);
    
    // Simulating backend delay and response
    setTimeout(() => {
      setActiveService({
        id: 1,
        name: newServiceName || 'Sunday Service',
        date: new Date().toLocaleDateString(),
        status: 'active',
        checkIns: 0
      });
      setNewServiceName('');
      setIsLoading(false);
    }, 800);
  };

  const handleEndService = async () => {
    if (!window.confirm("Are you sure you want to close this service? Ushers will no longer be able to scan QR codes.")) return;
    
    setIsLoading(true);
    // TODO: Connect to FastAPI PATCH /api/services/{id}/close
    
    setTimeout(() => {
      setActiveService(null);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: The Master Control Panel */}
      <div className={`p-6 rounded-3xl border transition-colors ${
        activeService 
          ? 'bg-emerald-50 border-emerald-200' 
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-bold flex items-center gap-2 text-slate-800">
              <Activity size={24} className={activeService ? "text-emerald-500 animate-pulse" : "text-slate-400"} />
              Service Status: {activeService ? 'Live & Accepting Check-ins' : 'Offline'}
            </h3>
            <p className="text-slate-500 mt-1">
              {activeService 
                ? `Currently running: ${activeService.name} (${activeService.date})`
                : 'No active service. Ushers cannot scan QR codes right now.'}
            </p>
          </div>

          {activeService && (
            <button 
              onClick={handleEndService}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50"
            >
              <Power size={18} />
              End Service
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SECTION 2: Create Service Form (Only shows if no active service) */}
        {!activeService && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4 text-brand-dark">
              <CalendarPlus size={24} className="text-brand-blue" />
              <h3 className="font-display text-lg font-bold">Launch New Service</h3>
            </div>
            
            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Service Name</label>
                <input 
                  type="text" 
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="e.g., Sunday Service - June 28"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-brand-dark text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? 'Launching...' : 'Start Service'}
              </button>
            </form>
          </div>
        )}

        {/* SECTION 3: Live Stats (Only shows if service is active) */}
        {activeService && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm md:col-span-2">
            <h3 className="font-display text-lg font-bold text-slate-800 mb-4">Live Check-in Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                <div className="bg-blue-100 text-brand-blue p-3 rounded-xl">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Total Checked In</p>
                  <p className="text-2xl font-bold text-slate-800">{activeService.checkIns}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Time Running</p>
                  <p className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    Live
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}