import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { PurchaseOrder, PurchaseOrderStatus } from '../types';
import PurchaseOrderForm from '../components/PurchaseOrderForm';
import PurchaseOrderPreview from '../components/PurchaseOrderPreview';
import StatusEditor from '../components/StatusEditor';
import { Search, X } from 'lucide-react';

interface PurchaseOrdersPageProps {
    onViewSupplier: (supplierId: string) => void;
}

const PurchaseOrdersPage: React.FC<PurchaseOrdersPageProps> = React.memo(({ onViewSupplier }) => {
  const { state, dispatch } = useData();
  const [showForm, setShowForm] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [poToPreview, setPoToPreview] = useState<PurchaseOrder | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const handleEdit = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      dispatch({ type: 'DELETE_PURCHASE_ORDER', payload: id });
    }
  };

  const handleAddNew = () => {
    setSelectedPO(null);
    setShowForm(true);
  };

  const getPOTotal = (po: PurchaseOrder) => {
    return po.items.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
  };

  const getStatusColor = (status: PurchaseOrderStatus) => {
    switch (status) {
      case PurchaseOrderStatus.Completed:
        return 'bg-blue-100 text-blue-800';
      case PurchaseOrderStatus.Paid:
        return 'bg-green-100 text-green-800';
      case PurchaseOrderStatus.PartiallyPaid:
        return 'bg-yellow-100 text-yellow-800';
      case PurchaseOrderStatus.Ordered:
        return 'bg-indigo-100 text-indigo-800';
      case PurchaseOrderStatus.PartiallyReceived:
        return 'bg-purple-100 text-purple-800';
      case PurchaseOrderStatus.Cancelled:
        return 'bg-red-100 text-red-800';
      case PurchaseOrderStatus.Pending:
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterSupplier('');
    setFilterStatus('');
  };

  const filteredPOs = useMemo(() => {
    return state.purchaseOrders.filter(po => {
      return (
        (searchTerm === '' || po.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterSupplier === '' || po.supplierId === filterSupplier) &&
        (filterStatus === '' || po.status === filterStatus)
      );
    });
  }, [state.purchaseOrders, searchTerm, filterSupplier, filterStatus]);

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Purchase Orders</h1>
        <button onClick={handleAddNew} className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light transition-colors">
          Add New PO
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <input
              type="text"
              placeholder="Search PO #"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md shadow-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <select
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
            className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"
          >
            <option value="">All Suppliers</option>
            {state.suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"
          >
            <option value="">All Statuses</option>
            {Object.values(PurchaseOrderStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="md:col-span-4 flex justify-end">
            <button
                onClick={handleResetFilters}
                className="flex items-center justify-center p-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300"
            >
                <X className="h-4 w-4 mr-2" />
                Reset
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Delivery</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPOs.length > 0 ? (
                filteredPOs.map((po) => {
                  const supplier = state.suppliers.find(s => s.id === po.supplierId);
                  return (
                    <tr key={po.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{po.poNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button onClick={() => onViewSupplier(po.supplierId)} className="hover:underline text-brand-blue">
                            {supplier?.name || 'N/A'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{po.orderDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{po.expectedDeliveryDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">${getPOTotal(po).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <StatusEditor
                            item={po}
                            status={po.status}
                            statusEnum={PurchaseOrderStatus}
                            updateActionType="UPDATE_PURCHASE_ORDER"
                            getStatusColor={getStatusColor}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                        <button onClick={() => setPoToPreview(po)} className="text-blue-600 hover:text-blue-900">Preview</button>
                        <button onClick={() => handleEdit(po)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                        <button onClick={() => handleDelete(po.id)} className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">
                    No purchase orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <PurchaseOrderForm
          purchaseOrder={selectedPO}
          onClose={() => setShowForm(false)}
        />
      )}
      
      {poToPreview && (
        <PurchaseOrderPreview 
            purchaseOrder={poToPreview}
            onClose={() => setPoToPreview(null)}
        />
      )}
    </div>
  );
});

export default PurchaseOrdersPage;