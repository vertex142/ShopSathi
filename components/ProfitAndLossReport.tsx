import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { generateActionableInsight } from '../services/geminiService';
import AIResponseModal from './AIResponseModal';
import { Download, LoaderCircle, Sparkles } from 'lucide-react';
import { printDocument } from '../utils/pdfExporter';

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
        await new Promise(resolve => setTimeout(resolve, 300));
        await printDocument('pnl-report-content', 'pnl-report.pdf');
        setIsExporting(false);
    };

    // FIX: Added an explicit return type to the useMemo hook. This ensures TypeScript correctly infers that `amount` is a number inside `expensesByCategory`, resolving the error when calling `.toFixed()`.
    const pnlData = useMemo((): {
        revenue: number;
        expensesByCategory: { [key: string]: number };
        totalExpenses: number;
        netProfit: number;
    } => {
        const revenue = state.invoices
            .flatMap(inv => inv.payments || [])
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
        const prompt = `Analyze this cash-basis Profit and Loss statement for a small printing business. Provide a brief summary, identify the top 3 expense categories, and suggest one specific, actionable area for potential cost savings based on the data. Keep the tone professional and helpful.`;

        try {
            const result = await generateActionableInsight(prompt, promptContext);
            setModalContent(result);
        } catch (e) {
            alert("AI analysis failed. Please check your API key and try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    return (
        <>
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6 printable-page">
            {/* Screen-only Header */}
            <header className="flex justify-between items-start pb-6 mb-6 border-b non-printable">
                <div className="text-center">
                    {state.settings.logo && (
                        <>
                            <img src={state.settings.logo} alt="Logo" className="h-20 w-auto max-w-[8rem] object-contain" />
                            <p className="text-sm text-gray-500 mt-2 max-w-[12rem] break-words">{state.settings.tagline}</p>
                        </>
                    )}
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold text-brand-blue">{state.settings.name}</h2>
                    <p className="text-md text-gray-600 mt-2">{state.settings.address}</p>
                    <p className="text-md text-gray-600">{state.settings.phone1}</p>
                    {state.settings.phone2 && <p className="text-md text-gray-600">{state.settings.phone2}</p>}
                    <p className="text-md text-gray-600">{state.settings.email}</p>
                </div>
            </header>
            <div className="printable-header">
                <div className="text-center">
                    {state.settings.logo && (
                        <>
                            <img src={state.settings.logo} alt="Logo" className="h-14 object-contain" />
                            <p className="text-[8pt] text-gray-600 mt-1 max-w-[15ch] leading-tight">{state.settings.tagline}</p>
                        </>
                    )}
                </div>
                <div className="text-right text-[9pt]">
                    <h2 className="text-xl font-bold text-brand-blue">{state.settings.name}</h2>
                    <p className="leading-snug">{state.settings.address}</p>
                    <p className="leading-snug">{state.settings.phone1}</p>
                    {state.settings.phone2 && <p className="leading-snug">{state.settings.phone2}</p>}
                    <p className="leading-snug">{state.settings.email}</p>
                </div>
            </div>
            <div className="flex justify-between items-center non-printable">
                <h2 className="text-xl font-semibold text-gray-700">Profit & Loss Statement (Cash Basis)</h2>
                <div className="flex items-center space-x-2">
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
                                Print / Save PDF
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div id="pnl-report-content" className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md non-printable">
                     <div>
                         <label htmlFor="pnl-start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
                         <input type="date" id="pnl-start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                         <label htmlFor="pnl-end-date" className="block text-sm font-medium text-gray-700">End Date</label>
                         <input type="date" id="pnl-end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                </div>

                <div className="text-center pt-4">
                    <h2 className="text-2xl font-bold">{state.settings.name}</h2>
                    <p className="text-lg">Profit and Loss Statement</p>
                    <p className="text-sm text-gray-600">For the period from {startDate} to {endDate}</p>
                </div>

                {/* Revenue */}
                <div className="border-b pb-2 pt-4">
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
             <div className="printable-footer">
                <span>Profit & Loss Report</span>
                <div className="printable-footer-center"></div>
                <span>Generated on: {new Date().toLocaleDateString()}</span>
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