import React, { useState, useMemo } from 'react';
import type { Quote, QuoteItem, Customer } from '../types';
import { QuoteStatus } from '../types';
import { useData } from '../context/DataContext';
import { enhanceDescription } from '../services/geminiService';
import { Sparkles, Trash2, LoaderCircle, Plus } from 'lucide-react';
import { generateNextDocumentNumber } from '../utils/documentNumber';
import CustomerForm from './CustomerForm';

interface QuoteFormProps {
  quote: Quote | null;
  onClose: () => void;
}

const QuoteForm: React.FC<QuoteFormProps> = ({ quote, onClose }) => {
  const { state, dispatch } = useData();
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({ ...formData, [name]: type === 'number' ? parseFloat(value) || 0 : value });
  };
  
  const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newItems = [...formData.items];
    const field = e.currentTarget.name as keyof Omit<QuoteItem, 'id'>;
    const value = e.currentTarget.type === 'number' ? parseFloat(e.currentTarget.value) || 0 : e.currentTarget.value;
    (newItems[index] as any)[field] = value;
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
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{quote ? 'Edit Quote' : 'Create Quote'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">Customer</label>
                    <div className="flex items-center space-x-2 mt-1">
                        <select id="customerId" name="customerId" value={formData.customerId} onChange={handleChange} className="block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="">Select Customer</option>
                            {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                         <button type="button" onClick={() => setShowCustomerForm(true)} className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300" title="Add New Customer">
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                <div>
                    <label htmlFor="quoteNumber" className="block text-sm font-medium text-gray-700">Quote Number</label>
                    <input type="text" id="quoteNumber" name="quoteNumber" value={formData.quoteNumber} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700">Issue Date</label>
                    <input type="date" id="issueDate" name="issueDate" value={formData.issueDate} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">Expiry Date</label>
                    <input type="date" id="expiryDate" name="expiryDate" value={formData.expiryDate} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Items</h3>
                <div className="space-y-4">
                    {formData.items.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-x-3 gap-y-2 items-start p-3 border rounded-md">
                            <div className="col-span-12 md:col-span-6 space-y-2">
                                <select 
                                    value={item.inventoryItemId || ''} 
                                    onChange={(e) => handleItemSelect(index, e.target.value)} 
                                    className="p-2 w-full bg-white text-gray-900 border border-gray-300 rounded-md"
                                >
                                    <option value="">Select an inventory item</option>
                                    {state.inventoryItems.map(invItem => (
                                        <option key={invItem.id} value={invItem.id}>{invItem.name}</option>
                                    ))}
                                </select>
                                <input 
                                    type="text" 
                                    name="name" 
                                    placeholder="Or type item name manually" 
                                    value={item.name} 
                                    onChange={(e) => handleItemChange(index, e)} 
                                    className="p-2 w-full bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md"
                                />
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        name="description" 
                                        placeholder="Item Description (optional)" 
                                        value={item.description} 
                                        onChange={(e) => handleItemChange(index, e)} 
                                        className="p-2 w-full bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md"
                                    />
                                    {process.env.API_KEY && (
                                        <button type="button" onClick={() => handleEnhance(index)} disabled={enhancingItemId === item.id} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-yellow-500 hover:text-yellow-700 disabled:opacity-50">
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
                                <input type="number" name="quantity" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(index, e)} className="col-span-4 md:col-span-3 p-2 bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md"/>
                                <input type="number" name="rate" placeholder="Rate" value={item.rate} onChange={(e) => handleItemChange(index, e)} className="col-span-4 md:col-span-3 p-2 bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md"/>
                                <span className="col-span-3 md:col-span-4 text-center font-medium">${((item.quantity || 0) * (item.rate || 0)).toFixed(2)}</span>
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
                            <span className="font-medium">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <label htmlFor="discount" className="text-gray-600">Discount:</label>
                            <div className="flex items-center">
                                <span className="mr-1 text-gray-600">$</span>
                                <input 
                                    type="number" 
                                    id="discount"
                                    name="discount"
                                    value={formData.discount} 
                                    onChange={handleChange}
                                    className="w-24 p-1 bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md text-right shadow-sm"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="flex justify-between border-t pt-2 mt-2">
                            <span className="font-bold text-xl">Grand Total:</span>
                            <span className="font-bold text-xl">${grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t mt-6">
                 <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"></textarea>
                 </div>
                 <div className="space-y-4">
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                        <select 
                            id="status" 
                            name="status" 
                            value={formData.status} 
                            onChange={handleChange} 
                            className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"
                        >
                            {Object.values(QuoteStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                 </div>
            </div>

            <div className="border-t pt-6 mt-6">
                <label htmlFor="selectedTerms" className="block text-sm font-medium text-gray-700">Terms & Conditions</label>
                <select 
                    id="selectedTerms"
                    name="selectedTerms"
                    multiple
                    value={formData.selectedTerms}
                    onChange={handleTermsChange}
                    className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm h-24"
                >
                    {(state.settings.quoteTerms || []).map(term => (
                        <option key={term.id} value={term.text}>{term.text}</option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl (or Cmd on Mac) to select multiple terms.</p>
            </div>

            <div className="flex justify-end space-x-4">
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
                        quote ? 'Update Quote' : 'Save Quote'
                    )}
                </button>
            </div>
        </form>
      </div>
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