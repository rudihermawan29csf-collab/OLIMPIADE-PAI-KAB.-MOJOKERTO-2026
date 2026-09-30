import React from 'react';
import { AlertTriangle, ShieldAlert, XCircle } from 'lucide-react';

interface ViolationModalProps {
  isOpen: boolean;
  strikeNumber: number;
  message: string;
  isTerminated: boolean;
  onAcknowledge: () => void;
}

export const ViolationModal: React.FC<ViolationModalProps> = ({
  isOpen,
  strikeNumber,
  message,
  isTerminated,
  onAcknowledge,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 text-center relative overflow-hidden">
        {/* Top Accent Strip */}
        <div className={`absolute top-0 left-0 right-0 h-2 ${isTerminated ? 'bg-rose-600' : 'bg-amber-500'}`} />

        <div className="mx-auto w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-4 mt-2">
          {isTerminated ? (
            <XCircle className="w-10 h-10 text-rose-600 animate-pulse" />
          ) : strikeNumber === 2 ? (
            <ShieldAlert className="w-10 h-10 text-rose-500" />
          ) : (
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          )}
        </div>

        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
          isTerminated
            ? 'bg-rose-100 text-rose-700'
            : 'bg-amber-100 text-amber-800'
        }`}>
          {isTerminated ? 'Ujian Dihentikan' : `Peringatan Pelanggaran ${strikeNumber}/3`}
        </span>

        <h3 className="text-xl font-bold text-slate-900 mb-2">
          {isTerminated ? 'Pelanggaran Keamanan Fatal' : 'Aktivitas Terlarang Terdeteksi'}
        </h3>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          {message}
        </p>

        <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 text-left mb-6 border border-slate-200">
          <p className="font-semibold text-slate-700 mb-1">Ketentuan Integritas CBT:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Dilarang membuka tab/aplikasi lain selama ujian.</li>
            <li>Dilarang keluar dari mode layar penuh (fullscreen).</li>
            <li>Pelanggaran dicatat secara permanen ke server panitia.</li>
          </ul>
        </div>

        <button
          onClick={onAcknowledge}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-md ${
            isTerminated
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-[#087443] hover:bg-[#0B8F54] text-white'
          }`}
        >
          {isTerminated ? 'Lihat Hasil Akhir' : 'Saya Mengerti & Kembali ke Ujian'}
        </button>
      </div>
    </div>
  );
};
