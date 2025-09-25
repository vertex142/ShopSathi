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
                <button onClick={handleAddNew} className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light transition-colors">
                    Add New Customer
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                {state.customers.length > 0 ? (
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
                                    <tr key={customer.id} className="dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button onClick={() => onViewCustomer(customer.id)} className="text-sm font-medium text-brand-blue hover:underline">
                                                {customer.name}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{customer.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{customer.phone}</td>
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
                ) : (
                    <EmptyState
                        Icon={Users}
                        title="Add Your First Customer"
                        message="Manage all your customer information in one place. Add a customer to get started."
                        actionButton={
                            <button onClick={handleAddNew} className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light transition-colors">
                                Add New Customer
                            </button>
                        }
                    />
                )}
            </div>

            {showForm && <CustomerForm customer={selectedCustomer} onClose={() => setShowForm(false)} onSave={() => {}} />}
        </div>
    );
});

export default CustomersPage;