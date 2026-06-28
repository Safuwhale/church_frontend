/**
 * SelfScanner Component
 * Captures venue poster QR codes for member self-check-in.
 * Uses @yudiel/react-qr-scanner for consistent scanning logic.
 */

import { Scanner } from '@yudiel/react-qr-scanner';
import { secureFetch } from '../api/api';

export default function SelfScanner({ onClose }) {

  /**
   * Processes the scanned Service ID.
   * Sends the ID to the /api/attendance/self-checkin endpoint.
   */
  const handleScan = async (result) => {
    if (result && result[0]?.rawValue) {
      const serviceId = result[0].rawValue;

      try {
        const response = await secureFetch('/api/attendance/self-checkin', {
          method: 'POST',
          body: JSON.stringify({ service_id: serviceId })
        });

        const data = await response.json();

        if (response.ok) {
          alert("Attendance logged successfully!");
          onClose();
        } else {
          alert(data.detail || "Check-in failed. Please try again.");
          onClose();
        }
      } catch (err) {
        console.error("Self-scan error:", err);
        alert("Network error. Please try again.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <h2 className="text-white font-bold mb-6">Scan Venue Poster</h2>
      
      <div className="w-full max-w-sm aspect-square overflow-hidden rounded-3xl border-4 border-emerald-500 shadow-2xl">
        <Scanner
          onResult={handleScan}
          onError={(error) => console.error(error)}
          options={{
            scanDelay: 500,
            constraints: { facingMode: 'environment' }
          }}
        />
      </div>
      
      <button 
        onClick={onClose}
        className="mt-8 px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors"
      >
        Close Scanner
      </button>
    </div>
  );
}