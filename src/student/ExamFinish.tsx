import React, { useState } from 'react';
import { ExamResult, Exam } from '../types';
import { storageService } from '../services/storageService';
import { downloadStudentResultPdf } from '../utils/pdfGenerator';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  ShieldAlert,
  FileText,
  School,
  Award,
  Check,
  X,
  Minus,
  Download,
  Printer
} from 'lucide-react';
import { LOGO_KEMENAG_MOJOKERTO, LOGO_MGMP_PAI_MOJOKERTO } from '../constants/branding';

interface ExamFinishProps {
  result: ExamResult;
  exam: Exam;
  onReturnHome: () => void;
}

export const ExamFinish: React.FC<ExamFinishProps> = ({ result, exam, onReturnHome }) => {
  const isViolated = result.status === 'violated';
  const hideScore = exam.hideScoreFromParticipant;

  const minutes = Math.floor(result.durationSeconds / 60);
  const seconds = result.durationSeconds % 60;

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);

  const handleDownloadPdf = () => {
    setIsDownloading(true);
    try {
      const p = storageService.getParticipantById(result.participantId) || {
        id: result.participantId,
        name: result.participantName,
        schoolId: '',
        schoolName: result.schoolName,
        participantNumber: result.participantNumber,
        examId: result.examId,
        status: result.status,
        lastActiveAt: new Date().toISOString(),
        currentQuestionIndex: 0,
        markedQuestions: [],
        answers: {},
        violationCount: 0,
        attemptId: `ATT-${new Date().getFullYear()}-${result.participantId.slice(-6)}`,
      };
      const ok = downloadStudentResultPdf(p, result, exam.title);
      if (ok) {
        setDownloadDone(true);
        setTimeout(() => setDownloadDone(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center p-4 sm:p-8 bg-[#F8FAF8]">
      <div className="bg-white rounded-xl max-w-lg w-full p-8 sm:p-10 shadow-sm border border-emerald-950/10 text-center relative">
        {/* Header Emblem */}
        <div className="flex justify-center items-center gap-3 mb-5">
          <div className="p-1 bg-white rounded-full border border-emerald-900/20 shadow-xs">
            <img
              src={LOGO_KEMENAG_MOJOKERTO}
              alt="Logo Kemenag Kabupaten Mojokerto"
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain p-1"
            />
          </div>
          <div className="relative p-1 bg-white rounded-full border border-emerald-900/20 shadow-xs">
            <img
              src={LOGO_MGMP_PAI_MOJOKERTO}
              alt="MGMP PAI Kabupaten Mojokerto"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover"
            />
            <div
              className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white ${
                isViolated ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {isViolated ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>

        {/* Title */}
        <p className="text-xs font-semibold text-emerald-800 tracking-wider uppercase mb-1">
          {isViolated ? 'Ujian Dihentikan' : 'Lembar Jawaban Diserahkan'}
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          {isViolated ? 'Status: Diskualifikasi' : 'Alhamdulillah, Ujian Telah Selesai'}
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          {exam.title} • MGMP PAI Kabupaten Mojokerto
        </p>

        {/* Participant Identity Box */}
        <div className="bg-[#F8FAF8] rounded-lg p-4 border border-emerald-950/10 text-left text-xs mb-6 space-y-2.5">
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
            <span className="text-slate-500 font-medium">Nama Peserta</span>
            <span className="font-semibold text-slate-900">{result.participantName}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
            <span className="text-slate-500 font-medium">Asal Sekolah</span>
            <span className="font-semibold text-emerald-800">{result.schoolName}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
            <span className="text-slate-500 font-medium">Nomor Peserta</span>
            <span className="font-mono font-bold text-slate-900">{result.participantNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Waktu Pengumpulan</span>
            <span className="text-slate-700 font-mono">
              {new Date(result.submittedAt).toLocaleTimeString('id-ID')} WIB
            </span>
          </div>
        </div>

        {/* Status Content */}
        {isViolated ? (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-xs text-rose-800 leading-relaxed mb-6 text-left">
            <div className="font-bold flex items-center gap-1.5 mb-1.5 text-rose-900">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Dihentikan Akibat Pelanggaran Integritas</span>
            </div>
            <p>
              Sistem CBT mencatat 3 kali pelanggaran integritas (berpindah tab / meminimalkan window / keluar dari mode layar penuh). Rekam jejak dan waktu telah terdokumentasi di log pengawas panitia.
            </p>
          </div>
        ) : hideScore ? (
          <div className="bg-[#EAF8F0] border border-emerald-800/20 rounded-lg p-5 text-sm text-emerald-950 leading-relaxed mb-6">
            <p className="font-bold text-emerald-900 mb-1.5">
              Jawaban Berhasil Disimpan & Divalidasi
            </p>
            <p className="text-xs text-emerald-800 leading-normal">
              Sesuai dengan pedoman teknis pelaksanaan olimpiade, hasil penilaian dan peringkat akan dirilis resmi oleh Panitia MGMP PAI Kabupaten Mojokerto setelah seluruh peserta menyelesaikan ujian.
            </p>
          </div>
        ) : (
          <div className="mb-6 space-y-4">
            {/* Score Highlight Box */}
            <div className="bg-[#087443] rounded-lg p-6 text-white text-center border border-emerald-900 shadow-xs">
              <span className="text-xs uppercase font-medium tracking-wider text-emerald-100 block mb-1">
                Nilai Akhir Ujian
              </span>
              <div className="text-5xl font-extrabold text-amber-300 font-mono tracking-tight my-1">
                {result.score}
              </div>
              <span className="text-[11px] text-emerald-200">
                Skala 0 - 100
              </span>
            </div>

            {/* Score Details Breakdown */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-medium mb-0.5">Total Soal</span>
                <span className="text-base font-bold text-slate-800 font-mono">{result.totalQuestions}</span>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-[10px] text-emerald-700 block font-medium mb-0.5">Benar</span>
                <span className="text-base font-bold text-emerald-800 font-mono">{result.correctCount}</span>
              </div>
              <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                <span className="text-[10px] text-rose-700 block font-medium mb-0.5">Salah</span>
                <span className="text-base font-bold text-rose-800 font-mono">{result.wrongCount}</span>
              </div>
              <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-600 block font-medium mb-0.5">Kosong</span>
                <span className="text-base font-bold text-slate-700 font-mono">{result.unansweredCount}</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 flex items-center justify-center gap-1.5 pt-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Durasi Pengerjaan: <strong className="text-slate-800">{minutes} menit {seconds} detik</strong></span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="w-full flex items-center justify-center gap-2 bg-[#087443] hover:bg-[#065b34] text-white font-bold py-3 px-6 rounded-xl transition-all text-sm cursor-pointer shadow-sm disabled:opacity-60"
          >
            {downloadDone ? (
              <Check className="w-4 h-4 text-emerald-200" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>
              {isDownloading
                ? 'Sedang Memproses Dokumen PDF...'
                : downloadDone
                ? 'File Bukti Nilai PDF Berhasil Diunduh!'
                : 'Download Bukti Nilai Resmi (PDF)'}
            </span>
          </button>

          <button
            onClick={onReturnHome}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-6 rounded-xl transition-colors text-xs sm:text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Kembali ke Halaman Depan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
