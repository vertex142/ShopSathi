import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Invoice, Quote, JobOrder, InvoiceStatus, QuoteStatus, Payment, TimelineEvent } from '../types';
import StatCard from '../components/StatCard';
import EmailModal from '../components/EmailModal';
import ProjectTimeline from '../components/ProjectTimeline';
import ReceivePaymentModal from '../components/ReceivePaymentModal';
import InvoicePreview from '../components/InvoicePreview';
import { ArrowLeft, FileText, ClipboardCheck, CircleDollarSign, Receipt, TrendingDown, BookOpen, Printer, LoaderCircle, Briefcase, Eye, Mail, MessageSquare } from 'lucide-react';
import { printDocument } from '../utils/pdfExporter';
import { formatCurrency } from '../utils/formatCurrency';
import CustomerChat from '../components/CustomerChat';

interface CustomerProfilePageProps {
  customerId: string;
  onBack: () => void;
}

const CustomerProfilePage: React.FC<CustomerProfilePageProps> = React.memo(({ customerId, onBack }) => {
  const { state, dispatch } = useData();
  const [activeTab, setActiveTab] = useState<'invoices' | 'quotes' | 'ledger' | 'projects' | 'chat'>('invoices');
  const [invoiceToEmail, setInvoiceToEmail] = useState<Invoice | null>(null);
  const [invoiceToPreview, setInvoiceToPreview] = useState<Invoice | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const customer = useMemo(() => state.customers.find(c => c.id === customerId), [state.customers, customerId]);
  const customerInvoices = useMemo(() => state.invoices.filter(inv => inv.customerId === customerId), [state.invoices, customerId]);
  const customerQuotes = useMemo(() => state.quotes.filter(q => q.customerId === customerId), [state.quotes, customerId]);
  const customerJobs = useMemo(() => state.jobOrders.filter(j => j.customerId === customerId), [state.jobOrders, customerId]);

  const getInvoiceTotals = (invoice: Invoice) => {
    const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
    const grandTotal = subtotal + (invoice.previousDue || 0) - (invoice.discount || 0);
    const totalPaid = (invoice.payments || []).reduce((acc, p) => acc + p.amount, 0);
    const balanceDue = grandTotal - totalPaid;
    return { grandTotal, totalPaid, balanceDue };
  };

  const customerStats = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    customerInvoices.forEach(inv => {
      const { grandTotal, totalPaid: paid } = getInvoiceTotals(inv);
      if (inv.status !== InvoiceStatus.Draft) {
        totalBilled += grandTotal;
        totalPaid += paid;
      }
    });
    const openingBalance = customer?.openingBalance || 0;
    return {
      totalBilled: totalBilled + openingBalance,
      totalPaid,
      totalDue: totalBilled + openingBalance - totalPaid,
    };
  }, [customerInvoices, customer]);

  const handleReceivePayment = (payment: Omit<Payment, 'id'>) => {
    dispatch({ type: 'RECEIVE_CUSTOMER_PAYMENT', payload: { customerId, payment } });
    setShowPaymentModal(false);
  };

  const ledgerTransactions = useMemo(() => {
    if (!customer) return [];
    
    const transactions: {date: string; details: string; debit: number; credit: number; type: 'invoice' | 'payment' | 'opening'}[] = [];

    if (customer.openingBalance > 0) {
        transactions.push({
            date: 'N/A',
            details: 'Opening Balance',
            debit: customer.openingBalance,
            credit: 0,
            type: 'opening'
        });
    }

    customerInvoices.forEach(inv => {
        if (inv.status !== InvoiceStatus.Draft) {
            transactions.push({
                date: inv.issueDate,
                details: `Invoice #${inv.invoiceNumber}`,
                debit: getInvoiceTotals(inv).grandTotal,
                credit: 0,
                type: 'invoice',
            });
            (inv.payments || []).forEach(p => {
                transactions.push({
                    date: p.date,
                    details: `Payment for #${inv.invoiceNumber}`,
                    debit: 0,
                    credit: p.amount,
                    type: 'payment'
                });
            });
        }
    });

    return transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [customer, customerInvoices]);

    const projects = useMemo(() => {
        const projectMap = new Map<string, { quote?: Quote, job?: JobOrder, invoice?: Invoice }>();

        // Find all roots (quotes or standalone jobs)
        customerQuotes.forEach(q => projectMap.set(q.id, { quote: q }));
        customerJobs.forEach(j => {
            // A job is standalone if no quote converted to it.
            if (!customerQuotes.some(q => q.convertedToJobId === j.id)) {
                projectMap.set(j.id, { job: j });
            }
        });

        // Link jobs and invoices to quotes
        customerQuotes.forEach(q => {
            if (q.convertedToJobId) {
                const job = customerJobs.find(j => j.id === q.convertedToJobId);
                if (job) {
                    const project = projectMap.get(q.id);
                    if (project) project.job = job;
                }
            }
            if (q.convertedToInvoiceId) {
                const invoice = customerInvoices.find(i => i.id === q.convertedToInvoiceId);
                if (invoice) {
                    const project = projectMap.get(q.id);
                    if (project) project.invoice = invoice;
                }
            }
        });

        // Link invoices to jobs
        customerJobs.forEach(j => {
            if (j.invoiceId) {
                const invoice = customerInvoices.find(i => i.id === j.invoiceId);
                if (invoice) {
                    // Find which project this job belongs to
                    const projectEntry = Array.from(projectMap.entries()).find(([, value]) => value.job?.id === j.id);
                    if (projectEntry) {
                        projectEntry[1].invoice = invoice;
                    } else {
                         projectMap.set(j.id, { job: j, invoice });
                    }
                }
            }
        });

        // Ensure each project object has a unique ID for React keys.
        return Array.from(projectMap.values()).map(p => ({...p, id: p.quote?.id || p.job?.id || p.invoice?.id || crypto.randomUUID() }));

    }, [customerQuotes, customerJobs, customerInvoices]);

    if (!customer) {
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-bold text-red-600">Customer not found</h2>
                <button onClick={onBack} className="mt-4 flex items-center justify-center mx-auto bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back To Customers
                </button>
            </div>
        );
    }

    const handlePrintLedger = async () => {
        setIsPrinting(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        await printDocument('customer-ledger-content', `ledger-${customer.name.replace(/\s+/g, '_')}.pdf`);
        setIsPrinting(false);
    };

    let balance = customer.openingBalance || 0;

    return (
        <div className="container mx-auto space-y-8">
            <div className="flex justify-between items-start">
                <div className="flex items-center">
                    <button onClick={onBack} className="flex items-center bg-gray-200 text-gray-800 px-3 py-2 rounded-md hover:bg-gray-300 transition-colors mr-4">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{customer.name}</h1>
                        <p className="text-gray-500">{customer.email} &bull; {customer.phone}</p>
                    </div>
                </div>
                {customerStats.totalDue > 0 && (
                     <button onClick={() => setShowPaymentModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center">
                        <Receipt className="h-5 w-5 mr-2" />
                        Receive Payment
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Billed" value={formatCurrency(customerStats.totalBilled)} IconComponent={CircleDollarSign} color="blue" />
                <StatCard title="Total Paid" value={formatCurrency(customerStats.totalPaid)} IconComponent={Receipt} color="green" />
                <StatCard title="Current Due" value={formatCurrency(customerStats.totalDue)} IconComponent={TrendingDown} color="red" />
            </div>

            <div className="bg-white rounded-lg shadow-md">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('invoices')} className={`${activeTab === 'invoices' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            Invoices ({customerInvoices.length})
                        </button>
                        <button onClick={() => setActiveTab('quotes')} className={`${activeTab === 'quotes' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            Quotes ({customerQuotes.length})
                        </button>
                         <button onClick={() => setActiveTab('projects')} className={`${activeTab === 'projects' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            Projects ({projects.length})
                        </button>
                         <button onClick={() => setActiveTab('chat')} className={`${activeTab === 'chat' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            Chat
                        </button>
                        <button onClick={() => setActiveTab('ledger')} className={`${activeTab === 'ledger' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            Customer Ledger
                        </button>
                    </nav>
                </div>
                
                <div className="p-6">
                   {activeTab === 'invoices' && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Balance Due</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {customerInvoices.map(inv => {
                                        const { grandTotal, balanceDue } = getInvoiceTotals(inv);
                                        return (
                                            <tr key={inv.id}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{inv.invoiceNumber}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{inv.issueDate}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{inv.dueDate}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{formatCurrency(grandTotal)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-red-600">{formatCurrency(balanceDue)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800`}>{inv.status}</span></td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end items-center space-x-1">
                                                        <button onClick={() => setInvoiceToPreview(inv)} className="text-blue-600 hover:text-blue-900 p-1" title="Preview Invoice"><Eye className="h-4 w-4"/></button>
                                                        <button onClick={() => setInvoiceToEmail(inv)} className="text-cyan-600 hover:text-cyan-900 p-1" title="Email Invoice"><Mail className="h-4 w-4"/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {customerInvoices.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-500">No invoices for this customer.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                   )}
                   {activeTab === 'quotes' && (
                         <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quote #</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {customerQuotes.map(q => {
                                        const total = q.items.reduce((sum, item) => sum + item.quantity * item.rate, 0) - (q.discount || 0);
                                        return (
                                            <tr key={q.id}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{q.quoteNumber}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{q.issueDate}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{q.expiryDate}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{formatCurrency(total)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800`}>{q.status}</span></td>
                                            </tr>
                                        );
                                    })}
                                     {customerQuotes.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-500">No quotes for this customer.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                   )}
                   {activeTab === 'projects' && (
                        <div className="space-y-8">
                            {projects.map(p => {
                                const timelineEvents: TimelineEvent[] = [];
                                if (p.quote) timelineEvents.push({ id: p.quote.id, date: p.quote.issueDate, title: `Quote #${p.quote.quoteNumber} Created`, description: `Status: ${p.quote.status}`, amount: p.quote.items.reduce((s,i) => s + i.rate * i.quantity, 0) - (p.quote.discount || 0), type: 'quote', relatedId: p.quote.id });
                                if (p.job) timelineEvents.push({ id: p.job.id, date: p.job.orderDate, title: `Job "${p.job.jobName}" Started`, description: `Status: ${p.job.status}`, amount: p.job.price, type: 'job', relatedId: p.job.id });
                                if (p.invoice) {
                                    timelineEvents.push({ id: p.invoice.id, date: p.invoice.issueDate, title: `Invoice #${p.invoice.invoiceNumber} Issued`, description: `Status: ${p.invoice.status}`, amount: getInvoiceTotals(p.invoice).grandTotal, type: 'invoice', relatedId: p.invoice.id });
                                    (p.invoice.payments || []).forEach(payment => timelineEvents.push({ id: payment.id, date: payment.date, title: 'Payment Received', description: `Via ${payment.method}`, amount: payment.amount, type: 'payment', relatedId: p.invoice!.id }));
                                }
                                return (
                                    <div key={p.id} className="border p-4 rounded-lg">
                                        <h3 className="font-semibold text-lg mb-4">{p.job?.jobName || p.quote?.quoteNumber || p.invoice?.invoiceNumber}</h3>
                                        <ProjectTimeline events={timelineEvents.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())} />
                                    </div>
                                )
                            })}
                             {projects.length === 0 && <p className="text-center py-10 text-gray-500">No projects found. A project is a linked set of quotes, jobs, and invoices.</p>}
                        </div>
                   )}
                   {activeTab === 'chat' && (
                       <CustomerChat customerId={customerId} />
                   )}
                   {activeTab === 'ledger' && (
                       <div id="customer-ledger-content" className="printable-page">
                           {/* Unified Header for Screen and Print */}
                           <div className="printable-header" dangerouslySetInnerHTML={{ __html: state.settings.headerSVG }} />
                           
                           <div className="flex justify-between items-center mb-4">
                               <h3 className="text-xl font-semibold text-gray-800">Customer Ledger: {customer.name}</h3>
                               <button onClick={handlePrintLedger} disabled={isPrinting} className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-50 non-printable">
                                   {isPrinting ? <LoaderCircle className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
                                   Print Ledger
                               </button>
                           </div>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        <tr className="font-semibold">
                                            <td colSpan={4} className="px-4 py-3 text-gray-800">Opening Balance</td>
                                            <td className="px-4 py-3 text-right text-gray-800">{formatCurrency(balance)}</td>
                                        </tr>
                                        {ledgerTransactions.filter(t => t.type !== 'opening').map((tx, index) => {
                                            balance = balance + tx.debit - tx.credit;
                                            return (
                                                <tr key={index}>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{tx.date}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{tx.details}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{tx.debit > 0 ? formatCurrency(tx.debit) : '-'}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600">{tx.credit > 0 ? formatCurrency(tx.credit) : '-'}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold">{formatCurrency(balance)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-100 font-bold">
                                            <td colSpan={4} className="px-4 py-3 text-right text-gray-900">Closing Balance</td>
                                            <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(balance)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                       </div>
                   )}
                </div>
            </div>
             {showPaymentModal && (
                <ReceivePaymentModal
                    customer={customer}
                    totalDue={customerStats.totalDue}
                    onClose={() => setShowPaymentModal(false)}
                    onConfirm={handleReceivePayment}
                />
            )}
             {invoiceToEmail && (
                <EmailModal invoice={invoiceToEmail} onClose={() => setInvoiceToEmail(null)} />
            )}
             {invoiceToPreview && (
                <InvoicePreview invoice={invoiceToPreview} onClose={() => setInvoiceToPreview(null)} />
            )}
        </div>
    );
});

export default CustomerProfilePage;
