import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { generateActionableInsight } from '../services/geminiService';
import AIResponseModal from './AIResponseModal';
import { Download, LoaderCircle, Sparkles } from 'lucide-react';
import { exportElementAsPDF } from '../utils/pdfExporter';

const ProfitAndLossReport: React.FC = () => {
    const { state } = useData();
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(1);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [isExporting, setIsExporting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [modalContent, setModalContent] = useState<string | null>(null);

    const handleExport = async () => {
        setIsExporting(true);
        await exportElementAsPDF('pnl-report-content', `Profit_And_Loss_${startDate}_to_${endDate}`);
        setIsExporting(false);
    };

    const pnlData = useMemo(() => {
        const revenue = state.invoices
            .flatMap(inv => inv.payments)
            .filter(p => p.date >= startDate && p.date <= endDate)
            .reduce((sum, p) => sum + p.amount, 0);

        const expensesByCategory: { [key: string]: number } = {};
        const expenses = state.expenses
            .filter(exp => exp.date >= startDate && exp.date <= endDate);
            
        expenses.forEach(exp => {
            const category = state.accounts.find(a => a.id === exp.debitAccountId)?.name || 'Uncategorized';
            if (!expensesByCategory[category]) {
                expensesByCategory[category] = 0;
            }
            expensesByCategory[category] += exp.amount;
        });

        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const netProfit = revenue - totalExpenses;

        return {
            revenue,
            expensesByCategory,
            totalExpenses,
            netProfit,
        };
    }, [state, startDate, endDate]);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const promptContext = {
            period: `From ${startDate} to ${endDate}`,
            totalRevenue: pnlData.revenue,
            expensesByCategory: pnlData.expensesByCategory,
            totalExpenses: pnlData.totalExpenses,
            netProfit: pnlData.netProfit,
        };
        const prompt = `Analyze this cash-basis Profit and Loss statement for a small printing business. Provide a brief summary, identify the top 3 expense categories, and suggest one specific, actionable area for potential cost savings based on the data. Keep the tone professional and helpful. Here is the data: ${JSON.stringify(promptContext)}`;

        try {
            const result = await generateActionableInsight(prompt, {}); // Context is in the prompt itself
            setModalContent(result);
        } catch (e) {
            alert("AI analysis failed. Please check your API key and try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    return (
        <>
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6" id="pnl-report-content">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-700">Profit & Loss Statement (Cash Basis)</h2>
                <div className="export-button flex items-center space-x-2">
                    {process.env.API_KEY && (
                         <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className="flex items-center bg-purple-100 text-purple-700 border border-purple-200 px-4 py-2 rounded-md hover:bg-purple-200 transition-colors disabled:opacity-50 shadow-sm"
                        >
                            {isAnalyzing ? (
                                <>
                                    <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Analyze with AI
                                </>
                            )}
                        </button>
                    )}
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
                    >
                        {isExporting ? (
                            <>
                                <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4 mr-2" />
                                Export PDF
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md">
                 <div>
                     <label htmlFor="pnl-start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
                     <input type="date" id="pnl-start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                     <label htmlFor="pnl-end-date" className="block text-sm font-medium text-gray-700">End Date</label>
                     <input type="date" id="pnl-end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm" />
                </div>
            </div>

            <div className="space-y-4">
                {/* Revenue */}
                <div className="border-b pb-2">
                    <h3 className="text-lg font-semibold text-gray-800">Revenue</h3>
                    <div className="flex justify-between items-center mt-1 text-gray-700">
                        <span>Total Income</span>
                        <span className="font-medium">${pnlData.revenue.toFixed(2)}</span>
                    </div>
                </div>

                {/* Expenses */}
                <div className="border-b pb-2">
                    <h3 className="text-lg font-semibold text-gray-800">Expenses</h3>
                    {Object.entries(pnlData.expensesByCategory).length > 0 ? (
                        Object.entries(pnlData.expensesByCategory).map(([category, amount]) => (
                             <div key={category} className="flex justify-between items-center mt-1 text-gray-700 pl-4">
                                <span>{category}</span>
                                <span>${amount.toFixed(2)}</span>
                            </div>
                        ))
                     ) : (
                        <p className="text-gray-500 pl-4 text-sm">No expenses recorded for this period.</p>
                     )}
                    <div className="flex justify-between items-center mt-2 pt-2 border-t font-semibold text-gray-800">
                        <span>Total Expenses</span>
                        <span>${pnlData.totalExpenses.toFixed(2)}</span>
                    </div>
                </div>

                {/* Net Profit */}
                <div className={`flex justify-between items-center p-4 rounded-md ${pnlData.netProfit >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <h3 className="text-xl font-bold">Net Profit</h3>
                    <span className="text-xl font-bold">${pnlData.netProfit.toFixed(2)}</span>
                </div>
            </div>
        </div>
        {modalContent && (
            <AIResponseModal 
                title="AI Profit & Loss Analysis"
                content={modalContent}
                onClose={() => setModalContent(null)}
            />
        )}
        </>
    );
};

export default ProfitAndLossReport;
