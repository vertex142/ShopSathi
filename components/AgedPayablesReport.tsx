import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { PurchaseOrder, PurchaseOrderStatus } from '../types';
import { Download, LoaderCircle } from 'lucide-react';
import { printDocument } from '../utils/pdfExporter';
import { formatCurrency } from '../utils/formatCurrency';

const AgedPayablesReport: React.FC = () => {
    const { state } = useData();
    const [isExporting, setIsExporting] = useState(false);
    const today = new Date();

    const handleExport = async () => {
        setIsExporting(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        await printDocument('aged-payables-report-content', 'aged-payables.pdf');
        setIsExporting(false);
    };

    const agedData = useMemo(() => {
        const data: { [supplierId: string]: { name: string, buckets: number[] } } = {};
        const totals = [0, 0, 0, 0, 0];

        state.purchaseOrders
            .filter(po => po.status !== PurchaseOrderStatus.Paid && po.status !== PurchaseOrderStatus.Cancelled)
            .forEach(po => {
                const supplier = state.suppliers.find(s => s.id === po.supplierId);
                if (!supplier) return;

                const grandTotal = po.items.reduce((acc, item) => acc + item.quantity * item.unitCost, 0) + (po.taxAmount || 0);
                const totalPaid = (po.payments || []).reduce((acc, p) => acc + p.amount, 0);
                const balanceDue = grandTotal - totalPaid;

                if (balanceDue <= 0) return;

                const orderDate = new Date(po.orderDate);
                const diffDays = Math.floor((today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
                
                let bucketIndex = 0;
                if (diffDays <= 30) bucketIndex = 0; // Current
                else if (diffDays <= 60) bucketIndex = 1;
                else if (diffDays <= 90) bucketIndex = 2;
                else if (diffDays <= 120) bucketIndex = 3;
                else bucketIndex = 4;

                if (!data[supplier.id]) {
                    data[supplier.id] = { name: supplier.name, buckets: [0, 0, 0, 0, 0] };
                }
                data[supplier.id].buckets[bucketIndex] += balanceDue;
                totals[bucketIndex] += balanceDue;
            });
            
        const supplierRows = Object.values(data).map(d => ({ ...d, total: d.buckets.reduce((a, b) => a + b, 0) }));

        return { supplierRows, totals };

    }, [state.purchaseOrders, state.suppliers]);

    const bucketLabels = ['0-30 Days', '31-60 Days', '61-90 Days', '91-120 Days', '120+ Days'];

    return (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6 printable-page">
            <div className="printable-header" dangerouslySetInnerHTML={{ __html: state.settings.headerSVG }} />
            
            <div className="flex justify-between items-center non-printable">
                <h2 className="text-xl font-semibold text-gray-700">Aged Payables Report</h2>
                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
                >
                    {isExporting ? <LoaderCircle className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    Print / Save PDF
                </button>
            </div>

            <div id="aged-payables-report-content" className="mt-4">
                <p className="text-sm text-gray-500 mb-4">Report as of: {today.toLocaleDateString()}</p>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                                {bucketLabels.map(label => (
                                    <th key={label} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{label}</th>
                                ))}
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Due</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {agedData.supplierRows.map(row => (
                                <tr key={row.name}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.name}</td>
                                    {row.buckets.map((amount, i) => (
                                        <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatCurrency(amount)}</td>
                                    ))}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right">{formatCurrency(row.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100">
                            <tr className="font-bold">
                                <td className="px-6 py-3 text-left text-sm text-gray-800">Total</td>
                                {agedData.totals.map((total, i) => (
                                    <td key={i} className="px-6 py-3 text-right text-sm text-gray-800">{formatCurrency(total)}</td>
                                ))}
                                <td className="px-6 py-3 text-right text-sm text-gray-800">{formatCurrency(agedData.totals.reduce((a,b) => a+b, 0))}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            
            <div className="printable-footer">
                <span>Aged Payables Report</span>
                <div className="printable-footer-center"></div>
                <span>Generated on: {new Date().toLocaleDateString()}</span>
            </div>
        </div>
    );
};

export default AgedPayablesReport;
