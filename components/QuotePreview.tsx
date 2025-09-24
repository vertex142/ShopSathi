import React from 'react';
import type { Quote } from '../types';
import { useData } from '../context/DataContext';
import { X, Printer } from 'lucide-react';
import { printDocument } from '../utils/pdfExporter';

interface QuotePreviewProps {
  quote: Quote;
  onClose: () => void;
}

const QuotePreview: React.FC<QuotePreviewProps> = ({ quote, onClose }) => {
    const { state } = useData();
    const { settings, customers } = state;
    const customer = customers.find(c => c.id === quote.customerId);

    const subtotal = quote.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
    const discount = quote.discount || 0;
    const grandTotal = subtotal - discount;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 printable-container">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col printable-document">
                <header className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg non-printable">
                    <h2 className="text-xl font-semibold text-gray-800">Quote Preview: {quote.quoteNumber}</h2>
                    <div className="flex items-center space-x-2">
                        <button onClick={printDocument} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                            <Printer className="h-4 w-4 mr-2" />
                            Print / Save PDF
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-2 rounded-full">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </header>

                <div className="flex-grow overflow-y-auto bg-gray-100 p-8 printable-content">
                     <div className="bg-white shadow-lg p-10 relative printable-page" id={`printable-quote-${quote.id}`}>
                        {/* Print-only Header (repeats on each page) */}
                        <div className="printable-header">
                            {settings.logo && <img src={settings.logo} alt="Logo" className="h-12 object-contain" />}
                            <div className="text-right text-xs">
                                <p className="font-bold text-base">{settings.name}</p>
                                <p>{settings.address}</p>
                                <p>Phone: {settings.phone1}</p>
                                <p>Email: {settings.email}</p>
                            </div>
                        </div>
                        
                        <div className="pb-8">
                            <div className="flex justify-between items-start pt-8 mb-10">
                                <div>
                                     {/* This space is intentionally left for the print header */}
                                </div>
                                <div className="text-right">
                                    <h2 className="text-4xl font-bold uppercase text-gray-400 tracking-widest">Quote</h2>
                                    <p className="text-md text-gray-600 mt-1"># {quote.quoteNumber}</p>
                                </div>
                            </div>

                            <section className="grid grid-cols-2 gap-8 mb-10">
                                <div>
                                    <h3 className="text-sm font-semibold uppercase text-gray-500 tracking-wider mb-2">Quote For</h3>
                                    <p className="text-lg font-bold text-gray-800">{customer?.name || 'N/A'}</p>
                                    <p className="text-sm text-gray-600">{customer?.address || ''}</p>
                                    <p className="text-sm text-gray-600">{customer?.email || ''}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600"><strong>Issue Date:</strong> {quote.issueDate}</p>
                                    <p className="text-sm text-gray-600"><strong>Expiry Date:</strong> {quote.expiryDate}</p>
                                </div>
                            </section>
                            
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
                                        {quote.items.map((item, index) => (
                                            <tr key={item.id} className="border-b even:bg-gray-50">
                                                <td className="py-4 px-4 text-sm text-gray-700">{index + 1}</td>
                                                <td className="py-4 px-4">
                                                <p className="font-medium text-gray-900">{item.name}</p>
                                                {item.description && <p className="mt-1 text-xs text-gray-500">{item.description}</p>}
                                                </td>
                                                <td className="py-4 px-4 text-center text-sm text-gray-700">{item.quantity}</td>
                                                <td className="py-4 px-4 text-right text-sm text-gray-700">${item.rate.toFixed(2)}</td>
                                                <td className="py-4 px-4 text-right text-sm font-medium text-gray-900">${(item.quantity * item.rate).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </section>

                            <section className="mt-8 flex justify-end">
                                <div className="w-full max-w-sm bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="text-gray-800 font-medium">${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Discount:</span>
                                        <span className="text-red-600 font-medium">-${discount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between py-3 px-4 bg-gray-200 rounded-lg mt-2 -mx-4 -mb-4">
                                        <span className="text-base font-bold text-gray-900">Grand Total:</span>
                                        <span className="text-base font-bold text-gray-900">${grandTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </section>
                            
                            <footer className="mt-16 pt-8 border-t text-sm text-gray-600">
                                {(quote.selectedTerms || []).length > 0 && (
                                    <div className="mb-8">
                                        <h4 className="font-semibold text-gray-800 mb-2">Terms & Conditions</h4>
                                        <ul className="list-disc list-inside space-y-1 text-xs">
                                            {quote.selectedTerms?.map((term, index) => <li key={index}>{term}</li>)}
                                        </ul>
                                    </div>
                                )}
                                <div className="flex justify-between items-end">
                                    <p className="text-xs text-gray-500 max-w-xs">{settings.footerText}</p>
                                    <div className="text-center">
                                        {settings.authorizedSignatureImage ? (
                                            <img src={settings.authorizedSignatureImage} alt="Signature" className="h-16 mx-auto" />
                                        ) : (
                                            <div className="pt-8 w-48"></div>
                                        )}
                                        <p className="border-t w-48 font-semibold pt-1 mt-1">{settings.authorizedSignatureLabel}</p>
                                    </div>
                                </div>
                            </footer>
                        </div>
                         {/* Print-only Footer (repeats on each page) */}
                        <div className="printable-footer">
                            <span>Quote No: {quote.quoteNumber}</span>
                            <div className="printable-footer-center"></div>
                            <span>Prices valid until {quote.expiryDate}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotePreview;