import React from 'react';

export type Page = 'dashboard' | 'invoices' | 'quotes' | 'jobs' | 'customers' | 'expenses' | 'settings' | 'reports' | 'inventory' | 'suppliers' | 'deliveryChallans' | 'purchaseOrders' | 'accounts' | 'journalEntries' | 'userManual';

export interface NavItem {
  id: Page;
  label: string;
  // Fix: Use a more general type for the icon to be compatible with lucide-react icons.
  icon: React.ElementType;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'invoice-overdue' | 'invoice-reminder' | 'low-stock';
  relatedId: string; // ID of the invoice or inventory item
  timestamp: number;
  read: boolean;
  linkTo?: Page;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  openingBalance: number;
}

export interface Supplier {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  openingBalance: number;
  linkedInventoryItemIds?: string[];
}

export interface InvoiceItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  rate: number;
  inventoryItemId?: string;
}

export interface QuoteItem extends InvoiceItem {}

export enum QuoteStatus {
    Draft = 'DRAFT',
    Sent = 'SENT',
    Accepted = 'ACCEPTED',
    Declined = 'DECLINED',
    Converted = 'CONVERTED',
}

export interface Quote {
    id: string;
    userId: string;
    quoteNumber: string;
    customerId: string;
    issueDate: string;
    expiryDate: string;
    items: QuoteItem[];
    status: QuoteStatus;
    notes: string;
    discount: number;
    convertedToJobId?: string;
    convertedToInvoiceId?: string;
    selectedTerms?: string[];
}

export enum InvoiceStatus {
  Draft = 'DRAFT',
  Sent = 'SENT',
  Paid = 'PAID',
  PartiallyPaid = 'PARTIALLY_PAID',
  Overdue = 'OVERDUE',
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  notes?: string;
}

export const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Credit Card', 'Other'];

export interface Invoice {
  id:string;
  userId: string;
  invoiceNumber: string;
  customerId: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  status: InvoiceStatus;
  notes: string;
  payments: Payment[];
  previousDue: number;
  discount: number;
  reminderDate?: string;
  challanId?: string;
  selectedTerms?: string[];
}

export interface DeliveryChallanItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  inventoryItemId?: string;
}

export interface DeliveryChallan {
  id: string;
  userId: string;
  challanNumber: string;
  customerId: string;
  issueDate: string;
  items: DeliveryChallanItem[];
  notes: string;
  invoiceId?: string;
}

export enum JobStatus {
  Pending = 'PENDING',
  Designing = 'DESIGNING',
  Printing = 'PRINTING',
  Completed = 'COMPLETED',
  Delivered = 'DELIVERED',
}

export interface CostLineItem {
  quantity: number;
  rate: number;
  total: number;
}

export interface OtherExpenseLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  total: number;
}

export interface JobCostBreakdown {
  paper: CostLineItem;
  ctp: CostLineItem;
  printing: CostLineItem;
  binding: CostLineItem;
  delivery: CostLineItem;
  otherExpenses: OtherExpenseLineItem[];
}

// Kept for backward compatibility reference, not used directly
export interface OldJobCostBreakdown {
  paper: number;
  ctp: number;
  printing: number;
  binding: number;
  delivery: number;
  otherExpenses: { id: string; description: string; amount: number }[];
}

export interface JobOrder {
  id: string;
  userId: string;
  jobName: string;
  customerId: string;
  orderDate: string;
  dueDate: string;
  status: JobStatus;
  description: string;
  quantity: number;
  paperType: string;
  size: string;
  finishing: string;
  price: number;
  notes: string;
  materialsUsed: {
    itemId: string;
    quantity: number;
  }[];
  inventoryConsumed: boolean;
  invoiceId?: string;
  costBreakdown?: JobCostBreakdown | OldJobCostBreakdown;
  estimatedCost?: number;
  designImage?: string; // base64 string
  designImageMimeType?: string;
}

export interface Expense {
  id: string;
  userId: string;
  date: string;
  description: string;
  amount: number;
  debitAccountId: string; // The expense account
  creditAccountId: string; // The account money came from (e.g., cash, bank)
}

export interface CompanySettings {
  name: string;
  logo: string; // base64 string
  address: string;
  phone1: string;
  phone2: string;
  email: string;
  tagline: string;
  services: string;
  footerText: string;
  termsAndConditions: { id: string; text: string }[];
  preparedByLabel: string;
  authorizedSignatureLabel: string;
  authorizedSignatureImage?: string; // base64 string
}

export interface InventoryItem {
  id: string;
  userId: string;
  name: string;
  sku: string; // Stock Keeping Unit
  category: string; // e.g., Paper, Ink, Toner, Finishing Supplies
  stockQuantity: number;
  reorderLevel: number; // Threshold for low stock warning
  supplier: string;
  unitCost: number;
}

export enum PurchaseOrderStatus {
    Pending = 'PENDING',
    Ordered = 'ORDERED',
    PartiallyReceived = 'PARTIALLY_RECEIVED',
    Completed = 'COMPLETED',
    Cancelled = 'CANCELLED',
}

export interface PurchaseOrderItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitCost: number;
  inventoryItemId?: string;
}

export interface PurchaseOrder {
    id: string;
    userId: string;
    poNumber: string;
    supplierId: string;
    orderDate: string;
    expectedDeliveryDate: string;
    items: PurchaseOrderItem[];
    status: PurchaseOrderStatus;
    notes: string;
    selectedTerms?: string[];
}

export enum AccountType {
    Asset = 'ASSET',
    Liability = 'LIABILITY',
    Equity = 'EQUITY',
    Revenue = 'REVENUE',
    Expense = 'EXPENSE',
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  isSystemAccount?: boolean; // To prevent deletion of core accounts
}

export interface JournalEntryItem {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  memo: string;
  items: JournalEntryItem[];
}

export interface TimelineEvent {
    id: string;
    date: string;
    title: string;
    description: string;
    type: 'quote' | 'job' | 'invoice' | 'payment';
    status?: string;
    amount?: number;
    relatedId: string;
}

export interface AppState {
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  quotes: Quote[];
  jobOrders: JobOrder[];
  expenses: Expense[];
  settings: CompanySettings;
  inventoryItems: InventoryItem[];
  deliveryChallans: DeliveryChallan[];
  purchaseOrders: PurchaseOrder[];
  accounts: Account[];
  journalEntries: JournalEntry[];
  notifications: Notification[];
}

// Fix: Export the Action type to be used in components like StatusEditor.
export type Action = { type: string, payload: any };
