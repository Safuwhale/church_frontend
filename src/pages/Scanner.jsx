import { useState, useRef, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { UserCheck, CheckCircle2, AlertCircle, Volume2, VolumeX, Keyboard, QrCode, Search, X, Info } from 'lucide-react'; // Added Info
import { useNavigate, useParams } from 'react-router-dom'; // Added useParams
import { secureFetch } from '../api/api';
import { submitAttendanceCheckIn } from '../api/attendance';

export default function UsherScanner() {
  const navigate = useNavigate();
  const { id: serviceId } = useParams(); // Extract service ID from URL

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

    // Security Guard: Prevent accessing scanner without a selected service
    if (!serviceId) {
      navigate('/usher-dashboard');
    }
  }, [navigate, serviceId]);

  // Added 'exists' to potential scan states
  const [scanState, setScanState] = useState('idle');
  const [lastScannedId, setLastScannedId] = useState('');
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [soundEnabled, setSoundEnabled] = useState(true); 
  const [inputMode, setInputMode] = useState('scan');
  const [scannerKey, setScannerKey] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [recentServiceScans, setRecentServiceScans] = useState([]);
  
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

  useEffect(() => {
    const loadRecentScans = async () => {
      if (!serviceId) return;

      try {
        const response = await secureFetch(`/api/attendance/services/${serviceId}/my-scans`);
        if (response.ok) {
          const data = await response.json();
          setRecentServiceScans(data.scans || []);
        }
      } catch (error) {
        console.error('Failed to load recent scans:', error);
      }
    };

    void loadRecentScans();
  }, [serviceId]);

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
        
        setRecentCheckIns(prev => [
          { 
            id: Date.now(), 
            serial_number: qrValue.toUpperCase(), 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          },
          ...prev
        ].slice(0, 5));
        
        setSearchQuery('');
        setSelectedMember(null);
      } else {
        const msg = data?.detail || "Invalid Check-in";
        
        // Detect duplicate check-in from backend response
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
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
      <header className="p-4 md:p-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-display font-bold text-slate-900 text-sm">
            H
          </div>
          <span className="font-display font-bold text-white tracking-wider">HORYC Gate</span>
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
            onClick={() => {
              localStorage.removeItem('horyc_token');
              localStorage.removeItem('horyc_role');
              localStorage.removeItem('horyc_name');
              localStorage.removeItem('horyc_id');
              navigate('/usher-dashboard', { replace: true });
            }}
            className="p-2 md:px-4 md:py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <span className="hidden sm:inline">End Shift</span>
            <X size={18} className="sm:hidden" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row p-6 gap-6 max-w-6xl mx-auto w-full">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-6">
            <h1 className="font-display text-3xl font-bold mb-2">Gate Check-in</h1>
            
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

          <div className={`relative w-full max-w-md aspect-square rounded-3xl overflow-hidden border-4 transition-colors duration-300 shadow-2xl bg-slate-950 flex flex-col items-center justify-center ${
            scanState === 'success' ? 'border-emerald-500 shadow-emerald-500/20' : 
            scanState === 'exists' ? 'border-amber-500 shadow-amber-500/20' : 
            scanState === 'error' ? 'border-red-500 shadow-red-500/20' : 
            'border-slate-700 shadow-black/50'
          }`}>
            
            {inputMode === 'scan' && (
              <Scanner 
                key={scannerKey}
                onScan={handleScan}
                formats={['qr_code']}
                sound={false}
                components={{ tracker: true }}
                styles={{ container: { width: '100%', height: '100%' }, video: { objectFit: 'cover' } }}
              />
            )}

            {inputMode === 'manual' && (
              <div className="w-full h-full p-6 flex flex-col relative bg-slate-900">
                {!selectedMember ? (
                  <>
                    <h3 className="text-lg font-bold mb-4 text-center">Lookup Member</h3>
                    <div className="relative">
                      <Search className="absolute left-4 top-3.5 text-slate-500" size={20} />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search name, phone, or ID..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                        autoFocus
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>

                    <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {isSearching && <p className="text-center text-slate-500 mt-4 text-sm animate-pulse">Searching...</p>}
                      {!isSearching && searchQuery && searchResults.length === 0 && (
                        <p className="text-center text-slate-500 mt-4 text-sm">No members found.</p>
                      )}
                      {!isSearching && searchResults.map(member => (
                        <button
                          key={member.serial_number}
                          onClick={() => setSelectedMember(member)}
                          className="w-full text-left p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-blue-500 hover:bg-slate-800/80 transition-all flex items-center justify-between group"
                        >
                          <div>
                            <p className="font-bold text-white group-hover:text-blue-400 transition-colors">
                              {member.first_name} {member.last_name}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">{member.phone_number}</p>
                          </div>
                          <span className="font-mono text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded-md border border-slate-700">
                            {member.serial_number}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-5 border-t border-slate-800 pt-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Recent scans for this service</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                        {recentServiceScans.map((scan) => (
                          <div key={scan.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm">
                            <div>
                              <p className="font-medium text-white">{scan.first_name} {scan.last_name}</p>
                              <p className="text-xs text-slate-400 font-mono">{scan.serial_number}</p>
                            </div>
                            <span className="text-xs text-slate-400">
                              {new Date(scan.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                        {recentServiceScans.length === 0 && (
                          <p className="text-sm text-slate-500">No scans recorded for this service yet.</p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full animate-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-4 border border-blue-500/30">
                      <UserCheck size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white text-center">Confirm Check-in</h3>
                    <div className="bg-slate-800 w-full p-4 rounded-xl border border-slate-700 mt-4 mb-6 text-center">
                      <p className="text-2xl font-bold text-blue-400 mb-1">{selectedMember.first_name} {selectedMember.last_name}</p>
                      <p className="font-mono text-slate-400">{selectedMember.serial_number}</p>
                    </div>
                    
                    <div className="flex gap-3 w-full">
                      <button 
                        onClick={() => setSelectedMember(null)}
                        className="flex-1 py-3 rounded-xl font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => processCheckIn(selectedMember.serial_number, 'MANUAL')}
                        disabled={isProcessing}
                        className="flex-1 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
                      >
                        Check In
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {scanState === 'success' && (
              <div className="absolute inset-0 bg-emerald-500/90 flex flex-col items-center justify-center z-20 backdrop-blur-sm animate-in fade-in duration-200">
                <CheckCircle2 size={64} className="text-white mb-4" />
                <h3 className="text-2xl font-bold text-white mb-1">Access Granted</h3>
                <p className="text-emerald-100 font-mono text-lg">{lastScannedId}</p>
              </div>
            )}

            {/* NEW: Amber "Exists" Overlay */}
            {scanState === 'exists' && (
              <div className="absolute inset-0 bg-amber-500/90 flex flex-col items-center justify-center z-20 backdrop-blur-sm animate-in fade-in duration-200 text-center px-4">
                <Info size={64} className="text-white mb-4" />
                <h3 className="text-2xl font-bold text-white mb-1">Already Checked In</h3>
                <p className="text-amber-100">{lastScannedId}</p>
              </div>
            )}

            {scanState === 'error' && (
              <div className="absolute inset-0 bg-red-600/90 flex flex-col items-center justify-center z-20 backdrop-blur-sm animate-in fade-in duration-200 text-center px-4">
                <AlertCircle size={64} className="text-white mb-4" />
                <h3 className="text-2xl font-bold text-white mb-1">Error</h3>
                <p className="text-red-200">{errorMessage}</p>
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
                    <p className="font-mono text-emerald-400 font-bold tracking-wider text-sm">{record.serial_number}</p>
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