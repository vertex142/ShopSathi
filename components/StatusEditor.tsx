import React, { useState } from 'react';
import { useData } from '../context/DataContext';

interface StatusEditorProps {
    item: any;
    status: string;
    statusEnum: { [key: string]: string };
    // Fix: Changed updateActionType to a simple string.
    updateActionType: string;
    getStatusColor: (status: string) => string;
    disabledStatuses?: string[];
}

const StatusEditor: React.FC<StatusEditorProps> = ({
    item,
    status,
    statusEnum,
    updateActionType,
    getStatusColor,
    disabledStatuses = [],
}) => {
    // Fix: Destructure all necessary update functions from useData.
    const { updateInvoice, updateQuote, updateJobOrder, updatePurchaseOrder } = useData();
    const [isEditing, setIsEditing] = useState(false);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        const payload = { ...item, status: newStatus };
        
        // Fix: Use a switch statement to call the correct update function.
        switch(updateActionType) {
            case 'UPDATE_INVOICE':
                updateInvoice(payload);
                break;
            case 'UPDATE_QUOTE':
                updateQuote(payload);
                break;
            case 'UPDATE_JOB_ORDER':
                updateJobOrder(payload);
                break;
            case 'UPDATE_PURCHASE_ORDER':
                updatePurchaseOrder(payload);
                break;
            default:
                console.error(`Unknown updateActionType: ${updateActionType}`);
        }
        setIsEditing(false);
    };

    const availableStatuses = Object.values(statusEnum)
        .filter(s => !disabledStatuses.includes(s));
    
    const canEdit = !disabledStatuses.includes(status);

    if (isEditing && canEdit) {
        return (
            <select
                value={status}
                onChange={handleStatusChange}
                onBlur={() => setIsEditing(false)}
                className="block w-full p-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                autoFocus
            >
                {availableStatuses.map(s => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>
        );
    }

    return (
        <button
            onClick={() => canEdit && setIsEditing(true)}
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)} ${canEdit ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-indigo-500' : 'cursor-not-allowed'}`}
            disabled={!canEdit}
            title={canEdit ? 'Click to change status' : 'Status managed automatically'}
        >
            {status}
        </button>
    );
};

export default StatusEditor;
