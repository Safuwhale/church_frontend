import { useState } from 'react';
import { BookOpen, Download, Calendar, Users, ArrowUpRight } from 'lucide-react';

export default function AttendanceRegistryTab({ token }) {
  // Mock data for past services
  const [pastServices, setPastServices] = useState([
    { id: 1, name: 'Sunday Service', date: '2026-06-21', totalCheckIns: 142, newGuests: 5 },
    { id: 2, name: 'Midweek Bible Study', date: '2026-06-18', totalCheckIns: 85, newGuests: 2 },
    { id: 3, name: 'Sunday Service', date: '2026-06-14', totalCheckIns: 156, newGuests: 12 },
    { id: 4, name: 'Youth Praise Night', date: '2026-06-12', totalCheckIns: 210, newGuests: 24 },
  ]);

  const handleExportCSV = () => {
    // TODO: Connect to FastAPI GET /api/attendance/export
    console.log("Exporting attendance data to CSV...");
    alert("In the live version, this will download a .csv file of all attendance records for your reports.");
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: Header & Export Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-bold text-slate-800">Attendance Registry</h3>
          <p className="text-slate-500 text-sm">Track historical check-ins and monitor program impact.</p>
        </div>

        <button 
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-2.5 px-5 rounded-xl font-medium hover:bg-emerald-100 transition-colors border border-emerald-200"
        >
          <Download size={18} />
          Export Data (CSV)
        </button>
      </div>

      {/* SECTION 2: Impact Tracking Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Total Services (June)</p>
            <p className="text-2xl font-bold text-slate-800">4</p>
          </div>
          <div className="bg-blue-50 text-brand-blue p-2.5 rounded-lg">
            <BookOpen size={20} />
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Average Attendance</p>
            <p className="text-2xl font-bold text-slate-800">148</p>
          </div>
          <div className="bg-purple-50 text-purple-600 p-2.5 rounded-lg">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Total New Guests</p>
            <p className="text-2xl font-bold text-slate-800">43</p>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg">
            <ArrowUpRight size={20} />
          </div>
        </div>
      </div>

      {/* SECTION 3: Service Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h4 className="font-semibold text-slate-700">Past Services Ledger</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-sm">
                <th className="px-6 py-3 font-medium">Service Name</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium text-center">Total Check-ins</th>
                <th className="px-6 py-3 font-medium text-center">New Guests</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pastServices.map((service) => (
                <tr key={service.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-700">{service.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Calendar size={14} />
                      {new Date(service.date).toLocaleDateString('en-US', { 
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center bg-blue-50 text-brand-blue font-bold px-3 py-1 rounded-full text-sm">
                      {service.totalCheckIns}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600 text-sm">
                    +{service.newGuests}
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