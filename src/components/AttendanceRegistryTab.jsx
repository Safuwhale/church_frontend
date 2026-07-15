import { useEffect, useMemo, useState } from 'react';
import { secureFetch } from '../api/api';
import { BookOpen, Download, Calendar, Users, ArrowUpRight, RefreshCw, X, Trash2, Search, ChevronLeft, ChevronRight, FileText, FileSpreadsheet } from 'lucide-react';
import AttendanceDots from './AttendanceDots';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AttendanceRegistryTab() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedServiceDetail, setSelectedServiceDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [viewMode, setViewMode] = useState('attendees'); 

  // Pagination State for the Modal
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

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
    setViewMode('attendees'); 
    setAttendeeSearch('');
    setCurrentPage(1);
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

  // Reset pagination when switching tabs or typing in search
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, attendeeSearch]);

  const totalCheckIns = services.reduce((sum, service) => sum + (service.attendance_count || 0), 0);
  const averageAttendance = services.length ? Math.round(totalCheckIns / services.length) : 0;
  
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

  // Determine current active list for pagination
  const currentList = viewMode === 'attendees' ? filteredAttendees : filteredAbsentees;
  const totalPages = Math.ceil(currentList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return currentList.slice(start, start + pageSize);
  }, [currentList, currentPage, pageSize]);

  // Format attendance streak for exports to save space (e.g., "✓ ✗ ✓ -")
  const formatStreakText = (history) => {
    return (history || []).map(status => {
      if (status === 'attended') return 'Present';
      if (status === 'absent') return 'Absent';
      return '-';
    }).join(' | ');
  };

  // SMART FRONTEND CSV EXPORT
  const handleExportCSV = () => {
    if (!selectedService || currentList.length === 0) {
      alert(`No ${viewMode} to export.`);
      return;
    }

    const headers = viewMode === 'attendees' 
      ? ['Name', 'Serial Number', 'Phone', 'Check-in Time', 'Method']
      : ['Name', 'Serial Number', 'Phone', 'Location', 'Attendance Streak (Last 7)'];

    const csvRows = [headers.join(',')];
    currentList.forEach(person => {
      const row = viewMode === 'attendees' 
        ? [
            `"${person.first_name} ${person.last_name}"`,
            `"${person.serial_number}"`,
            `"${person.phone_number}"`,
            `"${new Date(person.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}"`,
            `"${person.check_in_method}"`
          ]
        : [
            `"${person.first_name} ${person.last_name}"`,
            `"${person.serial_number}"`,
            `"${person.phone_number}"`,
            `"${person.location_zone || 'N/A'}"`,
            `"${formatStreakText(person.attendance_history)}"` 
          ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const safeTitle = selectedService.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const capitalizeMode = viewMode.charAt(0).toUpperCase() + viewMode.slice(1);
    link.download = `${capitalizeMode}-${safeTitle}-${selectedService.service_date}.csv`;
    
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  // SMART FRONTEND PDF EXPORT
  const handleExportPDF = () => {
    if (!selectedService || currentList.length === 0) {
      alert(`No ${viewMode} to export.`);
      return;
    }

    const doc = new jsPDF();
    const capitalizeMode = viewMode.charAt(0).toUpperCase() + viewMode.slice(1);
    const safeTitle = selectedService.title;

    // Document Header
    doc.setFontSize(16);
    doc.text(`HORYC ${capitalizeMode} - ${safeTitle}`, 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Service Date: ${selectedService.service_date}`, 14, 22);

    // Table Setup
    const head = viewMode === 'attendees' 
      ? [['Name', 'Serial Number', 'Phone', 'Check-in Time', 'Method']]
      : [['Name', 'Serial Number', 'Phone', 'Location', 'Attendance Streak']];

    const body = currentList.map(person => {
      if (viewMode === 'attendees') {
        return [
          `${person.first_name} ${person.last_name}`,
          person.serial_number,
          person.phone_number,
          new Date(person.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          person.check_in_method
        ];
      } else {
        return [
          `${person.first_name} ${person.last_name}`,
          person.serial_number,
          person.phone_number,
          person.location_zone || 'N/A',
          formatStreakText(person.attendance_history)
        ];
      }
    });

    // Generate Table
    autoTable(doc, {
      startY: 28,
      head: head,
      body: body,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] } // Matches Tailwind slate-900
    });

    // Save PDF
    const fileTitle = `${capitalizeMode}-${safeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${selectedService.service_date}.pdf`;
    doc.save(fileTitle);
  };

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
      }
    } catch (error) {
      console.error('Delete service error:', error);
      alert('Network Error while deleting service.');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* SECTION 1: Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-800">Attendance Registry</h3>
          <p className="text-slate-500 text-sm mt-1">Track service attendance across all members.</p>
        </div>

        <button
          onClick={fetchServices}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-2.5 px-5 rounded-xl font-medium hover:bg-slate-200 transition-colors border border-slate-200 disabled:opacity-60"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {/* SECTION 2: Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Total Services</p>
            <p className="text-2xl font-bold text-slate-800">{services.length}</p>
          </div>
          <div className="bg-blue-50 text-brand-blue p-2.5 rounded-lg shrink-0">
            <BookOpen size={20} />
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Average Attendance</p>
            <p className="text-2xl font-bold text-slate-800">{averageAttendance}</p>
          </div>
          <div className="bg-purple-50 text-purple-600 p-2.5 rounded-lg shrink-0">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Total Check-ins</p>
            <p className="text-2xl font-bold text-slate-800">{totalCheckIns}</p>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg shrink-0">
            <ArrowUpRight size={20} />
          </div>
        </div>
      </div>

      {/* SECTION 3: Service Ledger */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h4 className="font-semibold text-slate-700">Service Ledger</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px] whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-5 sm:px-6 py-4 font-semibold">Service Name</th>
                <th className="px-5 sm:px-6 py-4 font-semibold">Date</th>
                <th className="px-5 sm:px-6 py-4 font-semibold text-center">Total Check-ins</th>
                <th className="px-5 sm:px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-5 sm:px-6 py-4 font-semibold text-center">Action</th>
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
                  <td className="px-5 sm:px-6 py-4">
                    <span className="font-bold text-slate-700">{service.title}</span>
                  </td>
                  <td className="px-5 sm:px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Calendar size={14} />
                      {new Date(service.service_date).toLocaleDateString('en-US', { 
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                      })}
                    </div>
                  </td>
                  <td className="px-5 sm:px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center bg-blue-50 text-brand-blue font-bold px-3 py-1 rounded-md text-sm">
                      {service.attendance_count || 0}
                    </span>
                  </td>
                  <td className="px-5 sm:px-6 py-4 text-center text-slate-600 text-sm font-medium">
                    {service.is_active ? (
                       <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs">Active</span>
                    ) : (
                       <span className="text-slate-500 bg-slate-100 px-2 py-1 rounded-md text-xs">Closed</span>
                    )}
                  </td>
                  <td className="px-5 sm:px-6 py-4 text-center">
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
                  <td colSpan="5" className="px-5 py-10 text-center text-slate-500">
                    No completed services found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SERVICE DETAILS MODAL (Mobile Optimized) */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50 shrink-0">
              <div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-800 line-clamp-1">{selectedService.title}</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {new Date(selectedService.service_date).toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedService(null);
                  setSelectedServiceDetail(null);
                }}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              
              {/* TOP STATS CARDS - Trimmed Down with break-all for Service ID */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100">
                  <p className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 font-semibold">Status</p>
                  <p className="text-base sm:text-lg font-bold text-slate-800 mt-1">{selectedService.is_active ? 'Active' : 'Closed'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100">
                  <p className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 font-semibold">Service ID</p>
                  <p className="text-[10px] sm:text-[13px] font-mono text-slate-700 mt-1 break-all leading-tight">
                    {selectedService.id}
                  </p>
                </div>
              </div>

              {/* TABLE CONTAINER */}
              <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  
                  {/* TOGGLE SWITCH */}
                  <div className="flex p-1 bg-slate-200/60 rounded-xl w-full sm:w-auto shrink-0">
                    <button 
                      onClick={() => setViewMode('attendees')}
                      className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${viewMode === 'attendees' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Attendees ({selectedServiceDetail?.attendees?.length || 0})
                    </button>
                    <button 
                      onClick={() => setViewMode('absentees')}
                      className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${viewMode === 'absentees' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Absentees ({selectedServiceDetail?.absentees?.length || 0})
                    </button>
                  </div>

                  {/* SEARCH & EXPORTS */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none min-w-[200px]">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={attendeeSearch}
                        onChange={(event) => setAttendeeSearch(event.target.value)}
                        placeholder={`Search ${viewMode}...`}
                        className="w-full pl-9 pr-3 py-2.5 sm:py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white"
                      />
                    </div>
                    
                    {/* DUAL EXPORT BUTTONS */}
                    <div className="flex gap-2 w-full sm:w-auto shrink-0">
                      <button
                        onClick={handleExportCSV}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-slate-800 text-white py-2.5 sm:py-2 px-3 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-700 transition-colors shadow-sm"
                      >
                        <FileSpreadsheet size={16} /> CSV
                      </button>
                      <button
                        onClick={handleExportPDF}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-brand-blue text-white py-2.5 sm:py-2 px-3 rounded-xl text-xs sm:text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
                      >
                        <FileText size={16} /> PDF
                      </button>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC TABLE */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="px-5 py-3 font-semibold">Name</th>
                        <th className="px-5 py-3 font-semibold">Serial</th>
                        <th className="px-5 py-3 font-semibold">Phone</th>
                        
                        {viewMode === 'attendees' ? (
                          <>
                            <th className="px-5 py-3 font-semibold">Check-in Time</th>
                            <th className="px-5 py-3 font-semibold">Method</th>
                          </>
                        ) : (
                          <>
                            <th className="px-5 py-3 font-semibold">Location</th>
                            <th className="px-5 py-3 font-semibold text-right">Attendance Streak</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      
                      {viewMode === 'attendees' && paginatedList.map((person) => (
                        <tr key={person.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-3 sm:py-4 font-bold text-slate-800 text-sm sm:text-base">{person.first_name} {person.last_name}</td>
                          <td className="px-5 py-3 sm:py-4 font-mono text-[11px] sm:text-xs font-bold text-brand-blue bg-brand-light px-2 py-1 rounded w-max inline-block mt-1 sm:mt-2 border border-blue-100">{person.serial_number}</td>
                          <td className="px-5 py-3 sm:py-4 text-xs sm:text-sm text-slate-600 font-medium">{person.phone_number}</td>
                          <td className="px-5 py-3 sm:py-4 text-xs sm:text-sm text-slate-600">{new Date(person.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-5 py-3 sm:py-4 text-xs sm:text-sm text-slate-600">{person.check_in_method}</td>
                        </tr>
                      ))}

                      {viewMode === 'absentees' && paginatedList.map((person) => (
                        <tr key={person.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-3 sm:py-4 font-bold text-slate-800 text-sm sm:text-base">{person.first_name} {person.last_name}</td>
                          <td className="px-5 py-3 sm:py-4 font-mono text-[11px] sm:text-xs font-bold text-brand-blue bg-brand-light px-2 py-1 rounded w-max inline-block mt-1 sm:mt-2 border border-blue-100">{person.serial_number}</td>
                          <td className="px-5 py-3 sm:py-4 text-xs sm:text-sm text-slate-600 font-medium">{person.phone_number}</td>
                          <td className="px-5 py-3 sm:py-4 text-xs sm:text-sm text-slate-600">{person.location_zone || 'N/A'}</td>
                          <td className="px-5 py-3 sm:py-4 flex justify-end items-center">
                            <AttendanceDots history={person.attendance_history || []} />
                          </td>
                        </tr>
                      ))}

                      {!detailLoading && paginatedList.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-5 py-10 text-center text-slate-500">
                            {viewMode === 'attendees' ? 'No attendees match your search.' : 'No absentees found.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION CONTROLS (Modal) */}
                {paginatedList.length > 0 && (
                  <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-2 text-xs sm:text-sm text-slate-500">
                      <span>Show</span>
                      <select 
                        value={pageSize} 
                        onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-blue"
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span>per page</span>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 text-xs sm:text-sm">
                      <span className="text-slate-500">
                        Page <span className="font-semibold text-slate-800">{currentPage}</span> of <span className="font-semibold text-slate-800">{totalPages}</span>
                      </span>
                      <div className="flex gap-1">
                        <button 
                          disabled={currentPage === 1} 
                          onClick={() => setCurrentPage(prev => prev - 1)}
                          className="p-1.5 sm:p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button 
                          disabled={currentPage === totalPages} 
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          className="p-1.5 sm:p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}