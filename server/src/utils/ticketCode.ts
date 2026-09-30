import { dbPool } from '../config/db';
import { RowDataPacket } from 'mysql2';
import { ModuleArea } from '../types';

export async function generateTicketCode(modulo: ModuleArea = 'OTIC'): Promise<string> {
  const currentYear = new Date().getFullYear();
  const codePrefix = modulo === 'SERVICIOS_GENERALES' ? 'SG' : 'OTIC';
  const prefix = `${codePrefix}-${currentYear}-`;

  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT codigo_correlativo 
     FROM tickets 
     WHERE codigo_correlativo LIKE ? 
     ORDER BY id DESC 
     LIMIT 1`,
    [`${prefix}%`]
  );

  let nextSequence = 1;
  if (rows.length > 0) {
    const lastCode = rows[0].codigo_correlativo as string;
    const parts = lastCode.split('-');
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextSequence = lastSeq + 1;
      }
    }
  }

  const paddedSeq = String(nextSequence).padStart(5, '0');
  return `${prefix}${paddedSeq}`;
}

