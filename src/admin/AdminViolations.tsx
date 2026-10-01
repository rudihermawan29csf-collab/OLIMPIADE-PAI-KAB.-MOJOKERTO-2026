import React, { useState, useEffect } from 'react';
import { ViolationLog } from '../types';
import { storageService, subscribeToStore } from '../services/storageService';
import { sheetsSyncService } from '../services/sheetsSyncService';
import { sheetsExportService } from '../services/sheetsExportService';
import { useToast } from '../components/Toast';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Send,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Download
} from 'lucide-react';

export const AdminViolations: React.FC = () => {
  const { showToast } = useToast();
  const [violations, setViolations] = useState<ViolationLog[]>(() =>
    storageService.getViolations()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [copied, setCopied] = useState(false);

  // Subscribe ke perubahan data lokal
  useEffect(() => {
    const unsub = subscribeToStore(() => {
      setViolations(storageService.getViolations());
    });
    return () => unsub();
  }, []);

  // Tarik data pelanggaran terbaru dari Google Spreadsheet saat halaman dibuka & auto polling
  useEffect(() => {
    if (!sheetsSyncService.isConfigured()) return;

    sheetsSyncService.pullViolationsFromSheets().then((pulled) => {
      if (pulled && pulled.length > 0) {
        setViolations(storageService.getViolations());
      }
    }).catch(() => {});

    const timer = setInterval(() => {
      sheetsSyncService.pullViolationsFromSheets().then((pulled) => {
        if (pulled && pulled.length > 0) {
          setViolations(storageService.getViolations());
        }
      }).catch(() => {});
    }, 12000);

    return () => clearInterval(timer);
  }, []);

  const handleSyncToSheets = async () => {
    setIsSyncing(true);
    try {
      const current = storageService.getViolations();
      await sheetsSyncService.syncViolations(current);
      showToast(`${current.length} log pelanggaran berhasil dikirim ke Google Spreadsheet (Sheet: PELANGGARAN)!`, 'success');
    } catch {
      showToast('Gagal mengirim log pelanggaran ke Google Spreadsheet.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromSheets = async () => {
    setIsPulling(true);
    try {
      const pulled = await sheetsSyncService.pullViolationsFromSheets();
      if (pulled && pulled.length > 0) {
        setViolations(storageService.getViolations());
        showToast(`Berhasil memuat ${pulled.length} log pelanggaran dari Google Spreadsheet!`, 'success');
      } else {
        showToast('Data pelanggaran di Google Spreadsheet kosong atau belum ada kejadian baru.', 'info');
      }
    } catch {
      showToast('Gagal menarik log pelanggaran dari Google Spreadsheet.', 'error');
    } finally {
      setIsPulling(false);
    }
  };

  const handleCopyViolations = () => {
    if (navigator.clipboard) {
      const text = sheetsExportService.copyViolationsToClipboard();
      navigator.clipboard.writeText(text);
      setCopied(true);
      showToast('Data Pelanggaran berhasil disalin! Buka Google Sheets tab PELANGGARAN lalu tekan Ctrl+V', 'success');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const filtered = violations.filter((v) => {
    const matchSearch =
      v.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.detail && v.detail.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchType = typeFilter === 'ALL' || v.type === typeFilter;

    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>Log Audit Integritas & Anti-Curang</span>
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#EAF8F0] text-emerald-900 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Terkoneksi Sheet: PELANGGARAN</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Rekaman forensik insiden perpindahan tab, kehilangan fokus, keluar layar penuh. Terhubung langsung ke Google Spreadsheet.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={handlePullFromSheets}
            disabled={isPulling}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3 py-2 rounded-lg font-medium text-xs shadow-2xs transition cursor-pointer disabled:opacity-50"
            title="Tarik log pelanggaran dari Google Spreadsheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isPulling ? 'animate-spin' : ''}`} />
            <span>{isPulling ? 'Menarik...' : 'Tarik dari Sheets'}</span>
          </button>

          <button
            type="button"
            onClick={handleSyncToSheets}
            disabled={isSyncing}
            className="flex items-center gap-1.5 bg-rose-700 hover:bg-rose-800 text-white px-3 py-2 rounded-lg font-medium text-xs shadow-2xs transition cursor-pointer disabled:opacity-50"
            title="Kirim seluruh log pelanggaran ke Google Spreadsheet"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSyncing ? 'Mengirim...' : 'Kirim ke Sheets'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyViolations}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3 py-2 rounded-lg font-medium text-xs shadow-2xs transition cursor-pointer"
            title="Salin data pelanggaran untuk ditempel (Ctrl+V) di Google Sheets"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Disalin!' : 'Salin (Ctrl+V)'}</span>
          </button>
        </div>
      </div>

      {/* Info Live Autosync Banner */}
      <div className="bg-[#FAFDFB] p-3.5 rounded-xl border border-emerald-900/15 flex items-center justify-between gap-3 text-xs text-slate-700 flex-wrap">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Sistem Auto-Sync:</strong> Setiap siswa yang terkena strike pelanggaran otomatis dilaporkan langsung ke Google Spreadsheet pada sheet <code>PELANGGARAN</code>.
          </span>
        </div>
        <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
          Total Terdata: {violations.length} Kejadian
        </span>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3.5 rounded-xl border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari peserta, sekolah, detail..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-[#087443]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:outline-none focus:border-[#087443]"
          >
            <option value="ALL">Semua Jenis Pelanggaran</option>
            <option value="TAB_SWITCH">TAB_SWITCH (Pindah Tab / Minimize)</option>
            <option value="BLUR">BLUR (Hilang Fokus Jendela)</option>
            <option value="FULLSCREEN_EXIT">FULLSCREEN_EXIT (Keluar Layar Penuh)</option>
            <option value="KEY_SHORTCUT">KEY_SHORTCUT (Shortcut Keyboard Terlarang)</option>
            <option value="DEVTOOLS">DEVTOOLS (F12 / Console)</option>
          </select>
        </div>
      </div>

      {/* Violations List */}
      <div className="bg-white rounded-xl border border-emerald-950/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF8] border-b border-slate-200 text-slate-700 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-3.5 w-12 text-center">No</th>
                <th className="py-3 px-3.5">Waktu Insiden</th>
                <th className="py-3 px-3.5">Nama Peserta</th>
                <th className="py-3 px-3.5">Asal Sekolah</th>
                <th className="py-3 px-3.5 text-center">Strike</th>
                <th className="py-3 px-3.5">Tipe Pelanggaran</th>
                <th className="py-3 px-3.5">Keterangan Forensik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    Tidak ada log pelanggaran tercatat. Seluruh peserta mematuhi tata tertib CBT.
                  </td>
                </tr>
              ) : (
                filtered.map((v, index) => {
                  let typeBadge = 'bg-amber-50 text-amber-900 border border-amber-200';
                  if (v.type === 'FULLSCREEN_EXIT') typeBadge = 'bg-rose-50 text-rose-900 border border-rose-200';
                  if (v.type === 'DEVTOOLS') typeBadge = 'bg-purple-50 text-purple-900 border border-purple-200';

                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3.5 text-center font-mono text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-xs text-slate-600">
                        {new Date(v.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-900">
                        {v.participantName}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        {v.schoolName}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`font-mono font-medium px-2 py-0.5 rounded text-[11px] ${
                            v.violationNumber >= 3
                              ? 'bg-rose-50 text-rose-800 border border-rose-300 font-bold'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          Strike {v.violationNumber}/3
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono font-medium text-xs">
                        <span className={`px-2 py-0.5 rounded ${typeBadge}`}>
                          {v.type}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 text-xs">
                        {v.detail || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
