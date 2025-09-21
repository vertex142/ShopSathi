
import React, { useState } from 'react';
import type { Invoice, Payment } from '../types';
import { PAYMENT_METHODS } from '../types';

interface PaymentModalProps {
  invoice: Invoice;
  onClose: () => void;
  onConfirm: (payment: Payment) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ invoice, onClose, onConfirm }) => {
  const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
  const grandTotal = subtotal + (invoice.previousDue || 0) - (invoice.discount || 0);
  const totalPaid = (invoice.payments || []).reduce((acc, p) => acc + p.amount, 0);
  const balanceDue = grandTotal - totalPaid;

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: balanceDue > 0 ? balanceDue : 0,
    method: PAYMENT_METHODS[0],
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
    if (formData.amount > 0) {
        const newPayment: Payment = {
            id: crypto.randomUUID(),
            ...formData,
        };
        onConfirm(newPayment);
    } else {
        alert("Payment amount must be greater than zero.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h2 id="payment-modal-title" className="text-xl font-bold mb-2">Add Payment</h2>
        <p className="mb-4 text-sm text-gray-600">
          For invoice <span className="font-semibold">{invoice.invoiceNumber}</span>. Balance Due: <span className="font-bold">${balanceDue.toFixed(2)}</span>
        </p>
        <div className="space-y-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">Payment Date</label>
              <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
              <input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} required min="0.01" step="0.01" className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div>
              <label htmlFor="method" className="block text-sm font-medium text-gray-700">Payment Method</label>
              <select id="method" name="method" value={formData.method} onChange={handleChange} className="mt-1 block w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm">
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
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

export default PaymentModal;