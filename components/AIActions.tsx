
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { InvoiceStatus, Invoice, Customer, InventoryItem, Supplier } from '../types';
import { generateActionableInsight } from '../services/geminiService';
import { Sparkles, Bot, AlertTriangle, FileWarning, LoaderCircle } from 'lucide-react';
import AIResponseModal from './AIResponseModal';

const AIActions: React.FC = () => {
    const { state } = useData();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [modalContent, setModalContent] = useState<{ title: string; content: string } | null>(null);

    const actionableInsights = useMemo(() => {
        const overdueInvoices = state.invoices.filter(inv => inv.status === InvoiceStatus.Overdue || inv.status === InvoiceStatus.PartiallyPaid && new Date(inv.dueDate) < new Date());
        const lowStockItems = state.inventoryItems.filter(item => item.stockQuantity <= item.reorderLevel);
        
        const insights = [];
        if (overdueInvoices.length > 0) {
            insights.push({
                id: 'overdue-invoices',
                icon: <FileWarning className="h-6 w-6 text-red-500" />,
                title: `You have ${overdueInvoices.length} overdue invoice(s).`,
                actionText: 'Draft Reminder Emails',
                action: async () => {
                    setIsLoading('overdue-invoices');
                    const customers = state.customers.filter(c => overdueInvoices.some(inv => inv.customerId === c.id));
                    const context = { overdueInvoices, customers, companyName: state.settings.name };
                    const prompt = `Draft a single, polite but firm reminder email for all overdue invoices. Address each customer by name and list their overdue invoice number(s) and balance due.`;
                    try {
                        const content = await generateActionableInsight(prompt, context);
                        setModalContent({ title: 'Draft Reminder Emails', content });
                    } catch (error) {
                        alert('Failed to generate reminders. Please try again.');
                    }
                    setIsLoading(null);
                }
            });
        }
        if (lowStockItems.length > 0) {
            insights.push({
                id: 'low-stock',
                icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
                title: `${lowStockItems.length} item(s) are low on stock.`,
                actionText: 'Suggest Purchase Orders',
                 action: async () => {
                    setIsLoading('low-stock');
                    const context = { lowStockItems, suppliers: state.suppliers };
                    const prompt = `Based on the low stock items, suggest a plan for purchase orders. For each item, list the item name, current quantity, and suggested supplier if available. Format as a simple to-do list.`;
                     try {
                        const content = await generateActionableInsight(prompt, context);
                        setModalContent({ title: 'Purchase Order Suggestions', content });
                    } catch (error) {
                        alert('Failed to generate suggestions. Please try again.');
                    }
                    setIsLoading(null);
                }
            });
        }
        return insights;
    }, [state]);

    if (actionableInsights.length === 0) {
        return null;
    }

    return (
        <>
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Bot className="h-5 w-5 mr-2 text-brand-blue" />
                AI Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {actionableInsights.map(insight => (
                    <div key={insight.id} className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {insight.icon}
                            <p className="text-sm font-medium text-gray-700">{insight.title}</p>
                        </div>
                        <button
                            onClick={insight.action}
                            disabled={!!isLoading}
                            className="flex items-center bg-brand-blue text-white px-3 py-1.5 rounded-md text-sm hover:bg-brand-blue-light disabled:opacity-50"
                        >
                            {isLoading === insight.id ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    {insight.actionText}
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
        {modalContent && (
            <AIResponseModal 
                title={modalContent.title}
                content={modalContent.content}
                onClose={() => setModalContent(null)}
            />
        )}
        </>
    );
};

export default AIActions;
