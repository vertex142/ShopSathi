import React, { useState, useEffect } from 'react';
import type { Invoice } from '../types';
import { useData } from '../context/DataContext';
import { FileDown, Mail } from 'lucide-react';
import { exportElementAsPDF } from '../utils/pdfExporter';
import InvoicePreview from './InvoicePreview'; // For hidden rendering

interface EmailModalProps {
  invoice: Invoice;
  onClose: () => void;
}

const EmailModal: React.FC<EmailModalProps> = ({ invoice, onClose }) => {
    const { state } = useData();
    const customer = state.customers.find(c => c.id === invoice.customerId);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

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

    const handleOpenEmailClient = () => {
        if (!customer) {
            alert('Customer not found.');
            return;
        }
        const mailtoLink = `mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
        onClose();
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
                <h2 className="text-2xl font-bold mb-6">Email Invoice {invoice.invoiceNumber}</h2>
                <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 mb-4 rounded-r-lg">
                    <h3 className="font-bold">Workflow</h3>
                    <p className="text-sm">
                        1. Download the PDF of the invoice to your computer.
                        <br/>
                        2. Click "Open in Email Client", which will create a new pre-filled email.
                        <br/>
                        3. Attach the downloaded PDF to the email and send it.
                    </p>
                </div>
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
                        <textarea id="body" name="body" value={body} onChange={(e) => setBody(e.target.value)} rows={8} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"></textarea>
                    </div>
                </div>
                <div className="flex justify-between items-center pt-6 mt-auto border-t">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
                    <div className="flex space-x-2">
                        <button
                            type="button"
                            onClick={() => exportElementAsPDF(`printable-invoice-${invoice.id}`, `Invoice_${invoice.invoiceNumber}`)}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center"
                        >
                            <FileDown className="h-5 w-5 mr-2" />
                            Download PDF
                        </button>
                        <button
                            type="button"
                            onClick={handleOpenEmailClient}
                            className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light flex items-center justify-center"
                        >
                            <Mail className="h-5 w-5 mr-2" />
                            Open in Email Client
                        </button>
                    </div>
                </div>
            </div>
            {/* Hidden preview component for PDF export */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div id={`printable-invoice-${invoice.id}`} style={{ width: '8.5in', height: '11in' }}>
                    <InvoicePreview invoice={invoice} onClose={() => {}} />
                </div>
            </div>
        </div>
    );
};

export default EmailModal;