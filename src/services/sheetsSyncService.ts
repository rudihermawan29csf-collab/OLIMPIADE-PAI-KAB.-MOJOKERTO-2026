import { Participant, ExamResult, ViolationLog, Question, School, Exam } from '../types';
import { storageService } from './storageService';

export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxef0cMx4Uts99tztut9p2_XksOEwmJlCU74lJ66LIlNdoZyGVXb_0-CCEjAYCVk6gQ1Q/exec';

const PREV_APPS_SCRIPT_URLS = [
  'https://script.google.com/macros/s/AKfycbx_InSTl85DNt0EauMtqEXmXXwIkEcxVAuTfxtLCmKvA_CbiarWzKr8Tu3cikgo4pELPg/exec',
  'https://script.google.com/macros/s/AKfycbzqWOwYOggXLgLmlCi_Gqm8DReSPxwEgKUtsJGoLgrkWn3o5cak9nhiXPB0YVJ-TP1Drg/exec',
];

const STORAGE_KEY_APPS_SCRIPT_URL = 'PAI_APPS_SCRIPT_URL';

export const sheetsSyncService = {
  getUrl(): string {
    const saved = localStorage.getItem(STORAGE_KEY_APPS_SCRIPT_URL);
    if (saved !== null && saved !== undefined && saved.trim() !== '') {
      const clean = saved.trim();
      if (PREV_APPS_SCRIPT_URLS.includes(clean)) {
        localStorage.setItem(STORAGE_KEY_APPS_SCRIPT_URL, DEFAULT_APPS_SCRIPT_URL);
        return DEFAULT_APPS_SCRIPT_URL;
      }
      return clean;
    }
    return DEFAULT_APPS_SCRIPT_URL;
  },

  setUrl(url: string): void {
    localStorage.setItem(STORAGE_KEY_APPS_SCRIPT_URL, url.trim());
  },

  isConfigured(): boolean {
    const url = this.getUrl();
    return Boolean(url && url.startsWith('https://script.google.com/macros/s/'));
  },

  /**
   * Mengirim payload ke Google Apps Script Web App
   * Menggunakan kombinasi Fetch text/plain dan Form Post tersembunyi
   */
  async sendPayload(action: string, data: any): Promise<boolean> {
    const url = this.getUrl();
    if (!url) return false;

    const payload = {
      action,
      timestamp: new Date().toISOString(),
      data,
    };
    const jsonString = JSON.stringify(payload);

    // 1. Kirim via Fetch text/plain (bebas CORS preflight)
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: jsonString,
        mode: 'no-cors',
      });
    } catch (err) {
      console.warn('Sync via fetch warning:', err);
    }

    // 2. Kirim via Hidden HTML Form Submit (membawa cookie sesi browser akun Google)
    try {
      if (typeof document !== 'undefined') {
        let iframe = document.getElementById('gscript_sync_iframe') as HTMLIFrameElement;
        if (!iframe) {
          iframe = document.createElement('iframe');
          iframe.id = 'gscript_sync_iframe';
          iframe.name = 'gscript_sync_iframe';
          iframe.style.display = 'none';
          document.body.appendChild(iframe);
        }

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = url;
        form.target = 'gscript_sync_iframe';
        form.style.display = 'none';

        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'payload';
        input.value = jsonString;
        form.appendChild(input);

        document.body.appendChild(form);
        form.submit();
        setTimeout(() => form.remove(), 2500);
      }
    } catch (err) {
      console.warn('Sync via form submit warning:', err);
    }

    return true;
  },

  /**
   * Mengambil data dari Google Apps Script secara aman
   * Mengutamakan Fetch standard untuk menghindari "Script error." pada HTML redirect
   */
  async fetchViaJsonp<T>(action: string): Promise<T | null> {
    const url = this.getUrl();
    if (!url || typeof document === 'undefined') return null;

    const sep = url.includes('?') ? '&' : '?';

    // 1. Coba fetch standard terlebih dahulu (100% aman dari SyntaxError HTML & 'Script error.')
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${url}${sep}action=${action}&_t=${Date.now()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().startsWith('{')) {
          return JSON.parse(text) as T;
        }
      }
    } catch {
      // Fetch diblokir CORS / redirect login / offline - aman ditangani
    }

    // Hindari fallback JSONP pada URL lama yang memerlukan login
    // untuk mencegah browser mengeksekusi halaman login HTML sebagai JavaScript
    if (PREV_APPS_SCRIPT_URLS.includes(url)) {
      return null;
    }

    // 2. Fallback JSONP untuk custom Web App URL yang terpasang
    return new Promise((resolve) => {
      const callbackName = 'gscript_cb_' + Math.random().toString(36).substring(2, 9);
      const script = document.createElement('script');
      let timeoutId: any = null;
      let isSettled = false;

      const cleanup = () => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timeoutId);
        try {
          delete (window as any)[callbackName];
        } catch {}
        if (script.parentNode) {
          try {
            script.parentNode.removeChild(script);
          } catch {}
        }
      };

      (window as any)[callbackName] = (response: any) => {
        cleanup();
        resolve(response as T);
      };

      timeoutId = setTimeout(() => {
        cleanup();
        resolve(null);
      }, 7000);

      script.onerror = () => {
        cleanup();
        resolve(null);
      };

      script.src = `${url}${sep}action=${action}&callback=${callbackName}&_t=${Date.now()}`;
      document.head.appendChild(script);
    });
  },

  /**
   * 1. Sinkronisasi Daftar Sekolah ke Google Spreadsheet
   */
  async syncSchools(schools: School[]): Promise<boolean> {
    if (!this.isConfigured()) return false;
    return this.sendPayload('SYNC_SCHOOLS', schools);
  },

  /**
   * Tarik Daftar Sekolah terbaru dari Google Spreadsheet ke perangkat siswa/admin
   */
  async pullSchoolsFromSheets(): Promise<School[] | null> {
    if (!this.isConfigured()) return null;
    try {
      const resp = await this.fetchViaJsonp<{ status: string; schools?: School[] }>('GET_SCHOOLS');
      if (resp && resp.schools && Array.isArray(resp.schools) && resp.schools.length > 0) {
        storageService.saveSchools(resp.schools);
        return resp.schools;
      }
    } catch (err) {
      console.warn('Gagal menarik sekolah dari Google Spreadsheet:', err);
    }
    return null;
  },

  /**
   * 2. Sinkronisasi Sesi Ujian ke Google Spreadsheet
   */
  async syncExams(exams: Exam[]): Promise<boolean> {
    if (!this.isConfigured()) return false;
    return this.sendPayload('SYNC_EXAMS', exams);
  },

  /**
   * Tarik Sesi Ujian terbaru dari Google Spreadsheet ke perangkat siswa/admin
   */
  async pullExamsFromSheets(): Promise<Exam[] | null> {
    if (!this.isConfigured()) return null;
    try {
      const resp = await this.fetchViaJsonp<{ status: string; exams?: Exam[] }>('GET_EXAMS');
      if (resp && resp.exams && Array.isArray(resp.exams) && resp.exams.length > 0) {
        storageService.saveExams(resp.exams);
        return resp.exams;
      }
    } catch (err) {
      console.warn('Gagal menarik sesi ujian dari Google Spreadsheet:', err);
    }
    return null;
  },

  /**
   * 3. Tarik Bank Soal terbaru dari Google Spreadsheet ke perangkat siswa/admin
   */
  async pullQuestionsFromSheets(): Promise<Question[] | null> {
    if (!this.isConfigured()) return null;
    try {
      const resp = await this.fetchViaJsonp<{ status: string; questions?: Question[] }>('GET_QUESTIONS');
      if (resp && resp.questions && Array.isArray(resp.questions) && resp.questions.length > 0) {
        storageService.saveQuestions(resp.questions);
        return resp.questions;
      }
    } catch (err) {
      console.warn('Gagal menarik soal dari Google Spreadsheet:', err);
    }
    return null;
  },

  /**
   * 4. Tarik Hasil Ujian terbaru dari Google Spreadsheet ke laptop admin
   */
  async pullResultsFromSheets(): Promise<ExamResult[] | null> {
    if (!this.isConfigured()) return null;
    try {
      const resp = await this.fetchViaJsonp<{ status: string; results?: ExamResult[] }>('GET_RESULTS');
      if (resp && resp.results && Array.isArray(resp.results) && resp.results.length > 0) {
        const currentResults = storageService.getResults();
        const merged = [...currentResults];
        
        resp.results.forEach((remoteResult) => {
          const idx = merged.findIndex((r) => r.id === remoteResult.id);
          if (idx >= 0) {
            merged[idx] = remoteResult;
          } else {
            merged.push(remoteResult);
          }
        });

        localStorage.setItem('mgmp_cbt_results', JSON.stringify(merged));
        return resp.results;
      }
    } catch (err) {
      console.warn('Gagal menarik hasil dari Google Spreadsheet:', err);
    }
    return null;
  },

  /**
   * 5. Sinkronisasi Pelanggaran Anti-Curang
   */
  async syncViolation(violation: ViolationLog): Promise<boolean> {
    if (!this.isConfigured()) return false;
    return this.sendPayload('SYNC_VIOLATION', violation);
  },

  async syncViolations(violations: ViolationLog[]): Promise<boolean> {
    if (!this.isConfigured()) return false;
    return this.sendPayload('SYNC_VIOLATIONS', violations);
  },

  /**
   * Tarik Log Pelanggaran dari Google Spreadsheet
   */
  async pullViolationsFromSheets(): Promise<ViolationLog[] | null> {
    if (!this.isConfigured()) return null;
    try {
      const resp = await this.fetchViaJsonp<{ status: string; violations?: ViolationLog[] }>('GET_VIOLATIONS');
      if (resp && resp.violations && Array.isArray(resp.violations) && resp.violations.length > 0) {
        storageService.saveViolations(resp.violations);
        return resp.violations;
      }
    } catch (err) {
      console.warn('Gagal menarik log pelanggaran dari Google Spreadsheet:', err);
    }
    return null;
  },

  /**
   * Tarik semua data online (Sekolah, Sesi, Soal, Hasil, Pelanggaran) sekaligus
   */
  async pullAllFromSheets(): Promise<{
    schoolsCount: number;
    examsCount: number;
    questionsCount: number;
    resultsCount: number;
    violationsCount: number;
  }> {
    if (!this.isConfigured()) {
      return { schoolsCount: 0, examsCount: 0, questionsCount: 0, resultsCount: 0, violationsCount: 0 };
    }
    try {
      const resp = await this.fetchViaJsonp<{
        status: string;
        schools?: School[];
        exams?: Exam[];
        questions?: Question[];
        results?: ExamResult[];
        violations?: ViolationLog[];
      }>('GET_ALL');

      let sCount = 0;
      let eCount = 0;
      let qCount = 0;
      let rCount = 0;
      let vCount = 0;

      if (resp?.schools && resp.schools.length > 0) {
        storageService.saveSchools(resp.schools);
        sCount = resp.schools.length;
      }

      if (resp?.exams && resp.exams.length > 0) {
        storageService.saveExams(resp.exams);
        eCount = resp.exams.length;
      }

      if (resp?.questions && resp.questions.length > 0) {
        storageService.saveQuestions(resp.questions);
        qCount = resp.questions.length;
      }

      if (resp?.results && resp.results.length > 0) {
        localStorage.setItem('mgmp_cbt_results', JSON.stringify(resp.results));
        rCount = resp.results.length;
      }

      if (resp?.violations && resp.violations.length > 0) {
        storageService.saveViolations(resp.violations);
        vCount = resp.violations.length;
      }

      return {
        schoolsCount: sCount,
        examsCount: eCount,
        questionsCount: qCount,
        resultsCount: rCount,
        violationsCount: vCount,
      };
    } catch (err) {
      console.warn('Pull all error:', err);
      return { schoolsCount: 0, examsCount: 0, questionsCount: 0, resultsCount: 0, violationsCount: 0 };
    }
  },

  async testConnection(testUrl: string): Promise<boolean> {
    if (!testUrl || !testUrl.startsWith('https://script.google.com/macros/s/')) {
      throw new Error('URL harus berawalan https://script.google.com/macros/s/...');
    }

    try {
      await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'PING',
          data: { message: 'Tes koneksi CBT MGMP PAI Mojokerto' },
        }),
        mode: 'no-cors',
      });
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Koneksi ke Web App gagal.');
    }
  },

  async syncParticipant(participant: Participant) {
    if (!this.isConfigured()) return;
    return this.sendPayload('SYNC_PARTICIPANT', participant);
  },

  async syncResult(result: ExamResult, participant?: Participant) {
    if (!this.isConfigured()) return;
    return this.sendPayload('SYNC_RESULT', {
      result,
      participant,
    });
  },

  async syncQuestions(questions: Question[]) {
    if (!this.isConfigured()) return;
    return this.sendPayload('SYNC_QUESTIONS', questions);
  },

  async exportAll(payloadData: {
    participants: Participant[];
    results: ExamResult[];
    exams: Exam[];
    questions: Question[];
    schools?: School[];
    violations?: ViolationLog[];
  }) {
    if (!this.isConfigured()) return false;
    return this.sendPayload('EXPORT_ALL', payloadData);
  },
};
