import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getAssetUrl } from '../services/api';
import { Attachment } from '../types';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileCheck,
} from 'lucide-react';

interface AttachmentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: Attachment[];
  initialIndex?: number;
}

export const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({
  isOpen,
  onClose,
  attachments,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoom(1);
      setRotation(0);
    }
  }, [isOpen, initialIndex]);

  // Keyboard navigation & escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, attachments.length]);

  if (!isOpen || attachments.length === 0) return null;

  const currentAttachment = attachments[currentIndex];
  if (!currentAttachment) return null;

  const fileUrl = getAssetUrl(`uploads/${currentAttachment.nombre_guardado}`);
  const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(currentAttachment.nombre_original) ||
                  currentAttachment.mime_type?.startsWith('image/');
  const isPdf = /\.pdf$/i.test(currentAttachment.nombre_original) || currentAttachment.mime_type === 'application/pdf';

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleNext = () => {
    if (currentIndex < attachments.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setZoom(1);
      setRotation(0);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setZoom(1);
      setRotation(0);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
    >
      {/* Top Bar Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900/80 border-b border-slate-800 text-white select-none z-10">
        <div className="flex items-center space-x-3 truncate max-w-xl">
          <div className="w-8 h-8 rounded-xl bg-unalm-600/30 border border-unalm-500/50 flex items-center justify-center text-unalm-400 shrink-0">
            {isImage ? <FileCheck className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </div>
          <div className="truncate">
            <h4 className="text-sm font-bold text-slate-100 truncate">
              {currentAttachment.nombre_original}
            </h4>
            <p className="text-[11px] text-slate-400">
              {currentAttachment.subido_por_nombre ? `Subido por ${currentAttachment.subido_por_nombre} • ` : ''}
              {(currentAttachment.tamano_bytes / 1024).toFixed(1)} KB
              {attachments.length > 1 && ` • (${currentIndex + 1} de ${attachments.length})`}
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center space-x-2">
          {isImage && (
            <div className="hidden sm:flex items-center space-x-1 bg-slate-800/80 border border-slate-700/60 rounded-xl p-1 mr-2">
              <button
                type="button"
                onClick={handleZoomIn}
                title="Acercar (Zoom In)"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                title="Alejar (Zoom Out)"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                title="Girar 90°"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="Restablecer tamaño original"
                className="px-2 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                {Math.round(zoom * 100)}%
              </button>
            </div>
          )}

          <a
            href={fileUrl}
            download={currentAttachment.nombre_original}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-unalm-600 hover:bg-unalm-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Descargar</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors ml-2"
            title="Cerrar visor (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden select-none">
        {/* Prev Button */}
        {attachments.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-900/80 text-white border border-slate-700/80 hover:bg-unalm-600 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xl backdrop-blur-xs"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Content Display */}
        {isImage ? (
          <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
            <img
              src={fileUrl}
              alt={currentAttachment.nombre_original}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.15s ease-out',
              }}
              className="max-h-full max-w-full object-contain rounded-xl shadow-2xl origin-center"
            />
          </div>
        ) : isPdf ? (
          <div className="w-full h-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 flex flex-col">
            <iframe
              src={fileUrl}
              title={currentAttachment.nombre_original}
              className="w-full h-full border-none"
            />
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center max-w-md shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-slate-300">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">
                {currentAttachment.nombre_original}
              </h3>
              <p className="text-xs text-slate-400">
                Este tipo de archivo no admite previsualización directa en el navegador.
              </p>
            </div>
            <a
              href={fileUrl}
              download={currentAttachment.nombre_original}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-unalm-600 hover:bg-unalm-700 text-white rounded-xl text-xs font-bold shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Archivo Adjunto</span>
            </a>
          </div>
        )}

        {/* Next Button */}
        {attachments.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex === attachments.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-900/80 text-white border border-slate-700/80 hover:bg-unalm-600 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xl backdrop-blur-xs"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Footer Navigation Thumbnails */}
      {attachments.length > 1 && (
        <div className="px-6 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-center space-x-3 overflow-x-auto">
          {attachments.map((att, idx) => {
            const attUrl = getAssetUrl(`uploads/${att.nombre_guardado}`);
            const isAttImg = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(att.nombre_original);
            return (
              <button
                key={att.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setZoom(1);
                  setRotation(0);
                }}
                className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                  idx === currentIndex
                    ? 'border-unalm-500 scale-105 shadow-md shadow-unalm-500/20'
                    : 'border-slate-700 opacity-60 hover:opacity-100'
                }`}
              >
                {isAttImg ? (
                  <img src={attUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400 text-[10px] font-bold">
                    DOC
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
