import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Customer } from '../types';
import CustomerForm from '../components/CustomerForm';
import { MessageSquare } from 'lucide-react';

interface CustomersPageProps {
    onViewCustomer: (customerId: string) => void;
    onStartChat: (customerId: string) => void;
}

const CustomersPage: React.FC<CustomersPageProps> = React.memo(({ onViewCustomer, onStartChat }) => {
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
                <h1 className="text-3xl font-bold text-gray-800">Customers</h1>
                <button onClick={handleAddNew} className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light transition-colors">
                    Add New Customer
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {state.customers.map((customer) => (
                                <tr key={customer.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button onClick={() => onViewCustomer(customer.id)} className="text-sm font-medium text-brand-blue hover:underline">
                                            {customer.name}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                        <button onClick={() => onStartChat(customer.id)} className="text-green-600 hover:text-green-900 inline-flex items-center" title="Start Chat">
                                            <MessageSquare className="h-4 w-4 mr-1" /> Chat
                                        </button>
                                        <button onClick={() => handleEdit(customer)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                        <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {state.customers.length === 0 && <p className="text-center py-10 text-gray-500">No customers found. Add one to get started!</p>}
            </div>

            {showForm && <CustomerForm customer={selectedCustomer} onClose={() => setShowForm(false)} onSave={() => setShowForm(false)} />}
        </div>
    );
});

export default CustomersPage;