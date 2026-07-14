import { useEffect, useState } from 'react';
import { secureFetch } from '../api/api';
import { BookOpen, Download, Calendar, Users, ArrowUpRight, RefreshCw, X, Trash2, Search } from 'lucide-react';
import AttendanceDots from './AttendanceDots'; // Ensure this is imported!

export default function AttendanceRegistryTab() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedServiceDetail, setSelectedServiceDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [viewMode, setViewMode] = useState('attendees'); // Toggle state: 'attendees' | 'absentees'

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const response = await secureFetch('/api/services/');

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to load service attendance data.');
        return;
      }

      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Attendance registry load error:', error);
      alert('Network Error while loading attendance data.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServiceDetail = async (serviceId) => {
    setDetailLoading(true);
    setViewMode('attendees'); // Reset toggle when opening a new service
    try {
      const response = await secureFetch(`/api/attendance/services/${serviceId}`);
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to load service details.');
        return;
      }

      setSelectedServiceDetail(await response.json());
    } catch (error) {
      console.error('Service detail load error:', error);
      alert('Network Error while loading service details.');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    void fetchServices();
  }, []);

  const handleExportCSV = async () => {
    if (!selectedService) return;
    try {
      const response = await secureFetch(`/api/attendance/export?service_id=${selectedService.id}`);

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to export attendance data.');
        return;
      }

      const csvBlob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(csvBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `${selectedService.title}-attendance.csv`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Export error:', error);
      alert('Network Error while exporting attendance data.');
    }
  };

  const totalCheckIns = services.reduce((sum, service) => sum + (service.attendance_count || 0), 0);
  const averageAttendance = services.length ? Math.round(totalCheckIns / services.length) : 0;
  
  // Search Filters for both lists
  const filterList = (list) => {
    const query = attendeeSearch.trim().toLowerCase();
    if (!query) return list || [];
    return (list || []).filter((person) => 
      [person.first_name, person.last_name, person.serial_number, person.phone_number]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  };

  const filteredAttendees = filterList(selectedServiceDetail?.attendees);
  const filteredAbsentees = filterList(selectedServiceDetail?.absentees);

  const handleDeleteService = async (service) => {
    if (!window.confirm(`Delete ${service.title}? This cannot be undone.`)) return;

    try {
      const response = await secureFetch(`/api/services/${service.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to delete service.');
        return;
      }

      await fetchServices();
      if (selectedService?.id === service.id) {
        setSelectedService(null);
        setSelectedServiceDetail(null);
        setAttendeeSearch('');
      }
    } catch (error) {
      console.error('Delete service error:', error);
      alert('Network Error while deleting service.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: Header & Export Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-bold text-slate-800">Attendance Registry</h3>
          <p className="text-slate-500 text-sm">Track service attendance.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchServices}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-2.5 px-5 rounded-xl font-medium hover:bg-slate-200 transition-colors border border-slate-200 disabled:opacity-60"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* SECTION 2: Impact Tracking Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Total Services</p>
            <p className="text-2xl font-bold text-slate-800">{services.length}</p>
          </div>
          <div className="bg-blue-50 text-brand-blue p-2.5 rounded-lg">
            <BookOpen size={20} />
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Average Attendance</p>
            <p className="text-2xl font-bold text-slate-800">{averageAttendance}</p>
          </div>
          <div className="bg-purple-50 text-purple-600 p-2.5 rounded-lg">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Total Check-ins</p>
            <p className="text-2xl font-bold text-slate-800">{totalCheckIns}</p>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg">
            <ArrowUpRight size={20} />
          </div>
        </div>
      </div>

      {/* SECTION 3: Service Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h4 className="font-semibold text-slate-700">Service Ledger</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-sm">
                <th className="px-6 py-3 font-medium">Service Name</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium text-center">Total Check-ins</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="px-6 py-3 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((service) => (
                <tr
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    void fetchServiceDetail(service.id);
                  }}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-700">{service.title}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Calendar size={14} />
                      {new Date(service.service_date).toLocaleDateString('en-US', { 
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center bg-blue-50 text-brand-blue font-bold px-3 py-1 rounded-full text-sm">
                      {service.attendance_count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600 text-sm">
                    {service.is_active ? 'Active' : 'Closed'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleDeleteService(service);
                      }}
                      className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete service"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {services.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                    No completed services found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SERVICE DETAILS MODAL */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-bold text-slate-800">{selectedService.title}</h3>
                <p className="text-sm text-slate-500">
                  {new Date(selectedService.service_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedService(null);
                  setSelectedServiceDetail(null);
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* TOP STATS CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Status</p>
                  <p className="text-lg font-bold text-slate-800 mt-1">{selectedService.is_active ? 'Active' : 'Closed'}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Check-ins</p>
                  <p className="text-lg font-bold text-slate-800 mt-1">{selectedService.attendance_count || 0}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Service Date</p>
                  <p className="text-lg font-bold text-slate-800 mt-1">{selectedService.service_date}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Service ID</p>
                  <p className="text-sm font-mono text-slate-700 mt-1 break-all">{selectedService.id}</p>
                </div>
              </div>

              {/* TABLE CONTAINER */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  
                  {/* TOGGLE SWITCH */}
                  <div className="flex p-1 bg-slate-200/60 rounded-xl">
                    <button 
                      onClick={() => setViewMode('attendees')}
                      className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'attendees' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Attendees ({selectedServiceDetail?.attendees?.length || 0})
                    </button>
                    <button 
                      onClick={() => setViewMode('absentees')}
                      className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'absentees' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Absentees ({selectedServiceDetail?.absentees?.length || 0})
                    </button>
                  </div>

                  {/* SEARCH & EXPORT */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={attendeeSearch}
                        onChange={(event) => setAttendeeSearch(event.target.value)}
                        placeholder="Search members"
                        className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      />
                    </div>
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-2 px-4 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors border border-emerald-200"
                    >
                      <Download size={16} />
                      Export CSV
                    </button>
                  </div>
                </div>

                {/* DYNAMIC TABLE */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-sm">
                        <th className="px-5 py-3 font-medium">Name</th>
                        <th className="px-5 py-3 font-medium">Serial</th>
                        <th className="px-5 py-3 font-medium">Phone</th>
                        
                        {viewMode === 'attendees' ? (
                          <>
                            <th className="px-5 py-3 font-medium">Check-in Time</th>
                            <th className="px-5 py-3 font-medium">Method</th>
                          </>
                        ) : (
                          <>
                            <th className="px-5 py-3 font-medium">Location</th>
                            <th className="px-5 py-3 font-medium text-right">Attendance Streak</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      
                      {/* ATTENDEES VIEW */}
                      {viewMode === 'attendees' && filteredAttendees.map((person) => (
                        <tr key={person.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4 font-bold text-slate-800">{person.first_name} {person.last_name}</td>
                          <td className="px-5 py-4 font-mono text-xs font-bold text-brand-blue bg-brand-light px-2 rounded w-max inline-block mt-3">{person.serial_number}</td>
                          <td className="px-5 py-4 text-sm text-slate-600 font-medium">{person.phone_number}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">{new Date(person.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">{person.check_in_method}</td>
                        </tr>
                      ))}

                      {/* ABSENTEES VIEW */}
                      {viewMode === 'absentees' && filteredAbsentees.map((person) => (
                        <tr key={person.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4 font-bold text-slate-800">{person.first_name} {person.last_name}</td>
                          <td className="px-5 py-4 font-mono text-xs font-bold text-brand-blue bg-brand-light px-2 rounded w-max inline-block mt-3">{person.serial_number}</td>
                          <td className="px-5 py-4 text-sm text-slate-600 font-medium">{person.phone_number}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">{person.location_zone || 'N/A'}</td>
                          <td className="px-5 py-4 flex justify-end items-center">
                            <AttendanceDots history={person.attendance_history || []} />
                          </td>
                        </tr>
                      ))}

                      {/* EMPTY STATES */}
                      {!detailLoading && viewMode === 'attendees' && filteredAttendees.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-5 py-10 text-center text-slate-500">No members match your search in the attendee list.</td>
                        </tr>
                      )}
                      {!detailLoading && viewMode === 'absentees' && filteredAbsentees.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-5 py-10 text-center text-slate-500">No absentees found for this service.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}