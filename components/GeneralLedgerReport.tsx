import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { AccountType } from '../types';
import { Download, LoaderCircle } from 'lucide-react';
import { printDocument } from '../utils/pdfExporter';
import { formatCurrency } from '../utils/formatCurrency';


interface Transaction {
    date: string;
    details: string;
    debit: number;
    credit: number;
    type: string;
}

const GeneralLedgerReport: React.FC = () => {
    const { state } = useData();
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [isExporting, setIsExporting] = useState(false);

    const selectedAccount = useMemo(() => state.accounts.find(a => a.id === selectedAccountId), [selectedAccountId, state.accounts]);

    const handleExport = async () => {
        if (!selectedAccount) {
            alert('Please select an account to export the report.');
            return;
        }
        setIsExporting(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        await printDocument('general-ledger-report-content', `ledger-${selectedAccount?.name.replace(/\s+/g, '_')}.pdf`);
        setIsExporting(false);
    };

    const transactions = useMemo(() => {
        if (!selectedAccountId) return [];

        const allTransactions = state.journalEntries
            .flatMap(entry => entry.items.map(item => ({ ...item, date: entry.date, memo: entry.memo })))
            .filter(item => item.accountId === selectedAccountId)
            .map(item => ({
                date: item.date,
                details: item.memo || 'Journal Entry',
                debit: item.debit,
                credit: item.credit,
                type: 'Journal',
            }));
        
        const filtered = allTransactions.filter(t => 
            (!startDate || t.date >= startDate) &&
            (!endDate || t.date <= endDate)
        );

        return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    }, [selectedAccountId, startDate, endDate, state.journalEntries]);
    
    let runningBalance = selectedAccount?.openingBalance || 0;

    return (
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
                 <h2 className="text-xl font-semibold text-gray-700">General Ledger</h2>
                 <button
                    onClick={handleExport}
                    disabled={isExporting || !selectedAccountId}
                    className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
                    title={!selectedAccountId ? "Select an account to export" : "Export as PDF"}
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
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md non-printable">
                <div className="md:col-span-1">
                    <label htmlFor="account-select" className="block text-sm font-medium text-gray-700">Account</label>
                    <select
                        id="account-select"
                        value={selectedAccountId}
                        onChange={e => setSelectedAccountId(e.target.value)}
                        className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"
                    >
                        <option value="">Select an account</option>
                        {state.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                </div>
                <div>
                     <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
                     <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                     <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">End Date</label>
                     <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm" />
                </div>
            </div>

            {/* Report Table */}
            {selectedAccountId && (
                <div id="general-ledger-report-content" className="mt-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{selectedAccount?.name} Ledger</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        For period: {startDate || 'Start'} to {endDate || 'End'}
                    </p>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <tr className="bg-gray-50 font-semibold">
                                    <td colSpan={4} className="px-6 py-4">Opening Balance</td>
                                    <td className="px-6 py-4 text-right">{formatCurrency(runningBalance)}</td>
                                </tr>
                               {transactions.map((tx, index) => {
                                    const change = tx.debit - tx.credit;
                                    if (selectedAccount?.type === AccountType.Asset || selectedAccount?.type === AccountType.Expense) {
                                        runningBalance += change;
                                    } else { // Liability, Equity, Revenue
                                        runningBalance -= change; // Credits increase these accounts, debits decrease
                                    }
                                   return (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.details}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{tx.debit > 0 ? formatCurrency(tx.debit) : '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{tx.credit > 0 ? formatCurrency(tx.credit) : '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-800">{formatCurrency(runningBalance)}</td>
                                    </tr>
                               )})}
                               {transactions.length === 0 && (
                                 <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-500">No transactions for this period.</td>
                                 </tr>
                               )}
                            </tbody>
                            <tfoot className="bg-gray-100">
                                 <tr>
                                    <td colSpan={4} className="px-6 py-3 text-right text-sm font-bold text-gray-700 uppercase">Ending Balance</td>
                                    <td className="px-6 py-3 text-right text-sm font-bold text-gray-800">{formatCurrency(runningBalance)}</td>
                                 </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
            <div className="printable-footer">
                <span>General Ledger: {selectedAccount?.name || ''}</span>
                <div className="printable-footer-center"></div>
                <span>Generated on: {new Date().toLocaleDateString()}</span>
            </div>
        </div>
    );
};

export default GeneralLedgerReport;