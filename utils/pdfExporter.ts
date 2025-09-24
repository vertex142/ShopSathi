/**
 * Triggers the browser's print dialog.
 * This can be used for both printing to paper and saving as a PDF.
 * The appearance of the printed output is controlled by @media print styles in index.html.
 */
export const printDocument = () => {
  window.print();
};
