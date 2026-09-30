# 📘 MANUAL TÉCNICO Y DE ADMINISTRACIÓN DEL SISTEMA
## Sistema de Mesa de Ayuda Institucional (OTIC & Servicios Generales - UNALM)
**Universidad Nacional Agraria La Molina**  
**Oficina de Tecnologías de la Información y Comunicaciones (OTIC)**  
**Versión del Sistema:** v2.4.0-PROD  
**Fecha de Publicación:** Septiembre 2026  

---

## 1. INTRODUCCIÓN Y ARQUITECTURA GENERAL

El **Sistema de Mesa de Ayuda UNALM** es una solución enterprise desarrollada in-house para la gestión integral del ciclo de vida de incidentes y requerimientos tecnológicos y de infraestructura física de la universidad, alineado a las mejores prácticas de **ITIL v4 Service Management**.

### 1.1. Diagrama de Arquitectura de 3 Capas

```
                     ┌──────────────────────────────────────────────┐
                     │            USUARIOS INSTITUCIONALES          │
                     │  (Docentes, Estudiantes, Personal, Técnicos)  │
                     └──────────────────────┬───────────────────────┘
                                            │ HTTPS / HTTP :80
                                            ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ SERVIDOR DE PRODUCCIÓN ALMALINUX (Docker Host)                                    │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │ CONTENEDOR FRONTEND (`mesaayuda-frontend` - Nginx Alpine)                   │  │
│  │  - Single Page Application (React 18 + Vite + TypeScript)                   │  │
│  │  - Reverse Proxy para API REST (`/api/` -> `backend:4000`)                   │  │
│  │  - Servidor de Archivos Adjuntos con validación MIME (`/uploads/`)          │  │
│  └──────────────────────────────────────┬──────────────────────────────────────┘  │
│                                         │ Red Docker Interna (`10.200.0.0/24`)    │
│                                         ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │ CONTENEDOR BACKEND (`mesaayuda-backend` - Node.js 20 LTS Alpine)            │  │
│  │  - Express REST API + TypeScript                                            │  │
│  │  - Motor de Triage, SLAs, Notificaciones y RBAC                             │  │
│  │  - Almacenamiento persistente en volumen Docker `uploads_data`             │  │
│  └──────────────────────────────────────┬──────────────────────────────────────┘  │
└─────────────────────────────────────────┼─────────────────────────────────────────┘
                                          │ TCP :3306 (Pool mysql2/promise)
                                          ▼
                     ┌──────────────────────────────────────────────┐
                     │          SERVIDOR MYSQL 8.0 CENTRAL          │
                     │  Base de Datos: `mesaayuda_db` (13 Tablas)   │
                     │  Zona Horaria: America/Lima (-05:00)         │
                     └──────────────────────────────────────────────┘
```

---

## 2. STACK TECNOLÓGICO Y DEPENDENCIAS

### 2.1. Capa Frontend (Client)
* **Framework:** React 18.3 con TypeScript 5.x.
* **Empaquetador y Build Tool:** Vite 5.x (construcción ultrarrápida y división de código por módulos).
* **Diseño y Estilos:** Tailwind CSS 3.4 con paleta institucional UNALM (verde molinero `#1b5e20` / `#059669`).
* **Iconografía:** Lucide React (iconografía SVG optimizada).
* **Gestión de Estado y Sesión:** React Context API (`AuthContext`) con persistencia en `localStorage`.
* **Servidor Web:** Nginx Alpine optimizado para SPA (`try_files $uri $uri/ /index.html`).

### 2.2. Capa Backend (Server)
* **Entorno de Ejecución:** Node.js 20 LTS (Alpine Linux).
* **Framework Web:** Express 4.19 con TypeScript.
* **Autenticación y Seguridad:** 
  - `jsonwebtoken` (JWT con algoritmo HMAC-SHA256, expiración 24h).
  - `bcryptjs` (hash irreversible de contraseñas con cost factor 10).
  - `helmet` (cabeceras HTTP seguras).
  - `cors` (política de orígenes controlados).
* **Gestión de Archivos:** `multer` con filtrado estricto por tipo MIME y limitación de 10 MB.
* **Acceso a Base de Datos:** `mysql2/promise` con pool de conexiones gestionadas (límite 20 conexiones).

### 2.3. Capa de Datos (Database)
* **RDBMS:** MySQL 8.0 / MariaDB 10.5+.
* **Juego de Caracteres:** `utf8mb4` con colación `utf8mb4_unicode_ci` (soporte completo de tildes, caracteres en español y emojis).

---

## 3. MODELO DE DATOS Y DICCIONARIO DE BASE DE DATOS (13 TABLAS)

El esquema de base de datos se encuentra completamente definido en `schema.sql`:

```
                       ┌──────────────────────┐
                       │        roles         │
                       └──────────┬───────────┘
                                  │ 1:N
                                  ▼
                       ┌──────────────────────┐
            ┌─────────>│       usuarios       │<──────────┐
            │          └──────────┬───────────┘           │
            │                     │ 1:N                   │
            │                     ▼                       │
┌───────────┴──────────┐ ┌────────────────────┐ ┌─────────┴────────────┐
│categorias_servicio   │ │      tickets       │ │ encuestas_satisfacc. │
└───────────┬──────────┘ └────────┬───────────┘ └──────────────────────┘
            │ 1:N                 │
            └─────────────────────┤ 1:N
                                  ├───────────> comentarios_ticket
                                  ├───────────> adjuntos
                                  ├───────────> inspecciones_infraestructura
                                  └───────────> materiales_movimientos_sg
```

### 3.1. Detalle de Entidades Principales

1. **`roles`:** Catálogo de 8 roles del sistema (`ADMIN`, `SUPERVISOR`, `TECNICO`, `SOLICITANTE`, `MESA_AYUDA`, `MESA_AYUDA_SG`, `TECNICO_SG`, `SUPERVISOR_SG`).
2. **`usuarios`:** Almacena los datos personales, correo institucional `@lamolina.edu.pe`, hash BCrypt, cargo, dependencia, teléfono, flag `debe_cambiar_password` y `correo_pendiente`.
3. **`categorias_servicio`:** Servicios estructurados con módulo (`OTIC` o `SERVICIOS_GENERALES`), SLAs pactados (`sla_horas_respuesta`, `sla_horas_resolucion`) y técnico por defecto.
4. **`tickets`:** Entidad central con código correlativo (`OTIC-YYYY-XXXXX` o `SG-YYYY-XXXXX`), estado ITIL, urgencia, impacto, fechas de apertura, respuesta, resolución y verificación de SLA.
5. **`comentarios_ticket`:** Mensajería bidireccional entre solicitante y técnico, con soporte de notas internas confidenciales (`es_nota_interna = true`).
6. **`adjuntos`:** Registro de evidencias subidas con nombre original, nombre criptográfico en disco, tamaño y tipo MIME.
7. **`encuestas_satisfaccion`:** Evaluación de calidad post-atención (1 a 5 estrellas, comentario, vinculación a `solicitante_id` y `tecnico_id`).
8. **`logs_auditoria`:** Trazabilidad forense inmutable (registra IP, usuario, acción, campos y valores anteriores/nuevos).
9. **`materiales_inventario_sg`:** Catálogo de 31 repuestos e insumos de talleres para Servicios Generales.
10. **`materiales_movimientos_sg`:** Kardex de despacho de materiales asociados a órdenes de trabajo.
11. **`inspecciones_infraestructura`:** Módulo SIGI de inspecciones técnicas de campo.
12. **`hallazgos_inspeccion`:** Detalle de daños o riesgos identificados en inspecciones.
13. **`configuracion_sistema`:** Parámetros operativos generales (auto-asignación, modo mantenimiento).

---

## 4. CATÁLOGO DE APIS REST Y ENDPOINTS

Todas las rutas están prefijadas por `/api` y requieren cabecera `Authorization: Bearer <TOKEN_JWT>`, excepto los endpoints públicos de autenticación.

### 4.1. Módulo de Autenticación (`/api/auth`)
* `POST /api/auth/login`: Autenticación con email institucional y password. Retorna JWT y perfil.
* `GET /api/auth/me`: Retorna los datos de la sesión activa y estado de cambio de contraseña.
* `POST /api/auth/complete-first-login`: Permite a los usuarios del padrón cambiar su clave temporal inicial (`123456`) y validar su dependencia.
* `PUT /api/auth/profile`: Actualización de teléfono institucional y anexo telefónico.

### 4.2. Módulo de Tickets (`/api/tickets`)
* `GET /api/tickets`: Listado paginado de tickets según rol (el solicitante solo ve los suyos; el técnico ve sus asignados; la mesa de ayuda ve la cola global).
* `GET /api/tickets/:id`: Consulta detallada de ticket con línea de tiempo, comentarios públicos, notas internas (si es técnico/admin) y adjuntos.
* `POST /api/tickets`: Creación de nuevo ticket (`multipart/form-data`) con carga de evidencias.
* `PUT /api/tickets/:id/assign`: Asignación o reasignación de especialista técnico por Mesa de Ayuda.
* `PUT /api/tickets/:id/status`: Transición de estado ITIL (`EN_EJECUCION`, `OBSERVADO`, etc.).
* `PUT /api/tickets/:id/resolve`: Cierre técnico con informe de diagnóstico y cálculo automático de SLA.
* `POST /api/tickets/:id/comments`: Envío de mensaje público o nota interna confidencial.
* `POST /api/tickets/:id/survey`: Registro de encuesta de satisfacción (1 a 5 estrellas). Solo permitido al solicitante propietario del ticket resuelto.

### 4.3. Módulo de Catálogo y Administración (`/api/catalog`, `/api/admin`)
* `GET /api/catalog/categories/all`: Obtiene las categorías de servicio con sus tiempos SLA.
* `POST /api/catalog/categories`: Creación de nueva categoría de servicio (Solo Admin).
* `GET /api/admin/dashboard`: Métricas directivas, KPIs de resolución, cumplimiento de SLA y gráficos para jefaturas.
* `GET /api/admin/users`: Gestión y administración del padrón de usuarios y técnicos.

---

## 5. GUÍA DE DESPLIEGUE, CONFIGURACIÓN Y MANTENIMIENTO

### 5.1. Variables de Entorno (`.env`)
El sistema lee su configuración desde el archivo `.env` en la raíz del proyecto:

```bash
# Servidor Node.js
PORT=4000
NODE_ENV=production
API_PREFIX=/api

# Base de Datos MySQL Central
DB_HOST=172.16.0.189
DB_PORT=3306
DB_USER=user_helpdesk
DB_PASSWORD=ayuda2026$
DB_NAME=mesaayuda_db
DB_CONNECTION_LIMIT=20

# Autenticación y Seguridad
JWT_SECRET=genera_un_hash_secreto_robusto_aqui
JWT_EXPIRES_IN=24h

# Almacenamiento de Adjuntos
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE_BYTES=10485760 # 10MB
```

### 5.2. Comandos Operativos de Docker Compose
```bash
# Iniciar servicios en segundo plano y compilar cambios
docker compose up -d --build

# Ver estado y salud de los contenedores
docker compose ps

# Visualizar logs del backend en tiempo real
docker compose logs -f backend

# Reiniciar servicios
docker compose restart

# Detener los contenedores sin borrar volúmenes
docker compose down
```

### 5.3. Procedimiento de Respaldos (Backup y Restore)
```bash
# 1. Volcado diario en caliente de la base de datos
mysqldump -h <IP_BD> -u <USUARIO> -p --single-transaction --quick mesaayuda_db > /backup/backup_$(date +%Y%m%d).sql

# 2. Respaldo de archivos adjuntos (volumen Docker uploads_data)
tar -czvf /backup/uploads_$(date +%Y%m%d).tar.gz /var/lib/docker/volumes/mesa-ayuda_uploads_data/_data

# 3. Restauración de base de datos
mysql -h <IP_BD> -u <USUARIO> -p mesaayuda_db < /backup/backup_20260930.sql
```
