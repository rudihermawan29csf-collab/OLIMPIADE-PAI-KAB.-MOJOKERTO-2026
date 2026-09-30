import React, { useState, useRef } from 'react';
import { excelUtils, ImportPreviewItem } from '../utils/excelUtils';
import { storageService } from '../services/storageService';
import { useToast } from '../components/Toast';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export const AdminImportExport: React.FC = () => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [previewItems, setPreviewItems] = useState<ImportPreviewItem[] | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const questions = storageService.getQuestions();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsLoading(true);
    try {
      const items = await excelUtils.parseQuestionFile(file);
      setPreviewItems(items);
    } catch (err: any) {
      showToast('Gagal membaca file Excel. Pastikan format file valid (.xlsx atau .csv).', 'error');
      console.error('Parse error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteImport = () => {
    if (!previewItems || previewItems.length === 0) return;

    const validItems = previewItems.filter((i) => i.isValid);
    if (validItems.length === 0) {
      showToast('Tidak ada butir soal valid yang dapat diimpor.', 'error');
      return;
    }

    const payload = validItems.map((item) => ({
      subject: item.subject,
      topic: item.topic,
      difficulty: item.difficulty,
      type: item.type,
      stimulus: item.stimulus || undefined,
      question: item.question,
      options: [
        { id: 'A' as const, text: item.optionA },
        { id: 'B' as const, text: item.optionB },
        { id: 'C' as const, text: item.optionC },
        { id: 'D' as const, text: item.optionD },
      ],
      correctAnswers: item.correctAnswers,
      explanation: item.explanation || undefined,
      isActive: true,
    }));

    const importedCount = storageService.importQuestions(payload);
    showToast(`Berhasil mengimpor ${importedCount} soal ke Bank Soal & disinkronkan ke Google Spreadsheet!`, 'success');

    // Reset state
    setPreviewItems(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportAll = () => {
    try {
      excelUtils.exportQuestionsToExcel(questions);
      showToast('Bank soal berhasil diexport ke format Excel (.xlsx)', 'success');
    } catch (err) {
      showToast('Gagal mengekspor bank soal.', 'error');
    }
  };

  const validCount = previewItems ? previewItems.filter((i) => i.isValid).length : 0;
  const invalidCount = previewItems ? previewItems.filter((i) => !i.isValid).length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-[#087443]" />
          <span>Import & Export Bank Soal Excel</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Format spreadsheet resmi MGMP PAI untuk migrasi dan pemuatan massal butir soal CBT.
        </p>
      </div>

      {/* Two Column Setup: Download Template & Export vs Upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Template & Export Card */}
        <div className="bg-white rounded-xl p-6 border border-emerald-950/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-[#EAF8F0] text-[#087443] flex items-center justify-center mb-3">
              <Download className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Template & Unduh Format Soal
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Unduh template Excel berstandar MGMP PAI Kabupaten Mojokerto yang telah dilengkapi format kolom dan contoh butir soal pilihan ganda maupun pilihan ganda kompleks.
            </p>

            <div className="bg-[#F8FAF8] rounded-lg p-3.5 border border-slate-200 text-xs space-y-1 mb-6 text-slate-600">
              <div className="font-semibold text-slate-800">Struktur Kolom Header:</div>
              <p className="font-mono text-[11px] text-slate-500 break-words">
                No | Materi | Submateri | Tingkat | Jenis | Stimulus | Pertanyaan | Opsi A | Opsi B | Opsi C | Opsi D | Kunci | Pembahasan
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => excelUtils.downloadQuestionTemplate()}
              className="flex-1 py-2.5 px-4 bg-[#EAF8F0] hover:bg-emerald-100/70 text-[#087443] border border-emerald-300 font-medium rounded-lg text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Template Excel</span>
            </button>

            <button
              onClick={handleExportAll}
              className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export {questions.length} Soal</span>
            </button>
          </div>
        </div>

        {/* Upload File Card */}
        <div className="bg-white rounded-xl p-6 border border-emerald-950/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-[#EAF8F0] text-[#087443] flex items-center justify-center mb-3">
              <Upload className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Upload Berkas Soal (.xlsx / .csv)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Pilih file Excel dari komputer Anda. Sistem akan memverifikasi integritas baris data sebelum disimpan ke bank soal.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
              id="excelFileInput"
            />

            <label
              htmlFor="excelFileInput"
              className="border border-dashed border-slate-300 hover:border-[#087443] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-[#F8FAF8] hover:bg-[#EAF8F0]/30 transition-all text-center group"
            >
              <FileSpreadsheet className="w-8 h-8 text-slate-400 group-hover:text-[#087443] mb-2 transition-colors" />
              <span className="text-xs font-semibold text-slate-700">
                {selectedFile ? selectedFile.name : 'Klik untuk memilih file Excel (.xlsx / .csv)'}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                Ukuran maksimum file 15 MB
              </span>
            </label>
          </div>

          {isLoading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-emerald-800 font-medium">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Memvalidasi butir soal dalam file...</span>
            </div>
          )}
        </div>
      </div>

      {/* Preview Section */}
      {previewItems && (
        <div className="bg-white rounded-xl p-6 border border-emerald-950/10 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pratinjau Hasil Pembacaan Berkas
              </h3>
              <p className="text-xs text-slate-500">
                Terbaca <strong>{previewItems.length} butir soal</strong> dari file
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-emerald-900 bg-[#EAF8F0] px-2.5 py-1 rounded border border-emerald-200">
                ✓ {validCount} Soal Valid
              </span>
              {invalidCount > 0 && (
                <span className="text-xs font-medium text-rose-800 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
                  ⚠ {invalidCount} Tidak Valid
                </span>
              )}
              <button
                onClick={handleExecuteImport}
                disabled={validCount === 0}
                className="py-1.5 px-4 bg-[#087443] hover:bg-[#065b34] text-white font-medium text-xs rounded-lg shadow-xs transition disabled:opacity-40 cursor-pointer"
              >
                Import {validCount} Soal Sekarang
              </button>
            </div>
          </div>

          {/* Table preview */}
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAF8] text-slate-700 font-semibold sticky top-0 border-b border-slate-200 uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-10">No</th>
                  <th className="py-2.5 px-3">Materi</th>
                  <th className="py-2.5 px-3">Jenis</th>
                  <th className="py-2.5 px-3">Pertanyaan</th>
                  <th className="py-2.5 px-3">Kunci</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewItems.map((item, idx) => (
                  <tr key={idx} className={item.isValid ? '' : 'bg-rose-50/50'}>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{item.subject}</td>
                    <td className="py-2.5 px-3 font-mono">{item.type}</td>
                    <td className="py-2.5 px-3 max-w-xs truncate text-slate-700">{item.question}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">
                      {item.correctAnswers.join(', ')}
                    </td>
                    <td className="py-2.5 px-3">
                      {item.isValid ? (
                        <span className="text-emerald-800 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Valid</span>
                        </span>
                      ) : (
                        <span className="text-rose-700 font-medium text-[11px] block">
                          {item.errorMessage}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
