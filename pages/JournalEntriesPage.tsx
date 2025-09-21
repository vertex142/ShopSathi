import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { JournalEntry } from '../types';
import JournalEntryForm from '../components/JournalEntryForm';

const JournalEntriesPage: React.FC = () => {
    const { state, deleteJournalEntry } = useData();
    const [showForm, setShowForm] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

    const handleEdit = (entry: JournalEntry) => {
        setSelectedEntry(entry);
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this journal entry? This action will reverse the transaction and affect account balances.')) {
            deleteJournalEntry(id);
        }
    };
    
    const handleAddNew = () => {
        setSelectedEntry(null);
        setShowForm(true);
    };

    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Journal Entries</h1>
                <button onClick={handleAddNew} className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light transition-colors">
                    Add New Entry
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Memo / Description</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {state.journalEntries.map((entry) => (
                                <tr key={entry.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{entry.id.substring(0, 8)}...</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.memo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleEdit(entry)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                        <button onClick={() => handleDelete(entry.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {state.journalEntries.length === 0 && <p className="text-center py-10 text-gray-500">No journal entries found. Add one to get started!</p>}
            </div>

            {showForm && <JournalEntryForm entry={selectedEntry} onClose={() => setShowForm(false)} />}
        </div>
    );
};

export default JournalEntriesPage;