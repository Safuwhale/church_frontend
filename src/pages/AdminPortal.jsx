import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Database, QrCode, Users } from 'lucide-react'; // Added QrCode
import { Settings } from 'lucide-react';

import ProfileTab from '../components/ProfileTab';
import DashboardLayout from '../components/DashboardLayout';
import OverviewTab from '../components/OverviewTab';
import DirectoryTab from '../components/DirectoryTab';
import CellGroupTab from '../components/CellGroupTab';
import AttendanceRegistryTab from '../components/AttendanceRegistryTab';
import MyQRCodeTab from '../components/MyQRCodeTab'; // Added the tab component

export default function AdminPortal() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const token = localStorage.getItem('horyc_token');
    const role = localStorage.getItem('horyc_role');
    
    if (!token) {
      navigate('/login');
      return;
    }

    if (role !== 'hod') {
      navigate('/portal');
      return;
    }

    setTimeout(() => {
      setUserData({
        first_name: localStorage.getItem('horyc_name') || 'Admin',
        serial_number: localStorage.getItem('horyc_id') || 'HORYC-000',
        role: role,
      });
    }, 500);
  }, [navigate]);

  // Inserted the QR Pass into the Admin menu
  const menuItems = [
    { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
    { id: 'qr', label: 'My QR Pass', icon: QrCode }, 
    { id: 'cells', label: 'Cell Groups', icon: Users },
    { id: 'directory', label: 'Youth Directory', icon: BookOpen },
    { id: 'registry', label: 'Attendance Registry', icon: Database },
    { id: 'profile', label: 'Profile Settings', icon: Settings },
  ];

  if (!userData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      userData={userData} 
      menuItems={menuItems} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'qr' && <MyQRCodeTab userData={userData} />} {/* Added rendering logic */}
      {activeTab === 'cells' && <CellGroupTab />}
      {activeTab === 'directory' && <DirectoryTab />}
      {activeTab === 'registry' && <AttendanceRegistryTab />}
      {activeTab === 'profile' && <ProfileTab userData={userData} />}
    </DashboardLayout>
  );
}