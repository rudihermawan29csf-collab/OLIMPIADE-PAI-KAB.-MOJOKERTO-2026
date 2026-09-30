import React, { useState, useEffect, useMemo } from 'react';
import { Participant, Exam, ViolationLog } from '../types';
import { storageService, subscribeToStore } from '../services/storageService';
import { useToast } from '../components/Toast';
import {
  Users,
  Search,
  CheckCircle2,
  Eye,
  X,
  Activity,
  ShieldAlert,
  Calendar,
  KeyRound,
  Filter,
  Copy,
  Clock,
  Layers,
  Sparkles,
  School as SchoolIcon,
  Check
} from 'lucide-react';

export const AdminMonitoring: React.FC = () => {
  const { showToast } = useToast();
  const [participants, setParticipants] = useState<Participant[]>(() =>
    storageService.getParticipants()
  );
  const [exams, setExams] = useState<Exam[]>(() => storageService.getExams());
  const activeExam = useMemo(() => storageService.getActiveExam(), [exams]);

  // Filters
  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');
  const [selectedToken, setSelectedToken] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedSchool, setSelectedSchool] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Subscribe to reactive store updates
  useEffect(() => {
    const unsubscribe = subscribeToStore(() => {
      setParticipants(storageService.getParticipants());
      setExams(storageService.getExams());
    });
    return () => unsubscribe();
  }, []);

  // Map of exams for fast lookup
  const examMap = useMemo(() => {
    const map = new Map<string, Exam>();
    exams.forEach((e) => map.set(e.id, e));
    return map;
  }, [exams]);

  // Unique tokens across all exams
  const uniqueTokens = useMemo(() => {
    const set = new Set<string>();
    exams.forEach((e) => {
      if (e.token) set.add(e.token.toUpperCase());
    });
    return Array.from(set);
  }, [exams]);

  // Registered schools list
  const schools = useMemo(() => storageService.getSchools(), []);

  // Selected Exam Object (if specific exam selected)
  const currentSelectedExam = useMemo(() => {
    if (selectedExamId === 'ALL') return null;
    return examMap.get(selectedExamId) || null;
  }, [selectedExamId, examMap]);

  // Handle changing exam dropdown
  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    if (examId !== 'ALL') {
      const e = examMap.get(examId);
      if (e && e.token) {
        setSelectedToken(e.token.toUpperCase());
      }
    } else {
      setSelectedToken('ALL');
    }
  };

  // Handle changing token dropdown
  const handleTokenChange = (token: string) => {
    setSelectedToken(token);
    if (token === 'ALL') {
      // Keep exam filter as is or reset
    } else {
      const matchingExam = exams.find(
        (e) => e.token.toUpperCase() === token.toUpperCase()
      );
      if (matchingExam) {
        setSelectedExamId(matchingExam.id);
      }
    }
  };

  // Copy token to clipboard
  const handleCopyToken = (tok: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(tok);
      setCopiedToken(true);
      showToast(`Token ${tok} berhasil disalin ke clipboard!`, 'success');
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  // Base list filtered by exam and token first (for accurate counters)
  const sessionFilteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      // Filter by Exam ID
      if (selectedExamId !== 'ALL' && p.examId !== selectedExamId) {
        return false;
      }

      // Filter by Token
      if (selectedToken !== 'ALL') {
        const pExam = examMap.get(p.examId);
        if (!pExam || pExam.token.toUpperCase() !== selectedToken.toUpperCase()) {
          return false;
        }
      }

      return true;
    });
  }, [participants, selectedExamId, selectedToken, examMap]);

  // Filter participants further for table (by search, status, school)
  const filtered = useMemo(() => {
    return sessionFilteredParticipants.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.participantNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.schoolName.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedSchool !== 'ALL' && p.schoolId !== selectedSchool) {
        return false;
      }

      // Check heartbeat disconnection (> 60s without heartbeat while active)
      const isDisconnected =
        p.status === 'active' &&
        Date.now() - new Date(p.lastActiveAt).getTime() > 60000;

      const effectiveStatus = isDisconnected ? 'disconnected' : p.status;

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'DISCONNECTED') return isDisconnected;
      return effectiveStatus === statusFilter.toLowerCase();
    });
  }, [sessionFilteredParticipants, searchTerm, selectedSchool, statusFilter]);

  // Calculate stats based on current session/token filter
  const activeCount = sessionFilteredParticipants.filter((p) => p.status === 'active').length;
  const warningCount = sessionFilteredParticipants.filter((p) => p.status === 'warning').length;
  const violatedCount = sessionFilteredParticipants.filter((p) => p.status === 'violated').length;
  const completedCount = sessionFilteredParticipants.filter((p) => p.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#087443]" />
            <span>Monitoring Peserta Real-Time</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kontrol dan pantau progres pengerjaan ujian secara live per sesi, token, dan ruang ujian.
          </p>
        </div>

        {/* Live Pulse Indicator & Quick Action */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 bg-[#EAF8F0] border border-emerald-800/20 text-emerald-900 px-3 py-1.5 rounded-lg text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Sinkronisasi Otomatis</span>
          </div>
        </div>
      </div>

      {/* PRIMARY CONTROLS: SESI & TOKEN FILTER BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-950/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-[#087443]" />
            <span>Filter Kontrol Sesi & Token Ujian</span>
          </div>
          <div className="text-xs text-slate-500">
            Menampilkan <strong className="text-slate-900">{sessionFilteredParticipants.length}</strong> peserta pada sesi terpilih
          </div>
        </div>

        {/* Filter Selectors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Pilih Sesi Ujian */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#087443]" />
              <span>Sesi Ujian</span>
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => handleExamChange(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-900 focus:outline-none focus:border-[#087443]"
            >
              <option value="ALL">Semua Sesi Ujian ({exams.length} Sesi)</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} (Token: {ex.token} • {ex.status})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Filter Token Rilis */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#087443]" />
              <span>Token Ujian</span>
            </label>
            <select
              value={selectedToken}
              onChange={(e) => handleTokenChange(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-[#FAFDFB] text-emerald-950 focus:outline-none focus:border-[#087443]"
            >
              <option value="ALL">Semua Token Ujian</option>
              {uniqueTokens.map((tok) => (
                <option key={tok} value={tok}>
                  TOKEN: {tok}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Filter Asal Sekolah */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <SchoolIcon className="w-3.5 h-3.5 text-[#087443]" />
              <span>Asal Sekolah</span>
            </label>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium bg-white text-slate-900 focus:outline-none focus:border-[#087443]"
            >
              <option value="ALL">Semua Sekolah SMP ({schools.length})</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Pencarian Teks */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-[#087443]" />
              <span>Cari Peserta</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nama, sekolah, nomor..."
                className="w-full p-2.5 pl-8 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#087443]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Session Pill Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 text-xs no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0">Pilih Cepat Sesi:</span>
          
          <button
            type="button"
            onClick={() => handleExamChange('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
              selectedExamId === 'ALL'
                ? 'bg-[#087443] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Semua Sesi</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
              {participants.length}
            </span>
          </button>

          {exams.map((ex) => {
            const count = participants.filter((p) => p.examId === ex.id).length;
            const isSelected = selectedExamId === ex.id;

            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => handleExamChange(ex.id)}
                className={`px-3 py-1.5 rounded-lg text-xs shrink-0 transition flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-[#EAF8F0] border-emerald-500 text-emerald-950 font-bold shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="truncate max-w-[180px]">{ex.title}</span>
                <span className="font-mono text-[10px] bg-emerald-100/70 text-emerald-900 px-1.5 py-0.2 rounded font-bold">
                  {ex.token}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Selected Session Info Banner */}
        {currentSelectedExam && (
          <div className="p-3.5 bg-[#FAFDFB] border border-emerald-900/15 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{currentSelectedExam.title}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-emerald-300">
                  {currentSelectedExam.status}
                </span>
              </div>
              <div className="text-slate-600 flex items-center gap-3 flex-wrap text-[11px]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>
                    Jadwal: {new Date(currentSelectedExam.startAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} s.d. {new Date(currentSelectedExam.endAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} WIB
                  </span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{currentSelectedExam.questionCount} Butir ({currentSelectedExam.durationMinutes} Menit)</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-emerald-300">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Token Rilis:</span>
                <span className="font-mono font-bold text-emerald-950 text-sm tracking-wider">
                  {currentSelectedExam.token}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyToken(currentSelectedExam.token)}
                className="py-1.5 px-3 bg-[#087443] hover:bg-[#065b34] text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer"
                title="Salin Token untuk dibagikan ke siswa"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedToken ? 'Disalin' : 'Salin Token'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Counters Strip (Recalculated for selected session & token) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-[#087443] text-white border-[#087443]'
              : 'bg-white text-slate-700 border-emerald-950/10 hover:border-emerald-700/50'
          }`}
        >
          <span className="text-[10px] uppercase font-semibold block opacity-80 mb-1">
            Total Peserta {selectedExamId !== 'ALL' ? 'Sesi Ini' : ''}
          </span>
          <span className="text-2xl font-bold font-mono">{sessionFilteredParticipants.length}</span>
        </button>

        <button
          onClick={() => setStatusFilter('ACTIVE')}
          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
            statusFilter === 'ACTIVE'
              ? 'bg-[#087443] text-white border-[#087443]'
              : 'bg-white text-emerald-900 border-emerald-950/10 hover:border-emerald-700/50'
          }`}
        >
          <span className="text-[10px] uppercase font-semibold block opacity-80 mb-1">Sedang Mengerjakan</span>
          <span className="text-2xl font-bold font-mono">{activeCount}</span>
        </button>

        <button
          onClick={() => setStatusFilter('WARNING')}
          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
            statusFilter === 'WARNING'
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-white text-amber-800 border-emerald-950/10 hover:border-amber-400'
          }`}
        >
          <span className="text-[10px] uppercase font-semibold block opacity-80 mb-1">Peringatan (1-2)</span>
          <span className="text-2xl font-bold font-mono">{warningCount}</span>
        </button>

        <button
          onClick={() => setStatusFilter('VIOLATED')}
          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
            statusFilter === 'VIOLATED'
              ? 'bg-rose-700 text-white border-rose-700'
              : 'bg-white text-rose-800 border-emerald-950/10 hover:border-rose-400'
          }`}
        >
          <span className="text-[10px] uppercase font-semibold block opacity-80 mb-1">Diskualifikasi (3 Strike)</span>
          <span className="text-2xl font-bold font-mono">{violatedCount}</span>
        </button>

        <button
          onClick={() => setStatusFilter('COMPLETED')}
          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
            statusFilter === 'COMPLETED'
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-800 border-emerald-950/10 hover:border-slate-400'
          }`}
        >
          <span className="text-[10px] uppercase font-semibold block opacity-80 mb-1">Selesai Ujian</span>
          <span className="text-2xl font-bold font-mono">{completedCount}</span>
        </button>
      </div>

      {/* Filter Status Quick Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-emerald-950/10 shadow-xs flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-slate-600">
          Menampilkan <strong className="text-slate-900">{filtered.length}</strong> peserta dari total {sessionFilteredParticipants.length} pada filter aktif.
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Status Peserta:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-semibold bg-white focus:outline-none focus:border-[#087443]"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif Mengerjakan</option>
            <option value="WARNING">Dalam Peringatan</option>
            <option value="VIOLATED">Diskualifikasi (3 Strike)</option>
            <option value="COMPLETED">Selesai Mengerjakan</option>
            <option value="DISCONNECTED">Terputus / Idle</option>
          </select>
        </div>
      </div>

      {/* Real-Time Participants Table */}
      <div className="bg-white rounded-xl border border-emerald-950/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF8] border-b border-slate-200 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3.5 w-10 text-center">No</th>
                <th className="py-3 px-3.5">Nama Peserta</th>
                <th className="py-3 px-3.5">Asal Sekolah</th>
                <th className="py-3 px-3.5">Sesi & Token</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-center">Kemajuan</th>
                <th className="py-3 px-3.5 text-center">Sisa Waktu</th>
                <th className="py-3 px-3.5 text-center">Strike</th>
                <th className="py-3 px-3.5 text-center">Aktivitas Terakhir</th>
                <th className="py-3 px-3.5 text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400 text-xs">
                    Tidak ada data peserta yang cocok dengan kriteria filter sesi dan token ini.
                  </td>
                </tr>
              ) : (
                filtered.map((p, index) => {
                  const pExam = examMap.get(p.examId);
                  const answeredCount = Object.keys(p.answers || {}).filter(
                    (qid) => p.answers[qid] && p.answers[qid].length > 0
                  ).length;
                  const totalQuestions = pExam?.questionCount || 10;
                  const isDisconnected =
                    p.status === 'active' &&
                    Date.now() - new Date(p.lastActiveAt).getTime() > 60000;

                  // Remaining time calculation
                  let remainingDisplay = '-';
                  if (p.startedAt && p.status === 'active' && pExam) {
                    const elapsed = Math.floor(
                      (Date.now() - new Date(p.startedAt).getTime()) / 1000
                    );
                    const totalSec = pExam.durationMinutes * 60;
                    const leftSec = Math.max(0, totalSec - elapsed);
                    const m = Math.floor(leftSec / 60);
                    const s = leftSec % 60;
                    remainingDisplay = `${m}m ${s}s`;
                  } else if (p.status === 'completed') {
                    remainingDisplay = 'Selesai';
                  } else if (p.status === 'violated') {
                    remainingDisplay = 'Dihentikan';
                  }

                  // Status badge helper
                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#EAF8F0] text-emerald-900 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Aktif
                    </span>
                  );

                  if (isDisconnected) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        Terputus
                      </span>
                    );
                  } else if (p.status === 'warning') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Warning
                      </span>
                    );
                  } else if (p.status === 'violated') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-900 border border-rose-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                        Diskualifikasi
                      </span>
                    );
                  } else if (p.status === 'completed') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        Selesai
                      </span>
                    );
                  } else if (p.status === 'ready') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                        Siap Mulai
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setSelectedParticipant(p)}
                    >
                      <td className="py-3 px-3.5 text-center font-mono text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-bold text-slate-900 block">{p.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">{p.participantNumber}</span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 font-medium">
                        {p.schoolName}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[11px] font-bold text-emerald-950 bg-[#EAF8F0] px-2 py-0.5 rounded border border-emerald-300">
                            {pExam?.token || 'TOKEN'}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate max-w-[120px]" title={pExam?.title}>
                            {pExam?.title || 'Sesi Ujian'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {statusBadge}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className="font-semibold text-slate-800">
                          {answeredCount}/{totalQuestions}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          terjawab
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono text-slate-700">
                        {remainingDisplay}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[11px] font-mono ${
                            p.violationCount >= 3
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : p.violationCount > 0
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'text-slate-400'
                          }`}
                        >
                          {p.violationCount || 0}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono text-[11px] text-slate-500">
                        {new Date(p.lastActiveAt).toLocaleTimeString('id-ID')}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedParticipant(p);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-[#087443] transition cursor-pointer"
                          title="Lihat Detail Peserta"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL PARTICIPANT INSPECTION MODAL */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-emerald-950/10 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  {selectedParticipant.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedParticipant.schoolName} • ID: {selectedParticipant.participantNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedParticipant(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sesi & Token Info Box */}
            {(() => {
              const pExam = examMap.get(selectedParticipant.examId);
              return (
                <div className="bg-[#FAFDFB] p-3 rounded-lg border border-emerald-900/15 mb-4 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Sesi Ujian Peserta:</span>
                    <span className="font-bold text-slate-900">{pExam?.title || 'Sesi Ujian'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Token:</span>
                    <span className="font-mono font-bold text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-300">
                      {pExam?.token || 'TOKEN'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5 text-center text-xs">
              <div className="bg-[#F8FAF8] p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-medium uppercase">Status</span>
                <span className="text-xs font-bold uppercase text-slate-900">
                  {selectedParticipant.status}
                </span>
              </div>
              <div className="bg-[#F8FAF8] p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-medium uppercase">Soal Aktif</span>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  No. {selectedParticipant.currentQuestionIndex + 1}
                </span>
              </div>
              <div className="bg-[#F8FAF8] p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-medium uppercase">Jawaban</span>
                <span className="text-xs font-bold text-emerald-800 font-mono">
                  {Object.keys(selectedParticipant.answers || {}).length} Soal
                </span>
              </div>
              <div className="bg-[#F8FAF8] p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-medium uppercase">Pelanggaran</span>
                <span className={`text-xs font-bold font-mono ${selectedParticipant.violationCount > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                  {selectedParticipant.violationCount || 0} Kali
                </span>
              </div>
            </div>

            {/* Time & Session Details */}
            <div className="bg-[#F8FAF8] rounded-lg p-3.5 text-xs space-y-2 mb-5 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Attempt ID:</span>
                <span className="font-mono font-medium text-slate-800">{selectedParticipant.attemptId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu Mulai:</span>
                <span className="font-mono text-slate-800">
                  {selectedParticipant.startedAt
                    ? new Date(selectedParticipant.startedAt).toLocaleString('id-ID')
                    : 'Belum dimulai'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Heartbeat Terakhir:</span>
                <span className="font-mono text-slate-800">
                  {new Date(selectedParticipant.lastActiveAt).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Soal Ditandai:</span>
                <span className="font-medium text-amber-800 font-mono">
                  {selectedParticipant.markedQuestions?.length > 0
                    ? selectedParticipant.markedQuestions.map((i) => i + 1).join(', ')
                    : 'Tidak ada'}
                </span>
              </div>
            </div>

            {/* Violation History Log */}
            <div className="mb-5">
              <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>Catatan Pelanggaran Integritas:</span>
              </h4>
              {storageService.getViolations(selectedParticipant.examId).filter(
                (v) => v.participantId === selectedParticipant.id
              ).length === 0 ? (
                <div className="p-3 bg-[#EAF8F0] text-emerald-900 rounded-lg text-xs flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Tidak ada pelanggaran tercatat. Pengerjaan berjalan normal.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {storageService
                    .getViolations(selectedParticipant.examId)
                    .filter((v) => v.participantId === selectedParticipant.id)
                    .map((v) => (
                      <div
                        key={v.id}
                        className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="font-semibold">
                            Pelanggaran #{v.violationNumber}: {v.type}
                          </div>
                          <div className="text-[11px] text-rose-700">{v.detail || 'Terdeteksi keluar dari layar ujian'}</div>
                        </div>
                        <span className="font-mono text-[10px] text-rose-600 shrink-0">
                          {new Date(v.timestamp).toLocaleTimeString('id-ID')}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedParticipant(null)}
                className="py-2 px-4 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
