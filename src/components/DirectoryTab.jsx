import { useState } from 'react';
import { Search, Shield, User, Phone, ChevronRight } from 'lucide-react';

export default function DirectoryTab({ token }) {
  // Mock data representing what will eventually come from PostgreSQL via FastAPI
  const [members, setMembers] = useState([
    { id: 1, firstName: 'Daniel', lastName: 'Okafor', phone: '08011112222', role: 'member', horycId: 'HORYC-045' },
    { id: 2, firstName: 'Sarah', lastName: 'Ibrahim', phone: '08033334444', role: 'usher', horycId: 'HORYC-012' },
    { id: 3, firstName: 'Michael', lastName: 'Johnson', phone: '08055556666', role: 'leader', horycId: 'HORYC-008' },
    { id: 4, firstName: 'Grace', lastName: 'Emmanuel', phone: '08077778888', role: 'member', horycId: 'HORYC-089' },
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');

  // Filter members based on search input
  const filteredMembers = members.filter(member => 
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone.includes(searchTerm) ||
    member.horycId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePromote = (memberId, newRole) => {
    // TODO: Connect to FastAPI PATCH /api/users/{id}/role
    console.log(`Promoting user ${memberId} to ${newRole}`);
    
    // Simulating frontend state update
    setMembers(members.map(m => 
      m.id === memberId ? { ...m, role: newRole } : m
    ));
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: Search and Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-bold text-slate-800">Youth Directory</h3>
          <p className="text-slate-500 text-sm">Manage members, ushers, and leaders.</p>
        </div>

        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, ID, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all bg-white"
          />
        </div>
      </div>

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
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  
                  {/* Name Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        member.role === 'leader' ? 'bg-purple-100 text-purple-700' :
                        member.role === 'usher' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{member.firstName} {member.lastName}</p>
                      </div>
                    </div>
                  </td>

                  {/* ID Column */}
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                      {member.horycId}
                    </span>
                  </td>

                  {/* Contact Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <Phone size={14} />
                      {member.phone}
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

                  {/* Actions Column */}
                  <td className="px-6 py-4 text-right">
                    {member.role === 'member' && (
                      <button 
                        onClick={() => handlePromote(member.id, 'leader')}
                        className="text-sm font-medium text-brand-blue hover:text-blue-800 transition-colors flex items-center justify-end gap-1 ml-auto"
                      >
                        Make Leader <ChevronRight size={16} />
                      </button>
                    )}
                    {member.role !== 'member' && (
                      <span className="text-sm text-slate-400 italic">No action needed</span>
                    )}
                  </td>

                </tr>
              ))}
              
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                    No members found matching your search.
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