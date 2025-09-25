import React from 'react';

export type Page = 'dashboard' | 'invoices' | 'quotes' | 'jobs' | 'customers' | 'expenses' | 'settings' | 'reports' | 'inventory' | 'suppliers' | 'deliveryChallans' | 'purchaseOrders' | 'accounts' | 'journalEntries' | 'userManual' | 'recurringInvoices' | 'creditNotes';

export interface NavItem {
  id: Page;
  label: string;
  icon: React.ElementType;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface Notification {
  id: string;
  message: string;
  type: 'invoice-overdue' | 'invoice-reminder' | 'low-stock';
  relatedId: string; // ID of the invoice or inventory item
  timestamp: number;
  read: boolean;
  linkTo?: Page;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  openingBalance: number;
}

export interface Supplier {
  id: string;
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
    taxId?: string;
    taxAmount?: number;
}

export enum InvoiceStatus {
  Draft = 'DRAFT',
  Sent = 'SENT',
  Paid = 'PAID',
  PartiallyPaid = 'PARTIALLY_PAID',
  Overdue = 'OVERDUE',
  Credited = 'CREDITED',
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  accountId: string; // The asset account (Cash, Bank) used for this transaction
  notes?: string;
}

export const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Credit Card', 'Other'];

export interface Invoice {
  id:string;
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
  taxId?: string;
  taxAmount?: number;
}

export interface CreditNoteItem extends InvoiceItem {}

export enum CreditNoteStatus {
  Draft = 'DRAFT',
  Finalized = 'FINALIZED',
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  originalInvoiceId: string;
  customerId: string;
  issueDate: string;
  items: CreditNoteItem[];
  status: CreditNoteStatus;
  reason: string;
  subtotal: number;
  taxAmount: number;
  total: number;
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

export interface LaborLineItem {
  id: string;
  description: string;
  hours: number;
  rate: number;
  total: number;
}

export interface OtherExpenseLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  total: number;
  transactionId?: string; // Link to the main Expense transaction
}

export interface JobCostBreakdown {
  paper: CostLineItem;
  ctp: CostLineItem;
  printing: CostLineItem;
  binding: CostLineItem;
  delivery: CostLineItem;
  labor: LaborLineItem[];
  overhead: CostLineItem;
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
  estimatedCostBreakdown?: JobCostBreakdown | OldJobCostBreakdown;
  actualCostBreakdown?: JobCostBreakdown;
  designImage?: string; // base64 string
  designImageMimeType?: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  debitAccountId: string; // The expense account
  creditAccountId: string; // The account money came from (e.g., cash, bank)
  attachment?: string; // base64 encoded file
  attachmentMimeType?: string; // e.g., 'application/pdf', 'image/jpeg'
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number; // as a percentage, e.g., 5 for 5%
}

export interface CompanySettings {
  name: string;
  headerSVG: string; // base64 string of the SVG header
  footerText: string;
  invoiceTerms: { id: string; text: string }[];
  quoteTerms: { id: string; text: string }[];
  purchaseOrderTerms: { id: string; text: string }[];
  preparedByLabel: string;
  authorizedSignatureLabel: string;
  authorizedSignatureImage?: string; // base64 string
  taxRates: TaxRate[];
  inventoryCategories: { id: string; name: string }[];
  whatsappTemplates: {
    invoice: string;
    quote: string;
    paymentReminder: string;
  };
}

export interface InventoryItem {
  id: string;
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
    PartiallyPaid = 'PARTIALLY_PAID',
    Paid = 'PAID',
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
    poNumber: string;
    supplierId: string;
    orderDate: string;
    expectedDeliveryDate: string;
    items: PurchaseOrderItem[];
    status: PurchaseOrderStatus;
    notes: string;
    payments: Payment[];
    selectedTerms?: string[];
    stockReceived?: boolean;
    taxId?: string;
    taxAmount?: number;
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
  name: string;
  type: AccountType;
  balance: number; // Transactional balance
  openingBalance: number; // Manually set opening balance
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

export interface ChatMessage {
    id: string;
    text: string;
    timestamp: number;
    author: 'customer' | 'staff' | 'system';
}

export interface ChatConversation {
    id: string; // Corresponds to customerId
    customerId: string;
    messages: ChatMessage[];
    lastMessageTimestamp: number;
    unreadByStaff: boolean;
}

export enum RecurringInvoiceFrequency {
    Daily = 'DAILY',
    Weekly = 'WEEKLY',
    Monthly = 'MONTHLY',
    Yearly = 'YEARLY',
}

export interface RecurringInvoice {
  id: string;
  customerId: string;
  frequency: RecurringInvoiceFrequency;
  startDate: string;
  endDate?: string; // Optional end date
  items: InvoiceItem[];
  notes: string;
  discount: number;
  selectedTerms?: string[];
  lastIssueDate: string; // The date of the last invoice that was generated
  isActive: boolean;
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
  recurringInvoices: RecurringInvoice[];
  chatConversations: ChatConversation[];
  creditNotes: CreditNote[];
}

export type Action = { type: string, payload: any };