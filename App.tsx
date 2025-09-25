import React, { useState, Suspense, lazy } from 'react';
import Sidebar from './components/Sidebar';
import { Page } from './types';
import { NAV_GROUPS } from './constants';
import AIAssistant from './components/AIAssistant';
import Notifications from './components/Notifications';
import GlobalSearch from './components/GlobalSearch';
import FullScreenLoader from './components/FullScreenLoader';
import { Menu } from 'lucide-react';

// Lazy load all page components for code splitting
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const QuotesPage = lazy(() => import('./pages/QuotesPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const CustomerProfilePage = lazy(() => import('./pages/CustomerProfilePage'));
const JobsPage = lazy(() => import('./pages/JobsPage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const SuppliersPage = lazy(() => import('./pages/SuppliersPage'));
const SupplierProfilePage = lazy(() => import('./pages/SupplierProfilePage'));
const DeliveryChallansPage = lazy(() => import('./pages/DeliveryChallansPage'));
const PurchaseOrdersPage = lazy(() => import('./pages/PurchaseOrdersPage'));
const AccountsPage = lazy(() => import('./pages/AccountsPage'));
const JournalEntriesPage = lazy(() => import('./pages/JournalEntriesPage'));
const UserManualPage = lazy(() => import('./pages/UserManualPage'));
const RecurringInvoicesPage = lazy(() => import('./pages/RecurringInvoicesPage'));
const CreditNotesPage = lazy(() => import('./pages/CreditNotesPage'));


const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [viewingCustomerId, setViewingCustomerId] = useState<string | null>(null);
  const [viewingSupplierId, setViewingSupplierId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSetCurrentPage = (page: Page) => {
    setCurrentPage(page);
    setViewingCustomerId(null);
    setViewingSupplierId(null);
    setIsSidebarOpen(false); // Close sidebar on nav
  };
  
  const handleViewCustomer = (customerId: string) => {
    setViewingCustomerId(customerId);
    setViewingSupplierId(null);
    setCurrentPage('customers'); // Set a base page context
    setIsSidebarOpen(false); // Close sidebar on nav
  };
  
  const handleViewSupplier = (supplierId: string) => {
    setViewingSupplierId(supplierId);
    setViewingCustomerId(null);
    setCurrentPage('suppliers'); // Set a base page context
    setIsSidebarOpen(false); // Close sidebar on nav
  };

  const renderPage = () => {
    if (viewingCustomerId) {
        return <CustomerProfilePage customerId={viewingCustomerId} onBack={() => setViewingCustomerId(null)} />;
    }
    if (viewingSupplierId) {
        return <SupplierProfilePage supplierId={viewingSupplierId} onBack={() => setViewingSupplierId(null)} />;
    }
    
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage setCurrentPage={handleSetCurrentPage} />;
      case 'invoices':
        return <InvoicesPage onViewCustomer={handleViewCustomer} />;
      case 'recurringInvoices':
        return <RecurringInvoicesPage onViewCustomer={handleViewCustomer} />;
      case 'creditNotes':
        return <CreditNotesPage onViewCustomer={handleViewCustomer} />;
      case 'quotes':
        return <QuotesPage onViewCustomer={handleViewCustomer} />;
      case 'deliveryChallans':
        return <DeliveryChallansPage onViewCustomer={handleViewCustomer}/>;
      case 'jobs':
        return <JobsPage />;
      case 'customers':
        return <CustomersPage onViewCustomer={handleViewCustomer} />;
      case 'suppliers':
        return <SuppliersPage onViewSupplier={handleViewSupplier} />;
      case 'purchaseOrders':
        return <PurchaseOrdersPage onViewSupplier={handleViewSupplier} />;
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
  let pageTitle = 'Dashboard';
  let CurrentPageIcon;

  if (viewingCustomerId) {
      pageTitle = 'Customer Profile';
      CurrentPageIcon = allNavItems.find(item => item.id === 'customers')?.icon;
  } else if (viewingSupplierId) {
      pageTitle = 'Supplier Profile';
      CurrentPageIcon = allNavItems.find(item => item.id === 'suppliers')?.icon;
  } else {
      const currentPageDetails = allNavItems.find(item => item.id === currentPage);
      if (currentPageDetails) {
          pageTitle = currentPageDetails.label;
          CurrentPageIcon = currentPageDetails.icon;
      }
  }


  return (
    <div className="relative min-h-screen md:flex bg-gray-50 text-gray-800">
      {isSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
      
      <Sidebar currentPage={currentPage} setCurrentPage={handleSetCurrentPage} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm p-4 z-10">
            <div className="grid grid-cols-3 items-center gap-4">
                <div className="flex items-center space-x-3">
                    <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-1 text-gray-600 hover:text-brand-blue" aria-label="Open sidebar">
                        <Menu className="h-6 w-6" />
                    </button>
                    {CurrentPageIcon && <CurrentPageIcon className="h-6 w-6 text-brand-blue hidden sm:block" />}
                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 truncate">{pageTitle}</h1>
                </div>
                <div className="hidden md:flex justify-center">
                    <GlobalSearch setCurrentPage={handleSetCurrentPage} onViewCustomer={handleViewCustomer} />
                </div>
                <div className="flex justify-end">
                    <Notifications setCurrentPage={handleSetCurrentPage} />
                </div>
            </div>
            <div className="mt-4 md:hidden">
                <GlobalSearch setCurrentPage={handleSetCurrentPage} onViewCustomer={handleViewCustomer} />
            </div>
        </header>
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8">
            <Suspense fallback={<FullScreenLoader />}>
              {renderPage()}
            </Suspense>
        </div>
      </main>
      {process.env.GEMINI_API_KEY && <AIAssistant />}
    </div>
  );
};


export default App;