import React, { useState, useMemo, useEffect } from 'react';
import { Exam, ExamStatus, Question, QuestionType, MateriPAI } from '../types';
import { storageService } from '../services/storageService';
import { sheetsSyncService } from '../services/sheetsSyncService';
import { sheetsExportService } from '../services/sheetsExportService';
import { useToast } from '../components/Toast';
import {
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  BookOpen,
  Search,
  Filter,
  CheckSquare,
  Square,
  X,
  Check,
  Eye,
  ListChecks,
  Send,
  RefreshCw,
  Copy
} from 'lucide-react';

const MATERI_LIST: MateriPAI[] = [
  'Aqidah',
  "Al-Qur'an Hadis",
  'Fiqih',
  'Akhlak',
  'Sejarah Kebudayaan Islam',
];

const toDateTimeLocal = (isoString?: string): string => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromDateTimeLocal = (val: string): string => {
  if (!val) return new Date().toISOString();
  return new Date(val).toISOString();
};

interface QuestionPickerProps {
  examTitle: string;
  examToken: string;
  initialSelectedIds: string[];
  onClose: () => void;
  onApply: (selectedIds: string[], pg: number, pgk: number, bs: number) => void;
}

const BankQuestionPickerModal: React.FC<QuestionPickerProps> = ({
  examTitle,
  examToken,
  initialSelectedIds,
  onClose,
  onApply,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('SEMUA');
  const [selectedType, setSelectedType] = useState<string>('SEMUA');
  const [filterStatus, setFilterStatus] = useState<'all' | 'selected' | 'unselected'>('all');

  const allQuestions = useMemo(() => {
    return storageService.getQuestions().filter((q) => q.isActive);
  }, []);

  // Filtered list
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      if (selectedSubject !== 'SEMUA' && q.subject !== selectedSubject) {
        return false;
      }
      if (selectedType !== 'SEMUA' && q.type !== selectedType) {
        return false;
      }
      if (filterStatus === 'selected' && !selectedIds.includes(q.id)) {
        return false;
      }
      if (filterStatus === 'unselected' && selectedIds.includes(q.id)) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inQuestion = q.question.toLowerCase().includes(query);
        const inTopic = q.topic.toLowerCase().includes(query);
        const inStimulus = q.stimulus?.toLowerCase().includes(query);
        if (!inQuestion && !inTopic && !inStimulus) return false;
      }
      return true;
    });
  }, [allQuestions, selectedSubject, selectedType, filterStatus, searchQuery, selectedIds]);

  // Breakdown of selected questions
  const selectedCounts = useMemo(() => {
    const selectedQ = allQuestions.filter((q) => selectedIds.includes(q.id));
    const pg = selectedQ.filter((q) => q.type === 'PG').length;
    const pgk = selectedQ.filter((q) => q.type === 'PGK').length;
    const bs = selectedQ.filter((q) => q.type === 'BS').length;
    return { total: selectedQ.length, pg, pgk, bs };
  }, [allQuestions, selectedIds]);

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAllFiltered = () => {
    const newIds = new Set(selectedIds);
    filteredQuestions.forEach((q) => newIds.add(q.id));
    setSelectedIds(Array.from(newIds));
  };

  const handleDeselectAllFiltered = () => {
    const filteredIdSet = new Set(filteredQuestions.map((q) => q.id));
    setSelectedIds(selectedIds.filter((id) => !filteredIdSet.has(id)));
  };

  const handleApply = () => {
    onApply(selectedIds, selectedCounts.pg, selectedCounts.pgk, selectedCounts.bs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF8F0] text-[#087443] flex items-center justify-center font-bold shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Pilih Butir Soal dari Bank Soal
                </h3>
                <span className="font-mono text-xs font-bold bg-[#EAF8F0] text-emerald-900 px-2 py-0.5 rounded border border-emerald-300">
                  Token: {examToken}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-md">
                Sesi: {examTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Summary Counter Bar */}
        <div className="py-2.5 px-3.5 bg-[#FAFDFB] border border-emerald-900/15 rounded-xl my-3 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <ListChecks className="w-4 h-4 text-[#087443]" />
              <span>Status Terpilih:</span>
            </span>
            <span className="font-bold text-emerald-950 bg-white px-2.5 py-1 rounded border border-emerald-300 shadow-2xs">
              {selectedCounts.total} Soal Terpilih
            </span>
            <span className="bg-emerald-100/70 text-emerald-900 font-semibold px-2 py-0.5 rounded">
              {selectedCounts.pg} PG
            </span>
            <span className="bg-purple-100 text-purple-900 font-semibold px-2 py-0.5 rounded">
              {selectedCounts.pgk} PGK
            </span>
            <span className="bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded">
              {selectedCounts.bs} Benar / Salah
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="text-[11px] font-bold text-[#087443] hover:underline cursor-pointer bg-white px-2 py-1 rounded border border-emerald-200"
            >
              ✓ Pilih Semua Filter ({filteredQuestions.length})
            </button>
            <button
              type="button"
              onClick={handleDeselectAllFiltered}
              className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer bg-white px-2 py-1 rounded border border-rose-200"
            >
              ✕ Batal Semua Filter
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3 shrink-0 text-xs">
          <div className="sm:col-span-1 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kata kunci soal..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-[#087443] bg-white"
            />
          </div>

          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full py-2 px-2.5 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:outline-none focus:border-[#087443]"
            >
              <option value="SEMUA">Semua Materi PAI</option>
              {MATERI_LIST.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full py-2 px-2.5 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:outline-none focus:border-[#087443]"
            >
              <option value="SEMUA">Semua Jenis Soal</option>
              <option value="PG">Pilihan Ganda (PG)</option>
              <option value="PGK">PG Kompleks (PGK)</option>
              <option value="BS">Benar / Salah (BS)</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full py-2 px-2.5 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:outline-none focus:border-[#087443]"
            >
              <option value="all">Semua Status (Ada & Belum)</option>
              <option value="selected">Hanya Yang Terpilih ({selectedIds.length})</option>
              <option value="unselected">Belum Terpilih ({allQuestions.length - selectedIds.length})</option>
            </select>
          </div>
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filteredQuestions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-sm font-semibold">Tidak ada butir soal yang sesuai kriteria filter.</p>
              <p className="text-xs mt-1">Coba sesuaikan kata kunci atau filter materi / jenis soal.</p>
            </div>
          ) : (
            filteredQuestions.map((q, idx) => {
              const isChecked = selectedIds.includes(q.id);

              return (
                <div
                  key={q.id}
                  onClick={() => handleToggle(q.id)}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none ${
                    isChecked
                      ? 'border-[#087443] bg-[#EAF8F0]/50 shadow-xs'
                      : 'border-slate-200 hover:border-emerald-600/40 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox Icon */}
                    <div className="pt-0.5 shrink-0 text-[#087443]">
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 fill-[#087443] text-white" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          #{q.id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-950">
                          {q.subject}
                        </span>
                        <span className="text-[10px] text-slate-500 italic">
                          • {q.topic}
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
                        <span className="text-[10px] text-slate-400 font-medium ml-auto">
                          Tingkat: {q.difficulty}
                        </span>
                      </div>

                      {/* Stimulus Excerpt */}
                      {q.stimulus && (
                        <div className="p-2.5 rounded-lg bg-[#FAFDFB] border border-emerald-800/10 text-xs text-slate-700 mb-2 italic line-clamp-2">
                          <span className="font-semibold text-emerald-950 not-italic block text-[10px] uppercase">
                            Stimulus / Wacana:
                          </span>
                          {q.stimulus}
                        </div>
                      )}

                      {/* Question Text */}
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug mb-2">
                        {q.question}
                      </p>

                      {/* Options or Statements Preview */}
                      {q.type === 'BS' && q.statements ? (
                        <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 space-y-1">
                          <span className="font-bold text-[10px] uppercase text-emerald-900 block">
                            Pernyataan ({q.statements.length} butir):
                          </span>
                          {q.statements.slice(0, 3).map((st, sIdx) => (
                            <div key={st.id} className="flex items-center justify-between gap-2">
                              <span className="truncate">
                                {sIdx + 1}. {st.text}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                  st.correct === 'BENAR'
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : 'bg-rose-100 text-rose-900'
                                }`}
                              >
                                {st.correct}
                              </span>
                            </div>
                          ))}
                          {q.statements.length > 3 && (
                            <span className="text-[10px] text-slate-400 block italic">
                              +{q.statements.length - 3} pernyataan lainnya...
                            </span>
                          )}
                        </div>
                      ) : q.options ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                          {q.options.map((opt) => {
                            const isKey = q.correctAnswers.includes(opt.id);
                            return (
                              <div
                                key={opt.id}
                                className={`p-1.5 rounded border text-slate-700 truncate ${
                                  isKey
                                    ? 'bg-emerald-50 border-emerald-400 font-semibold text-emerald-950'
                                    : 'bg-white border-slate-200'
                                }`}
                              >
                                <span className="font-bold mr-1">{opt.id}.</span>
                                <span>{opt.text}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3.5 border-t border-slate-100 mt-3 flex items-center justify-between shrink-0 gap-3">
          <div className="text-xs text-slate-600">
            Terpilih <span className="font-bold text-slate-900">{selectedCounts.total} butir soal</span> dari {allQuestions.length} soal aktif di bank soal.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="py-2 px-5 rounded-xl bg-[#087443] hover:bg-[#065b34] text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan ({selectedCounts.total} Soal)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminExams: React.FC = () => {
  const { showToast } = useToast();
  const [exams, setExams] = useState<Exam[]>(() => storageService.getExams());
  const [isEditing, setIsEditing] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [copiedExams, setCopiedExams] = useState(false);

  // Question Picker modal state
  const [pickerTargetExam, setPickerTargetExam] = useState<Exam | null>(null);
  const [isFormPickerOpen, setIsFormPickerOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(120);
  const [token, setToken] = useState('PAI2026');

  // Schedule dates
  const [startAtLocal, setStartAtLocal] = useState<string>('');
  const [endAtLocal, setEndAtLocal] = useState<string>('');

  // Question counts by type & selected IDs
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [pgCount, setPgCount] = useState<number>(5);
  const [pgkCount, setPgkCount] = useState<number>(3);
  const [bsCount, setBsCount] = useState<number>(2);
  const [questionCount, setQuestionCount] = useState<number>(10);

  const [randomQuestion, setRandomQuestion] = useState(true);
  const [randomOption, setRandomOption] = useState(true);
  const [antiCheat, setAntiCheat] = useState(true);
  const [fullscreenRequired, setFullscreenRequired] = useState(true);
  const [hideScoreFromParticipant, setHideScoreFromParticipant] = useState(false);
  const [status, setStatus] = useState<ExamStatus>('active');

  const refreshList = () => {
    setExams(storageService.getExams());
  };

  // Otomatis tarik Sesi Ujian & Token terbaru dari Google Spreadsheet saat halaman dibuka
  useEffect(() => {
    if (sheetsSyncService.isConfigured()) {
      sheetsSyncService.pullExamsFromSheets().then((pulled) => {
        if (pulled && pulled.length > 0) {
          setExams(storageService.getExams());
        }
      }).catch(() => {});
    }
  }, []);

  const handleSyncToSheets = async () => {
    setIsSyncing(true);
    try {
      const currentExams = storageService.getExams();
      await sheetsSyncService.syncExams(currentExams);
      showToast(`${currentExams.length} sesi ujian & token berhasil dikirim ke Google Spreadsheet (Sheet: SESI_UJIAN)!`, 'success');
    } catch {
      showToast('Gagal mengirim sesi ujian ke Google Spreadsheet.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromSheets = async () => {
    setIsPulling(true);
    try {
      const pulled = await sheetsSyncService.pullExamsFromSheets();
      if (pulled && pulled.length > 0) {
        setExams(storageService.getExams());
        showToast(`Berhasil menarik ${pulled.length} sesi ujian & token dari Google Spreadsheet!`, 'success');
      } else {
        showToast('Data sesi ujian di Google Spreadsheet kosong atau belum terhubung.', 'info');
      }
    } catch {
      showToast('Gagal menarik sesi ujian dari Google Spreadsheet.', 'error');
    } finally {
      setIsPulling(false);
    }
  };

  const handleCopyExams = () => {
    if (navigator.clipboard) {
      const text = sheetsExportService.copyExamsToClipboard();
      navigator.clipboard.writeText(text);
      setCopiedExams(true);
      showToast('Data Sesi & Token berhasil disalin! Buka Google Sheets tab SESI_UJIAN lalu tekan Ctrl+V', 'success');
      setTimeout(() => setCopiedExams(false), 3000);
    }
  };

  const handleOpenCreate = () => {
    setSelectedExam(null);
    setTitle('OLIMPIADE PAI SMP KABUPATEN MOJOKERTO 2026');
    setDescription('Babak Penyisihan Computer Based Test (CBT) Olimpiade Pendidikan Agama Islam Jenjang SMP se-Kabupaten Mojokerto.');
    setDurationMinutes(120);
    setToken(generateRandomToken());

    const now = new Date();
    const oneWeekLater = new Date(Date.now() + 86400000 * 7);
    setStartAtLocal(toDateTimeLocal(now.toISOString()));
    setEndAtLocal(toDateTimeLocal(oneWeekLater.toISOString()));

    // Default to active questions from bank
    const allQ = storageService.getQuestions().filter((q) => q.isActive);
    const initialIds = allQ.slice(0, 10).map((q) => q.id);
    setSelectedQuestionIds(initialIds);

    const initialQ = allQ.slice(0, 10);
    const p = initialQ.filter((q) => q.type === 'PG').length;
    const pk = initialQ.filter((q) => q.type === 'PGK').length;
    const b = initialQ.filter((q) => q.type === 'BS').length;

    setPgCount(p || 5);
    setPgkCount(pk || 3);
    setBsCount(b || 2);
    setQuestionCount(initialIds.length || 10);

    setRandomQuestion(true);
    setRandomOption(true);
    setAntiCheat(true);
    setFullscreenRequired(true);
    setHideScoreFromParticipant(false);
    setStatus('active');
    setIsEditing(true);
  };

  const handleOpenEdit = (e: Exam) => {
    setSelectedExam(e);
    setTitle(e.title);
    setDescription(e.description);
    setDurationMinutes(e.durationMinutes);
    setToken(e.token);

    setStartAtLocal(toDateTimeLocal(e.startAt));
    setEndAtLocal(toDateTimeLocal(e.endAt));

    const rawIds = e.selectedQuestionIds && e.selectedQuestionIds.length > 0
      ? e.selectedQuestionIds
      : storageService.getQuestions().filter((q) => q.isActive).slice(0, e.questionCount || 10).map((q) => q.id);

    const ids = (e.questionCount && e.questionCount > 0 && rawIds.length > e.questionCount)
      ? rawIds.slice(0, e.questionCount)
      : rawIds;

    setSelectedQuestionIds(ids);

    const p = e.pgCount ?? 5;
    const pk = e.pgkCount ?? 3;
    const b = e.bsCount ?? 2;
    setPgCount(p);
    setPgkCount(pk);
    setBsCount(b);
    setQuestionCount(ids.length || e.questionCount || (p + pk + b));

    setRandomQuestion(e.randomQuestion);
    setRandomOption(e.randomOption);
    setAntiCheat(e.antiCheat);
    setFullscreenRequired(e.fullscreenRequired);
    setHideScoreFromParticipant(e.hideScoreFromParticipant || false);
    setStatus(e.status);
    setIsEditing(true);
  };

  const handleApplyQuestionsToForm = (ids: string[], p: number, pk: number, b: number) => {
    setSelectedQuestionIds(ids);
    setPgCount(p);
    setPgkCount(pk);
    setBsCount(b);
    setQuestionCount(ids.length);
    showToast(`${ids.length} soal berhasil dipilih untuk sesi ini.`, 'success');
  };

  const handleApplyQuestionsDirectToExam = (ids: string[], p: number, pk: number, b: number) => {
    if (!pickerTargetExam) return;
    try {
      storageService.updateExamSelectedQuestions(pickerTargetExam.id, ids);
      showToast(`${ids.length} butir soal berhasil diterapkan ke sesi "${pickerTargetExam.title}".`, 'success');
      refreshList();
    } catch {
      showToast('Gagal memperbarui soal ujian.', 'error');
    }
  };

  const generateRandomToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = 'PAI';
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const handleQuickDuration = (hours: number) => {
    const now = new Date();
    setStartAtLocal(toDateTimeLocal(now.toISOString()));
    const end = new Date(Date.now() + hours * 3600000);
    setEndAtLocal(toDateTimeLocal(end.toISOString()));
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Nama ujian wajib diisi.', 'error');
      return;
    }

    if (!startAtLocal || !endAtLocal) {
      showToast('Tanggal dan jam mulai serta selesai ujian wajib ditentukan.', 'error');
      return;
    }

    const startIso = fromDateTimeLocal(startAtLocal);
    const endIso = fromDateTimeLocal(endAtLocal);

    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      showToast('Waktu selesai ujian harus lebih besar dari waktu mulai ujian.', 'error');
      return;
    }

    const totalQuestions = selectedQuestionIds.length > 0 ? selectedQuestionIds.length : (pgCount + pgkCount + bsCount);
    if (totalQuestions <= 0) {
      showToast('Pilih minimal 1 butir soal dari bank soal.', 'error');
      return;
    }

    try {
      storageService.saveExam({
        id: selectedExam?.id,
        title: title.trim(),
        description: description.trim(),
        questionCount: totalQuestions,
        selectedQuestionIds,
        pgCount,
        pgkCount,
        bsCount,
        durationMinutes: Number(durationMinutes) || 60,
        startAt: startIso,
        endAt: endIso,
        randomQuestion,
        randomOption,
        antiCheat,
        fullscreenRequired,
        token: token.trim().toUpperCase() || 'PAI2026',
        hideScoreFromParticipant,
        status,
      });

      showToast('Pengaturan sesi ujian berhasil disimpan!', 'success');
      setIsEditing(false);
      refreshList();
    } catch (err) {
      showToast('Gagal menyimpan ujian.', 'error');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus konfigurasi jadwal ujian ini?')) {
      storageService.deleteExam(id);
      showToast('Ujian telah dihapus.', 'info');
      refreshList();
    }
  };

  const getScheduleStatus = (startAt: string, endAt: string) => {
    const now = Date.now();
    const start = new Date(startAt).getTime();
    const end = new Date(endAt).getTime();

    if (!isNaN(start) && now < start) {
      return {
        label: 'Belum Dimulai',
        badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
        dotClass: 'bg-amber-500',
        canExecute: false,
      };
    }
    if (!isNaN(end) && now > end) {
      return {
        label: 'Telah Ditutup',
        badgeClass: 'bg-rose-50 text-rose-900 border-rose-300',
        dotClass: 'bg-rose-500',
        canExecute: false,
      };
    }
    return {
      label: 'Sedang Berlangsung',
      badgeClass: 'bg-[#EAF8F0] text-emerald-950 border-emerald-300',
      dotClass: 'bg-emerald-600 animate-pulse',
      canExecute: true,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#087443]" />
              <span>Sesi, Jadwal & Token Ujian</span>
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#EAF8F0] text-emerald-900 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Terkoneksi Sheet: SESI_UJIAN</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Atur tanggal dan jam pelaksanaan ujian, token rilis, serta sinkronisasi otomatis ke Google Spreadsheet.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={handlePullFromSheets}
            disabled={isPulling}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3 py-2 rounded-lg font-medium text-xs shadow-2xs transition cursor-pointer disabled:opacity-50"
            title="Tarik data sesi & token terbaru dari Google Spreadsheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isPulling ? 'animate-spin' : ''}`} />
            <span>{isPulling ? 'Menarik...' : 'Tarik dari Sheets'}</span>
          </button>

          <button
            type="button"
            onClick={handleSyncToSheets}
            disabled={isSyncing}
            className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white px-3 py-2 rounded-lg font-medium text-xs shadow-2xs transition cursor-pointer disabled:opacity-50"
            title="Kirim sesi & token aktif saat ini ke Google Spreadsheet"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSyncing ? 'Mengirim...' : 'Kirim ke Sheets'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyExams}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3 py-2 rounded-lg font-medium text-xs shadow-2xs transition cursor-pointer"
            title="Salin data sesi untuk ditempel langsung (Ctrl+V) di Google Sheets"
          >
            {copiedExams ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedExams ? 'Disalin!' : 'Salin (Ctrl+V)'}</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-[#087443] hover:bg-[#065b34] text-white px-4 py-2 rounded-lg font-medium text-xs shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Sesi Ujian Baru</span>
          </button>
        </div>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exams.map((exam) => {
          const sched = getScheduleStatus(exam.startAt, exam.endAt);
          const startFormatted = new Date(exam.startAt).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          const endFormatted = new Date(exam.endAt).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          const chosenCount = exam.selectedQuestionIds?.length || exam.questionCount;

          return (
            <div
              key={exam.id}
              className="bg-white rounded-xl p-6 border border-emerald-950/10 shadow-xs relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Status Bar */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider border ${sched.badgeClass}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${sched.dotClass}`} />
                      <span>{sched.label}</span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">
                      ({exam.status})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Token:</span>
                    <span className="text-xs font-mono font-bold text-emerald-950 bg-[#EAF8F0] px-2.5 py-0.5 rounded border border-emerald-300">
                      {exam.token}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">{exam.title}</h3>
                <p className="text-xs text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                  {exam.description}
                </p>

                {/* Jadwal Pelaksanaan Tanggal & Jam */}
                <div className="p-3 bg-[#FAFDFB] border border-emerald-900/15 rounded-lg mb-4 text-xs space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-emerald-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Jadwal Waktu Pelaksanaan:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Buka / Mulai:</span>
                      <span className="font-semibold text-slate-900 font-mono text-[11px]">{startFormatted} WIB</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Tutup / Batas:</span>
                      <span className="font-semibold text-slate-900 font-mono text-[11px]">{endFormatted} WIB</span>
                    </div>
                  </div>
                </div>

                {/* Question Selection Info & Breakdown */}
                <div className="p-3 bg-[#F8FAF8] border border-slate-200 rounded-lg mb-4">
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#087443]" />
                      <span>Butir Soal Terpilih dari Bank Soal</span>
                    </span>
                    <span className="text-emerald-950 font-bold bg-[#EAF8F0] px-2 py-0.5 rounded border border-emerald-300">
                      {chosenCount} Butir ({exam.durationMinutes} Menit)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-1.5 bg-white rounded border border-slate-200">
                      <span className="text-[9px] text-emerald-800 font-bold block uppercase">PG</span>
                      <span className="font-mono font-bold text-slate-900">{exam.pgCount ?? '-'} Butir</span>
                    </div>
                    <div className="p-1.5 bg-white rounded border border-slate-200">
                      <span className="text-[9px] text-purple-800 font-bold block uppercase">PGK</span>
                      <span className="font-mono font-bold text-slate-900">{exam.pgkCount ?? '-'} Butir</span>
                    </div>
                    <div className="p-1.5 bg-white rounded border border-slate-200">
                      <span className="text-[9px] text-amber-800 font-bold block uppercase">Benar/Salah</span>
                      <span className="font-mono font-bold text-slate-900">{exam.bsCount ?? '-'} Butir</span>
                    </div>
                  </div>
                </div>

                {/* Security Toggles Preview */}
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-4 flex-wrap">
                  <span className={exam.randomQuestion ? 'text-emerald-800 font-medium' : 'text-slate-400'}>
                    ✓ Acak Soal
                  </span>
                  <span>•</span>
                  <span className={exam.randomOption ? 'text-emerald-800 font-medium' : 'text-slate-400'}>
                    ✓ Acak Opsi
                  </span>
                  <span>•</span>
                  <span className={exam.antiCheat ? 'text-emerald-800 font-medium' : 'text-slate-400'}>
                    ✓ Anti-Curang
                  </span>
                  <span>•</span>
                  <span className={exam.fullscreenRequired ? 'text-emerald-800 font-medium' : 'text-slate-400'}>
                    ✓ Layar Penuh
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPickerTargetExam(exam)}
                  className="py-1.5 px-3 rounded-lg bg-[#EAF8F0] hover:bg-emerald-100 text-[#087443] font-bold text-xs transition flex items-center gap-1.5 border border-emerald-300 cursor-pointer"
                >
                  <ListChecks className="w-3.5 h-3.5" />
                  <span>Pilih Soal Bank ({chosenCount})</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(exam)}
                    className="py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Ubah Jadwal & Token</span>
                  </button>
                  {exams.length > 1 && (
                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                      title="Hapus Sesi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Standalone Question Picker Modal (Invoked from Card Button) */}
      {pickerTargetExam && (
        <BankQuestionPickerModal
          examTitle={pickerTargetExam.title}
          examToken={pickerTargetExam.token}
          initialSelectedIds={pickerTargetExam.selectedQuestionIds || []}
          onClose={() => setPickerTargetExam(null)}
          onApply={handleApplyQuestionsDirectToExam}
        />
      )}

      {/* In-Form Question Picker Modal (Invoked from inside Create/Edit Form) */}
      {isFormPickerOpen && (
        <BankQuestionPickerModal
          examTitle={title || 'Sesi Ujian'}
          examToken={token || 'TOKEN'}
          initialSelectedIds={selectedQuestionIds}
          onClose={() => setIsFormPickerOpen(false)}
          onApply={handleApplyQuestionsToForm}
        />
      )}

      {/* Edit / Create Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 sm:p-7 shadow-xl border border-emerald-950/10 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedExam ? 'Ubah Konfigurasi Sesi Ujian' : 'Buat Sesi Ujian Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  Pengaturan jadwal buka/tutup, token rilis, dan pemilihan butir soal dari bank soal.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-[#EAF8F0] text-emerald-900 px-2 py-0.5 rounded border border-emerald-300">
                Token: {token}
              </span>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Sesi Ujian
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: OLIMPIADE PAI SMP KABUPATEN MOJOKERTO 2026"
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-medium focus:outline-none focus:border-[#087443] text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Keterangan Ujian
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#087443] text-xs"
                />
              </div>

              {/* 1. Pengaturan Tanggal dan Jam Ujian */}
              <div className="p-4 bg-[#FAFDFB] border border-emerald-900/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-xs sm:text-sm">
                    <Clock className="w-4 h-4 text-[#087443]" />
                    <span>Jadwal Pelaksanaan (Tanggal & Jam Ujian)</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickDuration(2)}
                      className="px-2 py-0.5 text-[10px] bg-white border border-emerald-700/30 hover:bg-emerald-50 rounded text-emerald-900 cursor-pointer"
                    >
                      +2 Jam
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDuration(24)}
                      className="px-2 py-0.5 text-[10px] bg-white border border-emerald-700/30 hover:bg-emerald-50 rounded text-emerald-900 cursor-pointer"
                    >
                      1 Hari
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDuration(24 * 7)}
                      className="px-2 py-0.5 text-[10px] bg-white border border-emerald-700/30 hover:bg-emerald-50 rounded text-emerald-900 cursor-pointer"
                    >
                      7 Hari
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Waktu Mulai Ujian (Buka Sesi)
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={startAtLocal}
                      onChange={(e) => setStartAtLocal(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs focus:outline-none focus:border-[#087443] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Waktu Selesai Ujian (Tutup Sesi)
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={endAtLocal}
                      onChange={(e) => setEndAtLocal(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs focus:outline-none focus:border-[#087443] bg-white"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                  * Sistem otomatis memblokir peserta jika waktu saat ini berada di luar rentang tanggal & jam tersebut. Peserta akan menerima notifikasi bahwa sesi belum dibuka atau telah berakhir.
                </p>
              </div>

              {/* 2. Pemilihan Butir Soal Langsung dari Bank Soal */}
              <div className="p-4 bg-[#F8FAF8] border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs sm:text-sm">
                    <BookOpen className="w-4 h-4 text-[#087443]" />
                    <span>Pemilihan Soal dari Bank Soal</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFormPickerOpen(true)}
                    className="px-3 py-1.5 bg-[#087443] hover:bg-[#065b34] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <ListChecks className="w-4 h-4" />
                    <span>Buka Pemilih Butir Soal Bank</span>
                  </button>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Total {selectedQuestionIds.length} Butir Soal Terpilih
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Komposisi: {pgCount} PG • {pgkCount} PGK • {bsCount} Benar/Salah
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFormPickerOpen(true)}
                    className="text-xs text-[#087443] font-bold hover:underline cursor-pointer"
                  >
                    Ubah Pilihan Soal →
                  </button>
                </div>
              </div>

              {/* Durasi & Token */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Durasi Pengerjaan (Menit)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={360}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-[#087443]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Token Rilis Ujian
                    </label>
                    <button
                      type="button"
                      onClick={() => setToken(generateRandomToken())}
                      className="text-[10px] text-[#087443] font-semibold hover:underline cursor-pointer"
                    >
                      Acak Token
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono font-bold uppercase focus:outline-none focus:border-[#087443]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Pelaksanaan
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ExamStatus)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-medium bg-white focus:outline-none focus:border-[#087443]"
                  >
                    <option value="draft">Draft (Belum dibuka)</option>
                    <option value="scheduled">Terjadwal</option>
                    <option value="active">Aktif (Dapat Dikerjakan)</option>
                    <option value="completed">Selesai / Ditutup</option>
                  </select>
                </div>
              </div>

              {/* Security & Feature Toggles */}
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <span className="block text-xs font-semibold text-slate-700">
                  Pengaturan Proteksi & Tampilan:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-[#F8FAF8] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={randomQuestion}
                      onChange={(e) => setRandomQuestion(e.target.checked)}
                      className="w-4 h-4 rounded text-[#087443]"
                    />
                    <span className="text-xs font-medium text-slate-700">Acak Urutan Soal</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-[#F8FAF8] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={randomOption}
                      onChange={(e) => setRandomOption(e.target.checked)}
                      className="w-4 h-4 rounded text-[#087443]"
                    />
                    <span className="text-xs font-medium text-slate-700">Acak Urutan Opsi (A,B,C,D)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-[#F8FAF8] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={antiCheat}
                      onChange={(e) => setAntiCheat(e.target.checked)}
                      className="w-4 h-4 rounded text-[#087443]"
                    />
                    <span className="text-xs font-medium text-slate-700">Aktifkan Anti-Cheat 3-Strike</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-[#F8FAF8] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fullscreenRequired}
                      onChange={(e) => setFullscreenRequired(e.target.checked)}
                      className="w-4 h-4 rounded text-[#087443]"
                    />
                    <span className="text-xs font-medium text-slate-700">Wajibkan Mode Fullscreen</span>
                  </label>
                </div>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-emerald-800/20 bg-[#EAF8F0] cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={hideScoreFromParticipant}
                    onChange={(e) => setHideScoreFromParticipant(e.target.checked)}
                    className="w-4 h-4 rounded text-[#087443]"
                  />
                  <div className="text-xs text-emerald-950">
                    <span className="font-bold block">Rahasiakan Nilai dari Siswa (Kerahasiaan Hasil)</span>
                    <span className="text-[11px] text-emerald-800">
                      Siswa hanya akan menerima tanda selesai ujian; nilai dirilis resmi oleh Panitia MGMP PAI setelah ujian ditutup.
                    </span>
                  </div>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg bg-[#087443] hover:bg-[#065b34] text-white font-medium text-xs shadow-xs transition cursor-pointer"
                >
                  Simpan Pengaturan Sesi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
