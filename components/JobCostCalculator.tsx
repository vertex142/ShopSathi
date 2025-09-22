

import React, { useState, useMemo, useEffect } from 'react';
import { JobCostBreakdown, OldJobCostBreakdown, CostLineItem, OtherExpenseLineItem } from '../types';
import { Trash2, X, Printer, LoaderCircle } from 'lucide-react';
import { exportElementAsPDF } from '../utils/pdfExporter';

interface JobCostCalculatorProps {
  initialCosts: JobCostBreakdown | OldJobCostBreakdown | undefined;
  onSave: (costs: JobCostBreakdown, total: number) => void;
  onClose: () => void;
}

const isNewCostBreakdown = (breakdown: any): breakdown is JobCostBreakdown => {
    return breakdown && typeof breakdown.paper === 'object' && breakdown.paper !== null;
};

// Helper to convert old cost format to new format
const convertOldToNew = (oldCosts: OldJobCostBreakdown): JobCostBreakdown => {
    const defaultLineItem = { quantity: 1, rate: 0, total: 0 };
    return {
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

const JobCostCalculator: React.FC<JobCostCalculatorProps> = ({ initialCosts, onSave, onClose }) => {
  const [costs, setCosts] = useState<JobCostBreakdown>({
    paper: { quantity: 1, rate: 0, total: 0 },
    ctp: { quantity: 1, rate: 0, total: 0 },
    printing: { quantity: 1, rate: 0, total: 0 },
    binding: { quantity: 1, rate: 0, total: 0 },
    delivery: { quantity: 1, rate: 0, total: 0 },
    otherExpenses: [],
  });
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (initialCosts) {
      if (isNewCostBreakdown(initialCosts)) {
        setCosts(initialCosts);
      } else {
        setCosts(convertOldToNew(initialCosts as OldJobCostBreakdown));
      }
    }
  }, [initialCosts]);

  const handleStandardChange = (name: keyof Omit<JobCostBreakdown, 'otherExpenses'>, field: 'quantity' | 'rate', value: number) => {
    setCosts(prev => {
        const item = prev[name];
        const newQuantity = field === 'quantity' ? value : item.quantity;
        const newRate = field === 'rate' ? value : item.rate;
        return {
            ...prev,
            [name]: {
                quantity: newQuantity,
                rate: newRate,
                total: newQuantity * newRate,
            }
        };
    });
  };

  const handleOtherExpenseChange = (index: number, field: 'description' | 'quantity' | 'rate', value: string | number) => {
    const newOtherExpenses = [...costs.otherExpenses];
    const item = newOtherExpenses[index];
    const newDesc = field === 'description' ? String(value) : item.description;
    const newQuantity = field === 'quantity' ? Number(value) : item.quantity;
    const newRate = field === 'rate' ? Number(value) : item.rate;

    newOtherExpenses[index] = {
      ...item,
      description: newDesc,
      quantity: newQuantity,
      rate: newRate,
      total: newQuantity * newRate,
    };
    setCosts(prev => ({ ...prev, otherExpenses: newOtherExpenses }));
  };
  
  const addOtherExpense = () => {
    setCosts(prev => ({
      ...prev,
      otherExpenses: [...prev.otherExpenses, { id: crypto.randomUUID(), description: '', quantity: 1, rate: 0, total: 0 }],
    }));
  };

  const removeOtherExpense = (index: number) => {
    setCosts(prev => ({
      ...prev,
      otherExpenses: prev.otherExpenses.filter((_, i) => i !== index),
    }));
  };

  const totalCost = useMemo(() => {
    const standardCosts = costs.paper.total + costs.ctp.total + costs.printing.total + costs.binding.total + costs.delivery.total;
    const otherCosts = costs.otherExpenses.reduce((sum, expense) => sum + (expense.total || 0), 0);
    return standardCosts + otherCosts;
  }, [costs]);

  const handleSave = () => {
    onSave(costs, totalCost);
    onClose();
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    await exportElementAsPDF('job-cost-sheet', 'Job_Cost_Sheet');
    setIsPrinting(false);
  };

  const costItems: { label: string, name: keyof Omit<JobCostBreakdown, 'otherExpenses'> }[] = [
      { label: 'Paper Cost', name: 'paper' },
      { label: 'CTP / Plate Cost', name: 'ctp' },
      { label: 'Printing Cost', name: 'printing' },
      { label: 'Binding Cost', name: 'binding' },
      { label: 'Delivery Cost', name: 'delivery' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <header className="flex-shrink-0 flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold">Job Cost Calculator</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        </header>
        <main id="job-cost-sheet" className="flex-grow overflow-y-auto p-6 space-y-6">
            <div className="space-y-4">
                {costItems.map(({ label, name }) => (
                     <CostInputRow 
                        key={name}
                        label={label} 
                        item={costs[name]}
                        onChange={(field, value) => handleStandardChange(name, field, value)}
                    />
                ))}
            </div>

            <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Other Expenses</h3>
                <div className="space-y-3">
                    {costs.otherExpenses.map((expense, index) => (
                        <div key={expense.id} className="grid grid-cols-12 gap-2 items-center">
                           <div className="col-span-12 sm:col-span-5">
                                <input
                                    type="text"
                                    placeholder="Expense Description"
                                    value={expense.description}
                                    onChange={(e) => handleOtherExpenseChange(index, 'description', e.target.value)}
                                    className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md"
                                />
                            </div>
                           <div className="col-span-4 sm:col-span-2">
                                <input
                                    type="number"
                                    placeholder="Qty"
                                    value={expense.quantity || ''}
                                    onChange={(e) => handleOtherExpenseChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                    className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md"
                                />
                            </div>
                           <div className="col-span-4 sm:col-span-2">
                                <input
                                    type="number"
                                    placeholder="Rate"
                                    value={expense.rate || ''}
                                    onChange={(e) => handleOtherExpenseChange(index, 'rate', parseFloat(e.target.value) || 0)}
                                    className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md"
                                />
                            </div>
                           <div className="col-span-3 sm:col-span-2 text-right font-medium pr-2">
                               ${expense.total.toFixed(2)}
                           </div>
                            <div className="col-span-1 flex justify-end">
                                <button onClick={() => removeOtherExpense(index)} className="text-red-500 hover:text-red-700 p-1">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                 <button onClick={addOtherExpense} className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    + Add Other Expense
                </button>
            </div>
        </main>
        <footer className="flex-shrink-0 mt-auto p-6 border-t space-y-4 sm:space-y-0 sm:flex sm:justify-between sm:items-center bg-gray-50">
            <div className="text-xl font-bold">
                Total Estimated Cost: <span className="text-brand-blue">${totalCost.toFixed(2)}</span>
            </div>
            <div className="flex items-center space-x-2">
                <button
                    onClick={handlePrint}
                    disabled={isPrinting}
                    className="export-button flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                    {isPrinting ? <LoaderCircle className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
                    Print / Export PDF
                </button>
                <button onClick={handleSave} className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light">Save Costs</button>
            </div>
        </footer>
      </div>
    </div>
  );
};

interface CostInputRowProps {
    label: string;
    item: CostLineItem;
    onChange: (field: 'quantity' | 'rate', value: number) => void;
}

const CostInputRow: React.FC<CostInputRowProps> = ({ label, item, onChange }) => (
    <div className="grid grid-cols-12 gap-2 items-center">
        <label className="col-span-12 sm:col-span-5 block text-sm font-medium text-gray-700">{label}</label>
        <div className="col-span-4 sm:col-span-2">
             <input
                type="number"
                placeholder="Qty"
                value={item.quantity || ''}
                onChange={(e) => onChange('quantity', parseFloat(e.target.value) || 0)}
                className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md"
                step="any" min="0"
            />
        </div>
        <div className="col-span-4 sm:col-span-2">
             <input
                type="number"
                placeholder="Rate"
                value={item.rate || ''}
                onChange={(e) => onChange('rate', parseFloat(e.target.value) || 0)}
                className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md"
                step="any" min="0"
            />
        </div>
         <div className="col-span-4 sm:col-span-3 text-right font-medium text-lg pr-2">
            ${item.total.toFixed(2)}
        </div>
    </div>
);

export default JobCostCalculator;
