import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Quote, QuoteStatus } from '../types';
import QuoteForm from '../components/QuoteForm';
import StatusEditor from '../components/StatusEditor';
import QuotePreview from '../components/QuotePreview';
import { Search, X } from 'lucide-react';

interface QuotesPageProps {
    onViewCustomer: (customerId: string) => void;
}

const QuotesPage: React.FC<QuotesPageProps> = ({ onViewCustomer }) => {
  // Fix: Replaced dispatch with specific data context functions.
  const { state, deleteQuote, convertQuoteToJob, convertQuoteToInvoice } = useData();
  const [showForm, setShowForm] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [quoteToPreview, setQuoteToPreview] = useState<Quote | null>(null);
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');


  const handleEdit = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      // Fix: Replaced dispatch with specific data context functions.
      deleteQuote(id);
    }
  };
  
  const handleAddNew = () => {
    setSelectedQuote(null);
    setShowForm(true);
  };

  const handleConvertToJob = (id: string) => {
    if (window.confirm('Are you sure you want to convert this quote to a job?')) {
        // Fix: Replaced dispatch with specific data context functions.
        convertQuoteToJob(id);
    }
  };

  const handleConvertToInvoice = (id: string) => {
    if (window.confirm('Are you sure you want to convert this quote to an invoice?')) {
        // Fix: Replaced dispatch with specific data context functions.
        convertQuoteToInvoice(id);
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
        return 'bg-green-100 text-green-800';
      case QuoteStatus.Sent:
        return 'bg-blue-100 text-blue-800';
      case QuoteStatus.Declined:
        return 'bg-red-100 text-red-800';
      case QuoteStatus.Draft:
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
        <h1 className="text-3xl font-bold text-gray-800">Quotes</h1>
        <button onClick={handleAddNew} className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light transition-colors">
          Add New Quote
        </button>
      </div>
      
      {/* Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
                <label htmlFor="search-quote" className="sr-only">Search Quote #</label>
                <input
                    id="search-quote"
                    type="text"
                    placeholder="Search Quote #"
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
                    {Object.values(QuoteStatus).map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>
        </div>

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
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote #</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredQuotes.length > 0 ? (
                        filteredQuotes.map((quote) => {
                            const customer = state.customers.find(c => c.id === quote.customerId);
                            const grandTotal = getQuoteTotal(quote);
                            return (
                                <tr key={quote.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{quote.quoteNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <button onClick={() => onViewCustomer(quote.customerId)} className="hover:underline text-brand-blue">
                                            {customer?.name || 'N/A'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.issueDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.expiryDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${grandTotal.toFixed(2)}</td>
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
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                        <button onClick={() => setQuoteToPreview(quote)} className="text-blue-600 hover:text-blue-900">Preview</button>
                                        {quote.status === QuoteStatus.Accepted && !quote.convertedToJobId && (
                                          <button onClick={() => handleConvertToJob(quote.id)} className="text-purple-600 hover:text-purple-900">To Job</button>
                                        )}
                                        {quote.status === QuoteStatus.Accepted && !quote.convertedToInvoiceId && (
                                          <button onClick={() => handleConvertToInvoice(quote.id)} className="text-green-600 hover:text-green-900">To Invoice</button>
                                        )}
                                        <button onClick={() => handleEdit(quote)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                        <button onClick={() => handleDelete(quote.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            )
                        })
                    ) : (
                        <tr>
                           <td colSpan={7} className="text-center py-10 text-gray-500">
                                {state.quotes.length > 0 ? 'No quotes match your filters.' : 'No quotes found. Add one to get started!'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

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
};

export default QuotesPage;
