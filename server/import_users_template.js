/**
 * SCRIPT DE IMPORTACIÓN MASIVA DE USUARIOS (1,300 USUARIOS)
 * Mesa de Ayuda OTIC & Servicios Generales - UNALM
 * 
 * Uso:
 * 1. Colocar el archivo con la data en 'server/users_data.json' o 'server/users_data.csv'
 * 2. Ejecutar: node import_users_template.js
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const DEFAULT_PASSWORD = 'Unalm2026$';

// Mapeo de tipo de usuario institucional a rol en la base de datos
function mapUserTypeToRoleId(tipo) {
  const t = String(tipo || '').toLowerCase().trim();
  if (t.includes('admin') || t.includes('director')) return 1; // ADMIN
  if (t.includes('supervisor')) return 2; // SUPERVISOR
  if (t.includes('técnico') || t.includes('tecnico') || t.includes('especialista')) return 3; // TECNICO
  if (t.includes('mesa')) return 5; // MESA_AYUDA
  return 4; // Por defecto: SOLICITANTE (Docentes, Alumnos, Administrativos)
}

function parseFullName(rawName) {
  if (!rawName) return { nombres: 'Usuario', apellidos: '-' };
  const parts = rawName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { nombres: parts[0], apellidos: '-' };
  } else if (parts.length === 2) {
    return { nombres: parts[0], apellidos: parts[1] };
  } else if (parts.length === 3) {
    return { nombres: parts[0], apellidos: `${parts[1]} ${parts[2]}` };
  } else {
    return {
      nombres: parts.slice(0, 2).join(' '),
      apellidos: parts.slice(2).join(' ')
    };
  }
}

async function runImport() {
  console.log('===============================================================');
  console.log(' 🚀 IMPORTACIÓN MASIVA DE USUARIOS - MESA DE AYUDA UNALM');
  console.log('===============================================================');

  const jsonFile = path.join(__dirname, 'users_data.json');
  const csvFile = path.join(__dirname, 'users_data.csv');

  let rawList = [];

  if (fs.existsSync(jsonFile)) {
    console.log(`[+] Leyendo archivo JSON: ${jsonFile}`);
    rawList = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  } else if (fs.existsSync(csvFile)) {
    console.log(`[+] Leyendo archivo CSV: ${csvFile}`);
    const content = fs.readFileSync(csvFile, 'utf8');
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length >= 3) {
        rawList.push({
          nombreApellido: cols[0],
          tipoUsuario: cols[1],
          correo: cols[2],
          dondeLabora: cols[3] || 'UNALM'
        });
      }
    }
  } else {
    console.log('ℹ️ Para importar los 1,300 usuarios:');
    console.log('   Crea el archivo "users_data.json" o "users_data.csv" con la siguiente estructura:');
    console.log('   - JSON: [{ "nombreApellido": "...", "tipoUsuario": "...", "correo": "...@lamolina.edu.pe", "dondeLabora": "..." }]');
    console.log('   - CSV:  Nombre y Apellido,Tipo de Usuario,Correo Institucional,Donde Labora');
    return;
  }

  console.log(`[+] Registros detectados para procesar: ${rawList.length}`);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    const defaultHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (const item of rawList) {
      try {
        const rawName = item.nombreApellido || item.nombre_apellido || item.nombres || item.name || '';
        const { nombres, apellidos } = parseFullName(rawName);
        const email = String(item.correo || item.email || '').trim().toLowerCase();
        const tipoUsuario = item.tipoUsuario || item.tipo || item.tipo_usuario || 'Personal';
        const dependencia = item.dondeLabora || item.dependencia || item.facultad || 'UNALM';
        const facultadConTipo = `${dependencia} (${tipoUsuario})`;
        const rolId = mapUserTypeToRoleId(tipoUsuario);

        if (!email || !email.includes('@')) {
          errors++;
          continue;
        }

        const [existing] = await conn.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existing.length > 0) {
          await conn.query(
            `UPDATE usuarios 
             SET nombres = ?, apellidos = ?, facultad_dependencia = ?, rol_id = ?, estado = 'ACTIVO'
             WHERE id = ?`,
            [nombres, apellidos, facultadConTipo, rolId, existing[0].id]
          );
          updated++;
        } else {
          await conn.query(
            `INSERT INTO usuarios (nombres, apellidos, email, password_hash, rol_id, facultad_dependencia, estado)
             VALUES (?, ?, ?, ?, ?, ?, 'ACTIVO')`,
            [nombres, apellidos, email, defaultHash, rolId, facultadConTipo]
          );
          inserted++;
        }
      } catch (errRow) {
        errors++;
      }
    }

    console.log('\n--- RESULTADO DE LA IMPORTACIÓN ---');
    console.log(`✓ Nuevos usuarios registrados : ${inserted}`);
    console.log(`✓ Usuarios existentes actualizados : ${updated}`);
    console.log(`⚠️ Registros omitidos/errores     : ${errors}`);
    console.log(`Clave de acceso predeterminada    : ${DEFAULT_PASSWORD}`);
    console.log('===============================================================');
  } catch (error) {
    console.error('Error general en la importación:', error);
  } finally {
    await conn.end();
  }
}

if (require.main === module) {
  runImport();
}

module.exports = { runImport, parseFullName, mapUserTypeToRoleId };
