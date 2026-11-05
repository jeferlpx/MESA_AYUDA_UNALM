import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserProfileModal } from './UserProfileModal';
import { LogOut, Sun, Moon, Menu } from 'lucide-react';
import { getAssetUrl } from '../services/api';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

const ROLE_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  ADMIN: { label: 'Admin', badgeClass: 'bg-amber-400/25 text-amber-200 border-amber-300/40 shadow-xs' },
  SUPERVISOR: { label: 'Supervisor OTIC', badgeClass: 'bg-purple-400/25 text-purple-200 border-purple-300/40 shadow-xs' },
  MESA_AYUDA: { label: 'Mesa de Ayuda', badgeClass: 'bg-cyan-400/25 text-cyan-200 border-cyan-300/40 shadow-xs' },
  TECNICO: { label: 'Soporte Técnico', badgeClass: 'bg-emerald-400/25 text-emerald-200 border-emerald-300/40 shadow-xs' },
  ESPECIALISTA_REDES: { label: 'Redes y Telecom', badgeClass: 'bg-blue-400/25 text-blue-200 border-blue-300/40 shadow-xs' },
  ESPECIALISTA_DESARROLLO: { label: 'Desarrollo TI', badgeClass: 'bg-indigo-400/25 text-indigo-200 border-indigo-300/40 shadow-xs' },
  SUPERVISOR_SG: { label: 'Supervisor SG', badgeClass: 'bg-teal-400/25 text-teal-200 border-teal-300/40 shadow-xs' },
  MESA_AYUDA_SG: { label: 'Mesa SG', badgeClass: 'bg-sky-400/25 text-sky-200 border-sky-300/40 shadow-xs' },
  TECNICO_SG: { label: 'Técnico SG', badgeClass: 'bg-teal-400/25 text-teal-200 border-teal-300/40 shadow-xs' },
  SOLICITANTE: { label: 'Solicitante', badgeClass: 'bg-slate-400/25 text-slate-200 border-slate-300/40 shadow-xs' },
};

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const activeRoles = user?.roles && user.roles.length > 0 ? user.roles : (user?.rol ? [user.rol] : []);

  return (
    <>
      <header className="sticky top-0 z-30 w-full max-w-full bg-unalm-600/95 dark:bg-slate-900/95 backdrop-blur-md text-white shadow-md border-b border-unalm-700/80 dark:border-slate-800 print:hidden transition-colors duration-200 overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Mobile Menu Hamburger Button & Brand Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3.5 min-w-0 mr-1 sm:mr-3">
              {user && (
                <button
                  type="button"
                  onClick={onToggleMobileMenu}
                  className="p-1.5 sm:p-2 rounded-xl bg-white/10 dark:bg-slate-800 hover:bg-white/20 dark:hover:bg-slate-700 text-white transition-all active:scale-95 md:hidden focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shrink-0"
                  title="Abrir menú de módulos"
                  aria-label="Abrir menú de navegación"
                >
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white escudo-white-bg p-1 sm:p-1.5 flex items-center justify-center shadow-md border border-white/30 shrink-0 transition-transform hover:scale-105 duration-200">
                <img
                  src="./escudo-color.png"
                  alt="Escudo UNALM"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-sm sm:text-lg tracking-tight text-white block leading-tight truncate">
                  MESA DE AYUDA <span className="text-unalm-300 dark:text-emerald-400 font-semibold">OTIC</span>
                </span>
                <span className="text-[9px] sm:text-xs text-unalm-200/90 dark:text-slate-400 block font-normal tracking-wide truncate max-w-[130px] sm:max-w-none">
                  Universidad Nacional Agraria La Molina
                </span>
              </div>
            </div>

            {/* User Status & Controls */}
            {user && (
              <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0 ml-auto">
                {/* Botón de Modo Oscuro / Modo Claro - SIEMPRE VISIBLE */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  title={isDark ? 'Cambiar a Modo Claro (Día)' : 'Cambiar a Modo Oscuro (Noche)'}
                  aria-label="Alternar tema visual"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/10 dark:bg-slate-800/80 hover:bg-white/20 dark:hover:bg-slate-700 text-amber-200 dark:text-amber-300 transition-all duration-200 border border-white/10 dark:border-slate-700/60 shadow-xs active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-amber-300 transition-transform hover:rotate-45" />
                  ) : (
                    <Moon className="w-4 h-4 text-amber-200 transition-transform hover:-rotate-12" />
                  )}
                </button>

                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center space-x-2 sm:space-x-3 p-1 sm:p-1.5 sm:pr-2.5 rounded-2xl hover:bg-white/10 dark:hover:bg-slate-800/80 transition-all duration-200 text-left group cursor-pointer border border-transparent hover:border-white/10 shrink-0"
                  title="Ver y editar mi perfil / foto"
                >
                  <div className="hidden md:flex flex-col text-right items-end justify-center">
                    <div className="flex items-center space-x-1.5 justify-end">
                      <span className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-200 transition-colors">
                        {user.nombres} {user.apellidos}
                      </span>
                      <div className="flex items-center space-x-1">
                        {activeRoles.map((r) => {
                          const conf = ROLE_CONFIG[r] || { label: r, badgeClass: 'bg-white/10 text-white border-white/20' };
                          return (
                            <span
                              key={r}
                              className={`px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wide border uppercase ${conf.badgeClass}`}
                              title={`Rol asignado: ${conf.label}`}
                            >
                              {conf.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <span
                      className="text-[10px] text-emerald-200/90 dark:text-slate-400 truncate max-w-[260px] lg:max-w-[360px] block"
                      title={user.facultadDependencia || 'Universidad Nacional Agraria La Molina'}
                    >
                      {user.facultadDependencia || 'Comunidad Universitaria UNALM'}
                    </span>
                  </div>

                  <div className="relative shrink-0">
                    {user.fotoPerfil ? (
                      <img
                        src={getAssetUrl(user.fotoPerfil)}
                        alt={user.nombres}
                        className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-amber-300 shadow-md group-hover:ring-2 group-hover:ring-amber-300/50 transition-all shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-unalm-800 dark:bg-slate-800 border-2 border-unalm-400 dark:border-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-md group-hover:ring-2 group-hover:ring-emerald-400/50 transition-all shrink-0">
                        {user.nombres?.slice(0, 2).toUpperCase() || 'US'}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400 border-2 border-unalm-600 dark:border-slate-900 shadow-xs animate-pulse" />
                  </div>
                </button>

                <button
                  onClick={logout}
                  title="Cerrar Sesión"
                  className="p-1.5 sm:px-3 sm:py-2 rounded-xl bg-white/10 dark:bg-slate-800/80 hover:bg-rose-600 dark:hover:bg-rose-600 text-white transition-all duration-200 border border-white/10 dark:border-slate-700/60 flex items-center justify-center space-x-1.5 text-xs font-semibold shadow-xs active:scale-95 cursor-pointer shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};
