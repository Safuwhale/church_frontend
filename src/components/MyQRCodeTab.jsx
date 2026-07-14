import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Camera } from 'lucide-react';
import SelfScanner from './SelfScanner';
import { downloadQrAsPng } from '../utils/qrDownload';

export default function MyQRCodeTab({ userData }) {
  const qrRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  
  const qrValue = userData?.serial_number || 'UNKNOWN-ID';
  const memberName = `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim() || 'Member';

  /**
   * Triggers the SelfScanner overlay.
   */
  const handleSelfServiceScan = () => setIsScanning(true);

  /**
   * High-quality PNG download logic.
   */
  const handleDownload = () => {
    const svgElement = qrRef.current.querySelector('svg');
    if (!svgElement) return;

    void downloadQrAsPng(svgElement, `HORYC-PASS-${qrValue}.png`, {
      width: 1600,
      height: 1600,
      padding: 0.18,
    });
  };

  return (
    <div className="space-y-6">
      {/* Self-Scanner Overlay */}
      {isScanning && <SelfScanner onClose={() => setIsScanning(false)} />}

      {/* BANNER */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 md:p-8 rounded-3xl border border-slate-700 shadow-lg text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none">
          <Camera size={200} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-2xl font-bold mb-2">Scan Service QR code</h3>
            <p className="text-slate-300 max-w-md text-sm leading-relaxed">
              Skip the line. Tap the green button to open your camera and scan the service qr code to instantly check yourself in.
            </p>
          </div>
          <button 
            onClick={handleSelfServiceScan}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-500 text-emerald-950 rounded-xl font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Camera size={22} />
            Scan 
          </button>
        </div>
      </div>

      {/* WALLET CARD */}
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-slate-900"></div>
          
          {/* AVATAR RENDERER */}
          <div className="relative z-10 w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-md mb-6">
            {userData?.profile_photo_url ? (
              <img 
                src={userData.profile_photo_url} 
                alt={memberName} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center font-display font-bold text-3xl text-white">
                {memberName.charAt(0)}
              </div>
            )}
          </div>

          <h2 className="font-display text-2xl font-bold text-slate-800 mb-1">{memberName}</h2>
          <p className="text-slate-500 mb-8 font-medium">HORYC Member</p>

          <div ref={qrRef} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
            <QRCodeSVG 
              value={qrValue} 
              size={200}
              bgColor={"#ffffff"}
              fgColor={"#0f172a"}
              level={"H"}
              includeMargin={false}
            />
          </div>

          <div className="bg-slate-50 border border-slate-100 w-full py-3 rounded-xl mb-6">
            <p className="font-mono font-bold text-xl tracking-widest text-slate-900">{qrValue}</p>
          </div>

          <button 
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            <Download size={18} />
            Save QR Code
          </button>
        </div>
      </div>
    </div>
  );
}