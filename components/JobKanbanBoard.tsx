import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { JobStatus, JobOrder } from '../types';
import JobKanbanCard from './JobKanbanCard';

interface JobKanbanBoardProps {
    onEdit: (job: JobOrder) => void;
    onDelete: (id: string) => void;
    onViewDetails: (job: JobOrder) => void;
}

const JobKanbanBoard: React.FC<JobKanbanBoardProps> = ({ onEdit, onDelete, onViewDetails }) => {
    const { state, dispatch } = useData();
    const [dragOverStatus, setDragOverStatus] = useState<JobStatus | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, jobId: string) => {
        e.dataTransfer.setData("jobId", jobId);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: JobStatus) => {
        e.preventDefault();
        const jobId = e.dataTransfer.getData("jobId");
        const job = state.jobOrders.find(j => j.id === jobId);
        if (job && job.status !== status) {
            dispatch({ type: 'UPDATE_JOB_ORDER', payload: { ...job, status } });
        }
        setDragOverStatus(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: JobStatus) => {
        e.preventDefault();
        setDragOverStatus(status);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        setDragOverStatus(null);
    };

    const columns = Object.values(JobStatus).map(status => ({
        status,
        title: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
        jobs: state.jobOrders.filter(job => job.status === status),
    }));

    return (
        <div>
            <div className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <strong>💡 Pro Tip:</strong> Drag and drop jobs between columns to quickly update their status.
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-4">
                {columns.map(({ status, title, jobs }) => (
                    <div
                        key={status}
                        className={`w-80 bg-gray-100 rounded-lg shadow-inner flex-shrink-0 transition-colors duration-200 ${dragOverStatus === status ? 'bg-blue-100 border-2 border-dashed border-blue-400' : ''}`}
                        onDrop={(e) => handleDrop(e, status)}
                        onDragOver={(e) => handleDragOver(e, status)}
                        onDragLeave={handleDragLeave}
                    >
                        <div className="p-4 border-b">
                            <h3 className="font-semibold text-gray-700">{title} ({jobs.length})</h3>
                        </div>
                        <div className="p-2 space-y-2 h-full">
                            {jobs.map(job => (
                                <JobKanbanCard
                                    key={job.id}
                                    job={job}
                                    customer={state.customers.find(c => c.id === job.customerId)}
                                    onDragStart={handleDragStart}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onViewDetails={onViewDetails}
                                />
                            ))}
                            {jobs.length === 0 && <div className="text-center p-4 text-sm text-gray-400">No jobs in this stage.</div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JobKanbanBoard;