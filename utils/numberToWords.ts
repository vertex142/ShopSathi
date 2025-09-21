// A simple number to words converter for amounts up to 999,999,999.99
const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const thousands = ['', 'Thousand', 'Million'];

function convertGroup(n: number): string {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return `${tens[Math.floor(n / 10)]} ${ones[n % 10]}`;
    return `${ones[Math.floor(n / 100)]} Hundred ${convertGroup(n % 100)}`;
}

export function numberToWords(num: number): string {
    if (num === 0) return 'Zero';

    const [integerPart, fractionalPart] = num.toFixed(2).split('.').map(part => parseInt(part, 10));

    let words = '';
    let i = 0;
    let tempNum = integerPart;

    while (tempNum > 0) {
        if (tempNum % 1000 !== 0) {
            words = `${convertGroup(tempNum % 1000)} ${thousands[i]} ${words}`;
        }
        tempNum = Math.floor(tempNum / 1000);
        i++;
    }

    words = words.trim();
    
    if (fractionalPart > 0) {
        words += ` and ${fractionalPart}/100`;
    }

    return words.replace(/\s+/g, ' ').trim();
}
