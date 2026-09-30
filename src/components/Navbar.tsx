import React from 'react';
import { LogOut, Shield, User } from 'lucide-react';
import { AdminUser, Participant } from '../types';
import { LOGO_KEMENAG_MOJOKERTO, LOGO_MGMP_PAI_MOJOKERTO } from '../constants/branding';

interface NavbarProps {
  onHomeClick?: () => void;
  adminUser?: AdminUser | null;
  studentSession?: Participant | null;
  onAdminLogout?: () => void;
  onStudentLogout?: () => void;
  onOpenAdmin?: () => void;
  onOpenStudent?: () => void;
  onOpenLanding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onHomeClick,
  adminUser,
  studentSession,
  onAdminLogout,
  onStudentLogout,
  onOpenAdmin,
}) => {
  return (
    <header className="bg-[#087443] text-white border-b border-emerald-950/20 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
        
        {/* Brand Identity */}
        <div
          onClick={onHomeClick}
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
        >
          <div className="flex items-center gap-1.5 bg-white/95 p-1 rounded-full shadow-xs group-hover:scale-105 transition-transform">
            <img
              src={LOGO_KEMENAG_MOJOKERTO}
              alt="Logo Kemenag Kab. Mojokerto"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
            />
            <img
              src={LOGO_MGMP_PAI_MOJOKERTO}
              alt="Logo MGMP PAI Kabupaten Mojokerto"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black tracking-tight leading-tight uppercase text-white">
                OLIMPIADE PAI
              </span>
              <span className="text-[10px] font-bold text-amber-300 bg-[#054c2c] px-2 py-0.5 rounded border border-emerald-700/80">
                KAB. MOJOKERTO
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-emerald-100 font-medium tracking-wide">
              KEMENAG & MGMP PAI KABUPATEN MOJOKERTO
            </p>
          </div>
        </div>

        {/* User Identity / Proktor Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {adminUser ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-white leading-tight">
                  Admin MGMP PAI
                </span>
                <span className="text-[10px] text-amber-300 font-medium uppercase tracking-wider">
                  Admin MGMP
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#054c2c] border border-emerald-700 flex items-center justify-center text-emerald-100">
                <Shield className="w-4 h-4" />
              </div>
              <button
                onClick={onAdminLogout}
                title="Keluar Admin"
                className="px-2.5 py-1.5 rounded-lg bg-[#054c2c] hover:bg-[#033720] border border-emerald-700 text-white text-xs font-medium transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : studentSession ? (
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <span className="text-xs font-bold text-white block max-w-[130px] sm:max-w-[180px] truncate leading-tight">
                  {studentSession.name}
                </span>
                <span className="text-[10px] text-emerald-200 block truncate">
                  {studentSession.schoolName}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#054c2c] border border-emerald-700 flex items-center justify-center text-emerald-100">
                <User className="w-4 h-4" />
              </div>
              {onStudentLogout && studentSession.status !== 'active' && (
                <button
                  onClick={onStudentLogout}
                  title="Ganti Peserta"
                  className="p-1.5 rounded-lg bg-[#054c2c] hover:bg-[#033720] border border-emerald-700 text-emerald-100 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAdmin}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#054c2c] hover:bg-[#033720] border border-emerald-700/80 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Shield className="w-3.5 h-3.5 text-amber-300" />
                <span>Login Admin</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
