import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ToastProvider, useToast } from './components/Toast';
import { LandingPage } from './pages/LandingPage';
import { StudentLogin } from './student/StudentLogin';
import { ExamConfirmation } from './student/ExamConfirmation';
import { CbtExamRoom } from './student/CbtExamRoom';
import { ExamFinish } from './student/ExamFinish';
import { AdminLogin } from './admin/AdminLogin';
import { AdminLayout } from './admin/AdminLayout';
import { useAuth } from './hooks/useAuth';
import { storageService, initStore, subscribeToStore } from './services/storageService';
import { sheetsSyncService } from './services/sheetsSyncService';
import { DEMO_ADMINS } from './services/seedData';
import { Participant, Exam, ExamResult, AdminUser } from './types';

export default function App() {
  return (
    <ToastProvider>
      <MainAppContent />
    </ToastProvider>
  );
}

function MainAppContent() {
  const { showToast } = useToast();
  const {
    adminUser,
    studentSession,
    isAdminLoggedIn,
    isStudentLoggedIn,
    setAdmin,
    logoutAdmin,
    setStudent,
    logoutStudent,
  } = useAuth();

  // App View Navigation State: default to 'student_login' (Kemendikdasmen CBT Login)
  // 'student_login' | 'student_confirm' | 'student_cbt' | 'student_finish' | 'landing' | 'admin_login' | 'admin_dashboard'
  const [currentView, setCurrentView] = useState<string>('student_login');
  const [isResumeMode, setIsResumeMode] = useState<boolean>(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [activeExam, setActiveExam] = useState<Exam | undefined>(() => storageService.getActiveExam());

  // Subscribe to store updates so activeExam and questions stay 100% synchronized
  useEffect(() => {
    const unsub = subscribeToStore(() => {
      setActiveExam(storageService.getActiveExam());
    });
    return () => unsub();
  }, []);

  // Initialize seed data
  useEffect(() => {
    initStore();
    setActiveExam(storageService.getActiveExam());

    // Otomatis tarik Sesi Ujian & Token, Bank Soal, Hasil, Sekolah, dan Pelanggaran dari Cloud Google Spreadsheet
    if (sheetsSyncService.isConfigured()) {
      sheetsSyncService.pullExamsFromSheets().catch(() => {});
      sheetsSyncService.pullQuestionsFromSheets().catch(() => {});
      sheetsSyncService.pullResultsFromSheets().catch(() => {});
      sheetsSyncService.pullSchoolsFromSheets().catch(() => {});
      sheetsSyncService.pullViolationsFromSheets().catch(() => {});
    }

    // Check if participant was in middle of exam on refresh
    if (studentSession) {
      if (studentSession.status === 'active') {
        setCurrentView('student_cbt');
      } else if (studentSession.status === 'ready') {
        setCurrentView('student_confirm');
      } else if (studentSession.status === 'completed' || studentSession.status === 'violated') {
        const res = storageService.getResultByParticipantId(studentSession.id);
        if (res) {
          setExamResult(res);
          setCurrentView('student_finish');
        }
      }
    } else if (adminUser) {
      setCurrentView('admin_dashboard');
    }
  }, []);

  // Handler: Student starts login
  const handleOpenStudentLogin = () => {
    setCurrentView('student_login');
  };

  // Handler: Student successfully identified
  const handleStudentLoginSuccess = (participant: Participant, isResume: boolean, exam?: Exam) => {
    setStudent(participant);
    setIsResumeMode(isResume);

    if (exam) {
      setActiveExam(exam);
    } else if (participant.examId) {
      const found = storageService.getExamById(participant.examId);
      if (found) setActiveExam(found);
    }

    if (isResume && participant.status === 'active') {
      setCurrentView('student_cbt');
      showToast(`Selamat datang kembali, ${participant.name}. Sesi Anda berhasil dipulihkan.`, 'info');
    } else {
      setCurrentView('student_confirm');
    }
  };

  // Handler: Start CBT test with fullscreen
  const handleStartExam = async () => {
    if (!studentSession) return;

    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (e) {
      // Continue even if fullscreen is blocked by browser policies
    }

    const startedParticipant = storageService.startExam(studentSession.id);
    setStudent(startedParticipant);
    setCurrentView('student_cbt');
    showToast('Ujian dimulai. Waktu pengerjaan sedang berjalan!', 'success');
  };

  // Handler: Finish test
  const handleExamFinish = (result: ExamResult) => {
    setExamResult(result);
    setCurrentView('student_finish');
    showToast('Alhamdulillah! Ujian Anda telah berhasil dikumpulkan.', 'success');
  };

  // Handler: Disqualified
  const handleExamDisqualified = (result: ExamResult) => {
    setExamResult(result);
    setCurrentView('student_finish');
    showToast('Ujian dihentikan karena terdeteksi 3 kali pelanggaran.', 'error');
  };

  // Handler: Return to CBT Login
  const handleReturnHome = () => {
    logoutStudent();
    setExamResult(null);
    setCurrentView('student_login');
  };

  // Handler: Admin Login
  const handleOpenAdminLogin = () => {
    if (adminUser) {
      setCurrentView('admin_dashboard');
    } else {
      setCurrentView('admin_login');
    }
  };

  const handleAdminLoginSuccess = (user?: AdminUser) => {
    if (user) {
      setAdmin(user);
    }
    setCurrentView('admin_dashboard');
    showToast('Login berhasil. Selamat datang di dashboard MGMP PAI.', 'success');
  };

  const handleAdminLogout = () => {
    logoutAdmin();
    setCurrentView('student_login');
    showToast('Anda telah keluar dari sesi admin.', 'info');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F0F5F2]">
      {/* Universal Kemendikdasmen Brand Navbar (Hidden during active CBT exam) */}
      {currentView !== 'student_cbt' && (
        <Navbar
          onHomeClick={() => setCurrentView('student_login')}
          adminUser={adminUser}
          studentSession={studentSession}
          onAdminLogout={handleAdminLogout}
          onStudentLogout={logoutStudent}
          onOpenAdmin={handleOpenAdminLogin}
          onOpenStudent={handleOpenStudentLogin}
          onOpenLanding={() => setCurrentView('landing')}
        />
      )}

      {/* Main View Router */}
      <div className="flex-1 flex flex-col">
        {currentView === 'student_login' && (
          <StudentLogin
            onSuccess={handleStudentLoginSuccess}
            onOpenAdmin={handleOpenAdminLogin}
          />
        )}

        {currentView === 'landing' && (
          <LandingPage
            onStartStudent={handleOpenStudentLogin}
            onOpenAdmin={handleOpenAdminLogin}
          />
        )}

        {currentView === 'student_confirm' && studentSession && (
          <ExamConfirmation
            participant={studentSession}
            exam={storageService.getExamById(studentSession.examId) || activeExam || storageService.getActiveExam()!}
            isResume={isResumeMode}
            onStartExam={handleStartExam}
            onCancel={() => {
              logoutStudent();
              setCurrentView('student_login');
            }}
          />
        )}

        {currentView === 'student_cbt' && studentSession && (
          <CbtExamRoom
            participant={studentSession}
            exam={storageService.getExamById(studentSession.examId) || activeExam || storageService.getActiveExam()!}
            onFinishExam={handleExamFinish}
            onDisqualified={handleExamDisqualified}
          />
        )}

        {currentView === 'student_finish' && examResult && (
          <ExamFinish
            result={examResult}
            exam={storageService.getExamById(examResult.examId) || activeExam || storageService.getActiveExam()!}
            onReturnHome={handleReturnHome}
          />
        )}

        {currentView === 'admin_login' && (
          <AdminLogin
            onSuccess={handleAdminLoginSuccess}
            onBack={() => setCurrentView('student_login')}
          />
        )}

        {currentView === 'admin_dashboard' && (
          <AdminLayout
            adminUser={adminUser || DEMO_ADMINS[0]}
            onLogout={handleAdminLogout}
            onGoHome={() => setCurrentView('student_login')}
          />
        )}
      </div>
    </div>
  );
}
