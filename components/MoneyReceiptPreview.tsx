import React from 'react';
import type { Invoice, Payment } from '../types';
import { useData } from '../context/DataContext';
import { X, Printer } from 'lucide-react';
import { numberToWords } from '../utils/numberToWords';

interface MoneyReceiptPreviewProps {
  invoice: Invoice;
  payment: Payment;
  onClose: () => void;
}

const MoneyReceiptPreview: React.FC<MoneyReceiptPreviewProps> = ({ invoice, payment, onClose }) => {
    const { state } = useData();
    const { settings, customers } = state;
    const customer = customers.find(c => c.id === invoice.customerId);

    const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
    const grandTotal = subtotal + (invoice.previousDue || 0) - (invoice.discount || 0);
    const totalPaidBeforeThisPayment = (invoice.payments || []).filter(p => p.id !== payment.id).reduce((acc, p) => acc + p.amount, 0);
    const balanceDueAfterThisPayment = grandTotal - totalPaidBeforeThisPayment - payment.amount;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 print:p-0">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col print:h-auto print:shadow-none">
                {/* Header with actions - hidden on print */}
                <header className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg print:hidden">
                    <h2 className="text-xl font-semibold text-gray-800">Money Receipt</h2>
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

                {/* Printable Receipt Content */}
                <div id="printable-receipt" className="p-8 overflow-y-auto flex-grow bg-white">
                    <div className="flex justify-between items-start pb-6 border-b">
                        <div>
                            {settings.logo && <img src={settings.logo} alt="Company Logo" className="h-16 w-auto mb-4" />}
                            <h1 className="text-2xl font-bold text-gray-800">{settings.name}</h1>
                            <p className="text-sm text-gray-500">{settings.address}</p>
                            <p className="text-sm text-gray-500">{settings.email} | {settings.phone1}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl font-bold uppercase text-gray-400">Money Receipt</h2>
                            <p className="text-sm text-gray-600 mt-2">Receipt #: <span className="font-semibold">MR-{invoice.invoiceNumber}-{invoice.payments.length}</span></p>
                            <p className="text-sm text-gray-600">Payment Date: <span className="font-semibold">{payment.date}</span></p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <p className="text-gray-700 leading-relaxed">
                            Received with thanks from <strong className="text-gray-900">{customer?.name || 'N/A'}</strong>, the sum of <strong className="text-gray-900">${payment.amount.toFixed(2)}</strong> (<span className="capitalize font-semibold">{numberToWords(payment.amount)} Dollars Only</span>) via <strong>{payment.method}</strong> against Invoice #<strong>{invoice.invoiceNumber}</strong>.
                        </p>
                    </div>

                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Summary</h3>
                        <table className="min-w-full">
                            <tbody>
                                <tr className="border-b">
                                    <td className="py-2 text-gray-600">Invoice Total:</td>
                                    <td className="py-2 text-right font-medium">${grandTotal.toFixed(2)}</td>
                                </tr>
                                <tr className="border-b bg-green-50">
                                    <td className="py-2 text-gray-600">Amount Paid this time:</td>
                                    <td className="py-2 text-right font-semibold text-green-700">${payment.amount.toFixed(2)}</td>
                                </tr>
                                <tr className="border-b bg-red-50">
                                    <td className="py-2 font-bold text-gray-800">Balance Due:</td>
                                    <td className="py-2 text-right font-bold text-red-700">${balanceDueAfterThisPayment.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                        {payment.notes && (
                            <div className="mt-4 text-sm text-gray-600">
                                <strong>Notes:</strong> {payment.notes}
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-24 flex justify-between items-end text-sm">
                        <div className="text-center">
                            <p className="pt-8 border-t w-48"></p>
                            <p className="font-semibold">Customer Signature</p>
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
                </div>
            </div>
        </div>
    );
};

export default MoneyReceiptPreview;