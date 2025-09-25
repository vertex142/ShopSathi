import React, { useState, useMemo } from 'react';
import { Invoice, CreditNote, CreditNoteStatus } from '../types';
import { useData } from '../context/DataContext';
import { generateNextDocumentNumber } from '../utils/documentNumber';
import { formatCurrency } from '../utils/formatCurrency';

interface CreditNoteFormProps {
  originalInvoice: Invoice;
  onClose: () => void;
}

const CreditNoteForm: React.FC<CreditNoteFormProps> = ({ originalInvoice, onClose }) => {
  const { state, dispatch } = useData();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-full flex flex-col">
        <header className="flex-shrink-0 p-6 border-b">
            <h2 className="text-2xl font-bold">Create Credit Note</h2>
            <p className="text-sm text-gray-500">For Invoice #{originalInvoice.invoiceNumber}</p>
        </header>
        <main className="flex-grow p-6 space-y-6 overflow-y-auto">
            <div>
                <h3 className="font-semibold text-gray-800">Customer: {customer?.name}</h3>
                <p className="text-sm text-gray-600">This will credit the customer's account and reverse the original sale.</p>
            </div>
            
            <div className="border rounded-lg">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-2 text-left">Item</th>
                            <th className="p-2 text-center">Qty</th>
                            <th className="p-2 text-right">Rate</th>
                            <th className="p-2 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {originalInvoice.items.map(item => (
                            <tr key={item.id} className="border-t">
                                <td className="p-2">{item.name}</td>
                                <td className="p-2 text-center">{item.quantity}</td>
                                <td className="p-2 text-right">{formatCurrency(item.rate)}</td>
                                <td className="p-2 text-right">{formatCurrency(item.rate * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                    {taxAmount > 0 && <div className="flex justify-between"><span className="text-gray-600">Tax Reversal:</span><span>{formatCurrency(taxAmount)}</span></div>}
                    <div className="flex justify-between font-bold text-lg border-t pt-2"><span >Total Credit:</span><span>{formatCurrency(total)}</span></div>
                </div>
            </div>

             <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason for Credit</label>
                <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required rows={3} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"></textarea>
            </div>

            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
                <p className="font-bold">Confirmation</p>
                <p className="text-sm">Creating this credit note is an irreversible accounting action. It will finalize the credit and update the original invoice's status.</p>
            </div>

        </main>
        <footer className="flex-shrink-0 flex justify-end space-x-4 p-4 border-t bg-gray-50 rounded-b-lg">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
            <button type="submit" className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light">Create and Finalize Credit Note</button>
        </footer>
      </form>
    </div>
  );
};

export default CreditNoteForm;
