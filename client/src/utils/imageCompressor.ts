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
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    maxSizeBytes = 300 * 1024, // Si pesa menos de 300KB y es razonable, no comprimir agresivamente
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

  // Si el archivo ya es muy pequeño (ej. < 150KB), no es necesario comprimir
  if (file.size <= 150 * 1024) {
    return {
      file,
      compressed: false,
      originalSize: file.size,
      compressedSize: file.size,
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calcular nueva escala manteniendo la proporción original
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

        // Suavizado de imagen de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a JPEG o WebP
        const outputMime = file.type === 'image/png' && file.size > 2 * 1024 * 1024 ? 'image/jpeg' : (file.type || 'image/jpeg');

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
