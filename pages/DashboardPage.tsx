import React from 'react';
import StatCard from '../components/StatCard';
import { useData } from '../context/DataContext';
import { Invoice, InvoiceStatus, Expense, InvoiceItem, Payment, Page } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import GreetingCard from '../components/GreetingCard';
import QuickActions from '../components/QuickActions';
import AIActions from '../components/AIActions';
import { CircleDollarSign, Clock, TrendingDown, Users, AlertTriangle } from 'lucide-react';

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
    
  const getMonthlyData = () => {
    const months = Array.from({length: 6}, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return { month: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear() };
    }).reverse();

    return months.map(({month, year}) => {
        const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
        const income = state.invoices
            .flatMap(inv => inv.payments)
            .filter(p => new Date(p.date).getMonth() === monthIndex && new Date(p.date).getFullYear() === year)
            .reduce((sum, p) => sum + p.amount, 0);
        
        const expenses = state.expenses
            .filter(exp => new Date(exp.date).getMonth() === monthIndex && new Date(exp.date).getFullYear() === year)
            .reduce((sum, exp) => sum + exp.amount, 0);
        
        return { name: month, income, expenses };
    });
  };

  const chartData = getMonthlyData();


  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <GreetingCard companyName={state.settings.name} />
        </div>
        <div className="lg:col-span-1">
            <QuickActions setCurrentPage={setCurrentPage} />
        </div>
      </div>
      
      {process.env.API_KEY && <AIActions />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Income (This Month)" value={`$${totalIncomeThisMonth.toFixed(2)}`} IconComponent={CircleDollarSign} color="bg-green-500" />
        <StatCard title="Total Dues" value={`$${totalDues.toFixed(2)}`} IconComponent={Clock} color="bg-yellow-500" />
        <StatCard title="Expenses (This Month)" value={`$${totalExpensesThisMonth.toFixed(2)}`} IconComponent={TrendingDown} color="bg-red-500" />
        <StatCard title="Total Customers" value={state.customers.length.toString()} IconComponent={Users} color="bg-blue-500" />
        <StatCard title="Low Stock Items" value={lowStockItems.toString()} IconComponent={AlertTriangle} color="bg-orange-500" />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Last 6 Months Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="#4ade80" name="Income" />
                <Bar dataKey="expenses" fill="#f87171" name="Expenses" />
            </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
           <h2 className="text-xl font-semibold text-gray-700 mb-4">Recent Invoices</h2>
            <ul className="space-y-3">
                {state.invoices.slice(0, 5).map(inv => {
                    const customer = state.customers.find(c => c.id === inv.customerId);
                    return (
                        <li key={inv.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                            <div>
                                <p className="font-semibold text-gray-800">{inv.invoiceNumber}</p>
                                <p className="text-sm text-gray-500">{customer?.name || 'Unknown Customer'}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-lg text-gray-900">${getInvoiceTotals(inv).grandTotal.toFixed(2)}</p>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    inv.status === InvoiceStatus.Paid ? 'bg-green-100 text-green-800' :
                                    inv.status === InvoiceStatus.PartiallyPaid ? 'bg-yellow-100 text-yellow-800' :
                                    inv.status === InvoiceStatus.Sent ? 'bg-blue-100 text-blue-800' :
                                    inv.status === InvoiceStatus.Overdue ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                }`}>{inv.status}</span>
                            </div>
                        </li>
                    )
                })}
                 {state.invoices.length === 0 && <p className="text-gray-500 text-center py-4">No invoices yet.</p>}
            </ul>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
           <h2 className="text-xl font-semibold text-gray-700 mb-4">Recent Expenses</h2>
            <ul className="space-y-3">
                {state.expenses.slice(0, 5).map(exp => {
                    const expenseAccount = state.accounts.find(a => a.id === exp.debitAccountId);
                    return (
                        <li key={exp.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                            <div>
                                <p className="font-semibold text-gray-800">{expenseAccount?.name || 'Uncategorized'}</p>
                                <p className="text-sm text-gray-500">{exp.description}</p>
                            </div>
                            <p className="font-semibold text-lg text-red-600">-${exp.amount.toFixed(2)}</p>
                        </li>
                    );
                })}
                {state.expenses.length === 0 && <p className="text-gray-500 text-center py-4">No expenses recorded yet.</p>}
            </ul>
        </div>
      </div>
    </div>
  );
});

export default DashboardPage;
