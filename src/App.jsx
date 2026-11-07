// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { authService } from './services/authService';
import { canAccessView, getFilteredMenuItems } from './utils/permissions'; // 👈 Import permission guards
import LoginView from './views/LoginView';
import POSTerminal from './views/POSTerminal';
import InventoryView from './views/InventoryView';
import RestockHistoryView from './views/RestockHistoryView';
import CRMView from './views/CRMView';
import SalesReportView from './views/SalesReportView';
import ExpenseView from './views/ExpenseView';
import FinancialReportView from './views/FinancialReportView';
import ShiftManagement from './views/ShiftManagement';
import UserAdminView from './views/UserAdminView';       
import AuditTrailView from './views/AuditTrailView';     
import ChangePasswordView from './views/ChangePasswordView'; // 👈 Import Change Password View
import QuickCalculator from './components/QuickCalculator'; 
import NetworkStatusBanner from './components/NetworkStatusBanner';
import { syncService, cacheMasterData } from './services/syncService';

export default function App() {
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [currentView, setCurrentView] = useState('pos');
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    // If a cashier logs in and defaults to 'pos', that's fine. 
    // If their current view isn't allowed, secure it:
    if (user && !canAccessView(user.role, currentView)) {
      setCurrentView('pos');
    }

    if (navigator.onLine) {
      cacheMasterData();
    }

    if (syncService && typeof syncService.initAutoSync === 'function') {
      syncService.initAutoSync((result) => {
        if (result && result.syncedCount > 0) {
          setSyncStatus(`Successfully auto-synced ${result.syncedCount} offline sale(s) to server!`);
          setTimeout(() => setSyncStatus(null), 6000);
        }
      });
    }
  }, []);

  const handleLoginSuccess = () => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    setCurrentView('pos'); // Reset view to POS on login
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Master list of all menu options available in the app
  const allMenuItems = [
    { id: 'pos', label: 'POS Terminal' },
    { id: 'calculator', label: 'Quick Calculator' },
    { id: 'shifts', label: 'Shift & Drawer Management' },
    { id: 'inventory', label: 'Inventory Management' },
    { id: 'restock-history', label: 'Stock Purchases History' },
    { id: 'expenses', label: 'Operating Expenses' },
    { id: 'crm', label: 'Customer CRM' },
    { id: 'sales', label: 'Sales Records & Reports' },
    { id: 'financial-report', label: 'Financial & VAT Report' },
    { id: 'users', label: 'User Administration' },     
    { id: 'audit', label: 'System Audit Trail' },      
    { id: 'change-password', label: 'Change Password' }, // 👈 Added Change Password option
  ];

  // Dynamically filter menu items based on logged-in user's role
  const permittedMenuItems = getFilteredMenuItems(currentUser.role, allMenuItems);

  const handleBackgroundSync = async () => {
    if (syncService && typeof syncService.processQueue === 'function') {
      await syncService.processQueue((result) => {
        if (result && result.syncedCount > 0) {
          setSyncStatus(`Successfully synced ${result.syncedCount} offline sale(s)!`);
          setTimeout(() => setSyncStatus(null), 6000);
        }
      });
    }
  };

  // Security Check: Prevent rendering unauthorized views even if URL/state is manipulated
  const renderSecureView = () => {
    if (!canAccessView(currentUser.role, currentView)) {
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h3 style={{ color: '#fa5252' }}>Access Denied</h3>
          <p style={{ color: '#495057' }}>Your account role ({currentUser.role}) does not have permission to view this section.</p>
          <button 
            onClick={() => setCurrentView('pos')}
            style={{ padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Return to POS Terminal
          </button>
        </div>
      );
    }

    switch (currentView) {
      case 'pos': return <POSTerminal />;
      case 'calculator': return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <QuickCalculator onClose={() => setCurrentView('pos')} />
        </div>
      );
      case 'shifts': return <ShiftManagement />;
      case 'inventory': return <InventoryView />;
      case 'restock-history': return <RestockHistoryView />;
      case 'expenses': return <ExpenseView />;
      case 'crm': return <CRMView />;
      case 'sales': return <SalesReportView />;
      case 'financial-report': return <FinancialReportView />;
      case 'users': return <UserAdminView />;
      case 'audit': return <AuditTrailView />;
      case 'change-password': return <ChangePasswordView userId={currentUser.id} />; // 👈 Pass active user ID
      default: return <POSTerminal />;
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>

      {/* Sidebar Layout - Render only permitted menu items */}
      <aside style={{ width: '250px', background: '#343a40', color: 'white', display: 'flex', flexDirection: 'column', padding: '20px 0' }}>
        <div style={{ padding: '0 20px 20px 20px', borderBottom: '1px solid #4b545c' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>QuickSellingPoint</h2>
          <small style={{ color: '#adb5bd' }}>POS & Management System</small>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '20px 10px', flex: 1, overflowY: 'auto' }}>
          {permittedMenuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              style={{
                background: currentView === item.id ? '#007bff' : 'transparent',
                color: 'white',
                border: 'none',
                padding: '12px 15px',
                textAlign: 'left',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: currentView === item.id ? 'bold' : 'normal',
                fontSize: '14px',
                transition: 'background 0.2s'
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* User Session & Logout Footer */}
        <div style={{ padding: '15px 20px', borderTop: '1px solid #4b545c', fontSize: '12px', color: '#adb5bd', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            User: <strong style={{ color: '#ffffff' }}>{currentUser.name}</strong><br />
            Role: <span style={{ color: '#4dabf7' }}>{currentUser.role}</span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: '#fa5252',
              color: '#fff',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              width: '100%',
              textAlign: 'center'
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        <NetworkStatusBanner onSyncTriggered={handleBackgroundSync} />

        {syncStatus && (
          <div style={{ background: '#2b8a3e', color: '#fff', padding: '8px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', zIndex: 10 }}>
            ✅ {syncStatus}
          </div>
        )}

        <header style={{ background: '#ffffff', padding: '15px 25px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, textTransform: 'uppercase', fontSize: '16px', color: '#495057' }}>
            {allMenuItems.find(m => m.id === currentView)?.label}
          </h3>
          <span style={{ fontSize: '14px', color: '#6c757d' }}>Live System Active (Naira ₦)</span>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', background: '#f4f6f9', padding: currentView === 'calculator' ? '30px' : '0' }}>
          {renderSecureView()}
        </main>
      </div>

    </div>
  );
}