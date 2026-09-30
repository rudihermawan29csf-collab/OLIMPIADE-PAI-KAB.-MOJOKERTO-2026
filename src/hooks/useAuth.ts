import { useState, useEffect } from 'react';
import { AdminUser, Participant } from '../types';
import { DEMO_ADMINS } from '../services/seedData';
import { storageService } from '../services/storageService';

const ADMIN_AUTH_KEY = 'mgmp_cbt_admin_user';
const STUDENT_AUTH_KEY = 'mgmp_cbt_student_participant';
const AUTH_SYNC_EVENT = 'mgmp_auth_sync';

export function useAuth() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    try {
      const stored = localStorage.getItem(ADMIN_AUTH_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.displayName = 'Admin MGMP PAI';
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [studentSession, setStudentSession] = useState<Participant | null>(() => {
    try {
      const stored = localStorage.getItem(STUDENT_AUTH_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const emitSync = () => {
    try {
      window.dispatchEvent(new CustomEvent(AUTH_SYNC_EVENT));
    } catch {
      // ignore
    }
  };

  // Keep admin and student session synchronized across components and storage
  useEffect(() => {
    const handleSync = () => {
      try {
        const storedAdmin = localStorage.getItem(ADMIN_AUTH_KEY);
        if (storedAdmin) {
          const parsed = JSON.parse(storedAdmin);
          parsed.displayName = 'Admin MGMP PAI';
          setAdminUser(parsed);
        } else {
          setAdminUser(null);
        }

        const storedStudent = localStorage.getItem(STUDENT_AUTH_KEY);
        if (storedStudent) {
          const parsed = JSON.parse(storedStudent);
          const current = storageService.getParticipantById(parsed.id);
          setStudentSession(current || parsed);
        } else {
          setStudentSession(null);
        }
      } catch (err) {
        console.error('Session sync error:', err);
      }
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener(AUTH_SYNC_EVENT, handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener(AUTH_SYNC_EVENT, handleSync);
    };
  }, []);

  const loginAdmin = (email: string, _pass?: string): AdminUser => {
    const normalized = email.trim().toLowerCase();
    const found = DEMO_ADMINS.find((a) => a.email.toLowerCase() === normalized);
    const userToSave: AdminUser = {
      uid: found ? found.uid : `admin-${Date.now()}`,
      email: found ? found.email : normalized,
      displayName: 'Admin MGMP PAI',
      role: 'admin',
    };

    localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(userToSave));
    setAdminUser(userToSave);
    storageService.logActivity(undefined, undefined, 'ADMIN_LOGIN', { email: userToSave.email, role: userToSave.role });
    emitSync();
    return userToSave;
  };

  const loginQuickAdmin = (_role?: 'superadmin' | 'admin' | 'pengawas'): AdminUser => {
    const user: AdminUser = {
      uid: 'admin-mgmp-001',
      email: 'admin@mgmppai-mojokerto.sch.id',
      displayName: 'Admin MGMP PAI',
      role: 'admin',
    };
    localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(user));
    setAdminUser(user);
    storageService.logActivity(undefined, undefined, 'ADMIN_QUICK_LOGIN', { role: 'admin' });
    emitSync();
    return user;
  };

  const setAdmin = (user: AdminUser | null) => {
    if (user) {
      localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(ADMIN_AUTH_KEY);
    }
    setAdminUser(user);
    emitSync();
  };

  const logoutAdmin = () => {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    setAdminUser(null);
    emitSync();
  };

  const setStudent = (p: Participant | null) => {
    if (p) {
      localStorage.setItem(STUDENT_AUTH_KEY, JSON.stringify(p));
    } else {
      localStorage.removeItem(STUDENT_AUTH_KEY);
    }
    setStudentSession(p);
    emitSync();
  };

  const logoutStudent = () => {
    localStorage.removeItem(STUDENT_AUTH_KEY);
    setStudentSession(null);
    emitSync();
  };

  return {
    adminUser,
    studentSession,
    isAdminLoggedIn: Boolean(adminUser),
    isStudentLoggedIn: Boolean(studentSession),
    loginAdmin,
    loginQuickAdmin,
    setAdmin,
    setAdminUser: setAdmin,
    logoutAdmin,
    setStudent,
    logoutStudent,
  };
}
