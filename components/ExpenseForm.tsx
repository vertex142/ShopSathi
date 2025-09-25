import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Expense, Account, AccountType } from '../types';
import { LoaderCircle, Paperclip, Plus, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import AccountForm from '../components/AccountForm';
import SearchableSelect from './SearchableSelect';

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
        attachment: expense?.attachment,
        attachmentMimeType: expense?.attachmentMimeType,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [showAccountForm, setShowAccountForm] = useState(false);

    const expenseAccountOptions = useMemo(() => 
        state.accounts.filter(a => a.type === AccountType.Expense).map(a => ({ value: a.id, label: a.name }))
    , [state.accounts]);

    const paymentAccountOptions = useMemo(() =>
        state.accounts.filter(a => a.type === AccountType.Asset || a.type === AccountType.Liability).map(a => ({ value: a.id, label: a.name }))
    , [state.accounts]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'number' ? parseFloat(value) : value,
        });
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert("File size exceeds 2MB. Please choose a smaller file.");
                e.target.value = ''; // Reset the input
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                setFormData(prev => ({ ...prev, attachment: base64String, attachmentMimeType: file.type }));
            };
            reader.readAsDataURL(file);
        }
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

    const handleNewAccountSave = (newAccount: Account) => {
        setFormData(prev => ({ ...prev, debitAccountId: newAccount.id }));
        setShowAccountForm(false);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                    <header className="flex-shrink-0 p-6 border-b">
                        <h2 className="text-2xl font-bold">{expense ? 'Edit Expense' : 'Add New Expense'}</h2>
                    </header>
                    <main className="flex-grow p-6 space-y-4 overflow-y-auto">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                            <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                            <p className="text-xs text-gray-500 mt-1">The date the expense was incurred.</p>
                        </div>
                        <div>
                            <label htmlFor="debitAccountId" className="block text-sm font-medium text-gray-700">Expense Account (Debit)</label>
                            <div className="flex items-center space-x-2 mt-1">
                                <SearchableSelect
                                    value={formData.debitAccountId}
                                    onChange={(val) => setFormData(prev => ({...prev, debitAccountId: val}))}
                                    options={expenseAccountOptions}
                                    placeholder="Select expense category"
                                    className="w-full"
                                />
                                <button type="button" onClick={() => setShowAccountForm(true)} className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300" title="Add New Expense Account">
                                    <Plus className="h-5 w-5" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Select the expense category. This increases the balance of the chosen expense account.</p>
                        </div>
                        <div>
                            <label htmlFor="creditAccountId" className="block text-sm font-medium text-gray-700">Paid From (Credit)</label>
                            <SearchableSelect
                                value={formData.creditAccountId}
                                onChange={(val) => setFormData(prev => ({...prev, creditAccountId: val}))}
                                options={paymentAccountOptions}
                                placeholder="Select payment source"
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">Select the account you used to pay for this expense (e.g., Cash, Bank). This decreases the balance of that account.</p>
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"></textarea>
                            <p className="text-xs text-gray-500 mt-1">A brief description of what this expense was for.</p>
                        </div>
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
                            <input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} required min="0.01" step="0.01" className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                            <p className="text-xs text-gray-500 mt-1">The total amount of the expense.</p>
                        </div>
                        <div>
                            <label htmlFor="attachment" className="block text-sm font-medium text-gray-700">Attach Receipt</label>
                            <input type="file" id="attachment" name="attachment" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                            <p className="text-xs text-gray-500 mt-1">Optional. Upload a copy of the receipt (PDF, JPG, PNG). Max 2MB.</p>
                            {formData.attachment && formData.attachmentMimeType?.startsWith('image/') && (
                                <img src={`data:${formData.attachmentMimeType};base64,${formData.attachment}`} alt="Receipt preview" className="mt-2 max-h-32 rounded border"/>
                            )}
                        </div>
                    </main>
                    <footer className="flex-shrink-0 flex justify-end space-x-4 p-4 bg-gray-50 border-t rounded-b-lg sticky bottom-0">
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
            {showAccountForm && (
                <AccountForm
                    account={null}
                    onClose={() => setShowAccountForm(false)}
                    onSave={handleNewAccountSave}
                    defaultAccountType={AccountType.Expense}
                />
            )}
        </>
    );
};

export default ExpenseForm;
