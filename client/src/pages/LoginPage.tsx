import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { validatePeruvianPhone, handlePhoneInputChange } from '../utils/phoneValidator';
import { SearchableDependenciaSelect } from '../components/SearchableDependenciaSelect';
import {
  Shield,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  User,
  Phone,
  Building2,
  CheckCircle2,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  HelpCircle,
  Sparkles,
  KeyRound,
  GraduationCap,
  Wrench,
  Laptop,
  Headphones,
  PhoneCall,
  Image as ImageIcon,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Background Image State (Configurado institucionalmente por Admin General)
  const [selectedBg] = useState<'1.jpeg' | '2.JPG' | '3.JPG'>(() => {
    return (localStorage.getItem('unalm_campus_bg') as any) || '1.jpeg';
  });

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Registration Form State
  const [regNombreCompleto, setRegNombreCompleto] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regTipoUsuario, setRegTipoUsuario] = useState<string>('Docente Nombrado');
  const [regDependencia, setRegDependencia] = useState('');
  const [regTelefono, setRegTelefono] = useState('');
  const [regAnexo, setRegAnexo] = useState('');

  const phoneValidation = useMemo(() => validatePeruvianPhone(regTelefono, true), [regTelefono]);

  // Tooltip active states
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regNombreCompleto.trim()) {
      setError('Por favor ingrese sus nombres y apellidos');
      return;
    }

    if (!regEmail.toLowerCase().endsWith('@lamolina.edu.pe')) {
      setError('El correo debe pertenecer al dominio institucional de la UNALM (@lamolina.edu.pe)');
      return;
    }

    if (!regDependencia.trim()) {
      setError('Por favor seleccione su Facultad, Departamento u Oficina según el organigrama');
      return;
    }

    if (!phoneValidation.isValid) {
      setError(phoneValidation.error || 'Por favor ingrese un número de celular válido de 9 dígitos');
      return;
    }

    if (!regAnexo.trim()) {
      setError('Por favor ingrese su Anexo telefónico (o escriba "Sin anexo" si no dispone)');
      return;
    }

    if (regPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifique nuevamente.');
      return;
    }

    setLoading(true);
    try {
      const dependenciaCompleta = `${regDependencia} (${regTipoUsuario})`;
      const parts = regNombreCompleto.trim().split(/\s+/);
      const nombresCalculados = parts.length > 2 ? parts.slice(0, 2).join(' ') : parts[0];
      const apellidosCalculados = parts.length > 2 ? parts.slice(2).join(' ') : (parts[1] || '-');

      const res = await api.register({
        nombreCompleto: regNombreCompleto.trim(),
        nombres: nombresCalculados,
        apellidos: apellidosCalculados,
        email: regEmail,
        password: regPassword,
        facultadDependencia: dependenciaCompleta,
        telefono: phoneValidation.cleanNumber,
        anexo: regAnexo,
      });

      if (res.success) {
        setSuccessMsg('¡Cuenta registrada exitosamente en el sistema! Iniciando sesión...');
        setTimeout(async () => {
          try {
            await login(regEmail, regPassword);
          } catch {
            setIsRegisterMode(false);
            setEmail(regEmail);
          }
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar el registro');
      setLoading(false);
    }
  };

  const fillTestCredentials = (userType: 'admin' | 'mesa_otic' | 'mesa_sg' | 'tecnico' | 'tecnico_sg' | 'solicitante') => {
    switch (userType) {
      case 'admin':
        setEmail('admin.otic@lamolina.edu.pe');
        setPassword('Unalm2026$');
        break;
      case 'mesa_otic':
        setEmail('soporte@lamolina.edu.pe');
        setPassword('mesa123');
        break;
      case 'mesa_sg':
        setEmail('mesa.sg@lamolina.edu.pe');
        setPassword('mesa123');
        break;
      case 'tecnico':
        setEmail('tecnico.redes@lamolina.edu.pe');
        setPassword('Unalm2026$');
        break;
      case 'tecnico_sg':
        setEmail('tecnico.electricidad@lamolina.edu.pe');
        setPassword('Unalm2026$');
        break;
      case 'solicitante':
        setEmail('20220145@lamolina.edu.pe');
        setPassword('Unalm2026$');
        break;
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center py-8 sm:px-6 lg:px-8 overflow-hidden font-sans">
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

      <div
        className={`sm:mx-auto w-full transition-all duration-300 relative z-10 px-4 sm:px-0 ${
          isRegisterMode ? 'sm:max-w-xl' : 'sm:max-w-md'
        }`}
      >
        {/* Brand Header with Institutional Shield */}
        <div className="flex flex-col items-center text-center space-y-2 mb-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-unalm-500 to-emerald-500 rounded-3xl blur-sm opacity-70 group-hover:opacity-100 transition duration-300" />
            <div className="w-20 h-20 rounded-2xl bg-white p-2 flex items-center justify-center shadow-2xl relative border border-white/40">
              <img
                src="./escudo-color.png"
                alt="Escudo UNALM"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="space-y-0.5 pt-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center space-x-1.5">
              <span>Mesa de Ayuda</span>
              <span className="bg-gradient-to-r from-unalm-400 to-emerald-400 bg-clip-text text-transparent">
                UNALM
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Soporte de servicios tecnológicos y servicios generales y mantenimiento
            </p>
          </div>
        </div>

        {/* Tab Toggle: Iniciar Sesión vs Registrarse */}
        <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-lg max-w-xs mx-auto mb-4 backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center space-x-1.5 cursor-pointer ${
              !isRegisterMode
                ? 'bg-gradient-to-r from-unalm-600 to-unalm-700 text-white shadow-md shadow-unalm-900/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Iniciar Sesión</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center space-x-1.5 cursor-pointer ${
              isRegisterMode
                ? 'bg-gradient-to-r from-unalm-600 to-unalm-700 text-white shadow-md shadow-unalm-900/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Crear Cuenta</span>
          </button>
        </div>

        {/* Main Form Card */}
        <div className="bg-slate-900/95 border border-slate-800/90 backdrop-blur-xl py-6 px-6 sm:px-8 shadow-2xl rounded-3xl relative">
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

          {!isRegisterMode ? (
            /* =========================================================================
               LOGIN FORM
               ========================================================================= */
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              {/* Institutional Email or Name Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Correo Institucional o Nombre Completo *
                  </label>
                  <div
                    className="relative flex items-center cursor-help text-slate-400 hover:text-slate-200"
                    onMouseEnter={() => setActiveTooltip('email-login')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {activeTooltip === 'email-login' && (
                      <div className="absolute right-0 bottom-full mb-1.5 w-64 p-2.5 bg-slate-950 text-slate-200 text-[11px] rounded-xl border border-slate-700 shadow-xl z-50 animate-in fade-in">
                        Ingrese su correo institucional <strong className="text-unalm-300">@lamolina.edu.pe</strong> o sus Nombres y Apellidos si aún no tiene correo asignado.
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@lamolina.edu.pe o Nombre y Apellido"
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-unalm-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Contraseña
                  </label>
                  <div
                    className="relative flex items-center cursor-help text-slate-400 hover:text-slate-200"
                    onMouseEnter={() => setActiveTooltip('pass-login')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {activeTooltip === 'pass-login' && (
                      <div className="absolute right-0 bottom-full mb-1.5 w-56 p-2.5 bg-slate-950 text-slate-200 text-[11px] rounded-xl border border-slate-700 shadow-xl z-50 animate-in fade-in">
                        Contraseña de acceso personal protegida con cifrado criptográfico.
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
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-unalm-500 transition-all font-medium"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-unalm-600 to-unalm-700 hover:from-unalm-500 hover:to-unalm-600 focus:outline-none focus:ring-2 focus:ring-unalm-500 shadow-lg shadow-unalm-900/50 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="flex items-center space-x-2">
                    <span>Ingresar al Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>

              {/* Quick Demo Pre-fills */}
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-slate-400 font-semibold flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Perfiles Rápidos de Demostración:</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => fillTestCredentials('solicitante')}
                    className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700/80 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <GraduationCap className="w-3 h-3 text-emerald-400" />
                    <span>Solicitante</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillTestCredentials('mesa_otic')}
                    className="px-2 py-1.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/50 text-blue-200 text-[11px] font-medium border border-blue-800/60 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                    title="Mesa de Ayuda OTIC (soporte@lamolina.edu.pe / mesa123)"
                  >
                    <Headphones className="w-3 h-3 text-blue-400" />
                    <span>Mesa OTIC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillTestCredentials('mesa_sg')}
                    className="px-2 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 text-[11px] font-medium border border-amber-800/60 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                    title="Mesa de Ayuda SG (mesa.sg@lamolina.edu.pe / mesa123)"
                  >
                    <Headphones className="w-3 h-3 text-amber-400" />
                    <span>Mesa SG</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillTestCredentials('tecnico')}
                    className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700/80 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Laptop className="w-3 h-3 text-cyan-400" />
                    <span>Técnico OTIC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillTestCredentials('tecnico_sg')}
                    className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700/80 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Wrench className="w-3 h-3 text-amber-400" />
                    <span>Técnico SG</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillTestCredentials('admin')}
                    className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700/80 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Shield className="w-3 h-3 text-purple-400" />
                    <span>Admin</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* =========================================================================
               REGISTRATION FORM
               ========================================================================= */
            <form className="space-y-3.5" onSubmit={handleRegisterSubmit}>
              {/* Nombres y Apellidos (Campo Único) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nombres y Apellidos *
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regNombreCompleto}
                    onChange={(e) => setRegNombreCompleto(e.target.value)}
                    placeholder="Ej: David Mendoza Flores"
                    className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-unalm-500 font-medium"
                  />
                </div>
              </div>

              {/* Correo Institucional */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    Correo Institucional UNALM *
                  </label>
                  <div
                    className="relative flex items-center cursor-help text-slate-400 hover:text-slate-200"
                    onMouseEnter={() => setActiveTooltip('email-reg')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {activeTooltip === 'email-reg' && (
                      <div className="absolute right-0 bottom-full mb-1.5 w-60 p-2.5 bg-slate-950 text-slate-200 text-[11px] rounded-xl border border-slate-700 shadow-xl z-50 animate-in fade-in">
                        Debe ser su correo institucional <strong className="text-unalm-300">@lamolina.edu.pe</strong> para validación de identidad.
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="usuario@lamolina.edu.pe"
                    className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-unalm-500 font-medium"
                  />
                </div>
              </div>

              {/* Tipo de Usuario */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    Tipo de Usuario *
                  </label>
                  <div
                    className="relative flex items-center cursor-help text-slate-400 hover:text-slate-200"
                    onMouseEnter={() => setActiveTooltip('tipo-user')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {activeTooltip === 'tipo-user' && (
                      <div className="absolute right-0 bottom-full mb-1.5 w-56 p-2.5 bg-slate-950 text-slate-200 text-[11px] rounded-xl border border-slate-700 shadow-xl z-50 animate-in fade-in">
                        Seleccione su condición actual en la UNALM para clasificar sus requerimientos.
                      </div>
                    )}
                  </div>
                </div>

                <select
                  value={regTipoUsuario}
                  onChange={(e) => setRegTipoUsuario(e.target.value)}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-unalm-500 font-medium"
                >
                  <option value="Docente Nombrado">Docente Nombrado</option>
                  <option value="Docente Contratado">Docente Contratado</option>
                  <option value="Administrativo Nombrado">Administrativo Nombrado</option>
                  <option value="Administrativo Contratado">Administrativo Contratado</option>
                  <option value="Personal CAS">Personal CAS</option>
                  <option value="Estudiante">Estudiante</option>
                  <option value="Investigador">Investigador</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Celular & Anexo Obligatorios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-300">
                      Celular (Contacto) *
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">9 dígitos (MTC)</span>
                  </div>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={regTelefono}
                      onChange={(e) => setRegTelefono(handlePhoneInputChange(e.target.value))}
                      placeholder="Ej: 998 877 665"
                      maxLength={11}
                      className={`block w-full pl-9 pr-8 py-2 bg-slate-950 border rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 font-medium transition-all ${
                        regTelefono.trim().length === 0
                          ? 'border-slate-700 focus:ring-unalm-500'
                          : phoneValidation.isValid
                            ? 'border-emerald-500 bg-emerald-950/20 focus:ring-emerald-400 text-emerald-200'
                            : 'border-rose-500 bg-rose-950/20 focus:ring-rose-400 text-rose-200'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                      {regTelefono.trim().length > 0 && (
                        phoneValidation.isValid ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        )
                      )}
                    </div>
                  </div>
                  {regTelefono.trim().length > 0 && (
                    <div className="mt-1 text-[10px]">
                      {phoneValidation.isValid ? (
                        <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                          <span>✓ Celular válido</span>
                        </span>
                      ) : (
                        <span className="text-rose-400 font-semibold">
                          {phoneValidation.error}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Anexo Telefónico *
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <PhoneCall className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={regAnexo}
                      onChange={(e) => setRegAnexo(e.target.value)}
                      placeholder="Ej: 234 / Sin anexo"
                      className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-unalm-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Buscador en Tiempo Real de Facultad o Dependencia */}
              <div>
                <SearchableDependenciaSelect
                  value={regDependencia}
                  onChange={setRegDependencia}
                  label="Facultad o Dependencia UNALM *"
                  theme="dark"
                  required
                />
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Contraseña *
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="block w-full px-3 pr-8 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-unalm-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Confirmar Contraseña *
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repita la contraseña"
                      className="block w-full px-3 pr-8 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-unalm-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Meter */}
              {regPassword && (
                <div className="space-y-1 pt-0.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Seguridad de la contraseña:</span>
                    <span
                      className={`font-bold ${
                        regPassword.length < 6
                          ? 'text-rose-400'
                          : regPassword.length < 9
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {regPassword.length < 6
                        ? 'Débil (mínimo 6 caract.)'
                        : regPassword.length < 9
                        ? 'Media'
                        : 'Segura'}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        regPassword.length < 6
                          ? 'w-1/4 bg-rose-500'
                          : regPassword.length < 9
                          ? 'w-2/3 bg-amber-500'
                          : 'w-full bg-emerald-500'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Submit Registration Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-unalm-600 to-unalm-700 hover:from-unalm-500 hover:to-unalm-600 focus:outline-none focus:ring-2 focus:ring-unalm-500 shadow-lg shadow-unalm-900/50 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="flex items-center space-x-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Registrar Cuenta Institucional</span>
                  </span>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Clean Institutional Footer */}
        <p className="mt-4 text-center text-[11px] text-slate-400/80 font-medium drop-shadow">
          Universidad Nacional Agraria La Molina • Mesa de Ayuda Institucional
        </p>
      </div>
    </div>
  );
};
