import React from 'react';
import type { CreditNote } from '../types';
import { useData } from '../context/DataContext';
import { X, Printer } from 'lucide-react';
import { printDocument } from '../utils/pdfExporter';
import { formatCurrency } from '../utils/formatCurrency';

interface CreditNotePreviewProps {
  creditNote: CreditNote;
  onClose: () => void;
}

const CreditNotePreview: React.FC<CreditNotePreviewProps> = ({ creditNote, onClose }) => {
    const { state } = useData();
    const { settings, customers, invoices } = state;
    const customer = customers.find(c => c.id === creditNote.customerId);
    const originalInvoice = invoices.find(i => i.id === creditNote.originalInvoiceId);
    
    const printableId = `printable-cn-${creditNote.id}`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 printable-container">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col printable-document">
                <header className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg non-printable">
                    <h2 className="text-xl font-semibold text-gray-800">Credit Note: {creditNote.creditNoteNumber}</h2>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => printDocument(printableId, `credit-note-${creditNote.creditNoteNumber}.pdf`)} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
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
                        
                        <div className="printable-header" dangerouslySetInnerHTML={{ __html: settings.headerSVG }} />

                        <div className="pb-8">
                             <div className="flex justify-between items-start mb-10">
                                 <div>
                                    <h3 className="text-sm font-semibold uppercase text-gray-500 tracking-wider mb-2">Credit For</h3>
                                    <p className="text-lg font-bold text-gray-800">{customer?.name || 'N/A'}</p>
                                    <p className="text-sm text-gray-600">{customer?.address || ''}</p>
                                 </div>
                                 <div className="text-right">
                                    <h2 className="text-4xl font-bold uppercase text-red-400 tracking-widest">Credit Note</h2>
                                    <p className="text-md text-gray-600 mt-1"># {creditNote.creditNoteNumber}</p>
                                    <p className="text-sm text-gray-600"><strong>Date:</strong> {creditNote.issueDate}</p>
                                    <p className="text-sm text-gray-600"><strong>Ref Invoice:</strong> {originalInvoice?.invoiceNumber}</p>
                                 </div>
                             </div>
                            
                            <section className="mt-8">
                                <table className="min-w-full">
                                    <thead className="bg-gray-200">
                                        <tr>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item</th>
                                            <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                                            <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Rate</th>
                                            <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {creditNote.items.map((item) => (
                                            <tr key={item.id} className="border-b even:bg-gray-50">
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

                            <section className="mt-8 flex justify-end">
                                <div className="w-full max-w-sm bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="text-gray-800 font-medium">{formatCurrency(creditNote.subtotal)}</span>
                                    </div>
                                    {creditNote.taxAmount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tax Reversal:</span>
                                        <span className="text-gray-800 font-medium">{formatCurrency(creditNote.taxAmount)}</span>
                                    </div>
                                    )}
                                    <div className="flex justify-between py-3 px-4 bg-gray-200 rounded-lg mt-2 -mx-4 -mb-4">
                                        <span className="text-base font-bold text-gray-900">Total Credit:</span>
                                        <span className="text-base font-bold text-gray-900">{formatCurrency(creditNote.total)}</span>
                                    </div>
                                </div>
                            </section>

                             <section className="mt-16">
                                <h4 className="font-semibold text-gray-800 mb-2">Reason for Credit</h4>
                                <p className="text-sm text-gray-600 border p-3 rounded-md bg-gray-50">{creditNote.reason}</p>
                            </section>
                            
                            <footer className="mt-16 pt-8 border-t text-sm text-gray-600">
                                <div className="mb-24">
                                    <p className="text-xs text-gray-500 max-w-xs">This credit has been applied to the customer's account.</p>
                                </div>
                                 <div className="flex justify-end">
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
                        <div className="printable-footer">
                           <span className="text-xs">Credit Note: #{creditNote.creditNoteNumber}</span>
                           <div className="printable-footer-center"></div>
                           <span className="text-xs">Ref: {originalInvoice?.invoiceNumber}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreditNotePreview;
