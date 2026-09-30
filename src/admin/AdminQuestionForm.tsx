import React, { useState } from 'react';
import { Question, MateriPAI, Difficulty, QuestionType, QuestionStatement } from '../types';
import { storageService } from '../services/storageService';
import { useToast } from '../components/Toast';
import { X, Check, Save, Plus, HelpCircle, BookOpen, Trash2, Layers } from 'lucide-react';

interface AdminQuestionFormProps {
  initialData?: Question | null;
  onClose: () => void;
  onSaved: () => void;
}

const MATERI_LIST: MateriPAI[] = [
  'Aqidah',
  "Al-Qur'an Hadis",
  'Fiqih',
  'Akhlak',
  'Sejarah Kebudayaan Islam',
];

const DIFFICULTY_LIST: Difficulty[] = ['Mudah', 'Sedang', 'Sukar'];

export const AdminQuestionForm: React.FC<AdminQuestionFormProps> = ({
  initialData,
  onClose,
  onSaved,
}) => {
  const { showToast } = useToast();

  const [subject, setSubject] = useState<MateriPAI>(initialData?.subject || 'Aqidah');
  const [topic, setTopic] = useState(initialData?.topic || '');
  const [difficulty, setDifficulty] = useState<Difficulty>(initialData?.difficulty || 'Sedang');
  const [type, setType] = useState<QuestionType>(initialData?.type || 'PG');
  const [stimulus, setStimulus] = useState(initialData?.stimulus || '');
  const [question, setQuestion] = useState(initialData?.question || '');

  // Options for PG / PGK
  const [optionA, setOptionA] = useState(
    initialData?.options?.find((o) => o.id === 'A')?.text || ''
  );
  const [optionB, setOptionB] = useState(
    initialData?.options?.find((o) => o.id === 'B')?.text || ''
  );
  const [optionC, setOptionC] = useState(
    initialData?.options?.find((o) => o.id === 'C')?.text || ''
  );
  const [optionD, setOptionD] = useState(
    initialData?.options?.find((o) => o.id === 'D')?.text || ''
  );

  const [correctAnswers, setCorrectAnswers] = useState<string[]>(
    initialData?.correctAnswers || ['A']
  );

  // Statements for BS (Benar / Salah)
  const [statements, setStatements] = useState<QuestionStatement[]>(() => {
    if (initialData?.statements && initialData.statements.length > 0) {
      return initialData.statements;
    }
    return [
      { id: 'S1', text: '', correct: 'BENAR' },
      { id: 'S2', text: '', correct: 'SALAH' },
      { id: 'S3', text: '', correct: 'BENAR' },
    ];
  });

  const [explanation, setExplanation] = useState(initialData?.explanation || '');
  const [isActive, setIsActive] = useState(initialData ? initialData.isActive : true);
  const [error, setError] = useState<string | null>(null);

  const handleToggleAnswer = (optId: string) => {
    if (type === 'PG') {
      setCorrectAnswers([optId]);
    } else {
      if (correctAnswers.includes(optId)) {
        if (correctAnswers.length === 1) {
          setError('Minimal harus ada 1 kunci jawaban yang dipilih.');
          return;
        }
        setCorrectAnswers(correctAnswers.filter((a) => a !== optId));
      } else {
        setCorrectAnswers([...correctAnswers, optId].sort());
      }
    }
  };

  const handleAddStatement = () => {
    const nextNum = statements.length + 1;
    setStatements([...statements, { id: `S${nextNum}`, text: '', correct: 'BENAR' }]);
  };

  const handleRemoveStatement = (index: number) => {
    if (statements.length <= 2) {
      setError('Minimal harus ada 2 butir pernyataan untuk soal Benar / Salah.');
      return;
    }
    setStatements(statements.filter((_, i) => i !== index));
  };

  const handleStatementTextChange = (index: number, text: string) => {
    const updated = [...statements];
    updated[index].text = text;
    setStatements(updated);
  };

  const handleStatementCorrectChange = (index: number, correct: 'BENAR' | 'SALAH') => {
    const updated = [...statements];
    updated[index].correct = correct;
    setStatements(updated);
  };

  const handleSave = (addAnother = false) => {
    setError(null);

    if (!topic.trim()) {
      setError('Submateri / Topik soal wajib diisi.');
      return;
    }
    if (!question.trim()) {
      setError('Pertanyaan soal wajib diisi.');
      return;
    }

    let finalCorrectAnswers: string[] = [];
    let finalOptions = undefined;
    let finalStatements = undefined;

    if (type === 'BS') {
      if (!stimulus.trim()) {
        setError('Untuk jenis soal Benar / Salah, narasi wacana stimulus disarankan diisi agar siswa dapat menganalisis pernyataan.');
        return;
      }
      // Check statements
      for (let i = 0; i < statements.length; i++) {
        if (!statements[i].text.trim()) {
          setError(`Teks pernyataan nomor ${i + 1} masih kosong.`);
          return;
        }
      }
      finalStatements = statements.map((st, idx) => ({
        id: `S${idx + 1}`,
        text: st.text.trim(),
        correct: st.correct,
      }));
      finalCorrectAnswers = finalStatements.map((st) => `${st.id}:${st.correct}`);
    } else {
      if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
        setError('Seluruh pilihan jawaban A, B, C, dan D wajib diisi.');
        return;
      }
      if (correctAnswers.length === 0) {
        setError('Pilih minimal satu kunci jawaban yang benar.');
        return;
      }
      finalOptions = [
        { id: 'A' as const, text: optionA.trim() },
        { id: 'B' as const, text: optionB.trim() },
        { id: 'C' as const, text: optionC.trim() },
        { id: 'D' as const, text: optionD.trim() },
      ];
      finalCorrectAnswers = correctAnswers;
    }

    try {
      storageService.saveQuestion({
        id: initialData?.id,
        subject,
        topic: topic.trim(),
        difficulty,
        type,
        stimulus: stimulus.trim() || undefined,
        question: question.trim(),
        options: finalOptions,
        statements: finalStatements,
        correctAnswers: finalCorrectAnswers,
        explanation: explanation.trim() || undefined,
        isActive,
      });

      showToast('Soal berhasil disimpan ke Bank Soal & disinkronkan ke Google Spreadsheet!', 'success');
      onSaved();

      if (addAnother) {
        // Reset form for next question
        setQuestion('');
        setStimulus('');
        setOptionA('');
        setOptionB('');
        setOptionC('');
        setOptionD('');
        setExplanation('');
        setCorrectAnswers(['A']);
        setStatements([
          { id: 'S1', text: '', correct: 'BENAR' },
          { id: 'S2', text: '', correct: 'SALAH' },
          { id: 'S3', text: '', correct: 'BENAR' },
        ]);
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan soal.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAF8F0] text-[#087443] flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {initialData ? 'Ubah Butir Soal' : 'Tambah Butir Soal Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Pilih jenis soal Pilihan Ganda (PG), PG Kompleks (PGK), atau Benar / Salah (BS).
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

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4 text-xs sm:text-sm">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Materi Pokok
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as MateriPAI)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white focus:outline-none focus:border-[#087443]"
              >
                {MATERI_LIST.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Submateri / Topik
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Contoh: Zakat Mal, Toleransi"
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:outline-none focus:border-[#087443]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tingkat Kesulitan
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white focus:outline-none focus:border-[#087443]"
              >
                {DIFFICULTY_LIST.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jenis Soal
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const newType = e.target.value as QuestionType;
                  setType(newType);
                  if (newType === 'PG' && correctAnswers.length > 1) {
                    setCorrectAnswers([correctAnswers[0] || 'A']);
                  }
                }}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white focus:outline-none focus:border-[#087443] text-emerald-900"
              >
                <option value="PG">Pilihan Ganda (PG)</option>
                <option value="PGK">PG Kompleks (PGK)</option>
                <option value="BS">Benar / Salah (BS)</option>
              </select>
            </div>
          </div>

          {/* Stimulus Narasi */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Narasi / Stimulus Bacaan / Kutipan Ayat {type === 'BS' ? '(Wajib Untuk BS)' : '(Opsional)'}
              </label>
              {type === 'BS' && (
                <span className="text-[10px] font-bold text-[#087443] bg-[#EAF8F0] px-2 py-0.5 rounded">
                  Disajikan Sebelum Pertanyaan
                </span>
              )}
            </div>
            <textarea
              rows={3}
              value={stimulus}
              onChange={(e) => setStimulus(e.target.value)}
              placeholder="Masukkan teks narasi wacana, penggalan ayat, kasus nyata, atau stimulus bacaan yang akan dianalisis oleh siswa..."
              className="w-full p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#087443] font-normal text-xs sm:text-sm"
            />
          </div>

          {/* Pertanyaan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Pertanyaan / Pokok Soal <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={
                type === 'BS'
                  ? 'Contoh: Berdasarkan narasi di atas, tentukan nilai kebenaran dari masing-masing pernyataan berikut dengan memilih BENAR atau SALAH!'
                  : 'Tuliskan butir pertanyaan yang jelas dan terarah...'
              }
              className="w-full p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#087443] font-medium text-xs sm:text-sm"
            />
          </div>

          {/* If type is BS (Benar / Salah) */}
          {type === 'BS' && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Daftar Pernyataan & Kunci Jawaban (Benar / Salah)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Siswa akan disajikan narasi, kemudian soal, lalu memilih BENAR atau SALAH untuk tiap pernyataan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddStatement}
                  className="px-3 py-1.5 bg-[#087443] hover:bg-[#065b34] text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Pernyataan</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {statements.map((stmt, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-300 bg-[#FAFDFB] flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <span className="w-7 h-7 rounded-lg bg-[#EAF8F0] text-[#087443] font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-300">
                      {idx + 1}
                    </span>

                    <input
                      type="text"
                      required
                      value={stmt.text}
                      onChange={(e) => handleStatementTextChange(idx, e.target.value)}
                      placeholder={`Tuliskan teks pernyataan nomor ${idx + 1}...`}
                      className="flex-1 p-2 rounded-lg border border-slate-300 font-medium text-xs sm:text-sm focus:outline-none focus:border-[#087443] bg-white"
                    />

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center rounded-lg border border-slate-300 overflow-hidden bg-white p-0.5">
                        <button
                          type="button"
                          onClick={() => handleStatementCorrectChange(idx, 'BENAR')}
                          className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                            stmt.correct === 'BENAR'
                              ? 'bg-[#087443] text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          BENAR
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatementCorrectChange(idx, 'SALAH')}
                          className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                            stmt.correct === 'SALAH'
                              ? 'bg-rose-700 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          SALAH
                        </button>
                      </div>

                      {statements.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStatement(idx)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus Pernyataan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* If type is PG or PGK: Options A, B, C, D */}
          {type !== 'BS' && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pilihan Jawaban & Kunci Jawaban
                </label>
                <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                  {type === 'PG'
                    ? 'Klik huruf untuk memilih 1 kunci jawaban'
                    : 'Klik huruf untuk memilih kunci jawaban (>1)'}
                </span>
              </div>

              {[
                { id: 'A', val: optionA, setter: setOptionA },
                { id: 'B', val: optionB, setter: setOptionB },
                { id: 'C', val: optionC, setter: setOptionC },
                { id: 'D', val: optionD, setter: setOptionD },
              ].map((opt) => {
                const isKey = correctAnswers.includes(opt.id);

                return (
                  <div key={opt.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleAnswer(opt.id)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition cursor-pointer ${
                        isKey
                          ? 'bg-[#087443] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                      }`}
                      title={isKey ? 'Kunci Jawaban' : 'Jadikan Kunci'}
                    >
                      {opt.id}
                    </button>
                    <input
                      type="text"
                      required
                      value={opt.val}
                      onChange={(e) => opt.setter(e.target.value)}
                      placeholder={`Teks opsi jawaban ${opt.id}...`}
                      className={`flex-1 p-2.5 rounded-xl border font-medium focus:outline-none ${
                        isKey
                          ? 'border-emerald-500 bg-emerald-50/40 text-slate-900'
                          : 'border-slate-300 focus:border-[#087443]'
                      }`}
                    />
                    {isKey && (
                      <span className="text-xs font-bold text-emerald-700 px-2 py-1 bg-emerald-100 rounded-lg shrink-0">
                        Kunci ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pembahasan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Pembahasan / Keterangan Jawaban (Opsional)
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Tuliskan dalil Al-Qur'an, hadis, atau alasan ilmiah mengapa kunci jawaban tersebut benar..."
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#087443] text-xs font-normal"
            />
          </div>

          {/* Active status checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveQ"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-[#087443] focus:ring-emerald-400"
            />
            <label htmlFor="isActiveQ" className="text-xs font-semibold text-slate-700">
              Aktifkan soal ini di dalam pemilihan ujian
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            Batal
          </button>
          {!initialData && (
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan & Buat Soal Baru</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="py-2.5 px-5 rounded-xl bg-[#087443] hover:bg-[#065b34] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Soal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
