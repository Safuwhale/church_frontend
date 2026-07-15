import { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CalendarPlus, Power, Users, Clock, Play, Calendar, Trash2, History, QrCode, X } from 'lucide-react';
import { secureFetch } from '../api/api'; 
import { downloadQrAsA4Jpg } from '../utils/qrDownload';

export default function OverviewTab() {
  const [activeService, setActiveService] = useState(null);
  const [draftServices, setDraftServices] = useState([]);
  const [recentServices, setRecentServices] = useState([]); 
  const [qrService, setQrService] = useState(null);
  
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDate, setNewServiceDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const qrRef = useRef(null);

  const fetchServices = async () => {
    try {
      const res = await secureFetch('/api/services');
      if (res.ok) {
        const data = await res.json();
        
        if (!Array.isArray(data)) {
          console.warn("Backend returned non-array data:", data);
          return; 
        }

        // 1. ACTIVE BUCKET
        const active = data.find(s => s.is_active === true);
        if (active) {
          setActiveService({
            id: active.id,
            name: active.title,
            date: active.service_date,
            status: 'active',
            checkIns: active.attendance_count || 0,
            startTime: new Date(active.time_started).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        } else {
          setActiveService(null);
        }

        // 2. DRAFT/PENDING BUCKET
        const drafts = data.filter(s => s.is_active === false && !s.time_started);
        setDraftServices(drafts.map(s => ({
          id: s.id,
          name: s.title,
          date: s.service_date,
          status: 'draft'
        })));

        // 3. RECENT/CLOSED BUCKET
        const recents = data
          .filter(s => s.is_active === false && s.time_started)
          .sort((a, b) => new Date(b.time_closed || b.time_started || b.service_date) - new Date(a.time_closed || a.time_started || a.service_date))
          .slice(0, 5); 
          
        setRecentServices(recents.map(s => ({
          id: s.id,
          name: s.title,
          date: s.service_date,
          checkIns: s.attendance_count || 0
        })));
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchServices();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleCreateDraft = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await secureFetch('/api/services/create', {
        method: 'POST',
        body: JSON.stringify({ title: newServiceName, service_date: newServiceDate })
      });
      if (res.ok) {
        const createdService = await res.json();
        setNewServiceName('');
        setNewServiceDate('');
        setQrService(createdService);
        await fetchServices(); 
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Failed to create service.");
      }
    } catch {
      alert("Network Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateService = async (serviceId) => {
    if (activeService) {
      alert("You must end the current active service before starting a new one.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await secureFetch(`/api/services/${serviceId}/activate`, { method: 'PATCH' });
      if (res.ok) {
        setQrService(null); // <-- FIX: This clears the QR code banner immediately
        await fetchServices(); 
      } else {
        alert("Failed to activate service.");
      }
    } catch {
      alert("Network Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDraft = async (serviceId) => {
    if (!window.confirm("Are you sure you want to delete this scheduled service?")) return;
    setIsLoading(true);
    try {
      const res = await secureFetch(`/api/services/${serviceId}`, { method: 'DELETE' });
      if (res.ok) await fetchServices(); 
      else {
        const err = await res.json();
        alert(err.detail || "Failed to delete service.");
      }
    } catch {
      alert("Network Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadServiceQr = () => {
    const svgElement = qrRef.current?.querySelector('svg');
    if (!svgElement) return;

    void downloadQrAsA4Jpg(svgElement, `HORYC-SERVICE-${qrService?.id || 'qr'}.jpg`, {
      width: 2480,
      height: 3508,
      padding: 0.38,
    });
  };

  const handleEndService = async () => {
    if (!window.confirm("Are you sure you want to close this service? Ushers will no longer be able to scan QR codes.")) return;
    if (!activeService) return;
    setIsLoading(true);
    try {
      const res = await secureFetch(`/api/services/${activeService.id}/deactivate`, { method: 'PATCH' });
      if (res.ok) await fetchServices(); 
      else alert("Failed to close service.");
    } catch {
      alert("Network Error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* QR CODE BANNER */}
      {qrService && (
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 md:p-8 border border-slate-700 shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-top-2">
          
          {/* Close Button */}
          <button 
            onClick={() => setQrService(null)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            title="Close QR View"
          >
            <X size={16} />
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pr-8">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <QrCode size={18} />
                <span className="text-sm font-semibold uppercase tracking-wider">Service QR Pass</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold">{qrService.title}</h3>
              <p className="text-slate-300 text-xs sm:text-sm mt-1">Share this QR so members can self-check in for this service.</p>
            </div>

            <button
              onClick={handleDownloadServiceQr}
              className="flex items-center justify-center p-2.5 rounded-xl bg-emerald-500 text-emerald-950 font-bold hover:bg-emerald-400 transition-colors shrink-0"
              title="Download service QR"
            >
              <QrCode size={18} />
            </button>
          </div>

          <div ref={qrRef} className="w-fit bg-white p-4 rounded-2xl mx-auto sm:mx-0">
            <QRCodeSVG
              value={String(qrService.id)}
              size={200}
              bgColor="#ffffff"
              fgColor="#0f172a"
              level="H"
              includeMargin={false}
            />
          </div>

          <p className="mt-4 text-[10px] sm:text-xs text-slate-400 font-mono break-all text-center sm:text-left">{String(qrService.id)}</p>
        </div>
      )}
      
      {/* SECTION 1: THE MASTER CONTROL (ACTIVE SERVICE) */}
      <div className={`p-5 sm:p-6 md:p-8 rounded-3xl border-2 transition-all duration-500 ${
        activeService 
          ? 'bg-emerald-50 border-emerald-400 shadow-lg shadow-emerald-500/10' 
          : 'bg-slate-50 border-slate-200 border-dashed'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="relative flex h-4 w-4 shrink-0">
                {activeService && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-4 w-4 ${activeService ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-800">
                {activeService ? 'Service Open' : 'Service Closed'}
              </h3>
            </div>
            <p className="text-slate-600 text-sm sm:text-base">
              {activeService 
                ? `Currently logging attendance for: ${activeService.name}`
                : 'No active service. Ushers and Members cannot check in right now.'}
            </p>
          </div>

          {activeService && (
            <button 
              onClick={handleEndService}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 w-full md:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50"
            >
              <Power size={20} />
              End Service
            </button>
          )}
        </div>

        {activeService && (
          /* FIX: grid-cols-1 on mobile so cards stack instead of overflowing horizontally */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-emerald-200/60">
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl flex items-center gap-4 border border-emerald-100">
              <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl shrink-0">
                <Users size={24} />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs sm:text-sm text-emerald-800 font-medium truncate">Total Checked In</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-950 truncate">{activeService.checkIns}</p>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl flex items-center gap-4 border border-emerald-100">
              <div className="bg-blue-100 text-brand-blue p-3 rounded-xl shrink-0">
                <Clock size={24} />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs sm:text-sm text-blue-800 font-medium truncate">Started At</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-950 truncate">{activeService.startTime}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* SECTION 2: PENDING SERVICES POOL */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6 text-brand-dark">
            <Calendar size={24} className="text-brand-blue shrink-0" />
            <h3 className="font-display text-lg font-bold">Pending Services</h3>
          </div>
          
          <div className="space-y-3 flex-1">
            {draftServices.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center border-2 border-dashed border-slate-100 rounded-xl">No pending services drafted.</p>
            ) : (
              draftServices.map(service => (
                <div key={service.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:border-slate-300 transition-colors gap-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm sm:text-base">{service.name}</h4>
                    <p className="text-xs sm:text-sm text-slate-500">{new Date(service.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      onClick={() => setQrService({ id: service.id, title: service.name })}
                      className="p-2 sm:p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Show QR code"
                    >
                      <QrCode size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                    <button 
                      onClick={() => handleDeleteDraft(service.id)}
                      disabled={isLoading}
                      className="p-2 sm:p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Service"
                    >
                      <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                    <button 
                      onClick={() => handleActivateService(service.id)}
                      disabled={activeService !== null || isLoading}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                        activeService 
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                          : 'bg-brand-blue text-white hover:bg-blue-600 shadow-md shadow-blue-500/20'
                      }`}
                    >
                      <Play size={14} fill="currentColor" className="sm:w-[16px] sm:h-[16px]" />
                      Activate
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* RECENT HISTORICAL SERVICES */}
          {recentServices.length > 0 && (
            <div className="mt-6 sm:mt-8 pt-6 border-t border-slate-100">
               <div className="flex items-center gap-2 mb-4 text-slate-500">
                <History size={16} className="sm:w-[18px] sm:h-[18px]" />
                <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider">Recently Closed</h4>
              </div>
              <div className="space-y-2">
                {recentServices.map(service => (
                  <div key={service.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="overflow-hidden pr-2">
                      <p className="font-bold text-slate-700 text-xs sm:text-sm truncate">{service.name}</p>
                      <p className="text-[10px] sm:text-xs text-slate-400">{new Date(service.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-200 shrink-0">
                      <Users size={12} className="text-brand-blue sm:w-[14px] sm:h-[14px]" />
                      <span className="text-xs sm:text-sm font-bold text-slate-700">{service.checkIns}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: DRAFT NEW SERVICE FORM */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm h-fit">
          <div className="flex items-center gap-3 mb-6 text-brand-dark">
            <CalendarPlus size={24} className="text-brand-blue shrink-0" />
            <h3 className="font-display text-lg font-bold">Draft New Service</h3>
          </div>
          
          <form onSubmit={handleCreateDraft} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Service Name</label>
              <input 
                type="text" 
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="e.g., Youth Convention Day 1"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all text-sm sm:text-base"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Scheduled Date</label>
              <input 
                type="date" 
                value={newServiceDate}
                onChange={(e) => setNewServiceDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all text-sm sm:text-base"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-800 text-white py-3 sm:py-3.5 rounded-xl font-medium hover:bg-slate-900 transition-colors disabled:opacity-50 mt-2 text-sm sm:text-base"
            >
              Save to Pending
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}