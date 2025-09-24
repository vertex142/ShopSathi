import React, { useState, useEffect } from 'react';
import type { Invoice } from '../types';
import { useData } from '../context/DataContext';
import { Copy, Check } from 'lucide-react';
import InvoicesPage from '../pages/InvoicesPage';


interface EmailModalProps {
  invoice: Invoice;
  onClose: () => void;
}

const EmailModal: React.FC<EmailModalProps> = ({ invoice, onClose }) => {
    const { state } = useData();
    const customer = state.customers.find(c => c.id === invoice.customerId);
    const [emailContent, setEmailContent] = useState({ subject: '', body: '' });
    const [isCopied, setIsCopied] = useState(false);

    const getInvoiceTotals = (inv: Invoice) => {
        const subtotal = inv.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
        const grandTotal = subtotal + (inv.previousDue || 0) - (inv.discount || 0);
        const totalPaid = (inv.payments || []).reduce((acc, p) => acc + p.amount, 0);
        const balanceDue = grandTotal - totalPaid;
        return { balanceDue };
    };

    const { balanceDue } = getInvoiceTotals(invoice);
    
    useEffect(() => {
        if (customer && invoice) {
            setEmailContent({
                subject: `Invoice ${invoice.invoiceNumber} from ${state.settings.name}`,
                body: `Dear ${customer.name},\n\nPlease find attached your invoice ${invoice.invoiceNumber}.\n\nAmount Due: $${balanceDue.toFixed(2)}\nDue Date: ${invoice.dueDate}\n\nThank you for your business.\n\nSincerely,\nThe team at ${state.settings.name}`
            });
        }
    }, [invoice, customer, state.settings.name, balanceDue]);
    
    const handleCopyToClipboard = () => {
        const fullEmailText = `Subject: ${emailContent.subject}\n\n${emailContent.body}`;
        navigator.clipboard.writeText(fullEmailText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (!customer) {
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
                <h2 className="text-2xl font-bold mb-4">Share Invoice {invoice.invoiceNumber}</h2>
                <p className="text-sm text-gray-600 mb-6">Follow these steps to send the invoice to <span className="font-semibold">{customer.email}</span>.</p>
                
                <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-brand-blue text-white font-bold text-lg">1</div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Save the Invoice as a PDF</h3>
                            <p className="text-sm text-gray-500">Go to the Invoice Preview screen and use the <span className="font-semibold">"Print / Save PDF"</span> button. In the print dialog, choose "Save as PDF" as the destination.</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-4">
                         <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-brand-blue text-white font-bold text-lg">2</div>
                        <div>
                             <h3 className="font-semibold text-gray-800">Prepare Your Email</h3>
                            <p className="text-sm text-gray-500 mb-3">Copy the content below and paste it into a new email. Then, attach the PDF you just saved.</p>
                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <div className="mb-2">
                                    <label className="text-xs font-semibold text-gray-500">SUBJECT</label>
                                    <p className="text-sm text-gray-800">{emailContent.subject}</p>
                                </div>
                                <div className="border-t pt-2">
                                    <label className="text-xs font-semibold text-gray-500">BODY</label>
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{emailContent.body}</p>
                                </div>
                            </div>
                             <button
                                onClick={handleCopyToClipboard}
                                className={`mt-3 w-full flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${isCopied ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                            >
                                {isCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                {isCopied ? 'Copied to Clipboard!' : 'Copy Email Content'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6 mt-auto border-t">
                    <button type="button" onClick={onClose} className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900">Done</button>
                </div>
            </div>
        </div>
    );
};

export default EmailModal;