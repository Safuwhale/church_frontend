import { useEffect, useState } from 'react';
import { secureFetch } from '../api/api';
import { Users, Phone, MapPin, Shield } from 'lucide-react';
import AttendanceDots from './AttendanceDots';

export default function MemberCellGroupTab() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCell = async () => {
      setIsLoading(true);
      try {
        const response = await secureFetch('/api/cells/my-cell');
        if (response.ok) {
          setData(await response.json());
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCell();
  }, []);

  if (isLoading) {
    return <div className="text-slate-500 p-6">Loading cell group...</div>;
  }

  if (!data) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">You are not assigned to a cell group yet.</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 md:p-8">
        <div className="flex items-center gap-3 text-emerald-300 mb-3">
          <Shield size={18} />
          <span className="text-sm font-semibold uppercase tracking-wider">Your Cell Group</span>
        </div>
        <h3 className="font-display text-3xl font-bold">{data.cell_name}</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-slate-200">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col justify-center">
            <p className="text-slate-400 uppercase tracking-wider text-xs mb-1">Leader</p>
            <p className="font-semibold text-lg">{data.leader_name || 'Not assigned'}</p>
            {data.leader_phone && <p className="text-slate-300 mt-0.5 text-xs">{data.leader_phone}</p>}
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col justify-center">
            <p className="text-slate-400 uppercase tracking-wider text-xs mb-1">Total Members</p>
            <p className="font-semibold text-3xl">{data.total_members}</p>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h4 className="font-semibold text-slate-800 text-lg">Fellow Cell Members</h4>
        </div>
        
        {/* Mobile-Responsive Wrapper */}
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[600px]">
            <thead className="bg-white border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Member Name</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">ID & Location</th>
                <th className="px-6 py-4 text-right">Attendance Streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.members || []).map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                  
                  {/* Name & Role */}
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 text-base">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-xs text-slate-500 capitalize mt-0.5">{member.role}</p>
                  </td>

                  {/* Phone */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <Phone size={14} className="text-slate-400" /> 
                      {member.phone_number}
                    </div>
                  </td>

                  {/* ID & Zone */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="flex items-center gap-2 font-mono text-[11px] font-bold text-brand-blue bg-brand-light px-2 py-1 rounded w-max border border-blue-100">
                        <Users size={12} /> {member.serial_number}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin size={12} className="text-slate-400" /> {member.location_zone || 'N/A'}
                      </span>
                    </div>
                  </td>

                  {/* Attendance Streak */}
                  <td className="px-6 py-4 flex justify-end items-center h-full pt-6">
                    <AttendanceDots history={member.attendance_history || []} />
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}