import React from 'react';
import { Star, ShieldCheck, CheckCircle2, Phone, Mail, Award, User, ExternalLink, Briefcase, Wrench, Building2 } from 'lucide-react';
import { getAssetUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface TechnicianProfileCardProps {
  id?: number;
  nombre: string;
  email?: string;
  dependencia?: string;
  cargo?: string;
  especialidad?: string;
  encargadoDe?: string;
  dondeLabora?: string;
  modulo?: 'OTIC' | 'SERVICIOS_GENERALES';
  telefono?: string;
  fotoPerfil?: string;
  promedioEstrellas?: number;
  totalCalificaciones?: number;
  totalResueltos?: number;
  variant?: 'card' | 'compact' | 'modal';
  onClick?: () => void;
}

export const TechnicianProfileCard: React.FC<TechnicianProfileCardProps> = ({
  id,
  nombre,
  email,
  dependencia,
  cargo,
  especialidad,
  encargadoDe,
  dondeLabora,
  modulo = 'OTIC',
  telefono,
  fotoPerfil,
  promedioEstrellas = 5.0,
  totalCalificaciones = 0,
  totalResueltos = 0,
  variant = 'card',
  onClick,
}) => {
  const { user } = useAuth();
  const isTechnician = Boolean(user?.rol && ['TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'TECNICO_SG'].includes(user.rol));
  const isSG = modulo === 'SERVICIOS_GENERALES';
  const rating = Number(promedioEstrellas || 5.0).toFixed(1);
  const numRating = parseFloat(rating);

  const getInitials = (nameStr: string) => {
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return nameStr.slice(0, 2).toUpperCase();
  };

  const renderAvatar = (sizeClass: string, textClass: string) => {
    if (fotoPerfil && fotoPerfil.trim()) {
      return (
        <img
          src={getAssetUrl(fotoPerfil)}
          alt={nombre}
          className={`${sizeClass} rounded-full object-cover border-2 border-amber-400 shadow-md ring-2 ring-amber-100`}
          onError={(e) => {
            // Fallback si la imagen no carga
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }

    return (
      <div
        className={`${sizeClass} rounded-full bg-gradient-to-tr from-unalm-700 via-unalm-600 to-emerald-500 text-white font-extrabold flex items-center justify-center border-2 border-white shadow-md ${textClass}`}
      >
        {getInitials(nombre)}
      </div>
    );
  };


  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center space-x-2.5 bg-white py-1 px-2.5 rounded-full border border-slate-200 shadow-2xs">
        <div className="relative">
          {renderAvatar('w-7 h-7', 'text-[10px]')}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
        </div>
        <div className="text-left">
          <span className="text-xs font-bold text-slate-800 block truncate max-w-[150px] leading-tight">
            {nombre}
          </span>
          {isSG && (cargo || especialidad) ? (
            <span className="text-[10px] text-slate-500 block truncate max-w-[150px]">
              {cargo || especialidad}
            </span>
          ) : (
            <div className="flex items-center space-x-1 text-[10px] text-amber-600 font-extrabold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{rating}</span>
              {totalCalificaciones > 0 && (
                <span className="text-slate-400 font-normal">({totalCalificaciones})</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-amber-50/50 via-white to-white p-5 rounded-3xl border border-amber-200/90 shadow-sm relative overflow-hidden space-y-4">
      {/* Decorative top pill */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center space-x-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
          isSG
            ? 'text-amber-900 bg-amber-100/80 border-amber-300'
            : 'text-unalm-700 bg-unalm-50 border-unalm-200'
        }`}>
          <ShieldCheck className={`w-3 h-3 ${isSG ? 'text-amber-600' : 'text-unalm-600'}`} />
          <span>{isSG ? 'Especialista Servicios Generales Asignado' : 'Especialista OTIC Asignado'}</span>
        </span>

        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>En línea para atención</span>
        </span>
      </div>

      {/* Rappi Style Avatar + Rating Info */}
      <div className="flex items-center space-x-4">
        <div className="relative shrink-0">
          {renderAvatar('w-16 h-16 sm:w-18 sm:h-18', 'text-lg')}
          <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 p-1 rounded-full border-2 border-white shadow-xs">
            <Award className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="space-y-1.5 flex-1 min-w-0">
          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
            {nombre}
          </h4>

          {isSG ? (
            <div className="space-y-1 text-xs">
              <p className="font-bold text-amber-950 flex items-center space-x-1.5">
                <Briefcase className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">Cargo: <strong className="text-slate-800 font-semibold">{cargo || 'Técnico Especialista de Campo'}</strong></span>
              </p>
              {(especialidad || encargadoDe) && (
                <p className="text-slate-700 flex items-center space-x-1.5">
                  <Wrench className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">Especialidad: <strong className="text-slate-800 font-semibold">{especialidad || encargadoDe}</strong></span>
                </p>
              )}
              <p className="text-slate-500 flex items-center space-x-1.5 text-[11px]">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Labora en: <strong className="text-slate-700 font-medium">{dondeLabora || dependencia || 'Unidad de Servicios Generales (USG)'}</strong></span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 truncate">
              {dependencia || 'Oficina de Tecnologías de la Información (OTIC)'}
            </p>
          )}

          {/* Star Rating Bar (Oculto para rol técnico) */}
          {!isTechnician && (
            <div className="flex items-center space-x-2 pt-0.5">
              <div className="flex items-center bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-lg shadow-2xs">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500 mr-1" />
                <span className="text-xs font-black text-amber-900">{rating}</span>
              </div>

              <div className="flex items-center space-x-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      numRating >= star
                        ? 'fill-amber-400 text-amber-400'
                        : numRating >= star - 0.5
                        ? 'fill-amber-300 text-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>

              <span className="text-[11px] font-semibold text-slate-400">
                {totalCalificaciones > 0 ? `(${totalCalificaciones} reseñas)` : '(Nuevo técnico)'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Records & Contact Footer */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="truncate">
            <span className="text-[10px] text-slate-400 block font-semibold">Récord Atenciones</span>
            <span className="font-extrabold text-slate-800">
              {totalResueltos > 0 ? `${totalResueltos} resueltos` : 'En servicio'}
            </span>
          </div>
        </div>

        {telefono ? (
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex items-center space-x-2">
            <Phone className="w-4 h-4 text-unalm-600 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block font-semibold">Contacto / Anexo</span>
              <span className="font-bold text-slate-800">{telefono}</span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex items-center space-x-2">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block font-semibold">Email OTIC</span>
              <span className="font-semibold text-slate-700 truncate block">{email || 'otic@lamolina.edu.pe'}</span>
            </div>
          </div>
        )}
      </div>

      {!isTechnician && onClick && (
        <button
          onClick={onClick}
          className="w-full py-2 bg-amber-100/70 hover:bg-amber-200/80 text-amber-950 font-extrabold rounded-2xl text-xs flex items-center justify-center space-x-1.5 transition-colors border border-amber-300"
        >
          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
          <span>Ver Récord & Reseñas del Especialista</span>
          <ExternalLink className="w-3.5 h-3.5 text-amber-800" />
        </button>
      )}
    </div>
  );
};

