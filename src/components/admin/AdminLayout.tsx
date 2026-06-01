import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Users, 
  CreditCard,
  Image as ImageIcon,
  ConciergeBell,
  Mail,
  Bell,
  BarChart,
  CalendarDays
} from 'lucide-react';
import './AdminLayout.css';

export interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  requiresSuperAdmin?: boolean;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isSuperAdmin?: boolean;
  adminEmail?: string;
}

const defaultTabs: TabConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'prezzi', label: 'Prezzi e Tariffe', icon: <CreditCard size={20} /> },
  { id: 'servizi-extra', label: 'Servizi Extra', icon: <ConciergeBell size={20} /> },
  { id: 'calendari', label: 'Calendari', icon: <CalendarDays size={20} /> },
  { id: 'prenotazioni', label: 'Prenotazioni', icon: <Calendar size={20} /> },
  { id: 'pagamenti', label: 'Pagamenti', icon: <CreditCard size={20} /> },
  { id: 'gallery', label: 'Gestione Immagini', icon: <ImageIcon size={20} /> },
  { id: 'email', label: 'Email', icon: <Mail size={20} /> },
  { id: 'notifiche', label: 'Notifiche', icon: <Bell size={20} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart size={20} /> },
  { id: 'admin-management', label: 'Gestione Admin', icon: <Users size={20} />, requiresSuperAdmin: true },
  { id: 'sistema', label: 'Sistema', icon: <Settings size={20} /> }
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  onLogout,
  isSuperAdmin = false,
  adminEmail = 'Admin'
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (window.innerWidth < 768) {
      setMobileMenuOpen(false);
    }
  };

  const visibleTabs = defaultTabs.filter(tab => !tab.requiresSuperAdmin || isSuperAdmin);

  return (
    <div className={`admin-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="admin-mobile-topbar">
        <button onClick={toggleMobileMenu} className="mobile-menu-btn">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="admin-mobile-logo">Vincanto Admin</div>
      </div>

      {mobileMenuOpen && (
        <div className="admin-sidebar-overlay" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      <aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Vincanto</h2>
          <button onClick={toggleSidebar} className="desktop-menu-btn">
            <Menu size={20} />
          </button>
        </div>

        <div className="sidebar-user-info">
          <div className="user-avatar">
            {adminEmail.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <span className="user-email">{adminEmail}</span>
            <span className="user-role">{isSuperAdmin ? 'Super Admin' : 'Admin'}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              className={`sidebar-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>
            <LogOut size={20} />
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main-content">
        <div className="admin-content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
