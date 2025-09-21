import React from 'react';
import type { PurchaseOrder } from '../types';
import { useData } from '../context/DataContext';
import { X, Printer } from 'lucide-react';

interface PurchaseOrderPreviewProps {
  purchaseOrder: PurchaseOrder;
  onClose: () => void;
}

const PurchaseOrderPreview: React.FC<PurchaseOrderPreviewProps> = ({ purchaseOrder, onClose }) => {
    const { state } = useData();
    const { settings, suppliers } = state;
    const supplier = suppliers.find(s => s.id === purchaseOrder.supplierId);

    const totalCost = purchaseOrder.items.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
    
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 print:p-0">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col print:h-auto print:shadow-none">
                <header className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg print:hidden">
                    <h2 className="text-xl font-semibold text-gray-800">PO Preview: {purchaseOrder.poNumber}</h2>
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

                <div id="printable-po" className="p-8 overflow-y-auto flex-grow bg-white">
                    <div className="flex justify-between items-start pb-8 border-b">
                        <div>
                            {settings.logo && <img src={settings.logo} alt="Company Logo" className="h-16 w-auto mb-4" />}
                            <h1 className="text-3xl font-bold text-gray-800">{settings.name}</h1>
                            <p className="text-sm text-gray-500">{settings.address}</p>
                            <p className="text-sm text-gray-500">{settings.email} | {settings.phone1}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-4xl font-bold uppercase text-gray-400">Purchase Order</h2>
                            <p className="text-sm text-gray-600 mt-2">PO #: <span className="font-semibold">{purchaseOrder.poNumber}</span></p>
                            <p className="text-sm text-gray-600">Order Date: <span className="font-semibold">{purchaseOrder.orderDate}</span></p>
                        </div>
                    </div>

                    <div className="flex justify-between items-start mt-8">
                        <div>
                            <h3 className="text-sm font-semibold uppercase text-gray-500">Vendor</h3>
                            <p className="text-lg font-bold text-gray-800">{supplier?.name || 'N/A'}</p>
                            <p className="text-sm text-gray-600">{supplier?.address || ''}</p>
                            <p className="text-sm text-gray-600">{supplier?.email || ''}</p>
                        </div>
                        <div>
                           <h3 className="text-sm font-semibold uppercase text-gray-500">Ship To</h3>
                            <p className="text-lg font-bold text-gray-800">{settings.name}</p>
                            <p className="text-sm text-gray-600">{settings.address}</p>
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
                                            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Unit Cost</th>
                                            <th scope="col" className="py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-900 sm:pr-0">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {purchaseOrder.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm sm:w-auto sm:max-w-none sm:pl-0">
                                                  <div className="font-medium text-gray-900">{item.name}</div>
                                                  {item.description && <div className="mt-1 text-gray-500">{item.description}</div>}
                                                </td>
                                                <td className="px-3 py-4 text-center text-sm text-gray-500">{item.quantity}</td>
                                                <td className="px-3 py-4 text-right text-sm text-gray-500">${item.unitCost.toFixed(2)}</td>
                                                <td className="py-4 pl-3 pr-4 text-right text-sm font-semibold text-gray-800 sm:pr-0">${(item.quantity * item.unitCost).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                     <tfoot>
                                        <tr>
                                            <th scope="row" colSpan={3} className="hidden pl-4 pr-3 pt-4 text-right text-sm font-semibold text-gray-900 sm:table-cell sm:pl-0">Total Cost</th>
                                            <th scope="row" className="pl-4 pr-3 pt-4 text-left text-sm font-semibold text-gray-900 sm:hidden">Total Cost</th>
                                            <td className="pl-3 pr-4 pt-4 text-right text-sm font-semibold text-gray-900 sm:pr-0">${totalCost.toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t text-sm text-gray-500">
                        {purchaseOrder.notes && (
                            <div className="mb-4">
                                <h4 className="font-semibold text-gray-700">Notes:</h4>
                                <p>{purchaseOrder.notes}</p>
                            </div>
                        )}
                         {(purchaseOrder.selectedTerms || []).length > 0 && (
                            <div className="mb-4">
                                <h4 className="font-semibold text-gray-700">Terms & Conditions:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    {purchaseOrder.selectedTerms?.map((term, index) => (
                                        <li key={index}>{term}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <p className="text-xs">Please ship all items to the address listed above. If you have any questions, please contact us at {settings.email}.</p>
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseOrderPreview;