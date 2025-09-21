

import React, { useState, useMemo } from 'react';
// Fix: Corrected type to omit userId for new POs, aligning with context function signatures.
import type { PurchaseOrder, PurchaseOrderItem, Supplier } from '../types';
import { PurchaseOrderStatus } from '../types';
import { useData } from '../context/DataContext';
import { Trash2, Plus } from 'lucide-react';
import { generateNextDocumentNumber } from '../utils/documentNumber';
import SupplierForm from './SupplierForm';

interface PurchaseOrderFormProps {
  purchaseOrder: PurchaseOrder | null;
  onClose: () => void;
}

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ purchaseOrder, onClose }) => {
  // Fix: Replaced dispatch with specific data context functions.
  const { state, addPurchaseOrder, updatePurchaseOrder } = useData();
  // Fix: Corrected form state type to omit userId, which is handled by the context.
  const [formData, setFormData] = useState<Omit<PurchaseOrder, 'id' | 'userId'>>({
    poNumber: purchaseOrder?.poNumber || generateNextDocumentNumber(state.purchaseOrders, 'poNumber', 'PO-'),
    supplierId: purchaseOrder?.supplierId || (state.suppliers.length > 0 ? state.suppliers[0].id : ''),
    orderDate: purchaseOrder?.orderDate || new Date().toISOString().split('T')[0],
    expectedDeliveryDate: purchaseOrder?.expectedDeliveryDate || new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0],
    items: purchaseOrder?.items || [{ id: crypto.randomUUID(), name: '', description: '', quantity: 1, unitCost: 0 }],
    status: purchaseOrder?.status || PurchaseOrderStatus.Pending,
    notes: purchaseOrder?.notes || '',
    selectedTerms: purchaseOrder?.selectedTerms || [],
  });
  const [showSupplierForm, setShowSupplierForm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({ ...formData, [name]: type === 'number' ? parseFloat(value) || 0 : value });
  };

  const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newItems = [...formData.items];
    const field = e.currentTarget.name as keyof Omit<PurchaseOrderItem, 'id'>;
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
            unitCost: selectedItem.unitCost,
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
      items: [...formData.items, { id: crypto.randomUUID(), name: '', description: '', quantity: 1, unitCost: 0 }],
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleNewSupplierSave = (newSupplier: Supplier) => {
    setFormData(prev => ({ ...prev, supplierId: newSupplier.id }));
    setShowSupplierForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseOrder) {
      // Fix: Call updatePurchaseOrder with the full PurchaseOrder object.
      await updatePurchaseOrder({ ...formData, id: purchaseOrder.id, userId: purchaseOrder.userId });
    } else {
      // Fix: Call addPurchaseOrder with form data (userId is added by context).
      await addPurchaseOrder(formData);
    }
    onClose();
  };
  
  const grandTotal = useMemo(() => {
    return formData.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitCost || 0), 0);
  }, [formData.items]);

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{purchaseOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700">Supplier</label>
               <div className="flex items-center space-x-2 mt-1">
                  <select id="supplierId" name="supplierId" value={formData.supplierId} onChange={handleChange} className="block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm">
                    <option value="">Select Supplier</option>
                    {state.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                   <button type="button" onClick={() => setShowSupplierForm(true)} className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300" title="Add New Supplier">
                        <Plus className="h-5 w-5" />
                    </button>
               </div>
            </div>
            <div>
              <label htmlFor="poNumber" className="block text-sm font-medium text-gray-700">PO Number</label>
              <input type="text" id="poNumber" name="poNumber" value={formData.poNumber} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label htmlFor="orderDate" className="block text-sm font-medium text-gray-700">Order Date</label>
              <input type="date" id="orderDate" name="orderDate" value={formData.orderDate} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label htmlFor="expectedDeliveryDate" className="block text-sm font-medium text-gray-700">Expected Delivery Date</label>
              <input type="date" id="expectedDeliveryDate" name="expectedDeliveryDate" value={formData.expectedDeliveryDate} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm" />
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
                    <input type="text" name="name" placeholder="Or type item name manually" value={item.name} onChange={(e) => handleItemChange(index, e)} className="p-2 w-full bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md" />
                    <input type="text" name="description" placeholder="Item Description" value={item.description} onChange={(e) => handleItemChange(index, e)} className="p-2 w-full bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md" />
                  </div>
                  <div className="col-span-12 md:col-span-6 grid grid-cols-12 gap-3 items-center">
                    <input type="number" name="quantity" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(index, e)} className="col-span-4 md:col-span-3 p-2 bg-white text-gray-900 border border-gray-300 rounded-md" />
                    <input type="number" name="unitCost" placeholder="Unit Cost" value={item.unitCost} onChange={(e) => handleItemChange(index, e)} className="col-span-4 md:col-span-3 p-2 bg-white text-gray-900 border border-gray-300 rounded-md" step="0.01" />
                    <span className="col-span-3 md:col-span-4 text-center font-medium">${((item.quantity || 0) * (item.unitCost || 0)).toFixed(2)}</span>
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
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm">
                {Object.values(PurchaseOrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
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
                    {(state.settings.termsAndConditions || []).map(term => (
                        <option key={term.id} value={term.text}>{term.text}</option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl (or Cmd on Mac) to select multiple terms.</p>
            </div>

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
            <button type="submit" className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light">{purchaseOrder ? 'Update PO' : 'Save PO'}</button>
          </div>
        </form>
      </div>
    </div>
    {showSupplierForm && (
        <SupplierForm
            supplier={null}
            onClose={() => setShowSupplierForm(false)}
            onSave={handleNewSupplierSave}
        />
    )}
    </>
  );
};

export default PurchaseOrderForm;
