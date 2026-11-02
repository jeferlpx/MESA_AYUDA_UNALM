# 🏛️ Sistema Integral de Mesa de Ayuda y Gestión de Servicios
### Mesa de Ayuda In-House alineada a ITIL v4 (OTIC, Servicios Generales e Inspecciones Preventivas)

[![Node.js](https://img.shields.io/badge/Node.js-20_LTS-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![ITIL v4](https://img.shields.io/badge/ITIL-v4_Compliant-purple.svg)](https://www.axelos.com/)

Sistema web integral de mesa de ayuda y gestión de servicios diseñado para centralizar incidencias de tecnologías de la información (**OTIC**), mantenimiento físico e infraestructura (**Servicios Generales**), inspecciones preventivas (**SIGI**), trazabilidad de bienes patrimoniales y gestión de identidades en **Directorio Activo (LDAP)**.

---

## 🚀 Características Principales

- **Gestión Integral bajo ITIL v4:**
  - Clasificación de incidentes, solicitudes de servicio, mantenimientos preventivos y correctivos.
  - Matriz de cálculo automático de prioridad según **Impacto** y **Urgencia**.
  - Control riguroso de acuerdos de nivel de servicio (**SLAs**) con tiempos límites de primera respuesta y resolución en horario hábil.
  - Triage inteligente con soporte de derivación inmediata o manual y evaluación de complejidad técnica.
  - Registro de encuestas de satisfacción con estrellas de 1 a 5 y comentarios del solicitante.

- **Multimódulo Operativo:**
  - **Módulo OTIC:** Soporte a usuarios, conectividad y redes, sistemas de información, bases de datos y firma digital.
  - **Módulo de Servicios Generales:** Mantenimiento de infraestructura (electricidad, gasfitería, carpintería, cerrajería, obras civiles, pintura, áreas verdes y transporte), registro de materiales usados/sobrantes y emisión de órdenes de trabajo con firma.
  - **Módulo SIGI:** Inspecciones preventivas de edificios y aulas con conversión directa de hallazgos a tickets de mantenimiento.

- **Gestión de Bienes Institucionales y Trazabilidad:**
  - Vinculación de tickets con código patrimonial / número de inventario.
  - **Buscador de Hoja de Vida de Equipos:** Permite a cualquier usuario consultar el historial cronológico completo de atenciones y reparaciones efectuadas sobre un bien institucional.
  - Panel administrativo de auditoría de bienes y componentes intervenidos.

- **Doble Esquema de Autenticación & Solicitud de Cuentas:**
  - **Autenticación con Directorio Activo (LDAPS / LDAP):** Los usuarios inician sesión con sus credenciales de red institucionales.
  - **Sincronización Inteligente de Atributos:** Sincroniza nombres, oficina, facultad/dependencia, celular y anexo telefónico detectando solo cambios nuevos sin sobreescribir datos válidos.
  - **Fallback Local:** Acceso permanente de contingencia mediante base de datos MySQL con contraseñas encriptadas con `bcrypt`.
  - **Pestaña «Registrarme» en Login:** Formulario público para que personal nuevo (CAS, locadores, nombrados, docentes, contratados) solicite la creación de su cuenta en Directorio Activo con notificación automática por correo formal a `redes@lamolina.edu.pe`.

- **Notificaciones por Correo Electrónico (SMTP):**
  - Alertas automáticas con diseño corporativo al crear tickets, asignar especialistas, registrar comentarios y cerrar atenciones.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Headless UI |
| **Backend** | Node.js 20 LTS, Express, TypeScript, Multer, Nodemailer, LdapJS |
| **Base de Datos** | MySQL 8.0+ / MariaDB 10.5+ (motor InnoDB con transacciones y UTF8MB4) |
| **Seguridad** | JSON Web Tokens (JWT), Bcrypt, LDAPS Cifrado (SSL 636), CORS, Helmet |
| **Infraestructura** | Nginx (Reverse Proxy + SSL/TLS), PM2 (Cluster Manager), Docker & Docker Compose |

---

## 📁 Estructura del Repositorio

```
mesa-ayuda/
├── .env.example                     # Plantilla documentada de variables de entorno
├── .gitignore                       # Reglas de exclusión de seguridad y temporales
├── README.md                        # Presentación principal del sistema
├── MANUAL_DE_DESPLIEGUE_Y_CONFIGURACION.md # Manual técnico detallado paso a paso
├── schema.sql                       # Esquema DDL completo de MySQL y seeders
├── docker-compose.yml               # Despliegue con Docker (DB, Backend, Frontend)
├── config/
│   ├── .env.example                 # Variables de entorno para entornos dockerizados
│   ├── nginx.conf                   # Configuración del proxy inverso Nginx con SSL
│   └── init-db/
│       └── 01-schema.sql            # Script de inicialización para Docker MySQL
├── server/                          # API RESTful (Node.js + Express + TypeScript)
│   ├── src/                         # Código fuente TypeScript del backend
│   │   ├── config/                  # Conexión MySQL, migraciones y variables
│   │   ├── controllers/             # Lógica de controladores de negocio
│   │   ├── middlewares/             # Autenticación JWT, RBAC, subida de archivos
│   │   ├── models/                  # Consultas y modelos relacionales
│   │   ├── routes/                  # Definición de endpoints REST
│   │   ├── services/                # Servicios LDAP y despacho SMTP
│   │   └── utils/                   # Validadores, generador correlativo, SLA
│   ├── scripts/                     # Scripts auxiliares (sincronizador LDAP CLI)
│   ├── package.json
│   └── tsconfig.json
└── client/                          # Frontend SPA (React 18 + Vite + TypeScript)
    ├── src/
    │   ├── components/              # Componentes visuales y modales reutilizables
    │   ├── context/                 # Contextos globales (AuthContext, ThemeContext)
    │   ├── data/                    # Estructuras de datos (organigrama UNALM)
    │   ├── pages/                   # Vistas principales adaptadas por rol
    │   ├── services/                # Cliente HTTP para consumo de API REST
    │   └── types/                   # Definición de tipos TypeScript
    ├── package.json
    └── vite.config.ts
```

---

## ⚙️ Puesta en Marcha Rápida

### Opción A: Instalación Tradicional en Servidor Linux

Para una guía detallada paso a paso, consulte el [📘 Manual de Despliegue y Configuración](file:///var/www/mesa-ayuda/MANUAL_DE_DESPLIEGUE_Y_CONFIGURACION.md).

1. **Clonar e Ingresar al Directorio:**
   ```bash
   git clone https://github.com/jeferlpx/MESA_AYUDA_UNALM.git /var/www/mesa-ayuda
   cd /var/www/mesa-ayuda
   ```

2. **Crear e Importar la Base de Datos:**
   ```bash
   mysql -u root -p -e "CREATE DATABASE mesaayuda_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql -u root -p mesaayuda_db < schema.sql
   ```

3. **Configurar el Archivo de Entorno:**
   ```bash
   cp .env.example server/.env
   nano server/.env
   ```

4. **Compilar Backend y Frontend:**
   ```bash
   # Compilar Backend
   cd /var/www/mesa-ayuda/server && npm install && npm run build
   
   # Compilar Frontend
   cd /var/www/mesa-ayuda/client && npm install && npm run build
   ```

5. **Iniciar Backend con PM2 y Servir con Nginx:**
   ```bash
   cd /var/www/mesa-ayuda/server
   pm2 start dist/app.js --name "mesa-ayuda-backend" -i max
   pm2 save
   pm2 startup
   ```

---

### Opción B: Despliegue con Docker Compose

```bash
cp .env.example .env
docker-compose up -d --build
```
Esto iniciará:
- **MySQL 8.0:** en el puerto `3306` con la base de datos `mesaayuda_test_db` inicializada.
- **Backend API:** en el puerto `4000`.
- **Frontend SPA:** en los puertos `80` (HTTP) y `443` (HTTPS).

---

## 👥 Cuentas de Acceso y Credenciales de Demostración

El esquema de inicialización (`schema.sql`) incluye pre-configuradas cuentas de demostración para verificar de inmediato el funcionamiento por rol:

| Rol del Sistema | Correo de Acceso | Contraseña de Prueba |
| :--- | :--- | :--- |
| **Administrador General (Maestro)** | `admin` (o `admin@lamolina.edu.pe`) | `admin2026@` |
| **Supervisor OTIC (Jefatura)** | `supervisor.otic@lamolina.edu.pe` | `Unalm2026#` |
| **Mesa de Ayuda OTIC (Triage)** | `soporte@lamolina.edu.pe` | `Unalm2026#` |
| **Especialista Redes (Técnico)** | `tecnico.redes@lamolina.edu.pe` | `Unalm2026#` |
| **Mesa de Ayuda Servicios Generales** | `mesa.sg@lamolina.edu.pe` | `Unalm2026#` |
| **Especialista Electricidad / Mantenimiento** | `tecnico.electricidad@lamolina.edu.pe` | `Unalm2026#` |
| **Usuario Solicitante (Personal UNALM)** | Ingreso con cuenta de red institucional (Directorio Activo) o cuenta de prueba `20220145@lamolina.edu.pe` (`123456`) |

> ⚠️ **Seguridad en Producción:** Cambie inmediatamente la contraseña de la cuenta `admin` y personalice sus variables de conexión en `server/.env`.

---

## 🏢 Adaptación e Implementación en Otras Entidades

Este sistema fue desarrollado con arquitectura desacoplada para facilitar su portabilidad y despliegue en otras universidades, ministerios, municipalidades o empresas:

1. **Personalización Gráfica:** Sustituya los archivos `escudo-color.png` y `favicon.png` en `client/public/` por los logos de la nueva institución.
2. **Estructura Organizacional:** Ajuste las dependencias y oficinas en `client/src/data/unalmStructure.ts`.
3. **Catálogo de Servicios:** Administre las categorías y tiempos de respuesta SLA desde el panel web de **Catálogo de Servicios**.
4. **Dominio de Red:** Configure las variables `LDAP_DOMAIN`, `LDAP_URL` y `LDAP_BASE_DN` con el controlador de dominio propio de la organización.

---

## 📄 Licencia

Este proyecto está disponible bajo los términos de uso institucional y para fines de modernización de la gestión pública.
