import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { AccountType } from '../types';
import { Download, LoaderCircle } from 'lucide-react';
import { printDocument } from '../utils/pdfExporter';
import { formatCurrency } from '../utils/formatCurrency';

const BalanceSheetReport: React.FC = () => {
    const { state } = useData();
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        await printDocument('balance-sheet-report-content', `balance-sheet-${asOfDate}.pdf`);
        setIsExporting(false);
    };

    const reportData = useMemo(() => {
        const accountBalances: { [id: string]: number } = {};
        state.accounts.forEach(acc => {
            accountBalances[acc.id] = acc.openingBalance;
        });

        const relevantJournalEntries = state.journalEntries.filter(je => je.date <= asOfDate);

        relevantJournalEntries.forEach(entry => {
            entry.items.forEach(item => {
                if (accountBalances[item.accountId] !== undefined) {
                    accountBalances[item.accountId] += (item.debit - item.credit);
                }
            });
        });

        // Calculate Net Income for the current fiscal year up to asOfDate
        const fiscalYearStart = new Date(new Date(asOfDate).getFullYear(), 0, 1).toISOString().split('T')[0];
        
        let totalRevenue = 0;
        let totalExpenses = 0;

        const periodJournalEntries = state.journalEntries.filter(je => je.date >= fiscalYearStart && je.date <= asOfDate);

        periodJournalEntries.forEach(entry => {
            entry.items.forEach(item => {
                const account = state.accounts.find(a => a.id === item.accountId);
                if (account) {
                    if (account.type === AccountType.Revenue) {
                        totalRevenue += (item.credit - item.debit);
                    } else if (account.type === AccountType.Expense) {
                        totalExpenses += (item.debit - item.credit);
                    }
                }
            });
        });

        const netIncome = totalRevenue - totalExpenses;

        const assets = state.accounts
            .filter(acc => acc.type === AccountType.Asset)
            .map(acc => ({ name: acc.name, balance: accountBalances[acc.id] }))
            .filter(acc => acc.balance !== 0);
        
        const liabilities = state.accounts
            .filter(acc => acc.type === AccountType.Liability)
            .map(acc => ({ name: acc.name, balance: -accountBalances[acc.id] }))
            .filter(acc => acc.balance !== 0);
            
        const equity = state.accounts
            .filter(acc => acc.type === AccountType.Equity)
            .map(acc => ({ name: acc.name, balance: -accountBalances[acc.id] }))
            .filter(acc => acc.balance !== 0);

        const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
        const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.balance, 0);
        const totalEquity = equity.reduce((sum, acc) => sum + acc.balance, 0) + netIncome;
        
        const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

        return {
            assets,
            liabilities,
            equity,
            netIncome,
            totalAssets,
            totalLiabilities,
            totalEquity,
            totalLiabilitiesAndEquity,
        };

    }, [state.accounts, state.journalEntries, asOfDate]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6 printable-page">
            <div className="printable-header" dangerouslySetInnerHTML={{ __html: state.settings.headerSVG }} />
            
            <div className="flex justify-between items-center non-printable">
                 <h2 className="text-xl font-semibold text-gray-700">Balance Sheet</h2>
                 <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
                >
                    {isExporting ? <LoaderCircle className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    Print / Save PDF
                </button>
            </div>
            
            <div id="balance-sheet-report-content" className="space-y-4">
                 <div className="p-4 border rounded-md non-printable">
                    <label htmlFor="as-of-date" className="block text-sm font-medium text-gray-700">As of Date</label>
                    <input type="date" id="as-of-date" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} className="mt-1 block w-full md:w-1/3 p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm" />
                </div>

                <div className="text-center pt-4">
                    <h2 className="text-2xl font-bold">{state.settings.name}</h2>
                    <p className="text-lg">Balance Sheet</p>
                    <p className="text-sm text-gray-600">As of {asOfDate}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                    {/* Assets */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-800 border-b-2 pb-2">Assets</h3>
                        {reportData.assets.map(acc => (
                            <div key={acc.name} className="flex justify-between items-center text-gray-700">
                                <span>{acc.name}</span>
                                <span className="font-medium">{formatCurrency(acc.balance)}</span>
                            </div>
                        ))}
                         <div className="flex justify-between items-center pt-2 border-t-2 font-bold text-lg text-gray-900">
                            <span>Total Assets</span>
                            <span>{formatCurrency(reportData.totalAssets)}</span>
                        </div>
                    </div>

                    {/* Liabilities & Equity */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-800 border-b-2 pb-2">Liabilities & Equity</h3>
                        
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Liabilities</h4>
                            {reportData.liabilities.map(acc => (
                                <div key={acc.name} className="flex justify-between items-center text-gray-700">
                                    <span>{acc.name}</span>
                                    <span className="font-medium">{formatCurrency(acc.balance)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center pt-1 border-t mt-1 font-semibold text-gray-800">
                                <span>Total Liabilities</span>
                                <span>{formatCurrency(reportData.totalLiabilities)}</span>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-700 mt-4 mb-2">Equity</h4>
                            {reportData.equity.map(acc => (
                                <div key={acc.name} className="flex justify-between items-center text-gray-700">
                                    <span>{acc.name}</span>
                                    <span className="font-medium">{formatCurrency(acc.balance)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center text-gray-700">
                                <span>Net Income</span>
                                <span className="font-medium">{formatCurrency(reportData.netIncome)}</span>
                            </div>
                             <div className="flex justify-between items-center pt-1 border-t mt-1 font-semibold text-gray-800">
                                <span>Total Equity</span>
                                <span>{formatCurrency(reportData.totalEquity)}</span>
                            </div>
                        </div>

                         <div className="flex justify-between items-center pt-2 border-t-2 font-bold text-lg text-gray-900">
                            <span>Total Liabilities & Equity</span>
                            <span>{formatCurrency(reportData.totalLiabilitiesAndEquity)}</span>
                        </div>
                    </div>
                </div>

            </div>

             <div className="printable-footer">
                <span>Balance Sheet</span>
                <div className="printable-footer-center"></div>
                <span>As of: {asOfDate}</span>
            </div>
        </div>
    );
};

export default BalanceSheetReport;
