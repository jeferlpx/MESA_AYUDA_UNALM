import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, Sparkles, Plus, Image as ImageIcon } from 'lucide-react';
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
  maxSizeBytes = 10485760, // 10MB
  maxFiles = 5,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionMap, setCompressionMap] = useState<Record<string, { originalKB: number; compressedKB: number }>>({});
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const result = await compressImage(rawFile, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });
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
    <div className="w-full space-y-3">
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

      {/* Drop zone inicial si no hay archivos */}
      {currentFiles.length === 0 ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-unalm-600 bg-unalm-50/80 scale-[0.99]'
              : 'border-slate-300 hover:border-unalm-500 bg-slate-50/50 hover:bg-slate-100/50 shadow-2xs'
          }`}
        >
          <div className="mx-auto w-12 h-12 rounded-2xl bg-unalm-100/80 flex items-center justify-center text-unalm-600 mb-3 shadow-xs">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">
            {isCompressing ? (
              <span className="text-unalm-600 animate-pulse">Optimizando y comprimiendo archivos...</span>
            ) : (
              <>
                Arrastre sus archivos aquí o <span className="text-unalm-600 underline">examine en su equipo</span>
              </>
            )}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Permite subir múltiples fotos/documentos: PDF, JPG, PNG, DOCX (Hasta {maxFiles} archivos, 10MB c/u)
          </p>
        </div>
      ) : (
        /* Lista de archivos adjuntos */
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Archivos Adjuntos ({currentFiles.length}/{maxFiles})
            </span>
            {currentFiles.length < maxFiles && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                className="inline-flex items-center space-x-1 text-xs font-bold text-unalm-700 hover:text-unalm-900 bg-unalm-50 hover:bg-unalm-100 border border-unalm-200 px-3 py-1 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Adjuntar otro archivo</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2">
            {currentFiles.map((file, idx) => {
              const compInfo = compressionMap[file.name];
              const isImg = file.type.startsWith('image/');
              return (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-unalm-300 transition-colors"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className="p-2 rounded-xl bg-unalm-50 text-unalm-700 border border-unalm-200 shrink-0">
                      {isImg ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center space-x-2">
                        <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                        {compInfo && (
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Optimizado (-{Math.round((1 - compInfo.compressedKB / compInfo.originalKB) * 100)}%)</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {compInfo ? (
                          <>
                            <span className="line-through text-slate-400">{compInfo.originalKB} KB</span>
                            {' → '}
                            <span className="font-bold text-emerald-700">{compInfo.compressedKB} KB</span>
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
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 ml-2"
                    title="Eliminar este archivo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {currentFiles.length < maxFiles && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-xl p-3 text-center cursor-pointer transition-all text-xs font-semibold ${
                isDragging
                  ? 'border-unalm-600 bg-unalm-50/80'
                  : 'border-slate-300 hover:border-unalm-400 bg-slate-50/40 text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="text-unalm-700 font-bold">+ Arrastre más fotos/archivos aquí o haga clic para agregar</span>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-rose-600 font-bold">{error}</p>}
    </div>
  );
};
