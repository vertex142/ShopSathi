import React from 'react';
import { JobOrder, Customer } from '../types';
import { MoreVertical, Edit, Trash2, Eye } from 'lucide-react';

interface JobKanbanCardProps {
    job: JobOrder;
    customer?: Customer;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, jobId: string) => void;
    onEdit: (job: JobOrder) => void;
    onDelete: (id: string) => void;
    onViewDetails: (job: JobOrder) => void;
}

const JobKanbanCard: React.FC<JobKanbanCardProps> = ({ job, customer, onDragStart, onEdit, onDelete, onViewDetails }) => {
    const [dropdownOpen, setDropdownOpen] = React.useState(false);

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, job.id)}
            className="bg-white p-3 rounded-md shadow-sm border cursor-grab active:cursor-grabbing"
        >
            <div className="flex justify-between items-start">
                <h4 className="font-semibold text-sm text-gray-800 break-words w-11/12">{job.jobName}</h4>
                <div className="relative">
                    <button onClick={() => setDropdownOpen(!dropdownOpen)} className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                    </button>
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                             <button onClick={() => { onViewDetails(job); setDropdownOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <Eye className="h-4 w-4 mr-2" /> View Details
                            </button>
                            <button onClick={() => { onEdit(job); setDropdownOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <Edit className="h-4 w-4 mr-2" /> Edit Job
                            </button>
                            <button onClick={() => { onDelete(job.id); setDropdownOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Job
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{customer?.name || 'Unknown Customer'}</p>
            <div className="mt-3 flex justify-between items-center">
                <span className="text-xs text-gray-600">Due: {job.dueDate || 'N/A'}</span>
                <span className="text-sm font-bold text-brand-blue">${job.price.toFixed(2)}</span>
            </div>
        </div>
    );
};

export default JobKanbanCard;