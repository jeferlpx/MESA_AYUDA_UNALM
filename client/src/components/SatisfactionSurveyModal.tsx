import React, { useState } from 'react';
import { Star, X, CheckCircle, Heart, MessageSquare, ThumbsUp, Sparkles, User, Award } from 'lucide-react';
import { api, getAssetUrl } from '../services/api';


interface SatisfactionSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: number;
  ticketCodigo: string;
  tecnicoNombre?: string;
  tecnicoFoto?: string;
  tecnicoPromedio?: number;
  onSurveySubmitted?: () => void;
}

export const SatisfactionSurveyModal: React.FC<SatisfactionSurveyModalProps> = ({
  isOpen,
  onClose,
  ticketId,
  ticketCodigo,
  tecnicoNombre,
  tecnicoFoto,
  tecnicoPromedio,
  onSurveySubmitted,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comentario, setComentario] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 1:
        return '⭐ Muy insatisfecho';
      case 2:
        return '⭐⭐ Insatisfecho';
      case 3:
        return '⭐⭐⭐ Regular / Aceptable';
      case 4:
        return '⭐⭐⭐⭐ Muy buena atención';
      case 5:
        return '⭐⭐⭐⭐⭐ ¡Excelente servicio técnico!';
      default:
        return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.submitSurvey(ticketId, rating, comentario);
      if (res.success) {
        setIsDone(true);
        setTimeout(() => {
          if (onSurveySubmitted) onSurveySubmitted();
          onClose();
        }, 1800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al enviar calificación');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200/80 dark:border-slate-800 ring-1 ring-black/5 dark:ring-white/10 relative animate-in zoom-in-95 duration-200">
        {/* Close Button X */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90 z-10 cursor-pointer"
          title="Cerrar (X)"
        >
          <X className="w-5 h-5" />
        </button>

        {isDone ? (
          <div className="p-8 text-center space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <Sparkles className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">¡Gracias por tu Calificación!</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Tu opinión nos ayuda a medir la calidad del servicio técnico y mejorar continuamente la atención de la OTIC UNALM.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Header & Technician Rappi-style Avatar */}
            <div className="text-center space-y-3">
              <span className="text-[10px] font-extrabold text-unalm-700 bg-unalm-50 border border-unalm-200 px-3 py-1 rounded-full uppercase tracking-wider">
                Encuesta de Calidad ITIL v4
              </span>

              <div className="flex flex-col items-center justify-center space-y-2 pt-1">
                <div className="relative">
                  {tecnicoFoto ? (
                    <img
                      src={getAssetUrl(tecnicoFoto)}
                      alt={tecnicoNombre}
                      className="w-20 h-20 rounded-full object-cover border-4 border-amber-400 shadow-md ring-4 ring-amber-100"
                    />
                  ) : (

                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-unalm-700 via-unalm-600 to-emerald-500 text-white font-extrabold text-2xl flex items-center justify-center border-4 border-white shadow-md">
                      {tecnicoNombre?.slice(0, 2).toUpperCase() || 'OT'}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 p-1 rounded-full border-2 border-white shadow-xs">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {tecnicoNombre || 'Especialista OTIC'}
                  </h3>
                  {tecnicoPromedio && (
                    <div className="flex items-center justify-center space-x-1 text-xs font-bold text-amber-700 mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{Number(tecnicoPromedio).toFixed(1)} de promedio actual</span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                ¿Cómo calificarías la atención en tu requerimiento <span className="font-mono text-unalm-700 font-bold">{ticketCodigo}</span>?
              </p>
            </div>

            {/* Star Rating Interactive Component */}
            <div className="flex flex-col items-center space-y-2 bg-slate-50 dark:bg-slate-800/60 py-4 px-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 sm:p-1.5 focus:outline-none transition-transform hover:scale-125 duration-150 cursor-pointer active:scale-95"
                    >
                      <Star
                        className={`w-8 h-8 sm:w-9 sm:h-9 transition-all duration-200 ${
                          active
                            ? 'text-amber-400 fill-amber-400 filter drop-shadow-md'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 h-5">
                {getRatingLabel(hoverRating || rating)}
              </span>
            </div>

            {/* Optional Comment Box */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>Comentarios o Feedback</span>
                </label>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  OPCIONAL
                </span>
              </div>
              <textarea
                rows={3}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Si deseas, déjanos un comentario o sugerencia sobre la atención recibida..."
                className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-unalm-500 focus:outline-none placeholder-slate-400 transition-all"
              />
            </div>

            {errorMsg && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800 text-center">
                {errorMsg}
              </p>
            )}

            {/* Submit & Close */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Cerrar (X)
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-unalm-600 hover:bg-unalm-700 text-white rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{submitting ? 'Enviando...' : 'Enviar Calificación'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
