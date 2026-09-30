import { jsPDF } from 'jspdf';
import { ExamResult, Participant } from '../types';
import { storageService } from '../services/storageService';

export function downloadStudentResultPdf(
  participant: Participant,
  result: ExamResult,
  examTitle?: string
): boolean {
  try {
    const org = storageService.getOrgSettings();

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
    const margin = 15;
    const contentWidth = pageWidth - margin * 2; // 180mm

    // --- DECORATIVE BORDER ---
    doc.setDrawColor(8, 116, 67); // Emerald #087443
    doc.setLineWidth(0.8);
    doc.rect(margin - 4, margin - 4, contentWidth + 8, pageHeight - margin * 2 + 8);
    doc.setDrawColor(218, 165, 32); // Gold
    doc.setLineWidth(0.3);
    doc.rect(margin - 2.5, margin - 2.5, contentWidth + 5, pageHeight - margin * 2 + 5);

    let y = margin + 4;

    // --- KOP SURAT RESMI ---
    // Left Emblem Badge: Kemenag Mojokerto
    doc.setFillColor(8, 116, 67);
    doc.circle(margin + 10, y + 10, 8.5, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(margin + 10, y + 10, 7.2, 'F');
    doc.setFillColor(218, 165, 32); // Gold
    doc.circle(margin + 10, y + 10, 5.8, 'F');
    doc.setFillColor(8, 116, 67);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(255, 255, 255);
    doc.text('KEMENAG', margin + 10, y + 9.5, { align: 'center' });
    doc.setFontSize(4);
    doc.text('IKHLAS', margin + 10, y + 11.5, { align: 'center' });

    // Right Emblem Badge: MGMP PAI Mojokerto
    doc.setFillColor(8, 116, 67);
    doc.circle(margin + contentWidth - 10, y + 10, 8.5, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(margin + contentWidth - 10, y + 10, 7.2, 'F');
    doc.setFillColor(8, 116, 67);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(8, 116, 67);
    doc.text('MGMP', margin + contentWidth - 10, y + 9.5, { align: 'center' });
    doc.setFontSize(5);
    doc.text('PAI SMP', margin + contentWidth - 10, y + 12, { align: 'center' });

    // Kop Text Centered
    const centerX = pageWidth / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text(org.ministryName || 'KEMENTERIAN AGAMA REPUBLIK INDONESIA', centerX, y + 3, {
      align: 'center',
    });

    doc.setFontSize(11);
    doc.setTextColor(8, 116, 67);
    doc.text(org.officeName || 'KANTOR KEMENTERIAN AGAMA KABUPATEN MOJOKERTO', centerX, y + 8.5, {
      align: 'center',
    });

    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(
      org.organizationName || 'MUSYAWARAH GURU MATA PELAJARAN (MGMP) PAI SMP',
      centerX,
      y + 14,
      { align: 'center' }
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      org.secretariatAddress ||
        'Sekretariat: Jl. Kedungmungal No. 1, Kab. Mojokerto, Jawa Timur 61382 • Email: mgmppai.mojokerto@gmail.com',
      centerX,
      y + 19,
      { align: 'center' }
    );

    y += 23;

    // Double Divider Lines
    doc.setDrawColor(8, 116, 67);
    doc.setLineWidth(0.8);
    doc.line(margin, y, margin + contentWidth, y);
    doc.setDrawColor(218, 165, 32);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 1.2, margin + contentWidth, y + 1.2);

    y += 8;

    // --- JUDUL DOKUMEN ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(8, 116, 67);
    doc.text('SURAT KETERANGAN BUKTI HASIL UJIAN CBT', pageWidth / 2, y, { align: 'center' });

    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('OLIMPIADE PAI TINGKAT SMP KABUPATEN MOJOKERTO TAHUN 2026', pageWidth / 2, y, {
      align: 'center',
    });

    y += 4.5;
    const docNumber = `No: ${result.id.toUpperCase()} / CBT-PAI / MJK / 2026`;
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(docNumber, pageWidth / 2, y, { align: 'center' });

    y += 8;

    // --- BOX 1: BIODATA PESERTA ---
    doc.setFillColor(248, 250, 248);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 44, 2, 2, 'FD');

    // Section Header Strip
    doc.setFillColor(8, 116, 67);
    doc.rect(margin, y, 3, 44, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(8, 116, 67);
    doc.text('A. IDENTITAS PESERTA UJIAN', margin + 6, y + 6);

    const bioData = [
      { label: 'Nama Lengkap Siswa', value: participant.name },
      { label: 'Asal Sekolah', value: participant.schoolName },
      { label: 'Nomor / ID Peserta', value: participant.participantNumber },
      { label: 'Mata Pelajaran', value: 'Pendidikan Agama Islam & Budi Pekerti (SMP)' },
      { label: 'Sesi Ujian', value: examTitle || result.examTitle || 'Olimpiade PAI SMP' },
      {
        label: 'Waktu Pengumpulan',
        value: `${new Date(result.submittedAt).toLocaleString('id-ID')} WIB`,
      },
    ];

    let bioY = y + 12;
    bioData.forEach((item) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(item.label, margin + 6, bioY);
      doc.text(':', margin + 48, bioY);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(String(item.value), margin + 51, bioY);
      bioY += 5.2;
    });

    y += 49;

    // --- BOX 2: SKOR BESAR (HIGHLIGHT) ---
    doc.setFillColor(8, 116, 67);
    doc.roundedRect(margin, y, contentWidth, 28, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(234, 248, 240);
    doc.text('SKOR NILAI AKHIR CBT', pageWidth / 2, y + 7, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(253, 224, 71); // Gold yellow #FDE047
    doc.text(String(result.score), pageWidth / 2, y + 19, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    const passStatus =
      result.score >= 75
        ? 'STATUS: LULUS / MEMENUHI KKM (SKALA 0 - 100)'
        : 'STATUS: TEREVALUASI / DIBAWAH KKM (SKALA 0 - 100)';
    doc.text(passStatus, pageWidth / 2, y + 24.5, { align: 'center' });

    y += 33;

    // --- BOX 3: TABEL RINCIAN JAWABAN & STATISTIK ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(8, 116, 67);
    doc.text('B. RINCIAN CAPAIAN JAWABAN PESERTA', margin, y);

    y += 3;

    // Table Header
    const colWidths = [18, 70, 46, 46];
    const headers = ['NO', 'KOMPONEN PENILAIAN', 'HASIL CAPAIAN', 'PERSENTASE / KET.'];

    doc.setFillColor(234, 248, 240);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, contentWidth, 7, 'D');

    let curX = margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(8, 116, 67);
    headers.forEach((h, i) => {
      const align = i === 0 ? 'center' : i === 1 ? 'left' : 'center';
      const textX = align === 'center' ? curX + colWidths[i] / 2 : curX + 3;
      doc.text(h, textX, y + 4.8, { align: align as any });
      curX += colWidths[i];
    });

    y += 7;

    // Table Rows
    const rows = [
      {
        no: '1',
        label: 'Jawaban Benar',
        val: `${result.correctCount} Butir Soal`,
        ket: `${Math.round((result.correctCount / Math.max(1, result.totalQuestions)) * 100)}% dari total`,
        isGood: true,
      },
      {
        no: '2',
        label: 'Jawaban Salah',
        val: `${result.wrongCount} Butir Soal`,
        ket: `${Math.round((result.wrongCount / Math.max(1, result.totalQuestions)) * 100)}% dari total`,
        isGood: false,
      },
      {
        no: '3',
        label: 'Tidak Dijawab / Dikosongkan',
        val: `${result.unansweredCount} Butir Soal`,
        ket: `${Math.round((result.unansweredCount / Math.max(1, result.totalQuestions)) * 100)}% dari total`,
        isGood: false,
      },
      {
        no: '4',
        label: 'Total Butir Soal Ujian',
        val: `${result.totalQuestions} Butir Soal`,
        ket: '100% Beban Ujian',
        isGood: false,
      },
      {
        no: '5',
        label: 'Durasi Waktu Pengerjaan',
        val: `${Math.floor(result.durationSeconds / 60)} Menit ${result.durationSeconds % 60} Detik`,
        ket: 'Terekam Otomatis',
        isGood: false,
      },
      {
        no: '6',
        label: 'Integritas Sistem (Anti-Cheat)',
        val: result.status === 'violated' ? 'Diskualifikasi (3 Strike)' : 'Valid / Tanpa Pelanggaran',
        ket: 'Terverifikasi CBT',
        isGood: result.status !== 'violated',
      },
    ];

    rows.forEach((row, idx) => {
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(margin, y, contentWidth, 6.2, 'F');
      doc.rect(margin, y, contentWidth, 6.2, 'D');

      let rowX = margin;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);

      // Col 1: No
      doc.text(row.no, rowX + colWidths[0] / 2, y + 4.3, { align: 'center' });
      rowX += colWidths[0];

      // Col 2: Komponen
      doc.setFont('helvetica', 'normal');
      doc.text(row.label, rowX + 3, y + 4.3);
      rowX += colWidths[1];

      // Col 3: Capaian
      doc.setFont('helvetica', 'bold');
      if (row.isGood) {
        doc.setTextColor(8, 116, 67);
      } else if (idx === 1 && result.wrongCount > 0) {
        doc.setTextColor(185, 28, 28);
      } else {
        doc.setTextColor(30, 41, 59);
      }
      doc.text(row.val, rowX + colWidths[2] / 2, y + 4.3, { align: 'center' });
      rowX += colWidths[2];

      // Col 4: Ket
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(row.ket, rowX + colWidths[3] / 2, y + 4.3, { align: 'center' });

      y += 6.2;
    });

    y += 10;

    // --- CATATAN & LEGALITAS RESMI PANITIA ---
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(8, 116, 67);
    doc.text('CATATAN PANITIA CBT & KEABSAHAN DOKUMEN:', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      '1. Surat keterangan ini diterbitkan secara otomatis oleh sistem CBT Olimpiade PAI SMP Kab. Mojokerto Tahun 2026.',
      margin + 4,
      y + 9.5
    );
    doc.text(
      '2. Rekapitulasi perolehan nilai dan catatan integritas peserta tersimpan permanen pada server basis data MGMP PAI & Kemenag Kab. Mojokerto.',
      margin + 4,
      y + 14
    );

    // --- FOOTER SECURITY BAR ---
    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    const securityString = `AUTHENTICATION KEY: ${btoa(
      `${participant.id}|${result.score}|${result.submittedAt}`
    ).substring(0, 36)} • GENERATED: ${new Date().toISOString()}`;
    doc.text(securityString, pageWidth / 2, pageHeight - margin + 2, { align: 'center' });

    // Save and Trigger Download
    const cleanStudentName = participant.name.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanSchoolName = participant.schoolName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Bukti_Nilai_PAI_${cleanStudentName}_${cleanSchoolName}.pdf`;

    doc.save(fileName);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}
