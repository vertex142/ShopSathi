import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Invoice, InvoiceStatus } from '../types';
import { Download, LoaderCircle, ArrowDownUp } from 'lucide-react';
import { printDocument } from '../utils/pdfExporter';
import { formatCurrency } from '../utils/formatCurrency';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type CustomerSale = { customerId: string; name: string; invoiceCount: number; totalBilled: number; };
type ItemSale = { name: string; quantitySold: number; totalRevenue: number; };
type SortKey<T> = keyof T;
type SortDirection = 'asc' | 'desc';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#FF6666', '#66CCCC', '#CC99FF', '#FFCC66'];

const SalesReport: React.FC = () => {
    const { state } = useData();
    const [view, setView] = useState<'customer' | 'item'>('customer');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [isExporting, setIsExporting] = useState(false);
    
    const [customerSort, setCustomerSort] = useState<{ key: SortKey<CustomerSale>, dir: SortDirection }>({ key: 'totalBilled', dir: 'desc' });
    const [itemSort, setItemSort] = useState<{ key: SortKey<ItemSale>, dir: 'asc' | 'desc' }>({ key: 'totalRevenue', dir: 'desc' });

    const handleExport = async () => {
        setIsExporting(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        await printDocument('sales-report-content', `sales-report-${view}.pdf`);
        setIsExporting(false);
    };

    const reportData = useMemo(() => {
        const relevantInvoices = state.invoices.filter(inv => 
            inv.status !== InvoiceStatus.Draft &&
            inv.status !== InvoiceStatus.Credited &&
            (!startDate || inv.issueDate >= startDate) &&
            (!endDate || inv.issueDate <= endDate)
        );

        // Sales by Customer
        const customerSalesMap = new Map<string, { name: string; invoiceCount: number; totalBilled: number; }>();
        relevantInvoices.forEach(inv => {
            const customer = state.customers.find(c => c.id === inv.customerId);
            if (!customer) return;

            const subtotal = inv.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
            const grandTotal = subtotal + (inv.previousDue || 0) - (inv.discount || 0) + (inv.taxAmount || 0);

            const current = customerSalesMap.get(customer.id) || { name: customer.name, invoiceCount: 0, totalBilled: 0 };
            current.invoiceCount += 1;
            current.totalBilled += grandTotal;
            customerSalesMap.set(customer.id, current);
        });
        const customers = Array.from(customerSalesMap.entries()).map(([customerId, data]) => ({ customerId, ...data }));

        // Sales by Item
        const itemSalesMap = new Map<string, { quantitySold: number; totalRevenue: number; }>();
        relevantInvoices.forEach(inv => {
            inv.items.forEach(item => {
                const current = itemSalesMap.get(item.name) || { quantitySold: 0, totalRevenue: 0 };
                current.quantitySold += item.quantity;
                current.totalRevenue += item.quantity * item.rate;
                itemSalesMap.set(item.name, current);
            });
        });
        const items = Array.from(itemSalesMap.entries()).map(([name, data]) => ({ name, ...data }));

        return { customers, items };

    }, [state.invoices, state.customers, startDate, endDate]);

    const sortedCustomers = useMemo(() => {
        return [...reportData.customers].sort((a, b) => {
            const key = customerSort.key;
            if (a[key] < b[key]) return customerSort.dir === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return customerSort.dir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [reportData.customers, customerSort]);

    const sortedItems = useMemo(() => {
        return [...reportData.items].sort((a, b) => {
            const key = itemSort.key;
            if (a[key] < b[key]) return itemSort.dir === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return itemSort.dir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [reportData.items, itemSort]);
    
    const handleSort = <T,>(key: keyof T, currentSort: { key: keyof T, dir: SortDirection }, setSort: React.Dispatch<React.SetStateAction<{key: keyof T, dir: SortDirection}>>) => {
        const dir = currentSort.key === key && currentSort.dir === 'desc' ? 'asc' : 'desc';
        setSort({ key, dir });
    };
    
    const SortableHeader = <T,>({ label, sortKey, currentSort, setSort }: {label: string, sortKey: keyof T, currentSort: {key: keyof T, dir: SortDirection}, setSort: any}) => (
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort(sortKey, currentSort, setSort)}>
            <div className="flex items-center">
                {label}
                {currentSort.key === sortKey && <ArrowDownUp className="h-3 w-3 ml-2" />}
            </div>
        </th>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6 printable-page">
             <div className="printable-header" dangerouslySetInnerHTML={{ __html: state.settings.headerSVG }} />
            
             <div className="flex justify-between items-center non-printable">
                 <h2 className="text-xl font-semibold text-gray-700">Sales Report</h2>
                 <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
                >
                    {isExporting ? <LoaderCircle className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    Print / Save PDF
                </button>
            </div>
            
            <div id="sales-report-content" className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md non-printable">
                     <div>
                         <label htmlFor="sales-start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
                         <input type="date" id="sales-start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                         <label htmlFor="sales-end-date" className="block text-sm font-medium text-gray-700">End Date</label>
                         <input type="date" id="sales-end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                </div>

                <div className="border-b border-gray-200 non-printable">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button onClick={() => setView('customer')} className={`${view === 'customer' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            Sales by Customer
                        </button>
                        <button onClick={() => setView('item')} className={`${view === 'item' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            Sales by Item
                        </button>
                    </nav>
                </div>

                {view === 'customer' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-700 pt-4">Top 10 Customers by Sales</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={sortedCustomers.slice(0, 10)} layout="vertical" margin={{ left: 100 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} interval={0} />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                                <Bar dataKey="totalBilled" fill="#004A99" name="Total Billed" />
                            </BarChart>
                        </ResponsiveContainer>
                        <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50">
                                <tr>
                                    <SortableHeader<CustomerSale> label="Customer" sortKey="name" currentSort={customerSort} setSort={setCustomerSort} />
                                    <SortableHeader<CustomerSale> label="# of Invoices" sortKey="invoiceCount" currentSort={customerSort} setSort={setCustomerSort} />
                                    <SortableHeader<CustomerSale> label="Total Billed" sortKey="totalBilled" currentSort={customerSort} setSort={setCustomerSort} />
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sortedCustomers.map(c => (
                                    <tr key={c.customerId}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.invoiceCount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">{formatCurrency(c.totalBilled)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {view === 'item' && (
                     <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-700 pt-4">Top 10 Items by Revenue</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={sortedItems.slice(0,10)} dataKey="totalRevenue" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                                     {sortedItems.slice(0,10).map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                         <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50">
                                <tr>
                                    <SortableHeader<ItemSale> label="Item Name" sortKey="name" currentSort={itemSort} setSort={setItemSort} />
                                    <SortableHeader<ItemSale> label="Quantity Sold" sortKey="quantitySold" currentSort={itemSort} setSort={setItemSort} />
                                    <SortableHeader<ItemSale> label="Total Revenue" sortKey="totalRevenue" currentSort={itemSort} setSort={setItemSort} />
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sortedItems.map(item => (
                                    <tr key={item.name}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantitySold}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">{formatCurrency(item.totalRevenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
             <div className="printable-footer">
                <span>Sales Report ({view})</span>
                <div className="printable-footer-center"></div>
                <span>Generated on: {new Date().toLocaleDateString()}</span>
            </div>
        </div>
    );
};

export default SalesReport;