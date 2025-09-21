import React from 'react';
import type { Quote } from '../types';
import { useData } from '../context/DataContext';
import { X, Printer } from 'lucide-react';

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
    
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 print:p-0">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col print:h-auto print:shadow-none">
                <header className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg print:hidden">
                    <h2 className="text-xl font-semibold text-gray-800">Quote Preview: {quote.quoteNumber}</h2>
                    <div className="flex items-center space-x-2">
                        <button onClick={handlePrint} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-2 rounded-full">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </header>

                <div id="printable-quote" className="p-8 overflow-y-auto flex-grow bg-white">
                    <div className="flex justify-between items-start pb-8 border-b">
                        <div>
                            {settings.logo && <img src={settings.logo} alt="Company Logo" className="h-16 w-auto mb-4" />}
                            <h1 className="text-3xl font-bold text-gray-800">{settings.name}</h1>
                            <p className="text-sm text-gray-500">{settings.address}</p>
                            <p className="text-sm text-gray-500">{settings.email} | {settings.phone1}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-4xl font-bold uppercase text-gray-400">Quote</h2>
                            <p className="text-sm text-gray-600 mt-2">Quote #: <span className="font-semibold">{quote.quoteNumber}</span></p>
                            <p className="text-sm text-gray-600">Issue Date: <span className="font-semibold">{quote.issueDate}</span></p>
                            <p className="text-sm text-gray-600">Expiry Date: <span className="font-semibold">{quote.expiryDate}</span></p>
                        </div>
                    </div>

                    <div className="flex justify-between items-start mt-8">
                        <div>
                            <h3 className="text-sm font-semibold uppercase text-gray-500">Quote For</h3>
                            <p className="text-lg font-bold text-gray-800">{customer?.name || 'N/A'}</p>
                            <p className="text-sm text-gray-600">{customer?.address || ''}</p>
                            <p className="text-sm text-gray-600">{customer?.email || ''}</p>
                        </div>
                    </div>

                    <div className="mt-8 flow-root">
                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Item</th>
                                            <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Qty</th>
                                            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Rate</th>
                                            <th scope="col" className="py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-900 sm:pr-0">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {quote.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm sm:w-auto sm:max-w-none sm:pl-0">
                                                  <div className="font-medium text-gray-900">{item.name}</div>
                                                  {item.description && <div className="mt-1 text-gray-500">{item.description}</div>}
                                                </td>
                                                <td className="px-3 py-4 text-center text-sm text-gray-500">{item.quantity}</td>
                                                <td className="px-3 py-4 text-right text-sm text-gray-500">${item.rate.toFixed(2)}</td>
                                                <td className="py-4 pl-3 pr-4 text-right text-sm font-semibold text-gray-800 sm:pr-0">${(item.quantity * item.rate).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <div className="w-full max-w-sm space-y-2">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-sm text-gray-600">Subtotal</span>
                                <span className="text-sm text-gray-800">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-sm text-gray-600">Discount</span>
                                <span className="text-sm text-red-600">-${discount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-4 bg-gray-100 px-2 rounded-md mt-2">
                                <span className="text-base font-bold text-gray-900">Grand Total</span>
                                <span className="text-base font-bold text-gray-900">${grandTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t text-sm text-gray-500">
                        {quote.notes && (
                            <div className="mb-4">
                                <h4 className="font-semibold text-gray-700">Notes:</h4>
                                <p>{quote.notes}</p>
                            </div>
                        )}
                        {(quote.selectedTerms || []).length > 0 && (
                            <div className="mb-4">
                                <h4 className="font-semibold text-gray-700">Terms & Conditions:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    {quote.selectedTerms?.map((term, index) => (
                                        <li key={index}>{term}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-auto pt-12">
                         <div className="flex justify-between items-end text-sm">
                            <div className="text-center">
                                <p className="pt-8 border-t w-48"> </p>
                                <p className="font-semibold">{settings.preparedByLabel}</p>
                            </div>
                            <div className="text-center">
                                {settings.authorizedSignatureImage ? (
                                    <img src={settings.authorizedSignatureImage} alt="Signature" className="h-16 mx-auto" />
                                ) : (
                                    <div className="pt-8 w-48"></div>
                                )}
                                <p className="border-t w-48 font-semibold pt-1">{settings.authorizedSignatureLabel}</p>
                            </div>
                        </div>
                        <p className="text-center text-xs mt-8">{settings.footerText}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotePreview;