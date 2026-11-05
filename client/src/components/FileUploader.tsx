import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, Sparkles, Plus, Image as ImageIcon, Camera, Paperclip } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

export interface FileItemInfo {
  file: File;
  originalKB?: number;
  compressedKB?: number;
}

interface FileUploaderProps {
  // Soporte para archivos múltiples (nuevo)
  files?: File[];
  onFilesChange?: (files: File[]) => void;

  // Compatibilidad hacia atrás (un solo archivo)
  onFileSelect?: (file: File | null) => void;
  selectedFile?: File | null;

  acceptedFormats?: string;
  maxSizeBytes?: number;
  maxFiles?: number;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  files,
  onFilesChange,
  onFileSelect,
  selectedFile,
  acceptedFormats = '.pdf,.jpg,.jpeg,.png,.webp,.docx',
  maxSizeBytes = 26214400, // 25MB (25 * 1024 * 1024)
  maxFiles = 5,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionMap, setCompressionMap] = useState<Record<string, { originalKB: number; compressedKB: number }>>({});
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Lista normalizada de archivos
  const currentFiles: File[] = files !== undefined
    ? files
    : (selectedFile ? [selectedFile] : []);

  const updateFiles = (newFiles: File[]) => {
    if (onFilesChange) {
      onFilesChange(newFiles);
    }
    if (onFileSelect) {
      onFileSelect(newFiles.length > 0 ? newFiles[0] : null);
    }
  };

  const processSingleFile = async (rawFile: File): Promise<{ file: File; info?: { originalKB: number; compressedKB: number } }> => {
    if (rawFile.size > maxSizeBytes) {
      throw new Error(`"${rawFile.name}" supera el límite de ${Math.round(maxSizeBytes / 1024 / 1024)}MB`);
    }

    const ext = `.${rawFile.name.split('.').pop()?.toLowerCase()}`;
    if (!acceptedFormats.includes(ext) && !rawFile.type.startsWith('image/')) {
      throw new Error(`Formato no permitido en "${rawFile.name}". Use: ${acceptedFormats}`);
    }

    if (rawFile.type.startsWith('image/')) {
      try {
        const result = await compressImage(rawFile, { maxWidth: 1920, maxHeight: 1920 });
        if (result.compressed) {
          return {
            file: result.file,
            info: {
              originalKB: Math.round(result.originalSize / 1024),
              compressedKB: Math.round(result.compressedSize / 1024),
            },
          };
        }
        return { file: result.file };
      } catch (err) {
        console.warn('Compresión falló para', rawFile.name, err);
        return { file: rawFile };
      }
    }

    return { file: rawFile };
  };

  const handleFilesList = async (incomingFiles: FileList | File[]) => {
    setError(null);
    const filesArray = Array.from(incomingFiles);

    if (currentFiles.length + filesArray.length > maxFiles) {
      setError(`Solo se permite adjuntar hasta un máximo de ${maxFiles} archivos por solicitud.`);
      return;
    }

    setIsCompressing(true);
    const processedFiles: File[] = [];
    const newCompressionMap = { ...compressionMap };

    try {
      for (const f of filesArray) {
        // Evitar duplicados por nombre y tamaño exacto
        const exists = currentFiles.some((cf) => cf.name === f.name && cf.size === f.size);
        if (exists) continue;

        try {
          const res = await processSingleFile(f);
          processedFiles.push(res.file);
          if (res.info) {
            newCompressionMap[res.file.name] = res.info;
          }
        } catch (e: any) {
          setError(e.message || 'Error al procesar archivo');
        }
      }

      setCompressionMap(newCompressionMap);
      if (processedFiles.length > 0) {
        updateFiles([...currentFiles, ...processedFiles]);
      }
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesList(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const fileToRemove = currentFiles[indexToRemove];
    if (fileToRemove) {
      const nextCompressionMap = { ...compressionMap };
      delete nextCompressionMap[fileToRemove.name];
      setCompressionMap(nextCompressionMap);
    }
    const updated = currentFiles.filter((_, idx) => idx !== indexToRemove);
    updateFiles(updated);
  };

  return (
    <div className="w-full space-y-2.5">
      {/* Input general para documentos y galería */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        className="hidden"
        accept={acceptedFormats}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesList(e.target.files);
          }
        }}
      />

      {/* Input directo de cámara móvil (dispara la cámara nativa en smartphones) */}
      <input
        type="file"
        ref={cameraInputRef}
        capture="environment"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesList(e.target.files);
          }
        }}
      />

      {/* Botones de acción rápida móviles y de escritorio */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isCompressing || currentFiles.length >= maxFiles}
          className="px-3 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-sm shadow-emerald-950/20 transition-all flex items-center justify-center space-x-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
          title="Tomar foto con la cámara del dispositivo"
        >
          <Camera className="w-4 h-4 shrink-0 text-emerald-100" />
          <span className="truncate">Tomar foto evidencia</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isCompressing || currentFiles.length >= maxFiles}
          className="px-3 py-2 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold border border-slate-300/80 dark:border-slate-700 transition-all flex items-center justify-center space-x-1.5 active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs"
          title="Examinar fotos o documentos en el dispositivo"
        >
          <Paperclip className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" />
          <span className="truncate">Adjuntar evidencia</span>
        </button>
      </div>

      {/* Drop zone inicial estilizada con Modo Oscuro de Alta Fidelidad */}
      {currentFiles.length === 0 ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-3 sm:py-3.5 sm:px-4 cursor-pointer transition-all flex items-center justify-between gap-3 ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 scale-[0.99]'
              : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/70 dark:bg-slate-900/90 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/80 shrink-0 shadow-2xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {isCompressing ? (
                  <span className="text-emerald-600 dark:text-emerald-400 animate-pulse flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 animate-spin inline mr-1" />
                    <span>Optimizando y comprimiendo archivos...</span>
                  </span>
                ) : (
                  <>
                    Arrastre sus archivos aquí o <span className="text-emerald-600 dark:text-emerald-400 underline">examine en su equipo</span>
                  </>
                )}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                Fotos o documentos: PDF, JPG, PNG, DOCX (Hasta {maxFiles} archivos, 25MB c/u)
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block shrink-0 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors">
            Examinar
          </span>
        </div>
      ) : (
        /* Lista de archivos adjuntos */
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>
              Archivos Adjuntos ({currentFiles.length}/{maxFiles})
            </span>
            {currentFiles.length < maxFiles && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                Puede adjuntar hasta {maxFiles - currentFiles.length} más
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2">
            {currentFiles.map((file, idx) => {
              const compInfo = compressionMap[file.name];
              const isImg = file.type.startsWith('image/');
              return (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between p-2.5 sm:p-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs hover:border-emerald-500/50 transition-colors"
                >
                  <div className="flex items-center space-x-3 truncate min-w-0">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shrink-0">
                      {isImg ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <div className="truncate min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{file.name}</p>
                        {compInfo && (
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                            <Sparkles className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Optimizado (-{Math.round((1 - compInfo.compressedKB / compInfo.originalKB) * 100)}%)</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {compInfo ? (
                          <>
                            <span className="line-through text-slate-400 dark:text-slate-500">{compInfo.originalKB} KB</span>
                            {' → '}
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">{compInfo.compressedKB} KB</span>
                          </>
                        ) : (
                          `${(file.size / 1024).toFixed(1)} KB`
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0 ml-2 cursor-pointer"
                    title="Eliminar este archivo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">{error}</p>}
    </div>
  );
};
