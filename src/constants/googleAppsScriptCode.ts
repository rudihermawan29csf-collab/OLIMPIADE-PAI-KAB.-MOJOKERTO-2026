export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * BACKEND & CLOUD DATABASE GOOGLE APPS SCRIPT
 * CBT OLIMPIADE PAI SMP KABUPATEN MOJOKERTO
 * ==============================================================================
 * Kemenag Kabupaten Mojokerto & MGMP PAI SMP Kabupaten Mojokerto
 *
 * FITUR DATABASE ONLINE MULTI-PERANGKAT LENGKAP:
 * 1. setupSheets()     : Membuat 6 Sheet dan Header Kolom Otomatis:
 *                        - DAFTAR_SEKOLAH : Data master sekolah & pilihan peserta
 *                        - SESI_UJIAN     : Jadwal sesi ujian, token rilis, durasi
 *                        - BANK_SOAL      : Butir soal PG, PGK, BS, kunci, pembahasan
 *                        - PESERTA        : Status live peserta pengerjaan ujian
 *                        - HASIL_UJIAN    : Rekap nilai akhir, benar, salah, KKM
 *                        - PELANGGARAN    : Catatan forensik audit anti-curang
 * 2. doPost(e)         : Menyimpan Sekolah, Sesi, Soal, Peserta, Nilai, Pelanggaran
 * 3. doGet(e)          : Mengambil data online secara instan ke HP Siswa & Laptop Admin (Bebas CORS via JSONP)
 * ==============================================================================
 */

var SHEET_SEKOLAH = 'DAFTAR_SEKOLAH';
var SHEET_SESI = 'SESI_UJIAN';
var SHEET_BANK_SOAL = 'BANK_SOAL';
var SHEET_PESERTA = 'PESERTA';
var SHEET_HASIL = 'HASIL_UJIAN';
var SHEET_PELANGGARAN = 'PELANGGARAN';

/**
 * JALANKAN FUNGSI INI 1x SETELAH MEMASANG / MEMPERBARUI KODE DI APPS SCRIPT
 * Untuk membuat seluruh 6 Sheet dan Header Kolom secara otomatis!
 */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Sheet DAFTAR_SEKOLAH
  var sSekolah = getOrCreateSheet(ss, SHEET_SEKOLAH);
  sSekolah.getRange(1, 1, 1, 5).setValues([[
    'ID Sekolah',
    'Nama Sekolah (SMP/MTs)',
    'NPSN',
    'Alamat / Kecamatan',
    'Terakhir Diperbarui'
  ]]).setFontWeight('bold').setBackground('#E0F2FE').setFontColor('#0369A1');
  sSekolah.setFrozenRows(1);

  // 2. Sheet SESI_UJIAN
  var sSesi = getOrCreateSheet(ss, SHEET_SESI);
  sSesi.getRange(1, 1, 1, 11).setValues([[
    'ID Sesi',
    'Judul Sesi Ujian',
    'Token Rilis',
    'Jumlah Soal',
    'Durasi (Menit)',
    'Waktu Mulai',
    'Waktu Selesai',
    'Status Sesi',
    'Anti Cheat',
    'Acak Soal',
    'Terakhir Diperbarui'
  ]]).setFontWeight('bold').setBackground('#FEF3C7').setFontColor('#92400E');
  sSesi.setFrozenRows(1);

  // 3. Sheet BANK_SOAL
  var sSoal = getOrCreateSheet(ss, SHEET_BANK_SOAL);
  sSoal.getRange(1, 1, 1, 11).setValues([[
    'ID Soal',
    'Tipe Soal',
    'Topik / Kompetensi',
    'Tingkat Kesulitan',
    'Butir Pertanyaan',
    'Opsi A',
    'Opsi B',
    'Opsi C',
    'Opsi D',
    'Kunci Jawaban',
    'Pembahasan'
  ]]).setFontWeight('bold').setBackground('#EAF8F0').setFontColor('#087443');
  sSoal.setFrozenRows(1);

  // 4. Sheet PESERTA
  var sPeserta = getOrCreateSheet(ss, SHEET_PESERTA);
  sPeserta.getRange(1, 1, 1, 12).setValues([[
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
    'Attempt ID',
    'Waktu Catat Server'
  ]]).setFontWeight('bold').setBackground('#EAF8F0').setFontColor('#087443');
  sPeserta.setFrozenRows(1);

  // 5. Sheet HASIL_UJIAN
  var sHasil = getOrCreateSheet(ss, SHEET_HASIL);
  sHasil.getRange(1, 1, 1, 15).setValues([[
    'ID Hasil',
    'Nama Lengkap Siswa',
    'Asal Sekolah',
    'Nomor Peserta',
    'Sesi Ujian',
    'Skor Nilai Akhir (0-100)',
    'Jawaban Benar',
    'Jawaban Salah',
    'Kosong / Tidak Dijawab',
    'Total Soal',
    'Persentase Ketuntasan',
    'Durasi (Menit)',
    'Waktu Penyerahan',
    'Status Kelulusan',
    'Waktu Catat Server'
  ]]).setFontWeight('bold').setBackground('#EAF8F0').setFontColor('#087443');
  sHasil.setFrozenRows(1);

  // 6. Sheet PELANGGARAN
  var sPelanggaran = getOrCreateSheet(ss, SHEET_PELANGGARAN);
  sPelanggaran.getRange(1, 1, 1, 9).setValues([[
    'ID Log',
    'Nama Siswa',
    'Asal Sekolah',
    'ID Sesi Ujian',
    'Jenis Pelanggaran',
    'Pelanggaran Ke (Strike)',
    'Detail Pelanggaran',
    'Waktu Kejadian',
    'Waktu Catat Server'
  ]]).setFontWeight('bold').setBackground('#FEE2E2').setFontColor('#991B1B');
  sPelanggaran.setFrozenRows(1);

  Logger.log('Seluruh 6 sheet dan struktur kolom berhasil dibuat!');
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    // Toleran terhadap penamaan sheet oleh pengguna di Google Spreadsheet
    if (sheetName === SHEET_SESI) {
      sheet = ss.getSheetByName('SESI') || ss.getSheetByName('Sesi') || ss.getSheetByName('sesi') || ss.getSheetByName('SESI_UJIAN');
    } else if (sheetName === SHEET_BANK_SOAL) {
      sheet = ss.getSheetByName('SOAL') || ss.getSheetByName('Soal') || ss.getSheetByName('BANK_SOAL') || ss.getSheetByName('bank_soal');
    } else if (sheetName === SHEET_SEKOLAH) {
      sheet = ss.getSheetByName('SEKOLAH') || ss.getSheetByName('Sekolah') || ss.getSheetByName('DAFTAR_SEKOLAH');
    } else if (sheetName === SHEET_HASIL) {
      sheet = ss.getSheetByName('HASIL') || ss.getSheetByName('Hasil') || ss.getSheetByName('HASIL_UJIAN');
    } else if (sheetName === SHEET_PELANGGARAN) {
      sheet = ss.getSheetByName('PELANGGARAN') || ss.getSheetByName('Pelanggaran') || ss.getSheetByName('LOG_PELANGGARAN');
    } else if (sheetName === SHEET_PESERTA) {
      sheet = ss.getSheetByName('PESERTA') || ss.getSheetByName('Peserta');
    }
  }
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * ==============================================================================
 * MENANGANI REQUEST GET (PENGAMBILAN DATA ONLINE KE HP SISWA & LAPTOP ADMIN)
 * Mendukung JSONP agar 100% bebas blokir CORS di seluruh browser & smartphone!
 * ==============================================================================
 */
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'STATUS';
  var callback = (e && e.parameter && e.parameter.callback) ? e.parameter.callback : null;

  var response = {
    status: 'online',
    appName: 'CBT Olimpiade PAI SMP Kab. Mojokerto',
    author: 'MGMP PAI & Kemenag Kab. Mojokerto',
    serverTime: new Date().toISOString()
  };

  if (action === 'GET_SCHOOLS') {
    response.schools = getSchoolsFromSheet(ss);
  } else if (action === 'GET_EXAMS') {
    response.exams = getExamsFromSheet(ss);
  } else if (action === 'GET_QUESTIONS') {
    response.questions = getQuestionsFromSheet(ss);
  } else if (action === 'GET_RESULTS') {
    response.results = getResultsFromSheet(ss);
  } else if (action === 'GET_VIOLATIONS') {
    response.violations = getViolationsFromSheet(ss);
  } else if (action === 'GET_ALL') {
    response.schools = getSchoolsFromSheet(ss);
    response.exams = getExamsFromSheet(ss);
    response.questions = getQuestionsFromSheet(ss);
    response.results = getResultsFromSheet(ss);
    response.violations = getViolationsFromSheet(ss);
  }

  var output = JSON.stringify(response);

  if (callback) {
    return ContentService.createTextOutput(callback + '(' + output + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}

// 1. Ambil Data Sekolah
function getSchoolsFromSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_SEKOLAH);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  var list = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0] && !row[1]) continue;
    list.push({
      id: String(row[0] || ('sch-' + i)),
      name: String(row[1] || ''),
      npsn: row[2] ? String(row[2]) : undefined,
      address: row[3] ? String(row[3]) : undefined,
      createdAt: row[4] ? String(row[4]) : new Date().toISOString()
    });
  }
  return list;
}

// 2. Ambil Sesi Ujian
function getExamsFromSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_SESI);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  var list = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0] && !row[1] && !row[2]) continue;

    var statusVal = String(row[7] || 'active').toLowerCase().trim();
    var status = 'active';
    if (statusVal === 'scheduled' || statusVal === 'completed' || statusVal === 'draft') {
      status = statusVal;
    }

    var tokenVal = String(row[2] || '').trim().toUpperCase();

    list.push({
      id: String(row[0] || ('exam-' + i)),
      title: String(row[1] || 'OLIMPIADE PAI SMP KABUPATEN MOJOKERTO'),
      description: 'Babak Penyisihan Computer Based Test (CBT) Olimpiade PAI SMP Kab. Mojokerto',
      subject: 'Pendidikan Agama Islam',
      token: tokenVal || 'PAI2026',
      questionCount: Number(row[3] || 10),
      durationMinutes: Number(row[4] || 90),
      startAt: row[5] ? new Date(row[5]).toISOString() : new Date().toISOString(),
      endAt: row[6] ? new Date(row[6]).toISOString() : new Date(Date.now() + 86400000 * 7).toISOString(),
      status: status,
      antiCheat: row[8] === true || String(row[8]).toUpperCase() === 'TRUE',
      randomQuestion: row[9] === true || String(row[9]).toUpperCase() === 'TRUE',
      randomOption: true,
      fullscreenRequired: true,
      hideScoreFromParticipant: false,
      createdAt: row[10] ? String(row[10]) : new Date().toISOString()
    });
  }
  return list;
}

// 3. Ambil Bank Soal
function getQuestionsFromSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_BANK_SOAL);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  var list = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0] && !row[4]) continue;

    var qType = String(row[1] || 'PG').toUpperCase().trim();
    var optA = row[5] ? String(row[5]) : '';
    var optB = row[6] ? String(row[6]) : '';
    var optC = row[7] ? String(row[7]) : '';
    var optD = row[8] ? String(row[8]) : '';
    var options = [];
    if (optA) options.push({ id: 'A', text: optA });
    if (optB) options.push({ id: 'B', text: optB });
    if (optC) options.push({ id: 'C', text: optC });
    if (optD) options.push({ id: 'D', text: optD });

    var rawAnswers = row[9] ? String(row[9]).split(',') : ['A'];
    var correctAnswers = rawAnswers.map(function(s) { return s.trim(); });

    var statements = undefined;
    if (qType === 'BS') {
      statements = [];
      if (optA) {
        var isA = correctAnswers.some(function(a) { return a.indexOf('S1:BENAR') >= 0 || a === 'A:BENAR' || a === 'BENAR'; }) ? 'BENAR' : 'SALAH';
        statements.push({ id: 'S1', text: optA, correct: isA });
      }
      if (optB) {
        var isB = correctAnswers.some(function(a) { return a.indexOf('S2:BENAR') >= 0 || a === 'B:BENAR'; }) ? 'BENAR' : 'SALAH';
        statements.push({ id: 'S2', text: optB, correct: isB });
      }
      if (optC) {
        var isC = correctAnswers.some(function(a) { return a.indexOf('S3:BENAR') >= 0 || a === 'C:BENAR'; }) ? 'BENAR' : 'SALAH';
        statements.push({ id: 'S3', text: optC, correct: isC });
      }
      if (optD) {
        var isD = correctAnswers.some(function(a) { return a.indexOf('S4:BENAR') >= 0 || a === 'D:BENAR'; }) ? 'BENAR' : 'SALAH';
        statements.push({ id: 'S4', text: optD, correct: isD });
      }
    }

    list.push({
      id: String(row[0] || ('Q-' + i)),
      type: qType,
      subject: 'Pendidikan Agama Islam',
      topic: row[2] || 'Materi PAI',
      difficulty: row[3] || 'Sedang',
      question: String(row[4] || ''),
      options: options,
      statements: statements,
      correctAnswers: correctAnswers,
      explanation: String(row[10] || ''),
      isActive: true,
      createdAt: new Date().toISOString()
    });
  }
  return list;
}

// 4. Ambil Hasil Ujian
function getResultsFromSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_HASIL);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  var list = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue;

    list.push({
      id: String(row[0]),
      participantName: String(row[1] || ''),
      schoolName: String(row[2] || ''),
      participantNumber: String(row[3] || ''),
      examTitle: String(row[4] || 'Olimpiade PAI SMP'),
      score: Number(row[5] || 0),
      correctCount: Number(row[6] || 0),
      wrongCount: Number(row[7] || 0),
      unansweredCount: Number(row[8] || 0),
      totalQuestions: Number(row[9] || 0),
      percentage: Number(String(row[10] || '0').replace('%', '')),
      durationSeconds: Number(row[11] || 0) * 60,
      submittedAt: row[12] ? new Date(row[12]).toISOString() : new Date().toISOString(),
      status: Number(row[5] || 0) >= 75 ? 'passed' : 'evaluated'
    });
  }
  return list;
}

// 5. Ambil Log Pelanggaran
function getViolationsFromSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_PELANGGARAN);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  var hasExamIdCol = (values[0] && values[0].length >= 9 && String(values[0][3] || '').toLowerCase().indexOf('sesi') >= 0);

  var list = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0] && !row[1]) continue;

    var pName = String(row[1] || '');
    var sName = String(row[2] || '');
    var examId = hasExamIdCol ? String(row[3] || 'Olimpiade PAI') : 'Olimpiade PAI';
    var type = hasExamIdCol ? String(row[4] || 'TAB_SWITCH') : String(row[3] || 'TAB_SWITCH');
    var strike = hasExamIdCol ? Number(row[5] || 1) : Number(row[4] || 1);
    var detail = hasExamIdCol ? String(row[6] || '') : String(row[5] || '');
    var timestamp = hasExamIdCol
      ? (row[7] ? new Date(row[7]).toISOString() : new Date().toISOString())
      : (row[6] ? new Date(row[6]).toISOString() : new Date().toISOString());

    list.push({
      id: String(row[0] || ('viol-' + i)),
      participantId: String(row[0] || ('viol-' + i)),
      participantName: pName,
      schoolName: sName,
      examId: examId,
      type: type,
      violationNumber: strike,
      detail: detail,
      timestamp: timestamp
    });
  }
  return list;
}

/**
 * ==============================================================================
 * MENANGANI REQUEST POST (PENYIMPANAN DATA DARI APLIKASI CBT)
 * ==============================================================================
 */
function doPost(e) {
  try {
    var json = null;
    if (e.parameter && e.parameter.payload) {
      json = typeof e.parameter.payload === 'string' ? JSON.parse(e.parameter.payload) : e.parameter.payload;
    } else if (e.postData && e.postData.contents) {
      var contents = e.postData.contents;
      if (contents.indexOf('payload=') === 0) {
        var raw = decodeURIComponent(contents.substring(8).replace(/\+/g, ' '));
        json = JSON.parse(raw);
      } else {
        json = JSON.parse(contents);
      }
    } else if (e.parameter && e.parameter.action) {
      json = {
        action: e.parameter.action,
        data: e.parameter.data ? JSON.parse(e.parameter.data) : e.parameter
      };
    } else {
      return responseJson({ status: 'error', error: 'Payload tidak ditemukan' });
    }

    var action = json.action;
    var data = json.data;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'PING') {
      return responseJson({ status: 'ok', message: 'Koneksi ke Google Sheets berhasil!' });
    }

    // 1. Sinkronisasi Sekolah
    if (action === 'SYNC_SCHOOLS') {
      saveSchools(ss, data);
      return responseJson({ status: 'ok', message: 'Daftar sekolah tersimpan di sheet DAFTAR_SEKOLAH' });
    }

    // 2. Sinkronisasi Sesi Ujian & Token
    if (action === 'SYNC_EXAMS' || action === 'SYNC_SESI' || action === 'SYNC_SESSION') {
      saveExams(ss, data);
      return responseJson({ status: 'ok', message: 'Sesi ujian & token berhasil tersimpan di sheet SESI_UJIAN' });
    }

    // 3. Sinkronisasi Bank Soal
    if (action === 'SYNC_QUESTIONS') {
      saveQuestions(ss, data);
      return responseJson({ status: 'ok', message: 'Bank soal tersimpan di sheet BANK_SOAL' });
    }

    // 4. Sinkronisasi Peserta Ujian
    if (action === 'SYNC_PARTICIPANT') {
      saveOrUpdateParticipant(ss, data);
      return responseJson({ status: 'ok', message: 'Peserta tersimpan di sheet PESERTA' });
    }

    // 5. Sinkronisasi Hasil Ujian Siswa
    if (action === 'SYNC_RESULT') {
      saveResult(ss, data.result, data.participant);
      return responseJson({ status: 'ok', message: 'Hasil ujian tersimpan di sheet HASIL_UJIAN' });
    }

    // 6. Sinkronisasi Log Pelanggaran Anti-Curang
    if (action === 'SYNC_VIOLATION') {
      saveViolation(ss, data);
      return responseJson({ status: 'ok', message: 'Log pelanggaran tersimpan di sheet PELANGGARAN' });
    }
    if (action === 'SYNC_VIOLATIONS') {
      saveViolations(ss, data);
      return responseJson({ status: 'ok', message: 'Seluruh pelanggaran tersimpan di sheet PELANGGARAN' });
    }

    // 7. Ekspor Seluruh Database Sekaligus
    if (action === 'EXPORT_ALL') {
      exportAllData(ss, data);
      return responseJson({ status: 'ok', message: 'Seluruh 6 sheet database berhasil disinkronkan' });
    }

    return responseJson({ status: 'ignored', message: 'Aksi tidak dikenali: ' + action });
  } catch (err) {
    return responseJson({ status: 'error', error: err.toString() });
  }
}

// Simpan / Timpa Daftar Sekolah
function saveSchools(ss, schools) {
  if (!schools) return;
  if (!Array.isArray(schools)) schools = [schools];
  if (schools.length === 0) return;

  var sheet = getOrCreateSheet(ss, SHEET_SEKOLAH);

  // Buat header otomatis jika sheet masih kosong
  if (sheet.getLastRow() === 0 || String(sheet.getRange(1, 1).getValue()).trim() === '') {
    sheet.getRange(1, 1, 1, 5).setValues([[
      'ID Sekolah',
      'Nama Sekolah (SMP/MTs)',
      'NPSN',
      'Alamat / Kecamatan',
      'Terakhir Diperbarui'
    ]]).setFontWeight('bold').setBackground('#E0F2FE').setFontColor('#0369A1');
    sheet.setFrozenRows(1);
  }

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
  }

  var rows = schools.map(function(s) {
    return [
      s.id || ('sch-' + Date.now()),
      s.name || '',
      s.npsn || '-',
      s.address || '-',
      new Date()
    ];
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  }
}

// Simpan / Timpa Sesi Ujian & Token Rilis
function saveExams(ss, exams) {
  if (!exams) return;
  if (!Array.isArray(exams)) exams = [exams];
  if (exams.length === 0) return;

  var sheet = getOrCreateSheet(ss, SHEET_SESI);

  // Buat header otomatis jika sheet masih kosong
  if (sheet.getLastRow() === 0 || String(sheet.getRange(1, 1).getValue()).trim() === '') {
    sheet.getRange(1, 1, 1, 11).setValues([[
      'ID Sesi',
      'Judul Sesi Ujian',
      'Token Rilis',
      'Jumlah Soal',
      'Durasi (Menit)',
      'Waktu Mulai',
      'Waktu Selesai',
      'Status Sesi',
      'Anti Cheat',
      'Acak Soal',
      'Terakhir Diperbarui'
    ]]).setFontWeight('bold').setBackground('#FEF3C7').setFontColor('#92400E');
    sheet.setFrozenRows(1);
  }

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 11).clearContent();
  }

  var rows = exams.map(function(e) {
    var tokenClean = (e.token || 'PAI2026').toString().toUpperCase().trim();
    var isRandom = (e.randomQuestion !== undefined ? e.randomQuestion : (e.randomizeQuestions !== undefined ? e.randomizeQuestions : true));
    return [
      e.id || ('exam-' + Date.now()),
      e.title || 'OLIMPIADE PAI SMP KABUPATEN MOJOKERTO',
      tokenClean,
      Number(e.questionCount || 10),
      Number(e.durationMinutes || 90),
      e.startAt ? new Date(e.startAt).toISOString() : new Date().toISOString(),
      e.endAt ? new Date(e.endAt).toISOString() : new Date(Date.now() + 86400000 * 7).toISOString(),
      e.status || 'active',
      (e.antiCheat !== false) ? 'TRUE' : 'FALSE',
      (isRandom !== false) ? 'TRUE' : 'FALSE',
      new Date()
    ];
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 11).setValues(rows);
  }
}

// Simpan / Timpa Bank Soal
function saveQuestions(ss, questions) {
  if (!questions) return;
  if (!Array.isArray(questions)) questions = [questions];
  if (questions.length === 0) return;

  var sheet = getOrCreateSheet(ss, SHEET_BANK_SOAL);

  // Buat header otomatis jika sheet masih kosong
  if (sheet.getLastRow() === 0 || String(sheet.getRange(1, 1).getValue()).trim() === '') {
    sheet.getRange(1, 1, 1, 11).setValues([[
      'ID Soal',
      'Tipe Soal',
      'Topik / Kompetensi',
      'Tingkat Kesulitan',
      'Butir Pertanyaan',
      'Opsi A',
      'Opsi B',
      'Opsi C',
      'Opsi D',
      'Kunci Jawaban',
      'Pembahasan'
    ]]).setFontWeight('bold').setBackground('#EAF8F0').setFontColor('#087443');
    sheet.setFrozenRows(1);
  }

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 11).clearContent();
  }

  var rows = questions.map(function(q) {
    var optA = '', optB = '', optC = '', optD = '';
    if (q.statements && q.statements.length > 0) {
      if (q.statements[0]) optA = q.statements[0].text;
      if (q.statements[1]) optB = q.statements[1].text;
      if (q.statements[2]) optC = q.statements[2].text;
      if (q.statements[3]) optD = q.statements[3].text;
    } else {
      (q.options || []).forEach(function(o) {
        if (o.id === 'A') optA = o.text;
        if (o.id === 'B') optB = o.text;
        if (o.id === 'C') optC = o.text;
        if (o.id === 'D') optD = o.text;
      });
    }

    return [
      q.id,
      q.type || 'PG',
      q.topic || q.subject || 'PAI',
      q.difficulty || 'Sedang',
      q.question || '',
      optA,
      optB,
      optC,
      optD,
      (q.correctAnswers || []).join(', '),
      q.explanation || '-'
    ];
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 11).setValues(rows);
  }
}

// Simpan / Update Peserta
function saveOrUpdateParticipant(ss, p) {
  if (!p) return;
  var sheet = getOrCreateSheet(ss, SHEET_PESERTA);
  var values = sheet.getDataRange().getValues();
  var foundRow = -1;

  for (var i = 1; i < values.length; i++) {
    if (values[i][0] == p.id || values[i][3] == p.participantNumber) {
      foundRow = i + 1;
      break;
    }
  }

  var answeredCount = Object.keys(p.answers || {}).length;
  var rowData = [
    p.id,
    p.name,
    p.schoolName,
    p.participantNumber,
    p.examId,
    p.status,
    answeredCount,
    p.violationCount || 0,
    p.startedAt || '',
    p.lastActiveAt || '',
    p.attemptId || '',
    new Date()
  ];

  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

// Simpan Nilai Hasil Ujian
function saveResult(ss, r, p) {
  if (!r) return;
  var sheet = getOrCreateSheet(ss, SHEET_HASIL);
  var durationMin = Math.round((r.durationSeconds || 0) / 60);
  var passStatus = r.score >= 75 ? 'LULUS (MEMENUHI KKM)' : 'TEREVALUASI';

  sheet.appendRow([
    r.id,
    r.participantName || (p ? p.name : ''),
    r.schoolName || (p ? p.schoolName : ''),
    r.participantNumber || (p ? p.participantNumber : ''),
    r.examTitle || 'Olimpiade PAI SMP',
    r.score,
    r.correctCount,
    r.wrongCount,
    r.unansweredCount,
    r.totalQuestions,
    r.percentage + '%',
    durationMin,
    r.submittedAt,
    passStatus,
    new Date()
  ]);
}

// Simpan 1 Log Pelanggaran
function saveViolation(ss, v) {
  if (!v) return;
  var item = v.violation || v;
  var sheet = getOrCreateSheet(ss, SHEET_PELANGGARAN);

  sheet.appendRow([
    item.id || ('viol-' + Date.now()),
    item.participantName || item.participantId || 'Peserta',
    item.schoolName || '-',
    item.examId || 'Olimpiade PAI',
    item.type || 'TAB_SWITCH',
    Number(item.violationNumber || 1),
    item.detail || '-',
    item.timestamp || new Date().toISOString(),
    new Date()
  ]);
}

// Simpan Banyak Log Pelanggaran (Array)
function saveViolations(ss, violations) {
  if (!violations || !Array.isArray(violations) || violations.length === 0) return;
  var sheet = getOrCreateSheet(ss, SHEET_PELANGGARAN);

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 9).clearContent();
  }

  var rows = violations.map(function(item) {
    return [
      item.id || ('viol-' + Date.now()),
      item.participantName || item.participantId || 'Peserta',
      item.schoolName || '-',
      item.examId || 'Olimpiade PAI',
      item.type || 'TAB_SWITCH',
      Number(item.violationNumber || 1),
      item.detail || '-',
      item.timestamp || new Date().toISOString(),
      new Date()
    ];
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 9).setValues(rows);
  }
}

// Ekspor Seluruh Data Sekaligus
function exportAllData(ss, data) {
  if (data.schools && data.schools.length > 0) {
    saveSchools(ss, data.schools);
  }

  if (data.exams && data.exams.length > 0) {
    saveExams(ss, data.exams);
  }

  if (data.questions && data.questions.length > 0) {
    saveQuestions(ss, data.questions);
  }

  if (data.participants && data.participants.length > 0) {
    data.participants.forEach(function(p) {
      saveOrUpdateParticipant(ss, p);
    });
  }

  if (data.results && data.results.length > 0) {
    data.results.forEach(function(r) {
      saveResult(ss, r);
    });
  }

  if (data.violations && data.violations.length > 0) {
    saveViolations(ss, data.violations);
  }
}

function responseJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
