import React, { useState } from 'react';
import type { InventoryItem } from '../types';
import { useData } from '../context/DataContext';

interface InventoryItemFormProps {
  item: InventoryItem | null;
  onClose: () => void;
}

const InventoryItemForm: React.FC<InventoryItemFormProps> = ({ item, onClose }) => {
  const { dispatch } = useData();
  const [formData, setFormData] = useState<Omit<InventoryItem, 'id'>>({
    name: item?.name || '',
    sku: item?.sku || '',
    category: item?.category || '',
    stockQuantity: item?.stockQuantity || 0,
    reorderLevel: item?.reorderLevel || 10,
    supplier: item?.supplier || '',
    unitCost: item?.unitCost || 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData({ 
        ...formData, 
        [name]: type === 'number' ? parseFloat(value) || 0 : value 
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item) {
      dispatch({ type: 'UPDATE_INVENTORY_ITEM', payload: { ...formData, id: item.id } });
    } else {
      dispatch({ type: 'ADD_INVENTORY_ITEM', payload: formData });
    }
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{item ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Item Name</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-gray-700">SKU (Stock Keeping Unit)</label>
                    <input type="text" id="sku" name="sku" value={formData.sku} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                    <input type="text" id="category" name="category" placeholder="e.g., Paper, Ink, Supplies" value={formData.category} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">Supplier</label>
                    <input type="text" id="supplier" name="supplier" value={formData.supplier} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                    <input type="number" id="stockQuantity" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label htmlFor="reorderLevel" className="block text-sm font-medium text-gray-700">Re-order Level</label>
                    <input type="number" id="reorderLevel" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label htmlFor="unitCost" className="block text-sm font-medium text-gray-700">Unit Cost ($)</label>
                    <input type="number" id="unitCost" name="unitCost" value={formData.unitCost} onChange={handleChange} step="0.01" required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                </div>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
                <button type="submit" className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light">{item ? 'Update Item' : 'Save Item'}</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryItemForm;