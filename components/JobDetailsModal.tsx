
import React from 'react';
import { JobOrder, JobCostBreakdown, OldJobCostBreakdown } from '../types';
import { useData } from '../context/DataContext';
import { X, Edit } from 'lucide-react';

interface JobDetailsModalProps {
  job: JobOrder;
  onClose: () => void;
  onEdit: (job: JobOrder) => void;
}

const isNewCostBreakdown = (breakdown: any): breakdown is JobCostBreakdown => {
    return breakdown && typeof breakdown.paper === 'object' && breakdown.paper !== null;
};

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ job, onClose, onEdit }) => {
    const { state } = useData();
    const customer = state.customers.find(c => c.id === job.customerId);
    const { costBreakdown, estimatedCost } = job;

    const renderCostBreakdown = () => {
        if (!costBreakdown || estimatedCost === undefined) return null;

        if (isNewCostBreakdown(costBreakdown)) {
            // New, detailed format
            const breakdown = costBreakdown as JobCostBreakdown;
            const allItems = [
                { label: 'Paper', ...breakdown.paper },
                { label: 'CTP/Plate', ...breakdown.ctp },
                { label: 'Printing', ...breakdown.printing },
                { label: 'Binding', ...breakdown.binding },
                { label: 'Delivery', ...breakdown.delivery },
                ...breakdown.otherExpenses.map(exp => ({ label: exp.description, ...exp })),
            ].filter(item => item.total > 0);

            return (
                 <div className="mt-4 pl-4">
                    <h4 className="font-semibold text-gray-700">Cost Breakdown:</h4>
                     <table className="min-w-full mt-2 text-sm">
                        <thead className="text-left text-gray-500">
                            <tr>
                                <th className="py-1 font-normal">Item</th>
                                <th className="py-1 font-normal text-center">Qty</th>
                                <th className="py-1 font-normal text-right">Rate</th>
                                <th className="py-1 font-normal text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                        {allItems.map((item, index) => (
                            <tr key={index}>
                                <td className="py-1">{item.label}</td>
                                <td className="py-1 text-center">{item.quantity}</td>
                                <td className="py-1 text-right">${item.rate.toFixed(2)}</td>
                                <td className="py-1 text-right font-medium">${item.total.toFixed(2)}</td>
                            </tr>
                        ))}
                        </tbody>
                     </table>
                </div>
            );
        } else {
            // Old, simple format
            const breakdown = costBreakdown as OldJobCostBreakdown;
             return (
                 <div className="mt-4 pl-4">
                    <h4 className="font-semibold text-gray-700">Cost Breakdown:</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mt-2">
                        {breakdown.paper > 0 && <li>Paper: ${breakdown.paper.toFixed(2)}</li>}
                        {breakdown.ctp > 0 && <li>CTP/Plate: ${breakdown.ctp.toFixed(2)}</li>}
                        {breakdown.printing > 0 && <li>Printing: ${breakdown.printing.toFixed(2)}</li>}
                        {breakdown.binding > 0 && <li>Binding: ${breakdown.binding.toFixed(2)}</li>}
                        {breakdown.delivery > 0 && <li>Delivery: ${breakdown.delivery.toFixed(2)}</li>}
                        {breakdown.otherExpenses.map(exp => (
                            <li key={exp.id}>{exp.description || 'Other'}: ${exp.amount.toFixed(2)}</li>
                        ))}
                    </ul>
                </div>
             );
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{job.jobName}</h2>
                        <p className="text-sm text-gray-500">For: {customer?.name || 'N/A'}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full">
                        <X className="h-6 w-6" />
                    </button>
                </header>
                
                <main className="p-6 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <DetailItem label="Status" value={job.status} />
                        <DetailItem label="Order Date" value={job.orderDate} />
                        <DetailItem label="Due Date" value={job.dueDate} />
                        <DetailItem label="Price" value={`$${job.price.toFixed(2)}`} />
                        <DetailItem label="Quantity" value={job.quantity.toString()} />
                        <DetailItem label="Paper Type" value={job.paperType} />
                        <DetailItem label="Size" value={job.size} />
                        <DetailItem label="Finishing" value={job.finishing} />
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Description</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{job.description || 'No description provided.'}</p>
                    </div>

                    {job.materialsUsed && job.materialsUsed.length > 0 && (
                         <div className="border-t pt-4">
                            <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Materials Used (from Inventory)</h3>
                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                                {job.materialsUsed.map(material => {
                                    const item = state.inventoryItems.find(i => i.id === material.itemId);
                                    return <li key={material.itemId}>{item?.name || 'Unknown Item'}: {material.quantity} units</li>
                                })}
                            </ul>
                        </div>
                    )}
                    
                    {costBreakdown && estimatedCost !== undefined && (
                        <div className="border-t pt-4">
                            <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Cost & Profitability</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500">Estimated Cost</h4>
                                    <p className="text-lg font-bold text-red-600">${estimatedCost.toFixed(2)}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500">Estimated Profit</h4>
                                    <p className="text-lg font-bold text-green-600">${(job.price - estimatedCost).toFixed(2)}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500">Profit Margin</h4>
                                    <p className="text-lg font-bold text-green-600">{job.price > 0 ? `${((job.price - estimatedCost) / job.price * 100).toFixed(1)}%` : 'N/A'}</p>
                                </div>
                            </div>
                            {renderCostBreakdown()}
                        </div>
                    )}

                    {job.notes && (
                         <div className="border-t pt-4">
                            <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Internal Notes</h3>
                            <p className="text-gray-700 bg-yellow-50 p-3 rounded-md whitespace-pre-wrap">{job.notes}</p>
                        </div>
                    )}
                </main>

                <footer className="flex justify-end p-4 border-t bg-gray-50">
                    <button
                        onClick={() => {
                            onClose();
                            onEdit(job);
                        }}
                        className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light flex items-center"
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Job
                    </button>
                </footer>
            </div>
        </div>
    );
};

const DetailItem: React.FC<{label: string; value: string}> = ({ label, value }) => (
    <div>
        <h4 className="text-xs font-semibold uppercase text-gray-500">{label}</h4>
        <p className="text-gray-800">{value || 'N/A'}</p>
    </div>
);

export default JobDetailsModal;
