/**
 * MemberPortal Page
 * The primary dashboard for registered youth members.
 * Fetches authenticated user profile and manages view states for tabs.
 */

import { useState, useEffect } from 'react';
import { secureFetch } from '../api/api';
import DashboardLayout from '../components/DashboardLayout';
import MyQRCodeTab from '../components/MyQRCodeTab';
import ProfileTab from '../components/ProfileTab';
import MemberCellGroupTab from '../components/MemberCellGroupTab';
import { QrCode, Users, Settings } from 'lucide-react';

export default function MemberPortal() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('qr');
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Hydrate user profile on component mount.
   * Calls the /api/users/me endpoint to get verified profile data.
   */
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const response = await secureFetch('/api/users/me');
        
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else {
          console.error("Failed to fetch user profile");
        }
      } catch (error) {
        console.error("Error during profile hydration:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-medium animate-pulse">Loading your portal...</p>
      </div>
    );
  }

  // Menu configuration for the portal navigation
  const menuItems = [
    { id: 'qr', label: 'My QR', icon: QrCode },
    { id: 'cell', label: 'My Cell Group', icon: Users },
    { id: 'profile', label: 'Profile Settings', icon: Settings },
  ];

  return (
    <DashboardLayout 
      menuItems={menuItems} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      userData={userData}
    >
      {/* REMOVED the <div className="p-6"> wrapper here to prevent double-padding on mobile! */}
      {activeTab === 'qr' && userData && (
        <MyQRCodeTab userData={userData} />
      )}

      {activeTab === 'cell' && userData && (
        <MemberCellGroupTab userData={userData} />
      )}
      
      {activeTab === 'profile' && userData && (
        <ProfileTab userData={userData} />
      )}
    </DashboardLayout>
  );
}