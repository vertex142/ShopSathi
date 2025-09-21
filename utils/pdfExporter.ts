import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Captures an HTML element and exports it as a PDF file.
 * @param {string} elementId The ID of the HTML element to capture.
 * @param {string} fileName The name of the downloaded PDF file (without extension).
 */
export const exportElementAsPDF = async (
  elementId: string, 
  fileName: string,
) => {
  // Add a delay to ensure any animations (like charts) are complete
  await new Promise(resolve => setTimeout(resolve, 300));

  const input = document.getElementById(elementId);
  if (!input) {
    console.error(`Element with id ${elementId} not found.`);
    alert(`Could not find element to export.`);
    return;
  }

  // Add a class to body for styling during capture
  document.body.classList.add('pdf-capturing');

  try {
    const canvas = await html2canvas(input, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    
    const pdfWidth = canvas.width;
    const pdfHeight = canvas.height;
    
    // Determine orientation based on aspect ratio
    const orientation = pdfWidth > pdfHeight ? 'l' : 'p';
    
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format: [pdfWidth, pdfHeight]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${fileName}.pdf`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('An error occurred while generating the PDF.');
  } finally {
    // Remove the styling class after capture
    document.body.classList.remove('pdf-capturing');
  }
};
