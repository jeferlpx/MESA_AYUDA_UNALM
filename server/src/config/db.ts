import mysql from 'mysql2/promise';
import { env } from './env';

export const dbPool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: env.DB_CONNECTION_LIMIT,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  timezone: '-05:00', // GMT-5 Perú / UNALM
});

export async function runDatabaseMigrations(): Promise<void> {
  const connection = await dbPool.getConnection();
  try {
    // 1. Asegurar rol MESA_AYUDA en tabla roles
    await connection.query(`
      INSERT INTO roles (id, codigo, nombre, descripcion)
      VALUES (5, 'MESA_AYUDA', 'Mesa de Ayuda OTIC', 'Asignación de tickets, complejidad, derivación y gestión de colas')
      ON DUPLICATE KEY UPDATE 
        codigo = VALUES(codigo),
        nombre = VALUES(nombre),
        descripcion = VALUES(descripcion)
    `);

    // 2. Asegurar tabla configuracion_sistema
    await connection.query(`
      CREATE TABLE IF NOT EXISTS configuracion_sistema (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clave VARCHAR(100) NOT NULL UNIQUE,
        valor VARCHAR(255) NOT NULL,
        descripcion VARCHAR(255) NULL,
        actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Insertar configuración por defecto: asignación automática desactivada (false)
    await connection.query(`
      INSERT IGNORE INTO configuracion_sistema (clave, valor, descripcion)
      VALUES ('asignacion_automatica_inmediata', 'false', 'Derivación automática a técnico por defecto al crear ticket')
    `);

    // 3. Asegurar columna complejidad en tickets si no existe
    try {
      await connection.query(`
        ALTER TABLE tickets 
        ADD COLUMN complejidad ENUM('BAJA', 'MEDIA', 'ALTA', 'COMPLEJA') DEFAULT 'BAJA' AFTER urgencia
      `);
    } catch (e: any) {
      // Ignorar error si ya existe la columna
      if (!e.message?.includes('Duplicate column')) {
        // Continuar
      }
    }

    // 4. Asegurar que tickets.estado acepte los estados ITIL y de Servicios Generales
    try {
      await connection.query(`
        ALTER TABLE tickets 
        MODIFY COLUMN estado ENUM(
          'REPORTADO',
          'EVALUACION_INSPECCION',
          'ESPERA_MATERIALES',
          'ESPERA_MATERIALES_SOLICITANTE',
          'ASIGNADO',
          'EN_EJECUCION',
          'RESUELTO',
          'NUEVO',
          'EN_PROCESO',
          'PENDIENTE_USUARIO',
          'CERRADO',
          'REABIERTO',
          'OBSERVADO'
        ) NOT NULL DEFAULT 'REPORTADO'
      `);
    } catch (e) {}

    // Migrar estados antiguos si existen
    await connection.query(`UPDATE tickets SET estado = 'REPORTADO' WHERE estado = 'NUEVO'`);
    await connection.query(`UPDATE tickets SET estado = 'RESUELTO' WHERE estado = 'CERRADO'`);

    // 4.1 Asegurar columnas especializadas para Servicios Generales (Campo, Taller y Materiales)
    const sgTicketColumns = [
      { name: 'contacto_local', type: 'VARCHAR(150) NULL' },
      { name: 'horario_acceso', type: 'VARCHAR(150) NULL' },
      { name: 'subtipo_intervencion', type: 'VARCHAR(60) NULL' },
      { name: 'datos_vehiculares', type: 'VARCHAR(150) NULL' },
      { name: 'materiales_usados', type: 'TEXT NULL' },
      { name: 'materiales_sobrantes', type: 'TEXT NULL' },
      { name: 'referencia_ubicacion', type: 'VARCHAR(255) NULL' },
    ];

    for (const col of sgTicketColumns) {
      try {
        await connection.query(`ALTER TABLE tickets ADD COLUMN ${col.name} ${col.type}`);
      } catch (e: any) {
        if (!e.message?.includes('Duplicate column')) {
          // Continuar
        }
      }
    }

    // 5. Asegurar que tickets.urgencia soporte CRITICA
    try {
      await connection.query(`
        ALTER TABLE tickets 
        MODIFY COLUMN urgencia ENUM('BAJA', 'MEDIA', 'ALTA', 'CRITICA') NOT NULL DEFAULT 'MEDIA'
      `);
    } catch (e) {}

    // 6. Asegurar tabla encuestas_satisfaccion
    await connection.query(`
      CREATE TABLE IF NOT EXISTS encuestas_satisfaccion (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL UNIQUE,
        tecnico_id INT NULL,
        solicitante_id INT NULL,
        puntuacion TINYINT NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
        comentario TEXT NULL,
        fecha_encuesta DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_encuestas_ticket FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Asegurar columnas opcionales en encuestas_satisfaccion si faltan
    try {
      await connection.query(`ALTER TABLE encuestas_satisfaccion ADD COLUMN tecnico_id INT NULL AFTER ticket_id`);
    } catch (e) {}
    try {
      await connection.query(`ALTER TABLE encuestas_satisfaccion ADD COLUMN solicitante_id INT NULL AFTER tecnico_id`);
    } catch (e) {}
    try {
      await connection.query(`ALTER TABLE usuarios ADD COLUMN anexo VARCHAR(50) NULL AFTER telefono`);
    } catch (e) {}
    try {
      await connection.query(`ALTER TABLE usuarios ADD COLUMN foto_perfil VARCHAR(255) NULL AFTER anexo`);
    } catch (e) {}
    try {
      await connection.query(`ALTER TABLE usuarios ADD COLUMN cargo VARCHAR(150) NULL AFTER facultad_dependencia`);
    } catch (e) {}
    try {
      await connection.query(`ALTER TABLE usuarios ADD COLUMN especialidad VARCHAR(150) NULL AFTER cargo`);
    } catch (e) {}
    try {
      await connection.query(`ALTER TABLE usuarios ADD COLUMN debe_cambiar_password TINYINT(1) NOT NULL DEFAULT 0 AFTER especialidad`);
    } catch (e) {}
    try {
      await connection.query(`ALTER TABLE usuarios ADD COLUMN correo_pendiente TINYINT(1) NOT NULL DEFAULT 0 AFTER debe_cambiar_password`);
    } catch (e) {}
    try {
      await connection.query(`ALTER TABLE usuarios ADD COLUMN ubicacion_referencia VARCHAR(255) NULL AFTER facultad_dependencia`);
    } catch (e) {}

    // 8. Asegurar columna orden en categorias_servicio
    try {
      await connection.query(`ALTER TABLE categorias_servicio ADD COLUMN orden INT NOT NULL DEFAULT 0 AFTER icono`);
    } catch (e) {}

    // 9. Asegurar roles de Servicios Generales
    await connection.query(`
      INSERT INTO roles (id, codigo, nombre, descripcion) VALUES
      (5, 'MESA_AYUDA', 'Mesa de Ayuda OTIC', 'Triage, derivación y gestión de colas de tickets OTIC'),
      (6, 'MESA_AYUDA_SG', 'Mesa de Ayuda Servicios Generales', 'Triage, derivación y gestión de colas de tickets de Servicios Generales e Infraestructura'),
      (7, 'TECNICO_SG', 'Especialista Servicios Generales', 'Atención y resolución técnica en rubros de mantenimiento e infraestructura (ROF UNALM)'),
      (8, 'SUPERVISOR_SG', 'Supervisor Servicios Generales', 'Jefatura y supervisión de la Unidad de Servicios Generales y Mantenimiento')
      ON DUPLICATE KEY UPDATE 
        codigo = VALUES(codigo),
        nombre = VALUES(nombre),
        descripcion = VALUES(descripcion)
    `);

    // 10. Asegurar columna modulo en categorias_servicio
    try {
      await connection.query(`
        ALTER TABLE categorias_servicio 
        ADD COLUMN modulo ENUM('OTIC', 'SERVICIOS_GENERALES') NOT NULL DEFAULT 'OTIC' AFTER orden
      `);
      await connection.query(`CREATE INDEX idx_categorias_modulo ON categorias_servicio (modulo)`);
    } catch (e: any) {
      if (!e.message?.includes('Duplicate column')) {
        // Continuar
      }
    }

    // 11. Asegurar columna modulo en tickets
    try {
      await connection.query(`
        ALTER TABLE tickets 
        ADD COLUMN modulo ENUM('OTIC', 'SERVICIOS_GENERALES') NOT NULL DEFAULT 'OTIC' AFTER codigo_correlativo
      `);
      await connection.query(`CREATE INDEX idx_tickets_modulo ON tickets (modulo)`);
    } catch (e: any) {
      if (!e.message?.includes('Duplicate column')) {
        // Continuar
      }
    }

    // Sincronizar modulo en tickets existentes según la categoría
    try {
      await connection.query(`
        UPDATE tickets t
        INNER JOIN categorias_servicio c ON t.categoria_id = c.id
        SET t.modulo = c.modulo
      `);
    } catch (e) {}

    // 12. Seed Catálogo de Servicios Generales e Infraestructura (ROF UNALM 2023)
    const sgCategories = [
      {
        nombre: 'Obras Civiles, Albañilería y Cerrajería',
        codigo: 'SG_INFRA',
        descripcion: 'Reparación de cerraduras, puertas, ventanas, muros, resanes, techos, baldosas y obras civiles menores en pabellones y aulas.',
        icono: 'Building2',
        orden: 1,
        sla_resp: 3,
        sla_resol: 24,
      },
      {
        nombre: 'Mantenimiento Eléctrico e Iluminación',
        codigo: 'SG_ELEC',
        descripcion: 'Incidencias con fluido eléctrico, cortocircuitos, cambio de luminarias en aulas/campus, tableros eléctricos y tomacorrientes.',
        icono: 'Zap',
        orden: 2,
        sla_resp: 2,
        sla_resol: 12,
      },
      {
        nombre: 'Mantenimiento Sanitario y Gasfitería',
        codigo: 'SG_SAN',
        descripcion: 'Fugas de agua, desatoro de desagües, reparación de fluxómetros, grifería, inodoros, bombas de presión y tuberías en servicios higiénicos.',
        icono: 'Wrench',
        orden: 3,
        sla_resp: 2,
        sla_resol: 12,
      },
      {
        nombre: 'Climatización, Ventilación y Refrigeración',
        codigo: 'SG_CLIMA',
        descripcion: 'Mantenimiento de sistemas de aire acondicionado, extractores de aire en laboratorios y cámaras de conservación.',
        icono: 'Cpu',
        orden: 4,
        sla_resp: 4,
        sla_resol: 24,
      },
      {
        nombre: 'Mantenimiento de Áreas Verdes y Forestación',
        codigo: 'SG_JARDIN',
        descripcion: 'Poda de árboles de riesgo, riego de jardines, limpieza de bermas y conservación de áreas forestales del campus universitario.',
        icono: 'Flower2',
        orden: 5,
        sla_resp: 6,
        sla_resol: 48,
      },
      {
        nombre: 'Limpieza, Saneamiento y Residuos',
        codigo: 'SG_LIMPIEZA',
        descripcion: 'Servicio de fumigación, desinfección ambiental, acopio y retiro de residuos sólidos especiales en facultades u oficinas.',
        icono: 'Trash2',
        orden: 6,
        sla_resp: 4,
        sla_resol: 24,
      },
      {
        nombre: 'Transporte, Mudanza Interna y Apoyo Logístico',
        codigo: 'SG_TRANS',
        descripcion: 'Traslado de carpetas, escritorios, mobiliario para eventos institucionales, exámenes de admisión o ceremonias protocolares.',
        icono: 'Truck',
        orden: 7,
        sla_resp: 6,
        sla_resol: 24,
      },
    ];

    for (const cat of sgCategories) {
      await connection.query(`
        INSERT INTO categorias_servicio (nombre, codigo, descripcion, icono, orden, modulo, sla_horas_respuesta, sla_horas_resolucion, activo)
        VALUES (?, ?, ?, ?, ?, 'SERVICIOS_GENERALES', ?, ?, TRUE)
        ON DUPLICATE KEY UPDATE
          nombre = VALUES(nombre),
          descripcion = VALUES(descripcion),
          icono = VALUES(icono),
          orden = VALUES(orden),
          modulo = 'SERVICIOS_GENERALES'
      `, [cat.nombre, cat.codigo, cat.descripcion, cat.icono, cat.orden, cat.sla_resp, cat.sla_resol]);
    }

    // 13. Usuarios Indispensables para Marcha Blanca (OTIC, Serv. Generales y Solicitantes)
    const pwdHash = '$2a$10$lAduImN7Z3O4/SKm.sPn3.JdbxuXo0kobu7fjBHgR8.Yl3gpwbbpK';
    const indispensableUsers = [
      {
        nombres: 'Administrador',
        apellidos: 'General OTIC',
        email: 'admin.otic@lamolina.edu.pe',
        rolId: 1, // ADMIN
        facultad: 'Oficina de Tecnologías de la Información (OTIC)',
        telefono: '01-614-7800 Ext 101'
      },
      {
        nombres: 'Mesa de Ayuda',
        apellidos: 'OTIC (Soporte)',
        email: 'soporte@lamolina.edu.pe',
        rolId: 5, // MESA_AYUDA
        facultad: 'Mesa de Ayuda OTIC',
        telefono: '01-614-7800 Ext 105'
      },
      {
        nombres: 'Mesa de Ayuda',
        apellidos: 'Servicios Generales',
        email: 'mesa.sg@lamolina.edu.pe',
        rolId: 6, // MESA_AYUDA_SG
        facultad: 'Unidad de Servicios Generales y Mantenimiento',
        telefono: '01-614-7800 Ext 106'
      },
      {
        nombres: 'Jorge',
        apellidos: 'Benavides (Docente)',
        email: 'jbenavides@lamolina.edu.pe',
        rolId: 4, // SOLICITANTE
        facultad: 'Facultad de Agronomía',
        telefono: '998877665'
      },
      {
        nombres: 'María',
        apellidos: 'Flores (Estudiante)',
        email: '20220145@lamolina.edu.pe',
        rolId: 4, // SOLICITANTE
        facultad: 'Facultad de Ciencias',
        telefono: '912345678'
      },
      {
        nombres: 'David',
        apellidos: 'Mendoza (Técnico Redes)',
        email: 'tecnico.redes@lamolina.edu.pe',
        rolId: 3, // TECNICO
        facultad: 'OTIC - Área de Redes y Telecomunicaciones',
        telefono: '01-614-7800 Ext 103'
      },
      {
        nombres: 'Marco',
        apellidos: 'Valdivia (Esp. Electricidad)',
        email: 'tecnico.electricidad@lamolina.edu.pe',
        rolId: 7, // TECNICO_SG
        facultad: 'Unidad de Servicios Generales - Taller Electricidad',
        telefono: '998811223'
      }
    ];

    for (const u of indispensableUsers) {
      const [existing] = await connection.query<any[]>(
        'SELECT id FROM usuarios WHERE email = ?',
        [u.email]
      );
      if (existing.length > 0) {
        await connection.query(
          `UPDATE usuarios 
           SET nombres = ?, apellidos = ?, password_hash = ?, rol_id = ?, facultad_dependencia = ?, telefono = ?, estado = 'ACTIVO'
           WHERE id = ?`,
          [u.nombres, u.apellidos, pwdHash, u.rolId, u.facultad, u.telefono, existing[0].id]
        );
      } else {
        await connection.query(
          `INSERT INTO usuarios (nombres, apellidos, email, password_hash, rol_id, facultad_dependencia, telefono, estado)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVO')`,
          [u.nombres, u.apellidos, u.email, pwdHash, u.rolId, u.facultad, u.telefono]
        );
      }
    }

    // 14. Crear Tablas de Inspecciones Preventivas de Infraestructura (SIGI UNALM)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS inspecciones_infraestructura (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(50) NOT NULL UNIQUE,
        fecha_registro DATETIME NOT NULL,
        edificio VARCHAR(150) NOT NULL,
        area VARCHAR(150) NOT NULL,
        inspector_nombre VARCHAR(150) NOT NULL,
        responsable_area VARCHAR(150) NULL,
        soporte_tecnico VARCHAR(150) NULL,
        observaciones_generales TEXT NULL,
        total_evaluados INT DEFAULT 0,
        total_criticos INT DEFAULT 0,
        tickets_generados INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_insp_fecha (fecha_registro),
        INDEX idx_insp_edificio (edificio),
        INDEX idx_insp_area (area)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS hallazgos_inspeccion (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inspeccion_id INT NOT NULL,
        categoria_codigo VARCHAR(10) NOT NULL,
        categoria_nombre VARCHAR(100) NOT NULL,
        item_codigo VARCHAR(20) NOT NULL,
        item_nombre VARCHAR(150) NOT NULL,
        estado_calificacion ENUM('CRITICO', 'MANTENIMIENTO', 'BUENO', 'EXCELENTE', 'NO_APLICA') NOT NULL DEFAULT 'BUENO',
        calificacion_num INT DEFAULT 3,
        observacion TEXT NULL,
        accion_sugerida VARCHAR(255) NULL,
        prioridad ENUM('BAJA', 'MEDIA', 'ALTA', 'CRITICA') NOT NULL DEFAULT 'MEDIA',
        categoria_sg_sugerida VARCHAR(50) NULL,
        ticket_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_hallazgo_inspeccion FOREIGN KEY (inspeccion_id) REFERENCES inspecciones_infraestructura (id) ON DELETE CASCADE,
        INDEX idx_hallazgo_estado (estado_calificacion),
        INDEX idx_hallazgo_ticket (ticket_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Añadir columnas de vinculación a tickets si no existen
    try {
      await connection.query("ALTER TABLE tickets ADD COLUMN inspeccion_id INT NULL");
    } catch (e: any) {
      // Ignorar si ya existe
    }
    try {
      await connection.query("ALTER TABLE tickets ADD COLUMN hallazgo_id INT NULL");
    } catch (e: any) {
      // Ignorar si ya existe
    }
    try {
      await connection.query("ALTER TABLE tickets MODIFY COLUMN canal_origen ENUM('PORTAL_WEB','CORREO','TELEFONO','PRESENCIAL','INSPECCION_SIGI') NOT NULL DEFAULT 'PORTAL_WEB'");
    } catch (e: any) {
      // Ignorar si ya existe
    }
    try {
      await connection.query("ALTER TABLE tickets MODIFY COLUMN tipo ENUM('INCIDENTE','SOLICITUD_SERVICIO','MANTENIMIENTO_PREVENTIVO','MANTENIMIENTO_CORRECTIVO') NOT NULL DEFAULT 'INCIDENTE'");
    } catch (e: any) {
      // Ignorar si ya existe
    }

    // 15. Tablas de Inspecciones Preventivas preparadas para Marcha Blanca (sin registros iniciales)

    // 16. TABLAS PARA MÓDULO DE INVENTARIO DE MATERIALES (SERVICIOS GENERALES)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS materiales_inventario_sg (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(50) NOT NULL UNIQUE,
        nombre VARCHAR(255) NOT NULL,
        categoria_taller VARCHAR(100) NOT NULL,
        unidad_medida VARCHAR(50) NOT NULL DEFAULT 'Unidad (und)',
        stock_actual DECIMAL(10,2) NOT NULL DEFAULT 0,
        stock_minimo DECIMAL(10,2) NOT NULL DEFAULT 5,
        ubicacion_almacen VARCHAR(150) NULL,
        precio_unitario_estimado DECIMAL(10,2) NULL DEFAULT 0,
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS materiales_movimientos_sg (
        id INT AUTO_INCREMENT PRIMARY KEY,
        material_id INT NOT NULL,
        tipo_movimiento ENUM('ENTRADA_COMPRA', 'ENTRADA_DEVOLUCION', 'SALIDA_OT', 'SALIDA_AJUSTE') NOT NULL,
        cantidad DECIMAL(10,2) NOT NULL,
        stock_anterior DECIMAL(10,2) NOT NULL,
        stock_nuevo DECIMAL(10,2) NOT NULL,
        ticket_id INT NULL,
        orden_trabajo_codigo VARCHAR(60) NULL,
        usuario_id INT NOT NULL,
        usuario_nombre VARCHAR(150) NULL,
        motivo VARCHAR(255) NULL,
        observaciones TEXT NULL,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_mov_material FOREIGN KEY (material_id) REFERENCES materiales_inventario_sg (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Semilla inicial de materiales para los talleres de Servicios Generales UNALM
    const [matCount]: any = await connection.query(`SELECT COUNT(*) as total FROM materiales_inventario_sg`);
    if (matCount[0].total === 0) {
      const materialesIniciales = [
        // Electricidad
        ['MAT-ELEC-001', 'Cable Mellizo 2x14 AWG (100m)', 'Electricidad', 'Rollo', 18, 5, 'Almacén SG - Estante E-01', 120.00],
        ['MAT-ELEC-002', 'Interruptor Termomagnético 2x20A', 'Electricidad', 'Unidad (und)', 24, 6, 'Almacén SG - Estante E-02', 35.00],
        ['MAT-ELEC-003', 'Panel LED 40W 60x60cm Luz Fría', 'Electricidad', 'Unidad (und)', 15, 8, 'Almacén SG - Estante E-03', 45.00],
        ['MAT-ELEC-004', 'Cinta Aislante 3M Temflex 1700', 'Electricidad', 'Unidad (und)', 45, 10, 'Almacén SG - Gaveta 1', 6.50],
        ['MAT-ELEC-005', 'Tomacorriente Doble con Puesta a Tierra', 'Electricidad', 'Unidad (und)', 32, 10, 'Almacén SG - Estante E-02', 18.00],

        // Gasfitería e Instalaciones Sanitarias
        ['MAT-GASF-001', 'Tubo PVC Agua Fría 1/2 pulgada x 5m', 'Gasfitería', 'Tubo (5m)', 35, 10, 'Taller Gasfitería - Racks', 14.50],
        ['MAT-GASF-002', 'Cinta Teflón 3/4 pulgada', 'Gasfitería', 'Unidad (und)', 50, 15, 'Almacén SG - Gaveta 2', 3.00],
        ['MAT-GASF-003', 'Pegamento PVC Oatey 8oz (237ml)', 'Gasfitería', 'Lata (8oz)', 12, 4, 'Almacén SG - Estante G-01', 28.00],
        ['MAT-GASF-004', 'Válvula Esférica de Bronce 1/2 pulgada', 'Gasfitería', 'Unidad (und)', 16, 5, 'Almacén SG - Estante G-02', 22.00],
        ['MAT-GASF-005', 'Grifería para Lavatorio Tipo Palanca', 'Gasfitería', 'Unidad (und)', 8, 4, 'Almacén SG - Estante G-03', 65.00],
        ['MAT-GASF-006', 'Empaquetadura para Inodoro / Vástago', 'Gasfitería', 'Bolsa (10 und)', 20, 5, 'Almacén SG - Gaveta 2', 12.00],

        // Carpintería
        ['MAT-CARP-001', 'Plancha Melamina 18mm Blanco 2.14x2.44m', 'Carpintería', 'Plancha', 9, 3, 'Taller Carpintería - Estiba', 140.00],
        ['MAT-CARP-002', 'Bisagra Cangrejo Recta 35mm (Par)', 'Carpintería', 'Par', 28, 8, 'Taller Carpintería - Gaveta C1', 7.50],
        ['MAT-CARP-003', 'Cola Sintética para Madera 1 Galón', 'Carpintería', 'Galón (gal)', 6, 2, 'Taller Carpintería - Estante C2', 38.00],
        ['MAT-CARP-004', 'Tornillos Spax Autorroscantes 4x50mm', 'Carpintería', 'Caja (100 und)', 14, 5, 'Taller Carpintería - Gaveta C3', 18.00],
        ['MAT-CARP-005', 'Lija para Madera grano 120 / 180', 'Carpintería', 'Pliego', 60, 20, 'Taller Carpintería - Gaveta C4', 2.00],

        // Cerrajería y Soldadura
        ['MAT-CERR-001', 'Cerradura de Embutir Forte 3 Golpes', 'Cerrajería', 'Unidad (und)', 12, 4, 'Almacén SG - Estante S-01', 85.00],
        ['MAT-CERR-002', 'Candado de Seguridad Yale 50mm', 'Cerrajería', 'Unidad (und)', 10, 3, 'Almacén SG - Estante S-01', 42.00],
        ['MAT-CERR-003', 'Electrodo Soldadura Cellocord E-6011 (1kg)', 'Cerrajería', 'Kilo (kg)', 25, 8, 'Taller Cerrajería - Estante 1', 19.50],
        ['MAT-CERR-004', 'Disco de Corte Metal 4 1/2 pulgada DeWalt', 'Cerrajería', 'Unidad (und)', 30, 10, 'Taller Cerrajería - Estante 2', 5.50],

        // Pintura y Albañilería
        ['MAT-PINT-001', 'Pintura Látex CPP Duralátex Blanco 5 Gal', 'Pintura y Albañilería', 'Balde (5 gal)', 8, 3, 'Almacén SG - Zona Pintura', 195.00],
        ['MAT-PINT-002', 'Bolsa de Cemento Sol Tipo I (42.5kg)', 'Pintura y Albañilería', 'Bolsa (42.5kg)', 15, 5, 'Almacén SG - Patio Obras', 29.50],
        ['MAT-PINT-003', 'Rodillo de Felpa Antigota 9 pulgadas', 'Pintura y Albañilería', 'Unidad (und)', 14, 5, 'Almacén SG - Zona Pintura', 14.00],
        ['MAT-PINT-004', 'Thinner Acrílico Estándar 1 Galón', 'Pintura y Albañilería', 'Galón (gal)', 5, 2, 'Almacén SG - Zona Solventes', 32.00],

        // Mecánica Automotriz y Transporte
        ['MAT-MECA-001', 'Aceite de Motor 15W-40 Mobil Delvac (1 Gal)', 'Mecánica Automotriz', 'Galón (gal)', 10, 3, 'Taller Mecánica - Estante M1', 88.00],
        ['MAT-MECA-002', 'Líquido de Frenos DOT 4 Bosch 500ml', 'Mecánica Automotriz', 'Botella (500ml)', 12, 4, 'Taller Mecánica - Estante M2', 24.00],
        ['MAT-MECA-003', 'Spray Lubricante Aflojatodo WD-40 11oz', 'Mecánica Automotriz', 'Lata (11oz)', 18, 5, 'Taller Mecánica - Estante M3', 26.50],
        ['MAT-MECA-004', 'Filtro de Aceite para Camión Fuso Canter', 'Mecánica Automotriz', 'Unidad (und)', 4, 2, 'Taller Mecánica - Gaveta Filtros', 45.00],

        // Áreas Verdes y Limpieza
        ['MAT-JARD-001', 'Aceite 2 Tiempos para Motoguadaña STIHL 1L', 'Áreas Verdes', 'Litro (L)', 8, 3, 'Taller Jardinería - Estante J1', 35.00],
        ['MAT-JARD-002', 'Nylon para Desbrozadora 3.0mm (Rollo 15m)', 'Áreas Verdes', 'Rollo', 16, 5, 'Taller Jardinería - Estante J2', 22.00],
        ['MAT-LIMP-001', 'Bolsa Negra para Basura 140L (Paquete 50)', 'Limpieza y Saneamiento', 'Paquete (50 und)', 25, 8, 'Almacén SG - Limpieza', 38.00]
      ];

      for (const m of materialesIniciales) {
        await connection.query(`
          INSERT INTO materiales_inventario_sg
          (codigo, nombre, categoria_taller, unidad_medida, stock_actual, stock_minimo, ubicacion_almacen, precio_unitario_estimado)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, m);
      }
    }

    // Asegurar tabla ticket_tecnicos para asignación múltiple en tickets complejos de OTIC
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ticket_tecnicos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        tecnico_id INT NOT NULL,
        rol_asignacion ENUM('PRINCIPAL', 'APOYO') NOT NULL DEFAULT 'APOYO',
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_ticket_tecnico (ticket_id, tecnico_id),
        CONSTRAINT fk_ticket_tecnicos_ticket FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE,
        CONSTRAINT fk_ticket_tecnicos_tecnico FOREIGN KEY (tecnico_id) REFERENCES usuarios (id) ON DELETE CASCADE,
        INDEX idx_tt_ticket (ticket_id),
        INDEX idx_tt_tecnico (tecnico_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Sincronizar asignaciones existentes hacia ticket_tecnicos si existen tickets con tecnico_id
    await connection.query(`
      INSERT IGNORE INTO ticket_tecnicos (ticket_id, tecnico_id, rol_asignacion)
      SELECT id, tecnico_id, 'PRINCIPAL' 
      FROM tickets 
      WHERE tecnico_id IS NOT NULL;
    `);

    console.log('[Database Migrations OK] Esquema sincronizado con Módulos OTIC, Servicios Generales e Inspecciones Preventivas SIGI (ROF UNALM 2023).');

  } catch (error) {
    console.error('[Database Migration Warning]:', error);
  } finally {
    connection.release();
  }
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const connection = await dbPool.getConnection();
    console.log(`[MySQL Connection OK] Conectado exitosamente a DB '${env.DB_NAME}' en ${env.DB_HOST}:${env.DB_PORT}`);
    connection.release();

    await runDatabaseMigrations();
    return true;
  } catch (error) {
    console.error(`[MySQL Connection ERROR] No se pudo conectar a ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}:`, error);
    return false;
  }
}

