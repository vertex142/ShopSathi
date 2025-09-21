import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Customer } from '../types';

interface CustomerFormProps {
    customer: Customer | null;
    onClose: () => void;
    onSave: (customer: Customer) => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onClose, onSave }) => {
    const { addCustomer, updateCustomer } = useData();
    const [formData, setFormData] = useState<Omit<Customer, 'id' | 'userId'>>({
        name: customer?.name || '',
        email: customer?.email || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
        openingBalance: customer?.openingBalance || 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData({ 
            ...formData, 
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (customer) {
            await updateCustomer({ ...formData, id: customer.id, userId: customer.userId });
            onSave({ ...formData, id: customer.id, userId: customer.userId });
        } else {
            // The userId will be added by the context function
            await addCustomer(formData);
            // We don't have the ID here, but the parent component will get it from the real-time update
            onSave({ ...formData, id: 'temp-id', userId: 'temp-userId' } as Customer);
        }
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60]">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full">
                <h2 className="text-2xl font-bold mb-6">{customer ? 'Edit Customer' : 'Add New Customer'}</h2>
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
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light">{customer ? 'Update' : 'Save'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerForm;