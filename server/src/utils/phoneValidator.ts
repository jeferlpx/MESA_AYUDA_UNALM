/**
 * Validador de Telefonía Móvil para Perú (MTC / Osiptel - Backend)
 */

export interface PhoneValidationResult {
  isValid: boolean;
  cleanNumber: string;
  formattedNumber: string;
  error?: string;
}

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

  let digits = input.trim().replace(/\D/g, '');

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

  if (!digits.startsWith('9')) {
    return {
      isValid: false,
      cleanNumber: digits,
      formattedNumber: formatPhoneDigits(digits),
      error: 'El número móvil debe iniciar obligatoriamente con el dígito 9 (Perú).',
    };
  }

  if (digits.length !== 9) {
    return {
      isValid: false,
      cleanNumber: digits,
      formattedNumber: formatPhoneDigits(digits),
      error: `El número de celular debe tener exactamente 9 dígitos (ingresados: ${digits.length}).`,
    };
  }

  if (FORBIDDEN_PATTERNS.has(digits)) {
    return {
      isValid: false,
      cleanNumber: digits,
      formattedNumber: formatPhoneDigits(digits),
      error: 'El número de celular ingresado no es auténtico (secuencia repetitiva o ficticia detectada).',
    };
  }

  if (/(\d)\1{4,}/.test(digits)) {
    return {
      isValid: false,
      cleanNumber: digits,
      formattedNumber: formatPhoneDigits(digits),
      error: 'El número de celular contiene demasiados dígitos idénticos consecutivos.',
    };
  }

  return {
    isValid: true,
    cleanNumber: digits,
    formattedNumber: formatPhoneDigits(digits),
  };
}

export function formatPhoneDigits(digits: string): string {
  const clean = digits.replace(/\D/g, '').slice(0, 9);
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)}`;
}
