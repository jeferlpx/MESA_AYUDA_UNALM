const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ESSENTIAL_EMAILS = [
  'admin.otic@lamolina.edu.pe',
  'soporte@lamolina.edu.pe',
  'mesa.sg@lamolina.edu.pe',
  '20220145@lamolina.edu.pe',
  'tecnico.redes@lamolina.edu.pe',
  'tecnico.electricidad@lamolina.edu.pe'
];

async function runImport() {
  console.log('--- INICIANDO IMPORTACIÓN MASIVA DE USUARIOS UNALM ---');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mesaayuda_db',
  });

  console.log('✓ Conexión establecida con MySQL');

  // Pre-calcular hash para '123456'
  const defaultPasswordHash = bcrypt.hashSync('123456', 10);
  console.log('✓ Hash generado para contraseña por defecto: 123456');

  // Leer CSV
  const csvPath = path.join(__dirname, 'usuarios_import.csv');
  const csvRaw = fs.readFileSync(csvPath, 'utf8');
  const lines = csvRaw.split(/\r?\n/).filter(line => line.trim().length > 0);

  console.log(`✓ Total de líneas en archivo CSV: ${lines.length}`);
  const header = lines[0];
  console.log(`Encabezado: ${header}`);

  const processedEmails = new Set();
  // Obtener correos existentes en la base de datos
  const [existingUsers] = await connection.query('SELECT id, email, rol_id FROM usuarios');
  for (const u of existingUsers) {
    processedEmails.add(u.email.toLowerCase().trim());
  }
  console.log(`✓ Usuarios actualmente en la BD: ${existingUsers.length}`);

  let insertedCount = 0;
  let updatedCount = 0;
  let skippedEssential = 0;
  let missingEmailCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cols = line.split(';').map(c => c.trim());
    if (cols.length < 3) continue;

    const rawNombreCompleto = cols[0] || '';
    const rawCargo = cols[1] || '';
    let rawEmail = cols[2] || '';
    const organoPadre = cols[3] || '';
    const organoHijo = cols[4] || '';

    // Manejar correo
    let email = '';
    let correoPendiente = 0;

    if (!rawEmail || rawEmail.toUpperCase() === '#N/D' || !rawEmail.includes('@')) {
      email = `sin_correo_${i}@lamolina.edu.pe`;
      correoPendiente = 1;
      missingEmailCount++;
    } else {
      email = rawEmail.toLowerCase().trim();
      correoPendiente = 0;
    }

    // Dependencia
    let facultadDependencia = '';
    if (!organoPadre || organoPadre.toUpperCase() === '#N/D') {
      facultadDependencia = '#N/D';
    } else if (!organoHijo || organoHijo.toUpperCase() === '#N/D' || organoHijo.toUpperCase() === organoPadre.toUpperCase()) {
      facultadDependencia = organoPadre;
    } else {
      facultadDependencia = `${organoPadre} - ${organoHijo}`;
    }

    // Parse nombres y apellidos
    const parts = rawNombreCompleto.split(/\s+/).filter(Boolean);
    let apellidos = '-';
    let nombres = rawNombreCompleto;
    if (parts.length >= 3) {
      apellidos = parts.slice(0, 2).join(' ');
      nombres = parts.slice(2).join(' ');
    } else if (parts.length === 2) {
      apellidos = parts[0];
      nombres = parts[1];
    }

    const cargo = rawCargo || 'Comunidad UNALM';

    // Si es uno de los 6 usuarios indispensables, proteger rol y password
    if (ESSENTIAL_EMAILS.includes(email)) {
      console.log(`[Seguridad] Correo indispensable preservado: ${email}`);
      await connection.query(
        `UPDATE usuarios SET cargo = ?, facultad_dependencia = ? WHERE email = ?`,
        [cargo, facultadDependencia, email]
      );
      skippedEssential++;
      continue;
    }

    // Si el correo ya existe en la BD o en esta tanda (duplicado en CSV)
    if (processedEmails.has(email)) {
      // Actualizar datos pero no duplicar
      await connection.query(
        `UPDATE usuarios 
         SET cargo = ?, facultad_dependencia = ?
         WHERE email = ?`,
        [cargo, facultadDependencia, email]
      );
      updatedCount++;
      continue;
    }

    // Insertar nuevo usuario solicitante
    await connection.query(
      `INSERT INTO usuarios 
        (nombres, apellidos, email, password_hash, rol_id, facultad_dependencia, cargo, estado, debe_cambiar_password, correo_pendiente, creado_en)
       VALUES (?, ?, ?, ?, 4, ?, ?, 'ACTIVO', 1, ?, NOW())`,
      [
        nombres,
        apellidos,
        email,
        defaultPasswordHash,
        facultadDependencia,
        cargo,
        correoPendiente
      ]
    );

    processedEmails.add(email);
    insertedCount++;
  }

  const [totalUsers] = await connection.query('SELECT COUNT(*) as total FROM usuarios');

  console.log('====================================================');
  console.log(`✓ IMPORTACIÓN COMPLETADA CON ÉXITO:`);
  console.log(`  - Nuevos usuarios insertados: ${insertedCount}`);
  console.log(`  - Usuarios actualizados: ${updatedCount}`);
  console.log(`  - Usuarios indispensables preservados: ${skippedEssential}`);
  console.log(`  - Usuarios con correo pendiente (#N/D): ${missingEmailCount}`);
  console.log(`  - Total de usuarios registrados en MySQL: ${totalUsers[0].total}`);
  console.log('====================================================');

  await connection.end();
}

runImport().catch(err => {
  console.error('Error durante la importación masiva:', err);
  process.exit(1);
});
