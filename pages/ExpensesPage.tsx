import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Expense } from '../types';
import { Paperclip, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import ExpenseForm from '../components/ExpenseForm';

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

    const handleViewAttachment = (expense: Expense) => {
        if (expense.attachment && expense.attachmentMimeType) {
            const byteCharacters = atob(expense.attachment);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: expense.attachmentMimeType });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        }
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                                        -{formatCurrency(expense.amount)}
                                        {expense.attachment && (
                                            <button onClick={() => handleViewAttachment(expense)} className="ml-2 text-gray-400 hover:text-brand-blue" title="View attached receipt">
                                                <Paperclip className="h-4 w-4 inline-block" />
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end items-center space-x-1">
                                            <button onClick={() => handleEdit(expense)} className="text-indigo-600 hover:text-indigo-900 p-1" title="Edit Expense"><Edit className="h-4 w-4"/></button>
                                            <button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-900 p-1" title="Delete Expense"><Trash2 className="h-4 w-4"/></button>
                                        </div>
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
