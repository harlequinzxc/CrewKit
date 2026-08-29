export async function exportToPDF(element: HTMLElement, filename: string, paperWidthMm = 80): Promise<boolean> {
  try {
    const html2canvas = (await import('html2canvas')).default;
    const { default: jsPDF } = await import('jspdf');

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#FFFFFF',
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = paperWidthMm;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [paperWidthMm, Math.max(imgHeight + 10, 100)],
    });

    pdf.addImage(imgData, 'PNG', 0, 5, imgWidth, imgHeight);

    const blob = pdf.output('blob');
    const file = new File([blob], `${filename}.pdf`, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename });
        return true;
      } catch {
        // Fall back to direct save
      }
    }

    pdf.save(`${filename}.pdf`);
    return true;
  } catch (err) {
    console.error('PDF export failed', err);
    return false;
  }
}
