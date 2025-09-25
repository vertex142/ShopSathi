import React, { useState, useMemo } from 'react';
import type { RecurringInvoice, InvoiceItem, Customer } from '../types';
import { RecurringInvoiceFrequency } from '../types';
import { useData } from '../context/DataContext';
import { Trash2, LoaderCircle, Plus } from 'lucide-react';
import CustomerForm from './CustomerForm';
import { formatCurrency } from '../utils/formatCurrency';
import SearchableSelect from './SearchableSelect';

interface RecurringInvoiceFormProps {
  profile: RecurringInvoice | null;
  onClose: () => void;
}

const RecurringInvoiceForm: React.FC<RecurringInvoiceFormProps> = ({ profile, onClose }) => {
  const { state, dispatch } = useData();
  const [formData, setFormData] = useState<Omit<RecurringInvoice, 'id'>>({
    customerId: profile?.customerId || (state.customers.length > 0 ? state.customers[0].id : ''),
    frequency: profile?.frequency || RecurringInvoiceFrequency.Monthly,
    startDate: profile?.startDate || new Date().toISOString().split('T')[0],
    endDate: profile?.endDate,
    items: profile?.items || [{ id: crypto.randomUUID(), name: '', description: '', quantity: 1, rate: 0 }],
    notes: profile?.notes || 'Thank you for your business.',
    discount: profile?.discount || 0,
    selectedTerms: profile?.selectedTerms || [],
    lastIssueDate: profile?.lastIssueDate || '',
    isActive: profile?.isActive ?? true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  const customerOptions = useMemo(() => state.customers.map(c => ({ value: c.id, label: c.name })), [state.customers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
        setFormData({ ...formData, [name]: type === 'number' ? parseFloat(value) || 0 : value });
    }
  };
  
  const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newItems = [...formData.items];
    const field = e.target.name as keyof Omit<InvoiceItem, 'id'>;
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    (newItems[index] as any)[field] = value;
    setFormData({ ...formData, items: newItems });
  };
  
  const handleTermsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // FIX: Explicitly type 'option' as HTMLOptionElement to resolve type inference issue.
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
  
  const handleNewCustomerSave = (newCustomer: Customer) => {
    setFormData(prev => ({ ...prev, customerId: newCustomer.id }));
    setShowCustomerForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    let submissionData = { ...formData };
    if (!profile) { // If it's a new profile
        const startDate = new Date(submissionData.startDate);
        startDate.setDate(startDate.getDate() - 1); // Set last issue date to day before start
        submissionData.lastIssueDate = startDate.toISOString().split('T')[0];
    }

    setTimeout(() => {
        if (profile) {
          dispatch({ type: 'UPDATE_RECURRING_INVOICE', payload: { ...submissionData, id: profile.id } });
        } else {
          dispatch({ type: 'ADD_RECURRING_INVOICE', payload: submissionData });
        }
        onClose();
    }, 500);
  };

  const subtotal = useMemo(() => {
    return formData.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.rate || 0), 0);
  }, [formData.items]);

  const grandTotal = useMemo(() => {
    return subtotal - (formData.discount || 0);
  }, [subtotal, formData.discount]);
  
  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-full flex flex-col">
        <header className="flex-shrink-0 p-6 border-b">
            <h2 className="text-2xl font-bold">{profile ? 'Edit Recurring Profile' : 'Create Recurring Profile'}</h2>
        </header>
        <main className="flex-grow p-6 space-y-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">Customer</label>
                    <div className="flex items-center space-x-2 mt-1">
                        <SearchableSelect
                            value={formData.customerId}
                            onChange={(val) => setFormData(prev => ({ ...prev, customerId: val }))}
                            options={customerOptions}
                            placeholder="Select Customer"
                            className="w-full"
                        />
                        <button type="button" onClick={() => setShowCustomerForm(true)} className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300" title="Add New Customer">
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                <div>
                     <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">Frequency</label>
                    <select id="frequency" name="frequency" value={formData.frequency} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm">
                        {Object.values(RecurringInvoiceFrequency).map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
                    <input type="date" id="endDate" name="endDate" value={formData.endDate || ''} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Invoice Template Items</h3>
                <div className="space-y-4">
                    {formData.items.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-x-3 gap-y-2 items-start p-3 border rounded-md">
                            <div className="col-span-12 md:col-span-6 space-y-2">
                                <input type="text" name="name" placeholder="Item Name" value={item.name} onChange={(e) => handleItemChange(index, e)} className="p-2 w-full bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md" />
                                <input type="text" name="description" placeholder="Item Description" value={item.description} onChange={(e) => handleItemChange(index, e)} className="p-2 w-full bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md" />
                            </div>
                            <div className="col-span-12 md:col-span-6 grid grid-cols-12 gap-3 items-center">
                                <input type="number" name="quantity" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(index, e)} className="col-span-4 md:col-span-3 p-2 bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md"/>
                                <input type="number" name="rate" placeholder="Rate" value={item.rate} onChange={(e) => handleItemChange(index, e)} className="col-span-4 md:col-span-3 p-2 bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md"/>
                                <span className="col-span-3 md:col-span-4 text-center font-medium">{formatCurrency((item.quantity || 0) * (item.rate || 0))}</span>
                                <button type="button" onClick={() => removeItem(index)} className="col-span-1 md:col-span-2 flex justify-center text-red-500 hover:text-red-700">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addItem} className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500">+ Add Item</button>
            </div>
            
            <div className="mt-6 border-t pt-4">
                <div className="flex justify-end">
                    <div className="w-full max-w-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <label htmlFor="discount" className="text-gray-600">Discount:</label>
                             <div className="flex items-center">
                                <span className="mr-1 text-gray-600">৳</span>
                                <input type="number" id="discount" name="discount" value={formData.discount} onChange={handleChange} className="w-24 p-1 bg-white text-gray-900 border border-gray-300 rounded-md text-right"/>
                            </div>
                        </div>
                        <div className="flex justify-between border-t pt-2 mt-2">
                            <span className="font-bold text-xl">Grand Total:</span>
                            <span className="font-bold text-xl">{formatCurrency(grandTotal)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t mt-6">
                 <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={4} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"></textarea>
                 </div>
                 <div>
                    <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                id="isActive"
                                name="isActive"
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={handleChange}
                                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="isActive" className="font-medium text-gray-700">
                                Active
                            </label>
                            <p className="text-gray-500 text-xs">If unchecked, no new invoices will be generated from this profile.</p>
                        </div>
                    </div>
                 </div>
            </div>

            <div className="border-t pt-6 mt-6">
                <label htmlFor="selectedTerms" className="block text-sm font-medium text-gray-700">Terms & Conditions</label>
                <select id="selectedTerms" name="selectedTerms" multiple value={formData.selectedTerms} onChange={handleTermsChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm h-24">
                    {(state.settings.invoiceTerms || []).map(term => (
                        <option key={term.id} value={term.text}>{term.text}</option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl (or Cmd on Mac) to select multiple terms.</p>
            </div>
        </main>
        <footer className="flex-shrink-0 flex justify-end space-x-4 p-4 border-t bg-gray-50 rounded-b-lg sticky bottom-0">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300" disabled={isSaving}>Cancel</button>
            <button 
                type="submit" 
                className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light flex items-center justify-center w-36 disabled:opacity-75"
                disabled={isSaving}
            >
                {isSaving ? (
                    <>
                        <LoaderCircle className="animate-spin h-5 w-5 mr-2" />
                        Saving...
                    </>
                ) : (
                    profile ? 'Update Profile' : 'Save Profile'
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

export default RecurringInvoiceForm;
