import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { PurchaseOrder, Payment, PurchaseOrderStatus } from '../types';
import StatCard from '../components/StatCard';
import MakePaymentModal from '../components/MakePaymentModal';
import { ArrowLeft, CircleDollarSign, Receipt, TrendingDown } from 'lucide-react';

interface SupplierProfilePageProps {
  supplierId: string;
  onBack: () => void;
}

const SupplierProfilePage: React.FC<SupplierProfilePageProps> = React.memo(({ supplierId, onBack }) => {
  const { state, dispatch } = useData();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const supplier = useMemo(() => state.suppliers.find(c => c.id === supplierId), [state.suppliers, supplierId]);
  const supplierPOs = useMemo(() => state.purchaseOrders.filter(po => po.supplierId === supplierId), [state.purchaseOrders, supplierId]);

  const getPOTotals = (po: PurchaseOrder) => {
    const grandTotal = po.items.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
    const totalPaid = (po.payments || []).reduce((acc, p) => acc + p.amount, 0);
    const balanceDue = grandTotal - totalPaid;
    return { grandTotal, totalPaid, balanceDue };
  };

  const supplierStats = useMemo(() => {
    let totalOrdered = 0;
    let totalPaid = 0;
    supplierPOs.forEach(po => {
      const { grandTotal, totalPaid: paid } = getPOTotals(po);
      if (po.status !== PurchaseOrderStatus.Cancelled) {
        totalOrdered += grandTotal;
        totalPaid += paid;
      }
    });
    const openingBalance = supplier?.openingBalance || 0;
    return {
      totalOrdered: totalOrdered + openingBalance,
      totalPaid,
      totalDue: totalOrdered + openingBalance - totalPaid,
    };
  }, [supplierPOs, supplier]);

  const handleMakePayment = (payment: Omit<Payment, 'id'>) => {
    dispatch({ type: 'MAKE_SUPPLIER_PAYMENT', payload: { supplierId, payment } });
    setShowPaymentModal(false);
  };

  if (!supplier) {
    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">Supplier not found</h2>
            <button onClick={onBack} className="mt-4 flex items-center justify-center mx-auto bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
            </button>
        </div>
    );
  }

  const getPOStatusColor = (status: PurchaseOrderStatus) => {
    switch (status) {
      case PurchaseOrderStatus.Completed: return 'bg-blue-100 text-blue-800';
      case PurchaseOrderStatus.Paid: return 'bg-green-100 text-green-800';
      case PurchaseOrderStatus.PartiallyPaid: return 'bg-yellow-100 text-yellow-800';
      case PurchaseOrderStatus.Ordered: return 'bg-indigo-100 text-indigo-800';
      case PurchaseOrderStatus.Cancelled: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto space-y-8">
        <div className="flex justify-between items-start">
            <div className="flex items-center">
                <button onClick={onBack} className="flex items-center bg-gray-200 text-gray-800 px-3 py-2 rounded-md hover:bg-gray-300 transition-colors mr-4">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">{supplier.name}</h1>
                    <p className="text-gray-500">{supplier.email} &bull; {supplier.phone}</p>
                </div>
            </div>
            {supplierStats.totalDue > 0 && (
                <button onClick={() => setShowPaymentModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center">
                    <Receipt className="h-5 w-5 mr-2" />
                    Make Payment
                </button>
            )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Total Ordered" value={`$${supplierStats.totalOrdered.toFixed(2)}`} IconComponent={CircleDollarSign} color="blue" />
            <StatCard title="Total Paid" value={`$${supplierStats.totalPaid.toFixed(2)}`} IconComponent={Receipt} color="green" />
            <StatCard title="Current Due" value={`$${supplierStats.totalDue.toFixed(2)}`} IconComponent={TrendingDown} color="red" />
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance Due</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {supplierPOs.map(po => {
                            const { grandTotal, totalPaid, balanceDue } = getPOTotals(po);
                            return (
                                <tr key={po.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{po.poNumber}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{po.orderDate}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">${grandTotal.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-sm text-green-600">${totalPaid.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-red-600">${balanceDue.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPOStatusColor(po.status)}`}>{po.status}</span>
                                    </td>
                                </tr>
                            );
                        })}
                        {supplierPOs.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-500">No purchase orders for this supplier.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
        
        {showPaymentModal && (
            <MakePaymentModal
                supplier={supplier}
                totalDue={supplierStats.totalDue}
                onClose={() => setShowPaymentModal(false)}
                onConfirm={handleMakePayment}
            />
        )}
    </div>
  );
});

export default SupplierProfilePage;
