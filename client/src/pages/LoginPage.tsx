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
  Network,
  Server,
  Info,
  Copy,
  Check,
  X,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginWithLdap } = useAuth();
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
  const [loadingLdap, setLoadingLdap] = useState(false);
  const [showLdapModal, setShowLdapModal] = useState(false);
  const [copiedLdapSpecs, setCopiedLdapSpecs] = useState(false);
  const [ldapStatus, setLdapStatus] = useState<any>(null);

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
      await loginWithLdap(cleanIdentifier, password);
    } catch (err: any) {
      setError(err.message || 'Error en la autenticación con Directorio Activo (LDAP)');
    } finally {
      setLoadingLdap(false);
    }
  };

  const handleOpenLdapModal = async () => {
    setShowLdapModal(true);
    try {
      const res = await api.getLdapStatus();
      if (res.success && res.data) {
        setLdapStatus(res.data);
      }
    } catch {
      // Ignorar error al cargar estado
    }
  };

  const handleCopyLdapSpecs = () => {
    const specsText = `=============================================================================
REQUERIMIENTOS TÉCNICOS PARA INTEGRACIÓN DE DIRECTORIO ACTIVO (LDAP)
SISTEMA DE MESA DE AYUDA - UNALM
=============================================================================
Servidor de la Mesa de Ayuda: 172.16.20.49
Dominio Institucional: lamolina.edu.pe

Datos solicitados al Administrador de Redes OTIC:
1. IP o Hostname del Servidor de Directorio Activo (Domain Controller):
   Ejemplo: 172.16.0.X o dc01.lamolina.edu.pe

2. Puerto de Conexión y Protocolo de Seguridad:
   - Puerto 389 (LDAP estándar / STARTTLS)
   - O Puerto 636 (LDAPS seguro con SSL)

3. Base DN (Distinguished Name):
   Ejemplo: DC=lamolina,DC=edu,DC=pe (o la OU donde residen los usuarios)

4. Cuenta de Servicio de Dominio (Service Account / Bind User):
   - Usuario de servicio con permisos de SOLO LECTURA en el árbol de Active Directory
   - Formato aceptado:
     * UPN: svc_mesaayuda@lamolina.edu.pe
     * DN: CN=svc_mesaayuda,OU=ServiceAccounts,DC=lamolina,DC=edu,DC=pe
     * o Formato NT: LAMOLINA\\svc_mesaayuda
   - Contraseña de dicha cuenta de servicio

5. Reglas de Conectividad de Red y Firewall:
   - Habilitar comunicación TCP desde el host de Mesa de Ayuda (172.16.20.49)
     hacia el Domain Controller en el puerto LDAP correspondiente (389 o 636).
=============================================================================`;

    navigator.clipboard.writeText(specsText);
    setCopiedLdapSpecs(true);
    setTimeout(() => setCopiedLdapSpecs(false), 3000);
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
        className={`sm:mx-auto w-full transition-all duration-300 relative z-20 px-4 sm:px-0 ${
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
        <div className="bg-slate-900/95 border border-slate-800/90 backdrop-blur-xl py-6 px-6 sm:px-8 shadow-2xl rounded-3xl relative z-30">
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

              {/* Botón Principal: Acceso con Directorio Activo (LDAP UNALM) */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleLdapLoginSubmit}
                  disabled={loading || loadingLdap}
                  className="w-full relative group overflow-hidden rounded-2xl p-3 sm:p-3.5 text-white font-bold transition-all duration-200 cursor-pointer shadow-xl border border-sky-400/50 hover:border-sky-300 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-600 shadow-sky-950/70 hover:shadow-sky-500/25 active:scale-[0.99] disabled:opacity-50"
                  title="Ingreso institucional validando con el Controlador de Dominio de lamolina.edu.pe"
                >
                  {/* Sutil barrido de luz */}
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

                <div className="flex items-center justify-between px-1 text-[11px]">
                  <span className="text-slate-400 flex items-center space-x-1.5">
                    <Server className="w-3.5 h-3.5 text-sky-400" />
                    <span>Dominio: <strong className="text-slate-200">lamolina.edu.pe</strong></span>
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenLdapModal}
                    className="text-sky-400 hover:text-sky-300 font-semibold underline flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Info className="w-3 h-3" />
                    <span>Parámetros de Red</span>
                  </button>
                </div>
              </div>

              {/* Separador Institucional */}
              <div className="relative my-2.5 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative px-3 bg-slate-900 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center space-x-1">
                  <span>o con credenciales locales / soporte</span>
                </div>
              </div>

              {/* Botón Secundario: Cuenta Local */}
              <button
                type="submit"
                disabled={loading || loadingLdap}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-bold text-slate-200 bg-slate-800/90 hover:bg-slate-700 hover:text-white border border-slate-700/80 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="flex items-center space-x-2">
                    <LogIn className="w-3.5 h-3.5 text-unalm-400" />
                    <span>Ingresar con Cuenta Local</span>
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
                    <span>Soporte Técnico</span>
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
        <p className="mt-4 pb-6 text-center text-[11px] text-slate-400/80 font-medium relative z-10">
          Universidad Nacional Agraria La Molina • Mesa de Ayuda Institucional
        </p>
      </div>

      {/* Modal de Requerimientos Técnicos e Información de Directorio Activo (LDAP) */}
      {showLdapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-6 text-slate-100 relative max-h-[90vh] overflow-y-auto">
            {/* Botón Cerrar */}
            <button
              type="button"
              onClick={() => setShowLdapModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Encabezado */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>Directorio Activo (LDAP UNALM)</span>
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-400/30 text-[10px] text-sky-300 font-mono">
                    lamolina.edu.pe
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Autenticación institucional de red y dominio
                </p>
              </div>
            </div>

            {/* Estado de Configuración del Servidor */}
            <div className="mb-4 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start space-x-3 text-xs">
              <Server className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Estado de Enlace LDAP:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ldapStatus?.configured
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {ldapStatus?.configured ? '● Vinculado' : '▲ Pendiente de Datos de Red'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {ldapStatus?.statusMessage ||
                    'El motor de autenticación LDAP de la Mesa de Ayuda está listo. Para completar la conexión institucional se requiere que el Administrador de Red configure la IP del Domain Controller y la cuenta de servicio en el archivo .env.'}
                </p>
              </div>
            </div>

            {/* ¿Cómo funciona el acceso? */}
            <div className="mb-4 space-y-1.5 text-xs text-slate-300">
              <span className="font-bold text-white block">Instrucciones de Ingreso:</span>
              <div className="text-slate-400 leading-relaxed text-[11px] space-y-1 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                <p>1. Ingrese su usuario institucional (ej: <code className="text-sky-300 bg-slate-900 px-1 py-0.5 rounded">agarcia</code> o <code className="text-sky-300 bg-slate-900 px-1 py-0.5 rounded">agarcia@lamolina.edu.pe</code>).</p>
                <p>2. Ingrese su contraseña de red o inicio de sesión de Windows del dominio UNALM.</p>
                <p>3. Presione el botón <strong className="text-sky-300 font-semibold">"Ingresar con Directorio Activo (LDAP)"</strong>.</p>
                <p>4. El sistema verificará sus credenciales con el Domain Controller y registrará su perfil automáticamente.</p>
              </div>
            </div>

            {/* Requerimientos Técnicos para el Administrador de Redes */}
            <div className="mb-4 rounded-2xl border border-sky-800/40 bg-sky-950/20 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-200 flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 text-sky-400" />
                  <span>Datos Requeridos para el Administrador de Red:</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyLdapSpecs}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-sky-600/30 hover:bg-sky-600/50 text-sky-200 border border-sky-500/40 text-[10px] font-bold transition-all cursor-pointer"
                  title="Copiar texto para enviar al Administrador de Red"
                >
                  {copiedLdapSpecs ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-sky-300" />
                      <span>Copiar Solicitud</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-slate-300 space-y-1 font-mono bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 overflow-x-auto">
                <div><span className="text-sky-400 font-bold">1. Controlador de Dominio:</span> 172.16.0.8 (unalm.lamolina.edu.pe)</div>
                <div><span className="text-sky-400 font-bold">2. Protocolo & Cifrado:</span> Puerto 636 LDAPS / SSL Seguro</div>
                <div><span className="text-sky-400 font-bold">3. Base DN de Búsqueda:</span> DC=lamolina,DC=edu,DC=pe</div>
                <div><span className="text-sky-400 font-bold">4. Dominio Institucional:</span> lamolina.edu.pe</div>
                <div><span className="text-sky-400 font-bold">5. Cuenta de Servicio:</span> mesadeayuda@lamolina.edu.pe</div>
                <div><span className="text-sky-400 font-bold">6. Servidor Mesa de Ayuda:</span> 172.16.20.49 (Conectado)</div>
              </div>
            </div>

            {/* Botón Aceptar */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowLdapModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
