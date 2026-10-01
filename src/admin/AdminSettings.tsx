import React, { useState } from 'react';
import { isFirebaseConfigured, firebaseEnvConfig } from '../firebase/firebaseConfig';
import { storageService, DEFAULT_ORG_SETTINGS } from '../services/storageService';
import { sheetsSyncService } from '../services/sheetsSyncService';
import { sheetsExportService } from '../services/sheetsExportService';
import { GOOGLE_APPS_SCRIPT_CODE } from '../constants/googleAppsScriptCode';
import { LOGO_KEMENAG_MOJOKERTO, LOGO_MGMP_PAI_MOJOKERTO } from '../constants/branding';
import { useToast } from '../components/Toast';
import {
  Settings,
  Database,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Info,
  FileSpreadsheet,
  Link,
  Copy,
  Check,
  Send,
  Code,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Building2,
  MapPin,
  Download,
  Table,
  ClipboardCheck
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { showToast } = useToast();

  // Organization & Secretariat State
  const [orgSettings, setOrgSettings] = useState(() => storageService.getOrgSettings());
  const [officeName, setOfficeName] = useState(orgSettings.officeName);
  const [organizationName, setOrganizationName] = useState(orgSettings.organizationName);
  const [secretariatAddress, setSecretariatAddress] = useState(orgSettings.secretariatAddress);

  // Apps Script URL state
  const [appsScriptUrl, setAppsScriptUrl] = useState(() => sheetsSyncService.getUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = storageService.saveOrgSettings({
      officeName: officeName.trim(),
      organizationName: organizationName.trim(),
      secretariatAddress: secretariatAddress.trim(),
    });
    setOrgSettings(updated);
    showToast('Identitas lembaga dan alamat sekretariat berhasil disimpan!', 'success');
  };

  const handleResetOrg = () => {
    setOfficeName(DEFAULT_ORG_SETTINGS.officeName);
    setOrganizationName(DEFAULT_ORG_SETTINGS.organizationName);
    setSecretariatAddress(DEFAULT_ORG_SETTINGS.secretariatAddress);
    storageService.saveOrgSettings(DEFAULT_ORG_SETTINGS);
    setOrgSettings(DEFAULT_ORG_SETTINGS);
    showToast('Identitas lembaga & alamat sekretariat dikembalikan ke default.', 'info');
  };

  const handleSaveUrl = () => {
    sheetsSyncService.setUrl(appsScriptUrl);
    showToast('URL Google Apps Script berhasil disimpan!', 'success');
  };

  const handleTestConnection = async () => {
    if (!appsScriptUrl.trim()) {
      showToast('Masukkan URL Web App Google Apps Script terlebih dahulu.', 'error');
      return;
    }

    setIsTesting(true);
    try {
      await sheetsSyncService.testConnection(appsScriptUrl.trim());
      sheetsSyncService.setUrl(appsScriptUrl.trim());
      showToast('Sinyal tes berhasil dikirim ke Google Apps Script!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal terhubung ke Google Apps Script.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleExportAll = async () => {
    if (!sheetsSyncService.isConfigured()) {
      showToast('Konfigurasikan dan simpan URL Web App terlebih dahulu.', 'error');
      return;
    }

    setIsExporting(true);
    try {
      const participants = storageService.getParticipants();
      const results = storageService.getResults();
      const exams = storageService.getExams();
      const questions = storageService.getQuestions();
      const schools = storageService.getSchools();
      const violations = storageService.getViolations();

      await sheetsSyncService.exportAll({
        participants,
        results,
        exams,
        questions,
        schools,
        violations,
      });

      showToast('Seluruh 6 sheet (Peserta, Hasil, Sesi & Token, Soal, Sekolah, Pelanggaran) berhasil dikirim ke Google Spreadsheet!', 'success');
    } catch (err: any) {
      showToast('Gagal mengekspor data ke Google Sheets.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const [copiedResults, setCopiedResults] = useState(false);
  const [copiedQuestions, setCopiedQuestions] = useState(false);
  const [copiedExams, setCopiedExams] = useState(false);
  const [copiedViolations, setCopiedViolations] = useState(false);

  const handleDownloadExcel = () => {
    const success = sheetsExportService.exportToExcel();
    if (success) {
      showToast('File spreadsheet (.xlsx) lengkap berhasil diunduh! Siap dibuka di Google Drive/Google Sheets.', 'success');
    } else {
      showToast('Gagal mengunduh file spreadsheet.', 'error');
    }
  };

  const handleCopyResults = () => {
    if (navigator.clipboard) {
      const text = sheetsExportService.copyResultsToClipboard();
      navigator.clipboard.writeText(text);
      setCopiedResults(true);
      showToast('Data Hasil Ujian berhasil disalin! Buka Google Sheets tab HASIL_UJIAN lalu tekan Ctrl+V', 'success');
      setTimeout(() => setCopiedResults(false), 3000);
    }
  };

  const handleCopyQuestions = () => {
    if (navigator.clipboard) {
      const text = sheetsExportService.copyQuestionsToClipboard();
      navigator.clipboard.writeText(text);
      setCopiedQuestions(true);
      showToast('Data Bank Soal berhasil disalin! Buka Google Sheets tab BANK_SOAL lalu tekan Ctrl+V', 'success');
      setTimeout(() => setCopiedQuestions(false), 3000);
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

  const handleCopyViolations = () => {
    if (navigator.clipboard) {
      const text = sheetsExportService.copyViolationsToClipboard();
      navigator.clipboard.writeText(text);
      setCopiedViolations(true);
      showToast('Data Log Pelanggaran berhasil disalin! Buka Google Sheets tab PELANGGARAN lalu tekan Ctrl+V', 'success');
      setTimeout(() => setCopiedViolations(false), 3000);
    }
  };

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopiedCode(true);
      showToast('Kode Google Apps Script berhasil disalin ke clipboard!', 'success');
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'PERINGATAN: Seluruh data hasil ujian, log pelanggaran, dan peserta akan direset kembali ke data awal demo. Apakah Anda yakin?'
      )
    ) {
      storageService.resetAllData();
      showToast('Seluruh data CBT telah berhasil direset ke kondisi default demo!', 'info');
    }
  };

  const isConfigured = sheetsSyncService.isConfigured();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#087443]" />
          <span>Pengaturan Sistem & Identitas Lembaga</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Kelola nama lembaga, alamat sekretariat, logo resmi, dan integrasi sinkronisasi database.
        </p>
      </div>

      {/* CARD 0: IDENTITAS LEMBAGA, ALAMAT SEKRETARIAT & LOGO */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-emerald-950/10 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#EAF8F0] text-[#087443] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Identitas Lembaga & Alamat Sekretariat</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
                  Kop Dokumen CBT
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Atur nama instansi, organisasi MGMP, dan alamat sekretariat yang tampil di aplikasi dan dokumen PDF siswa
              </p>
            </div>
          </div>
        </div>

        {/* Preview Logo yang Sesuai di Aplikasi */}
        <div className="p-4 bg-[#FAFDFB] rounded-xl border border-emerald-900/15">
          <span className="block text-xs font-bold text-emerald-950 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Logo Resmi Aplikasi & Kop Surat Ujian</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="w-12 h-12 rounded-lg bg-emerald-50/50 border border-emerald-100 flex items-center justify-center p-1 shrink-0">
                <img
                  src={LOGO_KEMENAG_MOJOKERTO}
                  alt="Logo Kemenag Mojokerto"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Kemenag Kab. Mojokerto</span>
                <span className="text-[11px] text-slate-500">Logo resmi Kementerian Agama Kab. Mojokerto</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-emerald-50/50 border border-emerald-100 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={LOGO_MGMP_PAI_MOJOKERTO}
                  alt="Logo MGMP PAI Mojokerto"
                  className="w-12 h-12 object-cover"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">MGMP PAI SMP Kab. Mojokerto</span>
                <span className="text-[11px] text-slate-500">Logo resmi MGMP Pendidikan Agama Islam</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Pengaturan Nama & Alamat */}
        <form onSubmit={handleSaveOrg} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Kantor Kemenag Daerah
              </label>
              <input
                type="text"
                required
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value)}
                placeholder="KANTOR KEMENTERIAN AGAMA KABUPATEN MOJOKERTO"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-[#087443] focus:ring-1 focus:ring-[#087443] bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Organisasi MGMP
              </label>
              <input
                type="text"
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="MUSYAWARAH GURU MATA PELAJARAN (MGMP) PAI SMP"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-[#087443] focus:ring-1 focus:ring-[#087443] bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>Alamat Lengkap Sekretariat & Kontak Resmi</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400">Dicetak di Kop Dokumen PDF</span>
            </label>
            <textarea
              required
              rows={2}
              value={secretariatAddress}
              onChange={(e) => setSecretariatAddress(e.target.value)}
              placeholder="Jl. Kedungmungal No. 1, Kab. Mojokerto, Jawa Timur 61382 • Email: mgmppai.mojokerto@gmail.com"
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-[#087443] focus:ring-1 focus:ring-[#087443] bg-white"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetOrg}
              className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kembalikan ke Default</span>
            </button>

            <button
              type="submit"
              className="py-2 px-4 bg-[#087443] hover:bg-[#065b34] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Identitas & Alamat</span>
            </button>
          </div>
        </form>
      </div>

      {/* CARD 1: GOOGLE SPREADSHEET & APPS SCRIPT INTEGRATION */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-emerald-950/10 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#EAF8F0] text-[#087443] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Integrasi Google Spreadsheet & Apps Script</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
                  Rekomendasi
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Penyimpanan online multi-perangkat gratis menggunakan Google Sheets Anda sendiri
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wide ${
              isConfigured
                ? 'bg-[#EAF8F0] text-emerald-900 border border-emerald-300'
                : 'bg-amber-50 text-amber-900 border border-amber-300'
            }`}
          >
            {isConfigured ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Webhook Aktif</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>Belum Terhubung</span>
              </>
            )}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Dengan menghubungkan Web App Google Apps Script, setiap ada siswa yang login, mengerjakan soal, atau menyelesaikan ujian di HP/Laptop mana pun, datanya akan <strong>otomatis tersimpan secara langsung (live autosync)</strong> ke dalam Google Spreadsheet Anda.
        </p>

        {/* Input Web App URL */}
        <div className="bg-[#FAFDFB] p-4 rounded-xl border border-emerald-900/15 space-y-3">
          <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-[#087443]" />
              <span>URL Web App Google Apps Script (Exec URL)</span>
            </span>
            <span className="text-[11px] font-normal text-slate-400">
              Contoh: https://script.google.com/macros/s/.../exec
            </span>
          </label>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={appsScriptUrl}
              onChange={(e) => setAppsScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="flex-1 p-2.5 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#087443] focus:ring-1 focus:ring-[#087443] bg-white"
            />
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSaveUrl}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="py-2.5 px-4 bg-[#087443] hover:bg-[#065b34] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isTesting ? 'Menguji...' : 'Tes Koneksi'}</span>
              </button>
              {appsScriptUrl && (
                <a
                  href={appsScriptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  title="Cek respons langsung dari Google di tab baru"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>Buka di Tab Baru</span>
                </a>
              )}
            </div>
          </div>

          {/* DIAGNOSIS KONEKSI APPS SCRIPT */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-300 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>PENTING: Jika Data Belum Masuk ke Spreadsheet Anda</span>
            </div>
            <p className="text-amber-900 leading-relaxed">
              Google Apps Script saat ini merespons dengan status <em>&quot;Sorry, unable to open the file at present&quot;</em> atau meminta login Google. Hal ini terjadi karena salah satu dari 3 hal berikut:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-[11px]">
              <div className="p-2.5 bg-white rounded-lg border border-amber-200">
                <span className="font-bold text-amber-950 block mb-1">1. Belum Beri Izin (Run)</span>
                <span className="text-slate-600 leading-relaxed block">
                  Di Apps Script, pilih fungsi <strong>setupSheets</strong> lalu klik <strong>Jalankan (Run)</strong> dan klik <strong>Izinkan (Allow)</strong> otorisasi akun.
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-amber-200">
                <span className="font-bold text-amber-950 block mb-1">2. Akses Belum &quot;Anyone&quot;</span>
                <span className="text-slate-600 leading-relaxed block">
                  Klik <strong>Deploy &gt; Kelola deployment &gt; Edit &gt; Versi Baru</strong>. Pastikan <em>Who has access</em> dipilih <strong>Siapa saja (Anyone)</strong>.
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-amber-200">
                <span className="font-bold text-amber-950 block mb-1">3. Akun belajar.id Dikunci</span>
                <span className="text-slate-600 leading-relaxed block">
                  Jika akun <em>@guru.smp.belajar.id</em> mengunci akses luar, buat spreadsheet baru di <strong>akun @gmail.com pribadi</strong> yang bebas izin publik.
                </span>
              </div>
            </div>
          </div>

          {/* OPSI EKSPOR DATA KE GOOGLE SPREADSHEET */}
          <div className="pt-3 border-t border-slate-200/80 space-y-3">
            <span className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Table className="w-4 h-4 text-[#087443]" />
              <span>Opsi Kirim & Ekspor Data Hasil Ujian & Bank Soal ke Spreadsheet:</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Card Opsi 1: Unduh File .xlsx Langsung */}
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5 mb-1">
                    <Download className="w-4 h-4 text-emerald-700" />
                    <span>Unduh File Spreadsheet (.xlsx)</span>
                    <span className="text-[9px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                      100% Berhasil
                    </span>
                  </span>
                  <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                    Unduh file Excel berisi seluruh 5 sheet (<strong>HASIL_UJIAN</strong>, <strong>BANK_SOAL</strong>, <strong>PESERTA</strong>, <strong>SESI_UJIAN</strong>, <strong>PELANGGARAN</strong>). File ini bisa langsung dibuka atau diunggah ke Google Drive Anda tanpa kendala izin script!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  className="w-full py-2 px-3 bg-[#087443] hover:bg-[#065b34] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh File Spreadsheet Lengkap</span>
                </button>
              </div>

              {/* Card Opsi 2: Salin ke Clipboard (Tinggal Ctrl+V) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                    <ClipboardCheck className="w-4 h-4 text-slate-700" />
                    <span>Salin Data ke Clipboard (Tinggal Ctrl + V)</span>
                  </span>
                  <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                    Salin baris dan kolom rapi ke memori clipboard. Anda cukup membuka Google Sheets Anda dan menekan <strong>Ctrl + V</strong> di kolom paling atas!
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyResults}
                    className="py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold rounded-lg text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Copy className="w-3 h-3 text-slate-500" />
                    <span>{copiedResults ? 'Disalin!' : 'Salin Hasil'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyQuestions}
                    className="py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold rounded-lg text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Copy className="w-3 h-3 text-slate-500" />
                    <span>{copiedQuestions ? 'Disalin!' : 'Salin Soal'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyExams}
                    className="py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold rounded-lg text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Copy className="w-3 h-3 text-slate-500" />
                    <span>{copiedExams ? 'Disalin!' : 'Salin Sesi & Token'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyViolations}
                    className="py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold rounded-lg text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Copy className="w-3 h-3 text-slate-500" />
                    <span>{copiedViolations ? 'Disalin!' : 'Salin Pelanggaran'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tombol Sinkronisasi ke Web App */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kirim otomatis via Web App Google Apps Script:</span>
              </span>
              <button
                type="button"
                onClick={handleExportAll}
                disabled={isExporting}
                className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isExporting ? 'Mengekspor...' : 'Kirim Seluruh 6 Sheet ke Web App'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* PANDUAN STRUKTUR SPREADSHEET & KODE APPS SCRIPT */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="w-full p-3.5 bg-[#F8FAF8] hover:bg-slate-100 text-left font-bold text-xs text-slate-800 flex items-center justify-between transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#087443]" />
              <span>Panduan Struktur File Spreadsheet & Nama Kolom</span>
            </span>
            {showGuide ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showGuide && (
            <div className="p-4 bg-white text-xs space-y-4 border-t border-slate-200">
              {/* Nama File */}
              <div className="p-3 bg-[#EAF8F0] rounded-lg border border-emerald-300">
                <span className="text-[11px] uppercase font-bold text-emerald-900 block mb-0.5">
                  1. Nama File Google Spreadsheet:
                </span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  DATABASE CBT OLIMPIADE PAI KAB. MOJOKERTO 2026
                </span>
              </div>

              {/* Daftar Sheet & Kolom */}
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-700 block mb-2">
                  2. Nama Sheet & Urutan Kolom (Dibuat Otomatis oleh Kode):
                </span>

                <div className="space-y-2.5">
                  {/* Sheet PESERTA */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-emerald-900">Sheet: PESERTA</span>
                      <span className="text-[10px] text-slate-500 font-mono">12 Kolom</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-700 leading-relaxed bg-white p-2 rounded border border-slate-200">
                      ID Peserta | Nama Lengkap Siswa | Asal Sekolah | Nomor / ID Peserta | ID Sesi Ujian | Status Ujian | Soal Terjawab | Pelanggaran (Strike) | Waktu Mulai | Terakhir Aktif | Attempt ID | Waktu Catat Server
                    </div>
                  </div>

                  {/* Sheet HASIL_UJIAN */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-emerald-900">Sheet: HASIL_UJIAN</span>
                      <span className="text-[10px] text-slate-500 font-mono">15 Kolom</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-700 leading-relaxed bg-white p-2 rounded border border-slate-200">
                      ID Hasil | Nama Lengkap Siswa | Asal Sekolah | Nomor Peserta | Sesi Ujian | Skor Nilai Akhir (0-100) | Jawaban Benar | Jawaban Salah | Kosong / Tidak Dijawab | Total Soal | Persentase Ketuntasan | Durasi (Menit) | Waktu Penyerahan | Status Kelulusan | Waktu Catat Server
                    </div>
                  </div>

                  {/* Sheet PELANGGARAN */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-rose-900">Sheet: PELANGGARAN</span>
                      <span className="text-[10px] text-slate-500 font-mono">9 Kolom</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-700 leading-relaxed bg-white p-2 rounded border border-slate-200">
                      ID Log | Nama Siswa | Asal Sekolah | ID Sesi Ujian | Jenis Pelanggaran | Pelanggaran Ke (Strike) | Detail Pelanggaran | Waktu Kejadian | Waktu Catat Server
                    </div>
                  </div>

                  {/* Sheet SESI_UJIAN */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sky-900">Sheet: SESI_UJIAN</span>
                      <span className="text-[10px] text-slate-500 font-mono">11 Kolom</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-700 leading-relaxed bg-white p-2 rounded border border-slate-200">
                      ID Sesi | Judul Sesi Ujian | Token Rilis | Jumlah Soal | Durasi (Menit) | Waktu Mulai | Waktu Selesai | Status Sesi | Anti Cheat | Acak Soal | Terakhir Diperbarui
                    </div>
                  </div>

                  {/* Sheet BANK_SOAL */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-amber-900">Sheet: BANK_SOAL</span>
                      <span className="text-[10px] text-slate-500 font-mono">11 Kolom</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-700 leading-relaxed bg-white p-2 rounded border border-slate-200">
                      ID Soal | Tipe Soal | Topik / Kompetensi | Tingkat Kesulitan | Butir Pertanyaan | Opsi A | Opsi B | Opsi C | Opsi D | Kunci Jawaban | Pembahasan
                    </div>
                  </div>
                </div>
              </div>

              {/* Panduan 5 Langkah Deploy */}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] uppercase font-bold text-slate-700 block mb-2">
                  3. Cara Pasang & Deploy di Google Apps Script (5 Menit):
                </span>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                  <li>Buka <strong>Google Drive</strong> dan buka Google Spreadsheet database ujian CBT.</li>
                  <li>Di menu atas spreadsheet, klik <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.</li>
                  <li>Hapus seluruh isi <code>Code.gs</code>, lalu tempel kode yang sudah kami perbarui di bawah.</li>
                  <li>Pilih fungsi <code>setupSheets</code> di dropdown toolbar lalu klik <strong>Jalankan (Run)</strong> untuk membuat seluruh sheet (termasuk <code>SESI_UJIAN</code>, <code>DAFTAR_SEKOLAH</code>, <code>BANK_SOAL</code>, <code>PELANGGARAN</code>, <code>HASIL_UJIAN</code>).</li>
                  <li>
                    <strong>Langkah Kunci Penerapan (Deploy):</strong>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-700">
                      <li><strong>Jika Baru Pertama Kali:</strong> Klik <strong>Terapkan (Deploy)</strong> &gt; <strong>Deployment Baru (New Deployment)</strong> &gt; Jenis: <strong>Aplikasi Web</strong> &gt; Akses: <strong>Siapa saja (Anyone)</strong>.</li>
                      <li><strong className="text-amber-900 bg-amber-50 px-1 py-0.5 rounded border border-amber-300">Wajib jika Memperbarui Kode:</strong> Klik <strong>Terapkan (Deploy)</strong> &gt; <strong>Kelola Deployment (Manage Deployments)</strong> &gt; Klik ikon <strong>Pensil (Edit)</strong> &gt; Pada dropdown Versi pilih <strong>Versi Baru (New Version)</strong> &gt; Klik <strong>Terapkan (Deploy)</strong>. <em>(Jika tidak memilih Versi Baru, Google Sheets akan tetap menjalankan kode lama).</em></li>
                      <li>Pastikan <strong>Siapa yang memiliki akses (Who has access)</strong> selalu disetel ke: <strong>Siapa saja (Anyone)</strong>.</li>
                    </ul>
                  </li>
                  <li>Salin <strong>URL Aplikasi Web (Web App URL)</strong> yang berakhiran <code>/exec</code>, lalu tempel di kolom URL di atas dan klik <strong>Simpan</strong>.</li>
                </ol>
              </div>

              {/* Action Tombol Salin Kode */}
              <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="py-2.5 px-4 bg-[#087443] hover:bg-[#065b34] text-white font-bold rounded-lg text-xs flex items-center gap-2 cursor-pointer shadow-xs transition"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Kode Berhasil Disalin!' : 'Salin Kode Google Apps Script (Code.gs)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCodePreview(!showCodePreview)}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>{showCodePreview ? 'Sembunyikan Kode' : 'Lihat Tampilan Kode'}</span>
                </button>
              </div>

              {/* Code Preview Box */}
              {showCodePreview && (
                <div className="mt-3 relative">
                  <pre className="p-4 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-xl overflow-x-auto max-h-96 leading-relaxed">
                    {GOOGLE_APPS_SCRIPT_CODE}
                  </pre>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="absolute right-3 top-3 py-1 px-2.5 bg-white/20 hover:bg-white/30 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Disalin' : 'Salin'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CARD 2: FIREBASE CLOUD DATABASE STATUS */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-emerald-950/10 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EAF8F0] text-[#087443] flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Penyimpanan Lokal & Firebase
              </h3>
              <p className="text-xs text-slate-500">
                Status Local Storage Engine & Sinkronisasi Cloud Firestore
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wide ${
              isFirebaseConfigured
                ? 'bg-[#EAF8F0] text-emerald-900 border border-emerald-300'
                : 'bg-slate-100 text-slate-700 border border-slate-300'
            }`}
          >
            {isFirebaseConfigured ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Terhubung Firebase</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Local Storage Aktif</span>
              </>
            )}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          Aplikasi menggunakan sistem penyimpanan hybrid: <strong>Local Storage & Memory Engine</strong> untuk eksekusi kuis berkecepatan tinggi tanpa lag di browser peserta, dan secara otomatis mengirim rekapan ke <strong>Google Spreadsheet / Cloud</strong> saat koneksi tersedia.
        </p>

        <div className="p-3 bg-[#FAFDFB] border border-emerald-900/10 rounded-lg text-xs text-emerald-950 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            Data peserta, timer sisa waktu, dan jawaban siswa tetap terlindungi di perangkat masing-masing meskipun jaringan internet sekolah sempat terputus (anti-gangguan sinyal).
          </span>
        </div>
      </div>

      {/* CARD 3: MAINTENANCE & RESET CARD */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-emerald-950/10 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1.5 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-rose-600" />
          <span>Pemeliharaan & Inisialisasi Data Demo</span>
        </h3>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Kembalikan data ke kondisi awal demo (10 butir soal PAI, 3 sekolah terdaftar: SMPN 3 Pacet, SMPN 1 Puri, SMPN 2 Pacet, dan membersihkan seluruh sesi riwayat peserta).
        </p>

        <button
          onClick={handleResetData}
          className="py-2 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-medium rounded-lg text-xs flex items-center gap-2 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset ke Data Awal Demo MGMP PAI</span>
        </button>
      </div>
    </div>
  );
};
