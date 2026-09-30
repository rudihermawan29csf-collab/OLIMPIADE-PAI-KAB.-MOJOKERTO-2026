import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { excelUtils } from '../utils/excelUtils';
import { sheetsSyncService } from '../services/sheetsSyncService';
import { sheetsExportService } from '../services/sheetsExportService';
import { useToast } from '../components/Toast';
import {
  Award,
  Printer,
  Search,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Send,
  Copy
} from 'lucide-react';

export const AdminResults: React.FC = () => {
  const { showToast } = useToast();
  const activeExam = storageService.getActiveExam();
  const schools = storageService.getSchools();
  const results = storageService.getResults(activeExam?.id);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Sort descending by score, then ascending by duration
  const sorted = [...results].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.durationSeconds - b.durationSeconds;
  });

  const filtered = sorted.filter((r) => {
    const matchSearch =
      r.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.participantNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.schoolName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchSchool =
      selectedSchool === 'ALL' || r.schoolName === selectedSchool;

    const matchStatus =
      statusFilter === 'ALL' || r.status === statusFilter;

    return matchSearch && matchSchool && matchStatus;
  });

  const handleExportExcel = () => {
    try {
      excelUtils.exportResultsToExcel(
        filtered,
        activeExam?.title || 'Olimpiade PAI Mojokerto'
      );
      showToast('Rekap nilai dan peringkat berhasil diekspor ke Excel!', 'success');
    } catch (e) {
      showToast('Gagal mengekspor hasil ke Excel.', 'error');
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncToSheets = async () => {
    setIsSyncing(true);
    try {
      const participants = storageService.getParticipants();
      const allResults = storageService.getResults();
      const exams = storageService.getExams();
      const questions = storageService.getQuestions();

      await sheetsSyncService.exportAll({
        participants,
        results: allResults,
        exams,
        questions,
      });
      showToast(`${results.length} data hasil ujian & bank soal berhasil dikirim ke Google Spreadsheet!`, 'success');
    } catch {
      showToast('Gagal mengirim data ke Google Spreadsheet.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyResults = () => {
    if (navigator.clipboard) {
      const text = sheetsExportService.copyResultsToClipboard();
      navigator.clipboard.writeText(text);
      showToast('Data Hasil Ujian disalin! Buka Google Sheets tab HASIL_UJIAN lalu tekan Ctrl+V', 'success');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#087443]" />
            <span>Hasil & Peringkat Peserta</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Rekapitulasi otomatis skor CBT: Benar / Total × 100 dengan verifikasi kombinasi PG & PGK.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={handleCopyResults}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer"
            title="Salin tabel hasil ujian ke clipboard untuk di-paste langsung (Ctrl+V) ke Google Sheets"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Salin (Ctrl+V)</span>
          </button>

          <button
            type="button"
            onClick={handleSyncToSheets}
            disabled={isSyncing}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
            title="Kirim semua data hasil ujian ke Google Spreadsheet via Web App"
          >
            <Send className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isSyncing ? 'Mengirim...' : 'Kirim ke Spreadsheet'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Cetak / PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 bg-[#087443] hover:bg-[#065b34] text-white px-3.5 py-2 rounded-lg text-xs font-medium transition shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-300" />
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3.5 rounded-xl border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama siswa, nomor peserta..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-[#087443]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
          <select
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:outline-none focus:border-[#087443]"
          >
            <option value="ALL">Semua Sekolah Peserta</option>
            {schools.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:outline-none focus:border-[#087443]"
          >
            <option value="ALL">Semua Status</option>
            <option value="completed">Selesai Normal</option>
            <option value="violated">Diskualifikasi</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-emerald-950/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF8] border-b border-slate-200 text-slate-700 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-3.5 w-12 text-center">Rank</th>
                <th className="py-3 px-3.5">Nama Peserta</th>
                <th className="py-3 px-3.5">Sekolah Asal</th>
                <th className="py-3 px-3.5">Nomor Peserta</th>
                <th className="py-3 px-3.5 text-center">Benar</th>
                <th className="py-3 px-3.5 text-center">Salah</th>
                <th className="py-3 px-3.5 text-center">Kosong</th>
                <th className="py-3 px-3.5 text-center">Nilai Akhir</th>
                <th className="py-3 px-3.5 text-center">Durasi</th>
                <th className="py-3 px-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400 text-xs">
                    Belum ada hasil ujian yang terkumpul.
                  </td>
                </tr>
              ) : (
                filtered.map((r, index) => {
                  const m = Math.floor(r.durationSeconds / 60);
                  const s = r.durationSeconds % 60;
                  const isTop3 = index < 3 && r.status === 'completed';

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isTop3 ? 'bg-[#EAF8F0]/30' : ''
                      }`}
                    >
                      <td className="py-3 px-3.5 text-center">
                        {isTop3 ? (
                          <span
                            className={`w-5 h-5 rounded inline-flex items-center justify-center font-bold text-xs text-white ${
                              index === 0
                                ? 'bg-amber-500'
                                : index === 1
                                ? 'bg-slate-500'
                                : 'bg-amber-700'
                            }`}
                          >
                            {index + 1}
                          </span>
                        ) : (
                          <span className="font-mono text-slate-400">{index + 1}</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-900">
                        {r.participantName}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        {r.schoolName}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-800">
                        {r.participantNumber}
                      </td>
                      <td className="py-3 px-3.5 text-center font-medium text-emerald-800 font-mono">
                        {r.correctCount}
                      </td>
                      <td className="py-3 px-3.5 text-center font-medium text-rose-700 font-mono">
                        {r.wrongCount}
                      </td>
                      <td className="py-3 px-3.5 text-center text-slate-400 font-mono">
                        {r.unansweredCount}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-sm text-[#087443]">
                        {r.score}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono text-xs text-slate-600">
                        {m}m {s}s
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {r.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-900 bg-[#EAF8F0] px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            Selesai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-900 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Diskualifikasi
                          </span>
                        )}
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
