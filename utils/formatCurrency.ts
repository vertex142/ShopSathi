// A utility to format numbers into the Indian currency style with the Taka symbol.
export const formatCurrency = (amount: number): string => {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return '৳ 0.00';
    }

    // Use Intl.NumberFormat with the 'en-IN' locale for Indian numbering system (lakhs, crores).
    const formatter = new Intl.NumberFormat('en-IN', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const formattedAmount = formatter.format(amount);
    return `৳ ${formattedAmount}`;
};
