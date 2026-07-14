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
    return <div className="text-slate-500">Loading cell group...</div>;
  }

  if (!data) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">You are not assigned to a cell group yet.</div>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION - Unchanged */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 md:p-8">
        <div className="flex items-center gap-3 text-emerald-300 mb-3">
          <Shield size={18} />
          <span className="text-sm font-semibold uppercase tracking-wider">Your Cell Group</span>
        </div>
        <h3 className="font-display text-3xl font-bold">{data.cell_name}</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-slate-200">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-slate-400 uppercase tracking-wider text-xs mb-1">Leader</p>
            <p className="font-semibold">{data.leader_name || 'Not assigned'}</p>
            {data.leader_phone && <p className="text-slate-300 mt-1">{data.leader_phone}</p>}
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-slate-400 uppercase tracking-wider text-xs mb-1">Members</p>
            <p className="font-semibold text-2xl">{data.total_members}</p>
          </div>
        </div>
      </div>

      {/* MEMBER LIST SECTION - Updated with AttendanceDots */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h4 className="font-semibold text-slate-700">Fellow Cell Members</h4>
        </div>
        <div className="divide-y divide-slate-100">
          {(data.members || []).map((member) => (
            <div key={member.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              
              {/* Member Details */}
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-lg">{member.first_name} {member.last_name}</p>
                <p className="text-sm text-slate-500 mb-2">{member.role}</p>
                
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5"><Phone size={13} className="text-slate-400"/> {member.phone_number}</span>
                  <span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-slate-400"/> {member.location_zone || 'N/A'}</span>
                  <span className="inline-flex items-center gap-1.5"><Users size={13} className="text-slate-400"/> {member.serial_number}</span>
                </div>
              </div>

              {/* Attendance Widget */}
              <div className="sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-slate-100 sm:border-none">
                <AttendanceDots history={member.attendance_history || []} />
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}