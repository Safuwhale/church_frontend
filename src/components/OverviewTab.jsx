import { useState } from 'react';
import { CalendarPlus, Power, Users, Clock, Play, Calendar, Trash2 } from 'lucide-react';

export default function OverviewTab({ token }) {
  const [activeService, setActiveService] = useState(null);
  
  const [draftServices, setDraftServices] = useState([
    { id: 101, name: 'Sunday Service', date: '2026-06-28', status: 'draft' },
    { id: 102, name: 'Midweek Bible Study', date: '2026-07-02', status: 'draft' }
  ]);
  
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDate, setNewServiceDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateDraft = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Connect to FastAPI POST /api/services
    setTimeout(() => {
      const newDraft = {
        id: Date.now(),
        name: newServiceName || 'Sunday Service',
        date: newServiceDate || new Date().toISOString().split('T')[0],
        status: 'draft'
      };
      setDraftServices([...draftServices, newDraft]);
      setNewServiceName('');
      setNewServiceDate('');
      setIsLoading(false);
    }, 600);
  };

  const handleActivateService = (serviceId) => {
    if (activeService) {
      alert("You must end the current active service before starting a new one.");
      return;
    }

    setIsLoading(true);
    // TODO: Connect to FastAPI PATCH /api/services/{id}/activate
    
    setTimeout(() => {
      const serviceToActivate = draftServices.find(s => s.id === serviceId);
      setActiveService({
        ...serviceToActivate,
        status: 'active',
        checkIns: 0,
        startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setDraftServices(draftServices.filter(s => s.id !== serviceId));
      setIsLoading(false);
    }, 600);
  };

  const handleDeleteDraft = (serviceId) => {
    if (!window.confirm("Are you sure you want to delete this scheduled service?")) return;
    
    // TODO: Connect to FastAPI DELETE /api/services/{id}
    setDraftServices(draftServices.filter(s => s.id !== serviceId));
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
      
      {/* SECTION 1: THE MASTER CONTROL (ACTIVE SERVICE) */}
      <div className={`p-6 md:p-8 rounded-3xl border-2 transition-all duration-500 ${
        activeService 
          ? 'bg-emerald-50 border-emerald-400 shadow-lg shadow-emerald-500/10' 
          : 'bg-slate-50 border-slate-200 border-dashed'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="relative flex h-4 w-4">
                {activeService && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-4 w-4 ${activeService ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
              </span>
              <h3 className="font-display text-2xl font-bold text-slate-800">
                {activeService ? 'Service Open' : 'Service Closed'}
              </h3>
            </div>
            <p className="text-slate-600">
              {activeService 
                ? `Currently logging attendance for: ${activeService.name}`
                : 'No active service. Ushers and Members cannot check in right now.'}
            </p>
          </div>

          {activeService && (
            <button 
              onClick={handleEndService}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50"
            >
              <Power size={20} />
              End Service
            </button>
          )}
        </div>

        {/* Live Stats Overlay */}
        {activeService && (
          <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-emerald-200/60">
            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl flex items-center gap-4">
              <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-emerald-800 font-medium">Total Checked In</p>
                <p className="text-3xl font-bold text-emerald-950">{activeService.checkIns}</p>
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl flex items-center gap-4">
              <div className="bg-blue-100 text-brand-blue p-3 rounded-xl">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm text-blue-800 font-medium">Started At</p>
                <p className="text-3xl font-bold text-blue-950">{activeService.startTime}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION 2: PENDING SERVICES POOL */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6 text-brand-dark">
            <Calendar size={24} className="text-brand-blue" />
            <h3 className="font-display text-lg font-bold">Pending Services</h3>
          </div>
          
          <div className="space-y-3">
            {draftServices.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center border-2 border-dashed border-slate-100 rounded-xl">No pending services drafted.</p>
            ) : (
              draftServices.map(service => (
                <div key={service.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:border-slate-300 transition-colors gap-4">
                  <div>
                    <h4 className="font-bold text-slate-800">{service.name}</h4>
                    <p className="text-sm text-slate-500">{new Date(service.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleDeleteDraft(service.id)}
                      disabled={isLoading}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Service"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleActivateService(service.id)}
                      disabled={activeService !== null || isLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        activeService 
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                          : 'bg-brand-blue text-white hover:bg-blue-600 shadow-md shadow-blue-500/20'
                      }`}
                    >
                      <Play size={16} fill="currentColor" />
                      Activate
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION 3: DRAFT NEW SERVICE FORM */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6 text-brand-dark">
            <CalendarPlus size={24} className="text-brand-blue" />
            <h3 className="font-display text-lg font-bold">Draft New Service</h3>
          </div>
          
          <form onSubmit={handleCreateDraft} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Service Name</label>
              <input 
                type="text" 
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="e.g., Youth Convention Day 1"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Date</label>
              <input 
                type="date" 
                value={newServiceDate}
                onChange={(e) => setNewServiceDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-800 text-white py-3.5 rounded-xl font-medium hover:bg-slate-900 transition-colors disabled:opacity-50 mt-2"
            >
              Save to Pending
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}