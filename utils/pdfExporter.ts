import jsPDF from 'jspdf';

/**
 * Exports a DOM element to a high-quality, vector-based PDF file using jsPDF's modern HTML renderer.
 * This provides selectable text, higher resolution for images, and correct automatic paging.
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
  // A small delay allows the browser to apply the styles before jsPDF reads the DOM.
  await new Promise(resolve => setTimeout(resolve, 50));

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      compress: true,
    });

    await pdf.html(input, {
      callback: function (doc) {
        doc.save(fileName);
      },
      margin: 15,
      autoPaging: 'text', // Handles page breaks gracefully
      width: 210, // A4 page width
      windowWidth: input.scrollWidth, // Render at the element's natural width
      html2canvas: {
        scale: 2, // Improve resolution of any raster images
        useCORS: true,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert('An error occurred while generating the PDF. Please try again.');
  } finally {
    // Clean up by removing the class after rendering is complete
    document.body.classList.remove('pdf-export-active');
  }
};