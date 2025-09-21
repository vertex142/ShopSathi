

import React, { useState } from 'react';
import { useData } from '../context/DataContext';
// Fix: Corrected type to omit userId for new suppliers, aligning with context function signatures.
import { Supplier } from '../types';

interface SupplierFormProps {
    supplier: Supplier | null;
    onClose: () => void;
    onSave: (supplier: Supplier) => void;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ supplier, onClose, onSave }) => {
    // Fix: Replaced dispatch with specific data context functions.
    const { state, addSupplier, updateSupplier } = useData();
    // Fix: Corrected form state type to omit userId, which is handled by the context.
    const [formData, setFormData] = useState<Omit<Supplier, 'id' | 'userId'>>({
        name: supplier?.name || '',
        email: supplier?.email || '',
        phone: supplier?.phone || '',
        address: supplier?.address || '',
        openingBalance: supplier?.openingBalance || 0,
        linkedInventoryItemIds: supplier?.linkedInventoryItemIds || [],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const type = (e.target as HTMLInputElement).type;
        setFormData({
            ...formData,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        });
    };

    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedIds = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
        setFormData({ ...formData, linkedInventoryItemIds: selectedIds });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let savedSupplier: Supplier;
        if (supplier) {
            savedSupplier = { ...formData, id: supplier.id, userId: supplier.userId };
            // Fix: Call updateSupplier with the full Supplier object.
            await updateSupplier(savedSupplier);
        } else {
            // This is a temporary object for the onSave callback. The real ID and userId will be set by Firebase.
            savedSupplier = { ...formData, id: crypto.randomUUID(), userId: '' }; // Temp ID
            // Fix: Call addSupplier with form data (userId is added by context).
            await addSupplier(formData);
        }
        onSave(savedSupplier);
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60]">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6">{supplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                     <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                     <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                        <textarea id="address" name="address" value={formData.address} onChange={handleChange} rows={3} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"></textarea>
                    </div>
                    <div>
                        <label htmlFor="openingBalance" className="block text-sm font-medium text-gray-700">Opening Balance ($)</label>
                        <input 
                            type="number" 
                            id="openingBalance" 
                            name="openingBalance" 
                            value={formData.openingBalance} 
                            onChange={handleChange} 
                            step="0.01"
                            required 
                            className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="linkedInventoryItemIds" className="block text-sm font-medium text-gray-700">
                            Link to Inventory Items (optional)
                        </label>
                        <select
                            id="linkedInventoryItemIds"
                            name="linkedInventoryItemIds"
                            multiple
                            value={formData.linkedInventoryItemIds}
                            onChange={handleMultiSelectChange}
                            className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm h-32 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {state.inventoryItems.length === 0 ? (
                                <option disabled>No inventory items available.</option>
                            ) : (
                                state.inventoryItems.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} {item.sku ? `(${item.sku})` : ''}
                                    </option>
                                ))
                            )}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Hold Ctrl (or Cmd on Mac) to select multiple items.</p>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light">{supplier ? 'Update' : 'Save'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupplierForm;
