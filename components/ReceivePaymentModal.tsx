import React, { useState, useMemo } from 'react';
import type { Customer, Payment } from '../types';
import { PAYMENT_METHODS, AccountType } from '../types';
import { useData } from '../context/DataContext';
import { formatCurrency } from '../utils/formatCurrency';
import SearchableSelect from './SearchableSelect';

interface ReceivePaymentModalProps {
  customer: Customer;
  totalDue: number;
  onClose: () => void;
  onConfirm: (payment: Omit<Payment, 'id'>) => void;
}

const ReceivePaymentModal: React.FC<ReceivePaymentModalProps> = ({ customer, totalDue, onClose, onConfirm }) => {
  const { state } = useData();
  const assetAccountOptions = useMemo(() =>
    state.accounts
        .filter(a => a.type === AccountType.Asset)
        .map(a => ({ value: a.id, label: a.name }))
  , [state.accounts]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: totalDue > 0 ? totalDue : 0,
    method: PAYMENT_METHODS[0],
    // FIX: Initialize accountId to satisfy the Payment type.
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
    // FIX: Check for accountId before confirming.
    if (formData.amount > 0 && formData.accountId) {
        onConfirm(formData);
    } else {
        alert("Payment amount must be greater than zero and an account must be selected.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h2 id="payment-modal-title" className="text-xl font-bold mb-2">Receive Payment</h2>
        <p className="mb-4 text-sm text-gray-600">
          From customer <span className="font-semibold">{customer.name}</span>. Total Due: <span className="font-bold">{formatCurrency(totalDue)}</span>
        </p>
        <div className="space-y-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">Payment Date</label>
              <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount Received</label>
              <input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} required min="0.01" step="0.01" className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div>
              <label htmlFor="method" className="block text-sm font-medium text-gray-700">Payment Method</label>
              <select id="method" name="method" value={formData.method} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm">
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {/* FIX: Add account selection dropdown */}
            <div>
              <label htmlFor="accountId" className="block text-sm font-medium text-gray-700">Deposit To Account</label>
              <SearchableSelect
                value={formData.accountId}
                onChange={(val) => setFormData(prev => ({ ...prev, accountId: val }))}
                options={assetAccountOptions}
                placeholder="Select an account"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Select the account where this payment is being deposited. This will increase its balance.</p>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
              <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={2} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"></textarea>
            </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">
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

export default ReceivePaymentModal;
