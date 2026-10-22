# 🏛️ Sistema de Mesa de Ayuda OTIC UNALM

Sistema web para la gestión de tickets, incidencias y requerimientos de soporte técnico para la **Oficina de Tecnologías de la Información y Comunicaciones (OTIC)** de la **Universidad Nacional Agraria La Molina (UNALM)**.

---

## 🛠️ Stack Tecnológico

- **Backend:** Node.js 20 LTS, Express, TypeScript
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons
- **Base de Datos:** MySQL 8.0 (motor relacional InnoDB)
- **Autenticación:** JSON Web Tokens (JWT) / Integración opcional LDAP Active Directory
- **Almacenamiento de Adjuntos:** Sistema de archivos (`uploads/` con Multer)

---

## 📁 Estructura del Proyecto

```
mesa-ayuda/
├── schema.sql                 # DDL de Base de Datos y Seeders iniciales
├── config/
│   ├── .env.example           # Plantilla de variables de entorno
│   └── nginx.conf             # Configuración de proxy inverso Nginx
├── server/                    # API Backend (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/            # Conexión a Base de Datos y Entorno
│   │   ├── controllers/       # Controladores (Auth, Tickets, Usuarios, Catálogo)
│   │   ├── middlewares/       # JWT, RBAC, Multer, Manejador de Errores
│   │   ├── models/            # Consultas y modelos de datos
│   │   ├── routes/            # Definición de rutas API
│   │   ├── services/          # Servicios auxiliares (LDAP, Notificaciones)
│   │   └── utils/             # Funciones de utilidad (SLA, correlativos)
│   ├── package.json
│   └── tsconfig.json
└── client/                    # Frontend SPA (React + TypeScript + Vite)
    ├── src/
    │   ├── components/        # Componentes UI reutilizables
    │   ├── pages/             # Vistas principales del sistema
    │   └── services/          # Cliente HTTP API
    ├── package.json
    └── vite.config.ts
```

---

## ⚙️ Configuración y Ejecución

### 1. Variables de Entorno
Cree el archivo `.env` en `server/` basándose en la plantilla proporcionada:
```bash
cp config/.env.example server/.env
```
Configure los parámetros de conexión a MySQL, puertos, secretos JWT y parámetros SMTP/LDAP según corresponda.

### 2. Base de Datos
Importe el esquema y datos iniciales en una instancia MySQL 8.0:
```bash
mysql -u <usuario> -p <base_de_datos> < schema.sql
```

### 3. Backend (API)
```bash
cd server
npm install
npm run build
npm start
```
*Para desarrollo con hot-reload:* `npm run dev`

### 4. Frontend (Cliente)
```bash
cd client
npm install
npm run build
```
*Para servidor local de desarrollo:* `npm run dev`

---

## 👥 Cuentas de Prueba Pre-Cargadas (Seeders)

Contraseña por defecto: `Unalm2026$`

- **Administrador:** `admin.otic@lamolina.edu.pe`
- **Supervisor:** `supervisor.otic@lamolina.edu.pe`
- **Técnico Redes:** `tecnico.redes@lamolina.edu.pe`
- **Solicitante:** `20220145@lamolina.edu.pe`
