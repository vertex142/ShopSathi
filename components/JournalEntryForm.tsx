import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import { JournalEntry, JournalEntryItem } from '../types';
import { Trash2, X } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import useFocusTrap from '../hooks/useFocusTrap';

interface JournalEntryFormProps {
    entry: JournalEntry | null;
    onClose: () => void;
}

const JournalEntryForm: React.FC<JournalEntryFormProps> = ({ entry, onClose }) => {
    const { state, dispatch } = useData();
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef);
    
    const [formData, setFormData] = useState<Omit<JournalEntry, 'id'>>({
        date: entry?.date || new Date().toISOString().split('T')[0],
        memo: entry?.memo || '',
        items: entry?.items || [
            { id: crypto.randomUUID(), accountId: '', debit: 0, credit: 0, description: '' },
            { id: crypto.randomUUID(), accountId: '', debit: 0, credit: 0, description: '' },
        ],
    });

    const accountOptions = useMemo(() => state.accounts.map(acc => ({ value: acc.id, label: acc.name })), [state.accounts]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleItemChange = (index: number, field: keyof Omit<JournalEntryItem, 'id'>, value: string | number) => {
        const newItems = [...formData.items];
        (newItems[index] as any)[field] = value;

        if (field === 'debit' && Number(value) > 0) {
            newItems[index].credit = 0;
        } else if (field === 'credit' && Number(value) > 0) {
            newItems[index].debit = 0;
        }
        
        setFormData({ ...formData, items: newItems });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { id: crypto.randomUUID(), accountId: '', debit: 0, credit: 0, description: '' }],
        });
    };

    const removeItem = (index: number) => {
        if (formData.items.length <= 2) {
            alert("A journal entry must have at least two lines.");
            return;
        }
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };
    
    const { totalDebit, totalCredit } = useMemo(() => {
        return formData.items.reduce(
            (totals, item) => ({
                totalDebit: totals.totalDebit + (item.debit || 0),
                totalCredit: totals.totalCredit + (item.credit || 0),
            }),
            { totalDebit: 0, totalCredit: 0 }
        );
    }, [formData.items]);

    const isBalanced = totalDebit === totalCredit && totalDebit > 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isBalanced) {
            alert('The journal entry is not balanced. Total debits must equal total credits and be greater than zero.');
            return;
        }
        if (entry) {
            dispatch({ type: 'UPDATE_JOURNAL_ENTRY', payload: { ...formData, id: entry.id } });
        } else {
            dispatch({ type: 'ADD_JOURNAL_ENTRY', payload: formData });
        }
        onClose();
    };

    return (
        <div ref={modalRef} className="fixed inset-0 bg-black bg-opacity-50 modal-backdrop flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="journal-form-title">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
                <header className="flex-shrink-0 flex justify-between items-center p-6 border-b dark:border-gray-700">
                    <h2 id="journal-form-title" className="text-2xl font-bold text-gray-900 dark:text-white">{entry ? 'Edit Journal Entry' : 'Create Journal Entry'}</h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600">
                      <X className="h-5 w-5"/>
                    </button>
                </header>
                <main className="flex-grow p-6 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                            <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label htmlFor="memo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Memo / Description</label>
                            <input type="text" id="memo" name="memo" placeholder="e.g., Record monthly rent" value={formData.memo} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"/>
                        </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md border dark:border-gray-700">A journal entry must have at least two line items. The total of all Debits must equal the total of all Credits for the entry to be balanced.</p>

                    {/* Items Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="border-b dark:border-gray-700">
                                <tr>
                                    <th className="py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Account</th>
                                    <th className="py-2 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">Debit</th>
                                    <th className="py-2 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">Credit</th>
                                    <th className="py-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.items.map((item, index) => (
                                    <tr key={item.id} className="border-b dark:border-gray-700">
                                        <td className="py-2 pr-2">
                                            <SearchableSelect
                                                value={item.accountId}
                                                onChange={(val) => handleItemChange(index, 'accountId', val)}
                                                options={accountOptions}
                                                placeholder="Select Account"
                                            />
                                        </td>
                                        <td className="py-2 px-2">
                                            <input 
                                                type="number" 
                                                value={item.debit || ''}
                                                onChange={(e) => handleItemChange(index, 'debit', parseFloat(e.target.value) || 0)}
                                                min="0" step="0.01"
                                                className="w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-right"
                                            />
                                        </td>
                                        <td className="py-2 pl-2">
                                            <input 
                                                type="number" 
                                                value={item.credit || ''}
                                                onChange={(e) => handleItemChange(index, 'credit', parseFloat(e.target.value) || 0)}
                                                min="0" step="0.01"
                                                className="w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-right"
                                            />
                                        </td>
                                        <td className="py-2 pl-2 text-center">
                                             <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                                <Trash2 className="h-5 w-5" />
                                             </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                             <tfoot className="border-t dark:border-gray-700">
                                <tr>
                                    <td className="py-2 pr-2 text-right font-semibold text-gray-800 dark:text-gray-200">Totals</td>
                                    <td className={`py-2 px-2 text-right font-bold ${!isBalanced ? 'text-red-500' : 'text-green-600'}`}>
                                        ${totalDebit.toFixed(2)}
                                    </td>
                                    <td className={`py-2 pl-2 text-right font-bold ${!isBalanced ? 'text-red-500' : 'text-green-600'}`}>
                                        ${totalCredit.toFixed(2)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                     <div className="pt-4">
                        <button type="button" onClick={addItem} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">+ Add Line Item</button>
                    </div>
                </main>
                <footer className="flex-shrink-0 flex justify-end space-x-4 p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
                    <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                    <button 
                        type="submit"
                        disabled={!isBalanced}
                        className="bg-brand-blue dark:bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-brand-blue-light dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {entry ? 'Update Entry' : 'Save Entry'}
                    </button>
                </footer>
            </form>
        </div>
    );
};

export default JournalEntryForm;
