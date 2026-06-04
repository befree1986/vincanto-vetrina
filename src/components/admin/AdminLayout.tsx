import React from 'react';
import { Link } from 'react-router-dom';
import './AdminLayout.css'; // Importa il CSS per AdminLayout

interface AdminTab {
  id: string;
  label: string;
  requiresSuperAdmin: boolean;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isSuperAdmin: boolean;
  adminEmail: string;
  role?: string;
  tabs?: AdminTab[];
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  onLogout,
  isSuperAdmin,
  adminEmail,
  role,
  tabs,
}) => {
  const currentRole = role || (isSuperAdmin ? 'superadmin' : 'admin');

  const defaultTabs: AdminTab[] = [
    { id: 'dashboard', label: '📊 Dashboard', requiresSuperAdmin: false },
    { id: 'prenotazioni', label: '📅 Prenotazioni', requiresSuperAdmin: false },
    { id: 'calendari', label: '📆 Calendari', requiresSuperAdmin: false },
    { id: 'servizi-extra', label: '🛎️ Servizi Extra', requiresSuperAdmin: false },
    { id: 'prezzi', label: '💵 Prezzi', requiresSuperAdmin: false },
    { id: 'pagamenti', label: '💳 Pagamenti', requiresSuperAdmin: false },
    { id: 'email', label: '📧 Email', requiresSuperAdmin: false },
    { id: 'notifiche', label: '🔔 Notifiche', requiresSuperAdmin: false },
    { id: 'analytics', label: '📊 Analytics', requiresSuperAdmin: false },
    { id: 'gallery', label: '🖼️ Gestione Immagini', requiresSuperAdmin: false },
    { id: 'contenuti', label: '📝 Contenuti Sito', requiresSuperAdmin: false },
    { id: 'admin-management', label: '👥 Gestione Admin', requiresSuperAdmin: true },
    { id: 'sistema', label: '⚙️ Sistema', requiresSuperAdmin: true },
    { id: 'switch-basic', label: '🔄 Vista Admin Base', requiresSuperAdmin: true },
  ];

  const sidebarTabs = tabs && tabs.length > 0 ? tabs : defaultTabs;
  
  // Filtra e ordina i tab: sposta il tab di switch in fondo se l'utente ha i permessi
  const filteredTabs = sidebarTabs.filter(tab => {
    if (tab.id.startsWith('switch-') && tab.requiresSuperAdmin && !isSuperAdmin) return false;
    return true;
  });
  
  const nonSwitchTabs = filteredTabs.filter(t => !t.id.startsWith('switch-'));
  const switchTab = filteredTabs.find(t => t.id.startsWith('switch-'));
  const orderedTabs = switchTab ? [...nonSwitchTabs, switchTab] : nonSwitchTabs;

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="admin-header-left">
          <Link to="/admin" className="admin-logo">Vincanto Admin</Link>
          <span className="admin-version admin-badge admin-badge-info">v2.0</span>
        </div>
        <div className="admin-header-actions">
          <div className="admin-flex admin-items-center admin-gap-md">
            <div className="admin-badge admin-badge-success">✅ Online</div>
            <div className="admin-flex admin-items-center admin-gap-sm">
              <span className="admin-text-muted admin-hidden-mobile">👤 {adminEmail}</span>
              <div className={`admin-badge ${isSuperAdmin ? 'admin-badge-superadmin' : 'admin-badge-admin'}`} title={`Ruolo: ${currentRole}`}>
                {isSuperAdmin ? '⚡ SuperAdmin' : '✨ Admin'}
              </div>
            </div>
          </div>
          <button className="admin-btn admin-btn-secondary" onClick={onLogout}>
            <span className="admin-hidden-mobile">🚪 Logout</span>
            <span className="admin-visible-mobile">🚪</span>
          </button>
        </div>
      </header>

      <nav className="admin-sidebar">
        {orderedTabs.map((tab) => {
          const isDisabled = tab.requiresSuperAdmin && !isSuperAdmin;
          const tabClassName = `admin-nav-link ${activeTab === tab.id ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`;
          return (
            <button
              key={tab.id}
              className={tabClassName}
              onClick={() => !isDisabled && setActiveTab(tab.id)}
              title={isDisabled ? 'Accesso riservato al SuperAdmin' : tab.label}
              disabled={isDisabled}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <main className="admin-content">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;