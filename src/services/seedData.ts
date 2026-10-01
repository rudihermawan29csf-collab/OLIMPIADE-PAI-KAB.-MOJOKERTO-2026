import { School, Question, Exam, AdminUser } from '../types';

export const INITIAL_SCHOOLS: School[] = [
  {
    id: 'sch-1',
    name: 'SMPN 3 Pacet',
    npsn: '20502781',
    address: 'Jl. Raya Pacet Selatan, Mojokerto',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sch-2',
    name: 'SMPN 1 Puri',
    npsn: '20502755',
    address: 'Jl. Jayanegara No. 1, Puri, Mojokerto',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sch-3',
    name: 'SMPN 2 Pacet',
    npsn: '20502780',
    address: 'Jl. Air Panas Padusan, Pacet, Mojokerto',
    createdAt: new Date().toISOString(),
  },
];

// Kosongkan bank soal demo agar soal yang tampil murni berasal dari server spreadsheet
export const INITIAL_QUESTIONS: Question[] = [];

export const INITIAL_EXAM: Exam = {
  id: 'exam-pai-mojokerto-2026',
  title: 'OLIMPIADE PAI SMP KABUPATEN MOJOKERTO 2026',
  description: 'Babak Penyisihan Computer Based Test (CBT) Olimpiade Pendidikan Agama Islam Jenjang SMP se-Kabupaten Mojokerto yang diselenggarakan oleh MGMP PAI Kabupaten Mojokerto.',
  questionCount: 0,
  pgCount: 0,
  pgkCount: 0,
  bsCount: 0,
  selectedQuestionIds: [],
  durationMinutes: 120,
  startAt: new Date(Date.now() - 3600000).toISOString(),
  endAt: new Date(Date.now() + 86400000 * 7).toISOString(),
  randomQuestion: true,
  randomOption: true,
  antiCheat: true,
  fullscreenRequired: true,
  token: 'PAI2026',
  hideScoreFromParticipant: false,
  passingScore: 75,
  status: 'active',
  createdAt: new Date().toISOString(),
};

export const DEMO_ADMINS: AdminUser[] = [
  {
    uid: 'admin-mgmp-001',
    email: 'admin@mgmppai-mojokerto.sch.id',
    displayName: 'Admin MGMP PAI',
    role: 'admin',
  },
];
