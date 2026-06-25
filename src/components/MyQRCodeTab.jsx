import { QRCodeSVG } from 'qrcode.react';
import { Download, Info } from 'lucide-react';

export default function MyQRCodeTab({ userData }) {
  // Fallback in case userData hasn't loaded yet
  const qrValue = userData?.serial_number || 'UNKNOWN-ID';
  const memberName = userData?.first_name || 'Member';

  const handleDownload = () => {
    // A quick browser trick to let users save the QR code to their phone's gallery
    const svg = document.getElementById('horyc-qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width + 40; // Add padding
      canvas.height = img.height + 40;
      ctx.fillStyle = "white"; // White background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${memberName}-HORYC-QR.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="max-w-md mx-auto mt-4">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
        
        <h3 className="font-display text-2xl font-bold text-brand-dark mb-1">Your Digital Pass</h3>
        <p className="text-slate-500 text-sm mb-8">
          Present this code to an Usher when you arrive at Sunday Service.
        </p>

        {/* The QR Code Container */}
        <div className="bg-white p-4 rounded-3xl border-4 border-brand-light inline-block mb-6 shadow-sm">
          <QRCodeSVG 
            id="horyc-qr-code"
            value={qrValue} 
            size={220} 
            level="H" // High error correction so it scans even if phone is cracked
            fgColor="#0f172a" // brand-dark
          />
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">HORYC ID Number</p>
          <p className="font-mono text-xl font-bold text-brand-dark tracking-widest">{qrValue}</p>
        </div>

        <button 
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 bg-brand-light text-brand-blue py-3.5 rounded-xl font-medium hover:bg-blue-50 transition-colors border border-blue-100"
        >
          <Download size={18} />
          Save to Phone Gallery
        </button>

      </div>

      <div className="mt-6 flex items-start gap-3 bg-blue-50 p-4 rounded-2xl text-blue-800 text-sm">
        <Info size={20} className="shrink-0 mt-0.5 text-brand-blue" />
        <p>
          Tip: You can screenshot this page or save the image to your gallery so you can check in even if you don't have internet data at church.
        </p>
      </div>
    </div>
  );
}