import React, { useMemo } from 'react';
import StatCard from '../components/StatCard';
import { useData } from '../context/DataContext';
import { Invoice, InvoiceStatus, Expense, Page } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import GreetingCard from '../components/GreetingCard';
import QuickActions from '../components/QuickActions';
import AIActions from '../components/AIActions';
import { CircleDollarSign, Clock, TrendingDown, Users, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

interface DashboardPageProps {
  setCurrentPage: (page: Page) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = React.memo(({ setCurrentPage }) => {
  const { state } = useData();

  const getInvoiceTotals = (invoice: Invoice) => {
    const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const grandTotal = subtotal + (invoice.previousDue || 0) - (invoice.discount || 0);
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = grandTotal - totalPaid;
    return { grandTotal, totalPaid, balanceDue };
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const totalIncomeThisMonth = state.invoices
    .flatMap(inv => inv.payments)
    .filter(p => new Date(p.date).getMonth() === currentMonth && new Date(p.date).getFullYear() === currentYear)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalDues = state.invoices
    .filter(inv => inv.status !== InvoiceStatus.Paid && inv.status !== InvoiceStatus.Draft)
    .reduce((sum, inv) => sum + getInvoiceTotals(inv).balanceDue, 0);

  const totalExpensesThisMonth = state.expenses
    .filter(exp => new Date(exp.date).getMonth() === currentMonth && new Date(exp.date).getFullYear() === currentYear)
    .reduce((sum, exp) => sum + exp.amount, 0);
    
  const lowStockItems = state.inventoryItems ? state.inventoryItems.filter(item => item.stockQuantity <= item.reorderLevel).length : 0;
    
  const chartData = useMemo(() => {
    const months = Array.from({length: 6}, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return { 
            month: d.toLocaleString('default', { month: 'short' }), 
            year: d.getFullYear(),
            monthIndex: d.getMonth()
        };
    }).reverse();

    return months.map(({month, year, monthIndex}) => {
        const income = state.invoices
            .flatMap(inv => inv.payments)
            .filter(p => {
                const paymentDate = new Date(p.date);
                // Adjust for timezone offset by using UTC methods
                const paymentMonth = new Date(paymentDate.getUTCFullYear(), paymentDate.getUTCMonth(), paymentDate.getUTCDate()).getMonth();
                const paymentYear = new Date(paymentDate.getUTCFullYear(), paymentDate.getUTCMonth(), paymentDate.getUTCDate()).getFullYear();
                return paymentMonth === monthIndex && paymentYear === year;
            })
            .reduce((sum, p) => sum + p.amount, 0);
        
        const expenses = state.expenses
            .filter(exp => {
                 const expenseDate = new Date(exp.date);
                 // Adjust for timezone offset by using UTC methods
                 const expenseMonth = new Date(expenseDate.getUTCFullYear(), expenseDate.getUTCMonth(), expenseDate.getUTCDate()).getMonth();
                 const expenseYear = new Date(expenseDate.getUTCFullYear(), expenseDate.getUTCMonth(), expenseDate.getUTCDate()).getFullYear();
                 return expenseMonth === monthIndex && expenseYear === year;
            })
            .reduce((sum, exp) => sum + exp.amount, 0);
        
        return { name: month, income, expenses };
    });
  }, [state.invoices, state.expenses]);

  const Avatar: React.FC<{ name: string }> = ({ name }) => {
      const initial = name ? name.charAt(0).toUpperCase() : '?';
      const colors = ['bg-blue-200 dark:bg-blue-800', 'bg-green-200 dark:bg-green-800', 'bg-yellow-200 dark:bg-yellow-800', 'bg-purple-200 dark:bg-purple-800', 'bg-red-200 dark:bg-red-800'];
      const color = colors[name.charCodeAt(0) % colors.length];
      return <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color} text-gray-700 dark:text-gray-200 font-bold`}>{initial}</div>;
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content Area */}
      <div className="lg:col-span-2 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <GreetingCard />
          </div>
          <div className="md:col-span-1">
            <QuickActions setCurrentPage={setCurrentPage} />
          </div>
        </div>
        
        {process.env.API_KEY && <AIActions />}

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Last 6 Months Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" />
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Area type="monotone" dataKey="income" stroke="#4ade80" fillOpacity={1} fill="url(#colorIncome)" />
              <Area type="monotone" dataKey="expenses" stroke="#f87171" fillOpacity={1} fill="url(#colorExpenses)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
           <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Recent Invoices</h2>
            <ul className="space-y-4">
                {state.invoices.slice(0, 5).map(inv => {
                    const customer = state.customers.find(c => c.id === inv.customerId);
                    return (
                        <li key={inv.id} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors">
                            <div className="flex items-center space-x-4">
                                <Avatar name={customer?.name || '?'} />
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-100">{inv.invoiceNumber}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{customer?.name || 'Unknown Customer'}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-lg text-gray-900 dark:text-white">{formatCurrency(getInvoiceTotals(inv).grandTotal)}</p>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    inv.status === InvoiceStatus.Paid ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                    inv.status === InvoiceStatus.PartiallyPaid ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                    inv.status === InvoiceStatus.Sent ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                    inv.status === InvoiceStatus.Overdue ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                }`}>{inv.status}</span>
                            </div>
                        </li>
                    )
                })}
                 {state.invoices.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-center py-4">No invoices yet.</p>}
            </ul>
        </div>
      </div>

      {/* Sidebar with Stats */}
      <div className="lg:col-span-1 space-y-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">This Month</h3>
            <div className="space-y-4">
                <StatCard title="Income" value={formatCurrency(totalIncomeThisMonth)} IconComponent={CircleDollarSign} color="green" />
                <StatCard title="Expenses" value={formatCurrency(totalExpensesThisMonth)} IconComponent={TrendingDown} color="red" />
            </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Overall</h3>
            <div className="space-y-4">
                <StatCard title="Total Dues" value={formatCurrency(totalDues)} IconComponent={Clock} color="yellow" />
                <StatCard title="Total Customers" value={state.customers.length.toString()} IconComponent={Users} color="blue" />
                <StatCard title="Low Stock Items" value={lowStockItems.toString()} IconComponent={AlertTriangle} color="orange" />
            </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
           <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Recent Expenses</h2>
            <ul className="space-y-4">
                {state.expenses.slice(0, 5).map(exp => {
                    const expenseAccount = state.accounts.find(a => a.id === exp.debitAccountId);
                    return (
                         <li key={exp.id} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 text-red-600 dark:bg-red-800/50 dark:text-red-300">
                                    <TrendingDown className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-100">{expenseAccount?.name || 'Uncategorized'}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[150px] truncate">{exp.description}</p>
                                </div>
                            </div>
                            <p className="font-semibold text-lg text-red-600 dark:text-red-400">-{formatCurrency(exp.amount)}</p>
                        </li>
                    );
                })}
                {state.expenses.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-center py-4">No expenses recorded yet.</p>}
            </ul>
        </div>
      </div>
    </div>
  );
});

export default DashboardPage;