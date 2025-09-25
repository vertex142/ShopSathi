import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Supplier } from '../types';
import { Edit, X } from 'lucide-react';
import useFocusTrap from '../hooks/useFocusTrap';

interface SupplierFormProps {
    supplier: Supplier | null;
    onClose: () => void;
    onSave: (supplier: Supplier) => void;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ supplier, onClose, onSave }) => {
    const { state, dispatch } = useData();
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef);
    
    const [formData, setFormData] = useState<Omit<Supplier, 'id'>>({
        name: supplier?.name || '',
        email: supplier?.email || '',
        phone: supplier?.phone || '',
        address: supplier?.address || '',
        openingBalance: supplier?.openingBalance || 0,
        linkedInventoryItemIds: supplier?.linkedInventoryItemIds || [],
    });
    const [isOpeningBalanceEditable, setIsOpeningBalanceEditable] = useState(false);


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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let savedSupplier: Supplier;
        if (supplier) {
            savedSupplier = { ...formData, id: supplier.id };
            dispatch({ type: 'UPDATE_SUPPLIER', payload: savedSupplier });
        } else {
            savedSupplier = { ...formData, id: crypto.randomUUID() }; // Temp ID for onSave
            dispatch({ type: 'ADD_SUPPLIER', payload: formData });
        }
        onSave(savedSupplier);
        onClose();
    };
    
    return (
        <div ref={modalRef} className="fixed inset-0 bg-black bg-opacity-50 modal-backdrop flex justify-center items-center z-[60] p-4" role="dialog" aria-modal="true" aria-labelledby="supplier-form-title">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[95vh] flex flex-col">
                <header className="flex-shrink-0 flex justify-between items-center p-6 border-b dark:border-gray-700">
                    <h2 id="supplier-form-title" className="text-2xl font-bold text-gray-900 dark:text-white">{supplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
                     <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600">
                      <X className="h-5 w-5"/>
                    </button>
                </header>
                <main className="flex-grow p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"/>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">The supplier's full name or company name.</p>
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"/>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">The primary email for sending purchase orders and communications.</p>
                    </div>
                     <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"/>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">The primary contact phone number.</p>
                    </div>
                     <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                        <textarea id="address" name="address" value={formData.address} onChange={handleChange} rows={3} required className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"></textarea>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">The supplier's address.</p>
                    </div>
                    <div>
                        <label htmlFor="openingBalance" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Opening Balance ($)</label>
                         <div className="mt-1 flex items-center space-x-2">
                            <input 
                                type="number" 
                                id="openingBalance" 
                                name="openingBalance" 
                                value={formData.openingBalance} 
                                onChange={handleChange} 
                                step="0.01"
                                required 
                                readOnly={!!supplier && !isOpeningBalanceEditable}
                                className="block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm read-only:bg-gray-100 dark:read-only:bg-gray-600 read-only:cursor-not-allowed"
                            />
                            {supplier && (
                                <button 
                                    type="button" 
                                    onClick={() => setIsOpeningBalanceEditable(!isOpeningBalanceEditable)} 
                                    className="p-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                                    title={isOpeningBalanceEditable ? "Lock field" : "Edit opening balance"}
                                >
                                    <Edit className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">If you owed this supplier money from before you started using the app, enter the amount here.</p>
                    </div>
                    <div>
                        <label htmlFor="linkedInventoryItemIds" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Link to Inventory Items (optional)
                        </label>
                        <select
                            id="linkedInventoryItemIds"
                            name="linkedInventoryItemIds"
                            multiple
                            value={formData.linkedInventoryItemIds}
                            onChange={handleMultiSelectChange}
                            className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm h-32 focus:ring-indigo-500 focus:border-indigo-500"
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
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Link inventory items to this supplier for easier tracking. Hold Ctrl (or Cmd on Mac) to select multiple items.</p>
                    </div>
                </main>
                <footer className="flex-shrink-0 flex justify-end space-x-4 p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
                    <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                    <button type="submit" className="bg-brand-blue dark:bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-brand-blue-light dark:hover:bg-blue-500">{supplier ? 'Update' : 'Save'}</button>
                </footer>
            </form>
        </div>
    );
};

export default SupplierForm;
