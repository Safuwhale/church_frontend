import { useEffect, useMemo, useState } from 'react';
import { Search, Shield, User, Phone, RefreshCw, ChevronLeft, ChevronRight, MapPin, HeartPulse, X } from 'lucide-react';
import { secureFetch } from '../api/api';
import AttendanceDots from './AttendanceDots';

export default function DirectoryTab() {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  
  // Modal State
  const [selectedMember, setSelectedMember] = useState(null);

  const fetchMembers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const endpoint = searchTerm.trim()
        ? `/api/users/directory?q=${encodeURIComponent(searchTerm.trim())}`
        : '/api/users/directory';

      const response = await secureFetch(endpoint);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to load directory');
      }

      const data = await response.json();
      setMembers(data);
      setCurrentPage(1); // Reset to page 1 on new fetch/search
    } catch (err) {
      console.error('Directory load error:', err);
      setError(err.message || 'Failed to load directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchMembers();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Pagination Logic
  const filteredMembers = useMemo(() => members, [members]);
  const totalPages = Math.ceil(filteredMembers.length / pageSize);
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  return (
    <div className="space-y-6 relative">
      
      {/* SECTION 1: Search and Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-bold text-slate-800">Members Directory</h3>
          <p className="text-slate-500 text-sm">Manage {filteredMembers.length} members from the live database.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search directory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all bg-white"
            />
          </div>

          <button
            onClick={fetchMembers}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-60"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SECTION 2: Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold text-xs">Member</th>
                <th className="px-6 py-4 font-semibold text-xs">HORYC ID</th>
                <th className="px-6 py-4 font-semibold text-xs">Gender</th>
                <th className="px-6 py-4 font-semibold text-xs">Role</th>
                <th className="px-6 py-4 font-semibold text-xs text-right">Attendance Streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedMembers.map((member) => (
                <tr 
                  key={member.id} 
                  onClick={() => setSelectedMember(member)}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  
                  {/* Name & Photo Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {member.profile_photo_url ? (
                        <img src={member.profile_photo_url} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          member.role === 'hod' || member.role === 'admin' ? 'bg-emerald-100 text-emerald-700' :
                          member.role === 'leader' ? 'bg-purple-100 text-purple-700' :
                          member.role === 'usher' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-800">{member.first_name} {member.last_name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Phone size={10}/>{member.phone_number}</p>
                      </div>
                    </div>
                  </td>

                  {/* ID Column */}
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-brand-blue bg-brand-light border border-blue-100 px-2 py-1 rounded-md">
                      {member.serial_number}
                    </span>
                  </td>

                  {/* Gender Column */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{member.sex || '-'}</span>
                  </td>

                  {/* Role Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {member.role === 'leader' && <Shield size={14} className="text-purple-600" />}
                      {member.role === 'usher' && <User size={14} className="text-blue-600" />}
                      {member.role === 'member' && <User size={14} className="text-slate-400" />}
                      <span className="capitalize text-sm font-medium text-slate-700">{member.role}</span>
                    </div>
                  </td>

                  {/* Streak Column */}
                  <td className="px-6 py-4 flex justify-end">
                    <AttendanceDots history={member.attendance_history || []} />
                  </td>

                </tr>
              ))}
              
              {paginatedMembers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                    {isLoading ? 'Loading directory...' : 'No members found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Show</span>
            <select 
              value={pageSize} 
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-brand-blue"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>per page</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500">
              Page <span className="font-semibold text-slate-800">{currentPage}</span> of <span className="font-semibold text-slate-800">{totalPages || 1}</span>
            </span>
            <div className="flex gap-1">
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                disabled={currentPage === totalPages || totalPages === 0} 
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MEMBER DETAILS MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800">Member Profile</h3>
              <button 
                onClick={() => setSelectedMember(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 md:p-8">
              {/* Profile Top Section */}
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-8">
                <div className="w-32 h-32 rounded-full flex-shrink-0 bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                  {selectedMember.profile_photo_url ? (
                    <img src={selectedMember.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-display font-bold text-slate-400">
                      {selectedMember.first_name.charAt(0)}{selectedMember.last_name.charAt(0)}
                    </span>
                  )}
                </div>
                
                <div className="text-center sm:text-left flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2 justify-center sm:justify-start">
                    <h2 className="text-2xl font-display font-bold text-slate-800">{selectedMember.first_name} {selectedMember.last_name}</h2>
                    <span className="capitalize text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 w-max mx-auto sm:mx-0">
                      {selectedMember.role}
                    </span>
                  </div>
                  <p className="font-mono text-sm font-bold text-brand-blue bg-brand-light px-3 py-1 rounded-lg w-max mx-auto sm:mx-0 border border-blue-100 mb-4">
                    {selectedMember.serial_number}
                  </p>
                  
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-2">
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Attendance Activity</p>
                    <AttendanceDots history={selectedMember.attendance_history || []} />
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex gap-3">
                  <Phone className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Phone Number</p>
                    <p className="font-semibold text-slate-800">{selectedMember.phone_number}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex gap-3">
                  <User className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Gender</p>
                    <p className="font-semibold text-slate-800">{selectedMember.sex || 'Not specified'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex gap-3">
                  <Shield className="text-purple-400 mt-0.5" size={18} />
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Cell Group</p>
                    <p className="font-semibold text-slate-800">{selectedMember.cell_group_name}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex gap-3">
                  <MapPin className="text-emerald-500 mt-0.5" size={18} />
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Location Zone</p>
                    <p className="font-semibold text-slate-800">{selectedMember.location_zone || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="mt-4 p-4 rounded-2xl border border-rose-100 bg-rose-50 flex gap-3">
                <HeartPulse className="text-rose-500 mt-0.5" size={18} />
                <div>
                  <p className="text-xs text-rose-500 font-bold uppercase tracking-wider mb-1">Emergency Contact</p>
                  {selectedMember.contact_person_name ? (
                    <p className="font-semibold text-slate-800 text-sm">
                      {selectedMember.contact_person_name} 
                      {selectedMember.contact_person_phone && ` • ${selectedMember.contact_person_phone}`}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No emergency contact provided.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}