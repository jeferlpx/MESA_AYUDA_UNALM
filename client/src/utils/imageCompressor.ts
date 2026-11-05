/**
 * Utilidad de compresión y optimización de imágenes en el cliente (Browser Canvas API)
 * Reduce el peso de fotos tomadas desde smartphones (5MB-15MB) a ~200-450KB manteniendo
 * alta nitidez y legibilidad de textos, diagramas y capturas de pantalla.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeBytes?: number;
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<{ file: File; compressed: boolean; originalSize: number; compressedSize: number }> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality: userQuality,
  } = options;

  // Si no es un tipo de imagen comprimible (e.g. PDF, DOCX), devolver el archivo original
  if (!file.type.startsWith('image/') || file.type.includes('svg')) {
    return {
      file,
      compressed: false,
      originalSize: file.size,
      compressedSize: file.size,
    };
  }

  // Si el archivo ya es muy pequeño (ej. < 120KB), no es necesario recomprimir
  if (file.size <= 120 * 1024) {
    return {
      file,
      compressed: false,
      originalSize: file.size,
      compressedSize: file.size,
    };
  }

  // Calidad inteligente adaptativa (estilo WhatsApp)
  let quality = userQuality;
  if (!quality) {
    if (file.size > 10 * 1024 * 1024) {
      quality = 0.80; // Fotos muy pesadas (>10MB de smartphones)
    } else if (file.size > 4 * 1024 * 1024) {
      quality = 0.82; // Fotos de 4MB a 10MB
    } else if (file.size > 1 * 1024 * 1024) {
      quality = 0.84; // Fotos de 1MB a 4MB
    } else {
      quality = 0.86; // Fotos ligeras
    }
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calcular nueva escala manteniendo la proporción original (Full HD estándar WhatsApp)
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({
            file,
            compressed: false,
            originalSize: file.size,
            compressedSize: file.size,
          });
        }

        // Suavizado bicúbico de imagen de alta fidelidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a JPEG optimizado si es PNG pesado o JPG/WebP
        const isPngHeavy = file.type === 'image/png' && file.size > 1.5 * 1024 * 1024;
        const outputMime = isPngHeavy ? 'image/jpeg' : (file.type || 'image/jpeg');

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // Si la compresión no redujo el peso, conservar el archivo original
              return resolve({
                file,
                compressed: false,
                originalSize: file.size,
                compressedSize: file.size,
              });
            }

            const newFileName = file.name.replace(/\.[^/.]+$/, outputMime === 'image/jpeg' ? '.jpg' : '$&');
            const compressedFile = new File([blob], newFileName, {
              type: outputMime,
              lastModified: Date.now(),
            });

            resolve({
              file: compressedFile,
              compressed: true,
              originalSize: file.size,
              compressedSize: compressedFile.size,
            });
          },
          outputMime,
          quality
        );
      };

      img.onerror = () => {
        resolve({
          file,
          compressed: false,
          originalSize: file.size,
          compressedSize: file.size,
        });
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      resolve({
        file,
        compressed: false,
        originalSize: file.size,
        compressedSize: file.size,
      });
    };

    reader.readAsDataURL(file);
  });
}
