import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { InventoryItem } from '../types';
import InventoryItemForm from '../components/InventoryItemForm';
import { Edit, Trash2 } from 'lucide-react';
import ActionMenu, { ActionMenuItem } from '../components/ActionMenu';

const InventoryPage: React.FC = React.memo(() => {
  const { state, dispatch } = useData();
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      dispatch({ type: 'DELETE_INVENTORY_ITEM', payload: id });
    }
  };
  
  const handleAddNew = () => {
    setSelectedItem(null);
    setShowForm(true);
  };

  const getStatus = (item: InventoryItem) => {
    if (item.stockQuantity <= 0) {
      return { text: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    }
    if (item.stockQuantity <= item.reorderLevel) {
      return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { text: 'In Stock', color: 'bg-green-100 text-green-800' };
  };
  
  const inventoryItems = state.inventoryItems || [];

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Inventory Management</h1>
        <button onClick={handleAddNew} className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light transition-colors">
          Add New Item
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {inventoryItems.map((item) => {
                        const status = getStatus(item);
                        const actions: ActionMenuItem[] = [
                            { label: 'Edit', icon: Edit, onClick: () => handleEdit(item), className: 'text-indigo-600' },
                            { label: 'Delete', icon: Trash2, onClick: () => handleDelete(item.id), className: 'text-red-600' },
                        ];
                        return (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sku}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{item.stockQuantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                                        {status.text}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <ActionMenu actions={actions} />
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
        {inventoryItems.length === 0 && <p className="text-center py-10 text-gray-500">No inventory items found. Add one to get started!</p>}
      </div>

      {showForm && (
        <InventoryItemForm
          item={selectedItem}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
});

export default InventoryPage;
