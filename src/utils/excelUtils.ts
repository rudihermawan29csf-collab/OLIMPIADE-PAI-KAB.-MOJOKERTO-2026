import * as XLSX from 'xlsx';
import { Question, QuestionType, Difficulty, MateriPAI, ExamResult } from '../types';

export interface ImportPreviewItem {
  no: number;
  subject: MateriPAI;
  topic: string;
  type: QuestionType;
  difficulty: Difficulty;
  stimulus?: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswers: string[];
  explanation?: string;
  isValid: boolean;
  errorMessage?: string;
}

export const excelUtils = {
  // Generate and download Question Template XLSX
  downloadQuestionTemplate(): void {
    const templateData = [
      {
        No: 1,
        Materi: "Al-Qur'an Hadis",
        Submateri: 'Toleransi dan Keberagaman',
        Tingkat: 'Sedang',
        Jenis: 'PG',
        Stimulus: 'Perhatikan Q.S. Al-Hujurat [49]: 13 tentang keberagaman suku dan bangsa.',
        Pertanyaan: 'Ukuran kemuliaan seorang hamba di hadapan Allah Swt. didasarkan pada....',
        'Opsi A': 'Kekayaan dan garis keturunan bangsawan',
        'Opsi B': 'Ketakwaan dan amal saleh yang ikhlas',
        'Opsi C': 'Kekuatan fisik serta jumlah pengikut',
        'Opsi D': 'Popularitas di tengah masyarakat',
        Kunci: 'B',
        Pembahasan: 'Q.S. Al-Hujurat: 13 menegaskan inna akramakum \'indallahi atqaakum (orang paling mulia adalah yang paling bertakwa).',
      },
      {
        No: 2,
        Materi: 'Aqidah',
        Submateri: 'Iman Kepada Hari Akhir',
        Tingkat: 'Sedang',
        Jenis: 'PGK',
        Stimulus: 'Di hari akhir seluruh amal perbuatan manusia akan dipertanggungjawabkan.',
        Pertanyaan: 'Manakah tahapan yaumul akhir yang berkaitan dengan perhitungan amal? (Pilih semua yang benar)',
        'Opsi A': 'Yaumul Ba\'ats (Hari Kebangkitan)',
        'Opsi B': 'Yaumul Hisab (Hari Perhitungan)',
        'Opsi C': 'Yaumul Mizan (Hari Penimbangan)',
        'Opsi D': 'Yaumul Milad (Hari Kelahiran)',
        Kunci: 'A,B,C',
        Pembahasan: 'Yaumul Ba\'ats, Hisab, dan Mizan adalah peristiwa eskatologis hari akhir.',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Soal_PAI');

    // Auto adjust column widths
    const max_width = [5, 18, 25, 10, 8, 30, 35, 25, 25, 25, 25, 10, 35];
    worksheet['!cols'] = max_width.map((w) => ({ wch: w }));

    XLSX.writeFile(workbook, 'Template_Import_Soal_MGMP_PAI_Mojokerto.xlsx');
  },

  // Parse uploaded file (xlsx or csv)
  async parseQuestionFile(file: File): Promise<ImportPreviewItem[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          const previewItems: ImportPreviewItem[] = rawRows.map((row, index) => {
            const no = index + 1;
            const materiRaw = String(row.Materi || row.materi || '').trim();
            const topic = String(row.Submateri || row.submateri || row.Topik || 'Umum').trim();
            const jenisRaw = String(row.Jenis || row.jenis || 'PG').trim().toUpperCase();
            const tingkatRaw = String(row.Tingkat || row.tingkat || 'Sedang').trim();
            const stimulus = String(row.Stimulus || row.stimulus || '').trim();
            const question = String(row.Pertanyaan || row.pertanyaan || row.Soal || '').trim();
            const optA = String(row['Opsi A'] || row.opsi_a || row.A || '').trim();
            const optB = String(row['Opsi B'] || row.opsi_b || row.B || '').trim();
            const optC = String(row['Opsi C'] || row.opsi_c || row.C || '').trim();
            const optD = String(row['Opsi D'] || row.opsi_d || row.D || '').trim();
            const kunciRaw = String(row.Kunci || row.kunci || '').trim().toUpperCase();
            const pembahasan = String(row.Pembahasan || row.pembahasan || '').trim();

            const errors: string[] = [];

            // Validate question
            if (!question) errors.push('Pertanyaan tidak boleh kosong');
            if (!optA || !optB || !optC || !optD) errors.push('Semua opsi A, B, C, D wajib diisi');

            // Format correct answers
            const keys = kunciRaw
              .split(/[,;\s]+/)
              .map((k) => k.trim())
              .filter((k) => ['A', 'B', 'C', 'D'].includes(k));

            if (keys.length === 0) {
              errors.push('Kunci jawaban wajib berisi A, B, C, atau D');
            }

            const type: QuestionType = jenisRaw === 'PGK' ? 'PGK' : 'PG';
            if (type === 'PG' && keys.length > 1) {
              errors.push('Soal PG hanya boleh memiliki 1 kunci jawaban');
            }

            // Normalise Subject
            let subject: MateriPAI = 'Aqidah';
            const m = materiRaw.toLowerCase();
            if (m.includes('qur') || m.includes('hadis') || m.includes('hadits')) {
              subject = "Al-Qur'an Hadis";
            } else if (m.includes('fiq') || m.includes('fikih')) {
              subject = 'Fiqih';
            } else if (m.includes('akhlak') || m.includes('adab')) {
              subject = 'Akhlak';
            } else if (m.includes('sejarah') || m.includes('ski') || m.includes('peradaban')) {
              subject = 'Sejarah Kebudayaan Islam';
            }

            // Normalise Difficulty
            let difficulty: Difficulty = 'Sedang';
            if (tingkatRaw.toLowerCase().includes('mudah')) difficulty = 'Mudah';
            if (tingkatRaw.toLowerCase().includes('sukar') || tingkatRaw.toLowerCase().includes('sulit')) {
              difficulty = 'Sukar';
            }

            return {
              no,
              subject,
              topic,
              type,
              difficulty,
              stimulus,
              question,
              optionA: optA,
              optionB: optB,
              optionC: optC,
              optionD: optD,
              correctAnswers: keys,
              explanation: pembahasan,
              isValid: errors.length === 0,
              errorMessage: errors.join('; '),
            };
          });

          resolve(previewItems);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  },

  // Export questions to Excel
  exportQuestionsToExcel(questions: Question[]): void {
    const data = questions.map((q, i) => ({
      No: i + 1,
      Materi: q.subject,
      Submateri: q.topic,
      Tingkat: q.difficulty,
      Jenis: q.type,
      Stimulus: q.stimulus || '',
      Pertanyaan: q.question,
      'Opsi A': q.options?.find((o) => o.id === 'A')?.text || '',
      'Opsi B': q.options?.find((o) => o.id === 'B')?.text || '',
      'Opsi C': q.options?.find((o) => o.id === 'C')?.text || '',
      'Opsi D': q.options?.find((o) => o.id === 'D')?.text || '',
      Kunci: q.correctAnswers.join(','),
      Pembahasan: q.explanation || '',
      Status: q.isActive ? 'Aktif' : 'Non-Aktif',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bank_Soal_PAI');
    XLSX.writeFile(workbook, `Bank_Soal_PAI_Mojokerto_${new Date().toISOString().slice(0, 10)}.xlsx`);
  },

  // Export Results / Leaderboard to Excel
  exportResultsToExcel(results: ExamResult[], examTitle: string): void {
    const sorted = [...results].sort((a, b) => b.score - a.score || a.durationSeconds - b.durationSeconds);
    const data = sorted.map((r, index) => {
      const minutes = Math.floor(r.durationSeconds / 60);
      const seconds = r.durationSeconds % 60;
      return {
        Peringkat: index + 1,
        'Nama Peserta': r.participantName,
        'Asal Sekolah': r.schoolName,
        'Nomor Peserta': r.participantNumber,
        'Total Soal': r.totalQuestions,
        Benar: r.correctCount,
        Salah: r.wrongCount,
        'Tidak Dijawab': r.unansweredCount,
        'Nilai Akhir': r.score,
        'Durasi Pengerjaan': `${minutes}m ${seconds}s`,
        Status: r.status === 'completed' ? 'Selesai' : 'Diskualifikasi / Pelanggaran',
        'Waktu Selesai': new Date(r.submittedAt).toLocaleString('id-ID'),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hasil_Olimpiade');
    XLSX.writeFile(
      workbook,
      `Hasil_${examTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  },
};
