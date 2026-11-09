const { Client } = require('ldapts');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function syncLdapUsers() {
  console.log('--- 1. Conectando con Active Directory Institucional (UNALM) ---');
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
    paged: { pageSize: 500 },
    attributes: [
      'dn',
      'sAMAccountName',
      'userPrincipalName',
      'mail',
      'displayName',
      'givenName',
      'sn',
      'department',
      'physicalDeliveryOfficeName',
      'company',
      'description',
      'title',
      'telephoneNumber',
      'mobile',
      'ipPhone',
      'otherTelephone',
      'homePhone',
      'pager'
    ]
  });

  await client.unbind();
  console.log(`✓ Total cuentas encontradas en Active Directory: ${res.searchEntries.length}`);

  const getAttr = (val) => {
    if (!val) return '';
    if (Array.isArray(val)) {
      return val.length > 0 ? (val[0] || '').toString().trim() : '';
    }
    return val.toString().trim();
  };

  const adUsers = [];
  for (const entry of res.searchEntries) {
    const sAM = getAttr(entry.sAMAccountName);
    if (!sAM || ['Sysadmin', 'Invitado', 'krbtgt'].includes(sAM) || sAM.startsWith('$')) continue;

    const upn = getAttr(entry.userPrincipalName) || `${sAM}@lamolina.edu.pe`;
    const mail = (getAttr(entry.mail) || upn).toLowerCase();
    const displayName = getAttr(entry.displayName) || getAttr(entry.cn) || sAM;
    let givenName = getAttr(entry.givenName);
    let sn = getAttr(entry.sn);

    if (!givenName && displayName) {
      const parts = displayName.split(/\s+/);
      givenName = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0];
      if (!sn && parts.length > 1) {
        sn = parts[parts.length - 1];
      }
    }

    if (!givenName) givenName = sAM;
    if (!sn) sn = '-';

    // 1. Extraer Facultad o Dependencia Institucional
    let dependencia =
      getAttr(entry.department) ||
      getAttr(entry.physicalDeliveryOfficeName) ||
      getAttr(entry.company);

    if (!dependencia && entry.dn) {
      const ouMatches = String(entry.dn).match(/OU=([^,]+)/g);
      if (ouMatches && ouMatches.length > 0) {
        const cleanedOUs = ouMatches
          .map(m => m.replace('OU=', '').trim())
          .filter(ou => ou !== 'UNALM' && ou !== 'UNALM Servicios');
        dependencia = cleanedOUs.length > 0
          ? cleanedOUs.reverse().join(' - ')
          : ouMatches.map(m => m.replace('OU=', '').trim()).reverse().join(' - ');
      }
    }

    if (!dependencia) {
      dependencia = 'Comunidad Universitaria UNALM';
    }

    // 2. Extraer Cargo o Condición Laboral
    const cargo = getAttr(entry.title) || getAttr(entry.description) || 'Personal Institucional';

    // 3. Extraer Celular y Anexo Telefónico
    const rawMobile = getAttr(entry.mobile);
    const rawTel = getAttr(entry.telephoneNumber);
    const rawIp = getAttr(entry.ipPhone);
    const rawOther = getAttr(entry.otherTelephone);
    const rawHome = getAttr(entry.homePhone);

    let telefono = null;
    let anexo = null;

    const phoneCandidates = [rawMobile, rawTel, rawHome, rawIp].filter(Boolean);
    for (const cand of phoneCandidates) {
      const digits = cand.replace(/\D/g, '');
      if (digits.length === 9 && digits.startsWith('9')) {
        telefono = digits;
        break;
      } else if (!telefono && digits.length >= 7) {
        telefono = cand;
      }
    }

    if (rawOther && rawOther.replace(/\D/g, '').length >= 2 && rawOther.replace(/\D/g, '').length <= 6) {
      anexo = rawOther.replace(/\D/g, '');
    } else if (rawIp && rawIp.replace(/\D/g, '').length >= 2 && rawIp.replace(/\D/g, '').length <= 6) {
      anexo = rawIp.replace(/\D/g, '');
    } else if (rawTel) {
      const extMatch = rawTel.match(/(?:ext|anx|anexo|#)\.?\s*(\d{2,6})/i);
      if (extMatch) {
        anexo = extMatch[1];
      } else if (rawTel.replace(/\D/g, '').length >= 2 && rawTel.replace(/\D/g, '').length <= 5) {
        anexo = rawTel.replace(/\D/g, '');
      }
    }

    adUsers.push({
      sAMAccountName: sAM,
      email: mail,
      nombres: givenName,
      apellidos: sn,
      facultadDependencia: dependencia,
      cargo,
      telefono,
      anexo
    });
  }

  console.log(`✓ Usuarios institucionales válidos mapeados desde AD: ${adUsers.length}`);

  // Conexión a Base de Datos
  console.log('--- 2. Conectando a Base de Datos MySQL Centralizada ---');
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: process.env.DB_NAME,
    charset: 'utf8mb4'
  });
  console.log('✓ Conexión a Base de Datos establecida.');

  console.log('--- 3. Sincronización inteligente de usuarios (solo nuevos y campos modificados) ---');
  const crypto = require('crypto');
  const dummyPasswordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
  let insertedAd = 0;
  let updatedAd = 0;
  let unchangedAd = 0;

  for (const adU of adUsers) {
    const candidateEmails = [adU.email.toLowerCase().trim()];
    if (adU.email.includes('@')) {
      candidateEmails.push(adU.email.split('@')[0].toLowerCase().trim());
    } else {
      candidateEmails.push(`${adU.email.toLowerCase().trim()}@lamolina.edu.pe`);
    }
    if (adU.sAMAccountName) {
      candidateEmails.push(adU.sAMAccountName.toLowerCase().trim());
      candidateEmails.push(`${adU.sAMAccountName.toLowerCase().trim()}@lamolina.edu.pe`);
    }

    // 1. Buscar primero por coincidencia de email/usuario
    let [existing] = await db.query(
      'SELECT id, nombres, apellidos, email, rol_id, facultad_dependencia, cargo, telefono, anexo, estado FROM usuarios WHERE email IN (?) ORDER BY (email = ?) DESC, id ASC LIMIT 1',
      [candidateEmails, adU.email.toLowerCase().trim()]
    );

    // 2. Si no se encontró por email, buscar por coincidencia de nombres y apellidos completos
    if (existing.length === 0 && adU.nombres && adU.apellidos && adU.apellidos !== '-' && adU.nombres.length >= 2) {
      const [byName] = await db.query(
        `SELECT id, nombres, apellidos, email, rol_id, facultad_dependencia, cargo, telefono, anexo, estado 
         FROM usuarios 
         WHERE (
           LOWER(TRIM(CONCAT(nombres, ' ', apellidos))) = LOWER(TRIM(CONCAT(?, ' ', ?)))
           OR (LOWER(TRIM(nombres)) = LOWER(TRIM(?)) AND LOWER(TRIM(apellidos)) = LOWER(TRIM(?)))
         )
         ORDER BY id ASC LIMIT 1`,
        [adU.nombres.trim(), adU.apellidos.trim(), adU.nombres.trim(), adU.apellidos.trim()]
      );
      if (byName.length > 0) {
        existing = byName;
      }
    }

    if (existing.length === 0) {
      // 1. Usuario NUEVO en AD que no existe en el sistema -> Agregar como Solicitante
      let initialRolId = 4; // Solicitante
      if (adU.email === 'soporte@lamolina.edu.pe') initialRolId = 5;
      if (adU.email === 'daynacc@lamolina.edu.pe') initialRolId = 3;

      await db.query(
        `INSERT INTO usuarios (nombres, apellidos, email, password_hash, rol_id, facultad_dependencia, cargo, telefono, anexo, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO')`,
        [
          adU.nombres,
          adU.apellidos,
          adU.email,
          dummyPasswordHash,
          initialRolId,
          adU.facultadDependencia,
          adU.cargo,
          adU.telefono || null,
          adU.anexo || null
        ]
      );
      insertedAd++;
    } else {
      // 2. Usuario YA EXISTE -> Prevalece AD, actualizar datos y correo, sin tocar roles ni historial
      const current = existing[0];
      const updates = [];
      const values = [];

      // Prevalencia del correo oficial de Active Directory
      const officialEmail = adU.email.toLowerCase().trim();
      if (current.email.toLowerCase().trim() !== officialEmail) {
        // Eliminar fila huérfana vacía si existía un duplicado sin tickets
        await db.query(
          `DELETE FROM usuarios 
           WHERE email = ? AND id != ? 
             AND id NOT IN (SELECT DISTINCT solicitante_id FROM tickets) 
             AND id NOT IN (SELECT DISTINCT tecnico_id FROM tickets WHERE tecnico_id IS NOT NULL)`,
          [officialEmail, current.id]
        );
        updates.push('email = ?');
        values.push(officialEmail);
      }

      // Verificar Facultad o Dependencia
      const currentDep = (current.facultad_dependencia || '').trim();
      if (adU.facultadDependencia && adU.facultadDependencia !== 'Comunidad Universitaria UNALM' && adU.facultadDependencia.trim() !== currentDep) {
        updates.push('facultad_dependencia = ?');
        values.push(adU.facultadDependencia.trim());
      }

      // Verificar Cargo
      const currentCargo = (current.cargo || '').trim();
      if (adU.cargo && adU.cargo.trim() !== currentCargo) {
        updates.push('cargo = ?');
        values.push(adU.cargo.trim());
      }

      // Verificar Celular
      const currentTel = (current.telefono || '').trim();
      if (adU.telefono && adU.telefono.trim() !== currentTel) {
        updates.push('telefono = ?');
        values.push(adU.telefono.trim());
      }

      // Verificar Anexo
      const currentAnx = (current.anexo || '').trim();
      if (adU.anexo && adU.anexo.trim() !== currentAnx) {
        updates.push('anexo = ?');
        values.push(adU.anexo.trim());
      }

      // Si nombres o apellidos cambiaron en AD respecto a la BD
      if (adU.nombres && adU.nombres.trim() !== (current.nombres || '').trim()) {
        updates.push('nombres = ?');
        values.push(adU.nombres.trim());
      }
      if (adU.apellidos && adU.apellidos !== '-' && adU.apellidos.trim() !== (current.apellidos || '').trim()) {
        updates.push('apellidos = ?');
        values.push(adU.apellidos.trim());
      }

      // Asegurar que el usuario esté activo y sin marcas pendientes
      if (current.estado !== 'ACTIVO') {
        updates.push("estado = 'ACTIVO'");
      }

      if (updates.length > 0) {
        values.push(current.id);
        await db.query(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`, values);
        updatedAd++;
      } else {
        unchangedAd++;
      }
    }
  }

  // 4. Verificación final
  const [finalTotal] = await db.query('SELECT COUNT(*) as c FROM usuarios');
  const [finalActive] = await db.query("SELECT COUNT(*) as c FROM usuarios WHERE estado = 'ACTIVO'");

  console.log('\n=============================================');
  console.log('🎉 SINCRONIZACIÓN INTELIGENTE CON DIRECTORIO ACTIVO');
  console.log('=============================================');
  console.log(`Cuentas procesadas desde AD: ${adUsers.length}`);
  console.log(`✓ Nuevos usuarios institucionales agregados: ${insertedAd}`);
  console.log(`✓ Usuarios actualizados con nuevos campos de AD: ${updatedAd}`);
  console.log(`✓ Usuarios ya sincronizados (sin cambios): ${unchangedAd}`);
  console.log(`Total usuarios en el sistema: ${finalTotal[0].c} (${finalActive[0].c} activos)`);
  console.log('=============================================\n');

  await db.end();
}

syncLdapUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error durante la sincronización:', err);
    process.exit(1);
  });
