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

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-unalm-600/95 dark:bg-slate-900/95 backdrop-blur-md text-white shadow-md border-b border-unalm-700/80 dark:border-slate-800 print:hidden transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile Menu Hamburger Button & Brand Logo */}
            <div className="flex items-center space-x-2.5 sm:space-x-3.5">
              {user && (
                <button
                  type="button"
                  onClick={onToggleMobileMenu}
                  className="p-2 rounded-xl bg-white/10 dark:bg-slate-800 hover:bg-white/20 dark:hover:bg-slate-700 text-white transition-all active:scale-95 md:hidden focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                  title="Abrir menú de módulos"
                  aria-label="Abrir menú de navegación"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}

              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white escudo-white-bg p-1.5 flex items-center justify-center shadow-md border border-white/30 shrink-0 transition-transform hover:scale-105 duration-200">
                <img
                  src="./escudo-color.png"
                  alt="Escudo UNALM"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white block leading-tight">
                  MESA DE AYUDA <span className="text-unalm-300 dark:text-emerald-400 font-semibold">OTIC</span>
                </span>
                <span className="text-[10px] sm:text-xs text-unalm-200/90 dark:text-slate-400 block font-normal tracking-wide truncate max-w-[170px] sm:max-w-none">
                  Universidad Nacional Agraria La Molina
                </span>
              </div>
            </div>

            {/* User Status & Controls */}
            {user && (
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Botón de Modo Oscuro / Modo Claro */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  title={isDark ? 'Cambiar a Modo Claro (Día)' : 'Cambiar a Modo Oscuro (Noche)'}
                  aria-label="Alternar tema visual"
                  className="p-2 rounded-xl bg-white/10 dark:bg-slate-800/80 hover:bg-white/20 dark:hover:bg-slate-700 text-amber-200 dark:text-amber-300 transition-all duration-200 border border-white/10 dark:border-slate-700/60 shadow-xs active:scale-95 flex items-center justify-center cursor-pointer"
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-amber-300 transition-transform hover:rotate-45" />
                  ) : (
                    <Moon className="w-4 h-4 text-amber-200 transition-transform hover:-rotate-12" />
                  )}
                </button>

                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center space-x-2 sm:space-x-3 p-1 sm:p-1.5 pr-2.5 rounded-2xl hover:bg-white/10 dark:hover:bg-slate-800/80 transition-all duration-200 text-left group cursor-pointer border border-transparent hover:border-white/10"
                  title="Ver y editar mi perfil / foto"
                >
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-sm font-bold text-white group-hover:text-amber-200 transition-colors">
                      {user.nombres} {user.apellidos}
                    </span>
                    <span
                      className="text-[11px] text-unalm-200 dark:text-slate-400 truncate max-w-[260px] lg:max-w-[340px] block"
                      title={`${user.facultadDependencia || 'UNALM'} (${user.rol === 'MESA_AYUDA' ? 'MESA DE AYUDA' : user.rol})`}
                    >
                      {user.facultadDependencia || 'Comunidad Universitaria UNALM'} •{' '}
                      <span className="uppercase font-black text-amber-300">
                        {user.rol === 'MESA_AYUDA' ? 'MESA DE AYUDA' : user.rol}
                      </span>
                    </span>
                  </div>

                  <div className="relative shrink-0">
                    {user.fotoPerfil ? (
                      <img
                        src={getAssetUrl(user.fotoPerfil)}
                        alt={user.nombres}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-amber-300 shadow-md group-hover:ring-2 group-hover:ring-amber-300/50 transition-all"
                      />
                    ) : (
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-unalm-800 dark:bg-slate-800 border-2 border-unalm-400 dark:border-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-md group-hover:ring-2 group-hover:ring-emerald-400/50 transition-all">
                        {user.nombres?.slice(0, 2).toUpperCase() || 'US'}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-unalm-600 dark:border-slate-900 shadow-xs animate-pulse" />
                  </div>
                </button>

                <button
                  onClick={logout}
                  title="Cerrar Sesión"
                  className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/10 dark:bg-slate-800/80 hover:bg-rose-600 dark:hover:bg-rose-600 text-white transition-all duration-200 border border-white/10 dark:border-slate-700/60 flex items-center space-x-1.5 text-xs font-semibold shadow-xs active:scale-95 cursor-pointer"
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
