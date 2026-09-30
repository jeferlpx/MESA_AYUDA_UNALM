import { dbPool } from '../config/db';

async function updateEnum() {
  await dbPool.query(`
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
  console.log('✓ Column estado updated with ESPERA_MATERIALES_SOLICITANTE successfully!');
  process.exit(0);
}

updateEnum().catch(console.error);
