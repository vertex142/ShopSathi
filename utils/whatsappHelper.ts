import { formatCurrency } from './formatCurrency';

// A very basic phone number formatter
export const formatPhoneNumber = (phone: string): string => {
    // Remove all non-numeric characters
    return phone.replace(/[^0-9]/g, '');
};

// A function to parse a template and replace placeholders
export const parseTemplate = (template: string, data: Record<string, any>): string => {
    let parsed = template;
    for (const key in data) {
        // Special formatting for amountDue
        const value = key === 'amountDue' ? formatCurrency(data[key]) : data[key];
        parsed = parsed.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    return parsed;
};

// Generates the final wa.me link
export const generateWhatsAppLink = (phone: string, message: string): string => {
    const formattedPhone = formatPhoneNumber(phone);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};
