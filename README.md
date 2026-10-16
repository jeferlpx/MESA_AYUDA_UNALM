# 🏛️ SISTEMA DE MESA DE AYUDA IN-HOUSE (OTIC UNALM) - ITIL v4 READY (v2.5.1)

Sistema enterprise de gestión de tickets, incidentes y solicitudes de servicio para la **Oficina de Tecnologías de la Información y Comunicaciones (OTIC)** de la **Universidad Nacional Agraria La Molina (UNALM)**.

### ✨ Capacidades Principales
- **Autenticación con Directorio Activo (LDAP / Active Directory UNALM - v2.5.1):** Inicio de sesión corporativo integrado con el Domain Controller de la UNALM (`lamolina.edu.pe`), canal seguro LDAPS (puerto 636), botón institucional destacado en el login y auto-aprovisionamiento de perfiles. Ver [GUIA_INTEGRACION_DIRECTORIO_ACTIVO_LDAP.md](file:///var/www/mesa-ayuda/GUIA_INTEGRACION_DIRECTORIO_ACTIVO_LDAP.md).
- **Especialidades Técnicas OTIC Diferenciadas:** Roles específicos para **Especialista en Soporte Técnico**, **Especialista en Redes** y **Especialista en Desarrollo**, además de especialistas en Infraestructura y Mantenimiento de Servicios Generales.
- **Arquitectura Multimódulo:** Atención especializada independiente para **OTIC** e infraestructura de **Servicios Generales**.
- **Asignación Multitécnico Colaborativo (Exclusivo OTIC):** Conformación de equipos de intervención (1 Técnico Principal + N Técnicos de Apoyo) cuando la complejidad técnica es crítica o altamente especializada (`COMPLEJA`).
- **Resolución con Informe Técnico Digital (Opcional):** Los técnicos pueden adjuntar documentación formal (.pdf, .docx, imágenes) al momento de registrar la solución.
- **Medición de SLAs Automatizada:** Tiempos de primera respuesta y resolución computados en tiempo real con ponderación por complejidad técnica.
- **Encuestas de Calidad y Calificación:** Evaluación de satisfacción obligatoria de 1 a 5 estrellas para el cierre formal del ticket.

---

## 📌 Requisitos de Entorno y Variables de Configuración

- **Base de Datos:** MySQL 8.0 (`mesaayuda_db`)
- **Backend API:** Node.js 20 LTS + Express + TypeScript (Puerto 4000)
- **Frontend Portal:** React 18 + Vite (Puerto 80 / Nginx)
- **Almacenamiento de Adjuntos:** Directorio `/app/uploads` (Docker) o `uploads/`
- **Configuración:** Las credenciales de base de datos y llaves de seguridad se configuran exclusivamente mediante variables de entorno en el archivo `.env` (ver `.env.example`). Nunca exponga credenciales en el repositorio.

---

## 🚀 Estructura del Proyecto

```
y:/pruebas1/David/MESA_AYUDA/
├── schema.sql                 # DDL de MySQL + Seeders de Usuarios/Servicios UNALM
├── config/
│   ├── .env.example           # Variables de entorno
│   └── nginx.conf             # Reverse Proxy & Servidor de Adjuntos Nginx
├── server/                    # API REST Backend (Node.js/TypeScript)
│   ├── src/
│   │   ├── config/            # DB Connection & Env
│   │   ├── controllers/       # Auth, Tickets, Users, Catalog
│   │   ├── middlewares/       # JWT Auth, RBAC, Multer, ErrorHandler
│   │   ├── models/            # Queries MySQL para ITIL
│   │   ├── routes/            # Endpoints Express
│   │   └── utils/             # Generador Correlativo OTIC-2026-XXXXX & SLA
│   └── package.json
└── client/                    # Frontend UI (React + Tailwind + Lucide)
    ├── src/
    │   ├── components/        # UI System: Navbar, Sidebar, Badges, Drawer, Modal, FileUploader
    │   ├── pages/             # Login, SolicitantPortal, SpecialistDashboard, AdminCatalog, TicketDetail
    │   └── services/          # API Fetch Client
    └── package.json
```

---

## ⚡ Pasos para el Despliegue en el Servidor Linux UNALM

### 1. Cargar la Base de Datos en MySQL
```bash
mysql -h <HOST_BD> -u <USUARIO_BD> -p mesaayuda_db < schema.sql
```

### 2. Iniciar Backend Node.js
```bash
cd /var/www/mesa-ayuda/server
cp ../config/.env.example .env
npm install
npm run build
npm start
```

### 3. Compilar el Frontend React
```bash
cd /var/www/mesa-ayuda/client
npm install
npm run build
```

### 4. Configurar Nginx
Copiar `config/nginx.conf` a `/etc/nginx/conf.d/mesaayuda.conf` y reiniciar Nginx:
```bash
sudo cp config/nginx.conf /etc/nginx/conf.d/mesaayuda.conf
sudo nginx -t
sudo systemctl reload nginx
```

---

## 👥 Usuarios Demo Pre-Cargados (Seeders)

Todos los usuarios tienen la contraseña de prueba: `Unalm2026$`

1. **Administrador General OTIC:** `admin.otic@lamolina.edu.pe`
2. **Supervisor OTIC:** `supervisor.otic@lamolina.edu.pe`
3. **Técnico de Redes:** `tecnico.redes@lamolina.edu.pe`
4. **Estudiante Solicitante:** `20220145@lamolina.edu.pe`
5. **Docente Solicitante:** `jbenavides@lamolina.edu.pe`
