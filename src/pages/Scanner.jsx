import { useState, useRef, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { ArrowLeft, UserCheck, CheckCircle2, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UsherScanner() {
  const navigate = useNavigate();
  const [scanState, setScanState] = useState('idle');
  const [lastScannedId, setLastScannedId] = useState('');
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  
  // UI State for the button
  const [soundEnabled, setSoundEnabled] = useState(true); 
  
  // Ref for the background memory (bypasses stale closures)
  const soundEnabledRef = useRef(true); 
  const isScanningRef = useRef(false);

  // Sync the Ref whenever the toggle is clicked
  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    soundEnabledRef.current = newState;
  };

  const playSuccessSound = () => {
    // Read from the Ref instead of the State!
    if (!soundEnabledRef.current) return; 
    
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (error) {
      console.log("Audio playback failed");
    }
  };

  const handleScan = (detectedCodes) => {
    if (isScanningRef.current || detectedCodes.length === 0) return;
    
    const qrValue = detectedCodes[0].rawValue;
    
    isScanningRef.current = true;
    setLastScannedId(qrValue);

    console.log("Sending to backend:", qrValue);

    setTimeout(() => {
      if (qrValue.startsWith('HORYC-')) {
        setScanState('success');
        playSuccessSound(); // Now this accurately checks the Ref
        
        setRecentCheckIns(prev => [
          { id: Date.now(), horycId: qrValue, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          ...prev
        ].slice(0, 5));
      } else {
        setScanState('error');
      }

      setTimeout(() => {
        setScanState('idle');
        setLastScannedId('');
        isScanningRef.current = false;
      }, 2500);

    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
      
      <header className="p-4 md:p-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-10">
        <button 
          onClick={() => navigate('/dashboard')}
          className="p-2 md:px-4 md:py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">Back to Dashboard</span>
        </button>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleToggleSound} // Use our new handler here!
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium text-slate-300"
            title={soundEnabled ? "Mute scanner sounds" : "Enable scanner sounds"}
          >
            {soundEnabled ? <Volume2 size={18} className="text-emerald-400" /> : <VolumeX size={18} className="text-slate-500" />}
          </button>

          <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm px-3 py-1.5 bg-emerald-400/10 rounded-full border border-emerald-400/20">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            Scanner Active
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row p-6 gap-6 max-w-6xl mx-auto w-full">
        
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-6">
            <h1 className="font-display text-3xl font-bold mb-2">Gate Check-in</h1>
            <p className="text-slate-400">Position the youth's QR code inside the frame</p>
          </div>

          <div className={`relative w-full max-w-md aspect-square rounded-3xl overflow-hidden border-4 transition-colors duration-300 shadow-2xl ${
            scanState === 'success' ? 'border-emerald-500 shadow-emerald-500/20' : 
            scanState === 'error' ? 'border-red-500 shadow-red-500/20' : 
            'border-slate-700 shadow-black/50'
          }`}>
            
            <Scanner 
              onScan={handleScan}
              formats={['qr_code']}
              sound={false}
              components={{
                audio: false, 
                tracker: true, 
              }}
              styles={{
                container: { width: '100%', height: '100%' },
                video: { objectFit: 'cover' }
              }}
            />

            {scanState === 'success' && (
              <div className="absolute inset-0 bg-emerald-500/90 flex flex-col items-center justify-center z-20 backdrop-blur-sm animate-in fade-in duration-200">
                <CheckCircle2 size={64} className="text-white mb-4" />
                <h3 className="text-2xl font-bold text-white mb-1">Access Granted</h3>
                <p className="text-emerald-100 font-mono text-lg">{lastScannedId}</p>
              </div>
            )}

            {scanState === 'error' && (
              <div className="absolute inset-0 bg-red-600/90 flex flex-col items-center justify-center z-20 backdrop-blur-sm animate-in fade-in duration-200">
                <AlertCircle size={64} className="text-white mb-4" />
                <h3 className="text-2xl font-bold text-white mb-1">Invalid Code</h3>
                <p className="text-red-200">Please try again</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-80 bg-slate-800 rounded-3xl p-6 border border-slate-700 h-fit">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700">
            <UserCheck className="text-emerald-400" size={24} />
            <h2 className="font-display text-xl font-bold">Recent Scans</h2>
          </div>

          <div className="space-y-3">
            {recentCheckIns.length === 0 ? (
              <p className="text-slate-500 text-center py-10 text-sm">Waiting for first scan...</p>
            ) : (
              recentCheckIns.map((record) => (
                <div key={record.id} className="bg-slate-700/50 p-3.5 rounded-xl border border-slate-600 flex items-center justify-between animate-in slide-in-from-left-4 duration-300">
                  <div>
                    <p className="font-mono text-emerald-400 font-bold tracking-wider text-sm">{record.horycId}</p>
                  </div>
                  <span className="text-xs text-slate-400 font-medium bg-slate-800 px-2 py-1 rounded-md">
                    {record.time}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}