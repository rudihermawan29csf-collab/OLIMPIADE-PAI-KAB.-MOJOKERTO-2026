import { useEffect, useRef, useState } from 'react';
import { ViolationType } from '../types';
import { storageService } from '../services/storageService';

interface UseAntiCheatProps {
  participantId?: string;
  examId?: string;
  isEnabled: boolean;
  onViolationStrike: (violationCount: number, message: string, isTerminated: boolean) => void;
}

export function useAntiCheat({
  participantId,
  examId,
  isEnabled,
  onViolationStrike,
}: UseAntiCheatProps) {
  const [violationCount, setViolationCount] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const isEnabledRef = useRef(isEnabled);
  isEnabledRef.current = isEnabled;

  const onViolationStrikeRef = useRef(onViolationStrike);
  onViolationStrikeRef.current = onViolationStrike;

  // Debounce to prevent multiple triggers in a fraction of a second (e.g. blur + visibilitychange firing together)
  const lastViolationTimeRef = useRef<number>(0);

  const triggerViolation = (type: ViolationType, detail?: string) => {
    if (!isEnabledRef.current || !participantId) return;

    const now = Date.now();
    if (now - lastViolationTimeRef.current < 2500) {
      // Ignore bounce within 2.5 seconds
      return;
    }
    lastViolationTimeRef.current = now;

    try {
      const result = storageService.logViolation(participantId, type, detail);
      setViolationCount(result.violationCount);

      let msg = '';
      if (result.violationCount === 1) {
        msg = 'Peringatan 1/3: Anda terdeteksi meninggalkan layar ujian. Tetaplah berada di halaman ujian!';
      } else if (result.violationCount === 2) {
        msg = 'Peringatan 2/3: Terdeteksi pelanggaran kedua! Jika terjadi satu kali lagi, ujian akan dihentikan otomatis!';
      } else {
        msg = 'Pelanggaran ke-3: Ujian Anda resmi dihentikan oleh sistem keamanan CBT.';
      }

      onViolationStrikeRef.current(result.violationCount, msg, result.isTerminated);
    } catch (e) {
      console.error('Error logging violation:', e);
    }
  };

  const requestFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  useEffect(() => {
    if (!isEnabled || !participantId) return;

    // Check existing violation count
    const p = storageService.getParticipantById(participantId);
    if (p) {
      setViolationCount(p.violationCount || 0);
    }

    // 1. Visibility Change (Tab Switch / App Switch)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation('TAB_SWITCH', 'Peserta berpindah tab atau meminimize browser');
      }
    };

    // 2. Window Blur (Focus Lost / Click outside)
    const handleBlur = () => {
      triggerViolation('BLUR', 'Jendela browser kehilangan fokus');
    };

    // 3. Fullscreen Exit
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active && isEnabledRef.current) {
        triggerViolation('FULLSCREEN_EXIT', 'Peserta keluar dari mode fullscreen');
      }
    };

    // 4. Keyboard Shortcuts Interception
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent PrintScreen, F12, Ctrl+C, Ctrl+V, Ctrl+U, Alt+Tab hints
      if (e.key === 'F12') {
        e.preventDefault();
        triggerViolation('DEVTOOLS', 'Percobaan membuka Developer Tools (F12)');
      } else if (e.key === 'PrintScreen') {
        e.preventDefault();
        triggerViolation('KEY_SHORTCUT', 'Percobaan mengambil screenshot (PrintScreen)');
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        triggerViolation('KEY_SHORTCUT', 'Percobaan menyalin teks soal (Ctrl+C)');
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        triggerViolation('KEY_SHORTCUT', 'Percobaan menempel teks (Ctrl+V)');
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        triggerViolation('KEY_SHORTCUT', 'Percobaan melihat source code (Ctrl+U)');
      }
    };

    // 5. Context Menu Prevention (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    // Initial fullscreen check
    setIsFullscreen(Boolean(document.fullscreenElement));

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isEnabled, participantId, examId]);

  return {
    violationCount,
    isFullscreen,
    requestFullscreen,
  };
}
