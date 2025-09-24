import React, { useState } from 'react';
import type { DeliveryChallan, DeliveryChallanItem, Customer } from '../types';
import { useData } from '../context/DataContext';
import { Trash2, Plus } from 'lucide-react';
import { generateNextDocumentNumber } from '../utils/documentNumber';
import CustomerForm from './CustomerForm';

interface DeliveryChallanFormProps {
  challan: DeliveryChallan | null;
  onClose: () => void;
}

const DeliveryChallanForm: React.FC<DeliveryChallanFormProps> = ({ challan, onClose }) => {
  const { state, dispatch } = useData();
  const [formData, setFormData] = useState<Omit<DeliveryChallan, 'id'>>({
    challanNumber: challan?.challanNumber || generateNextDocumentNumber(state.deliveryChallans, 'challanNumber', 'DCH-'),
    customerId: challan?.customerId || (state.customers.length > 0 ? state.customers[0].id : ''),
    issueDate: challan?.issueDate || new Date().toISOString().split('T')[0],
    items: challan?.items || [{ id: crypto.randomUUID(), name: '', description: '', quantity: 1 }],
    notes: challan?.notes || '',
    invoiceId: challan?.invoiceId,
  });
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newItems = [...formData.items];
    const index = parseInt(e.target.dataset.index || '0', 10);
    const field = e.target.name as keyof Omit<DeliveryChallanItem, 'id'>;
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-full flex flex-col">
        <header className="flex-shrink-0 p-6 border-b">
            <h2 className="text-2xl font-bold">{challan ? 'Edit Delivery Challan' : 'Create Delivery Challan'}</h2>
        </header>
        <main className="flex-grow p-6 space-y-6 overflow-y-auto">
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
                    <label htmlFor="challanNumber" className="block text-sm font-medium text-gray-700">Challan Number</label>
                    <input type="text" id="challanNumber" name="challanNumber" value={formData.challanNumber} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700">Issue Date</label>
                    <input type="date" id="issueDate" name="issueDate" value={formData.issueDate} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Items</h3>
                <div className="space-y-4">
                    {formData.items.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-x-3 gap-y-2 items-start p-3 border rounded-md">
                            <div className="col-span-12 md:col-span-8 space-y-2">
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
                                    onChange={handleItemChange} 
                                    data-index={index}
                                    className="p-2 w-full bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md"
                                />
                                <input 
                                    type="text" 
                                    name="description" 
                                    placeholder="Item Description (optional)" 
                                    value={item.description} 
                                    onChange={handleItemChange} 
                                    data-index={index}
                                    className="p-2 w-full bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div className="col-span-12 md:col-span-4 grid grid-cols-12 gap-3 items-center">
                                <input type="number" name="quantity" placeholder="Qty" value={item.quantity} onChange={handleItemChange} data-index={index} className="col-span-8 p-2 bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md"/>
                                <button type="button" onClick={() => removeItem(index)} className="col-span-4 flex justify-center text-red-500 hover:text-red-700">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addItem} className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500">+ Add Item</button>
            </div>
            
             <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"></textarea>
             </div>
        </main>
        <footer className="flex-shrink-0 flex justify-end space-x-4 p-4 border-t bg-gray-50 rounded-b-lg">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
            <button type="submit" className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light">{challan ? 'Update Challan' : 'Save Challan'}</button>
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