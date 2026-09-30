import React from 'react';
import { Participant, Exam } from '../types';
import { ShieldCheck, Play, ArrowLeft, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import { LOGO_KEMENAG_MOJOKERTO, LOGO_MGMP_PAI_MOJOKERTO } from '../constants/branding';

interface ExamConfirmationProps {
  participant: Participant;
  exam: Exam;
  isResume: boolean;
  onStartExam: () => void;
  onCancel: () => void;
}

export const ExamConfirmation: React.FC<ExamConfirmationProps> = ({
  participant,
  exam,
  isResume,
  onStartExam,
  onCancel,
}) => {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const now = Date.now();
  const startTime = new Date(exam.startAt).getTime();
  const endTime = new Date(exam.endAt).getTime();

  const isBeforeStart = !isNaN(startTime) && now < startTime;
  const isAfterEnd = !isNaN(endTime) && now > endTime;
  const canStart = !isBeforeStart && !isAfterEnd;

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

  return (
    <div className="min-h-[calc(100vh-60px)] flex flex-col bg-[#F0F5F2] p-4 sm:p-6 lg:p-8 items-center justify-center">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-md border border-emerald-950/15 overflow-hidden">
        
        {/* Kemendikdasmen Header Strip */}
        <div className="bg-[#087443] text-white px-6 py-4 flex items-center justify-between border-b border-emerald-900/40">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-full shadow-xs">
              <img
                src={LOGO_KEMENAG_MOJOKERTO}
                alt="Kemenag Kab. Mojokerto"
                className="w-9 h-9 object-contain"
              />
              <img
                src={LOGO_MGMP_PAI_MOJOKERTO}
                alt="MGMP PAI Kab. Mojokerto"
                className="w-9 h-9 rounded-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide uppercase leading-tight">
                KONFIRMASI DATA PESERTA
              </h2>
              <p className="text-xs text-emerald-100">
                Aplikasi Ujian Berbasis Komputer (CBT) • Kemenag & MGMP PAI Kab. Mojokerto
              </p>
            </div>
          </div>
          <span className="hidden sm:inline text-xs font-mono bg-[#054c2c] px-3 py-1 rounded text-emerald-100 border border-emerald-800">
            KAB. MOJOKERTO
          </span>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Status Alert if Outside Schedule */}
          {!canStart && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-900 flex items-start gap-2.5 font-medium leading-relaxed">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Ujian Tidak Dapat Dilaksanakan Saat Ini</span>
                <span>
                  {isBeforeStart
                    ? `Sesi ujian dijadwalkan dibuka pada ${startFormatted} WIB. Silakan kembali pada waktu tersebut.`
                    : `Sesi ujian telah ditutup pada ${endFormatted} WIB. Batas waktu pelaksanaan telah berakhir.`}
                </span>
              </div>
            </div>
          )}

          {/* Status Alert if Resuming */}
          {isResume && canStart && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-center gap-2.5 font-medium">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                Sesi ujian Anda sebelumnya terdeteksi masih aktif. Seluruh jawaban tersimpan aman dan Anda dapat melanjutkan pengerjaan.
              </span>
            </div>
          )}

          {/* Kemendikdasmen Data Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden text-xs sm:text-sm">
            <table className="w-full">
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-slate-50/70">
                  <td className="py-2.5 px-4 font-semibold text-slate-600 w-1/3 border-r border-slate-200">
                    Kode Ujian
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-800">
                    OLM-PAI-SMP-2026
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-600 border-r border-slate-200">
                    Nama Ujian / Tes
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    {exam.title}
                  </td>
                </tr>

                <tr className="bg-slate-50/70">
                  <td className="py-2.5 px-4 font-semibold text-slate-600 border-r border-slate-200">
                    Mata Pelajaran
                  </td>
                  <td className="py-2.5 px-4 font-bold text-emerald-900">
                    Pendidikan Agama Islam (PAI & Budi Pekerti)
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-600 border-r border-slate-200">
                    Status Peserta
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-[#EAF8F0] px-2.5 py-0.5 rounded border border-emerald-300 text-xs">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {isResume ? 'Melanjutkan Sesi Ujian' : 'Peserta Ujian Baru (Terverifikasi)'}
                    </span>
                  </td>
                </tr>

                <tr className="bg-slate-50/70">
                  <td className="py-2.5 px-4 font-semibold text-slate-600 border-r border-slate-200">
                    Nama Peserta
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-900 text-base">
                    {participant.name}
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-600 border-r border-slate-200">
                    Asal Sekolah
                  </td>
                  <td className="py-2.5 px-4 font-bold text-emerald-800">
                    {participant.schoolName}
                  </td>
                </tr>

                <tr className="bg-slate-50/70">
                  <td className="py-2.5 px-4 font-semibold text-slate-600 border-r border-slate-200">
                    Nomor Peserta
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-900 text-base">
                    {participant.participantNumber}
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-600 border-r border-slate-200">
                    Rentang Waktu Ujian
                  </td>
                  <td className="py-2.5 px-4 text-slate-700 font-mono text-xs">
                    {startFormatted} s.d. {endFormatted} WIB
                  </td>
                </tr>

                <tr className="bg-slate-50/70">
                  <td className="py-2.5 px-4 font-semibold text-slate-600 border-r border-slate-200">
                    Alokasi Waktu Pengerjaan
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                    {exam.durationMinutes} Menit (Timer Otomatis)
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-600 border-r border-slate-200">
                    Jumlah Butir Soal
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    <span>{exam.questionCount} Butir</span>
                    <span className="text-xs text-slate-500 font-normal ml-2">
                      ({exam.pgCount ?? 5} PG, {exam.pgkCount ?? 3} PGK, {exam.bsCount ?? 2} Benar/Salah)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Kemendikdasmen Warning Box */}
          <div className="bg-[#EAF8F0] border-l-4 border-[#087443] p-4 text-xs text-emerald-950 space-y-1.5 rounded-r-lg">
            <div className="font-bold flex items-center gap-1.5 uppercase tracking-wide text-[#087443]">
              <ShieldCheck className="w-4 h-4 text-[#087443]" />
              <span>PERHATIAN DAN TATA TERTIB PESERTA:</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              Pastikan data identitas di atas sudah benar. Begitu tombol <strong>MULAI</strong> ditekan, aplikasi akan masuk ke mode <strong>Layar Penuh (Fullscreen)</strong> dan timer ujian langsung berjalan. Dilarang berpindah tab peramban atau meminimize window. Pelanggaran 3 kali akan menyebabkan ujian terhenti otomatis.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>BATAL / GANTI PESERTA</span>
            </button>

            <button
              type="button"
              onClick={onStartExam}
              disabled={!canStart}
              className={`w-full sm:w-auto px-8 py-3 text-white text-sm font-black rounded-lg shadow-sm transition flex items-center justify-center gap-2 uppercase tracking-wider ${
                canStart
                  ? 'bg-[#087443] hover:bg-[#065b34] cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isResume ? 'LANJUTKAN UJIAN' : 'MULAI UJIAN'}</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-2.5 border-t border-slate-200 text-center text-[10px] text-slate-500 font-medium">
          MGMP PAI Kabupaten Mojokerto © 2026
        </div>
      </div>
    </div>
  );
};
