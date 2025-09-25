import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Account, AccountType } from '../types';
import AccountForm from '../components/AccountForm';
import { formatCurrency } from '../utils/formatCurrency';
import { Edit, Trash2 } from 'lucide-react';
import ActionMenu, { ActionMenuItem } from '../components/ActionMenu';

const AccountsPage: React.FC = React.memo(() => {
    const { state, dispatch } = useData();
    const [showForm, setShowForm] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

    const handleEdit = (account: Account) => {
        setSelectedAccount(account);
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        const account = state.accounts.find(acc => acc.id === id);
        if (account?.isSystemAccount) {
            alert('System accounts cannot be deleted.');
            return;
        }
        if (window.confirm('Are you sure you want to delete this account?')) {
            dispatch({ type: 'DELETE_ACCOUNT', payload: id });
        }
    };
    
    const handleAddNew = () => {
        setSelectedAccount(null);
        setShowForm(true);
    };

    const accountsByType = useMemo(() => {
        return state.accounts.reduce((acc, account) => {
            if (!acc[account.type]) {
                acc[account.type] = [];
            }
            acc[account.type].push(account);
            return acc;
        }, {} as Record<AccountType, Account[]>);
    }, [state.accounts]);

    const accountTypes = Object.values(AccountType);

    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Chart of Accounts</h1>
                <button onClick={handleAddNew} className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light transition-colors">
                    Add New Account
                </button>
            </div>
            
            <div className="space-y-8">
                {accountTypes.map(type => (
                    (accountsByType[type] && accountsByType[type].length > 0) && (
                        <div key={type} className="bg-white shadow-md rounded-lg overflow-hidden">
                            <h2 className="px-6 py-4 text-lg font-semibold text-gray-700 bg-gray-50 border-b capitalize">{type.toLowerCase().replace('_', ' ')} Accounts</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {accountsByType[type].map((account) => {
                                            const totalBalance = (account.balance || 0) + (account.openingBalance || 0);
                                            const actions: ActionMenuItem[] = [
                                                { label: 'Edit', icon: Edit, onClick: () => handleEdit(account), className: 'text-indigo-600' },
                                                { label: 'Delete', icon: Trash2, onClick: () => handleDelete(account.id), className: 'text-red-600', disabled: account.isSystemAccount },
                                            ];
                                            return (
                                            <tr key={account.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {account.name}
                                                    {account.isSystemAccount && <span className="ml-2 text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full cursor-help" title="System accounts are essential for core accounting functions and cannot be deleted or have their type changed.">System</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-mono">{formatCurrency(totalBalance)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <ActionMenu actions={actions} />
                                                </td>
                                            </tr>
                                        )})}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                ))}
            </div>

            {showForm && <AccountForm account={selectedAccount} onClose={() => setShowForm(false)} />}
        </div>
    );
});

export default AccountsPage;
