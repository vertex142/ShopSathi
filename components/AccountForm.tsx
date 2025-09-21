import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Account, AccountType } from '../types';

interface AccountFormProps {
    account: Account | null;
    onClose: () => void;
}

const AccountForm: React.FC<AccountFormProps> = ({ account, onClose }) => {
    const { addAccount, updateAccount } = useData();
    const [formData, setFormData] = useState({
        name: account?.name || '',
        type: account?.type || AccountType.Expense,
        balance: account?.balance || 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData({ 
            ...formData, 
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (account) {
            await updateAccount({ 
                ...account, // Preserve id, userId, isSystemAccount, balance from original
                name: formData.name, 
                type: formData.type,
            });
        } else {
            // For new accounts, balance is set from form, and it's not a system account
            await addAccount({
                ...formData,
                isSystemAccount: false,
            });
        }
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full">
                <h2 className="text-2xl font-bold mb-6">{account ? 'Edit Account' : 'Add New Account'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Account Name</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                     <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Account Type</label>
                        <select id="type" name="type" value={formData.type} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm">
                            {Object.values(AccountType).map(type => (
                                <option key={type} value={type} className="capitalize">{type.toLowerCase()}</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="balance" className="block text-sm font-medium text-gray-700">Opening Balance ($)</label>
                        <input 
                            type="number" 
                            id="balance" 
                            name="balance" 
                            value={formData.balance} 
                            onChange={handleChange} 
                            step="0.01"
                            required 
                            className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"
                            disabled={!!account} // Cannot change balance directly after creation
                        />
                        {account && <p className="text-xs text-gray-500 mt-1">Account balance must be updated via journal entries.</p>}
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light">{account ? 'Update' : 'Save'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountForm;