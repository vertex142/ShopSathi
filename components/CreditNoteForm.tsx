import React, { useState, useMemo, useRef } from 'react';
import { Invoice, CreditNote, CreditNoteStatus } from '../types';
import { useData } from '../context/DataContext';
import { generateNextDocumentNumber } from '../utils/documentNumber';
import { formatCurrency } from '../utils/formatCurrency';
import useFocusTrap from '../hooks/useFocusTrap';
import { X } from 'lucide-react';

interface CreditNoteFormProps {
  originalInvoice: Invoice;
  onClose: () => void;
}

const CreditNoteForm: React.FC<CreditNoteFormProps> = ({ originalInvoice, onClose }) => {
  const { state, dispatch } = useData();
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef);
  
  const [reason, setReason] = useState('');

  const customer = state.customers.find(c => c.id === originalInvoice.customerId);

  const subtotal = useMemo(() => originalInvoice.items.reduce((sum, item) => sum + item.quantity * item.rate, 0), [originalInvoice.items]);
  const taxAmount = originalInvoice.taxAmount || 0;
  const total = subtotal + taxAmount; // Note: Credit notes typically don't include discounts or previous dues.

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
        alert("Please provide a reason for creating the credit note.");
        return;
    }

    const newCreditNote: Omit<CreditNote, 'id'> = {
        creditNoteNumber: generateNextDocumentNumber(state.creditNotes, 'creditNoteNumber', 'CN-'),
        originalInvoiceId: originalInvoice.id,
        customerId: originalInvoice.customerId,
        issueDate: new Date().toISOString().split('T')[0],
        items: originalInvoice.items,
        status: CreditNoteStatus.Finalized, // Finalize immediately on creation
        reason: reason,
        subtotal: subtotal,
        taxAmount: taxAmount,
        total: total,
    };
    
    dispatch({ type: 'ADD_CREDIT_NOTE', payload: newCreditNote });
    onClose();
  };

  return (
    <div ref={modalRef} className="fixed inset-0 bg-black bg-opacity-50 modal-backdrop flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="cn-form-title">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        <header className="flex-shrink-0 flex justify-between items-center p-6 border-b dark:border-gray-700">
            <div>
                <h2 id="cn-form-title" className="text-2xl font-bold text-gray-900 dark:text-white">Create Credit Note</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">For Invoice #{originalInvoice.invoiceNumber}</p>
            </div>
             <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600">
              <X className="h-5 w-5"/>
            </button>
        </header>
        <main className="flex-grow p-6 space-y-6 overflow-y-auto">
            <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Customer: {customer?.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">This will credit the customer's account and reverse the original sale.</p>
            </div>
            
            <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-2 text-left font-medium text-gray-600 dark:text-gray-300">Item</th>
                            <th className="p-2 text-center font-medium text-gray-600 dark:text-gray-300">Qty</th>
                            <th className="p-2 text-right font-medium text-gray-600 dark:text-gray-300">Rate</th>
                            <th className="p-2 text-right font-medium text-gray-600 dark:text-gray-300">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {originalInvoice.items.map(item => (
                            <tr key={item.id}>
                                <td className="p-2 text-gray-800 dark:text-gray-200">{item.name}</td>
                                <td className="p-2 text-center text-gray-600 dark:text-gray-300">{item.quantity}</td>
                                <td className="p-2 text-right text-gray-600 dark:text-gray-300">{formatCurrency(item.rate)}</td>
                                <td className="p-2 text-right text-gray-800 dark:text-gray-200">{formatCurrency(item.rate * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-2 text-gray-800 dark:text-gray-200">
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                    {taxAmount > 0 && <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Tax Reversal:</span><span>{formatCurrency(taxAmount)}</span></div>}
                    <div className="flex justify-between font-bold text-lg border-t dark:border-gray-600 pt-2"><span >Total Credit:</span><span>{formatCurrency(total)}</span></div>
                </div>
            </div>

             <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason for Credit</label>
                <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required rows={3} className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"></textarea>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-300">
                <p className="font-bold">Confirmation</p>
                <p className="text-sm">Creating this credit note is an irreversible accounting action. It will finalize the credit and update the original invoice's status.</p>
            </div>

        </main>
        <footer className="flex-shrink-0 flex justify-end space-x-4 p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
            <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
            <button type="submit" className="bg-brand-blue dark:bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-brand-blue-light dark:hover:bg-blue-500">Create and Finalize Credit Note</button>
        </footer>
      </form>
    </div>
  );
};

export default CreditNoteForm;
