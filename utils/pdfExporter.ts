import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Exports a DOM element to a PDF file using html2canvas and jsPDF.
 * This provides a direct download experience instead of the browser's print dialog.
 * @param elementId The ID of the DOM element to export.
 * @param fileName The name of the file to be saved (e.g., 'invoice.pdf').
 */
export const printDocument = async (elementId: string, fileName: string = 'document.pdf') => {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error(`Element with id "${elementId}" not found.`);
    alert('Error: Could not find the content to export.');
    return;
  }

  // Add a class to the body to trigger special export styles
  document.body.classList.add('pdf-export-active');

  try {
    const canvas = await html2canvas(input, {
      scale: 2, // Higher resolution for better quality
      useCORS: true,
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    
    // A4 page size in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    const ratio = canvasWidth / canvasHeight;
    const scaledImgWidth = pdfWidth;
    const scaledImgHeight = scaledImgWidth / ratio;
    
    let heightLeft = scaledImgHeight;
    let position = 0;
    
    // Add the first page
    pdf.addImage(imgData, 'PNG', 0, position, scaledImgWidth, scaledImgHeight);
    heightLeft -= pdfHeight;
    
    // Add subsequent pages if the content is taller than one page
    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, scaledImgWidth, scaledImgHeight);
      heightLeft -= pdfHeight;
    }
    
    pdf.save(fileName);

  } catch (error) {
      console.error("Error generating PDF:", error);
      alert('An error occurred while generating the PDF. Please try again.');
  } finally {
      // Clean up by removing the class
      document.body.classList.remove('pdf-export-active');
  }
};