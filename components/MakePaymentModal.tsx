import React, { useState, useMemo, useRef } from 'react';
import type { Supplier, Payment } from '../types';
import { PAYMENT_METHODS, AccountType } from '../types';
import { useData } from '../context/DataContext';
import { formatCurrency } from '../utils/formatCurrency';
import SearchableSelect from './SearchableSelect';
import useFocusTrap from '../hooks/useFocusTrap';

interface MakePaymentModalProps {
  supplier: Supplier;
  totalDue: number;
  onClose: () => void;
  onConfirm: (payment: Omit<Payment, 'id'>) => void;
}

const MakePaymentModal: React.FC<MakePaymentModalProps> = ({ supplier, totalDue, onClose, onConfirm }) => {
  const { state } = useData();
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef);
  
  const assetAccountOptions = useMemo(() =>
    state.accounts
        .filter(a => a.type === AccountType.Asset)
        .map(a => ({ value: a.id, label: a.name }))
  , [state.accounts]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: totalDue > 0 ? totalDue : 0,
    method: PAYMENT_METHODS[0],
    accountId: assetAccountOptions.length > 0 ? assetAccountOptions[0].value : '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleConfirm = () => {
    if (formData.amount > 0 && formData.accountId) {
        onConfirm(formData);
    } else {
        alert("Payment amount must be greater than zero and an account must be selected.");
    }
  };

  return (
    <div ref={modalRef} className="fixed inset-0 bg-black bg-opacity-50 modal-backdrop flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
        <h2 id="payment-modal-title" className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Make Payment</h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          To supplier <span className="font-semibold">{supplier.name}</span>. Total Due: <span className="font-bold">{formatCurrency(totalDue)}</span>
        </p>
        <div className="space-y-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Date</label>
              <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"/>
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount Paid</label>
              <input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} required min="0.01" step="0.01" className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"/>
            </div>
            <div>
              <label htmlFor="method" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
              <select id="method" name="method" value={formData.method} onChange={handleChange} className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm">
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pay From Account</label>
              <SearchableSelect
                value={formData.accountId}
                onChange={(val) => setFormData(prev => ({ ...prev, accountId: val }))}
                options={assetAccountOptions}
                placeholder="Select an account"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This will decrease the balance of the selected account (e.g., Cash or Bank).</p>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</label>
              <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={2} className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"></textarea>
            </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
            Save Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default MakePaymentModal;
