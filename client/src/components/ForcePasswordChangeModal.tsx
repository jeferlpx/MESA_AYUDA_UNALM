import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { User } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { SearchableDependenciaSelect } from './SearchableDependenciaSelect';
import { validatePeruvianPhone, handlePhoneInputChange } from '../utils/phoneValidator';
import {
  ShieldAlert,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ArrowRight,
  Building2,
  Phone,
  HelpCircle,
} from 'lucide-react';

interface ForcePasswordChangeModalProps {
  user: User;
  onSuccess: (updatedUser: User) => void;
}

export const ForcePasswordChangeModal: React.FC<ForcePasswordChangeModalProps> = ({
  user,
  onSuccess,
}) => {
  const { logout } = useAuth();
  const toast = useToast();

  const isPasswordRequired = Boolean(user.debeCambiarPassword);
  const isEmailRequired = Boolean(user.correoPendiente);
  const isDependenciaRequired =
    !user.facultadDependencia ||
    user.facultadDependencia.trim() === '' ||
    user.facultadDependencia.includes('#N/D');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [facultadDependencia, setFacultadDependencia] = useState(
    isDependenciaRequired ? '' : user.facultadDependencia || ''
  );
  const [telefono, setTelefono] = useState(user.telefono || '');
  const [anexo, setAnexo] = useState(user.anexo || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const phoneValidation = useMemo(
    () => validatePeruvianPhone(telefono, false),
    [telefono]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isPasswordRequired) {
      if (newPassword.length < 6) {
        setErrorMsg('La nueva contraseña debe tener al menos 6 caracteres.');
        return;
      }

      if (newPassword === '123456') {
        setErrorMsg('Por su seguridad, no puede volver a usar la contraseña temporal "123456".');
        return;
      }

      if (newPassword !== confirmPassword) {
        setErrorMsg('Las contraseñas no coinciden. Por favor verifique nuevamente.');
        return;
      }
    }

    if (isEmailRequired) {
      const cleanEmail = newEmail.toLowerCase().trim();
      if (!cleanEmail) {
        setErrorMsg('Debe registrar su correo institucional oficial (@lamolina.edu.pe).');
        return;
      }
      if (!cleanEmail.endsWith('@lamolina.edu.pe')) {
        setErrorMsg('El correo debe pertenecer estrictamente al dominio institucional @lamolina.edu.pe');
        return;
      }
    }

    if (isDependenciaRequired) {
      const cleanDep = facultadDependencia.trim();
      if (!cleanDep || cleanDep === '#N/D' || cleanDep.includes('#N/D')) {
        setErrorMsg('Debe seleccionar su centro de labores, facultad o dependencia UNALM de la lista.');
        return;
      }
    }

    if (telefono.trim().length > 0 && !phoneValidation.isValid) {
      setErrorMsg(`Número de celular no válido: ${phoneValidation.error}`);
      return;
    }

    setLoading(true);
    try {
      const res = await api.completeFirstLogin({
        newPassword: isPasswordRequired ? newPassword : undefined,
        newEmail: isEmailRequired ? newEmail.toLowerCase().trim() : undefined,
        facultadDependencia: isDependenciaRequired ? facultadDependencia.trim() : (facultadDependencia.trim() || undefined),
        telefono: phoneValidation.cleanNumber || undefined,
        anexo: anexo.trim() || undefined,
      });

      if (res.success && res.data?.user) {
        if (res.data.token) {
          localStorage.setItem('otic_token', res.data.token);
        }
        toast.success(
          'Sus datos y credenciales han sido actualizados correctamente.',
          '¡Bienvenido a la Mesa de Ayuda!'
        );
        onSuccess(res.data.user);
      } else {
        throw new Error(res.message || 'Error al actualizar credenciales.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo actualizar la información. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
    >
      <div className="relative w-full max-w-3xl max-h-[94vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl shadow-emerald-950/50 overflow-hidden">
        {/* Decorative ambient gradient */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-unalm-500 to-emerald-400 shrink-0" />
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-unalm-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-13 h-13 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 mb-1.5">
                {isPasswordRequired ? 'Seguridad Requerida • Primer Inicio' : 'Actualización Requerida • Padrón UNALM'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {isPasswordRequired ? 'Actualice su Contraseña' : 'Complete sus Datos de Perfil'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Estimado(a) <strong className="text-emerald-300 font-extrabold">{user.nombres} {user.apellidos}</strong>, por políticas de la UNALM, complete la siguiente información para acceder al sistema.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-5 p-4 bg-rose-950/60 border border-rose-600 rounded-2xl text-xs sm:text-sm text-rose-200 flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Special notice if dependencia is missing (#N/D) */}
            {isDependenciaRequired && (
              <div className="p-4 sm:p-5 bg-amber-950/50 border border-amber-500/70 rounded-3xl text-xs sm:text-sm text-amber-100 space-y-3">
                <div className="flex items-center space-x-2.5 font-extrabold text-amber-300 text-sm sm:text-base">
                  <Building2 className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>Ubicación de Centro de Labores Requerida (#N/D)</span>
                </div>
                <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
                  Su registro en el padrón no cuenta con una dependencia asignada. Por favor, ingrese su ubicación de centro de labores, dependencia, área o facultad en el recuadro con buscador para registrar su ubicación oficial de trabajo:
                </p>
                <div className="pt-1">
                  <SearchableDependenciaSelect
                    value={facultadDependencia}
                    onChange={(val) => {
                      setFacultadDependencia(val);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    label="Facultad o Dependencia UNALM"
                    placeholder="Escriba su facultad, dirección, departamento o área..."
                    required={true}
                    theme="dark"
                  />
                </div>
              </div>
            )}

            {/* Special notice if email is missing */}
            {isEmailRequired && (
              <div className="p-4 sm:p-5 bg-amber-950/50 border border-amber-500/70 rounded-3xl text-xs sm:text-sm text-amber-100 space-y-3">
                <div className="flex items-center space-x-2.5 font-extrabold text-amber-300 text-sm sm:text-base">
                  <Mail className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>Correo Institucional Requerido (#N/D)</span>
                </div>
                <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
                  Por favor ingrese su correo institucional oficial de la UNALM (@lamolina.edu.pe) para asociarlo a su cuenta y recibir notificaciones de sus tickets:
                </p>
                <div className="relative rounded-2xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="ejemplo@lamolina.edu.pe"
                    className="block w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-unalm-500 font-semibold"
                  />
                </div>
              </div>
            )}

            {/* Password Fields */}
            {isPasswordRequired && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5">
                      Nueva Contraseña *
                    </label>
                    <div className="relative rounded-2xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="block w-full pl-12 pr-11 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-unalm-500 font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5">
                      Confirmar Nueva Contraseña *
                    </label>
                    <div className="relative rounded-2xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita la nueva contraseña"
                        className="block w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-unalm-500 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Password security checks */}
                <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800 text-xs sm:text-sm flex flex-wrap gap-4 text-slate-300">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2
                      className={`w-4 h-4 ${
                        newPassword.length >= 6 ? 'text-emerald-400' : 'text-slate-600'
                      }`}
                    />
                    <span className={newPassword.length >= 6 ? 'text-emerald-300 font-bold' : ''}>
                      Mínimo 6 caracteres
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2
                      className={`w-4 h-4 ${
                        newPassword && newPassword === confirmPassword
                          ? 'text-emerald-400'
                          : 'text-slate-600'
                      }`}
                    />
                    <span
                      className={
                        newPassword && newPassword === confirmPassword
                          ? 'text-emerald-300 font-bold'
                          : ''
                      }
                    >
                      Las contraseñas coinciden
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Optional Contact Details (Celular & Anexo) */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-extrabold text-slate-200 flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Datos de Contacto Directo</span>
                </span>
                <span className="text-xs text-slate-300 font-bold bg-slate-800 px-3 py-1 rounded-full">
                  Opcional en este paso
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Puede añadir su celular y anexo ahora, o el sistema se lo solicitará obligatoriamente al crear su primer requerimiento.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-slate-200">
                      Celular
                    </label>
                    <span className="text-xs text-slate-400">9 dígitos (MTC)</span>
                  </div>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(handlePhoneInputChange(e.target.value))}
                    placeholder="Ej: 998 877 665"
                    maxLength={11}
                    className={`block w-full px-4 py-3 bg-slate-950 border rounded-2xl text-white text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:ring-2 font-semibold ${
                      telefono.trim().length === 0
                        ? 'border-slate-700 focus:ring-unalm-500'
                        : phoneValidation.isValid
                        ? 'border-emerald-500 text-emerald-300'
                        : 'border-rose-500 text-rose-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5">
                    Anexo Telefónico
                  </label>
                  <input
                    type="text"
                    value={anexo}
                    onChange={(e) => setAnexo(e.target.value)}
                    placeholder="Ej: 234 o S/A"
                    className="block w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-unalm-500 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-between space-x-4 border-t border-slate-800">
              <button
                type="button"
                onClick={logout}
                className="px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center space-x-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 px-6 bg-gradient-to-r from-unalm-600 to-emerald-600 hover:from-unalm-500 hover:to-emerald-500 text-white rounded-2xl text-sm sm:text-base font-black shadow-xl shadow-unalm-900/50 transition-all flex items-center justify-center space-x-2.5 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Guardando...</span>
                ) : (
                  <>
                    <span>Guardar y Acceder al Sistema</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
