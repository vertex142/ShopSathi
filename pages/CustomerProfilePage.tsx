
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Invoice, Quote, JobOrder, InvoiceStatus, QuoteStatus, Payment, TimelineEvent } from '../types';
import StatCard from '../components/StatCard';
import EmailModal from '../components/EmailModal';
import ProjectTimeline from '../components/ProjectTimeline';
import { ArrowLeft, FileText, ClipboardCheck, CircleDollarSign, Receipt, TrendingDown, BookOpen, Printer, LoaderCircle, Briefcase } from 'lucide-react';
import { exportElementAsPDF } from '../utils/pdfExporter';

interface CustomerProfilePageProps {
  customerId: string;
  onBack: () => void;
  onViewCustomer: (customerId: string) => void;
}

const CustomerProfilePage: React.FC<CustomerProfilePageProps> = ({ customerId, onBack, onViewCustomer }) => {
  const { state } = useData();
  const [activeTab, setActiveTab] = useState<'invoices' | 'quotes' | 'ledger' | 'projects'>('invoices');
  const [invoiceToEmail, setInvoiceToEmail] = useState<Invoice | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

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
            const linkedQuote = customerQuotes.find(q => q.convertedToJobId === j.id);
            if (!linkedQuote) {
                 projectMap.set(j.id, { job: j });
            }
        });

        // Link documents together
        projectMap.forEach((project, key) => {
            if (project.quote) {
                if(project.quote.convertedToJobId) {
                    project.job = customerJobs.find(j => j.id === project.quote.convertedToJobId);
                }
                if(project.quote.convertedToInvoiceId) {
                    project.invoice = customerInvoices.find(i => i.id === project.quote.convertedToInvoiceId);
                }
            }
            if (project.job && project.job.invoiceId) {
                project.invoice = customerInvoices.find(i => i.id === project.job.invoiceId);
            }
        });
        
        return Array.from(projectMap.values()).map((p, index) => {
            const events: TimelineEvent[] = [];
            if(p.quote) {
                events.push({ id: p.quote.id, date: p.quote.issueDate, title: `Quote #${p.quote.quoteNumber} Created`, description: `Status: ${p.quote.status}`, type: 'quote', status: p.quote.status, amount: p.quote.items.reduce((sum, i) => sum + i.rate*i.quantity, 0) - (p.quote.discount || 0), relatedId: p.quote.id });
            }
            if (p.job) {
                events.push({ id: p.job.id, date: p.job.orderDate, title: `Job "${p.job.jobName}" Started`, description: `Status: ${p.job.status}`, type: 'job', status: p.job.status, amount: p.job.price, relatedId: p.job.id });
            }
            if (p.invoice) {
                events.push({ id: p.invoice.id, date: p.invoice.issueDate, title: `Invoice #${p.invoice.invoiceNumber} Issued`, description: `Status: ${p.invoice.status}`, type: 'invoice', status: p.invoice.status, amount: getInvoiceTotals(p.invoice).grandTotal, relatedId: p.invoice.id });
                (p.invoice.payments || []).forEach(payment => {
                    events.push({ id: payment.id, date: payment.date, title: `Payment Received`, description: `Method: ${payment.method}`, type: 'payment', amount: payment.amount, relatedId: p.invoice!.id });
                });
            }
            
            events.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            const title = p.quote?.quoteNumber ? `Project from Quote #${p.quote.quoteNumber}` : p.job?.jobName ? `Project: ${p.job.jobName}` : `Project ${index + 1}`;
            return { title, events };
        });

  }, [customerQuotes, customerJobs, customerInvoices]);


  const handlePrintLedger = async () => {
    if (!customer) return;
    setIsPrinting(true);
    const fileName = `Ledger_Report_${customer.name.replace(/\s/g, '_')}`;
    await exportElementAsPDF('customer-ledger-report-content', fileName);
    setIsPrinting(false);
  };

  if (!customer) {
    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">Customer not found</h2>
            <button onClick={onBack} className="mt-4 flex items-center justify-center mx-auto bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
            </button>
        </div>
    );
  }

  const getInvoiceStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.Paid: return 'bg-green-100 text-green-800';
      case InvoiceStatus.PartiallyPaid: return 'bg-yellow-100 text-yellow-800';
      case InvoiceStatus.Sent: return 'bg-blue-100 text-blue-800';
      case InvoiceStatus.Overdue: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getQuoteStatusColor = (status: QuoteStatus) => {
     switch (status) {
      case QuoteStatus.Accepted:
      case QuoteStatus.Converted: return 'bg-green-100 text-green-800';
      case QuoteStatus.Sent: return 'bg-blue-100 text-blue-800';
      case QuoteStatus.Declined: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  let runningBalance = 0;

  return (
    <div className="container mx-auto space-y-8">
        <div className="flex items-center mb-6">
            <button onClick={onBack} className="flex items-center bg-gray-200 text-gray-800 px-3 py-2 rounded-md hover:bg-gray-300 transition-colors mr-4">
                <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
                <h1 className="text-3xl font-bold text-gray-800">{customer.name}</h1>
                <p className="text-gray-500">{customer.email} &bull; {customer.phone}</p>
            </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Total Billed" value={`$${customerStats.totalBilled.toFixed(2)}`} icon={<CircleDollarSign />} color="bg-blue-500" />
            <StatCard title="Total Paid" value={`$${customerStats.totalPaid.toFixed(2)}`} icon={<Receipt />} color="bg-green-500" />
            <StatCard title="Current Due" value={`$${customerStats.totalDue.toFixed(2)}`} icon={<TrendingDown />} color="bg-red-500" />
        </div>
        
        {/* Tabs for Invoices and Quotes */}
        <div>
            <div className="flex justify-between items-center border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('invoices')} className={`${activeTab === 'invoices' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        <FileText className="h-5 w-5 mr-2" /> Invoices ({customerInvoices.length})
                    </button>
                    <button onClick={() => setActiveTab('quotes')} className={`${activeTab === 'quotes' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                         <ClipboardCheck className="h-5 w-5 mr-2" /> Quotes ({customerQuotes.length})
                    </button>
                    <button onClick={() => setActiveTab('ledger')} className={`${activeTab === 'ledger' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                         <BookOpen className="h-5 w-5 mr-2" /> Ledger
                    </button>
                    <button onClick={() => setActiveTab('projects')} className={`${activeTab === 'projects' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                         <Briefcase className="h-5 w-5 mr-2" /> Projects & Timeline
                    </button>
                </nav>
                {activeTab === 'ledger' && (
                    <button
                        onClick={handlePrintLedger}
                        disabled={isPrinting}
                        className="export-button flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm text-sm"
                    >
                        {isPrinting ? (
                            <>
                                <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                                Printing...
                            </>
                        ) : (
                            <>
                                <Printer className="h-4 w-4 mr-2" />
                                Print Ledger
                            </>
                        )}
                    </button>
                )}
            </div>
            
            <div className="mt-6">
                {activeTab === 'invoices' && (
                     <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance Due</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {customerInvoices.map(inv => (
                                        <tr key={inv.id}>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{inv.invoiceNumber}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{inv.issueDate}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">${getInvoiceTotals(inv).grandTotal.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-red-600">${getInvoiceTotals(inv).balanceDue.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getInvoiceStatusColor(inv.status)}`}>{inv.status}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => setInvoiceToEmail(inv)} className="text-cyan-600 hover:text-cyan-900">Email</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {customerInvoices.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-500">No invoices for this customer.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {activeTab === 'quotes' && (
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quote #</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {customerQuotes.map(q => (
                                        <tr key={q.id}>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{q.quoteNumber}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{q.issueDate}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">${(q.items.reduce((sum, item) => sum + item.rate * item.quantity, 0) - (q.discount || 0)).toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getQuoteStatusColor(q.status)}`}>{q.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {customerQuotes.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-gray-500">No quotes for this customer.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {activeTab === 'ledger' && (
                     <div className="bg-white shadow-md rounded-lg overflow-hidden">
                         <div id="customer-ledger-report-content">
                            <div className="p-4 bg-gray-50 border-b">
                                <h3 className="text-lg font-bold text-gray-800">{customer.name} - Account Ledger</h3>
                                <p className="text-sm text-gray-500">A summary of all transactions.</p>
                            </div>
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
                                        {ledgerTransactions.map((tx, index) => {
                                            runningBalance += tx.debit - tx.credit;
                                            return (
                                                <tr key={index}>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{tx.date}</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{tx.details}</td>
                                                    <td className="px-6 py-4 text-sm text-right text-gray-500">{tx.debit > 0 ? `$${tx.debit.toFixed(2)}` : '-'}</td>
                                                    <td className="px-6 py-4 text-sm text-right text-green-600">{tx.credit > 0 ? `$${tx.credit.toFixed(2)}` : '-'}</td>
                                                    <td className="px-6 py-4 text-sm font-semibold text-right text-gray-800">${runningBalance.toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                        {ledgerTransactions.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-500">No transactions for this customer.</td></tr>}
                                    </tbody>
                                    <tfoot className="bg-gray-100">
                                        <tr>
                                            <td colSpan={4} className="px-6 py-3 text-right text-sm font-bold text-gray-700 uppercase">Current Balance</td>
                                            <td className="px-6 py-3 text-right text-sm font-bold text-red-600">${runningBalance.toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                         </div>
                     </div>
                )}
                {activeTab === 'projects' && (
                    <div className="space-y-8">
                        {projects.length > 0 ? projects.map(project => (
                             <div key={project.title} className="bg-white shadow-md rounded-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">{project.title}</h3>
                                <ProjectTimeline events={project.events} />
                             </div>
                        )) : (
                            <div className="text-center py-10 text-gray-500 bg-white shadow-md rounded-lg">
                                No projects found for this customer.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
        {invoiceToEmail && (
            <EmailModal
                invoice={invoiceToEmail}
                onClose={() => setInvoiceToEmail(null)}
            />
        )}
    </div>
  );
};

export default CustomerProfilePage;
