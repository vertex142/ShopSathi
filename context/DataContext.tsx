import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, getDocs, writeBatch, where, query, addDoc, updateDoc, deleteDoc, runTransaction, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { AppState, Customer, Invoice, Expense, CompanySettings, InventoryItem, Quote, Supplier, DeliveryChallan, PurchaseOrder, Account, JournalEntry, Notification, JobOrder, Payment, AccountType, InvoiceStatus, QuoteStatus, JobStatus, DeliveryChallanItem } from '../types';

const defaultSettings: CompanySettings = {
    name: 'ICON PRINTERS',
    logo: '',
    address: '20, G.A. Bhaban (1st Floor), Unit-1, Anderkilla, Chattogram.',
    phone1: '01841-506102',
    phone2: '01970-506102',
    email: 'iconprinters11@gmail.com',
    tagline: 'Deals in All Kinds of Printing Item',
    services: 'DESIGN | PRINTING | SUPPLIERS',
    footerText: 'Thank you for your business! Please make payment to the provided account.',
    termsAndConditions: [
        { id: 't1', text: 'Payment is due within 30 days of the invoice date.' },
        { id: 't2', text: 'Please inspect all goods upon delivery. All claims must be made within 5 days.' },
    ],
    preparedByLabel: 'Prepared By',
    authorizedSignatureLabel: 'Authorized Signature',
    authorizedSignatureImage: '',
};

const initialAccounts = [
    { id: 'asset-cash', name: 'Cash on Hand', type: AccountType.Asset, balance: 5000, isSystemAccount: true },
    { id: 'asset-ar', name: 'Accounts Receivable', type: AccountType.Asset, balance: 0, isSystemAccount: true },
    { id: 'asset-inventory', name: 'Inventory', type: AccountType.Asset, balance: 0, isSystemAccount: true },
    { id: 'liability-ap', name: 'Accounts Payable', type: AccountType.Liability, balance: 0, isSystemAccount: true },
    { id: 'equity-owner', name: "Owner's Equity", type: AccountType.Equity, balance: 5000, isSystemAccount: true },
    { id: 'revenue-sales', name: 'Sales Revenue', type: AccountType.Revenue, balance: 0, isSystemAccount: true },
];

const initialState: AppState = {
  customers: [], suppliers: [], invoices: [], quotes: [], jobOrders: [], expenses: [],
  inventoryItems: [], deliveryChallans: [], purchaseOrders: [], accounts: [],
  journalEntries: [], notifications: [], settings: defaultSettings,
};

interface DataContextProps {
  state: AppState;
  loading: boolean;
  addCustomer: (customer: Omit<Customer, 'id' | 'userId'>) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'userId'>) => Promise<void>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  addPaymentToInvoice: (invoiceId: string, payment: Payment) => Promise<void>;
  updateSettings: (settings: CompanySettings) => Promise<void>;
  addQuote: (quote: Omit<Quote, 'id' | 'userId'>) => Promise<void>;
  updateQuote: (quote: Quote) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  addJobOrder: (jobOrder: Omit<JobOrder, 'id' | 'userId'>) => Promise<void>;
  updateJobOrder: (jobOrder: JobOrder) => Promise<void>;
  deleteJobOrder: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'userId'>) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'userId'>) => Promise<void>;
  updateInventoryItem: (item: InventoryItem) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'userId'>) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  addDeliveryChallan: (challan: Omit<DeliveryChallan, 'id' | 'userId'>) => Promise<void>;
  updateDeliveryChallan: (challan: DeliveryChallan) => Promise<void>;
  deleteDeliveryChallan: (id: string) => Promise<void>;
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'userId'>) => Promise<void>;
  updatePurchaseOrder: (po: PurchaseOrder) => Promise<void>;
  deletePurchaseOrder: (id: string) => Promise<void>;
  addAccount: (account: Omit<Account, 'id' | 'userId'>) => Promise<void>;
  updateAccount: (account: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'userId'>) => Promise<void>;
  updateJournalEntry: (entry: JournalEntry) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  convertInvoiceToChallan: (invoiceId: string) => Promise<void>;
  convertQuoteToJob: (quoteId: string) => Promise<void>;
  convertQuoteToInvoice: (quoteId: string) => Promise<void>;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>(initialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setState(initialState);
      setLoading(false);
      return;
    }

    setLoading(true);

    const collections: (keyof AppState)[] = ['customers', 'suppliers', 'invoices', 'quotes', 'jobOrders', 'expenses', 'inventoryItems', 'deliveryChallans', 'purchaseOrders', 'accounts', 'journalEntries', 'notifications'];
    
    const unsubscribes = collections.map(colName => {
        const q = query(collection(db, 'users', user.uid, colName));
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as any[];
            setState(prevState => ({ ...prevState, [colName]: data }));
        });
    });

    // Handle settings separately (single document)
    const settingsRef = doc(db, 'users', user.uid, 'data', 'settings');
    const unsubSettings = onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
            setState(prevState => ({ ...prevState, settings: doc.data() as CompanySettings }));
        } else {
             // If no settings, create default ones
            setDoc(settingsRef, defaultSettings);
        }
    });

    // Handle initial account setup
    const checkAndCreateAccounts = async () => {
        const accountsRef = collection(db, 'users', user.uid, 'accounts');
        const accountsSnap = await getDocs(accountsRef);
        if (accountsSnap.empty) {
            const batch = writeBatch(db);
            initialAccounts.forEach(acc => {
                const docRef = doc(accountsRef, acc.id);
                batch.set(docRef, { ...acc, userId: user.uid });
            });
            await batch.commit();
        }
    }
    
    checkAndCreateAccounts().then(() => setLoading(false));

    return () => {
        unsubscribes.forEach(unsub => unsub());
        unsubSettings();
    };
  }, [user]);
  
  // Generic CRUD helpers
  const getCollectionRef = (colName: string) => collection(db, 'users', user!.uid, colName);
  const getDocRef = (colName: string, id: string) => doc(db, 'users', user!.uid, colName, id);

  const addDocWithUserId = async (colName: string, data: any) => {
      if (!user) throw new Error("User not authenticated.");
      await addDoc(getCollectionRef(colName), { ...data, userId: user.uid });
  };
  const updateDocWithUserId = async (colName: string, id: string, data: any) => {
      if (!user) throw new Error("User not authenticated.");
      await updateDoc(getDocRef(colName, id), data);
  };
  const deleteDocWithUserId = async (colName: string, id: string) => {
      if (!user) throw new Error("User not authenticated.");
      await deleteDoc(getDocRef(colName, id));
  };

  // Specific functions exposed to the app
  const addCustomer = async (customer: Omit<Customer, 'id' | 'userId'>) => addDocWithUserId('customers', customer);
  const updateCustomer = async (customer: Customer) => updateDocWithUserId('customers', customer.id, customer);
  const deleteCustomer = async (id: string) => deleteDocWithUserId('customers', id);

  const addInvoice = async (invoice: Omit<Invoice, 'id' | 'userId'>) => addDocWithUserId('invoices', invoice);
  const updateInvoice = async (invoice: Invoice) => updateDocWithUserId('invoices', invoice.id, invoice);
  const deleteInvoice = async (id: string) => deleteDocWithUserId('invoices', id);

  const addPaymentToInvoice = async (invoiceId: string, payment: Payment) => {
    if (!user) throw new Error("Not authenticated");
    const invoiceRef = getDocRef('invoices', invoiceId);
    
    await runTransaction(db, async (transaction) => {
        const invoiceDoc = await transaction.get(invoiceRef);
        if (!invoiceDoc.exists()) throw "Invoice does not exist!";
        
        const invoiceData = invoiceDoc.data() as Invoice;
        const newPayments = [...(invoiceData.payments || []), payment];
        
        const subtotal = invoiceData.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
        const grandTotal = subtotal + (invoiceData.previousDue || 0) - (invoiceData.discount || 0);
        const totalPaid = newPayments.reduce((acc, p) => acc + p.amount, 0);

        let newStatus = invoiceData.status;
        if (totalPaid >= grandTotal) {
            // Fix: Use InvoiceStatus enum member instead of string literal.
            newStatus = InvoiceStatus.Paid;
        } else {
            // Fix: Use InvoiceStatus enum member instead of string literal.
            newStatus = InvoiceStatus.PartiallyPaid;
        }

        transaction.update(invoiceRef, { payments: newPayments, status: newStatus });
        // You would also create journal entries here in a real scenario
    });
  };

  const updateSettings = async (settings: CompanySettings) => {
    if (!user) throw new Error("Not authenticated");
    await setDoc(doc(db, 'users', user.uid, 'data', 'settings'), settings);
  }

    // --- Quotes ---
    const addQuote = async (quote: Omit<Quote, 'id' | 'userId'>) => addDocWithUserId('quotes', quote);
    const updateQuote = async (quote: Quote) => updateDocWithUserId('quotes', quote.id, quote);
    const deleteQuote = async (id: string) => deleteDocWithUserId('quotes', id);

    // --- Job Orders ---
    const addJobOrder = async (jobOrder: Omit<JobOrder, 'id' | 'userId'>) => addDocWithUserId('jobOrders', jobOrder);
    const updateJobOrder = async (jobOrder: JobOrder) => updateDocWithUserId('jobOrders', jobOrder.id, jobOrder);
    const deleteJobOrder = async (id: string) => deleteDocWithUserId('jobOrders', id);
    
    // --- Expenses ---
    const addExpense = async (expense: Omit<Expense, 'id'|'userId'>) => addDocWithUserId('expenses', expense);
    const updateExpense = async (expense: Expense) => updateDocWithUserId('expenses', expense.id, expense);
    const deleteExpense = async (id: string) => deleteDocWithUserId('expenses', id);

    // --- Inventory ---
    const addInventoryItem = async (item: Omit<InventoryItem, 'id'|'userId'>) => addDocWithUserId('inventoryItems', item);
    const updateInventoryItem = async (item: InventoryItem) => updateDocWithUserId('inventoryItems', item.id, item);
    const deleteInventoryItem = async (id: string) => deleteDocWithUserId('inventoryItems', id);

    // --- Suppliers ---
    const addSupplier = async (supplier: Omit<Supplier, 'id'|'userId'>) => addDocWithUserId('suppliers', supplier);
    const updateSupplier = async (supplier: Supplier) => updateDocWithUserId('suppliers', supplier.id, supplier);
    const deleteSupplier = async (id: string) => deleteDocWithUserId('suppliers', id);

    // --- Delivery Challans ---
    const addDeliveryChallan = async (challan: Omit<DeliveryChallan, 'id'|'userId'>) => addDocWithUserId('deliveryChallans', challan);
    const updateDeliveryChallan = async (challan: DeliveryChallan) => updateDocWithUserId('deliveryChallans', challan.id, challan);
    const deleteDeliveryChallan = async (id: string) => deleteDocWithUserId('deliveryChallans', id);
    
    // --- Purchase Orders ---
    const addPurchaseOrder = async (po: Omit<PurchaseOrder, 'id'|'userId'>) => addDocWithUserId('purchaseOrders', po);
    const updatePurchaseOrder = async (po: PurchaseOrder) => updateDocWithUserId('purchaseOrders', po.id, po);
    const deletePurchaseOrder = async (id: string) => deleteDocWithUserId('purchaseOrders', id);

    // --- Accounts ---
    const addAccount = async (account: Omit<Account, 'id'|'userId'>) => addDocWithUserId('accounts', account);
    const updateAccount = async (account: Account) => updateDocWithUserId('accounts', account.id, account);
    const deleteAccount = async (id: string) => deleteDocWithUserId('accounts', id);

    // --- Journal Entries ---
    const addJournalEntry = async (entry: Omit<JournalEntry, 'id'|'userId'>) => addDocWithUserId('journalEntries', entry);
    const updateJournalEntry = async (entry: JournalEntry) => updateDocWithUserId('journalEntries', entry.id, entry);
    const deleteJournalEntry = async (id: string) => deleteDocWithUserId('journalEntries', id);
    
    // --- Notifications ---
    const markAllNotificationsAsRead = async () => {
        if (!user) throw new Error("Not authenticated");
        const batch = writeBatch(db);
        state.notifications.forEach(notification => {
            if (!notification.read) {
                const docRef = getDocRef('notifications', notification.id);
                batch.update(docRef, { read: true });
            }
        });
        await batch.commit();
    };
    
    // --- Business Logic ---
    const convertInvoiceToChallan = async (invoiceId: string) => {
        if (!user) throw new Error("Not authenticated");
        const invoiceRef = getDocRef('invoices', invoiceId);
        await runTransaction(db, async (transaction) => {
            const invoiceDoc = await transaction.get(invoiceRef);
            if (!invoiceDoc.exists()) throw "Invoice does not exist!";
            const invoiceData = invoiceDoc.data() as Invoice;

            const newChallanItems: DeliveryChallanItem[] = invoiceData.items.map(item => ({
                id: crypto.randomUUID(),
                name: item.name,
                description: item.description,
                quantity: item.quantity,
                inventoryItemId: item.inventoryItemId
            }));

            const newChallan: Omit<DeliveryChallan, 'id' | 'userId'> = {
                challanNumber: `DCH-FROM-${invoiceData.invoiceNumber}`,
                customerId: invoiceData.customerId,
                issueDate: new Date().toISOString().split('T')[0],
                items: newChallanItems,
                notes: `Generated from Invoice #${invoiceData.invoiceNumber}`,
            };
            
            const newChallanRef = doc(getCollectionRef('deliveryChallans'));
            transaction.set(newChallanRef, { ...newChallan, userId: user.uid, invoiceId: invoiceId });
            transaction.update(invoiceRef, { challanId: newChallanRef.id });
        });
    };

    const convertQuoteToJob = async (quoteId: string) => {
        if (!user) throw new Error("Not authenticated");
        const quoteRef = getDocRef('quotes', quoteId);
        await runTransaction(db, async (transaction) => {
            const quoteDoc = await transaction.get(quoteRef);
            if (!quoteDoc.exists()) throw "Quote does not exist!";
            const quoteData = quoteDoc.data() as Quote;
            
            const newJob: Omit<JobOrder, 'id' | 'userId'> = {
                jobName: `Job from Quote #${quoteData.quoteNumber}`,
                customerId: quoteData.customerId,
                orderDate: new Date().toISOString().split('T')[0],
                dueDate: '', 
                status: JobStatus.Pending,
                description: quoteData.items.map(i => `${i.name} (Qty: ${i.quantity})`).join('\n'),
                quantity: quoteData.items.reduce((sum, item) => sum + item.quantity, 0),
                price: quoteData.items.reduce((sum, item) => sum + item.quantity * item.rate, 0) - (quoteData.discount || 0),
                paperType: '', size: '', finishing: '',
                notes: `Converted from Quote #${quoteData.quoteNumber}.\n${quoteData.notes}`,
                materialsUsed: [],
                inventoryConsumed: false,
            };
            const newJobRef = doc(getCollectionRef('jobOrders'));
            transaction.set(newJobRef, { ...newJob, userId: user.uid });
            transaction.update(quoteRef, { status: QuoteStatus.Converted, convertedToJobId: newJobRef.id });
        });
    };

    const convertQuoteToInvoice = async (quoteId: string) => {
        if (!user) throw new Error("Not authenticated");
        const quoteRef = getDocRef('quotes', quoteId);
        await runTransaction(db, async (transaction) => {
            const quoteDoc = await transaction.get(quoteRef);
            if (!quoteDoc.exists()) throw "Quote does not exist!";
            const quoteData = quoteDoc.data() as Quote;
            
            const newInvoice: Omit<Invoice, 'id' | 'userId'> = {
                invoiceNumber: `INV-FROM-${quoteData.quoteNumber}`,
                customerId: quoteData.customerId,
                issueDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
                items: quoteData.items,
                status: InvoiceStatus.Draft,
                notes: quoteData.notes,
                payments: [],
                previousDue: 0, // Should be calculated
                discount: quoteData.discount,
                selectedTerms: quoteData.selectedTerms,
            };

            const newInvoiceRef = doc(getCollectionRef('invoices'));
            transaction.set(newInvoiceRef, { ...newInvoice, userId: user.uid });
            transaction.update(quoteRef, { status: QuoteStatus.Converted, convertedToInvoiceId: newInvoiceRef.id });
        });
    };

  const value = {
    state,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    addPaymentToInvoice,
    updateSettings,
    addQuote,
    updateQuote,
    deleteQuote,
    addJobOrder,
    updateJobOrder,
    deleteJobOrder,
    addExpense,
    updateExpense,
    deleteExpense,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addDeliveryChallan,
    updateDeliveryChallan,
    deleteDeliveryChallan,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    addAccount,
    updateAccount,
    deleteAccount,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    markAllNotificationsAsRead,
    convertInvoiceToChallan,
    convertQuoteToJob,
    convertQuoteToInvoice,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextProps => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
