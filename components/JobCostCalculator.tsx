import React, { useState, useMemo, useEffect } from 'react';
import { JobOrder, JobCostBreakdown, OldJobCostBreakdown, CostLineItem, OtherExpenseLineItem, LaborLineItem } from '../types';
import { useData } from '../context/DataContext';
import { Trash2, X, Printer, LoaderCircle, Plus, Copy } from 'lucide-react';
import { printDocument } from '../utils/pdfExporter';
import { formatCurrency } from '../utils/formatCurrency';

interface JobCostCalculatorProps {
  job: JobOrder;
  onSave: (estimated: JobCostBreakdown, actual: JobCostBreakdown) => void;
  onClose: () => void;
}

const isNewCostBreakdown = (breakdown: any): breakdown is JobCostBreakdown => {
    return breakdown && typeof breakdown.paper === 'object' && breakdown.paper !== null;
};

const emptyBreakdown = (): JobCostBreakdown => ({
    paper: { quantity: 1, rate: 0, total: 0 },
    ctp: { quantity: 1, rate: 0, total: 0 },
    printing: { quantity: 1, rate: 0, total: 0 },
    binding: { quantity: 1, rate: 0, total: 0 },
    delivery: { quantity: 1, rate: 0, total: 0 },
    labor: [],
    overhead: { quantity: 0, rate: 0, total: 0 },
    otherExpenses: [],
});

const convertOldToNew = (oldCosts: OldJobCostBreakdown): JobCostBreakdown => {
    const defaultLineItem = { quantity: 1, rate: 0, total: 0 };
    return {
        ...emptyBreakdown(),
        paper: { ...defaultLineItem, rate: oldCosts.paper, total: oldCosts.paper },
        ctp: { ...defaultLineItem, rate: oldCosts.ctp, total: oldCosts.ctp },
        printing: { ...defaultLineItem, rate: oldCosts.printing, total: oldCosts.printing },
        binding: { ...defaultLineItem, rate: oldCosts.binding, total: oldCosts.binding },
        delivery: { ...defaultLineItem, rate: oldCosts.delivery, total: oldCosts.delivery },
        otherExpenses: oldCosts.otherExpenses.map(exp => ({
            ...exp,
            quantity: 1,
            rate: exp.amount,
            total: exp.amount,
        })),
    };
};

const JobCostCalculator: React.FC<JobCostCalculatorProps> = ({ job, onSave, onClose }) => {
    const [activeTab, setActiveTab] = useState<'estimated' | 'actual'>('estimated');
    const [estimatedCosts, setEstimatedCosts] = useState<JobCostBreakdown>(emptyBreakdown());
    const [actualCosts, setActualCosts] = useState<JobCostBreakdown>(emptyBreakdown());
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        let est: JobCostBreakdown;
        if (job.estimatedCostBreakdown) {
            est = isNewCostBreakdown(job.estimatedCostBreakdown)
                ? job.estimatedCostBreakdown
                : convertOldToNew(job.estimatedCostBreakdown as OldJobCostBreakdown);
        } else {
            est = emptyBreakdown();
        }
        setEstimatedCosts(JSON.parse(JSON.stringify(est)));

        let act: JobCostBreakdown;
        if (job.actualCostBreakdown) {
            act = job.actualCostBreakdown;
        } else {
            act = JSON.parse(JSON.stringify(est));
        }
        setActualCosts(JSON.parse(JSON.stringify(act)));
    }, [job]);

    const handleSave = () => {
        onSave(estimatedCosts, actualCosts);
        onClose();
    };

    const handlePrint = async () => {
        setIsPrinting(true);
        await new Promise(resolve => setTimeout(resolve, 50));
        await printDocument('job-cost-sheet', `costing-${job.jobName.replace(/\s/g, '_')}.pdf`);
        setIsPrinting(false);
    };
    
    const copyEstToAct = () => {
        setActualCosts(JSON.parse(JSON.stringify(estimatedCosts)));
        alert("Estimated costs copied to actual costs.");
    }

    const currentCosts = activeTab === 'estimated' ? estimatedCosts : actualCosts;
    const setCurrentCosts = activeTab === 'estimated' ? setEstimatedCosts : setActualCosts;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4 printable-container">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col printable-document">
                <header className="flex-shrink-0 flex justify-between items-center p-6 border-b non-printable">
                    <h2 className="text-2xl font-bold">Job Cost Calculator</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                </header>

                <div className="border-b border-gray-200 non-printable">
                    <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('estimated')} className={`${activeTab === 'estimated' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            Estimated Costs
                        </button>
                        <button onClick={() => setActiveTab('actual')} className={`${activeTab === 'actual' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            Actual Costs
                        </button>
                    </nav>
                </div>

                <main className="flex-grow overflow-y-auto p-6 space-y-6 printable-content">
                    {activeTab === 'actual' && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex justify-between items-center non-printable">
                            <p className="text-sm text-blue-700">You are editing the <strong>actual costs</strong> for this job.</p>
                             <button onClick={copyEstToAct} className="flex items-center text-sm bg-white border border-blue-300 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-100">
                                <Copy className="h-4 w-4 mr-2" />
                                Copy from Estimated
                            </button>
                        </div>
                    )}
                    <CostSheet costs={currentCosts} setCosts={setCurrentCosts} />
                </main>

                <Footer onSave={handleSave} onPrint={handlePrint} isPrinting={isPrinting} costs={currentCosts} />
            </div>
        </div>
    );
};

interface CostSheetProps {
    costs: JobCostBreakdown;
    setCosts: React.Dispatch<React.SetStateAction<JobCostBreakdown>>;
}

const CostSheet: React.FC<CostSheetProps> = ({ costs, setCosts }) => {
    const { state } = useData();

    const updateCosts = (updater: (prev: JobCostBreakdown) => JobCostBreakdown) => {
        setCosts(prevCosts => {
            const newCosts = updater(prevCosts);
            const subtotal = (newCosts.paper?.total || 0) + (newCosts.ctp?.total || 0) + (newCosts.printing?.total || 0) + (newCosts.binding?.total || 0) + (newCosts.delivery?.total || 0)
                + (newCosts.labor || []).reduce((s, i) => s + i.total, 0)
                + (newCosts.otherExpenses || []).reduce((s, i) => s + i.total, 0);
            
            newCosts.overhead.rate = subtotal;
            newCosts.overhead.total = subtotal * (newCosts.overhead.quantity / 100);
            return newCosts;
        });
    };
    
    const handleStandardChange = (name: keyof Omit<JobCostBreakdown, 'otherExpenses' | 'labor' | 'overhead'>, field: 'quantity' | 'rate', value: number) => {
        updateCosts(prev => {
            const item = prev[name];
            const newQuantity = field === 'quantity' ? value : item.quantity;
            const newRate = field === 'rate' ? value : item.rate;
            return { ...prev, [name]: { quantity: newQuantity, rate: newRate, total: newQuantity * newRate } };
        });
    };

    const handleLaborChange = (index: number, field: keyof Omit<LaborLineItem, 'id' | 'total'>, value: string | number) => {
        updateCosts(prev => {
            const newLabor = [...(prev.labor || [])];
            const item = newLabor[index];
            (item as any)[field] = value;
            item.total = item.hours * item.rate;
            return { ...prev, labor: newLabor };
        });
    };

     const addLabor = () => {
        updateCosts(prev => ({ ...prev, labor: [...(prev.labor || []), { id: crypto.randomUUID(), description: '', hours: 0, rate: 0, total: 0 }] }));
    };

    const removeLabor = (index: number) => {
        updateCosts(prev => ({ ...prev, labor: (prev.labor || []).filter((_, i) => i !== index) }));
    };

    const handleOtherExpenseSelection = (index: number, transactionId: string) => {
        const selectedExpense = state.expenses.find(exp => exp.id === transactionId);
        if (!selectedExpense) return;
        updateCosts(prev => {
            const newOther = [...prev.otherExpenses];
            newOther[index] = { ...newOther[index], transactionId: selectedExpense.id, description: selectedExpense.description, quantity: 1, rate: selectedExpense.amount, total: selectedExpense.amount };
            return { ...prev, otherExpenses: newOther };
        });
    };
    
    const addOtherExpense = () => {
        updateCosts(prev => ({...prev, otherExpenses: [...prev.otherExpenses, { id: crypto.randomUUID(), description: '', quantity: 1, rate: 0, total: 0 }] }));
    };

    const removeOtherExpense = (index: number) => {
        updateCosts(prev => ({ ...prev, otherExpenses: prev.otherExpenses.filter((_, i) => i !== index) }));
    };

    const handleOverheadChange = (value: number) => {
        updateCosts(prev => ({ ...prev, overhead: { ...prev.overhead, quantity: value } }));
    };

    const costItems = [
        { label: 'Paper Cost', name: 'paper' }, { label: 'CTP / Plate Cost', name: 'ctp' },
        { label: 'Printing Cost', name: 'printing' }, { label: 'Binding Cost', name: 'binding' },
        { label: 'Delivery Cost', name: 'delivery' },
    ] as const;

    return (
        <div id="job-cost-sheet" className="printable-page space-y-6">
            <div className="space-y-4">
                {costItems.map(({ label, name }) => (
                     <CostInputRow key={name} label={label} item={costs[name]} onChange={(field, value) => handleStandardChange(name, field, value)} />
                ))}
            </div>

            <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Labor Costs</h3>
                <div className="space-y-3">
                    {(costs.labor || []).map((item, index) => (
                        <LaborInputRow key={item.id} item={item} onChange={(field, value) => handleLaborChange(index, field, value)} onRemove={() => removeLabor(index)} />
                    ))}
                </div>
                 <button onClick={addLabor} className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500 non-printable"><Plus className="inline h-4 w-4"/> Add Labor</button>
            </div>

            <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Other Expenses</h3>
                <div className="space-y-3">
                    {costs.otherExpenses.map((expense, index) => (
                        <div key={expense.id} className="grid grid-cols-12 gap-2 items-center">
                           <div className="col-span-12 sm:col-span-8">
                                <select value={expense.transactionId || ''} onChange={(e) => handleOtherExpenseSelection(index, e.target.value)} className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md">
                                    <option value="">Select an expense transaction</option>
                                    {state.expenses.map(exp => <option key={exp.id} value={exp.id}>{exp.date} - {exp.description} ({formatCurrency(exp.amount)})</option>)}
                                </select>
                            </div>
                           <div className="col-span-8 sm:col-span-3 text-right font-medium pr-2">{formatCurrency(expense.total)}</div>
                            <div className="col-span-4 sm:col-span-1 flex justify-end">
                                <button onClick={() => removeOtherExpense(index)} className="text-red-500 hover:text-red-700 p-1 non-printable"><Trash2 className="h-5 w-5" /></button>
                            </div>
                        </div>
                    ))}
                </div>
                 <button onClick={addOtherExpense} className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500 non-printable"><Plus className="inline h-4 w-4"/> Add Other Expense</button>
            </div>

             <div className="border-t pt-4 mt-6">
                <div className="grid grid-cols-12 gap-2 items-center">
                    <label className="col-span-12 sm:col-span-5 block text-sm font-medium text-gray-700">Overhead Rate (%)</label>
                    <div className="col-span-4 sm:col-span-2">
                        <input type="number" placeholder="%" value={costs.overhead?.quantity || ''} onChange={(e) => handleOverheadChange(parseFloat(e.target.value) || 0)} className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md" step="any" min="0" />
                    </div>
                    <div className="col-span-4 sm:col-span-2"></div>
                    <div className="col-span-4 sm:col-span-3 text-right font-medium text-lg pr-2">{formatCurrency(costs.overhead?.total || 0)}</div>
                </div>
            </div>
        </div>
    );
};

const Footer: React.FC<{onSave: () => void, onPrint: () => void, isPrinting: boolean, costs: JobCostBreakdown}> = ({ onSave, onPrint, isPrinting, costs}) => {
    const totalCost = useMemo(() => {
        const subtotal = (costs.paper?.total || 0) + (costs.ctp?.total || 0) + (costs.printing?.total || 0) + (costs.binding?.total || 0) + (costs.delivery?.total || 0)
            + (costs.labor || []).reduce((s, i) => s + i.total, 0)
            + (costs.otherExpenses || []).reduce((s, i) => s + i.total, 0);
        return subtotal + (costs.overhead?.total || 0);
    }, [costs]);

    return (
        <footer className="flex-shrink-0 mt-auto p-6 border-t space-y-4 sm:space-y-0 sm:flex sm:justify-between sm:items-center bg-gray-50 non-printable">
            <div className="text-xl font-bold">
                Total Cost: <span className="text-brand-blue">{formatCurrency(totalCost)}</span>
            </div>
            <div className="flex items-center space-x-2">
                <button onClick={onPrint} disabled={isPrinting} className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 disabled:opacity-50">
                    {isPrinting ? <LoaderCircle className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
                    Print / Export
                </button>
                <button onClick={onSave} className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light">Save Costs</button>
            </div>
        </footer>
    );
};

const CostInputRow: React.FC<{label: string, item: CostLineItem, onChange: (field: 'quantity' | 'rate', value: number) => void}> = ({ label, item, onChange }) => (
    <div className="grid grid-cols-12 gap-2 items-center">
        <label className="col-span-12 sm:col-span-5 block text-sm font-medium text-gray-700">{label}</label>
        <div className="col-span-4 sm:col-span-2"><input type="number" placeholder="Qty" value={item.quantity || ''} onChange={(e) => onChange('quantity', parseFloat(e.target.value) || 0)} className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md" step="any" min="0"/></div>
        <div className="col-span-4 sm:col-span-2"><input type="number" placeholder="Rate" value={item.rate || ''} onChange={(e) => onChange('rate', parseFloat(e.target.value) || 0)} className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md" step="any" min="0"/></div>
        <div className="col-span-4 sm:col-span-3 text-right font-medium text-lg pr-2">{formatCurrency(item.total)}</div>
    </div>
);

const LaborInputRow: React.FC<{item: LaborLineItem, onChange: (field: keyof Omit<LaborLineItem, 'id' | 'total'>, value: string | number) => void, onRemove: () => void}> = ({ item, onChange, onRemove }) => (
     <div className="grid grid-cols-12 gap-2 items-center">
        <div className="col-span-12 sm:col-span-5"><input type="text" placeholder="Labor Description" value={item.description} onChange={(e) => onChange('description', e.target.value)} className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md"/></div>
        <div className="col-span-4 sm:col-span-2"><input type="number" placeholder="Hours" value={item.hours || ''} onChange={(e) => onChange('hours', parseFloat(e.target.value) || 0)} className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md" step="any" min="0"/></div>
        <div className="col-span-4 sm:col-span-2"><input type="number" placeholder="Rate/Hr" value={item.rate || ''} onChange={(e) => onChange('rate', parseFloat(e.target.value) || 0)} className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md" step="any" min="0"/></div>
        <div className="col-span-3 sm:col-span-2 text-right font-medium text-lg pr-2">{formatCurrency(item.total)}</div>
        <div className="col-span-1 text-right"><button onClick={onRemove} className="text-red-500 hover:text-red-700 p-1 non-printable"><Trash2 className="h-5 w-5" /></button></div>
    </div>
);


export default JobCostCalculator;