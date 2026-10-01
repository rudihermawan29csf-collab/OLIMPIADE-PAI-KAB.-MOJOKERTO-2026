import React, { useState, useEffect } from 'react';
import { School, Exam, Participant, ExamResult } from '../types';
import { storageService, subscribeToStore } from '../services/storageService';
import { sheetsSyncService } from '../services/sheetsSyncService';
import { useToast } from '../components/Toast';
import { downloadStudentResultPdf } from '../utils/pdfGenerator';
import {
  AlertCircle,
  ArrowRight,
  Shield,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  FileCheck,
  Award,
  BookOpen,
  ArrowLeft,
  X,
  Download,
  Check
} from 'lucide-react';
import { LOGO_KEMENAG_MOJOKERTO, LOGO_MGMP_PAI_MOJOKERTO } from '../constants/branding';

interface StudentLoginProps {
  onSuccess: (participant: Participant, isResume: boolean) => void;
  onOpenAdmin: () => void;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({ onSuccess, onOpenAdmin }) => {
  const { showToast } = useToast();
  const [schools, setSchools] = useState<School[]>(() => storageService.getSchools());
  const [activeExam, setActiveExam] = useState<Exam | undefined>(() => storageService.getActiveExam());

  const [name, setName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [tokenInput, setTokenInput] = useState(() => storageService.getActiveExam()?.token || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Subscribe to reactive store changes (soal baru langsung muncul)
  useEffect(() => {
    const unsub = subscribeToStore(() => {
      const current = storageService.getActiveExam();
      setActiveExam(current);
      setSchools(storageService.getSchools());
      if (current?.token) {
        setTokenInput((prev) => (!prev || prev === 'PAI2026' ? current.token : prev));
      }
    });
    return () => unsub();
  }, []);

  // Tarik Sesi Ujian, Bank Soal & Daftar Sekolah terbaru dari Google Spreadsheet saat halaman dibuka
  useEffect(() => {
    if (sheetsSyncService.isConfigured()) {
      sheetsSyncService.pullExamsFromSheets().then((pulled) => {
        if (pulled && pulled.length > 0) {
          const current = storageService.getActiveExam();
          setActiveExam(current);
          if (current?.token) {
            setTokenInput((prev) => (!prev || prev === 'PAI2026' ? current.token : prev));
          }
        }
      }).catch(() => {});

      sheetsSyncService.pullQuestionsFromSheets().catch(() => {});

      sheetsSyncService.pullSchoolsFromSheets().then((pulled) => {
        if (pulled && pulled.length > 0) {
          setSchools(storageService.getSchools());
        }
      }).catch(() => {});
    }
  }, []);

  // State when student has already completed the exam
  const [alreadyCompletedData, setAlreadyCompletedData] = useState<{
    participant: Participant;
    result: ExamResult | undefined;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!activeExam) {
      setError('Tidak ada jadwal ujian yang aktif saat ini. Silakan hubungi Panitia / Pengawas Ruang.');
      return;
    }

    // Periksa tanggal dan jam ujian
    const now = Date.now();
    const startTime = new Date(activeExam.startAt).getTime();
    const endTime = new Date(activeExam.endAt).getTime();

    if (!isNaN(startTime) && now < startTime) {
      const startStr = new Date(activeExam.startAt).toLocaleString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      setError(`Sesi ujian belum dapat dilaksanakan. Sesi ujian baru akan dibuka pada ${startStr} WIB.`);
      return;
    }

    if (!isNaN(endTime) && now > endTime) {
      const endStr = new Date(activeExam.endAt).toLocaleString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      setError(`Sesi ujian telah ditutup pada ${endStr} WIB. Ujian sudah tidak dapat dilaksanakan.`);
      return;
    }

    if (!name.trim()) {
      setError('Silakan masukkan nama lengkap siswa.');
      return;
    }

    if (!schoolName.trim()) {
      setError('Silakan masukkan nama asal sekolah (SMP / MTs).');
      return;
    }

    if (tokenInput.trim().toUpperCase() !== activeExam.token.trim().toUpperCase()) {
      setError(`Token ujian tidak valid. Pastikan token sesuai dengan yang dirilis oleh Panitia/Pengawas (${activeExam.token}).`);
      return;
    }

    const cleanSchoolName = schoolName.trim();
    const matchedSchool = schools.find(
      (s) => s.name.trim().toLowerCase() === cleanSchoolName.toLowerCase()
    );
    const finalSchoolId = matchedSchool
      ? matchedSchool.id
      : `sch-${cleanSchoolName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'manual'}`;

    setIsSubmitting(true);
    try {
      const result = storageService.registerParticipant({
        name: name.trim(),
        schoolId: finalSchoolId,
        schoolName: cleanSchoolName,
        examId: activeExam.id,
      });

      // Jika siswa sudah menyelesaikan ujian sebelumnya
      if (result.alreadyCompleted) {
        setAlreadyCompletedData({
          participant: result.participant,
          result: result.result,
        });
        return;
      }

      onSuccess(result.participant, result.isResume);
    } catch (err: any) {
      setError(err?.message || 'Gagal memulai sesi ujian.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!alreadyCompletedData || !alreadyCompletedData.result) {
      showToast('Data hasil ujian tidak ditemukan.', 'error');
      return;
    }

    setIsDownloadingPdf(true);
    try {
      const ok = downloadStudentResultPdf(
        alreadyCompletedData.participant,
        alreadyCompletedData.result,
        activeExam?.title
      );
      if (ok) {
        setDownloadSuccess(true);
        showToast('Dokumen PDF bukti nilai berhasil diunduh!', 'success');
        setTimeout(() => setDownloadSuccess(false), 3500);
      } else {
        showToast('Gagal memproses dokumen PDF bukti nilai.', 'error');
      }
    } catch (err) {
      console.error('PDF Download Error:', err);
      showToast('Gagal mengunduh dokumen PDF.', 'error');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintProof = () => {
    try {
      window.print();
    } catch (e) {
      // Fallback to download if print is restricted
      handleDownloadPdf();
    }
  };

  const handleCloseCompletedView = () => {
    setAlreadyCompletedData(null);
    setName('');
    setSchoolName('');
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 bg-[#F8FAF8]">
      <div className="max-w-xl w-full">
        
        {/* Clean & Elegant Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="inline-block p-1.5 bg-white rounded-2xl border border-emerald-900/20 shadow-xs">
              <img
                src={LOGO_KEMENAG_MOJOKERTO}
                alt="Logo Kemenag Kabupaten Mojokerto"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
              />
            </div>
            <div className="inline-block p-1 bg-white rounded-2xl border border-emerald-900/20 shadow-xs">
              <img
                src={LOGO_MGMP_PAI_MOJOKERTO}
                alt="Logo MGMP PAI Kabupaten Mojokerto"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover"
              />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            OLIMPIADE PAI KABUPATEN MOJOKERTO
          </h1>
          <p className="text-xs sm:text-sm text-emerald-800 font-medium mt-1">
            Kemenag Kab. Mojokerto • MGMP PAI Jenjang SMP
          </p>
        </div>

        {/* TAMPILAN JIKA SISWA SUDAH PERNAH MENGERJAKAN UJIAN */}
        {alreadyCompletedData ? (
          <div className="bg-white rounded-2xl shadow-md border-2 border-emerald-700/30 p-6 sm:p-8 animate-fade-in">
            {/* Header Alert */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-300 mb-6 text-amber-950">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h3 className="font-bold text-sm sm:text-base leading-tight">
                  Anda Sudah Menyelesaikan Ujian Ini
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Setiap peserta hanya diperkenankan mengerjakan ujian sebanyak <strong>1 (satu) kali</strong>.
                </p>
              </div>
            </div>

            {/* Biodata Siswa */}
            <div className="bg-[#FAFDFB] border border-emerald-900/15 rounded-xl p-4 mb-6 text-xs space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Nama Peserta:</span>
                <span className="font-bold text-slate-900 text-sm">{alreadyCompletedData.participant.name}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Asal Sekolah:</span>
                <span className="font-bold text-emerald-800">{alreadyCompletedData.participant.schoolName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">ID / Nomor Peserta:</span>
                <span className="font-mono font-bold text-slate-800">{alreadyCompletedData.participant.participantNumber}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Sesi Ujian:</span>
                <span className="font-semibold text-slate-700">{activeExam?.title || 'Olimpiade PAI'}</span>
              </div>
              {alreadyCompletedData.result && (
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-slate-500 font-medium">Waktu Selesai:</span>
                  <span className="font-mono text-slate-800">
                    {new Date(alreadyCompletedData.result.submittedAt).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })} WIB
                  </span>
                </div>
              )}
            </div>

            {/* Skor & Rincian Hasil */}
            {alreadyCompletedData.result ? (
              <div className="space-y-4 mb-6">
                {/* Big Score Box */}
                <div className="bg-[#087443] rounded-xl p-5 text-white text-center shadow-xs">
                  <span className="text-xs uppercase tracking-wider font-semibold text-emerald-100 block">
                    Skor Nilai Hasil Ujian
                  </span>
                  <div className="text-4xl sm:text-5xl font-black text-amber-300 font-mono my-1 tracking-tight">
                    {alreadyCompletedData.result.score}
                  </div>
                  <span className="text-xs text-emerald-100 font-medium">
                    Skala Penilaian: 0 — 100
                  </span>
                </div>

                {/* Question Breakdown Stats */}
                <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-center gap-1 text-emerald-700 font-bold mb-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Benar</span>
                    </div>
                    <span className="text-lg font-black text-emerald-950 font-mono">
                      {alreadyCompletedData.result.correctCount}
                    </span>
                    <span className="text-[10px] text-emerald-800 block">Soal</span>
                  </div>

                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                    <div className="flex items-center justify-center gap-1 text-rose-700 font-bold mb-0.5">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Salah</span>
                    </div>
                    <span className="text-lg font-black text-rose-950 font-mono">
                      {alreadyCompletedData.result.wrongCount}
                    </span>
                    <span className="text-[10px] text-rose-800 block">Soal</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-center gap-1 text-slate-600 font-bold mb-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Kosong</span>
                    </div>
                    <span className="text-lg font-black text-slate-900 font-mono">
                      {alreadyCompletedData.result.unansweredCount}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Soal</span>
                  </div>
                </div>

                {/* Additional duration info */}
                <div className="p-3 bg-[#F8FAF8] rounded-xl border border-slate-200 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#087443]" />
                  <span>
                    Durasi Pengerjaan: <strong>{Math.floor(alreadyCompletedData.result.durationSeconds / 60)} Menit {alreadyCompletedData.result.durationSeconds % 60} Detik</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Total Butir: <strong>{alreadyCompletedData.result.totalQuestions} Soal</strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 text-center mb-6">
                Ujian telah diselesaikan dan jawaban telah terekam di sistem panitia.
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2.5">
              {/* Primary Download PDF Button */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="w-full py-3 px-4 bg-[#087443] hover:bg-[#065b34] text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
              >
                {downloadSuccess ? (
                  <Check className="w-4 h-4 text-emerald-200" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>
                  {isDownloadingPdf
                    ? 'Sedang Memproses Dokumen PDF...'
                    : downloadSuccess
                    ? 'File Bukti Nilai PDF Berhasil Diunduh!'
                    : 'Download Bukti Nilai Resmi (PDF)'}
                </span>
              </button>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handlePrintProof}
                  className="flex-1 py-2.5 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cetak Dokumen</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseCompletedView}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                  <span>Kembali ke Halaman Login</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* FORM LOGIN BIASA (HANYA NAMA & ASAL SEKOLAH) */
          <div className="bg-white rounded-xl shadow-xs border border-emerald-950/10 p-6 sm:p-8">
            
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Masuk Peserta Ujian
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cukup masukkan nama lengkap dan pilih asal sekolah Anda.
                </p>
              </div>
              {activeExam && (
                <span className="text-[11px] font-mono font-semibold text-emerald-800 bg-[#EAF8F0] px-2.5 py-0.5 rounded border border-emerald-200 shrink-0">
                  Token: {activeExam.token}
                </span>
              )}
            </div>

            {/* Active Exam Live Status Card */}
            {activeExam && (
              <div className="mb-5 p-3 rounded-xl bg-gradient-to-r from-[#EAF8F0] to-[#E3F5EC] border border-emerald-300 text-xs text-slate-700 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                    <BookOpen className="w-3.5 h-3.5 text-[#087443]" />
                    <span>{activeExam.title}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Sesi Aktif</span>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-600 flex-wrap">
                  <span className="flex items-center gap-1 text-emerald-900 font-medium">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>
                      <strong>{activeExam.questionCount} Butir Soal</strong> ({activeExam.pgCount ?? 5} PG, {activeExam.pgkCount ?? 3} PGK, {activeExam.bsCount ?? 2} Benar/Salah)
                    </span>
                  </span>
                  <span className="text-emerald-300">•</span>
                  <span className="flex items-center gap-1 text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Durasi: <strong>{activeExam.durationMinutes} Menit</strong></span>
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5 font-medium leading-relaxed">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nama Lengkap Siswa */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Lengkap Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Muhammad Raihan Pratama"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#087443] focus:ring-1 focus:ring-[#087443] transition-colors bg-white"
                />
              </div>

              {/* Asal Sekolah (Ketik Manual) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Asal Sekolah (SMP / MTs) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    list="schools-datalist"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Ketik asal sekolah (Contoh: SMPN 1 Puri / SMPN 3 Pacet / MTsN 1 Mojokerto)"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#087443] focus:ring-1 focus:ring-[#087443] transition-colors bg-white"
                  />
                  {schools.length > 0 && (
                    <datalist id="schools-datalist">
                      {schools.map((s) => (
                        <option key={s.id} value={s.name} />
                      ))}
                    </datalist>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Ketik nama sekolah secara bebas (SMP / MTs Negeri atau Swasta). Saran otomatis akan muncul jika sesuai data.
                </p>
              </div>

              {/* Token Ujian (Auto-filled by active session) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Token Ujian
                  </label>
                  {activeExam && (
                    <span className="text-[10px] text-emerald-800 font-medium">
                      Otomatis sesuai sesi aktif
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                  placeholder="Token rilis ujian"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm font-mono font-bold tracking-wider uppercase text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#087443] focus:ring-1 focus:ring-[#087443] transition-colors bg-[#FAFDFB]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 bg-[#087443] hover:bg-[#065b34] text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50"
              >
                <span>Masuk ke Ujian</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Bottom Info Note */}
            <div className="mt-6 p-3 rounded-lg bg-[#EAF8F0]/70 border border-emerald-800/15 text-[11px] text-emerald-950 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                <strong>Ketentuan Ujian:</strong> Setiap siswa hanya dapat mengerjakan ujian <strong>1 (satu) kali</strong>. Pastikan data nama dan sekolah sudah benar sebelum menekan tombol Masuk.
              </span>
            </div>

            {/* Admin Link */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>MGMP PAI Kabupaten Mojokerto</span>
              <button
                type="button"
                onClick={onOpenAdmin}
                className="text-[#087443] hover:text-[#065b34] font-semibold hover:underline cursor-pointer flex items-center gap-1"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Login Admin</span>
              </button>
            </div>

          </div>
        )}

        {/* Clean Footer */}
        <p className="text-center text-xs text-slate-400 mt-4">
          © 2026 MGMP PAI Kabupaten Mojokerto. Seluruh hak cipta dilindungi.
        </p>

      </div>
    </div>
  );
};
