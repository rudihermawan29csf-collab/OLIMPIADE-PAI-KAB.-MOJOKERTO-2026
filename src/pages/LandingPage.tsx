import React from 'react';
import {
  BookOpen,
  Users,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowRight,
  School as SchoolIcon,
  CheckCircle2
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { LOGO_KEMENAG_MOJOKERTO, LOGO_MGMP_PAI_MOJOKERTO } from '../constants/branding';

interface LandingPageProps {
  onStartStudent: () => void;
  onOpenAdmin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartStudent, onOpenAdmin }) => {
  const activeExam = storageService.getActiveExam();
  const schools = storageService.getSchools();
  const questions = storageService.getQuestions();
  const participants = storageService.getParticipants();

  return (
    <div className="flex-1 flex flex-col justify-between bg-[#F8FAF9]">
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-16 w-full text-center">
        {/* Official Emblem & Editorial Kicker */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center gap-3.5 mb-4">
            <div className="p-2 bg-white rounded-2xl border border-emerald-800/20 shadow-md">
              <img
                src={LOGO_KEMENAG_MOJOKERTO}
                alt="Logo Kemenag Kabupaten Mojokerto"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain p-1"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-1.5 bg-white rounded-2xl border border-emerald-800/20 shadow-md">
              <img
                src={LOGO_MGMP_PAI_MOJOKERTO}
                alt="Logo Resmi MGMP PAI Kabupaten Mojokerto"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-semibold text-[#087443] tracking-widest uppercase mb-2">
            <span>Kemenag Kab. Mojokerto</span>
            <span className="text-slate-300">·</span>
            <span>MGMP PAI SMP Kab. Mojokerto</span>
          </div>
        </div>

        {/* Display Headline */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#17352A] tracking-tight leading-tight mb-3 [text-wrap:balance]">
          OLIMPIADE PAI KABUPATEN MOJOKERTO
        </h1>
        
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 font-normal leading-relaxed [text-wrap:balance]">
          Platform Computer Based Test (CBT) resmi kompetisi pengetahuan Pendidikan Agama Islam jenjang SMP se-Kabupaten Mojokerto yang objektif, transparan, dan berintegritas.
        </p>

        {/* Primary Dual Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto mb-14">
          <button
            onClick={onStartStudent}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 bg-[#087443] hover:bg-[#0B8F54] text-white font-bold py-3.5 px-7 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-sm cursor-pointer group"
          >
            <span>MASUK SEBAGAI PESERTA</span>
            <ArrowRight className="w-4 h-4 text-amber-300 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={onOpenAdmin}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-semibold py-3.5 px-6 rounded-xl border border-slate-300 hover:border-slate-400 transition-colors text-sm cursor-pointer shadow-2xs"
          >
            <ShieldCheck className="w-4 h-4 text-[#087443]" />
            <span>LOGIN ADMIN</span>
          </button>
        </div>

        {/* Active Exam Overview Card (Clean Editorial Style) */}
        {activeExam && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-left mb-16">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Ujian Aktif Sedang Berlangsung</span>
              </div>
              <div className="text-xs text-slate-500">
                Token Ujian: <strong className="font-mono text-slate-800 tracking-wider ml-1">{activeExam.token}</strong>
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-900 mb-1.5">
              {activeExam.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
              {activeExam.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Durasi Pengerjaan</span>
                <span className="font-bold text-slate-800 tabular-nums">{activeExam.durationMinutes} Menit</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Jumlah Soal</span>
                <span className="font-bold text-slate-800 tabular-nums">{activeExam.questionCount} Butir (PG & PGK)</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Sistem Keamanan</span>
                <span className="font-bold text-emerald-700">Anti-Cheat 3-Strike</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Mode Tampilan</span>
                <span className="font-bold text-slate-800">Layar Penuh (Fullscreen)</span>
              </div>
            </div>
          </div>
        )}

        {/* Institutional Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#087443] flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1 text-sm">5 Pilar Keilmuan PAI</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Menghimpun butir soal kurikulum PAI SMP: Al-Qur'an Hadis, Aqidah, Akhlak, Fiqih, dan Sejarah Kebudayaan Islam (SKI).
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#087443] flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1 text-sm">Integritas CBT & Anti-Curang</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sistem mencatat perpindahan jendela, kehilangan fokus, dan keluar dari mode fullscreen dengan sistem batas 3-strike.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#087443] flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1 text-sm">Monitoring & Skoring Otomatis</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pengawas memantau progres peserta secara langsung. Penilaian PG & PGK diproses otomatis setelah pengerjaan selesai.
            </p>
          </div>
        </div>
      </section>

      {/* Clean Editorial Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">MGMP PAI Kabupaten Mojokerto</span>
            <span>·</span>
            <span>Provinsi Jawa Timur</span>
          </div>
          <div className="text-slate-400 tabular-nums">
            {schools.length} Sekolah Terdaftar · {questions.length} Bank Soal · {participants.length} Peserta
          </div>
        </div>
      </footer>
    </div>
  );
};
