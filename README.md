# 🏛️ SISTEMA DE MESA DE AYUDA IN-HOUSE (OTIC UNALM) - ITIL v4 READY

Sistema enterprise de gestión de tickets, incidentes y solicitudes de servicio para la **Oficina de Tecnologías de la Información y Comunicaciones (OTIC)** de la **Universidad Nacional Agraria La Molina (UNALM)**.

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
