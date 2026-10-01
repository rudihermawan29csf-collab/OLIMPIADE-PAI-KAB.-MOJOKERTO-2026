import {
  School,
  Question,
  Exam,
  Participant,
  ViolationLog,
  ExamResult,
  ActivityLog,
  ViolationType,
  OrgSettings
} from '../types';
import { INITIAL_SCHOOLS, INITIAL_QUESTIONS, INITIAL_EXAM } from './seedData';
import { sheetsSyncService } from './sheetsSyncService';

const KEYS = {
  SCHOOLS: 'mgmp_cbt_schools',
  QUESTIONS: 'mgmp_cbt_questions',
  EXAMS: 'mgmp_cbt_exams',
  PARTICIPANTS: 'mgmp_cbt_participants',
  VIOLATIONS: 'mgmp_cbt_violations',
  RESULTS: 'mgmp_cbt_results',
  LOGS: 'mgmp_cbt_activity_logs',
  OFFLINE_QUEUE: 'mgmp_cbt_offline_queue',
  ORG_SETTINGS: 'mgmp_cbt_org_settings',
};

export const DEFAULT_ORG_SETTINGS: OrgSettings = {
  ministryName: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
  officeName: 'KANTOR KEMENTERIAN AGAMA KABUPATEN MOJOKERTO',
  organizationName: 'MUSYAWARAH GURU MATA PELAJARAN (MGMP) PAI SMP',
  secretariatAddress:
    'Jl. Kedungmungal No. 1, Kab. Mojokerto, Jawa Timur 61382 • Email: mgmppai.mojokerto@gmail.com',
};

// Event emitter helper for reactive local state updates
type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error('Listener callback error:', e);
    }
  });
}

export function subscribeToStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Storage helpers
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyListeners();
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

// Initialize seed data if empty or purge demo questions
export function initStore(): void {
  if (!localStorage.getItem(KEYS.SCHOOLS)) {
    localStorage.setItem(KEYS.SCHOOLS, JSON.stringify(INITIAL_SCHOOLS));
  }
  
  // Bersihkan seluruh butir soal versi demo bawaan lama ('q-001' s.d. 'q-012')
  const DEMO_QUESTION_IDS = new Set([
    'q-001', 'q-002', 'q-003', 'q-004', 'q-005',
    'q-006', 'q-007', 'q-008', 'q-009', 'q-010',
    'q-011', 'q-012'
  ]);

  const existingQuestions = localStorage.getItem(KEYS.QUESTIONS);
  if (!existingQuestions) {
    localStorage.setItem(KEYS.QUESTIONS, JSON.stringify([]));
  } else {
    try {
      const parsed: Question[] = JSON.parse(existingQuestions);
      const cleaned = parsed.filter((q) => !DEMO_QUESTION_IDS.has(q.id));
      localStorage.setItem(KEYS.QUESTIONS, JSON.stringify(cleaned));
    } catch {
      localStorage.setItem(KEYS.QUESTIONS, JSON.stringify([]));
    }
  }

  const existingExams = localStorage.getItem(KEYS.EXAMS);
  if (!existingExams) {
    localStorage.setItem(KEYS.EXAMS, JSON.stringify([INITIAL_EXAM]));
  } else {
    try {
      const parsed: Exam[] = JSON.parse(existingExams);
      let updated = false;
      const updatedExams = parsed.map((e) => {
        let changed = false;
        const newExam = { ...e };
        if (newExam.selectedQuestionIds && Array.isArray(newExam.selectedQuestionIds)) {
          const filtered = newExam.selectedQuestionIds.filter((id) => !DEMO_QUESTION_IDS.has(id));
          if (filtered.length !== newExam.selectedQuestionIds.length) {
            newExam.selectedQuestionIds = filtered;
            newExam.questionCount = filtered.length;
            changed = true;
          }
        }
        if (changed) updated = true;
        return newExam;
      });
      if (updated) {
        localStorage.setItem(KEYS.EXAMS, JSON.stringify(updatedExams));
      }
    } catch {
      localStorage.setItem(KEYS.EXAMS, JSON.stringify([INITIAL_EXAM]));
    }
  }

  if (!localStorage.getItem(KEYS.PARTICIPANTS)) {
    localStorage.setItem(KEYS.PARTICIPANTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.VIOLATIONS)) {
    localStorage.setItem(KEYS.VIOLATIONS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.RESULTS)) {
    localStorage.setItem(KEYS.RESULTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.LOGS)) {
    localStorage.setItem(KEYS.LOGS, JSON.stringify([]));
  }
}

export const storageService = {
  // ---- SCHOOLS ----
  getSchools(): School[] {
    return getFromStorage<School[]>(KEYS.SCHOOLS, INITIAL_SCHOOLS);
  },
  saveSchool(school: Omit<School, 'id' | 'createdAt'> & { id?: string }): School {
    const list = this.getSchools();
    if (school.id) {
      const idx = list.findIndex((s) => s.id === school.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...school };
        setToStorage(KEYS.SCHOOLS, list);
        return list[idx];
      }
    }
    const newSchool: School = {
      ...school,
      id: `sch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    list.push(newSchool);
    setToStorage(KEYS.SCHOOLS, list);
    return newSchool;
  },
  deleteSchool(id: string): void {
    const list = this.getSchools().filter((s) => s.id !== id);
    setToStorage(KEYS.SCHOOLS, list);
  },
  saveSchools(schools: School[]): void {
    if (!schools || !Array.isArray(schools) || schools.length === 0) return;
    const existing = this.getSchools();
    const map = new Map<string, School>();
    existing.forEach((s) => map.set(s.id, s));
    schools.forEach((s) => map.set(s.id, s));
    const merged = Array.from(map.values());
    setToStorage(KEYS.SCHOOLS, merged);
  },

  // ---- QUESTIONS ----
  getQuestions(): Question[] {
    return getFromStorage<Question[]>(KEYS.QUESTIONS, []);
  },
  clearQuestions(): void {
    setToStorage(KEYS.QUESTIONS, []);
    const exams = this.getExams();
    exams.forEach((ex) => {
      ex.selectedQuestionIds = [];
      ex.questionCount = 0;
    });
    setToStorage(KEYS.EXAMS, exams);
  },
  saveQuestion(question: Omit<Question, 'id' | 'createdAt'> & { id?: string }): Question {
    const list = this.getQuestions();
    let saved: Question;
    let isNew = false;
    if (question.id) {
      const idx = list.findIndex((q) => q.id === question.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...question };
        setToStorage(KEYS.QUESTIONS, list);
        saved = list[idx];
      } else {
        const newQ: Question = {
          ...question,
          id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          createdAt: new Date().toISOString(),
        };
        list.unshift(newQ);
        setToStorage(KEYS.QUESTIONS, list);
        saved = newQ;
        isNew = true;
      }
    } else {
      const newQ: Question = {
        ...question,
        id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      list.unshift(newQ);
      setToStorage(KEYS.QUESTIONS, list);
      saved = newQ;
      isNew = true;
    }

    // Sinkronkan Bank Soal terbaru ke Google Spreadsheet (Sheet: BANK_SOAL)
    sheetsSyncService.syncQuestions(list).catch(() => {});

    return saved;
  },
  saveQuestions(questions: Question[], replace = false): void {
    if (!questions || !Array.isArray(questions) || questions.length === 0) return;
    if (replace) {
      setToStorage(KEYS.QUESTIONS, questions);
    } else {
      const existing = this.getQuestions();
      const map = new Map<string, Question>();
      existing.forEach((q) => map.set(q.id, q));
      questions.forEach((q) => map.set(q.id, q));
      const merged = Array.from(map.values());
      setToStorage(KEYS.QUESTIONS, merged);
    }

    // Perbarui sesi ujian agar mengacu pada ID butir soal terbaru dari spreadsheet
    const exams = this.getExams();
    let examChanged = false;
    const newQIds = new Set(questions.map((q) => q.id));

    exams.forEach((ex) => {
      if (ex.selectedQuestionIds && ex.selectedQuestionIds.length > 0) {
        const validIds = ex.selectedQuestionIds.filter((id) => newQIds.has(id));
        if (validIds.length === 0) {
          const count = Math.min(ex.questionCount || 10, questions.length);
          ex.selectedQuestionIds = questions.slice(0, count).map((q) => q.id);
          examChanged = true;
        } else if (validIds.length !== ex.selectedQuestionIds.length) {
          ex.selectedQuestionIds = validIds;
          examChanged = true;
        }
      } else {
        const count = Math.min(ex.questionCount || 10, questions.length);
        ex.selectedQuestionIds = questions.slice(0, count).map((q) => q.id);
        examChanged = true;
      }
    });

    if (examChanged) {
      setToStorage(KEYS.EXAMS, exams);
    }
  },
  deleteQuestion(id: string): void {
    const list = this.getQuestions().filter((q) => q.id !== id);
    setToStorage(KEYS.QUESTIONS, list);

    // Hapus juga dari sesi ujian & perbarui kuota
    const exams = this.getExams();
    let examChanged = false;
    exams.forEach((ex) => {
      if (ex.selectedQuestionIds && ex.selectedQuestionIds.includes(id)) {
        ex.selectedQuestionIds = ex.selectedQuestionIds.filter((qid) => qid !== id);
        const selectedQ = ex.selectedQuestionIds
          .map((qid) => list.find((q) => q.id === qid))
          .filter((q): q is Question => !!q && q.isActive);
        ex.selectedQuestionIds = selectedQ.map((q) => q.id);
        ex.questionCount = selectedQ.length;
        ex.pgCount = selectedQ.filter((q) => q.type === 'PG').length;
        ex.pgkCount = selectedQ.filter((q) => q.type === 'PGK').length;
        ex.bsCount = selectedQ.filter((q) => q.type === 'BS').length;
        examChanged = true;
      }
    });
    if (examChanged) {
      setToStorage(KEYS.EXAMS, exams);
      sheetsSyncService.syncExams(exams).catch(() => {});
    }

    sheetsSyncService.syncQuestions(list).catch(() => {});
  },
  duplicateQuestion(id: string): Question | null {
    const list = this.getQuestions();
    const source = list.find((q) => q.id === id);
    if (!source) return null;
    const duplicated: Question = {
      ...source,
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      topic: `${source.topic} (Salinan)`,
      createdAt: new Date().toISOString(),
    };
    list.unshift(duplicated);
    setToStorage(KEYS.QUESTIONS, list);

    sheetsSyncService.syncQuestions(list).catch(() => {});
    return duplicated;
  },
  importQuestions(importedQuestions: Omit<Question, 'id' | 'createdAt'>[]): number {
    const list = this.getQuestions();
    let count = 0;
    for (const q of importedQuestions) {
      const newId = `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${count}`;
      list.push({
        ...q,
        id: newId,
        createdAt: new Date().toISOString(),
      });
      count++;
    }
    setToStorage(KEYS.QUESTIONS, list);

    sheetsSyncService.syncQuestions(list).catch(() => {});
    return count;
  },

  // ---- EXAMS ----
  getExams(): Exam[] {
    return getFromStorage<Exam[]>(KEYS.EXAMS, [INITIAL_EXAM]);
  },
  getExamById(id: string): Exam | undefined {
    return this.getExams().find((e) => e.id === id);
  },
  getActiveExam(token?: string): Exam | undefined {
    const exams = this.getExams();
    if (!exams || exams.length === 0) return undefined;

    // 1. Jika token dicocokkan, prioritaskan sesi yang persis memiliki token tersebut
    if (token && token.trim()) {
      const cleanToken = token.trim().toUpperCase();
      const matched = exams.find((e) => (e.token || '').trim().toUpperCase() === cleanToken);
      if (matched) return matched;
    }

    // 2. Prioritaskan sesi 'active' yang saat ini sedang berlangsung sesuai rentang waktu (startAt s.d. endAt)
    const now = Date.now();
    const currentlyRunning = exams.find((e) => {
      if (e.status !== 'active') return false;
      const s = new Date(e.startAt).getTime();
      const end = new Date(e.endAt).getTime();
      return !isNaN(s) && !isNaN(end) && now >= s && now <= end;
    });
    if (currentlyRunning) return currentlyRunning;

    // 3. Sesi aktif lainnya
    const anyActive = exams.find((e) => e.status === 'active');
    if (anyActive) return anyActive;

    // 4. Sesi terjadwal ('scheduled')
    const anyScheduled = exams.find((e) => e.status === 'scheduled');
    if (anyScheduled) return anyScheduled;

    return exams[0];
  },
  saveExam(exam: Omit<Exam, 'id' | 'createdAt'> & { id?: string }): Exam {
    const list = this.getExams();
    let saved: Exam;
    if (exam.id) {
      const idx = list.findIndex((e) => e.id === exam.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...exam };
        setToStorage(KEYS.EXAMS, list);
        saved = list[idx];
      } else {
        const newExam: Exam = {
          ...exam,
          id: `exam-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        list.unshift(newExam);
        setToStorage(KEYS.EXAMS, list);
        saved = newExam;
      }
    } else {
      const newExam: Exam = {
        ...exam,
        id: `exam-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      list.unshift(newExam);
      setToStorage(KEYS.EXAMS, list);
      saved = newExam;
    }

    // Auto-sync ke Google Spreadsheet di background
    sheetsSyncService.syncExams(list).catch(() => {});
    return saved;
  },
  deleteExam(id: string): void {
    const list = this.getExams().filter((e) => e.id !== id);
    setToStorage(KEYS.EXAMS, list);
    // Auto-sync ke Google Spreadsheet di background
    sheetsSyncService.syncExams(list).catch(() => {});
  },
  saveExams(exams: Exam[]): void {
    if (!exams || !Array.isArray(exams) || exams.length === 0) return;
    const existing = this.getExams();
    const existingMap = new Map(existing.map((e) => [e.id, e]));
    const firstExisting = existing[0];

    const updated: Exam[] = exams.map((remoteExam) => {
      const match =
        existingMap.get(remoteExam.id) ||
        (exams.length === 1 && existing.length === 1 ? firstExisting : undefined);

      return {
        ...match,
        ...remoteExam,
        description: remoteExam.description || match?.description || 'Babak Penyisihan Computer Based Test (CBT) Olimpiade PAI SMP Kab. Mojokerto',
        id: match ? match.id : remoteExam.id,
        selectedQuestionIds:
          remoteExam.selectedQuestionIds && remoteExam.selectedQuestionIds.length > 0
            ? remoteExam.selectedQuestionIds
            : match?.selectedQuestionIds || [],
        questionCount: remoteExam.questionCount || match?.questionCount || 10,
        token: (remoteExam.token || match?.token || 'PAI2026').trim().toUpperCase(),
        startAt: remoteExam.startAt || match?.startAt || new Date().toISOString(),
        endAt: remoteExam.endAt || match?.endAt || new Date(Date.now() + 86400000 * 7).toISOString(),
        durationMinutes: remoteExam.durationMinutes || match?.durationMinutes || 90,
        status: remoteExam.status || match?.status || 'active',
        randomQuestion: typeof remoteExam.randomQuestion === 'boolean' ? remoteExam.randomQuestion : (match?.randomQuestion ?? true),
        randomOption: typeof remoteExam.randomOption === 'boolean' ? remoteExam.randomOption : (match?.randomOption ?? true),
        antiCheat: typeof remoteExam.antiCheat === 'boolean' ? remoteExam.antiCheat : (match?.antiCheat ?? true),
        fullscreenRequired: typeof remoteExam.fullscreenRequired === 'boolean' ? remoteExam.fullscreenRequired : (match?.fullscreenRequired ?? true),
        hideScoreFromParticipant: typeof remoteExam.hideScoreFromParticipant === 'boolean' ? remoteExam.hideScoreFromParticipant : (match?.hideScoreFromParticipant ?? false),
      };
    });
    setToStorage(KEYS.EXAMS, updated);
  },

  updateExamSelectedQuestions(examId: string, questionIds: string[]): Exam {
    const list = this.getExams();
    const idx = list.findIndex((e) => e.id === examId);
    if (idx === -1) throw new Error('Sesi ujian tidak ditemukan.');

    const allQuestions = this.getQuestions();
    const selectedQ = questionIds
      .map((id) => allQuestions.find((q) => q.id === id))
      .filter((q): q is Question => !!q);

    const pgCount = selectedQ.filter((q) => q.type === 'PG').length;
    const pgkCount = selectedQ.filter((q) => q.type === 'PGK').length;
    const bsCount = selectedQ.filter((q) => q.type === 'BS').length;

    list[idx] = {
      ...list[idx],
      selectedQuestionIds: questionIds,
      questionCount: questionIds.length,
      pgCount,
      pgkCount,
      bsCount,
    };

    setToStorage(KEYS.EXAMS, list);
    // Auto-sync ke Google Spreadsheet di background
    sheetsSyncService.syncExams(list).catch(() => {});
    return list[idx];
  },

  // ---- PARTICIPANTS & SESSIONS ----
  getParticipants(): Participant[] {
    return getFromStorage<Participant[]>(KEYS.PARTICIPANTS, []);
  },
  getParticipantById(id: string): Participant | undefined {
    return this.getParticipants().find((p) => p.id === id);
  },
  registerParticipant(data: {
    name: string;
    schoolId: string;
    schoolName: string;
    participantNumber?: string;
    examId: string;
  }): {
    participant: Participant;
    isResume: boolean;
    alreadyCompleted?: boolean;
    result?: ExamResult;
  } {
    const list = this.getParticipants();
    const exam = this.getExamById(data.examId) || INITIAL_EXAM;

    // Validate timeframe if exam schedule is active
    const now = Date.now();
    const startTime = new Date(exam.startAt).getTime();
    const endTime = new Date(exam.endAt).getTime();

    if (!isNaN(startTime) && now < startTime) {
      const startStr = new Date(exam.startAt).toLocaleString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      throw new Error(`Sesi ujian belum dibuka. Jadwal ujian dimulai pada ${startStr} WIB.`);
    }

    if (!isNaN(endTime) && now > endTime) {
      const endStr = new Date(exam.endAt).toLocaleString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      throw new Error(`Sesi ujian telah ditutup pada ${endStr} WIB. Ujian sudah tidak dapat dilaksanakan.`);
    }

    const normalizedName = data.name.trim().toLowerCase();
    const normalizedSchool = data.schoolName.trim().toLowerCase();
    const existing = list.find((p) => {
      if (p.examId !== data.examId) return false;
      const sameStudent =
        (p.schoolId === data.schoolId || p.schoolName.trim().toLowerCase() === normalizedSchool) &&
        p.name.trim().toLowerCase() === normalizedName;
      const sameNumber =
        Boolean(data.participantNumber) &&
        Boolean(p.participantNumber) &&
        p.participantNumber.trim().toUpperCase() === data.participantNumber?.trim().toUpperCase();
      return sameStudent || sameNumber;
    });

    if (existing) {
      // If already finished or violated, do not allow retaking
      if (existing.status === 'completed' || existing.status === 'violated') {
        let result = this.getResultByParticipantId(existing.id);
        if (!result) {
          result = this.calculateAndStoreResult(existing.id, existing.status);
        }
        return {
          participant: existing,
          isResume: false,
          alreadyCompleted: true,
          result,
        };
      }
      // Allowed to resume active session
      existing.lastActiveAt = new Date().toISOString();
      setToStorage(KEYS.PARTICIPANTS, list);
      this.logActivity(existing.id, existing.examId, 'RESUME_EXAM', {
        resumedAt: new Date().toISOString(),
      });
      return { participant: existing, isResume: true, alreadyCompleted: false };
    }

    // Pastikan sekolah tercatat di master sekolah jika siswa mengetik nama sekolah baru
    const allSchools = this.getSchools();
    const existingSchool = allSchools.find(
      (s) => s.name.trim().toLowerCase() === normalizedSchool
    );
    if (!existingSchool && data.schoolName.trim()) {
      allSchools.push({
        id: data.schoolId,
        name: data.schoolName.trim(),
        npsn: '-',
        address: 'Kabupaten Mojokerto',
        createdAt: new Date().toISOString(),
      });
      setToStorage(KEYS.SCHOOLS, allSchools);
      sheetsSyncService.syncSchools(allSchools).catch(() => {});
    }

    // Generate clean participant number if not provided
    const cleanSchoolCode =
      data.schoolName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8) ||
      data.schoolId.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8) ||
      'SMP';
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const generatedNumber = `PAI-${cleanSchoolCode}-${randomDigits}`;

    const newParticipant: Participant = {
      id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: data.name.trim(),
      schoolId: data.schoolId,
      schoolName: data.schoolName,
      participantNumber: data.participantNumber?.trim().toUpperCase() || generatedNumber,
      examId: data.examId,
      status: 'ready',
      lastActiveAt: new Date().toISOString(),
      currentQuestionIndex: 0,
      markedQuestions: [],
      answers: {},
      violationCount: 0,
      attemptId: `ATT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    list.push(newParticipant);
    setToStorage(KEYS.PARTICIPANTS, list);
    this.logActivity(newParticipant.id, newParticipant.examId, 'LOGIN_PARTICIPANT', {
      participantNumber: newParticipant.participantNumber,
      schoolName: newParticipant.schoolName,
    });
    // Background sync ke Google Sheets jika URL terkonfigurasi
    sheetsSyncService.syncParticipant(newParticipant).catch(() => {});
    return { participant: newParticipant, isResume: false, alreadyCompleted: false };
  },

  startExam(participantId: string): Participant {
    const list = this.getParticipants();
    const idx = list.findIndex((p) => p.id === participantId);
    if (idx === -1) throw new Error('Peserta tidak ditemukan.');

    const p = list[idx];
    const exam = this.getExamById(p.examId);
    if (exam) {
      const now = Date.now();
      const startTime = new Date(exam.startAt).getTime();
      const endTime = new Date(exam.endAt).getTime();

      if (!isNaN(startTime) && now < startTime) {
        throw new Error('Sesi ujian belum dibuka sesuai jadwal yang ditetapkan.');
      }
      if (!isNaN(endTime) && now > endTime) {
        throw new Error('Sesi ujian telah ditutup karena melewati batas waktu pelaksanaan.');
      }
    }

    if (!p.startedAt) {
      p.startedAt = new Date().toISOString();
    }
    p.status = 'active';
    p.lastActiveAt = new Date().toISOString();
    list[idx] = p;
    setToStorage(KEYS.PARTICIPANTS, list);

    this.logActivity(p.id, p.examId, 'START_EXAM', {
      startedAt: p.startedAt,
      attemptId: p.attemptId,
    });
    // Background sync status active ke Google Sheets
    sheetsSyncService.syncParticipant(p).catch(() => {});
    return p;
  },

  updateHeartbeat(participantId: string): void {
    const list = this.getParticipants();
    const idx = list.findIndex((p) => p.id === participantId);
    if (idx !== -1 && list[idx].status !== 'completed' && list[idx].status !== 'violated') {
      list[idx].lastActiveAt = new Date().toISOString();
      setToStorage(KEYS.PARTICIPANTS, list);
    }
  },

  // Autosave single answer
  saveAnswer(participantId: string, questionId: string, selectedOptions: string[]): void {
    const list = this.getParticipants();
    const idx = list.findIndex((p) => p.id === participantId);
    if (idx === -1) return;

    list[idx].answers = {
      ...list[idx].answers,
      [questionId]: selectedOptions,
    };
    list[idx].lastActiveAt = new Date().toISOString();
    setToStorage(KEYS.PARTICIPANTS, list);
  },

  updateCurrentQuestionIndex(participantId: string, index: number): void {
    const list = this.getParticipants();
    const idx = list.findIndex((p) => p.id === participantId);
    if (idx !== -1) {
      list[idx].currentQuestionIndex = index;
      setToStorage(KEYS.PARTICIPANTS, list);
    }
  },

  toggleMarkQuestion(participantId: string, questionIndex: number): number[] {
    const list = this.getParticipants();
    const idx = list.findIndex((p) => p.id === participantId);
    if (idx === -1) return [];

    const marked = new Set(list[idx].markedQuestions || []);
    if (marked.has(questionIndex)) {
      marked.delete(questionIndex);
    } else {
      marked.add(questionIndex);
    }
    list[idx].markedQuestions = Array.from(marked);
    setToStorage(KEYS.PARTICIPANTS, list);
    return list[idx].markedQuestions;
  },

  // Anti-cheat violation logging & Strike system
  logViolation(
    participantId: string,
    type: ViolationType,
    detail?: string
  ): { violationCount: number; isTerminated: boolean; violation: ViolationLog } {
    const list = this.getParticipants();
    const idx = list.findIndex((p) => p.id === participantId);
    if (idx === -1) throw new Error('Peserta tidak ditemukan.');

    const p = list[idx];
    p.violationCount = (p.violationCount || 0) + 1;
    const isTerminated = p.violationCount >= 3;

    if (isTerminated) {
      p.status = 'violated';
      p.finishedAt = new Date().toISOString();
    } else if (p.violationCount === 2) {
      p.status = 'warning';
    }

    list[idx] = p;
    setToStorage(KEYS.PARTICIPANTS, list);

    const violation: ViolationLog = {
      id: `viol-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      participantId: p.id,
      participantName: p.name,
      schoolName: p.schoolName,
      examId: p.examId,
      type,
      violationNumber: p.violationCount,
      timestamp: new Date().toISOString(),
      detail,
    };

    const violations = getFromStorage<ViolationLog[]>(KEYS.VIOLATIONS, []);
    violations.unshift(violation);
    setToStorage(KEYS.VIOLATIONS, violations);

    this.logActivity(p.id, p.examId, 'VIOLATION_RECORDED', {
      type,
      violationNumber: p.violationCount,
      isTerminated,
      detail,
    });

    if (isTerminated) {
      // Auto-submit and grade on strike 3
      this.calculateAndStoreResult(p.id, 'violated');
    }

    // Background sync ke Google Sheets jika URL terkonfigurasi
    sheetsSyncService.syncViolation(violation).catch(() => {});

    return { violationCount: p.violationCount, isTerminated, violation };
  },

  getViolations(examId?: string): ViolationLog[] {
    const all = getFromStorage<ViolationLog[]>(KEYS.VIOLATIONS, []);
    if (!examId) return all;
    return all.filter((v) => v.examId === examId);
  },
  saveViolations(violations: ViolationLog[]): void {
    if (!violations || !Array.isArray(violations) || violations.length === 0) return;
    const existing = this.getViolations();
    const map = new Map<string, ViolationLog>();
    existing.forEach((v) => map.set(v.id, v));
    violations.forEach((v) => map.set(v.id, v));
    const merged = Array.from(map.values());
    setToStorage(KEYS.VIOLATIONS, merged);
  },

  // Calculate & finalize test results
  calculateAndStoreResult(
    participantId: string,
    overrideStatus?: 'completed' | 'violated'
  ): ExamResult {
    const participants = this.getParticipants();
    const pIdx = participants.findIndex((p) => p.id === participantId);
    if (pIdx === -1) throw new Error('Peserta tidak ditemukan.');

    const participant = participants[pIdx];
    const exam = this.getExamById(participant.examId) || INITIAL_EXAM;
    const allQuestions = this.getQuestions();

    // Check answers
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    // Gunakan butir soal yang telah disetting pada sesi ujian ini
    let examQuestions: Question[] = [];
    if (exam.selectedQuestionIds && exam.selectedQuestionIds.length > 0) {
      examQuestions = exam.selectedQuestionIds
        .map((id) => allQuestions.find((q) => q.id === id))
        .filter((q): q is Question => !!q && q.isActive);
    }

    if (examQuestions.length === 0) {
      const activeQ = allQuestions.filter((q) => q.isActive);
      const count = Math.min(exam.questionCount || 10, activeQ.length);
      examQuestions = activeQ.slice(0, count);
    }

    if (exam.questionCount && exam.questionCount > 0 && examQuestions.length > exam.questionCount) {
      examQuestions = examQuestions.slice(0, exam.questionCount);
    }
    const totalExamQuestions = examQuestions.length;

    for (const q of examQuestions) {
      const studentAnswers = participant.answers[q.id] || [];
      if (studentAnswers.length === 0) {
        unansweredCount++;
        continue;
      }

      // Check if matches correctAnswers
      const sortedStudent = [...studentAnswers].sort();
      const sortedKey = [...q.correctAnswers].sort();
      const isExactMatch =
        sortedStudent.length === sortedKey.length &&
        sortedStudent.every((val, index) => val === sortedKey[index]);

      if (isExactMatch) {
        correctCount++;
      } else {
        wrongCount++;
      }
    }

    const score = totalExamQuestions > 0 ? (correctCount / totalExamQuestions) * 100 : 0;
    const finalScore = Math.round(score * 100) / 100;

    const startedTime = participant.startedAt ? new Date(participant.startedAt).getTime() : Date.now();
    const durationSeconds = Math.max(0, Math.floor((Date.now() - startedTime) / 1000));

    const finalStatus: 'completed' | 'violated' =
      overrideStatus || (participant.status === 'violated' ? 'violated' : 'completed');

    participant.status = finalStatus;
    participant.finishedAt = new Date().toISOString();
    participants[pIdx] = participant;
    setToStorage(KEYS.PARTICIPANTS, participants);

    const result: ExamResult = {
      id: `res-${Date.now()}-${participant.id}`,
      participantId: participant.id,
      participantName: participant.name,
      schoolName: participant.schoolName,
      participantNumber: participant.participantNumber,
      examId: participant.examId,
      examTitle: exam.title,
      totalQuestions: totalExamQuestions,
      correctCount,
      wrongCount,
      unansweredCount,
      score: finalScore,
      percentage: finalScore,
      durationSeconds,
      submittedAt: new Date().toISOString(),
      status: finalStatus,
    };

    const results = getFromStorage<ExamResult[]>(KEYS.RESULTS, []);
    const existingIdx = results.findIndex((r) => r.participantId === participantId);
    if (existingIdx !== -1) {
      results[existingIdx] = result;
    } else {
      results.push(result);
    }
    setToStorage(KEYS.RESULTS, results);

    this.logActivity(participant.id, participant.examId, 'SUBMIT_EXAM', {
      score: finalScore,
      correctCount,
      wrongCount,
      durationSeconds,
      status: finalStatus,
    });

    // Background sync ke Google Sheets jika URL terkonfigurasi
    sheetsSyncService.syncResult(result, participant).catch(() => {});

    return result;
  },

  getResults(examId?: string): ExamResult[] {
    const list = getFromStorage<ExamResult[]>(KEYS.RESULTS, []);
    if (!examId) return list;
    return list.filter((r) => r.examId === examId);
  },
  saveResults(results: ExamResult[]): void {
    if (!results || !Array.isArray(results) || results.length === 0) return;
    const current = this.getResults();
    const map = new Map<string, ExamResult>();
    current.forEach((r) => map.set(r.id, r));
    results.forEach((r) => map.set(r.id, r));
    const merged = Array.from(map.values());
    setToStorage(KEYS.RESULTS, merged);
  },

  getResultByParticipantId(participantId: string): ExamResult | undefined {
    return this.getResults().find((r) => r.participantId === participantId);
  },

  // Prepared sanitized exam questions for student session
  getSanitizedExamQuestions(
    examId: string,
    randomQuestion = false,
    randomOption = false
  ): {
    questions: Omit<Question, 'correctAnswers' | 'explanation'>[];
    questionMap: Record<string, Question>;
  } {
    const exam = this.getExamById(examId) || INITIAL_EXAM;
    const activeQuestions = this.getQuestions().filter((q) => q.isActive);

    let selected: Question[] = [];

    // Prioritas 1: Jika admin memilih butir soal tertentu dari bank soal untuk sesi ini
    if (exam.selectedQuestionIds && exam.selectedQuestionIds.length > 0) {
      const allQ = this.getQuestions();
      const picked = exam.selectedQuestionIds
        .map((id) => allQ.find((q) => q.id === id))
        .filter((q): q is Question => !!q && q.isActive);

      if (picked.length > 0) {
        selected = (randomQuestion || exam.randomQuestion) ? shuffleArray(picked) : picked;
      }
    }

    // Prioritas 2: Jika belum ada butir terpilih atau kosong, gunakan pembagian kuota jenis soal
    if (selected.length === 0) {
      const hasTypeBreakdown =
        typeof exam.pgCount === 'number' ||
        typeof exam.pgkCount === 'number' ||
        typeof exam.bsCount === 'number';

      const sumBreakdown = (exam.pgCount || 0) + (exam.pgkCount || 0) + (exam.bsCount || 0);

      if (hasTypeBreakdown && sumBreakdown > 0) {
        const pgList = activeQuestions.filter((q) => q.type === 'PG');
        const pgkList = activeQuestions.filter((q) => q.type === 'PGK');
        const bsList = activeQuestions.filter((q) => q.type === 'BS');

        const shuffledPG = (randomQuestion || exam.randomQuestion) ? shuffleArray(pgList) : pgList;
        const shuffledPGK = (randomQuestion || exam.randomQuestion) ? shuffleArray(pgkList) : pgkList;
        const shuffledBS = (randomQuestion || exam.randomQuestion) ? shuffleArray(bsList) : bsList;

        const selectedPG = shuffledPG.slice(0, exam.pgCount || 0);
        const selectedPGK = shuffledPGK.slice(0, exam.pgkCount || 0);
        const selectedBS = shuffledBS.slice(0, exam.bsCount || 0);

        selected = [...selectedPG, ...selectedPGK, ...selectedBS];

        if (randomQuestion || exam.randomQuestion) {
          selected = shuffleArray(selected);
        }
      } else {
        const count = Math.min(exam.questionCount || 10, activeQuestions.length);
        const pool = (randomQuestion || exam.randomQuestion) ? shuffleArray(activeQuestions) : activeQuestions;
        selected = pool.slice(0, count);
      }
    }

    // Pastikan jumlah soal yang tampil sesuai dengan questionCount yang ditentukan admin
    if (exam.questionCount && exam.questionCount > 0 && selected.length > exam.questionCount) {
      selected = selected.slice(0, exam.questionCount);
    }

    const questionMap: Record<string, Question> = {};
    const sanitized = selected.map((q) => {
      questionMap[q.id] = q;
      let opts = q.options ? [...q.options] : undefined;
      if (opts && (randomOption || exam.randomOption)) {
        opts = shuffleArray(opts);
      }
      return {
        id: q.id,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        type: q.type,
        stimulus: q.stimulus,
        question: q.question,
        options: opts,
        statements: q.statements,
        isActive: q.isActive,
        createdAt: q.createdAt,
      };
    });

    return { questions: sanitized, questionMap };
  },

  // ---- ACTIVITY LOGS ----
  logActivity(
    participantId: string | undefined,
    examId: string | undefined,
    event: string,
    metadata?: Record<string, any>
  ): void {
    const logs = getFromStorage<ActivityLog[]>(KEYS.LOGS, []);
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      participantId,
      examId,
      event,
      timestamp: new Date().toISOString(),
      metadata,
    };
    logs.unshift(newLog);
    // keep up to 1000 logs
    if (logs.length > 1000) logs.pop();
    setToStorage(KEYS.LOGS, logs);
  },

  getActivityLogs(limit = 100): ActivityLog[] {
    const logs = getFromStorage<ActivityLog[]>(KEYS.LOGS, []);
    return logs.slice(0, limit);
  },

  getOrgSettings(): OrgSettings {
    const data = getFromStorage<OrgSettings>(KEYS.ORG_SETTINGS, DEFAULT_ORG_SETTINGS);
    return { ...DEFAULT_ORG_SETTINGS, ...data };
  },

  saveOrgSettings(settings: Partial<OrgSettings>): OrgSettings {
    const current = this.getOrgSettings();
    const updated = { ...current, ...settings };
    setToStorage(KEYS.ORG_SETTINGS, updated);
    notifyListeners();
    return updated;
  },

  // Reset demo data to initial defaults
  resetAllData(): void {
    localStorage.setItem(KEYS.SCHOOLS, JSON.stringify(INITIAL_SCHOOLS));
    localStorage.setItem(KEYS.QUESTIONS, JSON.stringify(INITIAL_QUESTIONS));
    localStorage.setItem(KEYS.EXAMS, JSON.stringify([INITIAL_EXAM]));
    localStorage.setItem(KEYS.PARTICIPANTS, JSON.stringify([]));
    localStorage.setItem(KEYS.VIOLATIONS, JSON.stringify([]));
    localStorage.setItem(KEYS.RESULTS, JSON.stringify([]));
    localStorage.setItem(KEYS.LOGS, JSON.stringify([]));
    notifyListeners();
  },
};

// Array shuffler with Fisher-Yates
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
