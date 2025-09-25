// A utility to generate sequential, padded document numbers.

interface DocumentWithNumber {
    invoiceNumber?: string;
    quoteNumber?: string;
    challanNumber?: string;
    poNumber?: string;
    // FIX: Add creditNoteNumber to support generating numbers for credit notes.
    creditNoteNumber?: string;
}

/**
 * Generates the next sequential document number based on existing documents.
 * @param documents - An array of documents that have a number property (e.g., invoiceNumber).
 * @param key - The key of the number property (e.g., 'invoiceNumber').
 * @param prefix - The prefix for the number (e.g., 'INV-').
 * @returns The next document number as a string (e.g., 'INV-0005').
 */
export const generateNextDocumentNumber = (
    documents: DocumentWithNumber[],
    key: keyof DocumentWithNumber,
    prefix: string
): string => {
    let maxNum = 0;
    documents.forEach(doc => {
        const docNumStr = doc[key];
        if (docNumStr && docNumStr.startsWith(prefix)) {
            const numPart = parseInt(docNumStr.substring(prefix.length), 10);
            if (!isNaN(numPart) && numPart > maxNum) {
                maxNum = numPart;
            }
        }
    });
    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
};