import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env';
import { checkDatabaseConnection } from './config/db';
import { errorHandler } from './middlewares/error.middleware';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import catalogRoutes from './routes/catalog.routes';
import ticketRoutes from './routes/ticket.routes';
import adminRoutes from './routes/admin.routes';
import inspectionRoutes from './routes/inspection.routes';
import materialRoutes from './routes/material.routes';

const app = express();

// Middlewares de seguridad y parsing
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cors({
  origin: env.ALLOWED_ORIGIN === '*' ? true : env.ALLOWED_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Servir estáticamente archivos adjuntos subidos
app.use('/uploads', express.static(env.UPLOAD_DIR));
app.use('/app/uploads', express.static(env.UPLOAD_DIR));
app.use('/pruebas1/david/mesa_ayuda/uploads', express.static(env.UPLOAD_DIR));

// Servir estáticamente manuales y video tutoriales
const manualDir = path.join(__dirname, '../../manual');
app.use('/manual', express.static(manualDir));
app.use('/pruebas1/david/mesa_ayuda/manual', express.static(manualDir));

// Endpoint de Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'UP',
    system: 'Mesa de Ayuda OTIC UNALM (ITIL v4 Ready)',
    timestamp: new Date().toISOString(),
  });
});

// Rutas de API REST (Soporta /api y la ruta de subdirectorio /pruebas1/david/mesa_ayuda/api)
const mountRoutes = (prefix: string) => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/users`, userRoutes);
  app.use(`${prefix}/catalog`, catalogRoutes);
  app.use(`${prefix}/tickets`, ticketRoutes);
  app.use(`${prefix}/admin`, adminRoutes);
  app.use(`${prefix}/inspections`, inspectionRoutes);
  app.use(`${prefix}/materials`, materialRoutes);
};

mountRoutes(env.API_PREFIX); // /api
mountRoutes('/pruebas1/david/mesa_ayuda/api'); // Subdirectorio institucional

// Servir la aplicación React desde el mismo servidor Express
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.use('/pruebas1/david/mesa_ayuda', express.static(clientDist));

// Handling de errores globales
app.use(errorHandler);

// Iniciar servidor
const PORT = parseInt(env.PORT, 10);

app.listen(PORT, async () => {
  console.log(`=============================================================`);
  console.log(` MESA DE AYUDA IN-HOUSE OTIC UNALM (ITIL v4)`);
  console.log(` Servidor ejecutándose en el puerto: ${PORT}`);
  console.log(` Rango API Prefix: ${env.API_PREFIX}`);
  console.log(` Directiva Uploads: ${env.UPLOAD_DIR}`);
  console.log(`=============================================================`);

  await checkDatabaseConnection();
});

export default app;
