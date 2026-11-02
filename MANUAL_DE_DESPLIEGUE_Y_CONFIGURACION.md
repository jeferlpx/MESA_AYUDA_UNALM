# 📘 Manual Integral de Despliegue, Configuración y Credenciales
## Sistema Integral de Mesa de Ayuda y Gestión de Servicios (ITIL v4)

Este documento proporciona la guía técnica completa para implementar, desplegar, configurar y administrar el **Sistema de Mesa de Ayuda** en cualquier entidad pública, universidad, municipalidad o empresa privada.

---

## 📑 Tabla de Contenidos

1. [Visión General y Arquitectura](#1-visión-general-y-arquitectura)
2. [Requisitos de Infraestructura](#2-requisitos-de-infraestructura)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Instalación Paso a Paso en Linux (RHEL / AlmaLinux / Ubuntu / Debian)](#4-instalación-paso-a-paso-en-linux)
5. [Despliegue Alternativo con Docker Compose](#5-despliegue-alternativo-con-docker-compose)
6. [Configuración de Variables de Entorno (`.env`)](#6-configuración-de-variables-de-entorno-env)
7. [Integración con Directorio Activo (Active Directory / LDAP / LDAPS)](#7-integración-con-directorio-activo)
8. [Configuración del Servicio de Correo (SMTP)](#8-configuración-del-servicio-de-correo-smtp)
9. [Cuentas Maestras, Roles y Credenciales de Demostración](#9-cuentas-maestras-roles-y-credenciales-de-demostración)
10. [Módulos Especializados del Sistema](#10-módulos-especializados-del-sistema)
11. [Guía de Personalización para Otras Entidades](#11-guía-de-personalización-para-otras-entidades)
12. [Mantenimiento, Respaldos y Monitoreo](#12-mantenimiento-respaldos-y-monitoreo)

---

## 1. Visión General y Arquitectura

El sistema es una solución empresarial diseñada bajo lineamientos de **ITIL v4** para centralizar la atención al usuario, tickets de soporte técnico, órdenes de trabajo para infraestructura y trazabilidad patrimonial.

```
┌────────────────────────────────────────────────────────┐
│              USUARIOS / NAVEGADORES WEB                │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS (Puerto 443)
                           ▼
┌────────────────────────────────────────────────────────┐
│            NGINX (Reverse Proxy & SSL / TLS)           │
├──────────────────────────┬─────────────────────────────┤
│   /  (SPA Estático)      │   /api/ (Proxy Pass)        │
│   client/dist            │   http://127.0.0.1:4000     │
└──────────┬───────────────┴──────────────┬──────────────┘
           │                              │
           ▼                              ▼
┌──────────────────────┐       ┌────────────────────────┐
│  FRONTEND (React 18) │       │   BACKEND (Node.js 20) │
│  TypeScript + Vite   │       │   Express + TypeScript │
│  Tailwind CSS        │       │   PM2 Cluster Mode     │
└──────────────────────┘       └──────────┬─────────────┘
                                          │
       ┌───────────────────┬──────────────┼───────────────────┐
       ▼                   ▼              ▼                   ▼
┌───────────────┐  ┌───────────────┐ ┌─────────────┐  ┌───────────────┐
│  MySQL 8.0+   │  │ Active Direct.│ │ SMTP Relay  │  │ File Server / │
│  InnoDB UTF8  │  │ LDAP / LDAPS  │ │ Gmail / 365 │  │ Adjuntos NFS  │
└───────────────┘  └───────────────┘ └─────────────┘  └───────────────┘
```

### Características Principales:
- **Multimódulo Nativo:** Separación operativa entre **OTIC** (tecnologías de información) y **Servicios Generales** (obras, electricidad, mantenimiento civil, vehículos).
- **Control de Acceso Basado en Roles (RBAC):** Administradores, Supervisores, Especialistas Técnicos, Triage/Mesa de Ayuda y Solicitantes.
- **Doble Esquema de Autenticación:** Autenticación institucional contra Directorio Activo (LDAP/LDAPS) con fallback seguro a base de datos relacional local (MySQL).
- **Gestión y Trazabilidad de Bienes:** Módulo de consulta de hoja de vida y atenciones técnicas por número de inventario / código patrimonial.
- **Registro Público de Solicitudes de Cuenta:** Módulo para que nuevo personal solicite el alta en el Directorio Activo con notificación automática por correo formal a la administración de redes.
- **Encuestas de Calidad y Satisfacción:** Medición de niveles de servicio con cálculo automático de cumplimiento de SLA.

---

## 2. Requisitos de Infraestructura

### Requisitos de Servidor (Hardware Mínimo Recomendado):
- **CPU:** 2 Cores vCPU (Recomendado: 4 Cores).
- **Memoria RAM:** 4 GB (Recomendado: 8 GB).
- **Disco:** 40 GB SSD (o almacenamiento en red para `/srv/repositorio/documentos`).

### Software y Dependencias Base:
| Componente | Versión Mínima | Finalidad |
| :--- | :--- | :--- |
| **Linux OS** | RHEL 8+, AlmaLinux 8+, Ubuntu 20.04+, Debian 11+ | Sistema Operativo base |
| **Node.js** | v20.x LTS o v22.x LTS | Motor de ejecución del Backend |
| **npm** | v10.x+ | Gestor de paquetes |
| **MySQL / MariaDB** | MySQL 8.0+ / MariaDB 10.5+ | Base de datos relacional con soporte JSON y UTF8MB4 |
| **Nginx** | 1.20+ | Servidor Web y Proxy Inverso con SSL/TLS |
| **PM2** | 5.3+ | Gestor de procesos en producción con reinicio automático |

---

## 3. Estructura del Proyecto

```
mesa-ayuda/
├── .env.example                     # Plantilla base de variables de entorno
├── .gitignore                       # Filtros de exclusión de git y seguridad
├── README.md                        # Presentación e instrucciones rápidas
├── MANUAL_DE_DESPLIEGUE_Y_CONFIGURACION.md # Este documento técnico
├── docker-compose.yml               # Orquestación lista para Docker
├── schema.sql                       # DDL completo de base de datos y seeders
├── config/
│   ├── .env.example                 # Copia de variables de entorno para Docker
│   ├── nginx.conf                   # Plantilla de configuración Nginx para producción
│   └── init-db/
│       └── 01-schema.sql            # Script de inicialización de BD para Docker
├── server/                          # API Backend (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/                  # Conexión MySQL (db.ts) y variables (env.ts)
│   │   ├── controllers/             # Controladores de negocio (Auth, Tickets, etc.)
│   │   ├── middlewares/             # JWT, RBAC, Multer, Errores
│   │   ├── models/                  # Consultas parametrizadas a base de datos
│   │   ├── routes/                  # Definición de rutas REST
│   │   ├── services/                # Servicios LDAP y Notificaciones SMTP
│   │   └── utils/                   # Validadores, generador correlativo, SLA
│   ├── scripts/
│   │   └── sync-ldap-users.js       # Script de sincronización inteligente de usuarios AD
│   ├── package.json
│   └── tsconfig.json
└── client/                          # Frontend SPA (React 18 + Vite + TypeScript)
    ├── src/
    │   ├── components/              # Modales, Selectores, Rastreadores, Timeline
    │   ├── context/                 # Contextos Auth y Theme
    │   ├── data/                    # Organigrama y catálogos institucionales
    │   ├── pages/                   # Vistas principales del sistema por rol
    │   ├── services/                # Cliente API HTTP
    │   └── types/                   # Tipos de TypeScript e interfaces
    ├── package.json
    └── vite.config.ts
```

---

## 4. Instalación Paso a Paso en Linux

### Paso 1: Clonar el Repositorio
```bash
git clone https://github.com/jeferlpx/MESA_AYUDA_UNALM.git /var/www/mesa-ayuda
cd /var/www/mesa-ayuda
```

### Paso 2: Configurar la Base de Datos MySQL
1. Acceda a su gestor MySQL como administrador:
   ```bash
   mysql -u root -p
   ```
2. Cree la base de datos y el usuario con privilegios:
   ```sql
   CREATE DATABASE IF NOT EXISTS mesaayuda_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER IF NOT EXISTS 'user_helpdesk'@'%' IDENTIFIED BY 'TuPasswordSeguro2026$';
   GRANT ALL PRIVILEGES ON mesaayuda_db.* TO 'user_helpdesk'@'%';
   FLUSH PRIVILEGES;
   EXIT;
   ```
3. Importe el esquema completo y datos iniciales:
   ```bash
   mysql -u user_helpdesk -pTuPasswordSeguro2026$ mesaayuda_db < schema.sql
   ```

### Paso 3: Configurar Variables de Entorno del Backend
Copie la plantilla `.env.example` y edite los valores con los de su entorno:
```bash
cp .env.example server/.env
nano server/.env
```
*(Consulte la sección 6 de este manual para la explicación de cada variable)*.

### Paso 4: Instalar Dependencias y Compilar Backend
```bash
cd /var/www/mesa-ayuda/server
npm install
npm run build
```

### Paso 5: Instalar Dependencias y Compilar Frontend
```bash
cd /var/www/mesa-ayuda/client
npm install
npm run build
```
Los archivos estáticos de producción se generarán en `/var/www/mesa-ayuda/client/dist`.

### Paso 6: Configurar Almacenamiento de Archivos Adjuntos
Cree la carpeta de uploads y otorgue permisos al usuario del servidor web (`nginx` o `www-data`):
```bash
sudo mkdir -p /var/www/mesa-ayuda/uploads
sudo chown -R admin:nginx /var/www/mesa-ayuda/uploads
sudo chmod -R 775 /var/www/mesa-ayuda/uploads
```

### Paso 7: Configurar y Ejecutar Backend con PM2
1. Instale PM2 globalmente si no lo tiene:
   ```bash
   sudo npm install -g pm2
   ```
2. Inicie el proceso con el archivo de configuración:
   ```bash
   cd /var/www/mesa-ayuda/server
   pm2 start dist/app.js --name "mesa-ayuda-backend" -i max
   ```
3. Configure PM2 para iniciar automáticamente tras reinicios del servidor:
   ```bash
   pm2 save
   pm2 startup
   ```

### Paso 8: Configurar Servidor Web Nginx
1. Copie la configuración de Nginx:
   ```bash
   sudo cp /var/www/mesa-ayuda/config/nginx.conf /etc/nginx/conf.d/mesa-ayuda.conf
   ```
2. Ajuste el nombre de dominio (`server_name`) y rutas de certificados SSL en el archivo `/etc/nginx/conf.d/mesa-ayuda.conf`.
3. Verifique la sintaxis y recargue Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   sudo systemctl enable nginx
   ```

---

## 5. Despliegue Alternativo con Docker Compose

Si prefiere un entorno contenedorizado sin dependencias locales:

1. Configure las variables en el archivo `.env` en la raíz.
2. Inicie los contenedores con Docker Compose:
   ```bash
   docker-compose up -d --build
   ```
3. Esto levantará:
   - `mesaayuda-db-test`: Contenedor MySQL 8.0 en puerto 3306 con esquema importado.
   - `mesaayuda-backend`: Contenedor Node.js en puerto 4000.
   - `mesaayuda-frontend`: Servidor Nginx en puertos 80 y 443.

---

## 6. Configuración de Variables de Entorno (`.env`)

A continuación se detalla la función de cada parámetro en `server/.env`:

| Variable | Valor de Ejemplo | Descripción |
| :--- | :--- | :--- |
| `PORT` | `4000` | Puerto TCP en el que escucha la API Express |
| `NODE_ENV` | `production` | Modo de entorno (`production` o `development`) |
| `API_PREFIX` | `/api` | Prefijo para todas las rutas HTTP de la API |
| `DB_HOST` | `127.0.0.1` | Dirección IP o hostname del servidor MySQL |
| `DB_PORT` | `3306` | Puerto de conexión a MySQL |
| `DB_USER` | `user_helpdesk` | Usuario con permisos en la base de datos |
| `DB_PASSWORD` | `ayuda2026$` | Contraseña del usuario MySQL |
| `DB_NAME` | `mesaayuda_db` | Nombre de la base de datos relacional |
| `DB_CONNECTION_LIMIT`| `20` | Tamaño del pool de conexiones simultáneas |
| `JWT_SECRET` | `UnaClaveSecretaMuyLarga2026$` | Clave secreta para firmar los tokens JWT de sesión |
| `JWT_EXPIRES_IN` | `24h` | Tiempo de vida del token de sesión antes de expirar |
| `UPLOAD_DIR` | `/var/www/mesa-ayuda/uploads` | Directorio en disco para almacenar imágenes y adjuntos |
| `MAX_FILE_SIZE_BYTES`| `10485760` | Tamaño límite por archivo adjunto (10 MB) |
| `ALLOWED_ORIGIN` | `*` | Orígenes autorizados en cabeceras CORS |
| `APP_URL` | `https://mesadeayuda.tuentidad.gob.pe` | URL pública del portal web |
| `SMTP_HOST` | `smtp.gmail.com` | Servidor de salida de correos electrónicos |
| `SMTP_PORT` | `587` | Puerto de conexión SMTP (`587` STARTTLS, `465` SSL) |
| `SMTP_SECURE` | `false` | `false` para puerto 587, `true` para puerto 465 |
| `SMTP_USER` | `notificaciones@tuentidad.gob.pe` | Usuario o cuenta de correo remitente |
| `SMTP_PASS` | `qmhiirwmofafwbvy` | Contraseña o App Password de Google / Office 365 |
| `SMTP_FROM` | `"Mesa de Ayuda" <correo@dominio>` | Nombre y dirección mostrados en el remitente |
| `MESA_AYUDA_EMAIL`| `redes@tuentidad.gob.pe` | Correo receptor de solicitudes de alta de cuentas |
| `LDAP_ENABLED` | `true` | `true` para activar login con Directorio Activo, `false` para local |
| `LDAP_URL` | `ldaps://172.16.0.8:636` | URL del Controlador de Dominio (LDAP o LDAPS) |
| `LDAP_BASE_DN` | `DC=tuentidad,DC=gob,DC=pe` | Base de búsqueda de usuarios en el árbol AD |
| `LDAP_DOMAIN` | `tuentidad.gob.pe` | Dominio institucional (sufijo UPN) |
| `LDAP_BIND_DN` | `svc_mesa@tuentidad.gob.pe` | Cuenta de servicio con permisos de lectura en AD |
| `LDAP_BIND_PASSWORD`| `PasswordDeCuentaDeServicio` | Contraseña de la cuenta de servicio AD |
| `LDAP_TIMEOUT_MS` | `6000` | Tiempo de espera límite en milisegundos para consultas LDAP |

---

## 7. Integración con Directorio Activo

El sistema permite que todos los colaboradores (docentes, administrativos, técnicos y contratados) ingresen con sus credenciales institucionales de Windows sin crear contraseñas adicionales.

### ¿Cómo Funciona la Autenticación Híbrida?
1. Cuando un usuario inicia sesión con `usuario@dominio` o simplemente `usuario`:
2. El sistema intenta autenticar contra el **Directorio Activo** mediante bind directo vía LDAPS cifrado (puerto 636).
3. Si la autenticación en AD es exitosa:
   - Se consulta en la base de datos local si el usuario ya existe.
   - Si no existe, se auto-aprovisiona automáticamente con el rol por defecto (`SOLICITANTE`).
   - Se extraen de AD sus atributos (`displayName`, `department`, `telephoneNumber`, `mobile`, `mail`, `title`) y se actualiza su perfil local.
   - Se genera el token JWT y se concede acceso.
4. Si falla la conexión a AD o `LDAP_ENABLED=false`:
   - El sistema realiza fallback automático verificando contra la tabla `usuarios` en MySQL con hash `bcrypt`. Esto garantiza que los administradores y técnicos de soporte siempre puedan ingresar incluso si el Controlador de Dominio de la red está temporalmente inaccesible.

### Sincronización Inteligente de Usuarios LDAP:
El sistema incluye un script automatizado para actualizar la nómina de usuarios desde Active Directory sin sobreescribir datos existentes que no hayan cambiado:
```bash
node /var/www/mesa-ayuda/server/scripts/sync-ldap-users.js
```
Para programar una sincronización diaria automática, añada al cron (`crontab -e`):
```cron
0 3 * * * node /var/www/mesa-ayuda/server/scripts/sync-ldap-users.js >> /var/log/sync-ldap.log 2>&1
```

---

## 8. Configuración del Servicio de Correo (SMTP)

El sistema envía notificaciones en tiempo real para:
- Creación de ticket al solicitante con número de correlativo y enlace de seguimiento.
- Alerta de asignación al técnico responsable.
- Notificación de resolución y enlace a la Encuesta de Calidad.
- **Aviso Formal de Solicitud de Cuenta en Directorio Activo:** Despacho estructurado a `redes@tuentidad.gob.pe` con la ficha completa del solicitante.

### Ejemplo con Google Workspace (Gmail):
1. Inicie sesión en la cuenta remitente en [Google Account Security](https://myaccount.google.com/security).
2. Active la Verificación en 2 pasos.
3. Genere una **Contraseña de aplicación** (16 caracteres) seleccionando categoría "Correo".
4. Ingrese esa contraseña en `SMTP_PASS` en su archivo `.env`.

---

## 9. Cuentas Maestras, Roles y Credenciales de Demostración

El esquema de base de datos (`schema.sql`) incluye pre-configuradas las siguientes cuentas para pruebas iniciales:

### 1. Administrador General del Sistema
- **Usuario:** `admin` (o `admin@lamolina.edu.pe`)
- **Contraseña Inicial:** `admin2026@`
- **Rol:** `ADMIN` (Control absoluto de catálogo, SLAs, usuarios y auditoría).

### 2. Cuentas Demostrativas por Rol (Ambiente de Pruebas)
Contraseña por defecto de prueba: `Unalm2026#` o `123456`:

| Rol | Correo Demostrativo | Área Operativa |
| :--- | :--- | :--- |
| **SUPERVISOR** | `supervisor.otic@lamolina.edu.pe` | Jefatura OTIC / Monitoreo de SLAs |
| **MESA_AYUDA** | `soporte@lamolina.edu.pe` | Triage, evaluación de complejidad y derivación OTIC |
| **TECNICO** | `tecnico.redes@lamolina.edu.pe` | Especialista en Redes y Conectividad |
| **MESA_AYUDA_SG** | `mesa.sg@lamolina.edu.pe` | Triage y derivación de Servicios Generales |
| **TECNICO_SG** | `tecnico.electricidad@lamolina.edu.pe` | Especialista en Electricidad y Mantenimiento |
| **SOLICITANTE** | `20220145@lamolina.edu.pe` | Usuario final / Portal de solicitudes |

> 🔒 **Recomendación de Seguridad:** En entornos de producción real, cambie inmediatamente la contraseña de la cuenta `admin` desde el módulo de Gestión de Usuarios y revoque o elimine las cuentas demostrativas que no correspondan a personal activo.

---

## 10. Módulos Especializados del Sistema

### A. Módulo de Bienes Institucionales y Trazabilidad Técnica
- Permite vincular cualquier ticket a un equipo o bien patrimonial marcando el check "¿El requerimiento corresponde a un equipo o bien institucional?".
- Permite ingresar el **Número de Inventario / Código Patrimonial**.
- Botón accesible para todos los usuarios: **"Consultar Historial de Bien Institucional"** que despliega la hoja de vida completa del equipo con todas las atenciones previas, diagnósticos, técnicos intervinientes y fechas.
- Módulo administrativo exclusivo en menú lateral: **Bienes y Equipos**, con tabla filtrable por código patrimonial, estado del ticket, solicitante y fecha de última intervención.

### B. Módulo de Solicitud de Cuentas en Directorio Activo
- Ubicado en la pantalla de acceso en la pestaña **"Registrarme"**.
- Diseñado para personal nuevo (locadores, CAS, nombrados, contratados, practicantes) que aún no cuente con usuario de red.
- Captura: Nombre y apellidos completos, DNI (8 dígitos), condición contractual, correo, dependencia u oficina orgánica, celular y anexo.
- Envía un correo institucional formal y tabulado al equipo de Redes y Telecomunicaciones (`redes@tuentidad.gob.pe`), con copia al solicitante, y guarda la solicitud en la tabla `solicitudes_cuenta_ad`.

### C. Módulo de Servicios Generales e Infraestructura
- Categorización de tickets por rubros físicos (electricidad, carpintería, cerrajería, pintura, sanitarias, obras civiles, áreas verdes, transporte).
- Control de inspecciones preventivas físicas (SIGI).
- Registro de materiales usados y sobrantes por orden de trabajo.

---

## 11. Guía de Personalización para Otras Entidades

Para adaptar este sistema a otra institución o empresa:

1. **Nombre y Logos de la Entidad:**
   - Reemplace las imágenes en `client/public/`:
     - `client/public/escudo-color.png`: Logo institucional principal.
     - `client/public/favicon.png`: Ícono para el navegador.
   - En `client/index.html` modifique el título de la página y metadatos.

2. **Organigrama y Dependencias:**
   - Edite el archivo `client/src/data/unalmStructure.ts` para definir las facultades, gerencias, direcciones y oficinas propias de la nueva entidad.

3. **Catálogo de Servicios y SLAs:**
   - Desde la interfaz web del sistema, ingrese como `admin` al menú **Catálogo de Servicios**.
   - Puede crear, modificar o eliminar categorías de servicio tanto para TI como para Mantenimiento General, asignando tiempos límites de primera respuesta y tiempos límites de resolución en horas hábiles.

4. **Dominio de Red y Active Directory:**
   - En `server/.env`, actualice `LDAP_DOMAIN`, `LDAP_BASE_DN` y `LDAP_URL` con los datos del controlador de dominio de la nueva institución.

---

## 12. Mantenimiento, Respaldos y Monitoreo

### Respaldo de Base de Datos:
Ejecute periódicamente un volcado de seguridad con `mysqldump`:
```bash
mysqldump -u user_helpdesk -p mesaayuda_db > backup_mesaayuda_$(date +%Y%m%d_%H%M%S).sql
```

### Monitoreo en Tiempo Real:
- Para revisar el estado del backend:
  ```bash
  pm2 status
  ```
- Para ver logs de ejecución en vivo:
  ```bash
  pm2 logs mesa-ayuda-backend
  ```
- Para revisar logs de Nginx:
  ```bash
  sudo tail -f /var/log/nginx/mesaayuda_ssl_access.log
  sudo tail -f /var/log/nginx/mesaayuda_ssl_error.log
  ```

---
*Desarrollado para la Oficina de Tecnologías de la Información y Comunicaciones (OTIC) - UNALM.*  
*Adaptable y portable para entidades del sector público y privado.*
