import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { RecurringInvoice, RecurringInvoiceFrequency } from '../types';
import RecurringInvoiceForm from '../components/RecurringInvoiceForm';
import { Edit, Trash2 } from 'lucide-react';

interface RecurringInvoicesPageProps {
    onViewCustomer: (customerId: string) => void;
}

const getNextIssueDate = (profile: RecurringInvoice): string => {
    if (!profile.isActive) return 'Paused';
    
    const lastDate = new Date(profile.lastIssueDate);
    const nextDate = new Date(lastDate);

    switch(profile.frequency) {
        case RecurringInvoiceFrequency.Daily: nextDate.setDate(lastDate.getDate() + 1); break;
        case RecurringInvoiceFrequency.Weekly: nextDate.setDate(lastDate.getDate() + 7); break;
        case RecurringInvoiceFrequency.Monthly: nextDate.setMonth(lastDate.getMonth() + 1); break;
        case RecurringInvoiceFrequency.Yearly: nextDate.setFullYear(lastDate.getFullYear() + 1); break;
    }

    const profileEndDate = profile.endDate ? new Date(profile.endDate) : null;
    if (profileEndDate && nextDate > profileEndDate) {
        return 'Ended';
    }

    return nextDate.toISOString().split('T')[0];
};

const RecurringInvoicesPage: React.FC<RecurringInvoicesPageProps> = React.memo(({ onViewCustomer }) => {
  const { state, dispatch } = useData();
  const [showForm, setShowForm] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<RecurringInvoice | null>(null);

  const handleEdit = (profile: RecurringInvoice) => {
    setSelectedProfile(profile);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this recurring invoice profile? No future invoices will be generated.')) {
      dispatch({ type: 'DELETE_RECURRING_INVOICE', payload: id });
    }
  };
  
  const handleAddNew = () => {
    setSelectedProfile(null);
    setShowForm(true);
  };
  
  const profilesWithDetails = useMemo(() => {
    return state.recurringInvoices.map(profile => ({
      ...profile,
      customerName: state.customers.find(c => c.id === profile.customerId)?.name || 'Unknown',
      nextIssueDate: getNextIssueDate(profile),
    }));
  }, [state.recurringInvoices, state.customers]);

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Recurring Invoices</h1>
        <button onClick={handleAddNew} className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light transition-colors">
          Add New Profile
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Invoice</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {profilesWithDetails.length > 0 ? (
                        profilesWithDetails.map((profile) => (
                            <tr key={profile.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button onClick={() => onViewCustomer(profile.customerId)} className="hover:underline text-brand-blue">
                                        {profile.customerName}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">{profile.frequency.toLowerCase()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{profile.nextIssueDate}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{profile.endDate || 'Ongoing'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${profile.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {profile.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end items-center space-x-1">
                                        <button onClick={() => handleEdit(profile)} className="text-indigo-600 hover:text-indigo-900 p-1" title="Edit Profile"><Edit className="h-4 w-4"/></button>
                                        <button onClick={() => handleDelete(profile.id)} className="text-red-600 hover:text-red-900 p-1" title="Delete Profile"><Trash2 className="h-4 w-4"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                           <td colSpan={6} className="text-center py-10 text-gray-500">
                                No recurring invoice profiles found. Add one to automate your billing!
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
      
      {showForm && (
        <RecurringInvoiceForm
            profile={selectedProfile}
            onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
});

export default RecurringInvoicesPage;