const { Client } = require('ldapts');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function syncLdapUsers() {
  console.log('--- 1. Conectando con Active Directory (ldaps://172.16.0.8:636) ---');
  const client = new Client({
    url: process.env.LDAP_URL || 'ldaps://172.16.0.8:636',
    timeout: 15000,
    tlsOptions: { rejectUnauthorized: false }
  });

  const bindDn = process.env.LDAP_BIND_DN || 'mesadeayuda@lamolina.edu.pe';
  const bindPass = process.env.LDAP_BIND_PASSWORD || '@Unalm%2026#';

  await client.bind(bindDn, bindPass);
  console.log('✓ Bind con Active Directory exitoso.');

  const res = await client.search(process.env.LDAP_BASE_DN || 'DC=lamolina,DC=edu,DC=pe', {
    scope: 'sub',
    filter: '(&(objectCategory=person)(objectClass=user))',
    paged: { pageSize: 500 }
  });

  await client.unbind();
  console.log(`✓ Total cuentas encontradas en Active Directory: ${res.searchEntries.length}`);

  const adUsers = [];
  for (const entry of res.searchEntries) {
    const sAM = entry.sAMAccountName ? String(entry.sAMAccountName).trim() : '';
    if (!sAM || ['Sysadmin', 'Invitado', 'krbtgt'].includes(sAM) || sAM.startsWith('$')) continue;

    const upn = entry.userPrincipalName ? String(entry.userPrincipalName).trim() : (sAM + '@lamolina.edu.pe');
    const mail = (entry.mail ? String(entry.mail).trim() : upn).toLowerCase();
    const displayName = entry.displayName ? String(entry.displayName).trim() : (entry.cn ? String(entry.cn).trim() : sAM);
    const givenName = entry.givenName ? String(entry.givenName).trim() : '';
    const sn = entry.sn ? String(entry.sn).trim() : '';
    const dn = entry.dn || '';

    // Extraer jerarquía organizacional de las OU
    const ouMatches = dn.match(/OU=([^,]+)/g);
    const dependencia = ouMatches ? ouMatches.map(m => m.replace('OU=', '')).reverse().join(' - ') : 'UNALM';
    const cargo = entry.description ? String(entry.description).trim() : (entry.title ? String(entry.title).trim() : 'Personal Institucional');
    const telefono = entry.telephoneNumber ? String(entry.telephoneNumber).trim() : null;

    adUsers.push({
      sAMAccountName: sAM,
      email: mail,
      nombres: givenName || displayName,
      apellidos: sn || '(UNALM)',
      facultadDependencia: dependencia,
      cargo,
      telefono
    });
  }

  console.log(`✓ Usuarios institucionales válidos mapeados desde AD: ${adUsers.length}`);
  const adEmails = new Set(adUsers.map(u => u.email.toLowerCase()));

  // Conexión a Base de Datos
  console.log('--- 2. Conectando a Base de Datos MySQL Centralizada ---');
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: process.env.DB_NAME
  });
  console.log('✓ Conexión a Base de Datos establecida.');

  // Obtener IDs de usuarios con referencias foráneas (tickets, logs, etc.)
  const referencedTables = [
    { table: 'tickets', col: 'solicitante_id' },
    { table: 'tickets', col: 'tecnico_id' },
    { table: 'adjuntos', col: 'subido_por_id' },
    { table: 'categorias_servicio', col: 'tecnico_defecto_id' },
    { table: 'comentarios_ticket', col: 'usuario_id' },
    { table: 'logs_auditoria', col: 'usuario_id' },
    { table: 'ticket_tecnicos', col: 'tecnico_id' }
  ];

  const referencedIds = new Set();
  for (const t of referencedTables) {
    try {
      const [rows] = await db.query(`SELECT DISTINCT ${t.col} as uid FROM ${t.table} WHERE ${t.col} IS NOT NULL`);
      for (const r of rows) referencedIds.add(r.uid);
    } catch (e) {
      // Ignorar si la tabla no existe
    }
  }

  console.log(`✓ IDs con historial en el sistema (protegidos contra eliminación): ${referencedIds.size}`);

  // Cuentas de staff indispensables para administración y marcha blanca
  const staffProtectedEmails = new Set([
    'admin@lamolina.edu.pe',
    'admin',
    'admin.otic@lamolina.edu.pe',
    'supervisor.otic@lamolina.edu.pe',
    'soporte@lamolina.edu.pe',
    'mesa.sg@lamolina.edu.pe',
    'tecnico.redes@lamolina.edu.pe',
    'tecnico.electricidad@lamolina.edu.pe'
  ]);

  // 3. Eliminar usuarios de prueba que NO están en AD y NO tienen tickets
  console.log('--- 3. Depuración de usuarios de prueba pre-registrados ---');
  const [currentUsers] = await db.query('SELECT id, email, rol_id FROM usuarios');
  let deletedCount = 0;
  let inactivedCount = 0;

  for (const cu of currentUsers) {
    const emailLower = (cu.email || '').toLowerCase();
    const isAdUser = adEmails.has(emailLower);
    const isStaff = staffProtectedEmails.has(emailLower) || cu.id === 1 || (cu.rol_id && cu.rol_id !== 4);
    const isReferenced = referencedIds.has(cu.id);

    // Cuentas de administración y staff siempre activas
    if (isStaff) {
      await db.query("UPDATE usuarios SET estado = 'ACTIVO' WHERE id = ?", [cu.id]);
      continue;
    }

    if (!isAdUser) {
      if (!isReferenced) {
        await db.query('DELETE FROM usuarios WHERE id = ?', [cu.id]);
        deletedCount++;
      } else {
        await db.query("UPDATE usuarios SET estado = 'INACTIVO' WHERE id = ?", [cu.id]);
        inactivedCount++;
      }
    }
  }

  console.log(`✓ Usuarios de prueba eliminados definitivamente: ${deletedCount}`);
  console.log(`✓ Usuarios con tickets conservados pero dados de baja (INACTIVO): ${inactivedCount}`);

  // 4. Importar o actualizar usuarios de Active Directory
  console.log('--- 4. Importando usuarios oficiales desde Active Directory ---');
  const dummyPasswordHash = await bcrypt.hash('ActiveDirectoryAuthOnly2026!', 10);
  let insertedAd = 0;
  let updatedAd = 0;

  for (const adU of adUsers) {
    const [existing] = await db.query('SELECT id, rol_id FROM usuarios WHERE email = ?', [adU.email]);

    let rolId = 4; // Rol Solicitante por defecto
    if (adU.email === 'soporte@lamolina.edu.pe') {
      rolId = 5; // Mesa de Ayuda OTIC
    } else if (adU.email === 'daynacc@lamolina.edu.pe') {
      rolId = 3; // Técnico Redes
    }

    if (existing.length > 0) {
      // Si ya existía, preservar rol si era un rol de staff
      const finalRol = existing[0].rol_id !== 4 ? existing[0].rol_id : rolId;
      await db.query(`
        UPDATE usuarios 
        SET nombres = ?, apellidos = ?, facultad_dependencia = ?, cargo = ?, telefono = COALESCE(?, telefono), rol_id = ?, estado = 'ACTIVO'
        WHERE id = ?
      `, [adU.nombres, adU.apellidos, adU.facultadDependencia, adU.cargo, adU.telefono, finalRol, existing[0].id]);
      updatedAd++;
    } else {
      await db.query(`
        INSERT INTO usuarios (nombres, apellidos, email, password_hash, rol_id, facultad_dependencia, cargo, telefono, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO')
      `, [adU.nombres, adU.apellidos, adU.email, dummyPasswordHash, rolId, adU.facultadDependencia, adU.cargo, adU.telefono]);
      insertedAd++;
    }
  }

  console.log(`✓ Usuarios de AD insertados nuevos: ${insertedAd}`);
  console.log(`✓ Usuarios de AD actualizados: ${updatedAd}`);

  // 5. Verificación final
  const [finalTotal] = await db.query('SELECT COUNT(*) as c FROM usuarios');
  const [finalActive] = await db.query("SELECT COUNT(*) as c FROM usuarios WHERE estado = 'ACTIVO'");
  const [finalInactive] = await db.query("SELECT COUNT(*) as c FROM usuarios WHERE estado = 'INACTIVO'");
  const [czac] = await db.query('SELECT id, nombres, apellidos, email, rol_id, estado FROM usuarios WHERE email LIKE ?', ['%czacarias%']);

  console.log('\n=============================================');
  console.log('🎉 SINCRONIZACIÓN CON DIRECTORIO ACTIVO COMPLETADA');
  console.log('=============================================');
  console.log(`Total usuarios en BD: ${finalTotal[0].c}`);
  console.log(`Total ACTIVOS (Directorio Activo + Staff): ${finalActive[0].c}`);
  console.log(`Total INACTIVOS (solo históricos con tickets): ${finalInactive[0].c}`);
  console.log('Christian Zacarías (Admin):', czac[0]);
  console.log('=============================================\n');

  await db.end();
}

syncLdapUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error durante la sincronización:', err);
    process.exit(1);
  });
