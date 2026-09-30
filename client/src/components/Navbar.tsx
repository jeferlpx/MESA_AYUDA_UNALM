import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfileModal } from './UserProfileModal';
import { LogOut, User as UserIcon, HelpCircle, Layers, Bell } from 'lucide-react';
import { getAssetUrl } from '../services/api';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { user, logout } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-unalm-600 text-white shadow-md border-b border-unalm-700 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Institution Info */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center shadow-md border border-white/20">
                <img
                  src="./escudo-color.png"
                  alt="Escudo UNALM"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-bold text-lg tracking-wide text-white block leading-tight">
                  MESA DE AYUDA <span className="text-unalm-300 font-normal">OTIC</span>
                </span>
                <span className="text-xs text-unalm-200 block font-light">
                  Universidad Nacional Agraria La Molina
                </span>
              </div>
            </div>

            {/* User Status & Controls */}
            {user && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center space-x-3 p-1.5 rounded-2xl hover:bg-unalm-700/80 transition-colors text-left group"
                  title="Ver y editar mi perfil / foto"
                >
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-sm font-bold text-white group-hover:text-amber-200 transition-colors">
                      {user.nombres} {user.apellidos}
                    </span>
                    <span className="text-[11px] text-unalm-200">
                      {user.facultadDependencia} •{' '}
                      <span className="uppercase font-extrabold text-amber-300">
                        {user.rol === 'MESA_AYUDA' ? 'MESA DE AYUDA' : user.rol}
                      </span>
                    </span>
                  </div>

                  <div className="relative">
                    {user.fotoPerfil ? (
                      <img
                        src={getAssetUrl(user.fotoPerfil)}
                        alt={user.nombres}
                        className="w-9 h-9 rounded-full object-cover border-2 border-amber-300 shadow"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-unalm-800 border-2 border-unalm-400 flex items-center justify-center text-white font-bold text-xs shadow">
                        {user.nombres?.slice(0, 2).toUpperCase() || 'US'}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-unalm-600" />
                  </div>
                </button>

                <button
                  onClick={logout}
                  title="Cerrar Sesión"
                  className="p-2 rounded-xl bg-unalm-700 hover:bg-red-700 text-white transition-colors duration-150 border border-white/10 flex items-center space-x-1 text-xs font-medium shadow-xs"
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
