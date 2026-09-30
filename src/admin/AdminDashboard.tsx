import React from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  BookOpen,
  Calendar,
  School,
  ArrowRight,
  ShieldAlert,
  FileSpreadsheet,
  Award
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { AdminUser } from '../types';

interface AdminDashboardProps {
  adminUser: AdminUser;
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminUser, onNavigateTab }) => {
  const participants = storageService.getParticipants();
  const questions = storageService.getQuestions();
  const exams = storageService.getExams();
  const schools = storageService.getSchools();
  const violations = storageService.getViolations();
  const activeExam = storageService.getActiveExam();

  const totalParticipants = participants.length;
  const activeParticipants = participants.filter((p) => p.status === 'active').length;
  const completedParticipants = participants.filter((p) => p.status === 'completed').length;
  const warningOrViolated = participants.filter(
    (p) => p.status === 'warning' || p.status === 'violated'
  ).length;

  const logs = storageService.getActivityLogs(8);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl p-6 sm:p-7 border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            Dashboard CBT • MGMP PAI Kabupaten Mojokerto
          </p>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Selamat Datang, Admin MGMP PAI
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Sistem pengawasan dan evaluasi Olimpiade Pendidikan Agama Islam tingkat SMP se-Kabupaten Mojokerto.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigateTab('monitoring')}
            className="px-4 py-2.5 bg-[#087443] hover:bg-[#065b34] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Monitoring Live</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Peserta */}
        <div
          onClick={() => onNavigateTab('monitoring')}
          className="bg-white p-5 rounded-xl border border-emerald-950/10 shadow-xs hover:border-emerald-700/50 transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Total Peserta</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1 font-mono">{totalParticipants}</div>
          <div className="text-[11px] text-slate-500">
            Dari {schools.length} sekolah terdaftar
          </div>
        </div>

        {/* Sedang Ujian */}
        <div
          onClick={() => onNavigateTab('monitoring')}
          className="bg-white p-5 rounded-xl border border-emerald-950/10 shadow-xs hover:border-emerald-700/50 transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-emerald-800">Sedang Ujian</span>
            <div className="w-8 h-8 rounded-lg bg-[#EAF8F0] text-[#087443] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#087443] mb-1 font-mono">{activeParticipants}</div>
          <div className="text-[11px] text-emerald-800 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Peserta aktif saat ini</span>
          </div>
        </div>

        {/* Selesai */}
        <div
          onClick={() => onNavigateTab('results')}
          className="bg-white p-5 rounded-xl border border-emerald-950/10 shadow-xs hover:border-emerald-700/50 transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Ujian Selesai</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1 font-mono">{completedParticipants}</div>
          <div className="text-[11px] text-slate-500">
            {totalParticipants > 0
              ? `${Math.round((completedParticipants / totalParticipants) * 100)}% selesai dikerjakan`
              : 'Belum ada peserta selesai'}
          </div>
        </div>

        {/* Pelanggaran / Warning */}
        <div
          onClick={() => onNavigateTab('violations')}
          className="bg-white p-5 rounded-xl border border-emerald-950/10 shadow-xs hover:border-rose-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-rose-700">Insiden Integritas</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-rose-700 mb-1 font-mono">{violations.length}</div>
          <div className="text-[11px] text-rose-600 font-medium">
            {warningOrViolated} peserta mendapat peringatan
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Exam & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Exam Overview */}
          {activeExam ? (
            <div className="bg-white rounded-xl p-6 border border-emerald-950/10 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Sesi Ujian Aktif
                </span>
                <span className="text-xs font-mono font-bold text-emerald-900 bg-[#EAF8F0] px-2.5 py-1 rounded border border-emerald-300">
                  Token: {activeExam.token}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {activeExam.title}
              </h3>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                {activeExam.description}
              </p>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="bg-[#F8FAF8] p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block font-medium text-[10px] uppercase">Durasi</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">{activeExam.durationMinutes} Menit</span>
                </div>
                <div className="bg-[#F8FAF8] p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block font-medium text-[10px] uppercase">Soal Diambil</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">{activeExam.questionCount} Butir</span>
                </div>
                <div className="bg-[#F8FAF8] p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block font-medium text-[10px] uppercase">Bank Soal</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">{questions.length} Butir</span>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => onNavigateTab('monitoring')}
                  className="flex-1 py-2.5 px-4 bg-[#087443] hover:bg-[#065b34] text-white rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pantau Peserta Ujian</span>
                </button>
                <button
                  onClick={() => onNavigateTab('exams')}
                  className="py-2.5 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  Konfigurasi Sesi
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
              <p className="text-sm text-slate-600 mb-3">Belum ada sesi ujian aktif.</p>
              <button
                onClick={() => onNavigateTab('exams')}
                className="py-2 px-4 bg-[#087443] text-white rounded-lg text-xs font-medium"
              >
                Buat Sesi Ujian
              </button>
            </div>
          )}

          {/* Quick Access Menu Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => onNavigateTab('questions')}
              className="bg-white p-4 rounded-xl border border-emerald-950/10 hover:border-emerald-700/50 text-left transition group cursor-pointer shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-[#EAF8F0] text-[#087443] flex items-center justify-center mb-2.5">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-800">Bank Soal</div>
              <div className="text-[11px] text-slate-500">{questions.length} Butir Soal</div>
            </button>

            <button
              onClick={() => onNavigateTab('import_export')}
              className="bg-white p-4 rounded-xl border border-emerald-950/10 hover:border-emerald-700/50 text-left transition group cursor-pointer shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-[#EAF8F0] text-[#087443] flex items-center justify-center mb-2.5">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-800">Import Excel</div>
              <div className="text-[11px] text-slate-500">Format .XLSX / CSV</div>
            </button>

            <button
              onClick={() => onNavigateTab('schools')}
              className="bg-white p-4 rounded-xl border border-emerald-950/10 hover:border-emerald-700/50 text-left transition group cursor-pointer shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-[#EAF8F0] text-[#087443] flex items-center justify-center mb-2.5">
                <School className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-800">Sekolah Peserta</div>
              <div className="text-[11px] text-slate-500">{schools.length} SMP Terdaftar</div>
            </button>

            <button
              onClick={() => onNavigateTab('results')}
              className="bg-white p-4 rounded-xl border border-emerald-950/10 hover:border-emerald-700/50 text-left transition group cursor-pointer shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-[#EAF8F0] text-[#087443] flex items-center justify-center mb-2.5">
                <Award className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-800">Hasil & Ranking</div>
              <div className="text-[11px] text-slate-500">Rekapitulasi Nilai</div>
            </button>
          </div>
        </div>

        {/* Right: Activity Logs */}
        <div className="bg-white rounded-xl p-5 border border-emerald-950/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#087443]" />
                <span>Log Aktivitas Sistem</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-medium">Terbaru</span>
            </div>

            <div className="space-y-3">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Belum ada log aktivitas tercatat.
                </div>
              ) : (
                logs.map((log) => {
                  let badgeClass = 'bg-slate-100 text-slate-700';
                  if (log.event.includes('LOGIN')) badgeClass = 'bg-blue-50 text-blue-700 border border-blue-200';
                  if (log.event.includes('START')) badgeClass = 'bg-[#EAF8F0] text-[#087443] border border-emerald-200';
                  if (log.event.includes('VIOLATION')) badgeClass = 'bg-rose-50 text-rose-700 border border-rose-200 font-medium';
                  if (log.event.includes('SUBMIT')) badgeClass = 'bg-purple-50 text-purple-700 border border-purple-200';

                  return (
                    <div key={log.id} className="text-xs border-b border-slate-100 pb-2.5 last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${badgeClass}`}>
                          {log.event}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                        </span>
                      </div>
                      <div className="text-slate-600 text-[11px] truncate">
                        {log.metadata?.email || log.metadata?.participantNumber || log.metadata?.type || 'Aktivitas tercatat'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('violations')}
            className="w-full mt-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span>Buka Audit Log Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
