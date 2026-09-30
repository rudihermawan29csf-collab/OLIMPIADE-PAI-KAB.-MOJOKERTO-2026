import React, { useState, useEffect } from 'react';
import { Question, MateriPAI, Difficulty, QuestionType } from '../types';
import { storageService, subscribeToStore } from '../services/storageService';
import { sheetsSyncService } from '../services/sheetsSyncService';
import { sheetsExportService } from '../services/sheetsExportService';
import { AdminQuestionForm } from './AdminQuestionForm';
import { useToast } from '../components/Toast';
import {
  BookOpen,
  Plus,
  Search,
  Copy,
  Trash2,
  Edit3,
  Send,
  RefreshCw,
  CheckCircle2,
  Check,
  FileSpreadsheet
} from 'lucide-react';

const MATERI_LIST = [
  'SEMUA',
  'Aqidah',
  "Al-Qur'an Hadis",
  'Fiqih',
  'Akhlak',
  'Sejarah Kebudayaan Islam',
];

export const AdminQuestions: React.FC = () => {
  const { showToast } = useToast();
  const [questions, setQuestions] = useState<Question[]>(() =>
    storageService.getQuestions()
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMateri, setSelectedMateri] = useState('SEMUA');
  const [selectedDifficulty, setSelectedDifficulty] = useState('SEMUA');
  const [selectedType, setSelectedType] = useState('SEMUA');

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = subscribeToStore(() => {
      setQuestions(storageService.getQuestions());
    });
    return () => unsub();
  }, []);

  // Otomatis tarik Bank Soal terbaru dari Google Spreadsheet saat halaman dibuka
  useEffect(() => {
    if (sheetsSyncService.isConfigured()) {
      sheetsSyncService.pullQuestionsFromSheets().then((pulled) => {
        if (pulled && pulled.length > 0) {
          setQuestions(storageService.getQuestions());
        }
      }).catch(() => {});
    }
  }, []);

  const refreshData = () => {
    setQuestions(storageService.getQuestions());
  };

  const handleDuplicate = (id: string) => {
    const dup = storageService.duplicateQuestion(id);
    if (dup) {
      showToast('Soal berhasil digandakan dan disinkronkan ke Google Spreadsheet!', 'success');
      refreshData();
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus butir soal ini dari bank soal?')) {
      storageService.deleteQuestion(id);
      showToast('Soal telah dihapus dan disinkronkan.', 'info');
      refreshData();
    }
  };

  const handleSyncToSheets = async () => {
    setIsSyncing(true);
    try {
      const current = storageService.getQuestions();
      await sheetsSyncService.syncQuestions(current);
      showToast(`${current.length} butir soal berhasil dikirim ke Google Spreadsheet (Sheet: BANK_SOAL)!`, 'success');
    } catch {
      showToast('Gagal mengirim soal ke Google Spreadsheet.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromSheets = async () => {
    setIsPulling(true);
    try {
      const pulled = await sheetsSyncService.pullQuestionsFromSheets();
      if (pulled && pulled.length > 0) {
        setQuestions(storageService.getQuestions());
        showToast(`Berhasil memuat ${pulled.length} butir soal dari Google Spreadsheet!`, 'success');
      } else {
        showToast('Data soal di Google Spreadsheet kosong atau belum terhubung.', 'info');
      }
    } catch {
      showToast('Gagal menarik soal dari Google Spreadsheet.', 'error');
    } finally {
      setIsPulling(false);
    }
  };

  const handleCopyQuestions = () => {
    if (navigator.clipboard) {
      const text = sheetsExportService.copyQuestionsToClipboard();
      navigator.clipboard.writeText(text);
      setCopied(true);
      showToast('Data Bank Soal berhasil disalin! Buka Google Sheets tab BANK_SOAL lalu tekan Ctrl+V', 'success');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const filtered = questions.filter((q) => {
    const matchSearch =
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.stimulus && q.stimulus.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchMateri =
      selectedMateri === 'SEMUA' || q.subject === selectedMateri;

    const matchDiff =
      selectedDifficulty === 'SEMUA' || q.difficulty === selectedDifficulty;

    const matchType =
      selectedType === 'SEMUA' || q.type === selectedType;

    return matchSearch && matchMateri && matchDiff && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#087443]" />
              <span>Bank Soal PAI</span>
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#EAF8F0] text-emerald-900 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Terkoneksi Sheet: BANK_SOAL</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola {questions.length} butir soal pilihan ganda, PGK, dan benar/salah. Terkoneksi langsung ke Google Spreadsheet & ujian siswa.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={handlePullFromSheets}
            disabled={isPulling}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3 py-2 rounded-lg font-medium text-xs shadow-2xs transition cursor-pointer disabled:opacity-50"
            title="Tarik data soal terbaru dari Google Spreadsheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isPulling ? 'animate-spin' : ''}`} />
            <span>{isPulling ? 'Menarik...' : 'Tarik dari Sheets'}</span>
          </button>

          <button
            type="button"
            onClick={handleSyncToSheets}
            disabled={isSyncing}
            className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white px-3.5 py-2 rounded-lg font-bold text-xs shadow-2xs transition cursor-pointer disabled:opacity-50"
            title="Kirim seluruh butir soal ke Google Spreadsheet via Web App"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSyncing ? 'Mengirim...' : 'Kirim ke Sheets'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyQuestions}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg font-medium text-xs shadow-2xs transition cursor-pointer"
            title="Salin semua butir soal ke clipboard untuk di-paste langsung (Ctrl+V) ke Google Sheets"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Disalin!' : 'Salin (Ctrl+V)'}</span>
          </button>

          <button
            onClick={() => {
              setEditingQuestion(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 bg-[#087443] hover:bg-[#065b34] text-white px-4 py-2 rounded-lg font-medium text-xs shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Soal Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-emerald-950/10 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari materi, pertanyaan, atau stimulus..."
              className="w-full pl-9 pr-3.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-[#087443]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <select
              value={selectedMateri}
              onChange={(e) => setSelectedMateri(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:outline-none focus:border-[#087443]"
            >
              {MATERI_LIST.map((m) => (
                <option key={m} value={m}>
                  {m === 'SEMUA' ? 'Semua Materi Pokok' : m}
                </option>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:outline-none focus:border-[#087443]"
            >
              <option value="SEMUA">Semua Tingkat</option>
              <option value="Mudah">Mudah</option>
              <option value="Sedang">Sedang</option>
              <option value="Sukar">Sukar</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:outline-none focus:border-[#087443]"
            >
              <option value="SEMUA">Semua Jenis Soal</option>
              <option value="PG">Pilihan Ganda (PG)</option>
              <option value="PGK">PG Kompleks (PGK)</option>
              <option value="BS">Benar / Salah (BS)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200 text-slate-400 text-xs sm:text-sm">
            Tidak ada butir soal yang sesuai dengan kriteria filter pencarian.
          </div>
        ) : (
          filtered.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white rounded-xl p-5 border border-emerald-950/10 shadow-xs hover:border-emerald-700/40 transition-colors"
            >
              {/* Question Header meta */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-medium text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-[#087443] bg-[#EAF8F0] px-2.5 py-0.5 rounded border border-emerald-200">
                    {q.subject}
                  </span>
                  <span className="text-xs text-slate-600 font-medium">
                    {q.topic}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded uppercase ${
                      q.difficulty === 'Mudah'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : q.difficulty === 'Sedang'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {q.difficulty}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      q.type === 'PG'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : q.type === 'PGK'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {q.type === 'BS' ? 'Benar / Salah' : q.type}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicate(q.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                    title="Duplikasi Soal"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingQuestion(q);
                      setIsFormOpen(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-800 transition cursor-pointer"
                    title="Edit Soal"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                    title="Hapus Soal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stimulus text */}
              {q.stimulus && (
                <div className="bg-[#F8FAF8] p-3.5 rounded-lg border border-emerald-950/10 text-xs sm:text-sm text-slate-700 mb-3 whitespace-pre-line leading-relaxed">
                  <span className="font-semibold text-emerald-900 block mb-1 text-[11px] uppercase tracking-wide">
                    Stimulus:
                  </span>
                  {q.stimulus}
                </div>
              )}

              {/* Question text */}
              <div className="text-sm font-semibold text-slate-900 mb-3 leading-relaxed">
                {q.question}
              </div>

              {/* Options or Statements Preview */}
              {q.type === 'BS' && q.statements ? (
                <div className="border border-slate-200 rounded-lg overflow-hidden mb-3 text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#FAFDFB] border-b border-slate-200 text-emerald-950 font-bold">
                      <tr>
                        <th className="py-2 px-3 w-8">No</th>
                        <th className="py-2 px-3">Pernyataan Soal</th>
                        <th className="py-2 px-3 w-28 text-center">Kunci</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {q.statements.map((st, sIdx) => {
                        const isCorrectBenar = q.correctAnswers.includes(`${st.id}:BENAR`) || st.correct === 'BENAR';
                        return (
                          <tr key={st.id}>
                            <td className="py-2 px-3 text-slate-400 font-bold">{sIdx + 1}</td>
                            <td className="py-2 px-3 text-slate-800">{st.text}</td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isCorrectBenar
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                                }`}
                              >
                                {isCorrectBenar ? 'BENAR ✓' : 'SALAH ✗'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : q.options ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                  {q.options.map((opt) => {
                    const isKey = q.correctAnswers.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                          isKey
                            ? 'border-emerald-600 bg-[#EAF8F0] font-medium text-emerald-950'
                            : 'border-slate-200 text-slate-600 bg-white'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] shrink-0 ${
                            isKey
                              ? 'bg-[#087443] text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span className="flex-1 leading-snug">{opt.text}</span>
                        {isKey && <span className="text-[10px] font-bold text-emerald-800">Kunci ✓</span>}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Explanation preview */}
              {q.explanation && (
                <div className="text-[11px] text-slate-600 bg-[#F8FAF8] p-2.5 rounded-lg border border-slate-200">
                  <strong className="text-slate-800 font-semibold">Pembahasan: </strong>
                  {q.explanation}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <AdminQuestionForm
          initialData={editingQuestion}
          onClose={() => setIsFormOpen(false)}
          onSaved={() => {
            refreshData();
          }}
        />
      )}
    </div>
  );
};
