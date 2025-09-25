import React, { useState, useMemo, useRef } from 'react';
import type { Quote, QuoteItem, Customer } from '../types';
import { QuoteStatus } from '../types';
import { useData } from '../context/DataContext';
import { enhanceDescription } from '../services/geminiService';
import { Sparkles, Trash2, LoaderCircle, Plus } from 'lucide-react';
import { generateNextDocumentNumber } from '../utils/documentNumber';
import CustomerForm from './CustomerForm';
import { formatCurrency } from '../utils/formatCurrency';
import SearchableSelect from './SearchableSelect';
import useFocusTrap from '../hooks/useFocusTrap';

interface QuoteFormProps {
  quote: Quote | null;
  onClose: () => void;
}

const QuoteForm: React.FC<QuoteFormProps> = ({ quote, onClose }) => {
  const { state, dispatch } = useData();
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef);

  const [formData, setFormData] = useState<Omit<Quote, 'id'>>({
    quoteNumber: quote?.quoteNumber || generateNextDocumentNumber(state.quotes, 'quoteNumber', 'QTE-'),
    customerId: quote?.customerId || (state.customers.length > 0 ? state.customers[0].id : ''),
    issueDate: quote?.issueDate || new Date().toISOString().split('T')[0],
    expiryDate: quote?.expiryDate || new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    items: quote?.items || [{ id: crypto.randomUUID(), name: '', description: '', quantity: 1, rate: 0 }],
    status: quote?.status || QuoteStatus.Draft,
    notes: quote?.notes || 'Please review this quote. Prices are valid until the expiry date.',
    discount: quote?.discount || 0,
    selectedTerms: quote?.selectedTerms || [],
  });
  const [enhancingItemId, setEnhancingItemId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  const customerOptions = useMemo(() => state.customers.map(c => ({ value: c.id, label: c.name })), [state.customers]);
  const inventoryOptions = useMemo(() => [
    { value: '', label: 'Select an inventory item' },
    ...state.inventoryItems.map(i => ({ value: i.id, label: i.name }))
  ], [state.inventoryItems]);

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

  const handleNewCustomerSave = (newCustomer: Customer) => {
    setFormData(prev => ({ ...prev, customerId: newCustomer.id }));
    setShowCustomerForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
        if (quote) {
          dispatch({ type: 'UPDATE_QUOTE', payload: { ...formData, id: quote.id } });
        } else {
          dispatch({ type: 'ADD_QUOTE', payload: formData });
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
    <div ref={modalRef} className="fixed inset-0 bg-black bg-opacity-50 modal-backdrop flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="quote-form-title">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        <header className="flex-shrink-0 p-6 border-b dark:border-gray-700">
            <h2 id="quote-form-title" className="text-2xl font-bold text-gray-900 dark:text-white">{quote ? 'Edit Quote' : 'Create Quote'}</h2>
        </header>
        <main className="flex-grow p-6 space-y-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
                    <div className="flex items-center space-x-2 mt-1">
                        <SearchableSelect
                            value={formData.customerId}
                            onChange={(val) => setFormData(prev => ({ ...prev, customerId: val }))}
                            options={customerOptions}
                            placeholder="Select Customer"
                            className="w-full"
                        />
                         <button type="button" onClick={() => setShowCustomerForm(true)} className="p-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500" title="Add New Customer">
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                <div>
                    <label htmlFor="quoteNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quote Number</label>
                    <input type="text" id="quoteNumber" name="quoteNumber" value={formData.quoteNumber} onChange={handleChange} className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Issue Date</label>
                    <input type="date" id="issueDate" name="issueDate" value={formData.issueDate} onChange={handleChange} className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expiry Date</label>
                    <input type="date" id="expiryDate" name="expiryDate" value={formData.expiryDate} onChange={handleChange} className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"/>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Items</h3>
                <div className="space-y-4">
                    {formData.items.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-x-3 gap-y-2 items-start p-3 border dark:border-gray-700 rounded-md">
                            <div className="col-span-12 md:col-span-6 space-y-2">
                                <SearchableSelect
                                    value={item.inventoryItemId || ''}
                                    onChange={(val) => handleItemSelect(index, val)}
                                    options={inventoryOptions}
                                    placeholder="Select an inventory item"
                                />
                                <input 
                                    type="text" 
                                    name="name" 
                                    placeholder="Or type item name manually" 
                                    value={item.name} 
                                    onChange={(e) => handleItemChange(index, e)} 
                                    className="p-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md"
                                />
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        name="description" 
                                        placeholder="Item Description (optional)" 
                                        value={item.description} 
                                        onChange={(e) => handleItemChange(index, e)} 
                                        className="p-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md"
                                    />
                                    {process.env.API_KEY && (
                                        <button type="button" onClick={() => handleEnhance(index)} disabled={enhancingItemId === item.id} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-yellow-500 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 disabled:opacity-50">
                                            {enhancingItemId === item.id ? (
                                                <LoaderCircle className="animate-spin h-5 w-5" />
                                            ) : (
                                                <Sparkles className="h-5 w-5" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="col-span-12 md:col-span-6 grid grid-cols-12 gap-3 items-center">
                                <input type="number" name="quantity" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(index, e)} className="col-span-4 md:col-span-3 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md"/>
                                <input type="number" name="rate" placeholder="Rate" value={item.rate} onChange={(e) => handleItemChange(index, e)} className="col-span-4 md:col-span-3 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md"/>
                                <span className="col-span-3 md:col-span-4 text-center font-medium text-gray-800 dark:text-gray-200">{formatCurrency((item.quantity || 0) * (item.rate || 0))}</span>
                                <button type="button" onClick={() => removeItem(index)} className="col-span-1 md:col-span-2 flex justify-center text-red-500 hover:text-red-700">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addItem} className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">+ Add Item</button>
            </div>
            
            <div className="mt-6 border-t dark:border-gray-700 pt-4">
                <div className="flex justify-end">
                    <div className="w-full max-w-sm space-y-2">
                        <div className="flex justify-between text-gray-800 dark:text-gray-200">
                            <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                            <span className="font-medium">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-800 dark:text-gray-200">
                            <label htmlFor="discount" className="text-gray-600 dark:text-gray-400">Discount:</label>
                            <div className="flex items-center">
                                <span className="mr-1 text-gray-600 dark:text-gray-400">৳</span>
                                <input 
                                    type="number" 
                                    id="discount"
                                    name="discount"
                                    value={formData.discount} 
                                    onChange={handleChange}
                                    className="w-24 p-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md text-right shadow-sm"
                                    placeholder="0.00"
                                    aria-describedby="discount-description-quote"
                                />
                            </div>
                        </div>
                        <p id="discount-description-quote" className="text-xs text-gray-500 dark:text-gray-400 text-right -mt-1">A flat amount subtracted from the total.</p>
                        <div className="flex justify-between border-t dark:border-gray-700 pt-2 mt-2">
                            <span className="font-bold text-xl text-gray-900 dark:text-white">Grand Total:</span>
                            <span className="font-bold text-xl text-gray-900 dark:text-white">{formatCurrency(grandTotal)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t dark:border-gray-700 mt-6">
                 <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                    <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"></textarea>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This will be visible to the customer on the final quote.</p>
                 </div>
                 <div className="space-y-4">
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                        <select 
                            id="status" 
                            name="status" 
                            value={formData.status} 
                            onChange={handleChange} 
                            className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                        >
                            {Object.values(QuoteStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                 </div>
            </div>

            <div className="border-t dark:border-gray-700 pt-6 mt-6">
                <label htmlFor="selectedTerms" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Terms & Conditions</label>
                <select 
                    id="selectedTerms"
                    name="selectedTerms"
                    multiple
                    value={formData.selectedTerms}
                    onChange={handleTermsChange}
                    className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm h-24"
                >
                    {(state.settings.quoteTerms || []).map(term => (
                        <option key={term.id} value={term.text}>{term.text}</option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hold Ctrl (or Cmd on Mac) to select multiple terms.</p>
            </div>
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
                    quote ? 'Update Quote' : 'Save Quote'
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

export default QuoteForm;