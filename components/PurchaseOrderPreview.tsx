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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 printable-container non-printable">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col printable-document">
                <header className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg non-printable">
                    <h2 className="text-xl font-semibold text-gray-800">PO Preview: {purchaseOrder.poNumber}</h2>
                    <div className="flex items-center space-x-2">
                        <button onClick={handlePrint} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                            <Printer className="h-4 w-4 mr-2" />
                            Print / Save PDF
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-2 rounded-full">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </header>

                <div className="flex-grow overflow-y-auto bg-gray-100 p-8">
                    <div className="bg-white shadow-lg p-10 relative printable-content" id={`printable-po-${purchaseOrder.id}`}>
                        <div className="border-t-8 border-brand-blue pb-8">
                            <header className="flex justify-between items-start pt-8 mb-10">
                                <div className="flex items-center">
                                {settings.logo && <img src={settings.logo} alt="Company Logo" className="h-16 w-auto mr-6" />}
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900">{settings.name}</h1>
                                        <p className="text-sm text-gray-500 max-w-xs">{settings.address}</p>
                                        <p className="text-sm text-gray-500">{settings.email} | {settings.phone1}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-4xl font-bold uppercase text-gray-400 tracking-widest">Purchase Order</h2>
                                    <p className="text-md text-gray-600 mt-1"># {purchaseOrder.poNumber}</p>
                                </div>
                            </header>

                            <section className="grid grid-cols-2 gap-8 mb-10">
                                <div>
                                    <h3 className="text-sm font-semibold uppercase text-gray-500 tracking-wider mb-2">Vendor</h3>
                                    <p className="text-lg font-bold text-gray-800">{supplier?.name || 'N/A'}</p>
                                    <p className="text-sm text-gray-600">{supplier?.address || ''}</p>
                                    <p className="text-sm text-gray-600">{supplier?.email || ''}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600"><strong>Order Date:</strong> {purchaseOrder.orderDate}</p>
                                    <p className="text-sm text-gray-600"><strong>Expected Delivery:</strong> {purchaseOrder.expectedDeliveryDate}</p>
                                </div>
                                 <div className="col-span-2">
                                    <h3 className="text-sm font-semibold uppercase text-gray-500 tracking-wider mb-2">Ship To</h3>
                                    <p className="text-lg font-bold text-gray-800">{settings.name}</p>
                                    <p className="text-sm text-gray-600">{settings.address}</p>
                                </div>
                            </section>
                        
                            <section className="mt-8">
                                <table className="min-w-full">
                                    <thead className="bg-gray-200">
                                        <tr>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item</th>
                                            <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                                            <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit Cost</th>
                                            <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {purchaseOrder.items.map((item) => (
                                            <tr key={item.id} className="border-b even:bg-gray-50">
                                                <td className="py-4 px-4">
                                                <p className="font-medium text-gray-900">{item.name}</p>
                                                {item.description && <p className="mt-1 text-xs text-gray-500">{item.description}</p>}
                                                </td>
                                                <td className="py-4 px-4 text-center text-sm text-gray-700">{item.quantity}</td>
                                                <td className="py-4 px-4 text-right text-sm text-gray-700">${item.unitCost.toFixed(2)}</td>
                                                <td className="py-4 px-4 text-right text-sm font-medium text-gray-900">${(item.quantity * item.unitCost).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-200">
                                            <td colSpan={3} className="py-3 px-4 text-right text-sm font-bold text-gray-800 uppercase">Total Cost</td>
                                            <td className="py-3 px-4 text-right text-lg font-bold text-gray-900">${totalCost.toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </section>

                            <footer className="mt-16 pt-8 border-t text-sm text-gray-600">
                                {(purchaseOrder.selectedTerms || []).length > 0 && (
                                    <div className="mb-8">
                                        <h4 className="font-semibold text-gray-800 mb-2">Terms & Conditions</h4>
                                        <ul className="list-disc list-inside space-y-1 text-xs">
                                            {purchaseOrder.selectedTerms?.map((term, index) => <li key={index}>{term}</li>)}
                                        </ul>
                                    </div>
                                )}
                                <p className="text-xs mt-4">Please ship all items to the address listed above. If you have any questions, please contact us at {settings.email}.</p>
                                <div className="mt-8 flex justify-end items-end">
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseOrderPreview;
