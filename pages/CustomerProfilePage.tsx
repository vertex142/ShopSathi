import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Invoice, Quote, JobOrder, InvoiceStatus, QuoteStatus, Payment, TimelineEvent } from '../types';
import StatCard from '../components/StatCard';
import EmailModal from '../components/EmailModal';
import ProjectTimeline from '../components/ProjectTimeline';
import ReceivePaymentModal from '../components/ReceivePaymentModal';
import InvoicePreview from '../components/InvoicePreview';
import { ArrowLeft, FileText, ClipboardCheck, CircleDollarSign, Receipt, TrendingDown, BookOpen, Printer, LoaderCircle, Briefcase } from 'lucide-react';
import { printDocument } from '../utils/pdfExporter';

interface CustomerProfilePageProps {
  customerId: string;
  onBack: () => void;
}

const CustomerProfilePage: React.FC<CustomerProfilePageProps> = React.memo(({ customerId, onBack }) => {
  const { state, dispatch } = useData();
  const [activeTab, setActiveTab] = useState<'invoices' | 'quotes' | 'ledger' | 'projects'>('invoices');
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
        
        return Array.from(projectMap.values());
    }, [customerQuotes, customerJobs, customerInvoices]);

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

  const handlePrintLedger = async () => {
    setIsPrinting(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    await printDocument('customer-ledger', `ledger-${customer.name.replace(/\s+/g, '_')}.pdf`);
    setIsPrinting(false);
  };

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
        <div className="flex items-center space-x-2">
            {customerStats.totalDue > 0 && (
            <button onClick={() => setShowPaymentModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center">
                <Receipt className="h-5 w-5 mr-2" />
                Receive Payment
            </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Billed" value={`$${customerStats.totalBilled.toFixed(2)}`} IconComponent={CircleDollarSign} color="bg-blue-500" />
        <StatCard title="Total Paid" value={`$${customerStats.totalPaid.toFixed(2)}`} IconComponent={Receipt} color="bg-green-500" />
        <StatCard title="Balance Due" value={`$${customerStats.totalDue.toFixed(2)}`} IconComponent={TrendingDown} color="bg-red-500" />
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setActiveTab('invoices')} className={`${activeTab === 'invoices' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}>
            <FileText className="h-5 w-5 mr-2" /> Invoices ({customerInvoices.length})
          </button>
          <button onClick={() => setActiveTab('quotes')} className={`${activeTab === 'quotes' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}>
            <ClipboardCheck className="h-5 w-5 mr-2" /> Quotes ({customerQuotes.length})
          </button>
          <button onClick={() => setActiveTab('projects')} className={`${activeTab === 'projects' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}>
            <Briefcase className="h-5 w-5 mr-2" /> Projects ({projects.length})
          </button>
          <button onClick={() => setActiveTab('ledger')} className={`${activeTab === 'ledger' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}>
            <BookOpen className="h-5 w-5 mr-2" /> Ledger
          </button>
        </nav>
      </div>

      <div>
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
                  {customerInvoices.map(inv => {
                    const { grandTotal, balanceDue } = getInvoiceTotals(inv);
                    return (
                      <tr key={inv.id}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{inv.invoiceNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{inv.issueDate}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">${grandTotal.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-red-600">${balanceDue.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getInvoiceStatusColor(inv.status)}`}>{inv.status}</span></td>
                        <td className="px-6 py-4 text-right text-sm font-medium space-x-4">
                          <button onClick={() => setInvoiceToPreview(inv)} className="text-blue-600 hover:text-blue-900">Preview</button>
                          <button onClick={() => setInvoiceToEmail(inv)} className="text-cyan-600 hover:text-cyan-900">Email</button>
                        </td>
                      </tr>
                    );
                  })}
                  {customerInvoices.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-500">No invoices found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 'quotes' && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
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
                      <td className="px-6 py-4 text-sm text-gray-500">${q.items.reduce((sum, i) => sum + i.rate * i.quantity, 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getQuoteStatusColor(q.status)}`}>{q.status}</span></td>
                    </tr>
                  ))}
                  {customerQuotes.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-gray-500">No quotes found.</td></tr>}
                </tbody>
              </table>
          </div>
        )}
         {activeTab === 'projects' && (
            <div className="space-y-6">
                {projects.length > 0 ? (
                    projects.map((project, index) => {
                        const events: TimelineEvent[] = [];
                        if (project.quote) events.push({ id: `q-${project.quote.id}`, date: project.quote.issueDate, title: `Quote #${project.quote.quoteNumber}`, description: `Status: ${project.quote.status}`, type: 'quote', relatedId: project.quote.id });
                        if (project.job) events.push({ id: `j-${project.job.id}`, date: project.job.orderDate, title: `Job: ${project.job.jobName}`, description: `Status: ${project.job.status}`, type: 'job', relatedId: project.job.id });
                        if (project.invoice) {
                            events.push({ id: `i-${project.invoice.id}`, date: project.invoice.issueDate, title: `Invoice #${project.invoice.invoiceNumber}`, description: `Status: ${project.invoice.status}`, type: 'invoice', relatedId: project.invoice.id });
                            (project.invoice.payments || []).forEach(p => events.push({ id: `p-${p.id}`, date: p.date, title: `Payment Received`, description: `$${p.amount.toFixed(2)} via ${p.method}`, type: 'payment', relatedId: project.invoice!.id }));
                        }
                        events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                        const projectTitle = project.job?.jobName || `Project from Quote #${project.quote?.quoteNumber}` || `Project for Invoice #${project.invoice?.invoiceNumber}` || `Project ${index + 1}`;
                        return (
                            <div key={index} className="border p-4 rounded-lg bg-white shadow-md">
                                <h3 className="text-lg font-semibold mb-4 text-gray-800">{projectTitle}</h3>
                                <ProjectTimeline events={events} />
                            </div>
                        )
                    })
                ) : (
                    <div className="bg-white shadow-md rounded-lg p-6 text-center text-gray-500">No projects found for this customer.</div>
                )}
            </div>
        )}
        {activeTab === 'ledger' && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-4 flex justify-between items-center non-printable">
              <h3 className="text-lg font-semibold">Account Ledger</h3>
              <button onClick={handlePrintLedger} disabled={isPrinting} className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 text-sm">
                {isPrinting ? <LoaderCircle className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
                Print / Save
              </button>
            </div>
            <div className="overflow-x-auto">
              <div id="customer-ledger" className="printable-page p-4">
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

                {/* Print-only Header */}
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

                {/* Report Title for Print */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold">Customer Ledger</h2>
                    <p className="text-lg">{customer.name}</p>
                    <p className="text-sm text-gray-600">As of {new Date().toLocaleDateString()}</p>
                </div>

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
                      {(() => {
                          let balance = 0;
                          return ledgerTransactions.map((tx, i) => {
                              balance += tx.debit - tx.credit;
                              return (
                                  <tr key={i}>
                                      <td className="px-6 py-4 text-sm text-gray-500">{tx.date}</td>
                                      <td className="px-6 py-4 text-sm text-gray-900">{tx.details}</td>
                                      <td className="px-6 py-4 text-right text-sm text-gray-500">{tx.debit > 0 ? `$${tx.debit.toFixed(2)}` : '-'}</td>
                                      <td className="px-6 py-4 text-right text-sm text-green-600">{tx.credit > 0 ? `$${tx.credit.toFixed(2)}` : '-'}</td>
                                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-800">${balance.toFixed(2)}</td>
                                  </tr>
                              );
                          });
                      })()}
                  </tbody>
                </table>
              
                {/* Print-only Footer */}
                <div className="printable-footer">
                    <span>Customer: {customer.name}</span>
                    <div className="printable-footer-center"></div>
                    <span>Generated on: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showPaymentModal && (
        <ReceivePaymentModal 
          customer={customer}
          totalDue={customerStats.totalDue}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handleReceivePayment}
        />
      )}
      {invoiceToEmail && <EmailModal invoice={invoiceToEmail} onClose={() => setInvoiceToEmail(null)} />}
      {invoiceToPreview && <InvoicePreview invoice={invoiceToPreview} onClose={() => setInvoiceToPreview(null)} />}
    </div>
  );
});

export default CustomerProfilePage;