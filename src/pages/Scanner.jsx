import { ScanLine } from 'lucide-react';

export default function Scanner() {
  return (
    <div className="min-h-screen p-6 bg-slate-900 text-white">
      <div className="max-w-md mx-auto mt-10 text-center">
        <h1 className="font-display text-2xl font-bold mb-2">Scanner</h1>
        <p className="text-slate-400 mb-8">Point camera at Member's QR code</p>
        
        <div className="w-full aspect-square bg-slate-800 rounded-3xl flex items-center justify-center border-2 border-brand-blue border-dashed">
          <ScanLine size={64} className="text-brand-blue opacity-50" />
        </div>
      </div>
    </div>
  );
}