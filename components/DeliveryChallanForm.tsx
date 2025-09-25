import React, { useState, useMemo, useRef } from 'react';
import type { DeliveryChallan, DeliveryChallanItem, Customer } from '../types';
import { useData } from '../context/DataContext';
import { Trash2, Plus, X } from 'lucide-react';
import { generateNextDocumentNumber } from '../utils/documentNumber';
import CustomerForm from './CustomerForm';
import SearchableSelect from './SearchableSelect';
import useFocusTrap from '../hooks/useFocusTrap';

interface DeliveryChallanFormProps {
  challan: DeliveryChallan | null;
  onClose: () => void;
}

const DeliveryChallanForm: React.FC<DeliveryChallanFormProps> = ({ challan, onClose }) => {
  const { state, dispatch } = useData();
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef);
  
  const [formData, setFormData] = useState<Omit<DeliveryChallan, 'id'>>({
    challanNumber: challan?.challanNumber || generateNextDocumentNumber(state.deliveryChallans, 'challanNumber', 'DCH-'),
    customerId: challan?.customerId || (state.customers.length > 0 ? state.customers[0].id : ''),
    issueDate: challan?.issueDate || new Date().toISOString().split('T')[0],
    items: challan?.items || [{ id: crypto.randomUUID(), name: '', description: '', quantity: 1 }],
    notes: challan?.notes || '',
    invoiceId: challan?.invoiceId,
  });
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  const customerOptions = useMemo(() => state.customers.map(c => ({ value: c.id, label: c.name })), [state.customers]);
  const inventoryOptions = useMemo(() => [
    { value: '', label: 'Select an inventory item (optional)' },
    ...state.inventoryItems.map(i => ({ value: i.id, label: i.name }))
  ], [state.inventoryItems]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const index = parseInt(e.target.dataset.index || '0', 10);

    const newItems = [...formData.items];
    const itemToUpdate = { ...newItems[index] };

    if (name === 'name' || name === 'description') {
        itemToUpdate[name] = value;
    } else if (name === 'quantity') {
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
            description: newItems[index].description || `SKU: ${selectedItem.sku}`
        };
        setFormData({ ...formData, items: newItems });
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { id: crypto.randomUUID(), name: '', description: '', quantity: 1 }],
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
    if (challan) {
      dispatch({ type: 'UPDATE_DELIVERY_CHALLAN', payload: { ...formData, id: challan.id } });
    } else {
      dispatch({ type: 'ADD_DELIVERY_CHALLAN', payload: formData });
    }
    onClose();
  };

  return (
    <>
    <div ref={modalRef} className="fixed inset-0 bg-black bg-opacity-50 modal-backdrop flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="challan-form-title">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        <header className="flex-shrink-0 flex justify-between items-center p-6 border-b dark:border-gray-700">
            <h2 id="challan-form-title" className="text-2xl font-bold text-gray-900 dark:text-white">{challan ? 'Edit Delivery Challan' : 'Create Delivery Challan'}</h2>
            <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600">
              <X className="h-5 w-5"/>
            </button>
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
                    <label htmlFor="challanNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Challan Number</label>
                    <input type="text" id="challanNumber" name="challanNumber" value={formData.challanNumber} onChange={handleChange} className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"/>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">A unique number for this delivery document. It's generated automatically but can be edited.</p>
                </div>
                <div>
                    <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Issue Date</label>
                    <input type="date" id="issueDate" name="issueDate" value={formData.issueDate} onChange={handleChange} className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"/>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Items</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">List the items being delivered. Selecting an item from your inventory helps with tracking, but does not affect stock levels directly (that is handled by the linked job or invoice).</p>
                <div className="space-y-4">
                    {formData.items.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-x-3 gap-y-2 items-start p-3 border dark:border-gray-700 rounded-md">
                            <div className="col-span-12 md:col-span-8 space-y-2">
                                <SearchableSelect
                                    value={item.inventoryItemId || ''}
                                    onChange={(val) => handleItemSelect(index, val)}
                                    options={inventoryOptions}
                                    placeholder="Select an inventory item (optional)"
                                />
                                <input 
                                    type="text" 
                                    name="name" 
                                    placeholder="Or type item name manually" 
                                    value={item.name} 
                                    onChange={handleItemChange} 
                                    data-index={index}
                                    className="p-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md"
                                />
                                <input 
                                    type="text" 
                                    name="description" 
                                    placeholder="Item Description (optional)" 
                                    value={item.description} 
                                    onChange={handleItemChange} 
                                    data-index={index}
                                    className="p-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md"
                                />
                            </div>
                            <div className="col-span-12 md:col-span-4 grid grid-cols-12 gap-3 items-center">
                                <input type="number" name="quantity" placeholder="Qty" value={item.quantity} onChange={handleItemChange} data-index={index} className="col-span-8 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md"/>
                                <button type="button" onClick={() => removeItem(index)} className="col-span-4 flex justify-center text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addItem} className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">+ Add Item</button>
            </div>
            
             <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"></textarea>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Any special instructions or notes related to the delivery.</p>
             </div>
        </main>
        <footer className="flex-shrink-0 flex justify-end space-x-4 p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
            <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
            <button type="submit" className="bg-brand-blue dark:bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-brand-blue-light dark:hover:bg-blue-500">{challan ? 'Update Challan' : 'Save Challan'}</button>
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

export default DeliveryChallanForm;
