import html2canvas from 'html2canvas';

export async function exportToPNG(element: HTMLElement, filename: string): Promise<boolean> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2, // 2x DPR for crisp thermal print rendering
      backgroundColor: '#FFFFFF',
      useCORS: true,
      logging: false,
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(false);
          return;
        }

        // Check if Web Share API with files is supported on mobile
        const file = new File([blob], `${filename}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: filename,
          }).then(() => resolve(true)).catch(() => {
            // Fall back to direct download
            downloadBlob(blob, `${filename}.png`);
            resolve(true);
          });
        } else {
          downloadBlob(blob, `${filename}.png`);
          resolve(true);
        }
      }, 'image/png');
    });
  } catch (err) {
    console.error('PNG export failed', err);
    return false;
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
