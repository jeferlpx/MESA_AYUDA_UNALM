/**
 * Validador y Formateador de Telefonía Móvil para Perú (MTC / Osiptel - Nivel 1)
 * Reglas:
 * 1. Debe constar exactamente de 9 dígitos.
 * 2. Debe iniciar obligatoriamente con el dígito '9'.
 * 3. Admite prefijos +51 o 51, limpiándolos para formato nacional.
 * 4. Descarte de números falsos, repetitivos o secuencias ficticias obvias.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  cleanNumber: string; // Solo los 9 dígitos limpios
  formattedNumber: string; // Formato visual '9XX XXX XXX'
  error?: string;
}

// Patrones ficticios y secuencias comunes no válidas
const FORBIDDEN_PATTERNS = new Set([
  '999999999',
  '900000000',
  '911111111',
  '922222222',
  '933333333',
  '944444444',
  '955555555',
  '966666666',
  '977777777',
  '988888888',
  '987654321',
  '987654320',
  '912345678',
  '923456789',
  '901234567',
  '909090909',
  '919191919',
  '989898989',
  '912341234',
  '900000001',
]);

/**
 * Valida si un número celular cumple la estructura oficial peruana
 */
export function validatePeruvianPhone(input: string | undefined | null, isRequired = true): PhoneValidationResult {
  if (!input || !input.trim()) {
    if (!isRequired) {
      return { isValid: true, cleanNumber: '', formattedNumber: '' };
    }
    return {
      isValid: false,
      cleanNumber: '',
      formattedNumber: '',
      error: 'El número de celular es obligatorio.',
    };
  }

  // Extraer solo los números
  let digits = input.trim().replace(/\D/g, '');

  // Si tiene prefijo país Perú 51 al inicio y 11 dígitos, remover 51
  if (digits.startsWith('51') && digits.length === 11) {
    digits = digits.slice(2);
  }

  if (digits.length === 0) {
    return {
      isValid: false,
      cleanNumber: '',
      formattedNumber: '',
      error: 'Debe ingresar dígitos numéricos.',
    };
  }

  // En Perú los móviles siempre inician con 9
  if (!digits.startsWith('9')) {
    return {
      isValid: false,
      cleanNumber: digits,
      formattedNumber: formatPhoneDigits(digits),
      error: 'El celular debe iniciar con 9 (móviles Perú).',
    };
  }

  if (digits.length < 9) {
    return {
      isValid: false,
      cleanNumber: digits,
      formattedNumber: formatPhoneDigits(digits),
      error: `Número incompleto: faltan ${9 - digits.length} dígito(s).`,
    };
  }

  if (digits.length > 9) {
    return {
      isValid: false,
      cleanNumber: digits.slice(0, 9),
      formattedNumber: formatPhoneDigits(digits.slice(0, 9)),
      error: 'El número no debe exceder los 9 dígitos.',
    };
  }

  // Comprobar patrones falsos conocidos
  if (FORBIDDEN_PATTERNS.has(digits)) {
    return {
      isValid: false,
      cleanNumber: digits,
      formattedNumber: formatPhoneDigits(digits),
      error: 'Número no auténtico: secuencia ficticia o repetitiva detectada.',
    };
  }

  // Detectar secuencias de más de 5 dígitos consecutivos iguales (ej: 988888812)
  if (/(\d)\1{4,}/.test(digits)) {
    return {
      isValid: false,
      cleanNumber: digits,
      formattedNumber: formatPhoneDigits(digits),
      error: 'Número no válido: demasiados dígitos repetidos consecutivamente.',
    };
  }

  return {
    isValid: true,
    cleanNumber: digits,
    formattedNumber: formatPhoneDigits(digits),
  };
}

/**
 * Formatea una cadena de números al formato estándar '9XX XXX XXX'
 */
export function formatPhoneDigits(digits: string): string {
  const clean = digits.replace(/\D/g, '').slice(0, 9);
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)}`;
}

/**
 * Limpia y auto-formatea el valor mientras el usuario tipea en un input
 */
export function handlePhoneInputChange(value: string): string {
  // Extraer solo dígitos y limitar a 9
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('51') && digits.length > 9) {
    digits = digits.slice(2);
  }
  digits = digits.slice(0, 9);
  return formatPhoneDigits(digits);
}
