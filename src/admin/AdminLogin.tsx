import React, { useState } from 'react';
import {
  KeyRound,
  Mail,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  MapPin,
  Building2,
  X,
  Check,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AdminUser, OrgSettings } from '../types';
import { DEMO_ADMINS } from '../services/seedData';
import { storageService, DEFAULT_ORG_SETTINGS } from '../services/storageService';
import { LOGO_KEMENAG_MOJOKERTO, LOGO_MGMP_PAI_MOJOKERTO } from '../constants/branding';
import { useToast } from '../components/Toast';

interface AdminLoginProps {
  onSuccess: (user: AdminUser) => void;
  onBack: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onBack }) => {
  const { loginAdmin } = useAuth();
  const { showToast } = useToast();
  const defaultAdminEmail = 'admin@mgmppai-mojokerto.sch.id';

  // Otomatis terisi pilihan akun login admin
  const [selectedPreset, setSelectedPreset] = useState<string>(defaultAdminEmail);
  const [email, setEmail] = useState<string>(defaultAdminEmail);
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Atur Nama & Alamat Sekretariat
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [orgSettings, setOrgSettings] = useState<OrgSettings>(() => storageService.getOrgSettings());

  // Form State dalam Modal
  const [formOffice, setFormOffice] = useState(orgSettings.officeName);
  const [formOrg, setFormOrg] = useState(orgSettings.organizationName);
  const [formAddress, setFormAddress] = useState(orgSettings.secretariatAddress);

  // Handle Preset Selection via Dropdown
  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPreset(val);
    setError(null);

    if (!val || val === 'custom') {
      setEmail('');
      setPassword('');
      return;
    }

    const foundAdmin = DEMO_ADMINS.find((a) => a.email.toLowerCase() === val.toLowerCase());
    if (foundAdmin) {
      setEmail(foundAdmin.email);
      setPassword(''); // Password dikosongkan agar diisi manual oleh admin
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email admin wajib diisi.');
      return;
    }
    if (!password) {
      setError('Kata sandi admin wajib diisi.');
      return;
    }

    // Validasi kata sandi admin tetap menggunakan: admin123
    if (password !== 'admin123') {
      setError('Kata sandi yang Anda masukkan salah. Silakan periksa kembali.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = loginAdmin(email, password);
      onSuccess(user);
    } catch (err: any) {
      setError(err?.message || 'Login admin gagal. Periksa kembali akun Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveOrgSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = storageService.saveOrgSettings({
      officeName: formOffice.trim(),
      organizationName: formOrg.trim(),
      secretariatAddress: formAddress.trim(),
    });
    setOrgSettings(updated);
    setIsOrgModalOpen(false);
    showToast('Identitas lembaga dan alamat sekretariat berhasil disimpan!', 'success');
  };

  const handleResetOrgSettings = () => {
    setFormOffice(DEFAULT_ORG_SETTINGS.officeName);
    setFormOrg(DEFAULT_ORG_SETTINGS.organizationName);
    setFormAddress(DEFAULT_ORG_SETTINGS.secretariatAddress);
    storageService.saveOrgSettings(DEFAULT_ORG_SETTINGS);
    setOrgSettings(DEFAULT_ORG_SETTINGS);
    showToast('Identitas dan alamat sekretariat dikembalikan ke default.', 'info');
  };

  const currentAdminPreset = DEMO_ADMINS.find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase()
  );

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center p-4 sm:p-8 bg-[#F8FAF8]">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 sm:p-8 shadow-xs border border-emerald-950/10 relative">
        {/* Top Bar: Back & Settings */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={onBack}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Halaman Peserta</span>
          </button>

          {/* Tombol Atur Nama & Alamat Sekretariat */}
          <button
            type="button"
            onClick={() => {
              setFormOffice(orgSettings.officeName);
              setFormOrg(orgSettings.organizationName);
              setFormAddress(orgSettings.secretariatAddress);
              setIsOrgModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#087443] hover:text-[#065b34] bg-[#EAF8F0] hover:bg-emerald-100/70 px-2.5 py-1 rounded-lg border border-emerald-300 transition cursor-pointer"
            title="Atur Nama Organisasi & Alamat Sekretariat"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Atur Sekretariat</span>
          </button>
        </div>

        {/* Header dengan Logo yang Sesuai di Aplikasi */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3.5 mb-3">
            <div className="inline-block p-1.5 bg-white rounded-2xl border border-emerald-900/20 shadow-xs">
              <img
                src={LOGO_KEMENAG_MOJOKERTO}
                alt="Kemenag Kab. Mojokerto"
                className="w-12 h-12 object-contain"
              />
            </div>
            <div className="inline-block p-1 bg-white rounded-full border border-emerald-900/20 shadow-xs">
              <img
                src={LOGO_MGMP_PAI_MOJOKERTO}
                alt="MGMP PAI Kabupaten Mojokerto"
                className="w-12 h-12 rounded-full object-cover"
              />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Login Admin & Proktor</h2>
          <p className="text-xs font-semibold text-emerald-800 mt-1">
            {orgSettings.organizationName}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {orgSettings.officeName}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium leading-relaxed">
            {error}
          </div>
        )}

        {/* Dropdown Pilihan Akun Admin (Otomatis Terpilih) */}
        <div className="mb-5 p-3.5 rounded-lg bg-[#EAF8F0]/80 border border-emerald-700/20">
          <label className="block text-xs font-bold text-emerald-950 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Pilihan Akun Admin</span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
              Terpilih Otomatis
            </span>
          </label>
          <div className="relative">
            <select
              value={selectedPreset}
              onChange={handleDropdownChange}
              className="w-full bg-white px-3 py-2.5 pr-8 rounded-lg border border-emerald-600/30 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#087443] focus:ring-1 focus:ring-[#087443] transition appearance-none cursor-pointer"
            >
              <option value="admin@mgmppai-mojokerto.sch.id">
                Admin MGMP PAI (Akses Penuh Pengawas)
              </option>
              <option value="custom">✏️ Masukkan Email Lain / Mandiri</option>
            </select>
            <ChevronDown className="w-4 h-4 text-emerald-700 absolute right-3 top-3 pointer-events-none" />
          </div>

          {currentAdminPreset && (
            <div className="mt-2.5 pt-2.5 border-t border-emerald-900/10 text-[11px] text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span className="font-semibold">Akun Resmi Panitia & Proktor CBT</span>
              </div>
              <span className="font-mono text-[10px] bg-emerald-100/90 px-2 py-0.5 rounded text-emerald-800 font-bold uppercase">
                Admin MGMP
              </span>
            </div>
          )}
        </div>

        {/* Login Form */}
        <form onSubmit={handleManualLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Akun Admin
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSelectedPreset('custom');
                }}
                placeholder="nama@mgmppai-mojokerto.sch.id"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#087443] focus:ring-1 focus:ring-[#087443] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi admin..."
                autoComplete="current-password"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#087443] focus:ring-1 focus:ring-[#087443] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-[#087443] hover:bg-[#065b34] text-white font-medium py-3 px-4 rounded-lg shadow-xs transition text-xs sm:text-sm cursor-pointer disabled:opacity-50"
          >
            <span>Masuk ke Dashboard Admin</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer: Alamat Sekretariat & Branding */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <div className="flex items-start justify-center gap-1.5 text-[11px] text-slate-500 max-w-sm mx-auto">
            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
            <span className="leading-tight">{orgSettings.secretariatAddress}</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            Portal Resmi CBT Musyawarah Guru Mata Pelajaran PAI SMP Kab. Mojokerto
          </div>
        </div>
      </div>

      {/* MODAL PENGATURAN IDENTITAS & ALAMAT SEKRETARIAT */}
      {isOrgModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Building2 className="w-5 h-5 text-[#087443]" />
                <span>Pengaturan Identitas & Alamat Sekretariat</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOrgModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Logo yang Sesuai di Aplikasi */}
            <div className="p-3.5 bg-[#FAFDFB] rounded-xl border border-emerald-900/15 mb-4">
              <span className="block text-[11px] font-bold text-emerald-950 uppercase tracking-wide mb-2">
                Logo Resmi Terpasang di Aplikasi & Kop Ujian
              </span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                  <img
                    src={LOGO_KEMENAG_MOJOKERTO}
                    alt="Logo Kemenag"
                    className="w-8 h-8 object-contain"
                  />
                  <span className="text-[11px] font-semibold text-slate-700">Kemenag Mojokerto</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                  <img
                    src={LOGO_MGMP_PAI_MOJOKERTO}
                    alt="Logo MGMP"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-[11px] font-semibold text-slate-700">MGMP PAI SMP</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                *Kedua logo di atas otomatis dicantumkan pada antarmuka aplikasi dan dokumen PDF hasil ujian siswa.
              </p>
            </div>

            <form onSubmit={handleSaveOrgSettings} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kantor Kemenag Daerah
                </label>
                <input
                  type="text"
                  required
                  value={formOffice}
                  onChange={(e) => setFormOffice(e.target.value)}
                  placeholder="KANTOR KEMENTERIAN AGAMA KABUPATEN MOJOKERTO"
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#087443] focus:ring-1 focus:ring-[#087443]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Organisasi MGMP
                </label>
                <input
                  type="text"
                  required
                  value={formOrg}
                  onChange={(e) => setFormOrg(e.target.value)}
                  placeholder="MUSYAWARAH GURU MATA PELAJARAN (MGMP) PAI SMP"
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#087443] focus:ring-1 focus:ring-[#087443]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Lengkap Sekretariat & Kontak
                </label>
                <textarea
                  required
                  rows={2}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Jl. Kedungmungal No. 1, Kab. Mojokerto, Jawa Timur 61382 • Email: mgmppai.mojokerto@gmail.com"
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#087443] focus:ring-1 focus:ring-[#087443]"
                />
                <span className="text-[10px] text-slate-500">
                  Alamat ini akan dicetak pada Kop Surat Dokumen PDF dan halaman utama login.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleResetOrgSettings}
                  className="py-2 px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOrgModalOpen(false)}
                    className="py-2 px-3.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-[#087443] hover:bg-[#065b34] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan Pengaturan</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
