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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="flex-shrink-0 p-6 border-b">
          <h2 className="text-2xl font-bold">{item ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h2>
        </header>
        <main className="flex-grow p-6 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Item Name</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                    <p className="text-xs text-gray-500 mt-1">The name of the item (e.g., 'A4 Paper Ream - 80gsm').</p>
                </div>
                <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-gray-700">SKU (Stock Keeping Unit)</label>
                    <input type="text" id="sku" name="sku" value={formData.sku} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                    <p className="text-xs text-gray-500 mt-1">A unique code to identify this item. Optional.</p>
                </div>
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                    <input type="text" id="category" name="category" placeholder="e.g., Paper, Ink, Supplies" value={formData.category} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md shadow-sm"/>
                    <p className="text-xs text-gray-500 mt-1">Group similar items together (e.g., 'Paper', 'Ink').</p>
                </div>
                <div>
                    <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">Supplier</label>
                    <input type="text" id="supplier" name="supplier" value={formData.supplier} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                    <p className="text-xs text-gray-500 mt-1">The primary supplier for this item (for reference).</p>
                </div>
                <div>
                    <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                    <input type="number" id="stockQuantity" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                    <p className="text-xs text-gray-500 mt-1">The current number of units you have in stock.</p>
                </div>
                <div>
                    <label htmlFor="reorderLevel" className="block text-sm font-medium text-gray-700">Re-order Level</label>
                    <input type="number" id="reorderLevel" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                    <p className="text-xs text-gray-500 mt-1">When stock falls to this level, a 'Low Stock' warning will be generated.</p>
                </div>
                <div>
                    <label htmlFor="unitCost" className="block text-sm font-medium text-gray-700">Unit Cost ($)</label>
                    <input type="number" id="unitCost" name="unitCost" value={formData.unitCost} onChange={handleChange} step="0.01" required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                    <p className="text-xs text-gray-500 mt-1">The cost per single unit of this item when you purchase it.</p>
                </div>
            </div>
        </main>
        <footer className="flex-shrink-0 flex justify-end space-x-4 p-4 bg-gray-50 border-t rounded-b-lg">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
            <button type="submit" className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light">{item ? 'Update Item' : 'Save Item'}</button>
        </footer>
      </form>
    </div>
  );
};

export default InventoryItemForm;