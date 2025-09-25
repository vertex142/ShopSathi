import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Customer } from '../types';
import { Edit } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface CustomerFormProps {
    customer: Customer | null;
    onClose: () => void;
    onSave: (customer: Customer) => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onClose, onSave }) => {
    const { dispatch } = useData();
    const [formData, setFormData] = useState<Omit<Customer, 'id'>>({
        name: customer?.name || '',
        email: customer?.email || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
        openingBalance: customer?.openingBalance || 0,
    });
    const [isOpeningBalanceEditable, setIsOpeningBalanceEditable] = useState(false);
    const modalRef = useFocusTrap(true);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData({ 
            ...formData, 
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customer) {
            const updatedCustomer = { ...formData, id: customer.id };
            dispatch({ type: 'UPDATE_CUSTOMER', payload: updatedCustomer });
            onSave(updatedCustomer);
        } else {
            const newCustomer = { ...formData, id: crypto.randomUUID() };
            dispatch({ type: 'ADD_CUSTOMER', payload: newCustomer });
            onSave(newCustomer);
        }
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 modal-backdrop flex justify-center items-center z-[60] p-4">
            <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[95vh] flex flex-col" role="dialog" aria-modal="true" aria-labelledby="customer-form-title">
                <header className="flex-shrink-0 p-6 border-b dark:border-gray-700">
                    <h2 id="customer-form-title" className="text-2xl font-bold text-gray-900 dark:text-white">{customer ? 'Edit Customer' : 'Add New Customer'}</h2>
                </header>
                <form onSubmit={handleSubmit} className="flex-grow contents">
                    <main className="flex-grow p-6 space-y-4 overflow-y-auto">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" aria-describedby="name-description"/>
                            <p id="name-description" className="text-xs text-gray-500 dark:text-gray-400 mt-1">The customer's full name or company name.</p>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" aria-describedby="email-description"/>
                            <p id="email-description" className="text-xs text-gray-500 dark:text-gray-400 mt-1">The primary email for invoices and communications.</p>
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" placeholder="e.g. 14155552671" aria-describedby="phone-description"/>
                            <p id="phone-description" className="text-xs text-gray-500 dark:text-gray-400 mt-1">For WhatsApp, include country code without '+', spaces, or dashes.</p>
                        </div>
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                            <textarea id="address" name="address" value={formData.address} onChange={handleChange} rows={3} required className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" aria-describedby="address-description"></textarea>
                            <p id="address-description" className="text-xs text-gray-500 dark:text-gray-400 mt-1">The customer's billing address, for invoices.</p>
                        </div>
                        <div>
                            <label htmlFor="openingBalance" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Opening Balance</label>
                            <div className="mt-1 flex items-center space-x-2">
                                <input 
                                    type="number" 
                                    id="openingBalance" 
                                    name="openingBalance" 
                                    value={formData.openingBalance} 
                                    onChange={handleChange} 
                                    step="0.01"
                                    required 
                                    readOnly={!!customer && !isOpeningBalanceEditable}
                                    className="block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm read-only:bg-gray-100 read-only:cursor-not-allowed"
                                    aria-describedby="balance-description"
                                />
                                {customer && (
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
                            <p id="balance-description" className="text-xs text-gray-500 dark:text-gray-400 mt-1">Amount owed by this customer before using the app. Leave as 0 for new customers.</p>
                        </div>
                    </main>
                    <footer className="flex-shrink-0 flex justify-end space-x-4 p-4 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700 rounded-b-lg sticky bottom-0">
                        <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light">{customer ? 'Update' : 'Save'}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default CustomerForm;