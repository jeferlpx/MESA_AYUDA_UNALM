import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const env = {
  PORT: process.env.PORT || '4000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_PREFIX: process.env.API_PREFIX || '/api',
  
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASS: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'mesaayuda_db',
  DB_CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT || '20', 10),

  JWT_SECRET: process.env.JWT_SECRET || 'secret_key_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
  MAX_FILE_SIZE_BYTES: parseInt(process.env.MAX_FILE_SIZE_BYTES || '26214400', 10), // 25MB (25 * 1024 * 1024)

  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || '*',

  // Configuración SMTP para Notificaciones por Correo
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || '"Mesa de Ayuda OTIC UNALM" <mesadeayuda.otic@lamolina.edu.pe>',
  MESA_AYUDA_EMAIL: process.env.MESA_AYUDA_EMAIL || 'mesaayuda.otic@lamolina.edu.pe',
  APP_URL: process.env.APP_URL || 'https://www.lamolina.edu.pe/pruebas1/david/mesa_ayuda',

  // Configuración Directorio Activo (Active Directory / LDAP - UNALM)
  LDAP_ENABLED: process.env.LDAP_ENABLED !== 'false',
  LDAP_URL: process.env.LDAP_URL || '',
  LDAP_BASE_DN: process.env.LDAP_BASE_DN || 'DC=lamolina,DC=edu,DC=pe',
  LDAP_DOMAIN: process.env.LDAP_DOMAIN || 'lamolina.edu.pe',
  LDAP_BIND_DN: process.env.LDAP_BIND_DN || '',
  LDAP_BIND_PASSWORD: process.env.LDAP_BIND_PASSWORD || '',
  LDAP_TIMEOUT_MS: parseInt(process.env.LDAP_TIMEOUT_MS || '5000', 10),
};
