import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const NetworkBanner: React.FC = () => {
  const { isOnline, hasReconnected } = useNetworkStatus();

  if (hasReconnected) {
    return (
      <div className="bg-emerald-600 text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-center gap-2 shadow-sm animate-fade-in transition-all">
        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
        <span>Koneksi internet kembali stabil. Data jawaban telah disinkronkan.</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="bg-amber-600 text-white px-4 py-2.5 text-xs md:text-sm font-medium flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-200 animate-pulse" />
          <span>
            <strong>⚠ Koneksi internet terputus!</strong> Jawaban tetap aman tersimpan di browser Anda dan akan otomatis disinkronkan saat terhubung kembali.
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs bg-amber-700/60 px-2.5 py-1 rounded">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Mencoba menghubungkan...</span>
        </div>
      </div>
    );
  }

  return null;
};
