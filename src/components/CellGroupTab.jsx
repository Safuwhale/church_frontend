import { useState } from 'react';
import { Users, Phone, Shield, Camera, MapPin, Mail, MessageCircle } from 'lucide-react';

export default function CellGroupTab({ userData }) {
  // MOCK DATA: In the live app, this fetches from FastAPI based on the user's assigned cell_id
  const [cellInfo] = useState({
    name: "Tribe of Judah",
    meetingDay: "Wednesdays at 6:00 PM",
    location: "Zone 4, Main District",
    leader: {
      name: "Michael Johnson",
      phone: "08055556666",
      email: "michael.j@example.com"
    },
    members: [
      { id: 1, name: "Daniel Okafor", phone: "08011112222" },
      { id: 2, name: "Grace Emmanuel", phone: "08077778888" },
      { id: 3, name: "Danielle Peters", phone: "08099990000" },
    ]
  });

  const handleSelfServiceScan = () => {
    // TODO: Trigger device camera to scan the static Church Poster
    alert("Opening Camera: Point your phone at the Church Check-in Poster to record your attendance!");
  };

  return (
    <div className="space-y-6"> 

      {/* CELL GROUP DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Leader & Info */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-display text-xl font-bold text-slate-800 mb-1">{cellInfo.name}</h3>
            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin size={16} className="text-brand-blue" />
                <span>{cellInfo.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users size={16} className="text-brand-blue" />
                <span>{cellInfo.meetingDay}</span>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={20} className="text-purple-600" />
              <h4 className="font-bold text-purple-900">Cell Leader</h4>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-purple-100">
              <p className="font-bold text-slate-800">{cellInfo.leader.name}</p>
              <div className="mt-3 space-y-2">
                <a href={`tel:${cellInfo.leader.phone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-brand-blue transition-colors w-fit">
                  <Phone size={14} />
                  {cellInfo.leader.phone}
                </a>
                <a href={`mailto:${cellInfo.leader.email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-brand-blue transition-colors w-fit">
                  <Mail size={14} />
                  {cellInfo.leader.email}
                </a>
              </div>
              <a 
                href={`https://wa.me/${cellInfo.leader.phone.replace(/^0/, '234')}`} 
                target="_blank" 
                rel="noreferrer"
                className="mt-4 w-full flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#128C7E] py-2.5 rounded-xl font-medium hover:bg-[#25D366]/20 transition-colors text-sm"
              >
                <MessageCircle size={16} />
                Message Leader
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Co-Members */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div>
              <h4 className="font-display font-bold text-slate-800">Co-Members</h4>
              <p className="text-sm text-slate-500">Connect with your cell group family.</p>
            </div>
            <div className="bg-blue-100 text-brand-blue font-bold px-3 py-1 rounded-full text-sm">
              {cellInfo.members.length} Youths
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cellInfo.members.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {member.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-slate-800 truncate">{member.name}</p>
                    <a href={`tel:${member.phone}`} className="text-xs text-slate-500 flex items-center gap-1 hover:text-brand-blue transition-colors">
                      <Phone size={12} />
                      {member.phone}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}