/**
 * UsherDashboard Page
 * Fetches all services and allows the Usher to select an active one to scan for.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { secureFetch } from '../api/api';
import { Calendar, Clock, QrCode, LogOut, Activity } from 'lucide-react';

export default function UsherDashboard() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Standard role check
    const token = localStorage.getItem('horyc_token');
    const role = localStorage.getItem('horyc_role');
    if (!token || (role !== 'usher' && role !== 'hod')) navigate('/login');

    // 2. Fetch available services
    const fetchServices = async () => {
      try {
        const res = await secureFetch('/api/services');
        if (res.ok) {
          const data = await res.json();
          const sorted = data.filter((service) => service.is_active || !service.time_started);
          setServices(sorted);
        }
      } catch (err) {
        console.error("Failed to load services:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <header className="max-w-4xl mx-auto flex items-center justify-between mb-10 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-display font-bold">Usher Dashboard</h1>
          <p className="text-slate-400 mt-1">Select an active service to start scanning</p>
        </div>
        <button 
          onClick={() => { localStorage.removeItem('horyc_token'); localStorage.removeItem('horyc_role'); localStorage.removeItem('horyc_name'); localStorage.removeItem('horyc_id'); navigate('/usher-dashboard', { replace: true }); window.location.reload(); }}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
        >
          <LogOut size={18} />
          End Shift
        </button>
      </header>

      <main className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/50 rounded-3xl border border-slate-700">
            <Calendar size={48} className="mx-auto text-slate-500 mb-4" />
            <h3 className="text-xl font-bold">No Services Available</h3>
            <p className="text-slate-400">Ask the HOD to create a service in the Command Center.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => (
              <div 
                key={service.id} 
                className={`p-6 rounded-3xl border transition-all ${
                  service.is_active 
                  ? 'bg-slate-800 border-emerald-500/50 hover:border-emerald-400 shadow-lg' 
                  : 'bg-slate-800/50 border-slate-700 opacity-75'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white">{service.title}</h3>
                  {service.is_active ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
                      <Activity size={12} className="animate-pulse" /> Active
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-slate-700 text-slate-400 text-xs font-bold rounded-full">
                      Closed
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Calendar size={16} className="text-slate-500" />
                    {new Date(service.service_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Clock size={16} className="text-slate-500" />
                    {service.time_started ? new Date(service.time_started).toLocaleTimeString() : 'Not started'}
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/scanner/${service.id}`)}
                  disabled={!service.is_active}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                    service.is_active
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <QrCode size={18} />
                  {service.is_active ? 'Open Scanner' : 'Pending Service'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}