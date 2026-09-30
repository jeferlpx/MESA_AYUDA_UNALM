# 🏛️ DOCUMENTACIÓN TÉCNICA DE PRODUCCIÓN
## Sistema de Mesa de Ayuda In-House (OTIC & Servicios Generales - UNALM)
**Normativa / Estándar:** ITIL v4 Ready  
**Institución:** Universidad Nacional Agraria La Molina (UNALM)  
**Oficina Responsable:** Oficina de Tecnologías de la Información y Comunicaciones (OTIC)  
**Versión:** 1.0.0 (Producción)  
**Fecha:** Septiembre 2026  

---

## 1. RESUMEN EJECUTIVO Y OBJETIVOS DEL SISTEMA

El **Sistema de Mesa de Ayuda UNALM** es una plataforma web enterprise diseñada para canalizar, gestionar, auditar y resolver de forma centralizada las incidencias y solicitudes de servicio generadas por la comunidad universitaria (autoridades, docentes, administrativos y estudiantes).

El sistema opera bajo los principios de **ITIL v4**:
- **Catálogo de Servicios estructurado** con niveles de servicio (SLA) de respuesta y resolución parametrizables.
- **Ciclo de vida del ticket:** Registro, Asignación, Inspección técnica, Requerimiento de materiales, Resolución y Encuesta de satisfacción.
- **Multimódulo independiente:** Soporte técnico informático (**OTIC**) y mantenimiento de infraestructura (**Servicios Generales**).
- **Notificaciones automatizadas vía SMTP institucional** en cada cambio de estado clave.
- **Trazabilidad y auditoría completa** (registro de cambios por IP y usuario).

---

## 2. ARQUITECTURA DE LA SOLUCIÓN

```
                             [ NAVEGADORES WEB / CLIENTES ]
                       (Docentes, Alumnos, Técnicos, Jefaturas)
                                        │
                                        │ HTTPS / HTTP (Puerto 80 / 443)
                                        ▼
             ┌──────────────────────────────────────────────────────┐
             │       SERVIDOR WEB / REVERSE PROXY (IIS / NGINX)     │
             │  - Servir frontend estático (HTML5, JS, CSS, Assets) │
             │  - Enrutamiento SPA React                            │
             │  - Proxy inverso de peticiones /api/ hacia Node.js   │
             │  - Servir archivos adjuntos (/uploads/)              │
             └──────────────────────────┬───────────────────────────┘
                                        │ Proxy Local (127.0.0.1:4000)
                                        ▼
             ┌──────────────────────────────────────────────────────┐
             │            BACKEND API REST (Node.js / Express)      │
             │  - Gestión de Procesos: PM2                          │
             │  - Autenticación JWT + RBAC (Control de Acceso)      │
             │  - Lógica de negocio ITIL (SLA, correlativos, flujo) │
             │  - Motor de Notificaciones SMTP (Nodemailer)         │
             └─────────────┬──────────────────────────┬─────────────┘
                           │                          │
           Consultas SQL   │                          │ SMTP TLS (Puerto 587)
           Puerto 3306     ▼                          ▼
     ┌────────────────────────────┐            ┌───────────────────────────┐
     │ BASE DE DATOS MySQL 8.0    │            │ SERVIDOR DE CORREO SMTP   │
     │ Servidor: 172.16.0.189     │            │ (Google Workspace UNALM)  │
     │ Base: `mesaayuda_db`       │            │ notificaciones.mesadeayuda│
     └────────────────────────────┘            └───────────────────────────┘
```

### Componentes Tecnológicos:
1. **Frontend (Capa de Presentación):**
   - **Framework:** React 18 (TypeScript)
   - **Empaquetador:** Vite 5.x
   - **Estilos e Iconografía:** Tailwind CSS + Lucide React
   - **Estrategia de Despliegue:** Single Page Application (SPA) precompilada en archivos estáticos optimizados (`dist/`).

2. **Backend (Capa de Lógica de Negocio):**
   - **Runtime:** Node.js (v18.x o v20.x LTS)
   - **Framework:** Express con TypeScript
   - **Seguridad:** Helmet (cabeceras HTTP), CORS restringido, BCrypt (hash de contraseñas), JSON Web Tokens (JWT).
   - **Administrador de Procesos:** PM2 (gestión en segundo plano, reinicios automáticos, monitoreo de RAM/CPU).

3. **Capa de Persistencia (Base de Datos):**
   - **Motor:** MySQL 8.0 / MariaDB 10.5+
   - **Pool de Conexiones:** `mysql2/promise` con reconexión automática y límites de pool controlados.
   - **Ubicación en Red:** Servidor `172.16.0.189:3306` (Base de datos: `mesaayuda_db`).

4. **Almacenamiento de Archivos (Storage):**
   - Archivos adjuntos almacenados en disco físico con hashes únicos para evitar sobreescrituras y path traversal.
   - Directorio: `./uploads` (Windows) o `/var/www/mesa-ayuda/uploads` (Linux).

---

## 3. REQUISITOS DEL SISTEMA PARA PRODUCCIÓN

### 3.1. Requisitos de Hardware (Servidor de Aplicación):
- **Procesador (CPU):** 2 Cores mínimo (4 Cores recomendado).
- **Memoria RAM:** 4 GB mínimo (8 GB recomendado).
- **Disco Duro:** 40 GB libres mínimo (SSD recomendado para rendimiento en lectura de adjuntos y logs).

### 3.2. Requisitos de Software:
- **Sistema Operativo Soportado:**
  - **Windows Server:** 2016 / 2019 / 2022 con IIS (Internet Information Services) y URL Rewrite + ARR (Application Request Routing).
  - **Linux (Alternativa recomendada):** Ubuntu Server 22.04 LTS, Debian 12 o Rocky Linux 9 con Nginx.
- **Node.js:** Versión 18.x LTS o 20.x LTS.
- **NPM:** v9.x o superior.
- **PM2:** Global (`npm install -g pm2`).
- **MySQL Client / Driver:** Conectividad TCP habilitada hacia el servidor MySQL `172.16.0.189`.

### 3.3. Requisitos de Red y Puertos:
| Puerto | Protocolo | Origen | Destino | Propósito |
|---|---|---|---|---|
| **80 / 443** | TCP (HTTP/HTTPS) | Usuarios (Red UNALM / Internet) | Servidor Web (IIS/Nginx) | Acceso público a la plataforma |
| **4000** | TCP (HTTP Interno) | 127.0.0.1 (Localhost) | Node.js Backend | Comunicación API interna (no exponer al exterior) |
| **3306** | TCP (MySQL) | Servidor Backend | `172.16.0.189` | Conexión a la base de datos `mesaayuda_db` |
| **587** | TCP (SMTP TLS) | Servidor Backend | `smtp.gmail.com` | Envío de correos de notificación |

---

## 4. VARIABLES DE ENTORNO Y CONFIGURACIÓN (`.env`)

El archivo `.env` en la carpeta `server/` contiene los parámetros críticos de operación:

```ini
# =============================================================================
# SERVIDOR API NODE.JS
# =============================================================================
PORT=4000
NODE_ENV=production
API_PREFIX=/api

# =============================================================================
# CONEXIÓN BASE DE DATOS MYSQL (Configurar según el entorno)
# =============================================================================
DB_HOST=<HOST_O_IP_SERVIDOR_MYSQL>
DB_PORT=3306
DB_USER=<USUARIO_DE_BASE_DE_DATOS>
DB_PASS=<PASSWORD_DE_BASE_DE_DATOS>
DB_NAME=mesaayuda_db
DB_CONNECTION_LIMIT=20

# =============================================================================
# SEGURIDAD Y TOKEN JWT
# =============================================================================
JWT_SECRET=<SECRETO_CRIPTOGRAFICO_GENERADO>
JWT_EXPIRES_IN=24h

# =============================================================================
# ALMACENAMIENTO DE ADJUNTOS
# =============================================================================
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_BYTES=10485760 # 10 Megabytes

# =============================================================================
# POLÍTICA DE ACCESO (CORS) Y URL BASE
# =============================================================================
ALLOWED_ORIGIN=*
APP_URL=https://www.lamolina.edu.pe/pruebas1/david/mesa_ayuda

# =============================================================================
# NOTIFICACIONES POR CORREO (SMTP UNALM)
# =============================================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=notificaciones.mesadeayuda@lamolina.edu.pe
SMTP_PASS=qmhiirwmofafwbvy
SMTP_FROM="Mesa de Ayuda OTIC UNALM" <notificaciones.mesadeayuda@lamolina.edu.pe>
MESA_AYUDA_EMAIL=notificaciones.mesadeayuda@lamolina.edu.pe
```

---

## 5. DICCIONARIO DE DATOS Y ESQUEMA DE BASE DE DATOS

La base de datos `mesaayuda_db` está compuesta por las siguientes entidades principales:

1. **`roles`:** Define los perfiles RBAC del sistema:
   - `ADMIN`: Administrador general de plataforma y catálogo.
   - `SUPERVISOR`: Supervisor de soporte técnico informático (OTIC).
   - `SUPERVISOR_SG`: Supervisor de Servicios Generales.
   - `TECNICO`: Especialista técnico informático (OTIC).
   - `TECNICO_SG`: Especialista de Servicios Generales.
   - `SOLICITANTE`: Usuario institucional (alumno, docente, administrativo).
2. **`usuarios`:** Catálogo de usuarios, correos institucionales, credenciales encriptadas con `bcrypt` (10 rounds de salting), teléfono y dependencia/facultad.
3. **`categorias_servicio`:** Catálogo de requerimientos categorizados por módulo (OTIC vs Servicios Generales), con tiempos de SLA de respuesta y solución parametrizados en horas.
4. **`tickets`:** Entidad central del incidente/solicitud. Guarda correlativo (`OTIC-2026-XXXXX` o `SG-2026-XXXXX`), impacto, urgencia, prioridad resultante, solicitante, técnico asignado, estados (`REPORTADO`, `ASIGNADO`, `EN_PROCESO`, `RESUELTO`, `CERRADO`) y fechas de control SLA.
5. **`comentarios_ticket`:** Mensajería y notas de seguimiento. Soporta notas internas (visibles únicamente por personal de TI/SG) y mensajes públicos visibles por el solicitante.
6. **`adjuntos`:** Registro de archivos subidos (PDF, imágenes, documentos) con nombre original, hash físico en disco, tipo MIME y tamaño.
7. **`encuestas_satisfaccion`:** Evaluación de calidad ITIL con calificación 1 a 5 estrellas y comentarios post-atención.
8. **`logs_auditoria`:** Registro inmutable de cada acción realizada sobre un ticket (cambio de estado, reasignación, edición), registrando fecha, IP de origen y usuario ejecutor.
9. **`ticket_inspecciones` y `ticket_materiales`:** Fichas de inspección técnica en campo y solicitud de materiales/repuestos requeridos para la solución.

---

## 6. GUÍA DE MIGRACIÓN: ¿CÓMO MOVER EL SISTEMA A OTRO SERVIDOR?

El sistema es **100% modular y desacoplado**. Si se requiere trasladar a otro servidor físico, máquina virtual o entorno cloud, el procedimiento es el siguiente:

### Escenario A: Migración a otro Servidor Windows Server (con IIS)
1. **Instalar Prerrequisitos en el nuevo servidor:**
   - Node.js LTS (v18 o v20).
   - PM2: `npm install -g pm2`
   - En IIS: Instalar los módulos oficiales de Microsoft: **URL Rewrite** y **Application Request Routing (ARR)** (en ARR habilitar la opción `Enable proxy`).
2. **Copiar la carpeta del proyecto:**
   - Copiar la carpeta completa `MESA_AYUDA` al nuevo disco (por ejemplo `C:\inetpub\wwwroot\mesa_ayuda` o `D:\sistemas\mesa_ayuda`).
3. **Configurar IIS:**
   - Crear un Nuevo Sitio o Aplicación en IIS apuntando a la carpeta raíz del proyecto donde se encuentra `web.config`.
4. **Instalar dependencias y compilar:**
   ```powershell
   # En la carpeta client:
   cd client
   npm install
   npm run build

   # En la carpeta server:
   cd ../server
   npm install
   npm run build
   ```
5. **Iniciar el servicio con PM2:**
   ```powershell
   cd server
   pm2 start dist/app.js --name "mesa-ayuda-backend"
   pm2 save
   ```

---

### Escenario B: Migración a un Servidor Linux Dedicado (Ubuntu / Rocky Linux con Nginx)
Esta es la arquitectura estándar de alto rendimiento recomendada para entornos institucionales:

1. **Instalar paquetes en Linux:**
   ```bash
   sudo apt update && sudo apt install -y nodejs npm nginx git
   sudo npm install -g pm2
   ```
2. **Clonar o copiar el código en `/var/www/mesa-ayuda`**:
   ```bash
   sudo mkdir -p /var/www/mesa-ayuda/uploads
   sudo chown -R $USER:$USER /var/www/mesa-ayuda
   ```
3. **Compilar Frontend y Backend:**
   ```bash
   cd /var/www/mesa-ayuda/server && npm install && npm run build
   cd /var/www/mesa-ayuda/client && npm install && npm run build
   ```
4. **Configurar Nginx:**
   Copiar la plantilla incluida en `config/nginx.conf` a `/etc/nginx/sites-available/mesaayuda` y activar el sitio:
   ```bash
   sudo ln -s /etc/nginx/sites-available/mesaayuda /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```
5. **Iniciar y persistir el Backend con PM2:**
   ```bash
   cd /var/www/mesa-ayuda/server
   pm2 start dist/app.js --name "mesa-ayuda-backend"
   pm2 startup
   pm2 save
   ```

---

## 7. POLÍTICA DE RESPALDOS Y CONTINGENCIA

1. **Base de Datos MySQL:**
   - Programar volcado diario con `mysqldump`:
   ```bash
   mysqldump -h <HOST_BD> -u <USUARIO_BD> -p --single-transaction --quick mesaayuda_db > /backup/mesaayuda_$(date +%Y%m%d).sql
   ```
2. **Carpeta de Adjuntos (`/uploads`):**
   - Realizar backup incremental semanal del directorio de archivos adjuntos.
