import React from 'react';
import type { DeliveryChallan } from '../types';
import { useData } from '../context/DataContext';
import { X, Printer } from 'lucide-react';

interface DeliveryChallanPreviewProps {
  challan: DeliveryChallan;
  onClose: () => void;
}

const DeliveryChallanPreview: React.FC<DeliveryChallanPreviewProps> = ({ challan, onClose }) => {
    const { state } = useData();
    const { settings, customers } = state;
    const customer = customers.find(c => c.id === challan.customerId);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 print:p-0">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col print:h-auto print:shadow-none">
                <header className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg print:hidden">
                    <h2 className="text-xl font-semibold text-gray-800">Preview: {challan.challanNumber}</h2>
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

                <div id="printable-challan" className="p-8 overflow-y-auto flex-grow bg-white">
                    <div className="flex justify-between items-start pb-8 border-b">
                        <div>
                            {settings.logo && <img src={settings.logo} alt="Company Logo" className="h-16 w-auto mb-4" />}
                            <h1 className="text-3xl font-bold text-gray-800">{settings.name}</h1>
                            <p className="text-sm text-gray-500">{settings.address}</p>
                            <p className="text-sm text-gray-500">{settings.email} | {settings.phone1}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-4xl font-bold uppercase text-gray-400">Delivery Challan</h2>
                            <p className="text-sm text-gray-600 mt-2">Challan #: <span className="font-semibold">{challan.challanNumber}</span></p>
                            <p className="text-sm text-gray-600">Issue Date: <span className="font-semibold">{challan.issueDate}</span></p>
                        </div>
                    </div>

                    <div className="flex justify-between items-start mt-8">
                        <div>
                            <h3 className="text-sm font-semibold uppercase text-gray-500">Delivered To</h3>
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
                                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Item Description</th>
                                            <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {challan.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm sm:w-auto sm:max-w-none sm:pl-0">
                                                  <div className="font-medium text-gray-900">{item.name}</div>
                                                  {item.description && <div className="mt-1 text-gray-500">{item.description}</div>}
                                                </td>
                                                <td className="px-3 py-4 text-center text-sm font-semibold text-gray-800">{item.quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t text-sm text-gray-500">
                        {challan.notes && (
                            <div className="mb-4">
                                <h4 className="font-semibold text-gray-700">Notes:</h4>
                                <p>{challan.notes}</p>
                            </div>
                        )}
                        <p>Received the above goods in good condition.</p>
                    </div>

                     <div className="mt-24 flex justify-between items-end text-sm">
                        <div className="text-center">
                            <p className="pt-8 border-t w-48"></p>
                            <p className="font-semibold">Receiver's Signature</p>
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

export default DeliveryChallanPreview;