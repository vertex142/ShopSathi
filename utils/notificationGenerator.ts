import { AppState, Notification } from '../types';
import { InvoiceStatus } from '../types';

/**
 * Scans the current app state and generates new notifications for events that haven't been notified yet.
 * @param state The current application state.
 * @returns An array of new Notification objects.
 */
export const generateNotifications = (state: AppState): Notification[] => {
    const newNotifications: Notification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to the start of the day

    // 1. Overdue Invoices
    state.invoices.forEach(invoice => {
        const dueDate = new Date(invoice.dueDate);
        if (dueDate < today && invoice.status !== InvoiceStatus.Paid && invoice.status !== InvoiceStatus.Draft) {
            const existingNotification = state.notifications.find(
                n => n.type === 'invoice-overdue' && n.relatedId === invoice.id
            );
            if (!existingNotification) {
                newNotifications.push({
                    id: crypto.randomUUID(),
                    message: `Invoice #${invoice.invoiceNumber} is overdue.`,
                    type: 'invoice-overdue',
                    relatedId: invoice.id,
                    timestamp: Date.now(),
                    read: false,
                    linkTo: 'invoices',
                });
            }
        }
    });

    // 2. Upcoming Payment Reminders
    state.invoices.forEach(invoice => {
        if (invoice.reminderDate) {
            const reminderDate = new Date(invoice.reminderDate);
            if (reminderDate.getTime() === today.getTime()) {
                const reminderKey = `${invoice.id}-${invoice.reminderDate}`;
                const existingNotification = state.notifications.find(
                    n => n.type === 'invoice-reminder' && n.relatedId === reminderKey
                );
                if (!existingNotification) {
                    newNotifications.push({
                        id: crypto.randomUUID(),
                        message: `Payment reminder for Invoice #${invoice.invoiceNumber} is due today.`,
                        type: 'invoice-reminder',
                        relatedId: reminderKey, // Use a unique key for the reminder instance
                        timestamp: Date.now(),
                        read: false,
                        linkTo: 'invoices',
                    });
                }
            }
        }
    });

    // 3. Low Stock Items
    state.inventoryItems.forEach(item => {
        if (item.stockQuantity <= item.reorderLevel) {
            const existingNotification = state.notifications.find(
                n => n.type === 'low-stock' && n.relatedId === item.id
            );
            // We only add a new notification if one doesn't exist.
            // This prevents spamming on every state change if stock is low.
            // A more advanced system might re-notify if the user dismisses it and stock level changes again.
            if (!existingNotification) {
                newNotifications.push({
                    id: crypto.randomUUID(),
                    message: `Low stock: "${item.name}" has only ${item.stockQuantity} units left.`,
                    type: 'low-stock',
                    relatedId: item.id,
                    timestamp: Date.now(),
                    read: false,
                    linkTo: 'inventory',
                });
            }
        }
    });
    
    return newNotifications;
};
