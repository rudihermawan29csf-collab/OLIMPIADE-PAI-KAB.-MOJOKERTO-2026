import React, { useState } from 'react';
import { AdminUser } from '../types';
import { AdminDashboard } from './AdminDashboard';
import { AdminMonitoring } from './AdminMonitoring';
import { AdminQuestions } from './AdminQuestions';
import { AdminImportExport } from './AdminImportExport';
import { AdminExams } from './AdminExams';
import { AdminSchools } from './AdminSchools';
import { AdminResults } from './AdminResults';
import { AdminViolations } from './AdminViolations';
import { AdminSettings } from './AdminSettings';
import {
  LayoutDashboard,
  Activity,
  BookOpen,
  FileSpreadsheet,
  Calendar,
  School,
  Award,
  ShieldAlert,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  RefreshCw
} from 'lucide-react';
import { LOGO_KEMENAG_MOJOKERTO, LOGO_MGMP_PAI_MOJOKERTO } from '../constants/branding';
import { sheetsSyncService } from '../services/sheetsSyncService';
import { useToast } from '../components/Toast';

interface AdminLayoutProps {
  adminUser: AdminUser;
  onLogout: () => void;
  onGoHome: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  adminUser,
  onLogout,
  onGoHome,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  const handleSyncCloud = async () => {
    setIsSyncingCloud(true);
    try {
      const res = await sheetsSyncService.pullAllFromSheets();
      showToast(
        `Sinkronisasi cloud selesai! Berhasil memuat data terbaru dari Google Spreadsheet.`,
        'success'
      );
    } catch {
      showToast('Gagal menarik data dari Google Spreadsheet.', 'error');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'monitoring', label: 'Monitoring Real-Time', icon: Activity, badge: 'Live' },
    { id: 'questions', label: 'Bank Soal', icon: BookOpen },
    { id: 'import_export', label: 'Import / Export', icon: FileSpreadsheet },
    { id: 'exams', label: 'Sesi & Token', icon: Calendar },
    { id: 'schools', label: 'Sekolah Peserta', icon: School },
    { id: 'results', label: 'Peringkat & Nilai', icon: Award },
    { id: 'violations', label: 'Log Integritas', icon: ShieldAlert },
    { id: 'settings', label: 'Pengaturan Sistem', icon: Settings },
  ];

  const visibleMenuItems = menuItems.filter((item) => {
    if (adminUser.role === 'pengawas') {
      return ['dashboard', 'monitoring', 'results', 'violations'].includes(item.id);
    }
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col md:flex-row bg-[#F8FAF8]">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white border-b border-emerald-950/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-full border border-emerald-900/20">
            <img
              src={LOGO_KEMENAG_MOJOKERTO}
              alt="Kemenag Kab. Mojokerto"
              className="w-7 h-7 object-contain"
            />
            <img
              src={LOGO_MGMP_PAI_MOJOKERTO}
              alt="MGMP PAI"
              className="w-7 h-7 rounded-full object-cover"
            />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block leading-tight">
              Portal Admin CBT
            </span>
            <span className="text-[10px] text-emerald-800 font-medium uppercase">
              Kemenag & MGMP PAI
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`w-64 bg-white border-r border-emerald-950/10 flex flex-col justify-between shrink-0 transition-all z-20 ${
          isMobileMenuOpen
            ? 'fixed inset-y-0 left-0 shadow-xl block'
            : 'hidden md:flex'
        }`}
      >
        <div className="p-4 sm:p-5">
          {/* Organization Logos in Sidebar */}
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-emerald-900/20 shadow-xs">
              <img
                src={LOGO_KEMENAG_MOJOKERTO}
                alt="Kemenag Kab. Mojokerto"
                className="w-7 h-7 object-contain"
              />
              <img
                src={LOGO_MGMP_PAI_MOJOKERTO}
                alt="MGMP PAI Kab. Mojokerto"
                className="w-7 h-7 rounded-full object-cover"
              />
            </div>
            <div>
              <span className="text-xs font-black tracking-tight text-slate-900 block uppercase">
                OLIMPIADE PAI
              </span>
              <span className="text-[10px] text-emerald-800 font-semibold block">
                Kemenag & MGMP PAI
              </span>
            </div>
          </div>

          {/* Admin Identity Card */}
          <div className="p-3.5 rounded-lg bg-[#EAF8F0] border border-emerald-800/15 mb-3">
            <div className="text-[10px] uppercase font-bold text-emerald-900 tracking-wider mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              <span>Admin MGMP PAI</span>
            </div>
            <div className="text-xs font-bold text-slate-900 truncate">
              Admin MGMP PAI
            </div>
            <div className="text-[11px] text-slate-500 font-mono truncate">
              {adminUser.email}
            </div>
          </div>

          {/* Tombol Sinkronisasi Cloud Dua Arah */}
          <button
            type="button"
            onClick={handleSyncCloud}
            disabled={isSyncingCloud}
            className="w-full mb-4 py-2 px-3 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-900 transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50"
            title="Tarik data soal dan hasil ujian terbaru dari Google Spreadsheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isSyncingCloud ? 'animate-spin' : ''}`} />
            <span>{isSyncingCloud ? 'Menyinkronkan...' : 'Sinkronkan Data Cloud'}</span>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#087443] text-white'
                      : 'text-slate-600 hover:bg-emerald-50/70 hover:text-emerald-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 space-y-1.5">
          <button
            onClick={onGoHome}
            className="w-full py-2 px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-xs font-medium flex items-center gap-2 transition cursor-pointer"
          >
            <span>Kembali ke Halaman Depan</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full py-2 px-3 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-medium flex items-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && (
          <AdminDashboard
            adminUser={adminUser}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'monitoring' && <AdminMonitoring />}
        {activeTab === 'questions' && <AdminQuestions />}
        {activeTab === 'import_export' && <AdminImportExport />}
        {activeTab === 'exams' && <AdminExams />}
        {activeTab === 'schools' && <AdminSchools />}
        {activeTab === 'results' && <AdminResults />}
        {activeTab === 'violations' && <AdminViolations />}
        {activeTab === 'settings' && <AdminSettings />}
      </main>
    </div>
  );
};
