import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { PurchaseOrder, PurchaseOrderStatus } from '../types';
import PurchaseOrderForm from '../components/PurchaseOrderForm';
import PurchaseOrderPreview from '../components/PurchaseOrderPreview';
import StatusEditor from '../components/StatusEditor';
import { Search, X, Eye, Edit, Trash2, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import SearchableSelect from '../components/SearchableSelect';
import EmptyState from '../components/EmptyState';
import ActionMenu, { ActionMenuItem } from '../components/ActionMenu';

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
  
  const supplierOptions = useMemo(() => [
    { value: '', label: 'All Suppliers' },
    ...state.suppliers.map(s => ({ value: s.id, label: s.name }))
  ], [state.suppliers]);

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

  const getPOTotals = (po: PurchaseOrder) => {
    const grandTotal = po.items.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
    const totalPaid = (po.payments || []).reduce((acc, p) => acc + p.amount, 0);
    const balanceDue = grandTotal - totalPaid;
    return { grandTotal, totalPaid, balanceDue };
  };

  const getStatusColor = (status: PurchaseOrderStatus) => {
    switch (status) {
      case PurchaseOrderStatus.Completed: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case PurchaseOrderStatus.Paid: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case PurchaseOrderStatus.PartiallyPaid: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case PurchaseOrderStatus.Ordered: return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case PurchaseOrderStatus.PartiallyReceived: return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case PurchaseOrderStatus.Cancelled: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case PurchaseOrderStatus.Pending:
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
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
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Purchase Orders</h1>
        <button onClick={handleAddNew} className="bg-brand-blue dark:bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-brand-blue-light dark:hover:bg-blue-500 transition-colors">
          Add New PO
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <input
              type="text"
              placeholder="Search PO #"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <SearchableSelect
            value={filterSupplier}
            onChange={setFilterSupplier}
            options={supplierOptions}
            placeholder="All Suppliers"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
          >
            <option value="">All Statuses</option>
            {Object.values(PurchaseOrderStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="md:col-span-4 flex justify-end">
            <button
                onClick={handleResetFilters}
                className="flex items-center justify-center p-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
            >
                <X className="h-4 w-4 mr-2" />
                Reset
            </button>
          </div>
        </div>
      </div>

      {state.purchaseOrders.length === 0 ? (
        <EmptyState 
            Icon={ShoppingCart}
            title="No Purchase Orders"
            message="Manage your inventory purchasing by creating your first purchase order."
            action={{ label: 'Add New PO', onClick: handleAddNew }}
        />
      ) : (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">PO #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Balance Due</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPOs.length > 0 ? (
                filteredPOs.map((po) => {
                  const supplier = state.suppliers.find(s => s.id === po.supplierId);
                  const { grandTotal, totalPaid, balanceDue } = getPOTotals(po);
                  const actions: ActionMenuItem[] = [
                    { label: 'Preview', icon: Eye, onClick: () => setPoToPreview(po) },
                    { label: 'Edit', icon: Edit, onClick: () => handleEdit(po), className: 'text-indigo-600 dark:text-indigo-400' },
                    { label: 'Delete', icon: Trash2, onClick: () => handleDelete(po.id), className: 'text-red-600 dark:text-red-400' },
                  ];
                  return (
                    <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{po.poNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <button onClick={() => onViewSupplier(po.supplierId)} className="hover:underline text-brand-blue dark:text-blue-400">
                            {supplier?.name || 'N/A'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{po.orderDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(grandTotal)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">{formatCurrency(totalPaid)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(balanceDue)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <StatusEditor
                            item={po}
                            status={po.status}
                            statusEnum={PurchaseOrderStatus}
                            updateActionType="UPDATE_PURCHASE_ORDER"
                            getStatusColor={getStatusColor}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <ActionMenu actions={actions} />
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500 dark:text-gray-400">
                    No purchase orders match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

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
