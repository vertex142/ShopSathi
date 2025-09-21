import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { InvoiceStatus, AccountType } from '../types';
import { Download, LoaderCircle } from 'lucide-react';
import { exportElementAsPDF } from '../utils/pdfExporter';


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

    const handleExport = async () => {
        if (!selectedAccountId) {
            alert('Please select an account to export the report.');
            return;
        }
        setIsExporting(true);
        const accountName = state.accounts.find(a => a.id === selectedAccountId)?.name || 'Ledger';
        const fileName = `General_Ledger_${accountName.replace(/\s/g, '_')}`;
        await exportElementAsPDF('general-ledger-report-content', fileName);
        setIsExporting(false);
    };

    const getInvoiceTotals = (invoice: any) => {
        const subtotal = invoice.items.reduce((sum: number, item: any) => sum + item.quantity * item.rate, 0);
        return subtotal + (invoice.previousDue || 0) - (invoice.discount || 0);
    };

    const transactions = useMemo(() => {
        if (!selectedAccountId) return [];

        let allTransactions: Transaction[] = [];

        // Invoices (Debit to Accounts Receivable, Credit to Sales Revenue)
        if (selectedAccountId === 'asset-ar' || selectedAccountId === 'revenue-sales') {
            state.invoices.forEach(inv => {
                if (inv.status !== InvoiceStatus.Draft) {
                    const total = getInvoiceTotals(inv);
                    if (selectedAccountId === 'asset-ar') {
                        allTransactions.push({ date: inv.issueDate, details: `Invoice #${inv.invoiceNumber} to ${state.customers.find(c => c.id === inv.customerId)?.name}`, debit: total, credit: 0, type: 'Invoice' });
                    }
                    if (selectedAccountId === 'revenue-sales') {
                        allTransactions.push({ date: inv.issueDate, details: `Sale to ${state.customers.find(c => c.id === inv.customerId)?.name}`, debit: 0, credit: total, type: 'Sale' });
                    }
                }
            });
        }
        
        // Payments (Debit to Cash/Bank, Credit to Accounts Receivable)
        state.invoices.forEach(inv => {
            (inv.payments || []).forEach(p => {
                // For now, assuming all payments go to cash. A more complex system would specify the asset account.
                if (selectedAccountId === 'asset-cash') {
                    allTransactions.push({ date: p.date, details: `Payment from ${state.customers.find(c => c.id === inv.customerId)?.name}`, debit: p.amount, credit: 0, type: 'Payment' });
                }
                if (selectedAccountId === 'asset-ar') {
                    allTransactions.push({ date: p.date, details: `Payment for #${inv.invoiceNumber}`, debit: 0, credit: p.amount, type: 'Payment' });
                }
            });
        });

        // Expenses
        state.expenses.forEach(exp => {
            if (exp.debitAccountId === selectedAccountId) {
                 allTransactions.push({ date: exp.date, details: exp.description, debit: exp.amount, credit: 0, type: 'Expense' });
            }
             if (exp.creditAccountId === selectedAccountId) {
                 allTransactions.push({ date: exp.date, details: exp.description, debit: 0, credit: exp.amount, type: 'Expense' });
            }
        });

        // Journal Entries
        state.journalEntries.forEach(entry => {
            entry.items.forEach(item => {
                if (item.accountId === selectedAccountId) {
                    allTransactions.push({ date: entry.date, details: entry.memo, debit: item.debit, credit: item.credit, type: 'Journal' });
                }
            });
        });
        
        const filtered = allTransactions.filter(t => 
            (!startDate || t.date >= startDate) &&
            (!endDate || t.date <= endDate)
        );

        return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    }, [selectedAccountId, startDate, endDate, state]);
    
    const selectedAccount = state.accounts.find(a => a.id === selectedAccountId);

    // This calculates a running balance for the selected period only, starting from zero.
    // For a true ledger, a starting balance calculated up to the start date would be needed.
    let runningBalance = 0;


    return (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6" id="general-ledger-report-content">
             <div className="flex justify-between items-center">
                 <h2 className="text-xl font-semibold text-gray-700">General Ledger</h2>
                 <button
                    onClick={handleExport}
                    disabled={isExporting || !selectedAccountId}
                    className="export-button flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
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
                            Export PDF
                        </>
                    )}
                </button>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md">
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
                <div className="overflow-x-auto mt-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{selectedAccount?.name} Ledger</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        For period: {startDate || 'Start'} to {endDate || 'End'}
                    </p>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Running Balance</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                           {transactions.map((tx, index) => {
                                const change = tx.debit - tx.credit;
                                if (selectedAccount?.type === AccountType.Asset || selectedAccount?.type === AccountType.Expense) {
                                    runningBalance += change;
                                } else {
                                    runningBalance -= change;
                                }
                               return (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.details}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{tx.debit > 0 ? `$${tx.debit.toFixed(2)}` : '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{tx.credit > 0 ? `$${tx.credit.toFixed(2)}` : '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-800">${runningBalance.toFixed(2)}</td>
                                </tr>
                           )})}
                           {transactions.length === 0 && (
                             <tr>
                                <td colSpan={6} className="text-center py-10 text-gray-500">No transactions for this period.</td>
                             </tr>
                           )}
                        </tbody>
                        <tfoot className="bg-gray-100">
                             <tr>
                                <td colSpan={5} className="px-6 py-3 text-right text-sm font-bold text-gray-700 uppercase">Ending Balance</td>
                                <td className="px-6 py-3 text-right text-sm font-bold text-gray-800">${runningBalance.toFixed(2)}</td>
                             </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
};

export default GeneralLedgerReport;