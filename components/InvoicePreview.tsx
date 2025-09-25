import React from 'react';
import type { Invoice } from '../types';
import { useData } from '../context/DataContext';
import { X, Printer } from 'lucide-react';
import { printDocument } from '../utils/pdfExporter';
import { formatCurrency } from '../utils/formatCurrency';

interface InvoicePreviewProps {
  invoice: Invoice;
  onClose: () => void;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, onClose }) => {
    const { state } = useData();
    const { settings, customers } = state;
    const customer = customers.find(c => c.id === invoice.customerId);

    const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
    const previousDue = invoice.previousDue || 0;
    const discount = invoice.discount || 0;
    const grandTotal = subtotal + previousDue - discount;
    const totalPaid = (invoice.payments || []).reduce((acc, p) => acc + p.amount, 0);
    const balanceDue = grandTotal - totalPaid;
    const hasPayments = invoice.payments && invoice.payments.length > 0;
    
    const printableId = `printable-invoice-${invoice.id}`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 printable-container">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col printable-document">
                <header className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg non-printable">
                    <h2 className="text-xl font-semibold text-gray-800">Invoice Preview: {invoice.invoiceNumber}</h2>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => printDocument(printableId, `invoice-${invoice.invoiceNumber}.pdf`)} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                            <Printer className="h-4 w-4 mr-2" />
                            Print / Save PDF
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-2 rounded-full">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </header>

                <div className="flex-grow overflow-y-auto bg-gray-100 p-8 printable-content">
                    <div className="bg-white shadow-lg p-10 relative printable-page" id={printableId}>
                        
                        {/* Unified Header for Screen and Print */}
                        <div className="printable-header" dangerouslySetInnerHTML={{ __html: settings.headerSVG }} />

                        <div className="pb-8">
                             <div className="flex justify-between items-start mb-10">
                                 <div>
                                    <h3 className="text-sm font-semibold uppercase text-gray-500 tracking-wider mb-2">Billed To</h3>
                                    <p className="text-lg font-bold text-gray-800">{customer?.name || 'N/A'}</p>
                                    <p className="text-sm text-gray-600">{customer?.address || ''}</p>
                                    <p className="text-sm text-gray-600">{customer?.email || ''}</p>
                                 </div>
                                 <div className="text-right">
                                    <h2 className="text-4xl font-bold uppercase text-gray-400 tracking-widest">Invoice</h2>
                                    <p className="text-md text-gray-600 mt-1"># {invoice.invoiceNumber}</p>
                                    <p className="text-sm text-gray-600"><strong>Issue Date:</strong> {invoice.issueDate}</p>
                                    <p className="text-sm text-gray-600"><strong>Due Date:</strong> {invoice.dueDate}</p>
                                 </div>
                             </div>
                            
                            <section className="mt-8">
                                <table className="min-w-full">
                                    <thead className="bg-gray-200">
                                        <tr>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">No.</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item</th>
                                            <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                                            <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Rate</th>
                                            <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.items.map((item, index) => (
                                            <tr key={item.id} className="border-b even:bg-gray-50">
                                                <td className="py-4 px-4 text-sm text-gray-700">{index + 1}</td>
                                                <td className="py-4 px-4">
                                                <p className="font-medium text-gray-900">{item.name}</p>
                                                {item.description && <p className="mt-1 text-xs text-gray-500">{item.description}</p>}
                                                </td>
                                                <td className="py-4 px-4 text-center text-sm text-gray-700">{item.quantity}</td>
                                                <td className="py-4 px-4 text-right text-sm text-gray-700">{formatCurrency(item.rate)}</td>
                                                <td className="py-4 px-4 text-right text-sm font-medium text-gray-900">{formatCurrency(item.quantity * item.rate)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </section>
                            
                            {hasPayments && (
                                <section className="mt-8">
                                    <h4 className="font-semibold text-gray-800 mb-2">Payments Received</h4>
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 uppercase">Method</th>
                                                <th className="py-2 px-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoice.payments.map(p => (
                                                <tr key={p.id} className="border-b">
                                                    <td className="py-2 px-3 text-gray-700">{p.date}</td>
                                                    <td className="py-2 px-3 text-gray-700">{p.method}</td>
                                                    <td className="py-2 px-3 text-right text-gray-700">{formatCurrency(p.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </section>
                            )}

                            <section className="mt-8 flex justify-end">
                                <div className="w-full max-w-sm bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="text-gray-800 font-medium">{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Previous Due:</span>
                                        <span className="text-gray-800 font-medium">{formatCurrency(previousDue)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Discount:</span>
                                        <span className="text-red-600 font-medium">-{formatCurrency(discount)}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t">
                                        <span className="font-semibold text-gray-800">Grand Total:</span>
                                        <span className="font-semibold text-gray-800">{formatCurrency(grandTotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Amount Paid:</span>
                                        <span className="text-green-600 font-medium">-{formatCurrency(totalPaid)}</span>
                                    </div>
                                    <div className="flex justify-between py-3 px-4 bg-gray-200 rounded-lg mt-2 -mx-4 -mb-4">
                                        <span className="text-base font-bold text-gray-900">Balance Due:</span>
                                        <span className="text-base font-bold text-gray-900">{formatCurrency(balanceDue)}</span>
                                    </div>
                                </div>
                            </section>
                            
                            <footer className="mt-16 pt-8 border-t text-sm text-gray-600">
                                {(invoice.selectedTerms || []).length > 0 && (
                                    <div className="mb-8">
                                        <h4 className="font-semibold text-gray-800 mb-2">Terms & Conditions</h4>
                                        <ul className="list-disc list-inside space-y-1 text-xs">
                                            {invoice.selectedTerms?.map((term, index) => <li key={index}>{term}</li>)}
                                        </ul>
                                    </div>
                                )}
                                <div className="mb-24">
                                    <p className="text-xs text-gray-500 max-w-xs">{settings.footerText}</p>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-center">
                                        <div className="pt-8 w-48 h-16"></div>
                                        <p className="border-t w-48 font-semibold pt-1 mt-1">{settings.preparedByLabel}</p>
                                    </div>
                                    <div className="text-center">
                                        {settings.authorizedSignatureImage ? (
                                            <img src={settings.authorizedSignatureImage} alt="Signature" className="h-16 object-contain mx-auto" />
                                        ) : (
                                            <div className="pt-8 w-48 h-16"></div>
                                        )}
                                        <p className="border-t w-48 font-semibold pt-1 mt-1">{settings.authorizedSignatureLabel}</p>
                                    </div>
                                </div>
                            </footer>
                        </div>
                        {/* Print-only Footer (repeats on each page) */}
                        <div className="printable-footer">
                           <span className="text-xs">{settings.footerText}</span>
                           <div className="printable-footer-center"></div>
                           <span className="text-xs">Invoice: #{invoice.invoiceNumber}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoicePreview;