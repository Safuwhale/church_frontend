import { useState, useRef, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { UserCheck, CheckCircle2, AlertCircle, Volume2, VolumeX, Keyboard, QrCode, Search, X, Info } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { secureFetch } from '../api/api';
import { submitAttendanceCheckIn } from '../api/attendance';

export default function UsherScanner() {
  const navigate = useNavigate();
  const { id: serviceId } = useParams();

  useEffect(() => {
    const token = localStorage.getItem('horyc_token');
    const role = localStorage.getItem('horyc_role');
    
    if (!token) {
      navigate('/login');
      return;
    }

    if (role !== 'usher' && role !== 'hod') {
      navigate('/portal');
      return;
    }

    if (!serviceId) {
      navigate('/usher-dashboard');
    }
  }, [navigate, serviceId]);

  const [scanState, setScanState] = useState('idle');
  const [lastScannedId, setLastScannedId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [soundEnabled, setSoundEnabled] = useState(true); 
  const [inputMode, setInputMode] = useState('scan');
  const [scannerKey, setScannerKey] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const soundEnabledRef = useRef(true); 
  const isProcessingRef = useRef(false);

  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    soundEnabledRef.current = newState;
  };

  const playSuccessSound = () => {
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
      console.warn("Audio playback failed", error);
    }
  };

  // Live Omni-Search Integration
  useEffect(() => {
    if (!searchQuery.trim()) {
      const resetTimer = setTimeout(() => setSearchResults([]), 0);
      return () => clearTimeout(resetTimer);
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await secureFetch(`/api/users/search?q=${searchQuery}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        } else {
            console.error("Search API returned an error:", res.status);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const processCheckIn = async (qrValue, checkInMethod = 'QR_SCAN') => {
    if (isProcessingRef.current || !qrValue) return;
    
    isProcessingRef.current = true;
    setIsProcessing(true);
    setLastScannedId(qrValue);

    try {
      const { response, data } = await submitAttendanceCheckIn('/api/attendance/scan', {
        serial_number: qrValue,
        service_id: serviceId,
        check_in_method: checkInMethod
      });

      if (response.ok) {
        setScanState('success');
        playSuccessSound(); 
        
        setSearchQuery('');
        setSelectedMember(null);
      } else {
        const msg = data?.detail || "Invalid Check-in";
        
        if (msg.toLowerCase().includes("already")) {
          setScanState('exists');
          setErrorMessage("Member already checked in");
        } else {
          setScanState('error');
          setErrorMessage(msg);
        }
      }
    } catch (error) {
      console.error("Check-in error:", error);
      setErrorMessage("Network Error");
      setScanState('error');
    } finally {
      setTimeout(() => {
        setScanState('idle');
        setLastScannedId('');
        setErrorMessage('');
        isProcessingRef.current = false;
        setIsProcessing(false);
        setScannerKey((key) => key + 1);
      }, 2500);
    }
  };

  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      processCheckIn(detectedCodes[0].rawValue, 'QR_SCAN');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-900 text-white flex flex-col font-sans overflow-hidden">
      
      {/* HEADER */}
      <header className="p-4 md:p-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-display font-bold text-slate-900 text-sm">
            H
          </div>
          <span className="font-display font-bold text-white tracking-wider">HORYC</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm px-3 py-1.5 bg-emerald-400/10 rounded-full border border-emerald-400/20 mr-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">Scanner Active</span>
          </div>

          <button 
            onClick={handleToggleSound}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-center text-slate-300"
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 size={18} className="text-emerald-400" /> : <VolumeX size={18} className="text-slate-500" />}
          </button>

          <button 
            onClick={() => navigate('/usher-dashboard', { replace: true })}
            className="p-2 md:px-4 md:py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <span className="hidden sm:inline">Close Scanner</span>
            <X size={18} className="sm:hidden" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col p-4 md:p-6 gap-6 max-w-2xl mx-auto w-full h-full overflow-hidden">
        
        <div className="text-center shrink-0">
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">Service Check-in</h1>
          
          <div className="flex items-center justify-center gap-2 mt-4 bg-slate-800 p-1 rounded-xl w-fit mx-auto border border-slate-700">
            <button 
              onClick={() => { setInputMode('scan'); setSelectedMember(null); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${inputMode === 'scan' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              <QrCode size={16} /> QR Scan
            </button>
            <button 
              onClick={() => setInputMode('manual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${inputMode === 'manual' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              <Keyboard size={16} /> Manual Entry
            </button>
          </div>
        </div>

        {/* CONTAINER */}
        <div className={`relative w-full flex-1 rounded-3xl overflow-hidden border transition-colors duration-300 shadow-2xl bg-slate-900 flex flex-col min-h-[350px] ${
          scanState === 'success' ? 'border-emerald-500 bg-emerald-500/10' : 
          scanState === 'exists' ? 'border-amber-500 bg-amber-500/10' : 
          scanState === 'error' ? 'border-red-500 bg-red-500/10' : 
          'border-slate-700'
        }`}>
          
          {/* CAMERA MODE (Centered Box instead of full screen) */}
          {inputMode === 'scan' && (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <div className="w-full max-w-sm aspect-square rounded-3xl overflow-hidden border-2 border-slate-700 bg-black shadow-inner relative">
                <Scanner 
                  key={scannerKey}
                  onScan={handleScan}
                  formats={['qr_code']}
                  sound={false}
                  components={{ tracker: true }}
                  styles={{ container: { width: '100%', height: '100%' }, video: { objectFit: 'cover' } }}
                />
              </div>
            </div>
          )}

          {/* MANUAL LOOKUP MODE */}
          {inputMode === 'manual' && (
            <div className="w-full h-full p-4 md:p-6 flex flex-col">
              {!selectedMember ? (
                <>
                  <h3 className="text-lg font-bold mb-4 text-center shrink-0">Search Member</h3>
                  
                  {/* Search Bar sits at the top */}
                  <div className="relative shrink-0 z-10">
                    <Search className="absolute left-4 top-3.5 text-slate-500" size={20} />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search name, phone, or ID..."
                      className="w-full pl-12 pr-10 py-3 rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all text-sm md:text-base shadow-sm"
                      autoFocus
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 bg-slate-700 rounded-md p-0.5 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Flowing Animation for Results Container */}
                  <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar animate-in fade-in slide-in-from-top-4 duration-500 ease-out">
                    {isSearching && <p className="text-center text-slate-500 mt-4 text-sm animate-pulse">Searching...</p>}
                    {!isSearching && searchQuery && searchResults.length === 0 && (
                      <p className="text-center text-slate-500 mt-4 text-sm">No members found.</p>
                    )}
                    
                    {!isSearching && searchResults.map(member => (
                      <button
                        key={member.serial_number}
                        onClick={() => setSelectedMember(member)}
                        className="w-full text-left p-3 md:p-4 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 transition-all flex items-center justify-between group shadow-sm"
                      >
                        <div>
                          <p className="font-bold text-white text-sm md:text-base group-hover:text-blue-400 transition-colors">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-[11px] md:text-xs text-slate-400 mt-0.5">{member.phone_number}</p>
                        </div>
                        <span className="font-mono text-[10px] md:text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded-md border border-slate-700">
                          {member.serial_number}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                /* CONFIRMATION SCREEN (Properly Centered) */
                <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-4 border border-blue-500/30">
                    <UserCheck size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white text-center">Confirm Check-in</h3>
                  <div className="bg-slate-800 w-full p-4 rounded-xl border border-slate-700 mt-4 mb-6 text-center shadow-inner">
                    <p className="text-xl md:text-2xl font-bold text-blue-400 mb-1">{selectedMember.first_name} {selectedMember.last_name}</p>
                    <p className="font-mono text-sm text-slate-400">{selectedMember.serial_number}</p>
                  </div>
                  
                  <div className="flex gap-3 w-full max-w-sm">
                    <button 
                      onClick={() => setSelectedMember(null)}
                      className="flex-1 py-3.5 rounded-xl font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 text-sm md:text-base"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => processCheckIn(selectedMember.serial_number, 'MANUAL')}
                      disabled={isProcessing}
                      className="flex-1 py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20 text-sm md:text-base"
                    >
                      Check In
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OVERLAY: SUCCESS */}
          {scanState === 'success' && (
            <div className="absolute inset-0 bg-emerald-500/95 flex flex-col items-center justify-center z-20 backdrop-blur-sm animate-in fade-in duration-200">
              <CheckCircle2 size={72} className="text-white mb-4" />
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Access Granted</h3>
              <p className="text-emerald-100 font-mono text-lg md:text-xl bg-emerald-600/50 px-4 py-1.5 rounded-lg border border-emerald-400/50">{lastScannedId}</p>
            </div>
          )}

          {/* OVERLAY: ALREADY SCANNED */}
          {scanState === 'exists' && (
            <div className="absolute inset-0 bg-amber-500/95 flex flex-col items-center justify-center z-20 backdrop-blur-sm animate-in fade-in duration-200 text-center px-4">
              <Info size={72} className="text-white mb-4" />
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Already Checked In</h3>
              <p className="text-amber-100 font-mono text-lg bg-amber-600/50 px-4 py-1.5 rounded-lg border border-amber-400/50">{lastScannedId}</p>
            </div>
          )}

          {/* OVERLAY: ERROR */}
          {scanState === 'error' && (
            <div className="absolute inset-0 bg-red-600/95 flex flex-col items-center justify-center z-20 backdrop-blur-sm animate-in fade-in duration-200 text-center px-4">
              <AlertCircle size={72} className="text-white mb-4" />
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Error</h3>
              <p className="text-red-100 font-medium text-lg bg-red-700/50 px-4 py-1.5 rounded-lg border border-red-500/50">{errorMessage}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}