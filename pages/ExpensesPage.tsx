import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Expense, AccountType } from '../types';
import { LoaderCircle } from 'lucide-react';

interface ExpenseFormProps {
    expense: Expense | null;
    onClose: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ expense, onClose }) => {
    const { state, dispatch } = useData();
    const [formData, setFormData] = useState<Omit<Expense, 'id'>>({
        date: expense?.date || new Date().toISOString().split('T')[0],
        description: expense?.description || '',
        amount: expense?.amount || 0,
        debitAccountId: expense?.debitAccountId || '',
        creditAccountId: expense?.creditAccountId || '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'number' ? parseFloat(value) : value,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.debitAccountId || !formData.creditAccountId) {
            alert('Please select both a debit and credit account.');
            return;
        }

        setIsSaving(true);
        setTimeout(() => {
            if (expense) {
                dispatch({ type: 'UPDATE_EXPENSE', payload: { ...formData, id: expense.id } });
            } else {
                dispatch({ type: 'ADD_EXPENSE', payload: formData });
            }
            onClose();
        }, 500);
    };

    const expenseAccounts = state.accounts.filter(a => a.type === AccountType.Expense);
    const paymentAccounts = state.accounts.filter(a => a.type === AccountType.Asset || a.type === AccountType.Liability);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <header className="flex-shrink-0 p-6 border-b">
                    <h2 className="text-2xl font-bold">{expense ? 'Edit Expense' : 'Add New Expense'}</h2>
                </header>
                <main className="flex-grow p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                        <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                     <div>
                        <label htmlFor="debitAccountId" className="block text-sm font-medium text-gray-700">Expense Account (Debit)</label>
                        <select id="debitAccountId" name="debitAccountId" value={formData.debitAccountId} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm">
                            <option value="">Select expense category</option>
                            {expenseAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="creditAccountId" className="block text-sm font-medium text-gray-700">Paid From (Credit)</label>
                        <select id="creditAccountId" name="creditAccountId" value={formData.creditAccountId} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm">
                            <option value="">Select payment source</option>
                            {paymentAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"></textarea>
                    </div>
                     <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
                        <input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} required min="0.01" step="0.01" className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                </main>
                <footer className="flex-shrink-0 flex justify-end space-x-4 p-4 bg-gray-50 border-t rounded-b-lg">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300" disabled={isSaving}>Cancel</button>
                    <button 
                        type="submit" 
                        className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light flex items-center justify-center w-28 disabled:opacity-75"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <LoaderCircle className="animate-spin h-5 w-5 mr-2" />
                                Saving...
                            </>
                        ) : (
                            expense ? 'Update' : 'Save'
                        )}
                    </button>
                </footer>
            </form>
        </div>
    );
};

const ExpensesPage: React.FC = React.memo(() => {
    const { state, dispatch } = useData();
    const [showForm, setShowForm] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

    const handleEdit = (expense: Expense) => {
        setSelectedExpense(expense);
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this expense? This will also reverse the transaction in your accounts.')) {
            dispatch({ type: 'DELETE_EXPENSE', payload: id });
        }
    };
    
    const handleAddNew = () => {
        setSelectedExpense(null);
        setShowForm(true);
    };

    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Expenses</h1>
                <button onClick={handleAddNew} className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light transition-colors">
                    Add New Expense
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expense Account</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid From</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {state.expenses.map((expense) => {
                                const debitAccount = state.accounts.find(a => a.id === expense.debitAccountId);
                                const creditAccount = state.accounts.find(a => a.id === expense.creditAccountId);
                                return (
                                <tr key={expense.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{debitAccount?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{creditAccount?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">-${expense.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleEdit(expense)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                        <button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
                {state.expenses.length === 0 && <p className="text-center py-10 text-gray-500">No expenses found. Add one to get started!</p>}
            </div>

            {showForm && <ExpenseForm expense={selectedExpense} onClose={() => setShowForm(false)} />}
        </div>
    );
});

export default ExpensesPage;