import React, { useState, useEffect } from 'react';
import { api, getAssetUrl } from '../services/api';
import { Modal } from './Modal';
import { StatusBadge, UrgencyBadge, ComplexityBadge } from './Badge';
import { useAuth } from '../context/AuthContext';
import {
  Star,
  UserCheck,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Award,
  Mail,
  Building,
  Phone,
  ShieldCheck,
  Clock,
  Layers,
} from 'lucide-react';

interface TechnicianProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  technicianId: number | null;
}

export const TechnicianProfileModal: React.FC<TechnicianProfileModalProps> = ({
  isOpen,
  onClose,
  technicianId,
}) => {
  const { user } = useAuth();
  const isAdminOrSupervisor = user?.rol === 'ADMIN' || user?.rol === 'SUPERVISOR';
  const isTechnician = Boolean(user?.rol && ['TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'TECNICO_SG'].includes(user.rol));

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'feedbacks' | 'history'>(
    isTechnician ? 'history' : 'feedbacks'
  );

  useEffect(() => {
    if (isOpen && technicianId) {
      if (isTechnician) setActiveTab('history');
      setLoading(true);
      api
        .getTechnicianHistory(technicianId)
        .then((res) => {
          if (res.success) {
            setData(res.data);
          }
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setData(null);
    }
  }, [isOpen, technicianId]);

  if (!isOpen || !technicianId) return null;

  const tech = data?.technician;
  const history: any[] = data?.history || [];
  const feedbacks = history.filter((h) => h.encuesta_puntuacion && h.encuesta_puntuacion > 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Perfil del Especialista OTIC & Récord de Atención"
      maxWidth="3xl"
    >
      {loading ? (
        <div className="py-12 text-center text-slate-500 space-y-3">
          <div className="w-8 h-8 border-3 border-unalm-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold">Cargando récord del especialista...</p>
        </div>
      ) : !tech ? (
        <div className="py-8 text-center text-slate-500 text-xs">
          No se encontró información del especialista.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Card (Rappi / Uber style) */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-unalm-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
              {/* Avatar Circle */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-700 border-3 border-amber-400 p-0.5 shadow-xl flex items-center justify-center overflow-hidden">
                  {tech.fotoPerfil ? (
                    <img
                      src={getAssetUrl(tech.fotoPerfil)}
                      alt={tech.nombres}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-2xl sm:text-3xl font-black text-amber-400">
                      {tech.nombres.charAt(0)}
                      {tech.apellidos.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-slate-900" title="Especialista Verificado OTIC">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              {/* Info & Badges */}
              <div className="text-center sm:text-left space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                    {tech.rolNombre || 'Técnico Especialista OTIC'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/80 text-slate-200">
                    UNALM
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  {tech.nombres} {tech.apellidos}
                </h3>

                <p className="text-xs text-slate-300 flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
                  <span className="inline-flex items-center space-x-1">
                    <Building className="w-3.5 h-3.5 text-unalm-300" />
                    <span>{tech.facultadDependencia || 'OTIC'}</span>
                  </span>
                  <span className="inline-flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-unalm-300" />
                    <span>{tech.email}</span>
                  </span>
                </p>

                {/* CSAT Metric Stars Banner (Oculto para técnicos) */}
                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4">
                  {!isTechnician && (
                    <div className="flex items-center space-x-2 bg-slate-950/60 px-3.5 py-1.5 rounded-2xl border border-slate-700/60">
                      <span className="text-lg font-black text-amber-400">
                        {Number(tech.promedioCalificacion).toFixed(1)}
                      </span>
                      <div className="flex items-center space-x-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Math.round(tech.promedioCalificacion)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-400 font-semibold">
                        ({tech.totalCalificaciones} reseñas)
                      </span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 bg-slate-950/60 px-3.5 py-1.5 rounded-2xl border border-slate-700/60 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-slate-200">
                      {tech.totalResueltos} tickets resueltos
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Reseñas vs Historial) */}
          <div className="flex items-center border-b border-slate-200 space-x-2">
            {!isTechnician && (
              <button
                onClick={() => setActiveTab('feedbacks')}
                className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
                  activeTab === 'feedbacks'
                    ? 'border-unalm-600 text-unalm-700 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Reseñas de Usuarios ({feedbacks.length})</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
                activeTab === 'history'
                  ? 'border-unalm-600 text-unalm-700 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Historial de Atenciones ({history.length})</span>
            </button>
          </div>

          {/* Tab 1: Reseñas & Comentarios de Calidad */}
          {activeTab === 'feedbacks' && (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {feedbacks.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>Este especialista aún no cuenta con reseñas registradas.</p>
                </div>
              ) : (
                feedbacks.map((f) => (
                  <div
                    key={f.id}
                    className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5">
                        <div className="flex items-center space-x-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= f.encuesta_puntuacion
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-black text-slate-800">
                          {f.encuesta_puntuacion}.0 / 5.0
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-400 font-medium">
                        {f.fecha_encuesta ? new Date(f.fecha_encuesta).toLocaleDateString('es-PE') : ''}
                      </span>
                    </div>

                    {/* Feedback comment */}
                    {f.encuesta_comentario ? (
                      <p className="text-xs text-slate-700 italic bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                        "{f.encuesta_comentario}"
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Calificación sin comentario adicional.
                      </p>
                    )}

                    {/* Associated Ticket */}
                    <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
                      <span className="font-bold text-slate-800 truncate max-w-sm">
                        {f.codigo_correlativo}: {f.titulo}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {f.categoria_nombre}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Historial de Solicitudes Atendidas */}
          {activeTab === 'history' && (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {history.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>No se registran atenciones asignadas para este técnico.</p>
                </div>
              ) : (
                history.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-black text-unalm-700 bg-unalm-50 px-2 py-0.5 rounded-md border border-unalm-200">
                          {t.codigo_correlativo}
                        </span>
                        <StatusBadge status={t.estado} />
                        <UrgencyBadge urgency={t.urgencia} />
                      </div>

                      <span className="text-[11px] text-slate-400">
                        {new Date(t.fecha_apertura).toLocaleDateString('es-PE')}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-900">{t.titulo}</p>
                      <p className="text-[11px] text-slate-500">{t.categoria_nombre}</p>
                    </div>

                    {/* Información extendida para Administradores / Supervisores */}
                    {isAdminOrSupervisor && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 mt-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                          <span>
                            <strong>Solicitante:</strong> {t.solicitante_nombre} ({t.solicitante_dependencia})
                          </span>
                          <ComplexityBadge complexity={t.complejidad || 'BAJA'} />
                        </div>
                        {t.solucion_detalle && (
                          <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                            <strong>Solución técnica:</strong> {t.solucion_detalle}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Footer close */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
