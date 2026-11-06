import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { SearchableDependenciaSelect } from '../components/SearchableDependenciaSelect';
import { VideoTutorialModal } from '../components/VideoTutorialModal';
import type { User as UserType } from '../types';
import {
  Lock,
  AlertCircle,
  ArrowRight,
  User,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  Network,
  UserPlus,
  Mail,
  Phone,
  PhoneCall,
  Briefcase,
  Send,
  Building2,
  Check,
  BookOpen,
  Play,
  FileText,
  Film,
  Sun,
  Moon,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithLdap, completeLogin } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  // Background Image State
  const [selectedBg] = useState<'1.jpeg' | '2.JPG' | '3.JPG'>(() => {
    return (localStorage.getItem('unalm_campus_bg') as any) || '1.jpeg';
  });

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loadingLdap, setLoadingLdap] = useState(false);

  // Experiencia de Bienvenida / Splash Armonioso
  const [welcomeUser, setWelcomeUser] = useState<UserType | null>(null);
  const [isWelcomeFading, setIsWelcomeFading] = useState(false);

  // Register Form State (Solicitud de Usuario en Directorio Activo)
  const [regNombreCompleto, setRegNombreCompleto] = useState('');
  const [regDni, setRegDni] = useState('');
  const [regCondicion, setRegCondicion] = useState('CAS');
  const [regEmail, setRegEmail] = useState('');
  const [regDependencia, setRegDependencia] = useState('');
  const [regCelular, setRegCelular] = useState('');
  const [regAnexo, setRegAnexo] = useState('');
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [registerSuccessData, setRegisterSuccessData] = useState<any | null>(null);

  // Modals de Inducción (Video Tutorial)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Tooltip active states
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const handleLdapLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanIdentifier = email.trim();
    if (!cleanIdentifier) {
      setError('Por favor ingrese su usuario de red institucional (ej: agarcia o agarcia@lamolina.edu.pe)');
      return;
    }

    if (!password) {
      setError('Por favor ingrese la contraseña de su cuenta de dominio institucional');
      return;
    }

    setLoadingLdap(true);
    try {
      // Pasamos deferSetUser = true para activar el splash de bienvenida armónico
      const authenticatedUser = await loginWithLdap(cleanIdentifier, password, true);
      if (authenticatedUser) {
        setWelcomeUser(authenticatedUser);
        // Transición placentera de bienvenida antes de entrar al portal
        setTimeout(() => {
          setIsWelcomeFading(true);
          setTimeout(() => {
            completeLogin(authenticatedUser);
          }, 350);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Error en la autenticación con Directorio Activo (LDAP)');
    } finally {
      setLoadingLdap(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regNombreCompleto.trim()) {
      setError('Por favor ingrese sus nombres y apellidos completos.');
      return;
    }

    const cleanDni = regDni.trim().replace(/\D/g, '');
    if (cleanDni.length !== 8) {
      setError('El DNI debe contener exactamente 8 dígitos numéricos.');
      return;
    }

    if (!regEmail.trim() || !regEmail.includes('@')) {
      setError('Por favor ingrese un correo válido de contacto o institucional.');
      return;
    }

    if (!regDependencia.trim()) {
      setError('Por favor seleccione o ingrese su facultad, dependencia o unidad orgánica.');
      return;
    }

    const cleanCelular = regCelular.trim().replace(/\D/g, '');
    if (cleanCelular.length < 9) {
      setError('Por favor ingrese un número de celular válido de 9 dígitos.');
      return;
    }

    setLoadingRegister(true);
    try {
      const payload = {
        nombreCompleto: regNombreCompleto.trim(),
        dni: cleanDni,
        condicion: regCondicion.trim(),
        email: regEmail.trim().toLowerCase(),
        facultadDependencia: regDependencia.trim(),
        celular: cleanCelular,
        anexo: regAnexo.trim() || undefined,
      };

      const res = await api.solicitarCuenta(payload);
      if (res.success) {
        setRegisterSuccessData(payload);
      } else {
        setError(res.message || 'No se pudo enviar la solicitud de registro.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión al enviar la solicitud de registro.');
    } finally {
      setLoadingRegister(false);
    }
  };

  const resetRegisterForm = () => {
    setRegNombreCompleto('');
    setRegDni('');
    setRegCondicion('CAS');
    setRegEmail('');
    setRegDependencia('');
    setRegCelular('');
    setRegAnexo('');
    setRegisterSuccessData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center py-6 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Background Image Layer */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 transform scale-[1.02]"
        style={{
          backgroundImage: `url('img/${selectedBg}')`,
        }}
      />

      {/* Modern Frosted Scrim & Contrast Gradient Overlay */}
      <div className="fixed inset-0 bg-gradient-to-tr from-slate-950/95 via-slate-950/85 to-emerald-950/80 backdrop-blur-[2.5px] pointer-events-none" />

      {/* Background Ambient Glows */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-unalm-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Botón de Modo Oscuro / Claro en Pantalla de Login */}
      <div className="fixed top-3 sm:top-5 right-3 sm:right-6 z-40">
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? 'Cambiar a Modo Claro (Día)' : 'Cambiar a Modo Oscuro (Noche)'}
          aria-label="Alternar tema visual"
          className="p-2 sm:p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-slate-700/80 shadow-lg shadow-black/40 backdrop-blur-md transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center group"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-300 transition-transform group-hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-amber-200 transition-transform group-hover:-rotate-12" />
          )}
        </button>
      </div>

      <div className={`sm:mx-auto w-full ${authMode === 'register' ? 'sm:max-w-xl' : 'sm:max-w-md'} transition-all duration-300 relative z-20 px-4 sm:px-0`}>
        {/* Brand Header with Institutional Shield */}
        <div className="flex flex-col items-center text-center space-y-2 mb-3">
          <div className="relative group flex items-center justify-center py-1">
            {/* Ambient luminous glow conforming to shield contours */}
            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full scale-125 pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-70" />
            <img
              src="/escudo-color.png"
              alt="Escudo Oficial UNALM"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain relative z-10 transition-all duration-300 transform group-hover:scale-105 animate-shield-glow cursor-pointer"
            />
          </div>

          <div className="space-y-0.5 pt-1">
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center space-x-1.5">
              <span>Mesa de Ayuda</span>
              <span className="bg-gradient-to-r from-unalm-400 to-emerald-400 bg-clip-text text-transparent">
                UNALM
              </span>
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
              Soporte de servicios tecnológicos y servicios generales y mantenimiento
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/95 border border-slate-800/90 backdrop-blur-xl py-6 px-5 sm:px-8 shadow-2xl rounded-3xl relative z-30">
          {/* Pestañas de Navegación: Iniciar Sesión / Registrarme */}
          <div className="flex items-center p-1 bg-slate-950/80 rounded-2xl border border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-blue-900/30 font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                authMode === 'register'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30 font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Registrarme</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800/80 flex items-start space-x-3 text-rose-200 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 flex items-start space-x-3 text-emerald-200 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* =============================================================== */}
          {/* MODO 1: INICIAR SESIÓN CON DIRECTORIO ACTIVO (LDAP)             */}
          {/* =============================================================== */}
          {authMode === 'login' && (
            <form className="space-y-4" onSubmit={handleLdapLoginSubmit}>
              {/* Institutional Email or Name Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Usuario de Dominio o Correo Institucional *
                  </label>
                  <div
                    className="relative flex items-center cursor-help text-slate-400 hover:text-slate-200"
                    onMouseEnter={() => setActiveTooltip('email-login')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {activeTooltip === 'email-login' && (
                      <div className="absolute right-0 bottom-full mb-1.5 w-64 p-2.5 bg-slate-950 text-slate-200 text-[11px] rounded-xl border border-slate-700 shadow-xl z-50 animate-in fade-in">
                        Ingrese su usuario de red institucional (ej: <strong className="text-sky-300">agarcia</strong>) o su correo <strong className="text-unalm-300">@lamolina.edu.pe</strong>.
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ej: usuario o usuario@lamolina.edu.pe"
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Contraseña de Red Institucional *
                  </label>
                  <div
                    className="relative flex items-center cursor-help text-slate-400 hover:text-slate-200"
                    onMouseEnter={() => setActiveTooltip('pass-login')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {activeTooltip === 'pass-login' && (
                      <div className="absolute right-0 bottom-full mb-1.5 w-56 p-2.5 bg-slate-950 text-slate-200 text-[11px] rounded-xl border border-slate-700 shadow-xl z-50 animate-in fade-in">
                        Contraseña con la que inicia sesión en las computadoras o servicios de red de la UNALM.
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Botón Principal: Acceso con Directorio Activo */}
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={loadingLdap}
                  className="w-full relative group overflow-hidden rounded-2xl p-3 sm:p-3.5 text-white font-bold transition-all duration-200 cursor-pointer shadow-xl border border-sky-400/50 hover:border-sky-300 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-600 shadow-sky-950/70 hover:shadow-sky-500/25 active:scale-[0.99] disabled:opacity-50"
                  title="Ingreso institucional validando con el Controlador de Dominio de lamolina.edu.pe"
                >
                  <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />

                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-left">
                      <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform shrink-0">
                        <Network className="w-5 h-5 text-sky-200" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs sm:text-sm font-extrabold tracking-tight">Ingresar con Directorio Activo</span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-400/25 text-emerald-200 border border-emerald-300/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                            EN LÍNEA
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-sky-100 font-medium leading-tight">
                          Acceso institucional @lamolina.edu.pe
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center pl-2 text-white shrink-0">
                      {loadingLdap ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-all">
                          <ArrowRight className="w-4 h-4 text-sky-100 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* Enlace alternativo a Registrarme */}
                <div className="text-center pt-2 border-t border-slate-800 space-y-2">
                  <p className="text-xs text-slate-400">
                    ¿No cuentas con usuario o acceso en el Directorio Activo?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setError(null);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-4 cursor-pointer ml-1"
                    >
                      Solicita tu registro aquí
                    </button>
                  </p>

                  <div className="flex items-center justify-center space-x-3 text-[11px] text-slate-400 pt-0.5">
                    <a
                      href="/manual/manual_mda.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-sky-300 font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                      title="Abrir Manual de Usuario en nueva pestaña"
                    >
                      <BookOpen className="w-3 h-3 text-sky-400" />
                      <span>Manual PDF</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                    </a>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => setIsVideoModalOpen(true)}
                      className="hover:text-emerald-300 font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                      <span>Video Tutorial</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* =============================================================== */}
          {/* MODO 2: FORMULARIO DE REGISTRO / SOLICITUD DE CUENTA AD         */}
          {/* =============================================================== */}
          {authMode === 'register' && (
            <div>
              {registerSuccessData ? (
                /* Pantalla de Confirmación Exitosa */
                <div className="py-4 text-center space-y-4 animate-in fade-in duration-300">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto flex items-center justify-center shadow-lg shadow-emerald-950/50">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white">
                      ¡Solicitud de Registro Enviada con Éxito!
                    </h3>
                    <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                      Se ha remitido tu ficha formal de registro al Área de{' '}
                      <strong className="text-emerald-400">Redes y Telecomunicaciones (redes@lamolina.edu.pe)</strong>{' '}
                      para la creación de tu cuenta en el Directorio Activo de la UNALM.
                    </p>
                  </div>

                  {/* Resumen de Datos Enviados */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-left text-xs space-y-2 font-mono">
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400 font-sans">Solicitante:</span>
                      <span className="text-white font-bold">{registerSuccessData.nombreCompleto}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400 font-sans">DNI:</span>
                      <span className="text-sky-300 font-bold">{registerSuccessData.dni}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400 font-sans">Condición:</span>
                      <span className="text-amber-300 font-bold">{registerSuccessData.condicion}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400 font-sans">Correo:</span>
                      <span className="text-emerald-300">{registerSuccessData.email}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400 font-sans">Dependencia:</span>
                      <span className="text-slate-200 truncate max-w-[200px]" title={registerSuccessData.facultadDependencia}>
                        {registerSuccessData.facultadDependencia}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Celular:</span>
                      <span className="text-slate-200">{registerSuccessData.celular}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl text-left text-[11px] text-blue-200 space-y-1">
                    <p className="font-bold">✉️ Notificación enviada a redes@lamolina.edu.pe:</p>
                    <p className="text-slate-300">
                      El Área de Redes procesará la creación de tu usuario institucional y te notificará tus credenciales a tu correo para que puedas ingresar de inmediato a la Mesa de Ayuda.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetRegisterForm();
                        setAuthMode('login');
                      }}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                    >
                      Ir a Iniciar Sesión
                    </button>
                    <button
                      type="button"
                      onClick={resetRegisterForm}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Nueva Solicitud
                    </button>
                  </div>
                </div>
              ) : (
                /* Formulario de Solicitud de Registro */
                <form className="space-y-3.5" onSubmit={handleRegisterSubmit}>
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl flex items-start space-x-3 text-xs text-emerald-200 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-[12px]">Solicitud de Registro en Directorio Activo</p>
                      <p className="text-[11px] text-emerald-300 leading-snug mt-0.5">
                        Completa tus datos. Se enviará un aviso formal a <strong className="text-white">redes@lamolina.edu.pe</strong> para la creación de tu cuenta institucional.
                      </p>
                    </div>
                  </div>

                  {/* 1. Nombre y Apellidos Completo en un solo campo */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nombres y Apellidos Completos *
                    </label>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={regNombreCompleto}
                        onChange={(e) => setRegNombreCompleto(e.target.value)}
                        placeholder="Ej: Juan Carlos Pérez Gómez"
                        className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* 2. DNI y Condición de Contrato (en 2 columnas) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        DNI (Documento de Identidad) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={8}
                        value={regDni}
                        onChange={(e) => setRegDni(e.target.value.replace(/\D/g, ''))}
                        placeholder="8 dígitos numéricos"
                        className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Condición de Contrato / Vínculo *
                      </label>
                      <select
                        value={regCondicion}
                        onChange={(e) => setRegCondicion(e.target.value)}
                        className="block w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold cursor-pointer"
                      >
                        <option value="Locador de Servicios">Locador de Servicios</option>
                        <option value="FDA (Fundación para el Desarrollo Agrario)">FDA (Fundación para el Desarrollo Agrario)</option>
                        <option value="CAS (Contrato Administrativo de Servicios)">CAS (Contrato Adm. de Servicios)</option>
                        <option value="Nombrado (Personal Nombrado)">Nombrado (Personal Nombrado)</option>
                        <option value="Contratado (Personal Contratado)">Contratado (Personal Contratado)</option>
                        <option value="Docente (Docente Ordinario / Contratado)">Docente (Ordinario / Contratado)</option>
                        <option value="Alumno (Pregrado / Posgrado)">Alumno (Pregrado / Posgrado)</option>
                        <option value="Practicante (Preprofesional / Profesional)">Practicante (Pre/Profesional)</option>
                        <option value="Personal Externo / Proyecto Especial">Personal Externo / Proyecto</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  {/* 3. Correo Institucional UNALM */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Correo Institucional UNALM (o correo de contacto) *
                    </label>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="ej: usuario@lamolina.edu.pe"
                        className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      A esta dirección se enviará la confirmación y las credenciales generadas por Redes.
                    </p>
                  </div>

                  {/* 4. Facultad, Dependencia o Unidad Orgánica */}
                  <div>
                    <SearchableDependenciaSelect
                      value={regDependencia}
                      onChange={setRegDependencia}
                      label="Facultad, Dependencia o Unidad Orgánica *"
                      theme="dark"
                      placeholder="Buscar facultad, oficina, dirección o departamento..."
                      required
                    />
                  </div>

                  {/* 5. Celular y Anexo Telefónico (en 2 columnas) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Celular de Contacto *
                      </label>
                      <div className="relative rounded-xl shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="tel"
                          required
                          maxLength={11}
                          value={regCelular}
                          onChange={(e) => setRegCelular(e.target.value)}
                          placeholder="9 dígitos (ej: 998 877 665)"
                          className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Anexo Telefónico (Opcional)
                      </label>
                      <div className="relative rounded-xl shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <PhoneCall className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          maxLength={6}
                          value={regAnexo}
                          onChange={(e) => setRegAnexo(e.target.value.replace(/\D/g, ''))}
                          placeholder="Ej: 123"
                          className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botón de Envío */}
                  <div className="space-y-3 pt-2">
                    <button
                      type="submit"
                      disabled={loadingRegister}
                      className="w-full relative group overflow-hidden rounded-2xl p-3 sm:p-3.5 text-white font-bold transition-all duration-200 cursor-pointer shadow-xl border border-emerald-400/50 hover:border-emerald-300 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 hover:from-emerald-500 hover:via-teal-500 hover:to-green-600 shadow-emerald-950/70 hover:shadow-emerald-500/25 active:scale-[0.99] disabled:opacity-50"
                    >
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center space-x-3 text-left">
                          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform shrink-0">
                            <Send className="w-5 h-5 text-emerald-200" />
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm font-extrabold tracking-tight block">
                              Enviar Solicitud a Redes OTIC
                            </span>
                            <p className="text-[10px] sm:text-[11px] text-emerald-100 font-medium leading-tight">
                              Destino formal: redes@lamolina.edu.pe
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center pl-2 text-white shrink-0">
                          {loadingRegister ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-all">
                              <ArrowRight className="w-4 h-4 text-emerald-100 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          )}
                        </div>
                      </div>
                    </button>

                    <div className="text-center pt-1 border-t border-slate-800">
                      <p className="text-xs text-slate-400">
                        ¿Ya tienes una cuenta activa de red institucional?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('login');
                            setError(null);
                          }}
                          className="text-sky-400 hover:text-sky-300 font-bold underline underline-offset-4 cursor-pointer ml-1"
                        >
                          Inicia sesión aquí
                        </button>
                      </p>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Centro de Inducción & Recursos Multimedia */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 relative z-20">
          {/* Card 1: Manual de Usuario (PDF) - Apertura en nueva pestaña limpia */}
          <a
            href="/manual/manual_mda.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-900/90 border border-slate-800/80 hover:border-sky-500/50 shadow-lg shadow-black/25 backdrop-blur-md transition-all duration-200 text-left hover:scale-[1.01] cursor-pointer"
            title="Abrir Guía Oficial PDF en pestaña limpia"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/10 border border-sky-500/30 flex items-center justify-center shrink-0 mr-3 text-sky-400 group-hover:scale-105 group-hover:bg-sky-500/30 transition-all">
              <FileText className="w-5 h-5 text-sky-400 group-hover:text-sky-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Guía Oficial PDF
                </span>
                <span className="text-[9px] font-semibold text-sky-400 flex items-center space-x-0.5">
                  <span>Nueva pestaña</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </span>
              </div>
              <p className="text-xs font-bold text-slate-200 group-hover:text-white mt-0.5 truncate">
                Manual de Usuario
              </p>
              <p className="text-[10px] text-slate-400 leading-tight line-clamp-1">
                Visualizar paso a paso ilustrado
              </p>
            </div>
            <span className="ml-1 text-slate-500 group-hover:text-sky-400 transition-colors">
              <ArrowRight className="w-4 h-4" />
            </span>
          </a>

          {/* Card 2: Video Tutorial (HD) */}
          <button
            type="button"
            onClick={() => setIsVideoModalOpen(true)}
            className="group relative flex items-center p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-900/90 border border-slate-800/80 hover:border-emerald-500/50 shadow-lg shadow-black/25 backdrop-blur-md transition-all duration-200 text-left hover:scale-[1.01] cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mr-3 text-emerald-400 group-hover:scale-105 group-hover:bg-emerald-500/30 transition-all">
              <Play className="w-5 h-5 text-emerald-400 fill-emerald-400/80 group-hover:scale-105 transition-transform" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Tutorial HD</span>
                </span>
              </div>
              <p className="text-xs font-bold text-slate-200 group-hover:text-white mt-0.5 truncate">
                Video Tutorial
              </p>
              <p className="text-[10px] text-slate-400 leading-tight line-clamp-1">
                Aprende a usar el sistema en video
              </p>
            </div>
            <span className="ml-1 text-slate-500 group-hover:text-emerald-400 transition-colors">
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>

        {/* Clean Institutional Footer */}
        <p className="mt-4 pb-6 text-center text-[11px] text-slate-400/80 font-medium relative z-10">
          Universidad Nacional Agraria La Molina • Mesa de Ayuda Institucional
        </p>
      </div>

      {/* Experiencia de Bienvenida Armoniosa & Entrada Satisfactoria al Sistema */}
      {welcomeUser && (
        <div
          className={`fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 transition-all duration-350 ease-out ${
            isWelcomeFading
              ? 'opacity-0 scale-95 pointer-events-none'
              : 'opacity-100 scale-100 animate-in fade-in zoom-in-95'
          }`}
        >
          <div className="relative w-full max-w-md bg-slate-900/95 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(16,185,129,0.25)] text-center overflow-hidden">
            {/* Resplandor radial superior */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Escudo Oficial UNALM con brillo esmeralda armónico y contorno transparente */}
            <div className="relative py-2 flex items-center justify-center">
              <img
                src="/escudo-color.png"
                alt="Escudo UNALM"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain filter drop-shadow-[0_0_26px_rgba(16,185,129,0.95)] animate-shield-glow"
              />
            </div>

            {/* Chip de Éxito de Autenticación */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-bold tracking-wide mt-3 shadow-inner">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Autenticación Exitosa • Directorio Activo</span>
            </div>

            {/* Saludo Personalizado de Bienvenida */}
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-3">
              ¡Bienvenido(a)!
            </h2>
            <p className="text-base sm:text-lg font-extrabold text-emerald-400 mt-0.5 capitalize">
              {welcomeUser.nombres.toLowerCase()} {welcomeUser.apellidos.toLowerCase()}
            </p>

            {/* Dependencia & Rol */}
            <div className="mt-4 flex flex-col items-center gap-1.5">
              <div className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs font-medium max-w-full truncate shadow-xs">
                🏛️ {welcomeUser.facultadDependencia || 'Universidad Nacional Agraria La Molina'}
              </div>
              <div className="px-3 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[11px] font-bold">
                Rol: {welcomeUser.rolNombre || welcomeUser.rol}
              </div>
            </div>

            {/* Barra Armónica de Carga e Ingreso */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-400 animate-spin" />
                  <span>Iniciando su espacio de trabajo institucional...</span>
                </span>
                <span className="text-emerald-400 font-bold">Ingresando</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 rounded-full animate-progress-fill" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visor Modal de Video Tutorial de Uso (MP4 HD) */}
      <VideoTutorialModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />
    </div>
  );
};
