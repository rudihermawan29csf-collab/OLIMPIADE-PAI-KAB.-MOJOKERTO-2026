export type QuestionType = 'PG' | 'PGK' | 'BS';

export type Difficulty = 'Mudah' | 'Sedang' | 'Sukar';

export type MateriPAI = 
  | 'Aqidah'
  | "Al-Qur'an Hadis"
  | 'Fiqih'
  | 'Akhlak'
  | 'Sejarah Kebudayaan Islam';

export interface QuestionOption {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuestionStatement {
  id: string; // 'S1', 'S2', 'S3', 'S4', dst.
  text: string;
  correct: 'BENAR' | 'SALAH';
}

export interface Question {
  id: string;
  subject: MateriPAI;
  topic: string;
  difficulty: Difficulty;
  type: QuestionType;
  stimulus?: string;
  question: string;
  options?: QuestionOption[];
  statements?: QuestionStatement[];
  correctAnswers: string[]; // e.g. ['A'] for PG, ['A', 'C'] for PGK, or ['S1:BENAR', 'S2:SALAH'] for BS
  explanation?: string;
  isActive: boolean;
  createdAt: string;
}

export type ExamStatus = 'draft' | 'scheduled' | 'active' | 'completed';

export interface Exam {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  pgCount?: number;
  pgkCount?: number;
  bsCount?: number;
  selectedQuestionIds?: string[];
  durationMinutes: number;
  startAt: string;
  endAt: string;
  randomQuestion: boolean;
  randomOption: boolean;
  antiCheat: boolean;
  fullscreenRequired: boolean;
  token: string;
  hideScoreFromParticipant: boolean;
  passingScore?: number;
  status: ExamStatus;
  createdAt: string;
}

export interface School {
  id: string;
  name: string;
  npsn?: string;
  address?: string;
  createdAt: string;
}

export type ParticipantStatus = 'ready' | 'active' | 'warning' | 'violated' | 'completed' | 'disconnected';

export interface Participant {
  id: string;
  name: string;
  schoolId: string;
  schoolName: string;
  participantNumber: string;
  examId: string;
  status: ParticipantStatus;
  startedAt?: string;
  finishedAt?: string;
  lastActiveAt: string;
  currentQuestionIndex: number;
  markedQuestions: number[]; // question index numbers marked as ragu-ragu
  answers: Record<string, string[]>; // questionId -> array of selected option IDs e.g. ['A'] or ['A', 'C']
  violationCount: number;
  attemptId: string;
}

export type ViolationType = 
  | 'TAB_SWITCH'
  | 'BLUR'
  | 'FULLSCREEN_EXIT'
  | 'DEVTOOLS'
  | 'KEY_SHORTCUT'
  | 'PAGE_REFRESH';

export interface ViolationLog {
  id: string;
  participantId: string;
  participantName: string;
  schoolName: string;
  examId: string;
  type: ViolationType;
  violationNumber: number;
  timestamp: string;
  detail?: string;
}

export interface ExamResult {
  id: string;
  participantId: string;
  participantName: string;
  schoolName: string;
  participantNumber: string;
  examId: string;
  examTitle: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  score: number; // 0 - 100
  percentage: number;
  durationSeconds: number;
  submittedAt: string;
  status: 'completed' | 'violated';
}

export type UserRole = 'superadmin' | 'admin' | 'pengawas' | 'student';

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'superadmin' | 'admin' | 'pengawas';
  schoolAffiliation?: string;
}

export interface ActivityLog {
  id: string;
  participantId?: string;
  examId?: string;
  event: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface OrgSettings {
  ministryName: string;
  officeName: string;
  organizationName: string;
  secretariatAddress: string;
  logoKemenagUrl?: string;
  logoMgmpUrl?: string;
}

