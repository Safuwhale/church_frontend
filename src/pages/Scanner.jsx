import { useState, useRef, useMemo } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { ArrowLeft, UserCheck, CheckCircle2, AlertCircle, Volume2, VolumeX, Keyboard, QrCode, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// MOCK DATABASE: Simulating the youth directory
const MOCK_DIRECTORY = [
  { horycId: 'HORYC-001', firstName: 'Daniel', lastName: 'Okafor', phone: '08011112222', role: 'member' },
  { horycId: 'HORYC-012', firstName: 'Sarah', lastName: 'Ibrahim', phone: '08033334444', role: 'usher' },
  { horycId: 'HORYC-008', firstName: 'Michael', lastName: 'Johnson', phone: '08055556666', role: 'leader' },
  { horycId: 'HORYC-089', firstName: 'Grace', lastName: 'Emmanuel', phone: '08077778888', role: 'member' },
  { horycId: 'HORYC-105', firstName: 'Danielle', lastName: 'Peters', phone: '08099990000', role: 'member' },
];

export default function UsherScanner() {
  const navigate = useNavigate();
  const [scanState, setScanState] = useState('idle');
  const [lastScannedId, setLastScannedId] = useState('');
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  
  const [soundEnabled, setSoundEnabled] = useState(true); 
  const [inputMode, setInputMode] = useState('scan');
  
  // Omni-Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  
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
      console.log("Audio playback failed");
    }
  };

  const processCheckIn = (qrValue) => {
    if (isProcessingRef.current || !qrValue) return;
    
    isProcessingRef.current = true;
    setLastScannedId(qrValue);

    console.log("Sending to backend:", qrValue);

    setTimeout(() => {
      if (qrValue.toUpperCase().startsWith('HORYC-')) {
        setScanState('success');
        playSuccessSound(); 
        
        setRecentCheckIns(prev => [
          { id: Date.now(), horycId: qrValue.toUpperCase(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          ...prev
        ].slice(0, 5));
        
        // Reset manual states
        setSearchQuery('');
        setSelectedMember(null);
      } else {
        setScanState('error');
      }

      setTimeout(() => {
        setScanState('idle');
        setLastScannedId('');
        isProcessingRef.current = false;
      }, 2500);

    }, 500);
  };

  const handleScan = (detectedCodes) => {
    if (detectedCodes.length > 0) {
      processCheckIn(detectedCodes[0].rawValue);
    }
  };

  // Omni-Search Filter Logic
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return MOCK_DIRECTORY.filter(member => 
      member.firstName.toLowerCase().includes(query) ||
      member.lastName.toLowerCase().includes(query) ||
      member.phone.includes(query) ||
      member.horycId.toLowerCase().includes(query)
    );
  }, [searchQuery]);

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
            onClick={handleToggleSound}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium text-slate-300"
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
        
        {/* LEFT SIDE: Viewport Area */}
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
            scanState === 'error' ? 'border-red-500 shadow-red-500/20' : 
            'border-slate-700 shadow-black/50'
          }`}>
            
            {/* SCAN MODE */}
            {inputMode === 'scan' && (
              <Scanner 
                onScan={handleScan}
                formats={['qr_code']}
                sound={false}
                components={{ tracker: true }}
                styles={{ container: { width: '100%', height: '100%' }, video: { objectFit: 'cover' } }}
              />
            )}

            {/* MANUAL MODE (OMNI-SEARCH) */}
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

                    {/* Search Results Dropdown */}
                    <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {searchQuery && searchResults.length === 0 && (
                        <p className="text-center text-slate-500 mt-4 text-sm">No members found.</p>
                      )}
                      {searchResults.map(member => (
                        <button
                          key={member.horycId}
                          onClick={() => setSelectedMember(member)}
                          className="w-full text-left p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-brand-blue hover:bg-slate-800/80 transition-all flex items-center justify-between group"
                        >
                          <div>
                            <p className="font-bold text-white group-hover:text-brand-blue transition-colors">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">{member.phone}</p>
                          </div>
                          <span className="font-mono text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded-md border border-slate-700">
                            {member.horycId}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  /* CONFIRMATION CARD */
                  <div className="flex flex-col items-center justify-center h-full animate-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 bg-blue-500/20 text-brand-blue rounded-full flex items-center justify-center mb-4 border border-blue-500/30">
                      <UserCheck size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white text-center">Confirm Check-in</h3>
                    <div className="bg-slate-800 w-full p-4 rounded-xl border border-slate-700 mt-4 mb-6 text-center">
                      <p className="text-2xl font-bold text-brand-blue mb-1">{selectedMember.firstName} {selectedMember.lastName}</p>
                      <p className="font-mono text-slate-400">{selectedMember.horycId}</p>
                    </div>
                    
                    <div className="flex gap-3 w-full">
                      <button 
                        onClick={() => setSelectedMember(null)}
                        className="flex-1 py-3 rounded-xl font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => processCheckIn(selectedMember.horycId)}
                        disabled={isProcessingRef.current}
                        className="flex-1 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
                      >
                        Check In
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* OVERLAYS */}
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

        {/* RIGHT SIDE: Recent Activity Log */}
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