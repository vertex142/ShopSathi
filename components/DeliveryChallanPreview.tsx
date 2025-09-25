import React from 'react';
import type { DeliveryChallan } from '../types';
import { useData } from '../context/DataContext';
import { X, Printer } from 'lucide-react';
import { printDocument } from '../utils/pdfExporter';

interface DeliveryChallanPreviewProps {
  challan: DeliveryChallan;
  onClose: () => void;
}

const DeliveryChallanPreview: React.FC<DeliveryChallanPreviewProps> = ({ challan, onClose }) => {
    const { state } = useData();
    const { settings, customers } = state;
    const customer = customers.find(c => c.id === challan.customerId);
    const printableId = `printable-challan-${challan.id}`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 printable-container">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col printable-document">
                <header className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg non-printable">
                    <h2 className="text-xl font-semibold text-gray-800">Preview: {challan.challanNumber}</h2>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => printDocument(printableId, `challan-${challan.challanNumber}.pdf`)} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
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
                                     {/* This space is intentionally left for the print header */}
                                </div>
                                <div className="text-right">
                                    <h2 className="text-4xl font-bold uppercase text-gray-400 tracking-widest">Delivery Challan</h2>
                                    <p className="text-md text-gray-600 mt-1"># {challan.challanNumber}</p>
                                    <p className="text-sm text-gray-600"><strong>Date:</strong> {challan.issueDate}</p>
                                </div>
                            </div>

                            <section className="grid grid-cols-2 gap-8 mb-10">
                                <div>
                                    <h3 className="text-sm font-semibold uppercase text-gray-500 tracking-wider mb-2">Delivered To</h3>
                                    <p className="text-lg font-bold text-gray-800">{customer?.name || 'N/A'}</p>
                                    <p className="text-sm text-gray-600">{customer?.address || ''}</p>
                                    <p className="text-sm text-gray-600">{customer?.email || ''}</p>
                                </div>
                            </section>

                            <section className="mt-8">
                                <table className="min-w-full">
                                    <thead className="bg-gray-200">
                                        <tr>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">No.</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item Description</th>
                                            <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {challan.items.map((item, index) => (
                                            <tr key={item.id} className="border-b even:bg-gray-50">
                                                <td className="py-4 px-4 text-sm text-gray-700">{index + 1}</td>
                                                <td className="py-4 px-4">
                                                    <p className="font-medium text-gray-900">{item.name}</p>
                                                    {item.description && <p className="mt-1 text-xs text-gray-500">{item.description}</p>}
                                                </td>
                                                <td className="py-4 px-4 text-center text-sm font-semibold text-gray-800">{item.quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </section>

                            <footer className="mt-16 pt-8 border-t text-sm text-gray-600">
                                <p className="mb-4">Received the above goods in good order and condition.</p>
                                <div className="mt-24 flex justify-between items-end">
                                    <div className="text-center">
                                        <div className="pt-8 w-48"></div>
                                        <p className="border-t w-48 font-semibold pt-1 mt-1">Receiver's Signature</p>
                                    </div>
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
                            <span>Challan: #{challan.challanNumber}</span>
                            <div className="printable-footer-center"></div>
                            <span>This is not an invoice.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryChallanPreview;