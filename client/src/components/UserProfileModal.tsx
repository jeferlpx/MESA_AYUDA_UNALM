import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, getAssetUrl } from '../services/api';
import { Modal } from './Modal';
import {
  Star,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Building2,
  PhoneCall,
  MapPin,
  Save,
  Loader2,
  Crosshair,
} from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';
import { validatePeruvianPhone, handlePhoneInputChange } from '../utils/phoneValidator';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [submittingPhoto, setSubmittingPhoto] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable Profile Data
  const [telefono, setTelefono] = useState('');
  const [anexo, setAnexo] = useState('');
  const [facultadDependencia, setFacultadDependencia] = useState('');
  const [ubicacionReferencia, setUbicacionReferencia] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  // Phone validation with Level 1 rules (MTC Peru)
  const phoneValidation = useMemo(() => validatePeruvianPhone(telefono, true), [telefono]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getUserProfile();
      if (res.success && res.data) {
        setProfileData(res.data);
        setTelefono(res.data.telefono || '');
        setAnexo(res.data.anexo || '');
        setFacultadDependencia(res.data.facultadDependencia || '');
        setUbicacionReferencia(res.data.ubicacionReferencia || '');
        if (res.data.fotoPerfil) {
          setPreviewUrl(getAssetUrl(res.data.fotoPerfil));
        }
      }
    } catch (err) {
      console.error('Error al cargar perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadProfile();
      setFile(null);
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      try {
        const compressed = await compressImage(selectedFile, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
        setFile(compressed.file);
        setPreviewUrl(URL.createObjectURL(compressed.file));
      } catch {
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
      }
    }
  };

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setSubmittingPhoto(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.updateProfilePhoto(formData);
      if (res.success) {
        setSuccessMsg('Foto de perfil actualizada exitosamente.');
        await loadProfile();
        await refreshUser();
        if (onProfileUpdated) onProfileUpdated();
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar foto de perfil');
    } finally {
      setSubmittingPhoto(false);
    }
  };

  const handleGetGPSLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Tu navegador no soporta geolocalización GPS.');
      return;
    }
    setGettingLocation(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `Coordenadas: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
        setUbicacionReferencia((prev) => {
          const clean = prev ? prev.replace(/ \(Coordenadas:.*?\)/, '').trim() : '';
          return clean ? `${clean} (${coords})` : coords;
        });
        setGettingLocation(false);
      },
      (err) => {
        setGettingLocation(false);
        setErrorMsg(`No se pudo obtener la ubicación GPS (${err.message}). Puedes escribir tu oficina manualmente.`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSaveProfileData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneValidation.isValid) {
      setErrorMsg(`Número de celular no válido: ${phoneValidation.error}`);
      return;
    }
    setSavingProfile(true);
    setErrorMsg(null);
    try {
      const res = await api.updateUserProfile({
        telefono: phoneValidation.cleanNumber,
        anexo: anexo.trim(),
        facultadDependencia: facultadDependencia.trim(),
        ubicacionReferencia: ubicacionReferencia.trim(),
      });
      if (res.success) {
        setSuccessMsg('Datos de perfil y contacto actualizados exitosamente.');
        await loadProfile();
        await refreshUser();
        if (onProfileUpdated) onProfileUpdated();
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 700);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar los cambios de perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const getDynamicTitle = () => {
    const rol = user?.rol;
    if (rol === 'ADMIN') return 'Mi Perfil & Foto de Administrador OTIC';
    if (rol === 'SUPERVISOR') return 'Mi Perfil & Foto de Supervisor OTIC';
    if (rol === 'TECNICO' || rol === 'ESPECIALISTA_REDES' || rol === 'ESPECIALISTA_DESARROLLO' || rol === 'MESA_AYUDA') return 'Mi Perfil & Foto de Especialista OTIC';

    const dep = `${user?.facultadDependencia || ''} ${profileData?.facultadDependencia || ''}`.toLowerCase();
    const rolNom = `${user?.rolNombre || ''} ${profileData?.rolNombre || ''}`.toLowerCase();

    if (dep.includes('estudiante') || dep.includes('alumno') || rolNom.includes('estudiante') || rolNom.includes('alumno')) {
      return 'Mi Perfil & Foto de Alumno';
    }
    if (dep.includes('docente') || dep.includes('profesor') || rolNom.includes('docente')) {
      return 'Mi Perfil & Foto de Docente';
    }
    if (dep.includes('investigador') || rolNom.includes('investigador')) {
      return 'Mi Perfil & Foto de Investigador';
    }
    if (dep.includes('administrativo') || rolNom.includes('administrativo')) {
      return 'Mi Perfil & Foto de Personal Administrativo';
    }

    return 'Mi Perfil & Foto Institucional';
  };

  const getDynamicSubtitle = () => {
    return 'Gestiona tus datos de contacto institucional (celular, anexo, ubicación) y foto de perfil';
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getDynamicTitle()}
      subtitle={getDynamicSubtitle()}
      maxWidth="md"
    >
      <div className="space-y-6">
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {/* Profile Card & Avatar Upload */}
        <form onSubmit={handleSavePhoto} className="flex flex-col items-center space-y-3 text-center">
          <div className="relative group">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-amber-400 shadow-lg ring-4 ring-amber-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-unalm-700 via-unalm-600 to-emerald-500 text-white font-extrabold text-2xl flex items-center justify-center border-4 border-white shadow-lg">
                {user?.nombres?.slice(0, 2).toUpperCase() || 'US'}
              </div>
            )}

            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 p-2 bg-unalm-600 hover:bg-unalm-700 text-white rounded-full shadow-md cursor-pointer border-2 border-white transition-transform hover:scale-110"
              title="Cambiar foto de perfil"
            >
              <Camera className="w-4 h-4" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {profileData?.nombres || user?.nombres} {profileData?.apellidos || user?.apellidos}
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1.5">
              {((profileData?.roles && profileData.roles.length > 0) ? profileData.roles : (user?.roles && user.roles.length > 0 ? user.roles : (user?.rol ? [user.rol] : []))).map((r: any) => {
                const roleLabels: Record<string, string> = {
                  ADMIN: 'Administrador General',
                  SUPERVISOR: 'Supervisor OTIC',
                  MESA_AYUDA: 'Mesa de Ayuda OTIC',
                  TECNICO: 'Soporte Técnico',
                  ESPECIALISTA_REDES: 'Redes y Telecomunicaciones',
                  ESPECIALISTA_DESARROLLO: 'Desarrollo TI',
                  SUPERVISOR_SG: 'Supervisor Serv. Generales',
                  MESA_AYUDA_SG: 'Mesa Serv. Generales',
                  TECNICO_SG: 'Técnico Serv. Generales',
                  SOLICITANTE: 'Usuario Solicitante UNALM',
                };
                return (
                  <span
                    key={r}
                    className="text-xs font-extrabold text-unalm-800 dark:text-emerald-300 bg-unalm-50 dark:bg-slate-800 border border-unalm-200 dark:border-emerald-600/40 px-3 py-0.5 rounded-full shadow-2xs"
                  >
                    {roleLabels[r] || r}
                  </span>
                );
              })}
            </div>
          </div>

          {file && (
            <button
              type="submit"
              disabled={submittingPhoto}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{submittingPhoto ? 'Subiendo...' : 'Guardar Nueva Foto'}</span>
            </button>
          )}
        </form>

        {/* Record & Star Stats (Habilitado solo para roles supervisores/admin/mesa de ayuda) */}
        {!['TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'TECNICO_SG'].includes(user?.rol || '') && (user?.rol === 'MESA_AYUDA' || user?.rol === 'SUPERVISOR' || user?.rol === 'ADMIN') && (
          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-3">
            <span className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wider block">
              ⭐ Récord de Calidad & Satisfacción del Usuario
            </span>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 block">Promedio CSAT</span>
                <div className="flex items-center justify-center space-x-1 mt-1 text-amber-900 font-black text-lg">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span>{profileData?.promedioCalificacion || 5.0}</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 block">Calificaciones</span>
                <p className="text-lg font-black text-slate-900 mt-1">
                  {profileData?.totalCalificaciones || 0}
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 block">Tickets Resueltos</span>
                <p className="text-lg font-black text-emerald-600 mt-1">
                  {profileData?.totalResueltos || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Formulario de Edición de Celular, Anexo y Ubicación Institucional */}
        <form onSubmit={handleSaveProfileData} className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-unalm-600" />
              <span>Datos de Contacto & Ubicación</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-semibold">Editable por usuario</span>
          </div>

          {/* Correo Institucional (Solo lectura por seguridad institucional) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Correo Institucional UNALM
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                readOnly
                disabled
                value={profileData?.email || user?.email || ''}
                className="block w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-600 text-xs font-semibold cursor-not-allowed"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Asociado a tu cuenta oficial UNALM.</p>
          </div>

          {/* Celular y Anexo en grid de 2 columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Celular *
                </label>
                <span className="text-[10px] text-slate-400 font-medium">9 dígitos (MTC Perú)</span>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4 text-unalm-600" />
                </div>
                <input
                  type="tel"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(handlePhoneInputChange(e.target.value))}
                  placeholder="Ej: 998 877 665"
                  maxLength={11}
                  className={`block w-full pl-9 pr-8 py-2 bg-white border rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 transition-all ${
                    telefono.trim().length === 0
                      ? 'border-slate-300 focus:ring-unalm-500'
                      : phoneValidation.isValid
                        ? 'border-emerald-400 bg-emerald-50/20 focus:ring-emerald-500 text-emerald-950'
                        : 'border-rose-400 bg-rose-50/20 focus:ring-rose-500 text-rose-950'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                  {telefono.trim().length > 0 && (
                    phoneValidation.isValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    )
                  )}
                </div>
              </div>
              {telefono.trim().length > 0 && (
                <div className="mt-1 flex items-center space-x-1 text-[10px]">
                  {phoneValidation.isValid ? (
                    <span className="text-emerald-700 font-bold flex items-center space-x-1">
                      <span>✓ Celular válido para contacto oficial</span>
                    </span>
                  ) : (
                    <span className="text-rose-600 font-semibold">
                      {phoneValidation.error}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Anexo Telefónico *
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <PhoneCall className="w-4 h-4 text-unalm-600" />
                </div>
                <input
                  type="text"
                  required
                  value={anexo}
                  onChange={(e) => setAnexo(e.target.value)}
                  placeholder="Ej: 234 / Sin anexo"
                  className="block w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-unalm-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Ubicación, Facultad o Dependencia */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Ubicación / Facultad o Dependencia *
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4 text-unalm-600" />
              </div>
              <input
                type="text"
                required
                value={facultadDependencia}
                onChange={(e) => setFacultadDependencia(e.target.value)}
                placeholder="Ej: Facultad de Agronomía - Pabellón A Of. 102"
                className="block w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-unalm-500 focus:border-transparent transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Esta ubicación institucional se asignará automáticamente a tus tickets.
            </p>
          </div>

          {/* Referencia Específica de Ubicación Habitual & GPS */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-700">
                Referencia de Ubicación Habitual (Piso, ambiente, cubículo o GPS)
              </label>
              <button
                type="button"
                onClick={handleGetGPSLocation}
                disabled={gettingLocation}
                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
                title="Capturar ubicación satelital GPS actual"
              >
                <Crosshair className={`w-3 h-3 text-emerald-600 ${gettingLocation ? 'animate-spin' : ''}`} />
                <span>{gettingLocation ? 'Obteniendo GPS...' : '📍 Obtener GPS actual'}</span>
              </button>
            </div>
            <div className="relative rounded-xl shadow-xs">
              <input
                type="text"
                value={ubicacionReferencia}
                onChange={(e) => setUbicacionReferencia(e.target.value)}
                placeholder="Ej: Piso 2, Cubículo 14, al lado de Decanato"
                className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-unalm-500 focus:border-transparent transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Esta referencia se jalará automáticamente a tus nuevos tickets para que los técnicos lleguen con precisión.
            </p>
          </div>

          {/* Botón de Guardar Cambios */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile || loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-unalm-600 to-unalm-700 hover:from-unalm-500 hover:to-unalm-600 text-white text-xs font-extrabold shadow-md shadow-unalm-900/20 hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando Cambios...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios de Perfil</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
