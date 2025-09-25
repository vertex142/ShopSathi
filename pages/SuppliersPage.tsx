import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Supplier, InventoryItem } from '../types';
import SupplierForm from '../components/SupplierForm';
import { Edit, Trash2 } from 'lucide-react';
import ActionMenu, { ActionMenuItem } from '../components/ActionMenu';

interface SuppliersPageProps {
    onViewSupplier: (supplierId: string) => void;
}

const SuppliersPage: React.FC<SuppliersPageProps> = React.memo(({ onViewSupplier }) => {
    const { state, dispatch } = useData();
    const [showForm, setShowForm] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    const handleEdit = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this supplier?')) {
            dispatch({ type: 'DELETE_SUPPLIER', payload: id });
        }
    };

    const handleAddNew = () => {
        setSelectedSupplier(null);
        setShowForm(true);
    };

    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Suppliers</h1>
                <button onClick={handleAddNew} className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light transition-colors">
                    Add New Supplier
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
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linked Inventory</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {state.suppliers.map((supplier) => {
                                const linkedItems = supplier.linkedInventoryItemIds
                                    ?.map(id => state.inventoryItems.find(item => item.id === id))
                                    .filter((item): item is InventoryItem => !!item)
                                    .map(item => item.name);
                                
                                const actions: ActionMenuItem[] = [
                                    { label: 'Edit', icon: Edit, onClick: () => handleEdit(supplier), className: 'text-indigo-600' },
                                    { label: 'Delete', icon: Trash2, onClick: () => handleDelete(supplier.id), className: 'text-red-600' },
                                ];

                                return (
                                <tr key={supplier.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button onClick={() => onViewSupplier(supplier.id)} className="text-sm font-medium text-brand-blue hover:underline">
                                            {supplier.name}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.phone}</td>
                                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs">
                                        {linkedItems && linkedItems.length > 0
                                            ? <span title={linkedItems.join(', ')}>{linkedItems.join(', ')}</span>
                                            : <span className="text-gray-400">None</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <ActionMenu actions={actions} />
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                 {state.suppliers.length === 0 && <p className="text-center py-10 text-gray-500">No suppliers found. Add one to get started!</p>}
            </div>

            {showForm && <SupplierForm supplier={selectedSupplier} onClose={() => setShowForm(false)} onSave={() => {}} />}
        </div>
    );
});

export default SuppliersPage;
