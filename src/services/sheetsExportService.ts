import * as XLSX from 'xlsx';
import { storageService } from './storageService';
import { Question, ExamResult, Participant, ViolationLog, Exam } from '../types';

export const sheetsExportService = {
  /**
   * Menghasilkan file Excel (.xlsx) lengkap yang kompatibel 100% dengan Google Spreadsheet.
   * Tinggal di-upload atau dibuka langsung di Google Drive / Google Sheets.
   */
  exportToExcel(): boolean {
    try {
      const results = storageService.getResults();
      const questions = storageService.getQuestions();
      const participants = storageService.getParticipants();
      const exams = storageService.getExams();
      const violations = storageService.getViolations();

      const wb = XLSX.utils.book_new();

      // 1. SHEET: HASIL_UJIAN
      const hasilHeaders = [
        'ID Hasil',
        'Nama Lengkap Siswa',
        'Asal Sekolah',
        'Nomor / ID Peserta',
        'Sesi Ujian',
        'Skor Nilai Akhir (0-100)',
        'Jawaban Benar',
        'Jawaban Salah',
        'Kosong / Tidak Dijawab',
        'Total Butir Soal',
        'Persentase Ketuntasan (%)',
        'Durasi (Menit)',
        'Waktu Pengumpulan',
        'Status Kelulusan',
      ];
      const hasilRows = results.map((r) => [
        r.id,
        r.participantName,
        r.schoolName,
        r.participantNumber,
        r.examTitle || 'Olimpiade PAI SMP',
        r.score,
        r.correctCount,
        r.wrongCount,
        r.unansweredCount,
        r.totalQuestions,
        `${r.percentage}%`,
        Math.round(r.durationSeconds / 60),
        new Date(r.submittedAt).toLocaleString('id-ID'),
        r.score >= 75 ? 'LULUS (MEMENUHI KKM)' : 'TEREVALUASI',
      ]);
      const wsHasil = XLSX.utils.aoa_to_sheet([hasilHeaders, ...hasilRows]);
      XLSX.utils.book_append_sheet(wb, wsHasil, 'HASIL_UJIAN');

      // 2. SHEET: BANK_SOAL
      const soalHeaders = [
        'ID Soal',
        'Tipe Soal',
        'Materi / Topik',
        'Tingkat Kesulitan',
        'Butir Pertanyaan',
        'Opsi A',
        'Opsi B',
        'Opsi C',
        'Opsi D',
        'Kunci Jawaban',
        'Pembahasan Lengkap',
      ];
      const soalRows = questions.map((q) => {
        let optA = '', optB = '', optC = '', optD = '';
        (q.options || []).forEach((o) => {
          if (o.id === 'A') optA = o.text;
          if (o.id === 'B') optB = o.text;
          if (o.id === 'C') optC = o.text;
          if (o.id === 'D') optD = o.text;
        });
        return [
          q.id,
          q.type,
          q.topic || q.subject,
          q.difficulty,
          q.question,
          optA,
          optB,
          optC,
          optD,
          (q.correctAnswers || []).join(', '),
          q.explanation || '-',
        ];
      });
      const wsSoal = XLSX.utils.aoa_to_sheet([soalHeaders, ...soalRows]);
      XLSX.utils.book_append_sheet(wb, wsSoal, 'BANK_SOAL');

      // 3. SHEET: PESERTA
      const pesertaHeaders = [
        'ID Peserta',
        'Nama Lengkap Siswa',
        'Asal Sekolah',
        'Nomor / ID Peserta',
        'ID Sesi Ujian',
        'Status Ujian',
        'Soal Terjawab',
        'Pelanggaran (Strike)',
        'Waktu Mulai',
        'Terakhir Aktif',
      ];
      const pesertaRows = participants.map((p) => [
        p.id,
        p.name,
        p.schoolName,
        p.participantNumber,
        p.examId,
        p.status,
        Object.keys(p.answers || {}).length,
        p.violationCount || 0,
        p.startedAt ? new Date(p.startedAt).toLocaleString('id-ID') : '-',
        p.lastActiveAt ? new Date(p.lastActiveAt).toLocaleString('id-ID') : '-',
      ]);
      const wsPeserta = XLSX.utils.aoa_to_sheet([pesertaHeaders, ...pesertaRows]);
      XLSX.utils.book_append_sheet(wb, wsPeserta, 'PESERTA');

      // 4. SHEET: SESI_UJIAN
      const sesiHeaders = [
        'ID Sesi',
        'Judul Sesi Ujian',
        'Token Rilis',
        'Jumlah Soal',
        'Durasi (Menit)',
        'Waktu Mulai',
        'Waktu Selesai',
        'Status Sesi',
      ];
      const sesiRows = exams.map((e) => [
        e.id,
        e.title,
        e.token,
        e.questionCount,
        e.durationMinutes,
        new Date(e.startAt).toLocaleString('id-ID'),
        new Date(e.endAt).toLocaleString('id-ID'),
        e.status,
      ]);
      const wsSesi = XLSX.utils.aoa_to_sheet([sesiHeaders, ...sesiRows]);
      XLSX.utils.book_append_sheet(wb, wsSesi, 'SESI_UJIAN');

      // 5. SHEET: PELANGGARAN
      const logHeaders = [
        'ID Log',
        'Nama Siswa',
        'Asal Sekolah',
        'Jenis Pelanggaran',
        'Pelanggaran Ke (Strike)',
        'Detail Pelanggaran',
        'Waktu Kejadian',
      ];
      const logRows = violations.map((v) => [
        v.id,
        v.participantName || v.participantId,
        v.schoolName || '-',
        v.type,
        v.violationNumber,
        v.detail || '-',
        new Date(v.timestamp).toLocaleString('id-ID'),
      ]);
      const wsLog = XLSX.utils.aoa_to_sheet([logHeaders, ...logRows]);
      XLSX.utils.book_append_sheet(wb, wsLog, 'PELANGGARAN');

      // Unduh file Spreadsheet
      const today = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `DATABASE_CBT_PAI_MOJOKERTO_${today}.xlsx`);
      return true;
    } catch (err) {
      console.error('Gagal mengekspor data ke Excel:', err);
      return false;
    }
  },

  /**
   * Menghasilkan teks Tab-Separated Values (TSV) untuk langsung di-Paste (Ctrl+V) ke Google Sheets.
   */
  copyResultsToClipboard(): string {
    const results = storageService.getResults();
    const headers = [
      'ID Hasil\tNama Siswa\tAsal Sekolah\tNo Peserta\tSesi\tSkor\tBenar\tSalah\tKosong\tTotal Soal\t%\tDurasi\tWaktu Selesai\tStatus',
    ];
    const rows = results.map((r) =>
      [
        r.id,
        r.participantName,
        r.schoolName,
        r.participantNumber,
        r.examTitle,
        r.score,
        r.correctCount,
        r.wrongCount,
        r.unansweredCount,
        r.totalQuestions,
        `${r.percentage}%`,
        Math.round(r.durationSeconds / 60) + ' m',
        new Date(r.submittedAt).toLocaleString('id-ID'),
        r.score >= 75 ? 'LULUS' : 'TEREVALUASI',
      ].join('\t')
    );
    return [headers, ...rows].join('\n');
  },

  copyQuestionsToClipboard(): string {
    const questions = storageService.getQuestions();
    const headers = [
      'ID Soal\tTipe\tTopik\tKesulitan\tButir Pertanyaan\tOpsi A\tOpsi B\tOpsi C\tOpsi D\tKunci Jawaban\tPembahasan',
    ];
    const rows = questions.map((q) => {
      let optA = '', optB = '', optC = '', optD = '';
      (q.options || []).forEach((o) => {
        if (o.id === 'A') optA = o.text.replace(/\t/g, ' ').replace(/\n/g, ' ');
        if (o.id === 'B') optB = o.text.replace(/\t/g, ' ').replace(/\n/g, ' ');
        if (o.id === 'C') optC = o.text.replace(/\t/g, ' ').replace(/\n/g, ' ');
        if (o.id === 'D') optD = o.text.replace(/\t/g, ' ').replace(/\n/g, ' ');
      });
      return [
        q.id,
        q.type,
        q.topic || q.subject,
        q.difficulty,
        q.question.replace(/\t/g, ' ').replace(/\n/g, ' '),
        optA,
        optB,
        optC,
        optD,
        (q.correctAnswers || []).join(', '),
        (q.explanation || '-').replace(/\t/g, ' ').replace(/\n/g, ' '),
      ].join('\t');
    });
    return [headers, ...rows].join('\n');
  },

  copyExamsToClipboard(): string {
    const exams = storageService.getExams();
    const headers = [
      'ID Sesi\tJudul Sesi Ujian\tToken Rilis\tJumlah Soal\tDurasi (Menit)\tWaktu Mulai\tWaktu Selesai\tStatus Sesi\tAnti Cheat\tAcak Soal\tTerakhir Diperbarui',
    ];
    const rows = exams.map((e) =>
      [
        e.id,
        e.title.replace(/\t/g, ' '),
        e.token,
        e.questionCount,
        e.durationMinutes,
        new Date(e.startAt).toLocaleString('id-ID'),
        new Date(e.endAt).toLocaleString('id-ID'),
        e.status,
        e.antiCheat ? 'TRUE' : 'FALSE',
        e.randomQuestion ? 'TRUE' : 'FALSE',
        new Date().toLocaleString('id-ID'),
      ].join('\t')
    );
    return [headers, ...rows].join('\n');
  },

  copyViolationsToClipboard(): string {
    const violations = storageService.getViolations();
    const headers = [
      'ID Log\tNama Siswa\tAsal Sekolah\tID Sesi Ujian\tJenis Pelanggaran\tPelanggaran Ke (Strike)\tDetail Pelanggaran\tWaktu Kejadian\tWaktu Catat Server',
    ];
    const rows = violations.map((v) =>
      [
        v.id,
        (v.participantName || v.participantId).replace(/\t/g, ' '),
        (v.schoolName || '-').replace(/\t/g, ' '),
        (v.examId || 'Olimpiade PAI').replace(/\t/g, ' '),
        v.type,
        v.violationNumber,
        (v.detail || '-').replace(/\t/g, ' ').replace(/\n/g, ' '),
        new Date(v.timestamp).toLocaleString('id-ID'),
        new Date().toLocaleString('id-ID'),
      ].join('\t')
    );
    return [headers, ...rows].join('\n');
  },
};
