import React from 'react';
import type { Invoice, Payment } from '../types';
import { useData } from '../context/DataContext';
import { X, Printer } from 'lucide-react';
import { numberToWords } from '../utils/numberToWords';
import { printDocument } from '../utils/pdfExporter';

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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 printable-container">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col printable-document">
                <header className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg non-printable">
                    <h2 className="text-xl font-semibold text-gray-800">Money Receipt</h2>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => printDocument('printable-receipt', `receipt-${invoice.invoiceNumber}.pdf`)} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                            <Printer className="h-4 w-4 mr-2" />
                            Print / Save PDF
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-2 rounded-full">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </header>

                <div className="flex-grow overflow-y-auto bg-gray-100 p-8 printable-content">
                    <div className="bg-white shadow-lg p-10 relative printable-page" id="printable-receipt">
                         {/* Screen-only Header */}
                        <header className="flex justify-between items-start pb-6 mb-6 border-b non-printable">
                            <div className="text-center">
                                {settings.logo && (
                                    <>
                                        <img src={settings.logo} alt="Logo" className="h-20 w-auto max-w-[8rem] object-contain" />
                                        <p className="text-sm text-gray-500 mt-2 max-w-[12rem] break-words">{settings.tagline}</p>
                                    </>
                                )}
                            </div>
                            <div className="text-right">
                                <h2 className="text-3xl font-bold text-brand-blue">{settings.name}</h2>
                                <p className="text-md text-gray-600 mt-2">{settings.address}</p>
                                <p className="text-md text-gray-600">{settings.phone1}</p>
                                {settings.phone2 && <p className="text-md text-gray-600">{settings.phone2}</p>}
                                <p className="text-md text-gray-600">{settings.email}</p>
                            </div>
                        </header>
                         {/* Print-only Header (repeats on each page) */}
                        <div className="printable-header">
                            <div className="text-center">
                                {settings.logo && (
                                    <>
                                        <img src={settings.logo} alt="Logo" className="h-14 object-contain" />
                                        <p className="text-[8pt] text-gray-600 mt-1 max-w-[15ch] leading-tight">{settings.tagline}</p>
                                    </>
                                )}
                            </div>
                            <div className="text-right text-[9pt]">
                                <h2 className="text-xl font-bold text-brand-blue">{settings.name}</h2>
                                <p className="leading-snug">{settings.address}</p>
                                <p className="leading-snug">{settings.phone1}</p>
                                {settings.phone2 && <p className="leading-snug">{settings.phone2}</p>}
                                <p className="leading-snug">{settings.email}</p>
                            </div>
                        </div>

                         <div className="pb-8">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                     {/* This space is intentionally left for the print header */}
                                </div>
                                <div className="text-right">
                                    <h2 className="text-4xl font-bold uppercase text-gray-400 tracking-widest">Receipt</h2>
                                    <p className="text-md text-gray-600 mt-1"># MR-{invoice.invoiceNumber}-{invoice.payments.length}</p>
                                    <p className="text-sm text-gray-600 mt-2"><strong>Date:</strong> {payment.date}</p>
                                </div>
                            </div>
                            
                            <section className="mt-8 text-base space-y-4">
                                <p className="leading-relaxed">
                                    <strong className="font-semibold text-gray-700">Received from:</strong> {customer?.name || 'N/A'}
                                </p>
                                <p className="leading-relaxed">
                                    <strong className="font-semibold text-gray-700">Amount in words:</strong> <span className="capitalize">{numberToWords(payment.amount)} Only.</span>
                                </p>
                                <p className="leading-relaxed">
                                    <strong className="font-semibold text-gray-700">Payment for:</strong> Invoice #{invoice.invoiceNumber} via {payment.method}.
                                </p>
                            </section>

                            <section className="mt-10 text-center border-2 border-green-500 bg-green-50 py-6 px-4 rounded-lg">
                                <p className="uppercase tracking-wider text-green-700 font-semibold">Amount Paid</p>
                                <p className="text-5xl font-bold tracking-tight text-green-600">${payment.amount.toFixed(2)}</p>
                            </section>

                            <section className="mt-8 flex justify-end">
                                <div className="w-full max-w-xs space-y-2 text-sm">
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-600">Invoice Total:</span>
                                        <span className="font-medium text-gray-800">${grandTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-600">Amount Paid This Time:</span>
                                        <span className="font-medium text-green-600">${payment.amount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between py-2 bg-gray-100 px-2 rounded font-bold">
                                        <span className="text-gray-800">Remaining Balance:</span>
                                        <span className="text-red-600">${balanceDueAfterThisPayment.toFixed(2)}</span>
                                    </div>
                                </div>
                            </section>
                            
                            <footer className="mt-24 pt-8 border-t text-sm text-gray-600">
                                <div className="flex justify-end items-end">
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
                            <span>Thank you for your payment!</span>
                            <div className="printable-footer-center"></div>
                            <span>{settings.phone1}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MoneyReceiptPreview;