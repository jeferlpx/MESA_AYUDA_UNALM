import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithLdap } = useAuth();

  // Background Image State
  const [selectedBg] = useState<'1.jpeg' | '2.JPG' | '3.JPG'>(() => {
    return (localStorage.getItem('unalm_campus_bg') as any) || '1.jpeg';
  });

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loadingLdap, setLoadingLdap] = useState(false);

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
      await loginWithLdap(cleanIdentifier, password);
    } catch (err: any) {
      setError(err.message || 'Error en la autenticación con Directorio Activo (LDAP)');
    } finally {
      setLoadingLdap(false);
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

      <div className="sm:mx-auto w-full sm:max-w-md transition-all duration-300 relative z-20 px-4 sm:px-0">
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

          {/* FORMULARIO OFICIAL DE ACCESO INSTITUCIONAL CON DIRECTORIO ACTIVO (LDAP) */}
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

            {/* Botón Principal: Acceso con Directorio Activo (LDAP UNALM) */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={loadingLdap}
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
            </div>
          </form>
        </div>

        {/* Clean Institutional Footer */}
        <p className="mt-4 pb-6 text-center text-[11px] text-slate-400/80 font-medium relative z-10">
          Universidad Nacional Agraria La Molina • Mesa de Ayuda Institucional
        </p>
      </div>
    </div>
  );
};
