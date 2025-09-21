
import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Page } from '../types';
import { Search, X, User, FileText, Briefcase } from 'lucide-react';

interface SearchResultItem {
  id: string;
  label: string;
  context: string;
  type: 'customer' | 'invoice' | 'job';
}

interface GroupedSearchResults {
  title: string;
  items: SearchResultItem[];
}

interface GlobalSearchProps {
  setCurrentPage: (page: Page) => void;
  onViewCustomer: (customerId: string) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ setCurrentPage, onViewCustomer }) => {
  const { state } = useData();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GroupedSearchResults[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const lowerCaseQuery = query.toLowerCase();

    const customerResults: SearchResultItem[] = state.customers
      .filter(c => c.name.toLowerCase().includes(lowerCaseQuery) || c.email.toLowerCase().includes(lowerCaseQuery))
      .map(c => ({ id: c.id, label: c.name, context: c.email, type: 'customer' }));

    const invoiceResults: SearchResultItem[] = state.invoices
      .filter(i => i.invoiceNumber.toLowerCase().includes(lowerCaseQuery))
      .map(i => {
        const customer = state.customers.find(c => c.id === i.customerId);
        return { id: i.id, label: i.invoiceNumber, context: customer ? `for ${customer.name}` : '', type: 'invoice' };
      });

    const jobResults: SearchResultItem[] = state.jobOrders
      .filter(j => j.jobName.toLowerCase().includes(lowerCaseQuery) || (j.id.includes(lowerCaseQuery)))
      .map(j => {
        const customer = state.customers.find(c => c.id === j.customerId);
        return { id: j.id, label: j.jobName, context: customer ? `for ${customer.name}` : '', type: 'job' };
      });

    const grouped: GroupedSearchResults[] = [];
    if (customerResults.length > 0) {
      grouped.push({ title: 'Customers', items: customerResults.slice(0, 5) });
    }
    if (invoiceResults.length > 0) {
      grouped.push({ title: 'Invoices', items: invoiceResults.slice(0, 5) });
    }
    if (jobResults.length > 0) {
      grouped.push({ title: 'Jobs', items: jobResults.slice(0, 5) });
    }

    setResults(grouped);
    setIsOpen(grouped.length > 0);
  }, [query, state.customers, state.invoices, state.jobOrders]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (item: SearchResultItem) => {
    switch (item.type) {
      case 'customer':
        onViewCustomer(item.id);
        break;
      case 'invoice':
        setCurrentPage('invoices');
        break;
      case 'job':
        setCurrentPage('jobs');
        break;
    }
    setQuery('');
    setIsOpen(false);
  };
  
  const getIcon = (type: SearchResultItem['type']) => {
    switch(type) {
      case 'customer': return <User className="h-4 w-4 text-gray-500" />;
      case 'invoice': return <FileText className="h-4 w-4 text-gray-500" />;
      case 'job': return <Briefcase className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative w-full max-w-lg" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search customers, invoices, jobs..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query.length > 1 && setIsOpen(true)}
          className="w-full p-2 pl-10 pr-8 bg-gray-100 text-gray-900 placeholder:text-gray-500 border border-transparent rounded-md focus:ring-brand-blue focus:border-brand-blue focus:bg-white"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute mt-2 w-full bg-white rounded-md shadow-lg border z-30 max-h-96 overflow-y-auto">
          <ul>
            {results.map(group => (
              <li key={group.title}>
                <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b">{group.title}</h3>
                <ul>
                  {group.items.map(item => (
                    <li key={`${item.type}-${item.id}`}>
                      <button
                        onClick={() => handleSelect(item)}
                        className="w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-gray-100"
                      >
                        {getIcon(item.type)}
                        <div>
                            <p className="text-sm font-medium text-gray-800">{item.label}</p>
                            <p className="text-xs text-gray-500">{item.context}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
