import { dbPool } from '../config/db';

async function main() {
  await dbPool.query("UPDATE usuarios SET estado = 'INACTIVO' WHERE email IN ('abc@lamolina.edu.pe', 'mamamamam@lamolina.edu.pe', 'jenifer@lamolina.edu.pe', 'daynacc@lamolina.edu.pe')");
  await dbPool.query("UPDATE usuarios SET rol_id = 4, nombres = 'Jorge', apellidos = 'Benavides (Docente)', estado = 'ACTIVO' WHERE email IN ('solicitante@lamolina.edu.pe', 'jbenavides@lamolina.edu.pe', '20220145@lamolina.edu.pe')");
  await dbPool.query("UPDATE usuarios SET rol_id = 5, nombres = 'Mesa de Ayuda', apellidos = 'OTIC (Triage)' WHERE email IN ('mesa.ayuda@lamolina.edu.pe', 'mesa@lamolina.edu.pe')");
  await dbPool.query("UPDATE usuarios SET rol_id = 6, nombres = 'Mesa de Ayuda', apellidos = 'Servicios Generales' WHERE email = 'mesa.sg@lamolina.edu.pe'");
  await dbPool.query("UPDATE usuarios SET rol_id = 7 WHERE email IN ('tecnico.electricidad@lamolina.edu.pe', 'tecnico.gasfiteria@lamolina.edu.pe', 'tecnico.infraestructura@lamolina.edu.pe')");
  await dbPool.query("UPDATE usuarios SET rol_id = 8 WHERE email = 'supervisor.sg@lamolina.edu.pe'");
  await dbPool.query("UPDATE usuarios SET rol_id = 1 WHERE email IN ('admin@lamolina.edu.pe', 'admin.otic@lamolina.edu.pe')");

  const [rows] = await dbPool.query('SELECT u.id, u.nombres, u.apellidos, u.email, r.codigo as rol, u.estado FROM usuarios u JOIN roles r ON u.rol_id = r.id ORDER BY u.id ASC');
  console.table(rows);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
