import type { NavGroup } from './types';
import { LayoutDashboard, FileText, Users, Briefcase, TrendingDown, Settings, AreaChart, Package, ClipboardCheck, Truck, FileCheck, ShoppingCart, Library, BookCopy, BookUser } from 'lucide-react';

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Sales',
    items: [
      { id: 'quotes', label: 'Quotes', icon: ClipboardCheck },
      { id: 'invoices', label: 'Invoices', icon: FileText },
      { id: 'deliveryChallans', label: 'Delivery Challans', icon: FileCheck },
      { id: 'customers', label: 'Customers', icon: Users },
    ],
  },
  {
    title: 'Production',
    items: [
      { id: 'jobs', label: 'Jobs', icon: Briefcase },
      { id: 'inventory', label: 'Inventory', icon: Package },
    ],
  },
  {
    title: 'Purchasing',
    items: [
      { id: 'purchaseOrders', label: 'Purchase Orders', icon: ShoppingCart },
      { id: 'suppliers', label: 'Suppliers', icon: Truck },
    ],
  },
  {
    title: 'Finance',
    items: [
      { id: 'expenses', label: 'Expenses', icon: TrendingDown },
      { id: 'accounts', label: 'Accounts', icon: Library },
      { id: 'journalEntries', label: 'Journal Entries', icon: BookCopy },
      { id: 'reports', label: 'Reports', icon: AreaChart },
    ],
  },
  {
    title: 'System',
    items: [
      { id: 'userManual', label: 'User Manual', icon: BookUser },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];