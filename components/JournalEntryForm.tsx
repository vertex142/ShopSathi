import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { JournalEntry, JournalEntryItem } from '../types';
import { Trash2 } from 'lucide-react';

interface JournalEntryFormProps {
    entry: JournalEntry | null;
    onClose: () => void;
}

const JournalEntryForm: React.FC<JournalEntryFormProps> = ({ entry, onClose }) => {
    const { state, dispatch } = useData();
    const [formData, setFormData] = useState<Omit<JournalEntry, 'id'>>({
        date: entry?.date || new Date().toISOString().split('T')[0],
        memo: entry?.memo || '',
        items: entry?.items || [
            { id: crypto.randomUUID(), accountId: '', debit: 0, credit: 0, description: '' },
            { id: crypto.randomUUID(), accountId: '', debit: 0, credit: 0, description: '' },
        ],
    });

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl w-full max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-6 flex-shrink-0">{entry ? 'Edit Journal Entry' : 'Create Journal Entry'}</h2>
                <form id="journal-entry-form" onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                            <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label htmlFor="memo" className="block text-sm font-medium text-gray-700">Memo / Description</label>
                            <input type="text" id="memo" name="memo" placeholder="e.g., Record monthly rent" value={formData.memo} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="border-b">
                                <tr>
                                    <th className="py-2 text-left text-sm font-semibold text-gray-600">Account</th>
                                    <th className="py-2 text-right text-sm font-semibold text-gray-600">Debit</th>
                                    <th className="py-2 text-right text-sm font-semibold text-gray-600">Credit</th>
                                    <th className="py-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.items.map((item, index) => (
                                    <tr key={item.id} className="border-b">
                                        <td className="py-2 pr-2">
                                            <select 
                                                value={item.accountId} 
                                                onChange={(e) => handleItemChange(index, 'accountId', e.target.value)}
                                                required
                                                className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"
                                            >
                                                <option value="">Select Account</option>
                                                {state.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="py-2 px-2">
                                            <input 
                                                type="number" 
                                                value={item.debit || ''}
                                                onChange={(e) => handleItemChange(index, 'debit', parseFloat(e.target.value) || 0)}
                                                min="0" step="0.01"
                                                className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm text-right"
                                            />
                                        </td>
                                        <td className="py-2 pl-2">
                                            <input 
                                                type="number" 
                                                value={item.credit || ''}
                                                onChange={(e) => handleItemChange(index, 'credit', parseFloat(e.target.value) || 0)}
                                                min="0" step="0.01"
                                                className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm text-right"
                                            />
                                        </td>
                                        <td className="py-2 pl-2 text-center">
                                             <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="h-5 w-5" />
                                             </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                             <tfoot className="border-t">
                                <tr>
                                    <td className="py-2 pr-2 text-right font-semibold">Totals</td>
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
                     <div className="flex-shrink-0 pt-4">
                        <button type="button" onClick={addItem} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">+ Add Line Item</button>
                    </div>
                </form>
                <div className="flex-shrink-0 flex justify-end space-x-4 pt-6 mt-4 border-t">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
                    <button 
                        type="submit" 
                        form="journal-entry-form"
                        disabled={!isBalanced}
                        className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {entry ? 'Update Entry' : 'Save Entry'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JournalEntryForm;
