import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Invoice, InvoiceStatus, Payment } from '../types';
import InvoiceForm from '../components/InvoiceForm';
import PaymentModal from '../components/PaymentModal';
import InvoicePreview from '../components/InvoicePreview';
import MoneyReceiptPreview from '../components/MoneyReceiptPreview';
import EmailModal from '../components/EmailModal';
import StatusEditor from '../components/StatusEditor';
import { Search, X, Bell } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

interface InvoicesPageProps {
    onViewCustomer: (customerId: string) => void;
}

const InvoicesPage: React.FC<InvoicesPageProps> = React.memo(({ onViewCustomer }) => {
  const { state, dispatch } = useData();
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceForPayment, setInvoiceForPayment] = useState<Invoice | null>(null);
  const [invoiceToPreview, setInvoiceToPreview] = useState<Invoice | null>(null);
  const [paymentForReceipt, setPaymentForReceipt] = useState<{ invoice: Invoice, payment: Payment } | null>(null);
  const [invoiceToEmail, setInvoiceToEmail] = useState<Invoice | null>(null);
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');


  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      dispatch({ type: 'DELETE_INVOICE', payload: id });
    }
  };

  const handleConvertToChallan = (id: string) => {
    if (window.confirm('Are you sure you want to convert this invoice to a Delivery Challan?')) {
        dispatch({ type: 'CONVERT_INVOICE_TO_CHALLAN', payload: id });
    }
  };
  
  const handleAddNew = () => {
    setSelectedInvoice(null);
    setShowForm(true);
  };

  const handleAddPayment = (payment: Payment) => {
    if (invoiceForPayment) {
        dispatch({ type: 'ADD_PAYMENT_TO_INVOICE', payload: { invoiceId: invoiceForPayment.id, payment } });
        setPaymentForReceipt({ invoice: invoiceForPayment, payment });
        setInvoiceForPayment(null);
    }
  };

  const getInvoiceTotals = (invoice: Invoice) => {
    const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
    const grandTotal = subtotal + (invoice.previousDue || 0) - (invoice.discount || 0);
    const totalPaid = (invoice.payments || []).reduce((acc, p) => acc + p.amount, 0);
    const balanceDue = grandTotal - totalPaid;
    return { grandTotal, totalPaid, balanceDue };
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.Paid:
        return 'bg-green-100 text-green-800';
      case InvoiceStatus.PartiallyPaid:
        return 'bg-yellow-100 text-yellow-800';
      case InvoiceStatus.Sent:
        return 'bg-blue-100 text-blue-800';
      case InvoiceStatus.Overdue:
        return 'bg-red-100 text-red-800';
      case InvoiceStatus.Draft:
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterCustomer('');
    setFilterStatus('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const filteredInvoices = useMemo(() => {
    return state.invoices.filter(invoice => {
        return (
            (searchTerm === '' || invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filterCustomer === '' || invoice.customerId === filterCustomer) &&
            (filterStatus === '' || invoice.status === filterStatus) &&
            (filterStartDate === '' || invoice.issueDate >= filterStartDate) &&
            (filterEndDate === '' || invoice.issueDate <= filterEndDate)
        );
    });
  }, [state.invoices, searchTerm, filterCustomer, filterStatus, filterStartDate, filterEndDate]);


  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Invoices</h1>
        <button onClick={handleAddNew} className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light transition-colors">
          Add New Invoice
        </button>
      </div>
      
      {/* Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 space-y-4">
        {/* Primary Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
                <label htmlFor="search-invoice" className="sr-only">Search Invoice #</label>
                <input
                    id="search-invoice"
                    type="text"
                    placeholder="Search Invoice #"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 pl-10 bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <div>
                <label htmlFor="filter-customer" className="sr-only">Filter by customer</label>
                <select
                    id="filter-customer"
                    value={filterCustomer}
                    onChange={(e) => setFilterCustomer(e.target.value)}
                    className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="">All Customers</option>
                    {state.customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="filter-status" className="sr-only">Filter by status</label>
                <select
                    id="filter-status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="">All Statuses</option>
                    {Object.values(InvoiceStatus).map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* Secondary Filters & Actions */}
        <div className="flex flex-wrap items-end gap-4">
            <div className="flex-grow">
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Issue Date From</label>
                <input
                    type="date"
                    id="start-date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="mt-1 w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"
                />
            </div>
            <div className="flex-grow">
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">To</label>
                <input
                    type="date"
                    id="end-date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="mt-1 w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"
                />
            </div>
            <div className="flex-shrink-0">
                <button
                    onClick={handleResetFilters}
                    className="w-full md:w-auto flex items-center justify-center p-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300"
                    aria-label="Reset filters"
                >
                    <X className="h-4 w-4 mr-2" />
                    Reset
                </button>
            </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance Due</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInvoices.length > 0 ? (
                        filteredInvoices.map((invoice) => {
                            const customer = state.customers.find(c => c.id === invoice.customerId);
                            const { grandTotal, totalPaid, balanceDue } = getInvoiceTotals(invoice);
                            return (
                                <tr key={invoice.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <button onClick={() => onViewCustomer(invoice.customerId)} className="hover:underline text-brand-blue" title={`View profile for ${customer?.name}`}>
                                            {customer?.name || 'N/A'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.issueDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {invoice.dueDate}
                                        {invoice.reminderDate && (
                                            <span className="inline-flex items-center ml-2" title={`A notification reminder is set for this invoice on: ${invoice.reminderDate}`}>
                                                <Bell className="h-4 w-4 text-yellow-600" />
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(grandTotal)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{formatCurrency(totalPaid)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">{formatCurrency(balanceDue)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <StatusEditor
                                            item={invoice}
                                            status={invoice.status}
                                            statusEnum={InvoiceStatus}
                                            updateActionType="UPDATE_INVOICE"
                                            getStatusColor={getStatusColor}
                                            disabledStatuses={[InvoiceStatus.Paid, InvoiceStatus.PartiallyPaid]}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end items-center space-x-4">
                                            <button onClick={() => setInvoiceToPreview(invoice)} className="text-blue-600 hover:text-blue-900">Preview</button>
                                            <button onClick={() => setInvoiceToEmail(invoice)} className="text-cyan-600 hover:text-cyan-900" title="Get a pre-written email template to send this invoice.">Email</button>
                                            {invoice.status !== InvoiceStatus.Paid && (
                                              <button onClick={() => setInvoiceForPayment(invoice)} className="text-green-600 hover:text-green-900" title="Record a new payment for this invoice.">Add Payment</button>
                                            )}
                                            <button onClick={() => handleConvertToChallan(invoice.id)} className="text-purple-600 hover:text-purple-900 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!!invoice.challanId} title={invoice.challanId ? "Already converted" : "Generate a new delivery challan from this invoice"}>
                                                To Challan
                                            </button>
                                            <button onClick={() => handleEdit(invoice)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                            <button onClick={() => handleDelete(invoice.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })
                    ) : (
                        <tr>
                           <td colSpan={9} className="text-center py-10 text-gray-500">
                                {state.invoices.length > 0 ? 'No invoices match your filters.' : 'No invoices found. Add one to get started!'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {showForm && (
        <InvoiceForm
          invoice={selectedInvoice}
          onClose={() => setShowForm(false)}
        />
      )}

      {invoiceToPreview && (
        <InvoicePreview
            invoice={invoiceToPreview}
            onClose={() => setInvoiceToPreview(null)}
        />
      )}
      
      {paymentForReceipt && (
        <MoneyReceiptPreview 
            invoice={paymentForReceipt.invoice}
            payment={paymentForReceipt.payment}
            onClose={() => setPaymentForReceipt(null)}
        />
      )}

      {invoiceToEmail && (
        <EmailModal 
            invoice={invoiceToEmail}
            onClose={() => setInvoiceToEmail(null)}
        />
      )}

      {invoiceForPayment && (
        <PaymentModal 
            invoice={invoiceForPayment}
            onClose={() => setInvoiceForPayment(null)}
            onConfirm={handleAddPayment}
        />
      )}
    </div>
  );
});

export default InvoicesPage;