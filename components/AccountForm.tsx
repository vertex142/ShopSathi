import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Account, AccountType } from '../types';
import useFocusTrap from '../hooks/useFocusTrap';
import { X } from 'lucide-react';

interface AccountFormProps {
    account: Account | null;
    onClose: () => void;
    onSave?: (account: Account) => void;
    defaultAccountType?: AccountType;
}

const AccountForm: React.FC<AccountFormProps> = ({ account, onClose, onSave, defaultAccountType }) => {
    const { dispatch } = useData();
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef);
    
    const [formData, setFormData] = useState({
        name: account?.name || '',
        type: account?.type || defaultAccountType || AccountType.Expense,
        openingBalance: account?.openingBalance || 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData({ 
            ...formData, 
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (account) {
            const updatedAccount = { 
                ...account,
                name: formData.name, 
                openingBalance: formData.openingBalance,
                type: account.isSystemAccount ? account.type : formData.type,
            };
            dispatch({ type: 'UPDATE_ACCOUNT', payload: updatedAccount });
            if (onSave) onSave(updatedAccount);
        } else {
            const newAccount: Account = {
                id: crypto.randomUUID(),
                name: formData.name,
                type: formData.type,
                openingBalance: formData.openingBalance,
                balance: 0,
                isSystemAccount: false,
            };
            dispatch({ type: 'ADD_ACCOUNT', payload: newAccount });
            if (onSave) onSave(newAccount);
        }
        onClose();
    };
    
    return (
        <div ref={modalRef} className="fixed inset-0 bg-black bg-opacity-50 modal-backdrop flex justify-center items-center z-[60] p-4" role="dialog" aria-modal="true" aria-labelledby="account-form-title">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[95vh] flex flex-col">
                <header className="flex-shrink-0 flex justify-between items-center p-6 border-b dark:border-gray-700">
                    <h2 id="account-form-title" className="text-2xl font-bold text-gray-900 dark:text-white">{account ? 'Edit Account' : 'Add New Account'}</h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600">
                      <X className="h-5 w-5"/>
                    </button>
                </header>
                <main className="flex-grow p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Name</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"/>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">The name of the account as it will appear on your reports (e.g., "Office Supplies", "Printing Revenue").</p>
                    </div>
                     <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Type</label>
                        <select 
                            id="type" 
                            name="type" 
                            value={formData.type} 
                            onChange={handleChange} 
                            required 
                            className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                            disabled={account?.isSystemAccount || !!defaultAccountType}
                            title={account?.isSystemAccount ? "The type of a system account cannot be changed." : ""}
                        >
                            {Object.values(AccountType).map(type => (
                                <option key={type} value={type} className="capitalize">{type.toLowerCase()}</option>
                            ))}
                        </select>
                        {account?.isSystemAccount && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1" title="A tooltip has been added to the system account badge on the main accounts page to explain this.">System accounts are essential for core app functions.</p>}
                    </div>
                     <div>
                        <label htmlFor="openingBalance" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Opening Balance ($)</label>
                        <input 
                            type="number" 
                            id="openingBalance" 
                            name="openingBalance" 
                            value={formData.openingBalance} 
                            onChange={handleChange} 
                            step="0.01"
                            required 
                            className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Set the account's starting balance when you begin using the app. This is kept separate from ongoing transactions.</p>
                    </div>
                </main>
                <footer className="flex-shrink-0 flex justify-end space-x-4 p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
                    <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                    <button type="submit" className="bg-brand-blue dark:bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-brand-blue-light dark:hover:bg-blue-500">{account ? 'Update' : 'Save'}</button>
                </footer>
            </form>
        </div>
    );
};

export default AccountForm;
