import React, { useState, useEffect } from 'react';
import type { Invoice } from '../types';
import { useData } from '../context/DataContext';
import { LoaderCircle, Send } from 'lucide-react';

interface EmailModalProps {
  invoice: Invoice;
  onClose: () => void;
}

const EmailModal: React.FC<EmailModalProps> = ({ invoice, onClose }) => {
    const { state } = useData();
    const customer = state.customers.find(c => c.id === invoice.customerId);

    const getInvoiceTotals = (inv: Invoice) => {
        const subtotal = inv.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
        const grandTotal = subtotal + (inv.previousDue || 0) - (inv.discount || 0);
        const totalPaid = (inv.payments || []).reduce((acc, p) => acc + p.amount, 0);
        const balanceDue = grandTotal - totalPaid;
        return { balanceDue };
    };

    const { balanceDue } = getInvoiceTotals(invoice);

    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (customer && invoice) {
            setSubject(`Invoice ${invoice.invoiceNumber} from ${state.settings.name}`);
            setBody(
`Dear ${customer.name},

Please find attached your invoice ${invoice.invoiceNumber}.

Amount Due: $${balanceDue.toFixed(2)}
Due Date: ${invoice.dueDate}

Thank you for your business.

Sincerely,
The team at ${state.settings.name}`
            );
        }
    }, [invoice, customer, state.settings.name, balanceDue]);

    const handleSend = async () => {
        if (!customer) {
            alert('Customer not found.');
            return;
        }
        setIsSending(true);
        console.log({
            to: customer.email,
            subject,
            body,
        });
        // Simulate sending email
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSending(false);
        alert(`Email successfully sent to ${customer.email}`);
        onClose();
    };

    if (!customer) {
        // Handle case where customer might not be found
        return (
             <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full">
                    <h2 className="text-xl font-bold mb-4 text-red-600">Error</h2>
                    <p>Could not find the customer associated with this invoice.</p>
                     <div className="flex justify-end mt-6">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Close</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-6">Email Invoice {invoice.invoiceNumber}</h2>
                <div className="space-y-4 flex-grow overflow-y-auto pr-2">
                    <div>
                        <label htmlFor="to" className="block text-sm font-medium text-gray-700">To</label>
                        <input type="email" id="to" name="to" value={customer.email} disabled className="mt-1 block w-full p-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                        <input type="text" id="subject" name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label htmlFor="body" className="block text-sm font-medium text-gray-700">Body</label>
                        <textarea id="body" name="body" value={body} onChange={(e) => setBody(e.target.value)} rows={10} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"></textarea>
                    </div>
                </div>
                <div className="flex justify-end space-x-4 pt-6 mt-auto border-t">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300" disabled={isSending}>Cancel</button>
                    <button 
                        type="button" 
                        onClick={handleSend}
                        className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light flex items-center justify-center w-32 disabled:opacity-75"
                        disabled={isSending}
                    >
                        {isSending ? (
                            <>
                                <LoaderCircle className="animate-spin h-5 w-5 mr-2" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="h-5 w-5 mr-2" />
                                Send Email
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailModal;
