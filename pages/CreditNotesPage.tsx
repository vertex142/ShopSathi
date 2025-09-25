import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { CreditNote, CreditNoteStatus } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import CreditNotePreview from '../components/CreditNotePreview';

interface CreditNotesPageProps {
    onViewCustomer: (customerId: string) => void;
}

const CreditNotesPage: React.FC<CreditNotesPageProps> = React.memo(({ onViewCustomer }) => {
  const { state, dispatch } = useData();
  const [noteToPreview, setNoteToPreview] = useState<CreditNote | null>(null);

  const handleDelete = (note: CreditNote) => {
    if (note.status === CreditNoteStatus.Finalized) {
      alert('Finalized credit notes cannot be deleted as they have impacted your accounting records.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this draft credit note?')) {
      dispatch({ type: 'DELETE_CREDIT_NOTE', payload: note.id });
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Credit Notes</h1>
        <p className="text-gray-500">Credit notes are created from the Invoices page.</p>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Note #</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Invoice #</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {state.creditNotes.length > 0 ? (
                        state.creditNotes.map((note) => {
                            const customer = state.customers.find(c => c.id === note.customerId);
                            const invoice = state.invoices.find(i => i.id === note.originalInvoiceId);
                            return (
                                <tr key={note.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{note.creditNoteNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <button onClick={() => onViewCustomer(note.customerId)} className="hover:underline text-brand-blue">
                                            {customer?.name || 'N/A'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice?.invoiceNumber || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{note.issueDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(note.total)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            note.status === CreditNoteStatus.Finalized ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {note.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                        <button onClick={() => setNoteToPreview(note)} className="text-blue-600 hover:text-blue-900">Preview</button>
                                        <button 
                                            onClick={() => handleDelete(note)} 
                                            className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                                            disabled={note.status === CreditNoteStatus.Finalized}
                                            title={note.status === CreditNoteStatus.Finalized ? "Cannot delete finalized notes" : "Delete"}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            )
                        })
                    ) : (
                        <tr>
                           <td colSpan={7} className="text-center py-10 text-gray-500">
                                No credit notes found.
                           </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
      
      {noteToPreview && (
        <CreditNotePreview
            creditNote={noteToPreview}
            onClose={() => setNoteToPreview(null)}
        />
      )}
    </div>
  );
});

export default CreditNotesPage;