import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { InvoiceStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Legend as PieLegend } from 'recharts';
import GeneralLedgerReport from '../components/GeneralLedgerReport';
import { Download, LoaderCircle } from 'lucide-react';
import { exportElementAsPDF } from '../utils/pdfExporter';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};


const FinancialOverview: React.FC = () => {
    const { state } = useData();
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        await exportElementAsPDF('financial-overview-report-content', 'Financial_Overview_Report');
        setIsExporting(false);
    };

    const getInvoiceTotals = (invoice: any) => {
        const subtotal = invoice.items.reduce((sum: number, item: any) => sum + item.quantity * item.rate, 0);
        const grandTotal = subtotal + (invoice.previousDue || 0) - (invoice.discount || 0);
        const totalPaid = (invoice.payments || []).reduce((sum: number, p: any) => sum + p.amount, 0);
        return { grandTotal, totalPaid };
    };

    const monthlyOverview = React.useMemo(() => {
        const months = Array.from({ length: 12 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return { month: d.toLocaleString('default', { month: 'short', year: '2-digit' }), year: d.getFullYear(), monthIndex: d.getMonth() };
        }).reverse();

        return months.map(({ month, year, monthIndex }) => {
            const income = state.invoices
                .flatMap(inv => inv.payments)
                .filter(p => new Date(p.date).getMonth() === monthIndex && new Date(p.date).getFullYear() === year)
                .reduce((sum, p) => sum + p.amount, 0);
            
            const expenses = state.expenses
                .filter(exp => new Date(exp.date).getMonth() === monthIndex && new Date(exp.date).getFullYear() === year)
                .reduce((sum, exp) => sum + exp.amount, 0);
            
            return { name: month, income, expenses };
        });
    }, [state.invoices, state.expenses]);

    const incomeByCustomer = React.useMemo(() => {
        const customerIncome: { [key: string]: number } = {};
        state.invoices.forEach(inv => {
            const customerName = state.customers.find(c => c.id === inv.customerId)?.name || 'Unknown';
            const { totalPaid } = getInvoiceTotals(inv);
            if (!customerIncome[customerName]) customerIncome[customerName] = 0;
            customerIncome[customerName] += totalPaid;
        });
        return Object.entries(customerIncome)
            .map(([name, value]) => ({ name, value }))
            .filter(item => item.value > 0)
            .sort((a,b) => b.value - a.value);

    }, [state.invoices, state.customers]);

    const expensesByCategory = React.useMemo(() => {
        const categoryExpenses: { [key: string]: number } = {};
        state.expenses.forEach(exp => {
            const category = state.accounts.find(a => a.id === exp.debitAccountId)?.name || 'Uncategorized';
            if (!categoryExpenses[category]) categoryExpenses[category] = 0;
            categoryExpenses[category] += exp.amount;
        });
        return Object.entries(categoryExpenses)
            .map(([name, value]) => ({ name, value }))
            .filter(item => item.value > 0)
            .sort((a,b) => b.value - a.value);

    }, [state.expenses, state.accounts]);

    const invoiceStatusData = React.useMemo(() => {
        const statusCounts: { [key: string]: number } = {
            [InvoiceStatus.Draft]: 0,
            [InvoiceStatus.Sent]: 0,
            [InvoiceStatus.PartiallyPaid]: 0,
            [InvoiceStatus.Paid]: 0,
            [InvoiceStatus.Overdue]: 0,
        };
        state.invoices.forEach(inv => {
            statusCounts[inv.status]++;
        });
        return Object.entries(statusCounts)
            .map(([name, value]) => ({ name, value }))
            .filter(item => item.value > 0);
    }, [state.invoices]);


    return (
        <div className="space-y-6">
            <div id="financial-overview-report-content" className="space-y-8">
                 <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-md">
                     <h2 className="text-xl font-semibold text-gray-700">Financial Overview Report</h2>
                     <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="export-button flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
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
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">12-Month Financial Overview</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyOverview}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                            <Legend />
                            <Bar dataKey="income" fill="#4ade80" name="Income" />
                            <Bar dataKey="expenses" fill="#f87171" name="Expenses" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Income by Customer</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={incomeByCustomer} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" labelLine={false} label={CustomPieLabel}>
                                    {incomeByCustomer.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                <PieLegend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Expenses by Category</h3>
                         <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={expensesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#82ca9d" label>
                                    {expensesByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                <PieLegend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                     <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Invoice Status Overview</h3>
                         <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={invoiceStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#ffc658" paddingAngle={5}>
                                    {invoiceStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                                <PieLegend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ReportsPage: React.FC = React.memo(() => {
    const [activeTab, setActiveTab] = useState<'overview' | 'ledger'>('overview');

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`${activeTab === 'overview' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Financial Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('ledger')}
                        className={`${activeTab === 'ledger' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        General Ledger
                    </button>
                </nav>
            </div>

            <div>
                {activeTab === 'overview' && <FinancialOverview />}
                {activeTab === 'ledger' && <GeneralLedgerReport />}
            </div>
        </div>
    );
});

export default ReportsPage;