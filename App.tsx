// Fix: Corrected the import syntax for React and useState.
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import InvoicesPage from './pages/InvoicesPage';
import QuotesPage from './pages/QuotesPage';
import CustomersPage from './pages/CustomersPage';
import CustomerProfilePage from './pages/CustomerProfilePage';
import JobsPage from './pages/JobsPage';
import ExpensesPage from './pages/ExpensesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import InventoryPage from './pages/InventoryPage';
import SuppliersPage from './pages/SuppliersPage';
import DeliveryChallansPage from './pages/DeliveryChallansPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import AccountsPage from './pages/AccountsPage';
import JournalEntriesPage from './pages/JournalEntriesPage';
import UserManualPage from './pages/UserManualPage';
import { Page } from './types';
import { NAV_GROUPS } from './constants';
import AIAssistant from './components/AIAssistant';
import Notifications from './components/Notifications';
import GlobalSearch from './components/GlobalSearch';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import { LoaderCircle } from 'lucide-react';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [viewingCustomerId, setViewingCustomerId] = useState<string | null>(null);

  const handleSetCurrentPage = (page: Page) => {
    setCurrentPage(page);
    setViewingCustomerId(null); // Reset customer view when changing main page
  };
  
  const handleViewCustomer = (customerId: string) => {
    setViewingCustomerId(customerId);
  };

  const renderPage = () => {
    if (viewingCustomerId) {
        return <CustomerProfilePage customerId={viewingCustomerId} onBack={() => setViewingCustomerId(null)} onViewCustomer={handleViewCustomer} />;
    }
    
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage setCurrentPage={handleSetCurrentPage} />;
      case 'invoices':
        return <InvoicesPage onViewCustomer={handleViewCustomer} />;
      case 'quotes':
        return <QuotesPage onViewCustomer={handleViewCustomer} />;
      case 'deliveryChallans':
        return <DeliveryChallansPage onViewCustomer={handleViewCustomer}/>;
      case 'jobs':
        return <JobsPage />;
      case 'customers':
        return <CustomersPage onViewCustomer={handleViewCustomer} />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'purchaseOrders':
        return <PurchaseOrdersPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'accounts':
        return <AccountsPage />;
      case 'journalEntries':
        return <JournalEntriesPage />;
      case 'reports':
        return <ReportsPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'userManual':
        return <UserManualPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage setCurrentPage={handleSetCurrentPage} />;
    }
  };
  
  const allNavItems = NAV_GROUPS.flatMap(group => group.items);
  const currentPageDetails = allNavItems.find(item => item.id === currentPage);
  const CurrentPageIcon = currentPageDetails?.icon;
  const CurrentPageLabel = currentPageDetails?.label;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      <Sidebar currentPage={currentPage} setCurrentPage={handleSetCurrentPage} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm p-4 z-10">
            <div className="grid grid-cols-3 items-center gap-4">
                <div className="flex items-center space-x-3">
                    {CurrentPageIcon && <CurrentPageIcon className="h-6 w-6 text-brand-blue" />}
                    <h1 className="text-2xl font-semibold text-gray-800 truncate">{viewingCustomerId ? 'Customer Profile' : CurrentPageLabel}</h1>
                </div>
                <div className="flex justify-center">
                    <GlobalSearch setCurrentPage={handleSetCurrentPage} onViewCustomer={handleViewCustomer} />
                </div>
                <div className="flex justify-end">
                    <Notifications setCurrentPage={handleSetCurrentPage} />
                </div>
            </div>
        </header>
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8">
            {renderPage()}
        </div>
      </main>
      {process.env.API_KEY && <AIAssistant />}
    </div>
  );
};

const App: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <LoaderCircle className="h-12 w-12 animate-spin text-brand-blue" />
            </div>
        );
    }
    
    if (!user) {
        return <LoginPage />;
    }

    return <AppContent />;
}


export default App;
