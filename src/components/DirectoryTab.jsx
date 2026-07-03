import { useEffect, useMemo, useState } from 'react';
import { Search, Shield, User, Phone, RefreshCw } from 'lucide-react';
import { secureFetch } from '../api/api';

export default function DirectoryTab() {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

  const filteredMembers = useMemo(() => members, [members]);

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: Search and Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-bold text-slate-800">Members Directory</h3>
          <p className="text-slate-500 text-sm">Manage members, ushers, and leaders from the live backend.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, ID, phone, or role..."
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
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SECTION 2: Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="px-6 py-4 font-medium">Member</th>
                <th className="px-6 py-4 font-medium">HORYC ID</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  
                  {/* Name Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        member.role === 'hod' || member.role === 'admin' ? 'bg-emerald-100 text-emerald-700' :
                        member.role === 'leader' ? 'bg-purple-100 text-purple-700' :
                        member.role === 'usher' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{member.first_name} {member.last_name}</p>
                      </div>
                    </div>
                  </td>

                  {/* ID Column */}
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                      {member.serial_number}
                    </span>
                  </td>

                  {/* Contact Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <Phone size={14} />
                      {member.phone_number}
                    </div>
                  </td>

                  {/* Role Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {member.role === 'leader' && <Shield size={16} className="text-purple-600" />}
                      {member.role === 'usher' && <User size={16} className="text-blue-600" />}
                      {member.role === 'member' && <User size={16} className="text-slate-400" />}
                      <span className="capitalize text-sm font-medium text-slate-700">{member.role}</span>
                    </div>
                  </td>

                </tr>
              ))}
              
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-slate-500">
                                  {isLoading ? 'Loading directory...' : 'No members found matching your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}