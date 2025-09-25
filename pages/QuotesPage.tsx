import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Quote, QuoteStatus } from '../types';
import QuoteForm from '../components/QuoteForm';
import StatusEditor from '../components/StatusEditor';
import QuotePreview from '../components/QuotePreview';
import { Search, X, Eye, Briefcase, FileText, Edit, Trash2, ClipboardCheck } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { parseTemplate, generateWhatsAppLink } from '../utils/whatsappHelper';
import SearchableSelect from '../components/SearchableSelect';
import EmptyState from '../components/EmptyState';
import ActionMenu, { ActionMenuItem } from '../components/ActionMenu';

interface QuotesPageProps {
    onViewCustomer: (customerId: string) => void;
}

const QuotesPage: React.FC<QuotesPageProps> = React.memo(({ onViewCustomer }) => {
  const { state, dispatch } = useData();
  const [showForm, setShowForm] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [quoteToPreview, setQuoteToPreview] = useState<Quote | null>(null);
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const customerOptions = useMemo(() => [
    { value: '', label: 'All Customers' },
    ...state.customers.map(c => ({ value: c.id, label: c.name }))
  ], [state.customers]);


  const handleEdit = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      dispatch({ type: 'DELETE_QUOTE', payload: id });
    }
  };
  
  const handleAddNew = () => {
    setSelectedQuote(null);
    setShowForm(true);
  };

  const handleConvertToJob = (id: string) => {
    if (window.confirm('Are you sure you want to convert this quote to a job?')) {
        dispatch({ type: 'CONVERT_QUOTE_TO_JOB', payload: id });
    }
  };

  const handleConvertToInvoice = (id: string) => {
    if (window.confirm('Are you sure you want to convert this quote to an invoice?')) {
        dispatch({ type: 'CONVERT_QUOTE_TO_INVOICE', payload: id });
    }
  };


  const getQuoteTotal = (quote: Quote) => {
    const subtotal = quote.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
    const grandTotal = subtotal - (quote.discount || 0);
    return grandTotal;
  };

  const getStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case QuoteStatus.Accepted:
      case QuoteStatus.Converted:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case QuoteStatus.Sent:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case QuoteStatus.Declined:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case QuoteStatus.Draft:
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterCustomer('');
    setFilterStatus('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const handleSendWhatsApp = (quote: Quote) => {
    const customer = state.customers.find(c => c.id === quote.customerId);
    if (!customer || !customer.phone) {
        alert('This customer does not have a phone number on file.');
        return;
    }

    const template = state.settings.whatsappTemplates?.quote || 'Hello {customerName},\n\nPlease find quote {quoteNumber} attached for your review.\n\nWe look forward to hearing from you.\n\nThank you,\n{companyName}';
    const total = getQuoteTotal(quote);
    
    const message = parseTemplate(template, {
        customerName: customer.name,
        quoteNumber: quote.quoteNumber,
        amountDue: total,
        dueDate: quote.expiryDate, // Using expiry date for quotes
        companyName: state.settings.name,
    });

    const link = generateWhatsAppLink(customer.phone, message);
    window.open(link, '_blank');
  };

  const filteredQuotes = useMemo(() => {
    return state.quotes.filter(quote => {
        return (
            (searchTerm === '' || quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filterCustomer === '' || quote.customerId === filterCustomer) &&
            (filterStatus === '' || quote.status === filterStatus) &&
            (filterStartDate === '' || quote.issueDate >= filterStartDate) &&
            (filterEndDate === '' || quote.issueDate <= filterEndDate)
        );
    });
  }, [state.quotes, searchTerm, filterCustomer, filterStatus, filterStartDate, filterEndDate]);


  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Quotes</h1>
        <button onClick={handleAddNew} className="bg-brand-blue dark:bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-brand-blue-light dark:hover:bg-blue-500 transition-colors">
          Add New Quote
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
                <label htmlFor="search-quote" className="sr-only">Search Quote #</label>
                <input
                    id="search-quote"
                    type="text"
                    placeholder="Search Quote #"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 pl-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
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
                    className="w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                >
                    <option value="">All Statuses</option>
                    {Object.values(QuoteStatus).map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
            <div className="flex-grow">
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Issue Date From</label>
                <input
                    type="date"
                    id="start-date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="mt-1 w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                />
            </div>
            <div className="flex-grow">
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">To</label>
                <input
                    type="date"
                    id="end-date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="mt-1 w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
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
      
      {state.quotes.length === 0 ? (
          <EmptyState 
            Icon={ClipboardCheck}
            title="No Quotes Found"
            message="Start your sales process by creating a professional quotation for a customer."
            action={{ label: 'Add New Quote', onClick: handleAddNew }}
          />
      ) : (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quote #</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Issue Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Expiry Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredQuotes.length > 0 ? (
                        filteredQuotes.map((quote) => {
                            const customer = state.customers.find(c => c.id === quote.customerId);
                            const grandTotal = getQuoteTotal(quote);
                            
                            const actions: ActionMenuItem[] = [
                                { label: 'Preview', icon: Eye, onClick: () => setQuoteToPreview(quote) },
                                { label: 'WhatsApp', icon: WhatsAppIcon, onClick: () => handleSendWhatsApp(quote) },
                            ];
                            
                            if (quote.status === QuoteStatus.Accepted) {
                                if (!quote.convertedToJobId) {
                                    actions.push({ label: 'Convert to Job', icon: Briefcase, onClick: () => handleConvertToJob(quote.id), className: 'text-purple-600 dark:text-purple-400' });
                                }
                                if (!quote.convertedToInvoiceId) {
                                    actions.push({ label: 'Convert to Invoice', icon: FileText, onClick: () => handleConvertToInvoice(quote.id), className: 'text-green-600 dark:text-green-400' });
                                }
                            }
                            
                            actions.push(
                                { label: 'Edit', icon: Edit, onClick: () => handleEdit(quote), className: 'text-indigo-600 dark:text-indigo-400' },
                                { label: 'Delete', icon: Trash2, onClick: () => handleDelete(quote.id), className: 'text-red-600 dark:text-red-400' }
                            );

                            return (
                                <tr key={quote.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{quote.quoteNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        <button onClick={() => onViewCustomer(quote.customerId)} className="hover:underline text-brand-blue dark:text-blue-400">
                                            {customer?.name || 'N/A'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{quote.issueDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{quote.expiryDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatCurrency(grandTotal)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <StatusEditor
                                            item={quote}
                                            status={quote.status}
                                            statusEnum={QuoteStatus}
                                            updateActionType="UPDATE_QUOTE"
                                            getStatusColor={getStatusColor}
                                            disabledStatuses={[QuoteStatus.Converted]}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <ActionMenu actions={actions} />
                                    </td>
                                </tr>
                            )
                        })
                    ) : (
                        <tr>
                           <td colSpan={7} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                No quotes match your filters.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
      )}

      {showForm && (
        <QuoteForm
          quote={selectedQuote}
          onClose={() => setShowForm(false)}
        />
      )}
      
      {quoteToPreview && (
        <QuotePreview 
            quote={quoteToPreview}
            onClose={() => setQuoteToPreview(null)}
        />
      )}
    </div>
  );
});

export default QuotesPage;
