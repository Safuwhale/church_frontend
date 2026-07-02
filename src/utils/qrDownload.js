const createCanvasFromSvg = async (svgElement, { width, height, padding = 0.12 }) => {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const image = new Image();

  return await new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);

      const qrSize = Math.min(width, height) * (1 - padding * 2);
      const x = (width - qrSize) / 2;
      const y = (height - qrSize) / 2;

      context.drawImage(image, x, y, qrSize, qrSize);
      resolve(canvas);
    };

    image.onerror = reject;
    image.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  });
};

export const downloadQrAsPng = async (svgElement, filename, options = {}) => {
  const canvas = await createCanvasFromSvg(svgElement, options);
  const downloadLink = document.createElement('a');
  downloadLink.href = canvas.toDataURL('image/png');
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
};

export const downloadQrAsA4Jpg = async (svgElement, filename, options = {}) => {
  const canvas = await createCanvasFromSvg(svgElement, options);
  const downloadLink = document.createElement('a');
  downloadLink.href = canvas.toDataURL('image/jpeg', 0.96);
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
};