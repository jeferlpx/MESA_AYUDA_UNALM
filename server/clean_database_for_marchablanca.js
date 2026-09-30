const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const PRESERVED_EMAILS = [
  'admin.otic@lamolina.edu.pe',
  'soporte@lamolina.edu.pe',
  'mesa.sg@lamolina.edu.pe',
  '20220145@lamolina.edu.pe',
  'tecnico.redes@lamolina.edu.pe',
  'tecnico.electricidad@lamolina.edu.pe'
];

async function runCleanup() {
  console.log('--- INICIANDO LIMPIEZA TOTAL DE BASE DE DATOS (MARCHA BLANCA) ---');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Limpiar tickets y sus tablas relacionadas
    console.log('1. Vaciando tablas de tickets y movimientos...');
    const tablesToTruncate = [
      'adjuntos',
      'comentarios_ticket',
      'encuestas_satisfaccion',
      'logs_auditoria',
      'hallazgos_inspeccion',
      'inspecciones_infraestructura',
      'materiales_movimientos_sg',
      'tickets'
    ];

    for (const table of tablesToTruncate) {
      await conn.query(`TRUNCATE TABLE \`${table}\``);
      console.log(`   ✓ Tabla \`${table}\` vaciada y correlativo reiniciado.`);
    }

    // 2. Limpiar usuarios no esenciales
    console.log('2. Limpiando usuarios de prueba y conservando únicamente los indispensables...');
    const placeholders = PRESERVED_EMAILS.map(() => '?').join(', ');
    const [delResult] = await conn.query(
      `DELETE FROM usuarios WHERE email NOT IN (${placeholders})`,
      PRESERVED_EMAILS
    );
    console.log(`   ✓ ${delResult.affectedRows} usuarios no esenciales eliminados.`);

    // 3. Asegurar estado ACTIVO para los 6 indispensables
    await conn.query(
      `UPDATE usuarios SET estado = 'ACTIVO' WHERE email IN (${placeholders})`,
      PRESERVED_EMAILS
    );

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    // 4. Limpieza de archivos adjuntos huérfanos en server/uploads
    console.log('3. Limpiando archivos físicos de uploads de tickets...');
    const uploadsDir = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const [usersPhotos] = await conn.query('SELECT foto_perfil FROM usuarios WHERE foto_perfil IS NOT NULL');
      const activePhotos = usersPhotos.map(u => path.basename(u.foto_perfil));

      const files = fs.readdirSync(uploadsDir);
      let deletedFilesCount = 0;
      for (const file of files) {
        if (!activePhotos.includes(file) && file !== '.gitkeep') {
          try {
            fs.unlinkSync(path.join(uploadsDir, file));
            deletedFilesCount++;
          } catch (e) {
            // ignore
          }
        }
      }
      console.log(`   ✓ ${deletedFilesCount} archivos huérfanos eliminados de uploads/ (conservados avatares activos: ${activePhotos.join(', ')})`);
    }

    // 5. Reporte de estado actual
    console.log('\n--- RESUMEN FINAL DE BASE DE DATOS ---');
    const [allTables] = await conn.query('SHOW TABLES');
    for (const t of allTables) {
      const tableName = Object.values(t)[0];
      const [count] = await conn.query(`SELECT COUNT(*) as c FROM \`${tableName}\``);
      console.log(`   - ${tableName.padEnd(30)}: ${count[0].c} registros`);
    }

    console.log('\n--- USUARIOS CONSERVADOS EN EL SISTEMA ---');
    const [remainingUsers] = await conn.query(`
      SELECT u.id, u.nombres, u.apellidos, u.email, r.codigo as rol, u.estado
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      ORDER BY u.id ASC
    `);
    console.table(remainingUsers);

    console.log('¡LIMPIEZA COMPLETADA CON ÉXITO!');
  } catch (err) {
    console.error('ERROR DURANTE LA LIMPIEZA:', err);
  } finally {
    await conn.end();
  }
}

runCleanup();
