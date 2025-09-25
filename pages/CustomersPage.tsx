import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Customer } from '../types';
import CustomerForm from '../components/CustomerForm';
import { Edit, Trash2, Users } from 'lucide-react';
import EmptyState from '../components/EmptyState';

interface CustomersPageProps {
    onViewCustomer: (customerId: string) => void;
}

const CustomersPage: React.FC<CustomersPageProps> = React.memo(({ onViewCustomer }) => {
    const { state, dispatch } = useData();
    const [showForm, setShowForm] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this customer? This will not delete their invoices.')) {
            dispatch({ type: 'DELETE_CUSTOMER', payload: id });
        }
    };

    const handleAddNew = () => {
        setSelectedCustomer(null);
        setShowForm(true);
    };

    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Customers</h1>
                <button onClick={handleAddNew} className="bg-brand-blue dark:bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-brand-blue-light dark:hover:bg-blue-500 transition-colors">
                    Add New Customer
                </button>
            </div>

            {state.customers.length === 0 ? (
                <EmptyState 
                    Icon={Users}
                    title="No Customers Found"
                    message="You haven't added any customers yet. Add your first customer to start creating invoices and quotes."
                    action={{ label: 'Add New Customer', onClick: handleAddNew }}
                />
            ) : (
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {state.customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button onClick={() => onViewCustomer(customer.id)} className="text-sm font-medium text-brand-blue dark:text-blue-400 hover:underline">
                                                {customer.name}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{customer.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{customer.phone}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end items-center space-x-1">
                                                <button onClick={() => handleEdit(customer)} className="text-indigo-600 hover:text-indigo-900 p-1" title="Edit Customer"><Edit className="h-4 w-4"/></button>
                                                <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-900 p-1" title="Delete Customer"><Trash2 className="h-4 w-4"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {showForm && <CustomerForm customer={selectedCustomer} onClose={() => setShowForm(false)} onSave={() => setShowForm(false)} />}
        </div>
    );
});

export default CustomersPage;