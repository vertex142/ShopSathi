import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Invoice, InvoiceStatus, Payment } from '../types';
import InvoiceForm from '../components/InvoiceForm';
import PaymentModal from '../components/PaymentModal';
import InvoicePreview from '../components/InvoicePreview';
import MoneyReceiptPreview from '../components/MoneyReceiptPreview';
import EmailModal from '../components/EmailModal';
import StatusEditor from '../components/StatusEditor';
import { Search, X, Bell, FileMinus, Eye, Mail, CircleDollarSign, Edit, Trash2, Truck, FileText } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import CreditNoteForm from '../components/CreditNoteForm';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { parseTemplate, generateWhatsAppLink } from '../utils/whatsappHelper';
import useDebounce from '../hooks/useDebounce';
import SearchableSelect from '../components/SearchableSelect';
import EmptyState from '../components/EmptyState';

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
  const [invoiceForCreditNote, setInvoiceForCreditNote] = useState<Invoice | null>(null);
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const customerOptions = useMemo(() => [
    { value: '', label: 'All Customers' },
    ...state.customers.map(c => ({ value: c.id, label: c.name }))
  ], [state.customers]);

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
    const grandTotal = subtotal + (invoice.previousDue || 0) - (invoice.discount || 0) + (invoice.taxAmount || 0);
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
      case InvoiceStatus.Credited:
        return 'bg-gray-200 text-gray-500 line-through';
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

  const handleSendWhatsApp = (invoice: Invoice) => {
    const customer = state.customers.find(c => c.id === invoice.customerId);
    if (!customer || !customer.phone) {
        alert('This customer does not have a phone number on file.');
        return;
    }

    const template = state.settings.whatsappTemplates?.invoice || 'Hello {customerName},\n\nPlease find your invoice ({invoiceNumber}) attached. The total amount due is {amountDue} by {dueDate}.\n\nThank you,\n{companyName}';
    const { balanceDue } = getInvoiceTotals(invoice);
    
    const message = parseTemplate(template, {
        customerName: customer.name,
        invoiceNumber: invoice.invoiceNumber,
        amountDue: balanceDue,
        dueDate: invoice.dueDate,
        companyName: state.settings.name,
    });

    const link = generateWhatsAppLink(customer.phone, message);
    window.open(link, '_blank');
};


  const filteredInvoices = useMemo(() => {
    return state.invoices.filter(invoice => {
        return (
            (debouncedSearchTerm === '' || invoice.invoiceNumber.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) &&
            (filterCustomer === '' || invoice.customerId === filterCustomer) &&
            (filterStatus === '' || invoice.status === filterStatus) &&
            (filterStartDate === '' || invoice.issueDate >= filterStartDate) &&
            (filterEndDate === '' || invoice.issueDate <= filterEndDate)
        );
    });
  }, [state.invoices, debouncedSearchTerm, filterCustomer, filterStatus, filterStartDate, filterEndDate]);


  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Invoices</h1>
        <button onClick={handleAddNew} className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light transition-colors">
          Add New Invoice
        </button>
      </div>
      
      {/* Filter Section */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 space-y-4">
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
                    className="w-full p-2 pl-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <div>
                <label htmlFor="filter-customer" className="sr-only">Filter by customer</label>
                <SearchableSelect
                    value={filterCustomer}
                    onChange={setFilterCustomer}
                    options={customerOptions}
                    placeholder="All Customers"
                />
            </div>
            <div>
                <label htmlFor="filter-status" className="sr-only">Filter by status</label>
                <select
                    id="filter-status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Issue Date From</label>
                <input
                    type="date"
                    id="start-date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="mt-1 w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                />
            </div>
            <div className="flex-grow">
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">To</label>
                <input
                    type="date"
                    id="end-date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="mt-1 w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                />
            </div>
            <div className="flex-shrink-0">
                <button
                    onClick={handleResetFilters}
                    className="w-full md:w-auto flex items-center justify-center p-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                    aria-label="Reset filters"
                >
                    <X className="h-4 w-4 mr-2" />
                    Reset
                </button>
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        {filteredInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Invoice #</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Issue Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paid</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Balance Due</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredInvoices.map((invoice) => {
                        const customer = state.customers.find(c => c.id === invoice.customerId);
                        const { grandTotal, totalPaid, balanceDue } = getInvoiceTotals(invoice);
                        const canCreateCreditNote = invoice.status !== InvoiceStatus.Draft && invoice.status !== InvoiceStatus.Credited;
                        const canConvertToChallan = !invoice.challanId;
                        return (
                            <tr key={invoice.id} className="dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{invoice.invoiceNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    <button onClick={() => onViewCustomer(invoice.customerId)} className="hover:underline text-brand-blue" title={`View profile for ${customer?.name}`}>
                                        {customer?.name || 'N/A'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{invoice.issueDate}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {invoice.dueDate}
                                    {invoice.reminderDate && (
                                        <span className="inline-flex items-center ml-2" title={`A notification reminder is set for this invoice on: ${invoice.reminderDate}`}>
                                            <Bell className="h-4 w-4 text-yellow-600" />
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatCurrency(grandTotal)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{formatCurrency(totalPaid)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">{formatCurrency(balanceDue)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <StatusEditor
                                        item={invoice}
                                        status={invoice.status}
                                        statusEnum={InvoiceStatus}
                                        updateActionType="UPDATE_INVOICE"
                                        getStatusColor={getStatusColor}
                                        disabledStatuses={[InvoiceStatus.Paid, InvoiceStatus.PartiallyPaid, InvoiceStatus.Credited]}
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end items-center space-x-1">
                                        <button onClick={() => setInvoiceToPreview(invoice)} className="text-blue-600 hover:text-blue-900 p-1" title="Preview Invoice" aria-label={`Preview invoice ${invoice.invoiceNumber}`}><Eye className="h-4 w-4" /></button>
                                        <button onClick={() => setInvoiceToEmail(invoice)} className="text-cyan-600 hover:text-cyan-900 p-1" title="Email Invoice" aria-label={`Email invoice ${invoice.invoiceNumber}`}><Mail className="h-4 w-4" /></button>
                                        <button onClick={() => handleSendWhatsApp(invoice)} className="text-green-600 hover:text-green-900 p-1" title="Send via WhatsApp" aria-label={`Send invoice ${invoice.invoiceNumber} via WhatsApp`}><WhatsAppIcon className="h-5 w-5" /></button>
                                        {canConvertToChallan && (
                                            <button onClick={() => handleConvertToChallan(invoice.id)} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-1" title="Create Delivery Challan" aria-label={`Create delivery challan for invoice ${invoice.invoiceNumber}`}><Truck className="h-4 w-4" /></button>
                                        )}
                                        {invoice.status !== InvoiceStatus.Paid && invoice.status !== InvoiceStatus.Credited && (
                                          <button onClick={() => setInvoiceForPayment(invoice)} className="text-green-600 hover:text-green-900 p-1" title="Add Payment" aria-label={`Add payment for invoice ${invoice.invoiceNumber}`}><CircleDollarSign className="h-4 w-4" /></button>
                                        )}
                                        {canCreateCreditNote && (
                                          <button onClick={() => setInvoiceForCreditNote(invoice)} className="text-orange-600 hover:text-orange-900 p-1" title="Create Credit Note" aria-label={`Create credit note for invoice ${invoice.invoiceNumber}`}><FileMinus className="h-4 w-4" /></button>
                                        )}
                                        <button onClick={() => handleEdit(invoice)} className="text-indigo-600 hover:text-indigo-900 p-1" title="Edit Invoice" aria-label={`Edit invoice ${invoice.invoiceNumber}`}><Edit className="h-4 w-4" /></button>
                                        <button onClick={() => handleDelete(invoice.id)} className="text-red-600 hover:text-red-900 p-1" title="Delete Invoice" aria-label={`Delete invoice ${invoice.invoiceNumber}`}><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
          </div>
        ) : (
            <EmptyState
                Icon={FileText}
                title={state.invoices.length > 0 ? "No Invoices Found" : "Create Your First Invoice"}
                message={state.invoices.length > 0 ? "No invoices match your current filter criteria." : "Get started by creating a new invoice for a customer."}
                actionButton={<button onClick={handleAddNew} className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light transition-colors">Add New Invoice</button>}
            />
        )}
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
      {invoiceForCreditNote && (
        <CreditNoteForm
          originalInvoice={invoiceForCreditNote}
          onClose={() => setInvoiceForCreditNote(null)}
        />
      )}
    </div>
  );
});

export default InvoicesPage;