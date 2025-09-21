import React from 'react';
import { Page } from '../types';
import { PlusCircle, FileText, UserPlus, TrendingDown, ShoppingCart } from 'lucide-react';

interface QuickActionsProps {
    setCurrentPage: (page: Page) => void;
}

const ActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center space-y-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 hover:text-brand-blue w-full"
    >
        {icon}
        <span className="text-sm font-medium">{label}</span>
    </button>
);


const QuickActions: React.FC<QuickActionsProps> = ({ setCurrentPage }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-md h-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <PlusCircle className="h-5 w-5 mr-2 text-brand-blue" />
                Quick Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <ActionButton icon={<FileText />} label="New Invoice" onClick={() => setCurrentPage('invoices')} />
                <ActionButton icon={<UserPlus />} label="New Customer" onClick={() => setCurrentPage('customers')} />
                <ActionButton icon={<ShoppingCart />} label="New PO" onClick={() => setCurrentPage('purchaseOrders')} />
                <ActionButton icon={<TrendingDown />} label="New Expense" onClick={() => setCurrentPage('expenses')} />
            </div>
        </div>
    );
};

export default QuickActions;
