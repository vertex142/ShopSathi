import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Invoice, InvoiceItem, Customer } from '../types';
import { InvoiceStatus } from '../types';
import { useData } from '../context/DataContext';
import { enhanceDescription } from '../services/geminiService';
import { Sparkles, Trash2, LoaderCircle, Bell, Plus } from 'lucide-react';
import { generateNextDocumentNumber } from '../utils/documentNumber';
import CustomerForm from './CustomerForm';
import { formatCurrency } from '../utils/formatCurrency';
import SearchableSelect from './SearchableSelect';
import useFocusTrap from '../hooks/useFocusTrap';

interface InvoiceFormProps {
  invoice: Invoice | null;
  onClose: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, onClose }) => {
  const { state, dispatch } = useData();
  const [formData, setFormData] = useState<Omit<Invoice, 'id'>>({
    invoiceNumber: invoice?.invoiceNumber || generateNextDocumentNumber(state.invoices, 'invoiceNumber', 'INV-'),
    customerId: invoice?.customerId || (state.customers.length > 0 ? state.customers[0].id : ''),
    issueDate: invoice?.issueDate || new Date().toISOString().split('T')[0],
    dueDate: invoice?.dueDate || new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    items: invoice?.items || [{ id: crypto.randomUUID(), name: '', description: '', quantity: 1, rate: 0 }],
    status: invoice?.status || InvoiceStatus.Draft,
    notes: invoice?.notes || 'Thank you for your business.',
    payments: invoice?.payments || [],
    previousDue: invoice?.previousDue || 0,
    discount: invoice?.discount || 0,
    reminderDate: invoice?.reminderDate,
    selectedTerms: invoice?.selectedTerms || [],
  });
  const [enhancingItemId, setEnhancingItemId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(!!invoice?.reminderDate);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef);

  const customerOptions = useMemo(() => state.customers.map(c => ({ value: c.id, label: c.name })), [state.customers]);
  const inventoryOptions = useMemo(() => [
    { value: '', label: 'Select an inventory item' },
    ...state.inventoryItems.map(i => ({ value: i.id, label: i.name }))
  ], [state.inventoryItems]);

  useEffect(() => {
    if (formData.customerId) {
        const dueAmount = state.invoices
            .filter(
                (inv) => inv.customerId === formData.customerId &&
                inv.id !== invoice?.id &&
                inv.status !== InvoiceStatus.Paid &&
                inv.status !== InvoiceStatus.Draft
            )
            .reduce((total, inv) => {
                const subtotal = inv.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
                const grandTotal = subtotal + (inv.previousDue || 0) - (inv.discount || 0);
                const totalPaid = (inv.payments || []).reduce((sum, p) => sum + p.amount, 0);
                return total + (grandTotal - totalPaid);
            }, 0);

        setFormData(prev => ({ ...prev, previousDue: dueAmount }));
    } else {
        setFormData(prev => ({ ...prev, previousDue: 0 }));
    }
  }, [formData.customerId, state.invoices, invoice?.id]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({ ...formData, [name]: type === 'number' ? parseFloat(value) || 0 : value });
  };
  
  const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newItems = [...formData.items];
    const itemToUpdate = { ...newItems[index] };

    if (name === 'name' || name === 'description') {
        itemToUpdate[name] = value;
    } else if (name === 'quantity' || name === 'rate') {
        itemToUpdate[name] = parseFloat(value) || 0;
    }

    newItems[index] = itemToUpdate;
    setFormData({ ...formData, items: newItems });
  };

  const handleItemSelect = (index: number, inventoryItemId: string) => {
    const selectedItem = state.inventoryItems.find(i => i.id === inventoryItemId);
    if (selectedItem) {
        const newItems = [...formData.items];
        newItems[index] = {
            ...newItems[index],
            inventoryItemId: selectedItem.id,
            name: selectedItem.name,
            rate: selectedItem.unitCost, // Assuming unitCost is the rate for sale
            description: newItems[index].description || `SKU: ${selectedItem.sku}`
        };
        setFormData({ ...formData, items: newItems });
    }
  };

  const handleTermsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
    setFormData({ ...formData, selectedTerms: selectedOptions });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { id: crypto.randomUUID(), name: '', description: '', quantity: 1, rate: 0 }],
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };
  
  const handleEnhance = async (index: number) => {
      const item = formData.items[index];
      if (!item.description) return;
      setEnhancingItemId(item.id);
      try {
        const enhancedText = await enhanceDescription(item.description);
        const newItems = [...formData.items];
        newItems[index].description = enhancedText;
        setFormData({ ...formData, items: newItems });
      } catch (error) {
        alert(error instanceof Error ? error.message : "An unknown error occurred.");
      } finally {
        setEnhancingItemId(null);
      }
  };

  const handleReminderToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = e.target.checked;
    setReminderEnabled(isEnabled);
    if (isEnabled) {
      if (!formData.reminderDate && formData.dueDate) {
        const parts = formData.dueDate.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const dueDateObj = new Date(year, month, day);
          dueDateObj.setDate(dueDateObj.getDate() - 1);
          setFormData(prev => ({ ...prev, reminderDate: dueDateObj.toISOString().split('T')[0] }));
        }
      }
    } else {
      setFormData(prev => ({ ...prev, reminderDate: undefined }));
    }
  };

  const handleReminderDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, reminderDate: e.target.value });
  };

  const handleNewCustomerSave = (newCustomer: Customer) => {
    setFormData(prev => ({ ...prev, customerId: newCustomer.id }));
    setShowCustomerForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
        if (invoice) {
          dispatch({ type: 'UPDATE_INVOICE', payload: { ...formData, id: invoice.id } });
        } else {
          dispatch({ type: 'ADD_INVOICE', payload: formData });
        }
        onClose();
    }, 500);
  };

  const subtotal = useMemo(() => {
    return formData.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.rate || 0), 0);
  }, [formData.items]);

  const grandTotal = useMemo(() => {
    return subtotal + (formData.previousDue || 0) - (formData.discount || 0);
  }, [subtotal, formData.previousDue, formData.discount]);
  
  const manuallySetableStatuses = [InvoiceStatus.Draft, InvoiceStatus.Sent, InvoiceStatus.Overdue];

  return (
    <>
    <div ref={modalRef} className="fixed inset-0 bg-black bg-opacity-50 modal-backdrop flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="invoice-form-title">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        <header className="flex-shrink-0 p-6 border-b dark:border-gray-700">
            <h2 id="invoice-form-title" className="text-2xl font-bold text-gray-900 dark:text-white">{invoice ? 'Edit Invoice' : 'Create Invoice'}</h2>
        </header>
        <main className="flex-grow p-6 space-y-6 overflow-y-auto">
            {/* Form content goes here */}
        </main>
        <footer className="flex-shrink-0 flex justify-end space-x-4 p-4 border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700 rounded-b-lg sticky bottom-0">
            <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500" disabled={isSaving}>Cancel</button>
            <button 
                type="submit" 
                className="bg-brand-blue dark:bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-brand-blue-light dark:hover:bg-blue-500 flex items-center justify-center w-36 disabled:opacity-75"
                disabled={isSaving}
            >
                {isSaving ? (
                    <>
                        <LoaderCircle className="animate-spin h-5 w-5 mr-2" />
                        Saving...
                    </>
                ) : (
                    invoice ? 'Update Invoice' : 'Save Invoice'
                )}
            </button>
        </footer>
      </form>
    </div>
    {showCustomerForm && (
        <CustomerForm 
            customer={null}
            onClose={() => setShowCustomerForm(false)}
            onSave={handleNewCustomerSave}
        />
    )}
    </>
  );
};

export default InvoiceForm;