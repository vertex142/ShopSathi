import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { AppState, Action, CompanySettings, AccountType, InvoiceStatus, JobStatus, QuoteStatus, DeliveryChallanItem, PurchaseOrderStatus, PurchaseOrder, JobOrder, Payment, JournalEntry, Expense, Invoice, Quote, DeliveryChallan, JournalEntryItem, ChatMessage } from '../types';
import { generateNotifications } from '../utils/notificationGenerator';
import { generateNextDocumentNumber } from '../utils/documentNumber';

const defaultSettings: CompanySettings = {
    name: 'Your Company Name',
    logo: '',
    address: '',
    phone1: '',
    phone2: '',
    email: '',
    tagline: '',
    services: '',
    footerText: '',
    invoiceTerms: [],
    quoteTerms: [],
    purchaseOrderTerms: [],
    preparedByLabel: 'Prepared By',
    authorizedSignatureLabel: 'Authorized Signature',
    authorizedSignatureImage: '',
};

const initialAccounts = [
    { id: 'asset-cash', name: 'Cash on Hand', type: AccountType.Asset, balance: 0, isSystemAccount: true },
    { id: 'asset-ar', name: 'Accounts Receivable', type: AccountType.Asset, balance: 0, isSystemAccount: true },
    { id: 'asset-inventory', name: 'Inventory', type: AccountType.Asset, balance: 0, isSystemAccount: true },
    { id: 'liability-ap', name: 'Accounts Payable', type: AccountType.Liability, balance: 0, isSystemAccount: true },
    { id: 'equity-owner', name: "Owner's Equity", type: AccountType.Equity, balance: 0, isSystemAccount: true },
    { id: 'revenue-sales', name: 'Sales Revenue', type: AccountType.Revenue, balance: 0, isSystemAccount: true },
    { id: 'expense-cogs', name: 'Cost of Goods Sold', type: AccountType.Expense, balance: 0, isSystemAccount: true },
];

const initialState: AppState = {
  customers: [], suppliers: [], invoices: [], quotes: [], jobOrders: [], expenses: [],
  inventoryItems: [], deliveryChallans: [], purchaseOrders: [], accounts: initialAccounts,
  journalEntries: [], notifications: [], settings: defaultSettings, chatConversations: [],
};

const dataReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    // --- CUSTOMERS ---
    case 'ADD_CUSTOMER':
      return { ...state, customers: [...state.customers, action.payload] };
    case 'UPDATE_CUSTOMER':
      return { ...state, customers: state.customers.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CUSTOMER':
      return { ...state, customers: state.customers.filter(c => c.id !== action.payload) };

    // --- INVOICES ---
    case 'ADD_INVOICE':
      return { ...state, invoices: [...state.invoices, { ...action.payload, id: crypto.randomUUID() }] };
    case 'UPDATE_INVOICE':
      return { ...state, invoices: state.invoices.map(i => i.id === action.payload.id ? action.payload : i) };
    case 'DELETE_INVOICE':
      return { ...state, invoices: state.invoices.filter(i => i.id !== action.payload) };
    
    // --- PAYMENTS ---
    case 'ADD_PAYMENT_TO_INVOICE': {
      const { invoiceId, payment } = action.payload as { invoiceId: string, payment: Payment };
      const invoice = state.invoices.find(inv => inv.id === invoiceId);
      if (!invoice) return state;

      const updatedInvoices = state.invoices.map(inv => {
          if (inv.id === invoiceId) {
              const newPayments = [...(inv.payments || []), payment];
              const subtotal = inv.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
              const grandTotal = subtotal + (inv.previousDue || 0) - (inv.discount || 0);
              const totalPaid = newPayments.reduce((acc, p) => acc + p.amount, 0);

              let newStatus = inv.status;
              if (totalPaid >= grandTotal) {
                  newStatus = InvoiceStatus.Paid;
              } else {
                  newStatus = InvoiceStatus.PartiallyPaid;
              }
              return { ...inv, payments: newPayments, status: newStatus };
          }
          return inv;
      });

      // Accounting Logic
      const newJournalEntry: JournalEntry = {
        id: crypto.randomUUID(),
        date: payment.date,
        memo: `Payment for Invoice #${invoice.invoiceNumber}`,
        items: [
            { id: crypto.randomUUID(), accountId: payment.accountId, debit: payment.amount, credit: 0 },
            { id: crypto.randomUUID(), accountId: 'asset-ar', debit: 0, credit: payment.amount },
        ],
      };
      const updatedAccounts = state.accounts.map(acc => {
          if (acc.id === payment.accountId) return { ...acc, balance: acc.balance + payment.amount };
          if (acc.id === 'asset-ar') return { ...acc, balance: acc.balance - payment.amount };
          return acc;
      });

      return {
          ...state,
          invoices: updatedInvoices,
          accounts: updatedAccounts,
          journalEntries: [...state.journalEntries, newJournalEntry],
      };
    }

    case 'RECEIVE_CUSTOMER_PAYMENT': {
        const { customerId, payment } = action.payload as { customerId: string, payment: Payment };
        const customer = state.customers.find(c => c.id === customerId);
        if(!customer) return state;

        let remainingPayment = payment.amount;
        const updatedInvoices = [...state.invoices];

        const dueInvoices = updatedInvoices
            .filter(inv => inv.customerId === customerId && inv.status !== InvoiceStatus.Paid && inv.status !== InvoiceStatus.Draft)
            .sort((a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime());

        for (const invoice of dueInvoices) {
            if (remainingPayment <= 0) break;

            const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
            const grandTotal = subtotal + (invoice.previousDue || 0) - (invoice.discount || 0);
            const totalPaid = (invoice.payments || []).reduce((acc, p) => acc + p.amount, 0);
            const balanceDue = grandTotal - totalPaid;

            if (balanceDue > 0) {
                const paymentToApply = Math.min(remainingPayment, balanceDue);
                const newPayment: Payment = { ...payment, amount: paymentToApply, id: crypto.randomUUID() };

                invoice.payments = [...(invoice.payments || []), newPayment];
                
                const newTotalPaid = totalPaid + paymentToApply;
                if (newTotalPaid >= grandTotal) {
                    invoice.status = InvoiceStatus.Paid;
                } else {
                    invoice.status = InvoiceStatus.PartiallyPaid;
                }
                
                remainingPayment -= paymentToApply;
            }
        }

        // Accounting Logic
        const newJournalEntry: JournalEntry = {
            id: crypto.randomUUID(),
            date: payment.date,
            memo: `Lump sum payment from ${customer.name}`,
            items: [
                { id: crypto.randomUUID(), accountId: payment.accountId, debit: payment.amount, credit: 0 },
                { id: crypto.randomUUID(), accountId: 'asset-ar', debit: 0, credit: payment.amount },
            ],
        };
        const updatedAccounts = state.accounts.map(acc => {
            if (acc.id === payment.accountId) return { ...acc, balance: acc.balance + payment.amount };
            if (acc.id === 'asset-ar') return { ...acc, balance: acc.balance - payment.amount };
            return acc;
        });

        return { 
            ...state, 
            invoices: updatedInvoices,
            accounts: updatedAccounts,
            journalEntries: [...state.journalEntries, newJournalEntry],
        };
    }

    case 'MAKE_SUPPLIER_PAYMENT': {
        const { supplierId, payment } = action.payload as { supplierId: string, payment: Payment };
        const supplier = state.suppliers.find(s => s.id === supplierId);
        if (!supplier) return state;
        
        let remainingPayment = payment.amount;
        const updatedPurchaseOrders = [...state.purchaseOrders];

        const duePOs = updatedPurchaseOrders
            .filter(po => po.supplierId === supplierId && po.status !== PurchaseOrderStatus.Paid && po.status !== PurchaseOrderStatus.Cancelled)
            .sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime());

        for (const po of duePOs) {
            if (remainingPayment <= 0) break;

            const grandTotal = po.items.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
            const totalPaid = (po.payments || []).reduce((acc, p) => acc + p.amount, 0);
            const balanceDue = grandTotal - totalPaid;

            if (balanceDue > 0) {
                const paymentToApply = Math.min(remainingPayment, balanceDue);
                const newPayment: Payment = { ...payment, amount: paymentToApply, id: crypto.randomUUID() };
                
                po.payments = [...(po.payments || []), newPayment];
                
                const newTotalPaid = totalPaid + paymentToApply;
                if (newTotalPaid >= grandTotal) {
                    po.status = PurchaseOrderStatus.Paid;
                } else {
                    po.status = PurchaseOrderStatus.PartiallyPaid;
                }

                remainingPayment -= paymentToApply;
            }
        }
        
        // Accounting Logic
        const newJournalEntry: JournalEntry = {
            id: crypto.randomUUID(),
            date: payment.date,
            memo: `Payment to supplier ${supplier.name}`,
            items: [
                { id: crypto.randomUUID(), accountId: 'liability-ap', debit: payment.amount, credit: 0 },
                { id: crypto.randomUUID(), accountId: payment.accountId, debit: 0, credit: payment.amount },
            ]
        };
        const updatedAccounts = state.accounts.map(acc => {
            if (acc.id === 'liability-ap') return { ...acc, balance: acc.balance - payment.amount };
            if (acc.id === payment.accountId) return { ...acc, balance: acc.balance - payment.amount };
            return acc;
        });

        return { 
            ...state, 
            purchaseOrders: updatedPurchaseOrders,
            accounts: updatedAccounts,
            journalEntries: [...state.journalEntries, newJournalEntry],
        };
    }

    // --- QUOTES ---
    case 'ADD_QUOTE':
        return { ...state, quotes: [...state.quotes, { ...action.payload, id: crypto.randomUUID() }] };
    case 'UPDATE_QUOTE':
        return { ...state, quotes: state.quotes.map(q => q.id === action.payload.id ? action.payload : q) };
    case 'DELETE_QUOTE':
        return { ...state, quotes: state.quotes.filter(q => q.id !== action.payload) };

    // --- JOB ORDERS ---
    case 'ADD_JOB_ORDER':
        return { ...state, jobOrders: [...state.jobOrders, { ...action.payload, id: crypto.randomUUID() }] };
    case 'UPDATE_JOB_ORDER': {
        const oldJob = state.jobOrders.find(j => j.id === action.payload.id);
        const newJob: JobOrder = action.payload;
        let inventoryItemsForJobUpdate = [...state.inventoryItems];
    
        const isNowComplete = newJob.status === JobStatus.Completed || newJob.status === JobStatus.Delivered;
        const wasComplete = oldJob?.status === JobStatus.Completed || oldJob?.status === JobStatus.Delivered;

        if (isNowComplete && !wasComplete && !newJob.inventoryConsumed) {
            newJob.materialsUsed.forEach(material => {
                inventoryItemsForJobUpdate = inventoryItemsForJobUpdate.map(invItem => {
                    if (invItem.id === material.itemId) {
                        return { ...invItem, stockQuantity: invItem.stockQuantity - material.quantity };
                    }
                    return invItem;
                });
            });
            newJob.inventoryConsumed = true; // Mark as consumed
        }
        else if (!isNowComplete && wasComplete && oldJob?.inventoryConsumed) {
            oldJob.materialsUsed.forEach(material => { // use oldJob materials in case they were edited
                inventoryItemsForJobUpdate = inventoryItemsForJobUpdate.map(invItem => {
                    if (invItem.id === material.itemId) {
                        return { ...invItem, stockQuantity: invItem.stockQuantity + material.quantity };
                    }
                    return invItem;
                });
            });
            newJob.inventoryConsumed = false; // Mark as not consumed
        }
    
        return { 
            ...state, 
            inventoryItems: inventoryItemsForJobUpdate,
            jobOrders: state.jobOrders.map(j => j.id === newJob.id ? newJob : j) 
        };
    }
    case 'DELETE_JOB_ORDER':
        return { ...state, jobOrders: state.jobOrders.filter(j => j.id !== action.payload) };

    // --- EXPENSES ---
    case 'ADD_EXPENSE': {
        const newExpense = { ...action.payload, id: crypto.randomUUID() } as Expense;
        
        const newJournalEntry: JournalEntry = {
            id: crypto.randomUUID(),
            date: newExpense.date,
            memo: `Expense: ${newExpense.description}`,
            items: [
                { id: crypto.randomUUID(), accountId: newExpense.debitAccountId, debit: newExpense.amount, credit: 0 },
                { id: crypto.randomUUID(), accountId: newExpense.creditAccountId, debit: 0, credit: newExpense.amount },
            ],
        };

        const updatedAccounts = state.accounts.map(acc => {
            if (acc.id === newExpense.debitAccountId) return { ...acc, balance: acc.balance + newExpense.amount };
            if (acc.id === newExpense.creditAccountId) return { ...acc, balance: acc.balance - newExpense.amount };
            return acc;
        });

        return { 
            ...state, 
            expenses: [...state.expenses, newExpense],
            accounts: updatedAccounts,
            journalEntries: [...state.journalEntries, newJournalEntry],
        };
    }
    case 'UPDATE_EXPENSE': {
        const newExpense = action.payload as Expense;
        const oldExpense = state.expenses.find(e => e.id === newExpense.id);
        if (!oldExpense) return state;

        // Create reversal entry for the old transaction
        const reversalJournalEntry: JournalEntry = {
            id: crypto.randomUUID(),
            date: oldExpense.date,
            memo: `Reversal of expense: ${oldExpense.description}`,
            items: [
                { id: crypto.randomUUID(), accountId: oldExpense.creditAccountId, debit: oldExpense.amount, credit: 0 },
                { id: crypto.randomUUID(), accountId: oldExpense.debitAccountId, debit: 0, credit: oldExpense.amount },
            ],
        };
        // Create new entry for the updated transaction
         const newJournalEntry: JournalEntry = {
            id: crypto.randomUUID(),
            date: newExpense.date,
            memo: `Expense: ${newExpense.description}`,
            items: [
                { id: crypto.randomUUID(), accountId: newExpense.debitAccountId, debit: newExpense.amount, credit: 0 },
                { id: crypto.randomUUID(), accountId: newExpense.creditAccountId, debit: 0, credit: newExpense.amount },
            ],
        };

        // Update account balances
        const accountsAfterReversal = state.accounts.map(acc => {
            if (acc.id === oldExpense.creditAccountId) return { ...acc, balance: acc.balance + oldExpense.amount };
            if (acc.id === oldExpense.debitAccountId) return { ...acc, balance: acc.balance - oldExpense.amount };
            return acc;
        });
        const finalAccounts = accountsAfterReversal.map(acc => {
            if (acc.id === newExpense.debitAccountId) return { ...acc, balance: acc.balance + newExpense.amount };
            if (acc.id === newExpense.creditAccountId) return { ...acc, balance: acc.balance - newExpense.amount };
            return acc;
        });

        return {
            ...state,
            expenses: state.expenses.map(e => (e.id === newExpense.id ? newExpense : e)),
            accounts: finalAccounts,
            journalEntries: [...state.journalEntries, reversalJournalEntry, newJournalEntry],
        };
    }
    case 'DELETE_EXPENSE': {
        const expenseToDelete = state.expenses.find(e => e.id === action.payload);
        if (!expenseToDelete) return state;

        const reversalJournalEntry: JournalEntry = {
            id: crypto.randomUUID(),
            date: expenseToDelete.date,
            memo: `Reversal for deleted expense: ${expenseToDelete.description}`,
            items: [
                { id: crypto.randomUUID(), accountId: expenseToDelete.creditAccountId, debit: expenseToDelete.amount, credit: 0 },
                { id: crypto.randomUUID(), accountId: expenseToDelete.debitAccountId, debit: 0, credit: expenseToDelete.amount },
            ],
        };
        const updatedAccounts = state.accounts.map(acc => {
            if (acc.id === expenseToDelete.creditAccountId) return { ...acc, balance: acc.balance + expenseToDelete.amount };
            if (acc.id === expenseToDelete.debitAccountId) return { ...acc, balance: acc.balance - expenseToDelete.amount };
            return acc;
        });

        return {
            ...state,
            expenses: state.expenses.filter(e => e.id !== action.payload),
            accounts: updatedAccounts,
            journalEntries: [...state.journalEntries, reversalJournalEntry],
        };
    }

    // --- SETTINGS ---
    case 'UPDATE_SETTINGS':
      return { ...state, settings: action.payload };
    case 'IMPORT_DATA':
        // A simple overwrite. A more robust importer would validate the data.
        return { ...initialState, ...action.payload };
    case 'RESET_APP':
        // Here we could clear localStorage too, but useLocalStorage hook handles it.
        return initialState;

    // --- SUPPLIERS ---
    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [...state.suppliers, { ...action.payload, id: crypto.randomUUID() }] };
    case 'UPDATE_SUPPLIER':
      return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_SUPPLIER':
      return { ...state, suppliers: state.suppliers.filter(s => s.id !== action.payload) };

    // --- INVENTORY ---
    case 'ADD_INVENTORY_ITEM':
      return { ...state, inventoryItems: [...state.inventoryItems, { ...action.payload, id: crypto.randomUUID() }] };
    case 'UPDATE_INVENTORY_ITEM':
      return { ...state, inventoryItems: state.inventoryItems.map(i => i.id === action.payload.id ? action.payload : i) };
    case 'DELETE_INVENTORY_ITEM':
      return { ...state, inventoryItems: state.inventoryItems.filter(i => i.id !== action.payload) };
      
    // --- DELIVERY CHALLANS ---
    case 'ADD_DELIVERY_CHALLAN':
      return { ...state, deliveryChallans: [...state.deliveryChallans, { ...action.payload, id: crypto.randomUUID() }] };
    case 'UPDATE_DELIVERY_CHALLAN':
      return { ...state, deliveryChallans: state.deliveryChallans.map(d => d.id === action.payload.id ? action.payload : d) };
    case 'DELETE_DELIVERY_CHALLAN':
      return { ...state, deliveryChallans: state.deliveryChallans.filter(d => d.id !== action.payload) };

    // --- PURCHASE ORDERS ---
    case 'ADD_PURCHASE_ORDER':
        return { ...state, purchaseOrders: [...state.purchaseOrders, { ...action.payload, id: crypto.randomUUID() }] };
    case 'UPDATE_PURCHASE_ORDER': {
        const oldPO = state.purchaseOrders.find(p => p.id === action.payload.id);
        const newPO: PurchaseOrder = action.payload;
        let inventoryItemsForPOUpdate = [...state.inventoryItems];

        const isNowComplete = newPO.status === PurchaseOrderStatus.Completed || newPO.status === PurchaseOrderStatus.PartiallyReceived;
        const wasComplete = oldPO?.status === PurchaseOrderStatus.Completed || oldPO?.status === PurchaseOrderStatus.PartiallyReceived;

        if (isNowComplete && !wasComplete && !newPO.stockReceived) {
            newPO.items.forEach(item => {
                if (item.inventoryItemId) {
                    inventoryItemsForPOUpdate = inventoryItemsForPOUpdate.map(invItem => {
                        if (invItem.id === item.inventoryItemId) {
                            return { ...invItem, stockQuantity: invItem.stockQuantity + item.quantity };
                        }
                        return invItem;
                    });
                }
            });
            newPO.stockReceived = true;
        }
        else if (!isNowComplete && wasComplete && oldPO?.stockReceived) {
             oldPO.items.forEach(item => {
                if (item.inventoryItemId) {
                    inventoryItemsForPOUpdate = inventoryItemsForPOUpdate.map(invItem => {
                        if (invItem.id === item.inventoryItemId) {
                            return { ...invItem, stockQuantity: invItem.stockQuantity - item.quantity };
                        }
                        return invItem;
                    });
                }
            });
            newPO.stockReceived = false;
        }

        return { 
            ...state, 
            inventoryItems: inventoryItemsForPOUpdate,
            purchaseOrders: state.purchaseOrders.map(p => p.id === newPO.id ? newPO : p) 
        };
    }
    case 'DELETE_PURCHASE_ORDER':
        return { ...state, purchaseOrders: state.purchaseOrders.filter(p => p.id !== action.payload) };
        
    // --- ACCOUNTS ---
    case 'ADD_ACCOUNT':
        const newAccount = { ...action.payload, id: crypto.randomUUID(), balance: action.payload.balance || 0 };
        return { ...state, accounts: [...state.accounts, newAccount] };
    case 'UPDATE_ACCOUNT':
        return { ...state, accounts: state.accounts.map(a => a.id === action.payload.id ? action.payload : a) };
    case 'DELETE_ACCOUNT':
        return { ...state, accounts: state.accounts.filter(a => a.id !== action.payload) };

    // --- JOURNAL ENTRIES ---
    case 'ADD_JOURNAL_ENTRY': {
        const newEntry = { ...action.payload, id: crypto.randomUUID() };
        let accountsForAdd = [...state.accounts];
        newEntry.items.forEach((item: JournalEntryItem) => {
            accountsForAdd = accountsForAdd.map(acc => {
                if (acc.id === item.accountId) {
                    return { ...acc, balance: acc.balance + item.debit - item.credit };
                }
                return acc;
            });
        });
        return { 
            ...state, 
            journalEntries: [...state.journalEntries, newEntry],
            accounts: accountsForAdd,
        };
    }
    case 'UPDATE_JOURNAL_ENTRY': // Manual updates are complex, typically handled by reversing and re-posting.
        return state;
    case 'DELETE_JOURNAL_ENTRY': {
        const entryToDelete = state.journalEntries.find(je => je.id === action.payload);
        if (!entryToDelete) return state;
        let accountsForDelete = [...state.accounts];
        entryToDelete.items.forEach((item: JournalEntryItem) => {
             accountsForDelete = accountsForDelete.map(acc => {
                if (acc.id === item.accountId) {
                    // Reverse the entry
                    return { ...acc, balance: acc.balance - item.debit + item.credit };
                }
                return acc;
            });
        });
        return {
            ...state,
            journalEntries: state.journalEntries.filter(je => je.id !== action.payload),
            accounts: accountsForDelete,
        };
    }
    // --- CHAT ---
    case 'SEND_CHAT_MESSAGE': {
// FIX: The type assertion for `author` was too narrow. It has been updated to include 'system' to match the updated ChatMessage type.
      const { customerId, text, author } = action.payload as { customerId: string, text: string, author: 'staff' | 'customer' | 'system' };
      const conversations = [...state.chatConversations];
      let conversation = conversations.find(c => c.customerId === customerId);
      
      const newMessage: ChatMessage = {
        id: crypto.randomUUID(),
        author,
        text,
        timestamp: Date.now(),
        readByStaff: author === 'staff',
      };

      if (conversation) {
        conversation.messages.push(newMessage);
        conversation.lastMessageTimestamp = newMessage.timestamp;
        conversation.unreadByStaff = author === 'customer';
      } else {
        conversation = {
          id: customerId,
          customerId,
          messages: [newMessage],
          lastMessageTimestamp: newMessage.timestamp,
          unreadByStaff: author === 'customer',
        };
        conversations.push(conversation);
      }
      
      return { ...state, chatConversations: conversations };
    }
    case 'MARK_CHAT_AS_READ': {
        const conversationId = action.payload as string;
        return {
            ...state,
            chatConversations: state.chatConversations.map(c => 
                c.id === conversationId ? { ...c, unreadByStaff: false } : c
            )
        };
    }

    // --- NOTIFICATIONS ---
    case 'ADD_NOTIFICATIONS':
        const newNotifications = action.payload.filter((newNotif: any) => 
            !state.notifications.some(existing => existing.relatedId === newNotif.relatedId && existing.type === newNotif.type)
        );
        return { ...state, notifications: [...state.notifications, ...newNotifications] };
    case 'MARK_ALL_NOTIFICATIONS_AS_READ':
        return { ...state, notifications: state.notifications.map(n => ({...n, read: true})) };

    // --- CONVERSIONS ---
    case 'CONVERT_QUOTE_TO_JOB': {
        const quote = state.quotes.find(q => q.id === action.payload);
        if (!quote || quote.convertedToJobId) return state;

        const newJob: Omit<JobOrder, 'id'> = {
            jobName: `Job from Quote #${quote.quoteNumber}`,
            customerId: quote.customerId,
            orderDate: new Date().toISOString().split('T')[0],
            dueDate: '',
            status: JobStatus.Pending,
            description: quote.items.map(i => i.name).join(', '),
            quantity: 1, // Default quantity, user should edit
            paperType: '',
            size: '',
            finishing: '',
            price: quote.items.reduce((sum, item) => sum + item.quantity * item.rate, 0) - (quote.discount || 0),
            notes: `Converted from Quote #${quote.quoteNumber}. \n\nOriginal notes: ${quote.notes}`,
            materialsUsed: [],
            inventoryConsumed: false,
        };
        const newJobId = crypto.randomUUID();
        const updatedQuote: Quote = { ...quote, status: QuoteStatus.Converted, convertedToJobId: newJobId };

        return {
            ...state,
            quotes: state.quotes.map(q => q.id === quote.id ? updatedQuote : q),
            jobOrders: [...state.jobOrders, { ...newJob, id: newJobId }],
        };
    }
    case 'CONVERT_QUOTE_TO_INVOICE': {
        const quote = state.quotes.find(q => q.id === action.payload);
        if (!quote || quote.convertedToInvoiceId) return state;

        const newInvoice: Omit<Invoice, 'id'> = {
            invoiceNumber: generateNextDocumentNumber(state.invoices, 'invoiceNumber', 'INV-'),
            customerId: quote.customerId,
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
            items: quote.items,
            status: InvoiceStatus.Draft,
            notes: `Converted from Quote #${quote.quoteNumber}. \n\nOriginal notes: ${quote.notes}`,
            payments: [],
            previousDue: 0, // Should be calculated
            discount: quote.discount,
            selectedTerms: quote.selectedTerms,
        };
        const newInvoiceId = crypto.randomUUID();
        const updatedQuote: Quote = { ...quote, status: QuoteStatus.Converted, convertedToInvoiceId: newInvoiceId };

        return {
            ...state,
            quotes: state.quotes.map(q => q.id === quote.id ? updatedQuote : q),
            invoices: [...state.invoices, { ...newInvoice, id: newInvoiceId }],
        };
    }
    case 'CONVERT_INVOICE_TO_CHALLAN': {
        const invoice = state.invoices.find(inv => inv.id === action.payload);
        if (!invoice || invoice.challanId) return state;
        
        const newChallan: Omit<DeliveryChallan, 'id'> = {
            challanNumber: generateNextDocumentNumber(state.deliveryChallans, 'challanNumber', 'DCH-'),
            customerId: invoice.customerId,
            issueDate: new Date().toISOString().split('T')[0],
            items: invoice.items.map(item => ({
                id: item.id,
                name: item.name,
                description: item.description,
                quantity: item.quantity,
                inventoryItemId: item.inventoryItemId,
            })),
            notes: `Delivery for Invoice #${invoice.invoiceNumber}`,
            invoiceId: invoice.id,
        };
        const newChallanId = crypto.randomUUID();
        const updatedInvoice: Invoice = { ...invoice, challanId: newChallanId };

        return {
            ...state,
            invoices: state.invoices.map(inv => inv.id === invoice.id ? updatedInvoice : inv),
            deliveryChallans: [...state.deliveryChallans, { ...newChallan, id: newChallanId }],
        };
    }

    default:
      return state;
  }
};

const DataContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action>; } | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [storedState, setStoredState] = useLocalStorage<AppState>('shopSathiData', initialState);

  const [state, dispatch] = useReducer(dataReducer, storedState);
  
  useEffect(() => {
    setStoredState(state);
  }, [state, setStoredState]);

  useEffect(() => {
      const newNotifications = generateNotifications(state);
      if (newNotifications.length > 0) {
          dispatch({ type: 'ADD_NOTIFICATIONS', payload: newNotifications });
      }
  }, [state.invoices, state.inventoryItems]);

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};