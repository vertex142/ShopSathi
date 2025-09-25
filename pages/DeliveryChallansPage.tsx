import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { DeliveryChallan } from '../types';
import DeliveryChallanForm from '../components/DeliveryChallanForm';
import DeliveryChallanPreview from '../components/DeliveryChallanPreview';
import { Search, X, Eye, Edit, Trash2 } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import ActionMenu, { ActionMenuItem } from '../components/ActionMenu';

interface DeliveryChallansPageProps {
    onViewCustomer: (customerId: string) => void;
}

const DeliveryChallansPage: React.FC<DeliveryChallansPageProps> = React.memo(({ onViewCustomer }) => {
  const { state, dispatch } = useData();
  const [showForm, setShowForm] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<DeliveryChallan | null>(null);
  const [challanToPreview, setChallanToPreview] = useState<DeliveryChallan | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');

  const customerOptions = useMemo(() => [
    { value: '', label: 'All Customers' },
    ...state.customers.map(c => ({ value: c.id, label: c.name }))
  ], [state.customers]);

  const handleEdit = (challan: DeliveryChallan) => {
    setSelectedChallan(challan);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this delivery challan?')) {
      dispatch({ type: 'DELETE_DELIVERY_CHALLAN', payload: id });
    }
  };
  
  const handleAddNew = () => {
    setSelectedChallan(null);
    setShowForm(true);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterCustomer('');
  };

  const filteredChallans = useMemo(() => {
    return state.deliveryChallans.filter(challan => {
        return (
            (searchTerm === '' || challan.challanNumber.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filterCustomer === '' || challan.customerId === filterCustomer)
        );
    });
  }, [state.deliveryChallans, searchTerm, filterCustomer]);


  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Delivery Challans</h1>
        <button onClick={handleAddNew} className="bg-brand-blue dark:bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-brand-blue-light dark:hover:bg-blue-500 transition-colors">
          Add New Challan
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-1">
                <label htmlFor="search-challan" className="sr-only">Search Challan #</label>
                <input
                    id="search-challan"
                    type="text"
                    placeholder="Search Challan #"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 pl-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <div className="md:col-span-1">
                <label htmlFor="filter-customer" className="sr-only">Filter by customer</label>
                <SearchableSelect
                    value={filterCustomer}
                    onChange={setFilterCustomer}
                    options={customerOptions}
                    placeholder="All Customers"
                />
            </div>
             <div className="md:col-span-1 flex justify-end items-center">
                 <button
                    onClick={handleResetFilters}
                    className="w-full md:w-auto flex items-center justify-center p-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                    aria-label="Reset filters"
                >
                    <X className="h-4 w-4 mr-2" />
                    Reset
                </button>
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Challan #</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Issue Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Linked Invoice</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredChallans.length > 0 ? (
                        filteredChallans.map((challan) => {
                            const customer = state.customers.find(c => c.id === challan.customerId);
                            const invoice = state.invoices.find(inv => inv.id === challan.invoiceId);
                            const actions: ActionMenuItem[] = [
                                { label: 'Preview', icon: Eye, onClick: () => setChallanToPreview(challan) },
                                { label: 'Edit', icon: Edit, onClick: () => handleEdit(challan), className: 'text-indigo-600 dark:text-indigo-400' },
                                { label: 'Delete', icon: Trash2, onClick: () => handleDelete(challan.id), className: 'text-red-600 dark:text-red-400' },
                            ];
                            return (
                                <tr key={challan.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{challan.challanNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        <button onClick={() => onViewCustomer(challan.customerId)} className="hover:underline text-brand-blue dark:text-blue-400">
                                            {customer?.name || 'N/A'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{challan.issueDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{invoice?.invoiceNumber || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <ActionMenu actions={actions} />
                                    </td>
                                </tr>
                            )
                        })
                    ) : (
                        <tr>
                           <td colSpan={5} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                {state.deliveryChallans.length > 0 ? 'No challans match your filters.' : 'No delivery challans found. Add one to get started!'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {showForm && (
        <DeliveryChallanForm
          challan={selectedChallan}
          onClose={() => setShowForm(false)}
        />
      )}

      {challanToPreview && (
        <DeliveryChallanPreview
            challan={challanToPreview}
            onClose={() => setChallanToPreview(null)}
        />
      )}
    </div>
  );
});

export default DeliveryChallansPage;
