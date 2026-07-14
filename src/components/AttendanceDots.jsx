export default function AttendanceDots({ history = [] }) {
  // Ensure we always have exactly 7 slots to match your sketch.
  // If the backend sends fewer than 7, we pad the start with 'no_service' (empty circles).
  const paddedHistory = [...history];
  while (paddedHistory.length < 7) {
    paddedHistory.unshift('no_service');
  }
  
  // Grab only the last 7 to be safe
  const last7 = paddedHistory.slice(-7);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5" title="Last 7 Services">
        {last7.map((status, index) => {
          let styles = "w-3 h-3 rounded-full transition-all ";
          
          if (status === 'attended' || status === 'present') {
            styles += "bg-emerald-500 shadow-sm shadow-emerald-500/40"; // Solid Green
          } else if (status === 'absent') {
            styles += "bg-rose-500 shadow-sm shadow-rose-500/40"; // Solid Red
          } else {
            styles += "border-[1.5px] border-slate-300 bg-transparent"; // No color / Hollow
          }

          return <div key={index} className={styles} />;
        })}
      </div>
      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Last 7 Weeks</span>
    </div>
  );
}