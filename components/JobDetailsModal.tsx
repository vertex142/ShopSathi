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

const calculateTotalCost = (breakdown: JobCostBreakdown | OldJobCostBreakdown | undefined): number => {
    if (!breakdown) return 0;
    if (isNewCostBreakdown(breakdown)) {
        const standard = breakdown.paper.total + breakdown.ctp.total + breakdown.printing.total + breakdown.binding.total + breakdown.delivery.total + (breakdown.overhead?.total || 0);
        const labor = (breakdown.labor || []).reduce((sum, item) => sum + item.total, 0);
        const other = breakdown.otherExpenses.reduce((sum, item) => sum + item.total, 0);
        return standard + labor + other;
    } else {
        const old = breakdown as OldJobCostBreakdown;
        const standard = old.paper + old.ctp + old.printing + old.binding + old.delivery;
        const other = old.otherExpenses.reduce((sum, item) => sum + item.amount, 0);
        return standard + other;
    }
};

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ job, onClose, onEdit }) => {
    const { state } = useData();
    const customer = state.customers.find(c => c.id === job.customerId);
    const { estimatedCostBreakdown, actualCostBreakdown } = job;

    const estimatedTotal = calculateTotalCost(estimatedCostBreakdown);
    const actualTotal = calculateTotalCost(actualCostBreakdown);
    
    const renderBreakdownDetails = (breakdown: JobCostBreakdown | OldJobCostBreakdown | undefined, title: string) => {
        if (!breakdown) {
            return (
                <div>
                    <h4 className="font-semibold text-gray-700">{title}</h4>
                    <p className="text-sm text-gray-500 mt-2">No cost details provided.</p>
                </div>
            );
        }

        if (isNewCostBreakdown(breakdown)) {
            const allItems = [
                { label: 'Paper', ...breakdown.paper },
                { label: 'CTP/Plate', ...breakdown.ctp },
                { label: 'Printing', ...breakdown.printing },
                { label: 'Binding', ...breakdown.binding },
                { label: 'Delivery', ...breakdown.delivery },
            ].filter(item => item.total > 0);

            const laborItems = (breakdown.labor || []).filter(item => item.total > 0);
            const otherExpenseItems = breakdown.otherExpenses.map(exp => {
                const linkedExpense = exp.transactionId ? state.expenses.find(e => e.id === exp.transactionId) : null;
                return {
                    label: linkedExpense ? linkedExpense.description : exp.description,
                    total: exp.total
                }
            }).filter(item => item.total > 0);

            const subtotal = allItems.reduce((s, i) => s + i.total, 0) + laborItems.reduce((s, i) => s + i.total, 0) + otherExpenseItems.reduce((s, i) => s + i.total, 0);
            const overheadAmount = breakdown.overhead?.total || 0;

            return (
                <div>
                    <h4 className="font-semibold text-gray-700">{title}</h4>
                    <table className="min-w-full mt-2 text-sm">
                        <tbody className="divide-y">
                            {allItems.map((item, i) => <tr key={`std-${i}`}><td className="py-1">{item.label}</td><td className="py-1 text-right">${item.total.toFixed(2)}</td></tr>)}
                            {laborItems.map((item, i) => <tr key={`lab-${i}`}><td className="py-1">{item.description} (Labor)</td><td className="py-1 text-right">${item.total.toFixed(2)}</td></tr>)}
                            {otherExpenseItems.map((item, i) => <tr key={`oth-${i}`}><td className="py-1">{item.label}</td><td className="py-1 text-right">${item.total.toFixed(2)}</td></tr>)}
                            {breakdown.overhead && overheadAmount > 0 && 
                                <>
                                    <tr className="font-medium border-t-2"><td className="py-1">Subtotal</td><td className="py-1 text-right">${subtotal.toFixed(2)}</td></tr>
                                    <tr><td className="py-1">Overhead ({breakdown.overhead.quantity}%)</td><td className="py-1 text-right">${overheadAmount.toFixed(2)}</td></tr>
                                </>
                            }
                        </tbody>
                    </table>
                </div>
            );
        } else {
             const old = breakdown as OldJobCostBreakdown;
             return (
                 <div>
                    <h4 className="font-semibold text-gray-700">{title} (Old Format)</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mt-2">
                        {old.paper > 0 && <li>Paper: ${old.paper.toFixed(2)}</li>}
                        {old.ctp > 0 && <li>CTP/Plate: ${old.ctp.toFixed(2)}</li>}
                        {old.printing > 0 && <li>Printing: ${old.printing.toFixed(2)}</li>}
                        {old.binding > 0 && <li>Binding: ${old.binding.toFixed(2)}</li>}
                        {old.delivery > 0 && <li>Delivery: ${old.delivery.toFixed(2)}</li>}
                        {old.otherExpenses.map(exp => (
                            <li key={exp.id}>{exp.description || 'Other'}: ${exp.amount.toFixed(2)}</li>
                        ))}
                    </ul>
                </div>
             );
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
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
                        <DetailItem label="Sale Price" value={`$${job.price.toFixed(2)}`} />
                    </div>
                    
                    <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Profitability</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                            <ProfitabilityMetric label="Estimated Profit" value={job.price - estimatedTotal} isPositive={(job.price - estimatedTotal) >= 0} />
                            <ProfitabilityMetric label="Actual Profit" value={job.price - actualTotal} isPositive={(job.price - actualTotal) >= 0} />
                            <ProfitabilityMetric label="Variance" value={estimatedTotal - actualTotal} isPositive={(estimatedTotal - actualTotal) >= 0} suffix={ (estimatedTotal - actualTotal) >= 0 ? " (under budget)" : " (over budget)"} />
                        </div>
                    </div>

                    <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                       {renderBreakdownDetails(estimatedCostBreakdown, "Estimated Costs")}
                       {renderBreakdownDetails(actualCostBreakdown, "Actual Costs")}
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

const ProfitabilityMetric: React.FC<{label: string, value: number, isPositive: boolean, suffix?: string}> = ({label, value, isPositive, suffix}) => (
    <div>
        <h4 className="text-xs font-semibold text-gray-500">{label}</h4>
        <p className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            ${value.toFixed(2)}
            {suffix && <span className="text-xs font-normal">{suffix}</span>}
        </p>
    </div>
)

export default JobDetailsModal;