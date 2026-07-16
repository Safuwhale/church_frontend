import { useEffect, useMemo, useState } from 'react';
import { Search, Shield, User, Phone, RefreshCw, ChevronLeft, ChevronRight, MapPin, HeartPulse, X, ZoomIn, XCircle } from 'lucide-react';
import { secureFetch } from '../api/api';
import AttendanceDots from './AttendanceDots';

const ROLE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'member', label: 'Members' },
  { id: 'leader', label: 'Leaders' },
  { id: 'usher', label: 'Ushers' },
  { id: 'admin', label: 'HOD / Admin' },
];

const roleBadgeStyles = (role) => {
  if (role === 'hod' || role === 'admin') return 'bg-emerald-100 text-emerald-700';
  if (role === 'leader') return 'bg-purple-100 text-purple-700';
  if (role === 'usher') return 'bg-blue-100 text-blue-700';
  return 'bg-slate-100 text-slate-600';
};

export default function DirectoryTab() {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Modal State
  const [selectedMember, setSelectedMember] = useState(null);
  const [isPhotoExpanded, setIsPhotoExpanded] = useState(false);

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
      setCurrentPage(1);
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

  // Opens a member's detail modal, always starting with the photo collapsed.
  const openMember = (member) => {
    setIsPhotoExpanded(false);
    setSelectedMember(member);
  };

  const closeModal = () => {
    setSelectedMember(null);
    setIsPhotoExpanded(false);
  };

  const setRole = (id) => {
    setRoleFilter(id);
    setCurrentPage(1);
  };

  // Pagination Logic — role filter narrows the already-fetched/searched set client-side.
  const filteredMembers = useMemo(() => {
    if (roleFilter === 'all') return members;
    if (roleFilter === 'admin') return members.filter((m) => m.role === 'hod' || m.role === 'admin');
    return members.filter((m) => m.role === roleFilter);
  }, [members, roleFilter]);

  const totalPages = Math.ceil(filteredMembers.length / pageSize);
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  return (
    <div className="space-y-4 sm:space-y-6 relative">

      {/* SECTION 1: Search and Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-800">Members Directory</h3>
          <p className="text-slate-500 text-sm mt-1">Managing {filteredMembers.length} members from the live database.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search directory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-3 sm:py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all bg-white text-sm sm:text-base"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <XCircle size={16} />
              </button>
            )}
          </div>

          <button
            onClick={fetchMembers}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-60"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span className="font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* ROLE FILTER CHIPS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
        {ROLE_FILTERS.map((r) => (
          <button
            key={r.id}
            onClick={() => setRole(r.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
              roleFilter === r.id
                ? 'bg-brand-blue text-white border-brand-blue shadow-sm shadow-brand-blue/20'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl sm:rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SECTION 2: Data Table */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Mobile Scroll Wrapper */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-4 sm:px-6 py-4 font-semibold">Member</th>
                <th className="px-4 sm:px-6 py-4 font-semibold">HORYC ID</th>
                <th className="px-4 sm:px-6 py-4 font-semibold">Gender</th>
                <th className="px-4 sm:px-6 py-4 font-semibold">Role</th>
                <th className="px-4 sm:px-6 py-4 font-semibold text-right">Attendance Streak</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedMembers.map((member) => (
                <tr
                  key={member.id}
                  onClick={() => openMember(member)}
                  className="group hover:bg-slate-50/70 transition-colors cursor-pointer"
                >

                  {/* Name & Photo Column */}
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-3">
                      {member.profile_photo_url ? (
                        <img src={member.profile_photo_url} alt="Profile" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-200 flex-shrink-0" />
                      ) : (
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs sm:text-sm ${roleBadgeStyles(member.role)}`}>
                          {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-800 text-sm sm:text-base">{member.first_name} {member.last_name}</p>
                        <p className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Phone size={10} />{member.phone_number}</p>
                      </div>
                    </div>
                  </td>

                  {/* ID Column */}
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className="font-mono text-xs font-bold text-brand-blue bg-brand-light border border-blue-100 px-2 py-1 rounded-md">
                      {member.serial_number}
                    </span>
                  </td>

                  {/* Gender Column */}
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className="text-sm text-slate-600">{member.sex || '-'}</span>
                  </td>

                  {/* Role Column */}
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-1.5">
                      {member.role === 'leader' && <Shield size={14} className="text-purple-600" />}
                      {member.role === 'usher' && <User size={14} className="text-blue-600" />}
                      {member.role === 'member' && <User size={14} className="text-slate-400" />}
                      <span className="capitalize text-sm font-medium text-slate-700">{member.role}</span>
                    </div>
                  </td>

                  {/* Streak Column */}
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex justify-end">
                      <AttendanceDots history={member.attendance_history || []} />
                    </div>
                  </td>

                  {/* Affordance Column — hints the row is clickable */}
                  <td className="pr-3">
                    <ChevronRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>

                </tr>
              ))}

              {paginatedMembers.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 sm:px-6 py-14 text-center text-slate-500">
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <RefreshCw size={16} className="animate-spin" />
                        Loading directory...
                      </span>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <User size={22} className="text-slate-300" />
                        <span>No members match this view.</span>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS (Mobile Stacked) */}
        <div className="px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-2 text-sm text-slate-500">
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

          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 text-sm">
            <span className="text-slate-500">
              Page <span className="font-semibold text-slate-800">{currentPage}</span> of <span className="font-semibold text-slate-800">{totalPages || 1}</span>
            </span>
            <div className="flex gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 sm:p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 sm:p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MEMBER DETAILS MODAL (Mobile Optimized) */}
      {selectedMember && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
          onClick={closeModal}
        >
          {/* Locked Max Height & Flex-Col wrapper */}
          <div
            className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Sticky Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              <h3 className="font-bold text-lg text-slate-800">Member Profile</h3>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors bg-white border border-slate-200 sm:border-none sm:bg-transparent"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 md:p-8 overflow-y-auto">

              {/* Profile Top Section */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start mb-6 sm:mb-8">
                <button
                  type="button"
                  onClick={() => selectedMember.profile_photo_url && setIsPhotoExpanded(true)}
                  className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-full flex-shrink-0 bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center group ${
                    selectedMember.profile_photo_url ? 'cursor-zoom-in' : 'cursor-default'
                  }`}
                  aria-label={selectedMember.profile_photo_url ? 'View full-size photo' : undefined}
                >
                  {selectedMember.profile_photo_url ? (
                    <>
                      <img src={selectedMember.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                      <span className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center">
                        <ZoomIn size={22} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl sm:text-4xl font-display font-bold text-slate-400">
                      {selectedMember.first_name.charAt(0)}{selectedMember.last_name.charAt(0)}
                    </span>
                  )}
                </button>

                <div className="text-center sm:text-left flex-1 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 justify-center sm:justify-start">
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-800">{selectedMember.first_name} {selectedMember.last_name}</h2>
                    <span className={`capitalize text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full w-max mx-auto sm:mx-0 ${roleBadgeStyles(selectedMember.role)}`}>
                      {selectedMember.role}
                    </span>
                  </div>
                  <p className="font-mono text-xs sm:text-sm font-bold text-brand-blue bg-brand-light px-3 py-1.5 rounded-lg w-max mx-auto sm:mx-0 border border-blue-100 mb-4">
                    {selectedMember.serial_number}
                  </p>

                  <div className="bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 flex flex-col gap-2 items-center sm:items-start">
                    <p className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Attendance Activity</p>
                    <AttendanceDots history={selectedMember.attendance_history || []} />
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 bg-white shadow-sm flex gap-3">
                  <Phone className="text-slate-400 mt-0.5 flex-shrink-0" size={18} />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Phone Number</p>
                    {selectedMember.phone_number ? (
                      <a href={`tel:${selectedMember.phone_number}`} className="font-semibold text-brand-blue text-sm sm:text-base break-words hover:underline block">
                        {selectedMember.phone_number}
                      </a>
                    ) : (
                      <p className="font-semibold text-slate-800 text-sm sm:text-base break-words">Not specified</p>
                    )}
                  </div>
                </div>

                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 bg-white shadow-sm flex gap-3">
                  <User className="text-slate-400 mt-0.5 flex-shrink-0" size={18} />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Gender</p>
                    <p className="font-semibold text-slate-800 text-sm sm:text-base break-words">{selectedMember.sex || 'Not specified'}</p>
                  </div>
                </div>

                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 bg-white shadow-sm flex gap-3">
                  <Shield className="text-purple-400 mt-0.5 flex-shrink-0" size={18} />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Cell Group</p>
                    <p className="font-semibold text-slate-800 text-sm sm:text-base break-words">{selectedMember.cell_group_name}</p>
                  </div>
                </div>

                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 bg-white shadow-sm flex gap-3 sm:col-span-2">
                  <MapPin className="text-emerald-500 mt-0.5 flex-shrink-0" size={18} />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Location</p>
                    <p className="font-semibold text-slate-800 text-sm sm:text-base break-words">{selectedMember.location_zone || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-rose-100 bg-rose-50 flex gap-3">
                <HeartPulse className="text-rose-500 mt-0.5 flex-shrink-0" size={18} />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-rose-500 font-bold uppercase tracking-wider mb-1">Emergency Contact</p>
                  {selectedMember.contact_person_name ? (
                    <p className="font-semibold text-slate-800 text-sm break-words">
                      {selectedMember.contact_person_name}
                      {selectedMember.contact_person_phone && <span className="block sm:inline text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-0 sm:ml-1"> • {selectedMember.contact_person_phone}</span>}
                    </p>
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-500 italic">No emergency contact provided.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* FULL-SIZE PHOTO LIGHTBOX */}
      {selectedMember && isPhotoExpanded && selectedMember.profile_photo_url && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsPhotoExpanded(false)}
        >
          <button
            onClick={() => setIsPhotoExpanded(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close photo"
          >
            <X size={22} />
          </button>

          <div
            className="flex flex-col items-center max-w-lg w-full animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedMember.profile_photo_url}
              alt={`${selectedMember.first_name} ${selectedMember.last_name}`}
              className="w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
            />
            <div className="mt-4 text-center">
              <p className="text-white font-display font-bold text-lg">{selectedMember.first_name} {selectedMember.last_name}</p>
              <p className="font-mono text-xs text-slate-300 mt-1 tracking-widest">{selectedMember.serial_number}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}