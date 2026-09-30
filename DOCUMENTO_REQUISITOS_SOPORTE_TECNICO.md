# 🏛️ UNIVERSIDAD NACIONAL AGRARIA LA MOLINA
## OFICINA DE TECNOLOGÍAS DE LA INFORMACIÓN Y COMUNICACIONES (OTIC)
### ESPECIFICACIÓN DE REQUISITOS DEL SOFTWARE (SRS) Y ACTA DE CONFORMIDAD TÉCNICA

---

| INFORMACIÓN DEL DOCUMENTO | DATOS INSTITUCIONALES |
|---|---|
| **Proyecto:** | Sistema Integrado de Mesa de Ayuda Institucional (OTIC & Servicios Generales) |
| **Código del Proyecto:** | UNALM-OTIC-SDA-2026 |
| **Versión del Sistema:** | v2.4.0-PROD |
| **Estándar Metodológico:** | IEEE Std 830 / ITIL v4 Service Management |
| **Área Solicitante / Usuaria:** | Jefatura de Soporte Técnico y Redes - OTIC |
| **Área Ejecutora:** | Unidad de Desarrollo de Sistemas e Innovación - OTIC |
| **Fecha de Emisión:** | Septiembre 2026 |
| **Estado:** | Aprobado para Pase a Producción |

---

## 1. OBJETIVO DEL DOCUMENTO

El presente documento define formalmente los **Requisitos Funcionales (RF)** y **Requisitos No Funcionales (RNF)** acordados e implementados en el **Sistema de Mesa de Ayuda Institucional de la Universidad Nacional Agraria La Molina (UNALM)**. 

Este instrumento sirve como base contractual y técnica para la suscripción del **Acta de Conformidad y Aprobación** por parte de la **Jefatura de Soporte Técnico y Redes** y la **Dirección de la OTIC**, certificando que la solución desarrollada satisface las necesidades operativas de la comunidad universitaria y los estándares de calidad tecnológica.

---

## 2. ALCANCE GENERAL DEL SISTEMA

El sistema proporciona una plataforma web centralizada para la recepción, triaje, asignación, atención, diagnóstico, resolución y evaluación de requerimientos e incidencias técnicas y de infraestructura, articulando dos dependencias operativas:
1. **Oficina de Tecnologías de la Información y Comunicaciones (OTIC):** Soporte técnico en hardware, software académico, redes, telefonía IP, plataformas virtuales y cuentas institucionales.
2. **Unidad de Servicios Generales y Mantenimiento (SG):** Atención de infraestructura física, electricidad, cerrajería, carpintería, gasfitería, áreas verdes y mantenimiento de campus.

---

## 3. ESPECIFICACIÓN DE REQUISITOS FUNCIONALES (RF)

| Código | Requisito Funcional | Descripción Detallada | Prioridad | Rol Asociado |
|:---:|:---|:---|:---:|:---:|
| **RF-01** | **Autenticación Institucional y Control de Acceso (RBAC)** | El sistema debe validar las credenciales de los usuarios institucionales (@lamolina.edu.pe) mediante correo y clave con hash seguro. El sistema debe aplicar un control de acceso basado en roles con 8 perfiles diferenciados: `ADMIN`, `SUPERVISOR`, `TECNICO`, `SOLICITANTE`, `MESA_AYUDA`, `MESA_AYUDA_SG`, `TECNICO_SG` y `SUPERVISOR_SG`. | **Alta** | Todos |
| **RF-02** | **Gestión de Primer Acceso y Cambio de Clave Obligatorio** | Todo usuario importado del padrón institucional (1,354 cuentas precargadas) con la clave temporal `123456` debe ser forzado en su primer inicio de sesión a cambiar su contraseña y validar su dependencia de adscripción antes de permitirle navegar en el portal. | **Alta** | Solicitante |
| **RF-03** | **Catálogo de Servicios ITIL y Configuración de SLAs** | El sistema debe permitir consultar un catálogo estructurado de servicios agrupados por área técnica (OTIC / Servicios Generales). Cada categoría debe definir automáticamente sus tiempos de Acuerdo de Nivel de Servicio (SLA) para primera respuesta (horas) y resolución definitiva (horas). | **Alta** | Admin / Supervisor |
| **RF-04** | **Registro de Requerimientos e Incidencias con Adjuntos** | Los usuarios solicitantes deben poder registrar tickets seleccionando la categoría correspondiente, indicando título descriptivo, justificación, nivel de urgencia, ubicación física en campus y adjuntando archivos de evidencia (capturas JPG/PNG, documentos PDF) de hasta 10 MB. | **Alta** | Solicitante |
| **RF-05** | **Generación de Correlativo Único Institucional** | Cada ticket registrado debe recibir automáticamente un identificador correlativo e irrepetible según su área operativa: `OTIC-YYYY-XXXXX` para tecnologías de información y `SG-YYYY-XXXXX` para servicios generales. | **Alta** | Sistema |
| **RF-06** | **Bandeja de Triage y Asignación Operativa** | Los operadores de la Mesa de Ayuda deben disponer de una bandeja exclusiva para revisar los tickets en estado `REPORTADO`, clasificar la complejidad del problema y derivar/asignar el ticket al especialista técnico idóneo. | **Alta** | Mesa de Ayuda / Supervisor |
| **RF-07** | **Consola de Trabajo y Ciclo de Vida ITIL del Ticket** | El técnico asignado debe visualizar su cola personal de trabajo y gestionar la transición ordenada de estados: `REPORTADO` → `ASIGNADO` → `EN_EJECUCION` → `RESUELTO` → `CERRADO` (o estados de contingencia: `OBSERVADO`, `PENDIENTE_USUARIO`, `ESPERA_MATERIALES`). | **Alta** | Técnico |
| **RF-08** | **Bitácora de Comunicación y Notas Internas Confidenciales** | El sistema debe permitir el intercambio de comentarios entre el solicitante y el técnico. Adicionalmente, el personal técnico debe poder registrar **Notas Internas**, las cuales quedan restringidas y **nunca** son visibles para el solicitante. | **Media** | Técnico / Solicitante |
| **RF-09** | **Cierre Técnico, Diagnóstico y Medición Automática de SLA** | Al resolver un ticket, el técnico debe registrar obligatoriamente el informe de diagnóstico y solución técnica aplicada. El sistema debe computar automáticamente si la atención cumplió o excedió el SLA pactado según la categoría. | **Alta** | Técnico |
| **RF-10** | **Validación del Solicitante y Encuesta de Calidad** | Una vez que el ticket pasa a estado `RESUELTO`, el usuario solicitante debe poder revisar el informe técnico, confirmar la conformidad del servicio y calificar obligatoriamente la atención del especialista mediante una escala de **1 a 5 estrellas** con comentarios cualitativos, cambiando el ticket a estado `CERRADO`. | **Alta** | Solicitante |
| **RF-11** | **Ficha de Inspección Técnica de Infraestructura** | Para requerimientos de Servicios Generales, el personal especializado debe poder emitir una Ficha de Inspección Técnica en campo, evaluando condiciones de riesgo, diagnóstico estructural y programación de cuadrillas. | **Media** | Técnico SG / Supervisor SG |
| **RF-12** | **Kardex y Solicitud de Materiales para Órdenes de Trabajo** | El sistema debe mantener el catálogo de 31 insumos y materiales de almacén/talleres SG, permitiendo al técnico solicitar ítems asociados a un ticket y descontando existencias en el inventario institucional. | **Media** | Personal SG / Almacén |
| **RF-13** | **Panel de Métricas y KPIs de Gestión para Jefaturas** | Los supervisores y administradores deben disponer de un dashboard analítico con indicadores en tiempo real: volumen total de tickets, tasa de cumplimiento de SLA, distribución por categoría y ranking de satisfacción docente/estudiantil. | **Media** | Supervisor / Admin |
| **RF-14** | **Auditoría Forense Inmutable de Transacciones** | Cada evento crítico (creación, cambio de estado, asignación, reasignación, carga de archivos y calificación) debe quedar grabado de manera permanente en la tabla de auditoría con identificación de usuario, acción, valores antes/después, fecha, hora e IP de origen. | **Alta** | Sistema |

---

## 4. ESPECIFICACIÓN DE REQUISITOS NO FUNCIONALES (RNF)

### 4.1. Seguridad y Confidencialidad (RNF-SEG)
* **RNF-SEG-01 (Cifrado de Credenciales):** Todas las contraseñas de los usuarios deben almacenarse irreversiblemente utilizando el algoritmo criptográfico **BCrypt** con un factor de costo mínimo de 10 (`salt rounds = 10`).
* **RNF-SEG-02 (Autenticación y Sesiones Stateless):** Las sesiones se gestionan mediante tokens **JSON Web Tokens (JWT)** con algoritmo HMAC-SHA256, vigencia máxima de 24 horas y almacenamiento seguro en el cliente.
* **RNF-SEG-03 (Protección de Rutas y Sanitización):** Todos los endpoints de la API deben validar permisos según el rol activo. Se implementa parametrización estricta de consultas SQL (Prepared Statements) para prevenir ataques de SQL Injection y saneamiento de entradas contra Cross-Site Scripting (XSS).
* **RNF-SEG-04 (Almacenamiento Aislado de Archivos):** Los archivos adjuntos subidos se renombran aleatoriamente con identificadores únicos (UUID/timestamps) para mitigar vulnerabilidades de *Path Traversal* y ejecución arbitraria, sirviéndose a través de un proxy inverso Nginx con validación de tipo MIME.
* **RNF-SEG-05 (Protección de Secretos y Variables de Entorno):** Ninguna clave de base de datos, credencial de servidor o secreto JWT puede estar embebido en el código fuente. Se gestionan exclusivamente mediante archivos de configuración protegidos (`.env`).

### 4.2. Rendimiento, Capacidad y Eficiencia (RNF-REND)
* **RNF-REND-01 (Tiempo de Respuesta en API):** Las solicitudes de consulta y lectura de tickets deben responder en un tiempo inferior a **300 milisegundos** bajo condiciones normales de red institucional.
* **RNF-REND-02 (Concurrencia de Usuarios):** La arquitectura backend y el pool de conexiones MySQL (`mysql2/promise` con límite de 20 conexiones persistentes) deben soportar un mínimo de **100 usuarios concurrentes** sin degradación del servicio.
* **RNF-REND-03 (Compresión y Optimización de Carga):** La aplicación frontend Single Page Application (SPA) empaquetada con Vite debe cargar en menos de **1.5 segundos** en conexiones de red estándar, utilizando *lazy loading* y compresión de activos estáticos.

### 4.3. Disponibilidad, Tolerancia a Fallos y Continuidad (RNF-DISP)
* **RNF-DISP-01 (Disponibilidad Continua):** El sistema debe garantizar una disponibilidad de servicio del **99.5%** en horario institucional laboral.
* **RNF-DISP-02 (Resiliencia mediante Contenedores):** La aplicación se encuentra orquestada mediante **Docker y Docker Compose** con política de reinicio automático (`restart: always`), asegurando la recuperación automática del servicio en menos de 5 segundos ante cualquier eventual falla del proceso.
* **RNF-DISP-03 (Plan de Respaldos):** El modelo de datos debe permitir la ejecución de copias de seguridad consistentes en caliente (`mysqldump` con `--single-transaction --quick`) sin bloquear las operaciones de lectura y escritura de los usuarios.

### 4.4. Usabilidad, Ergonomía e Identidad Visual (RNF-USA)
* **RNF-USA-01 (Diseño Responsive Multi-dispositivo):** La interfaz de usuario debe ser 100% responsiva, adaptándose fluidamente a pantallas de escritorio, portátiles, tablets y smartphones.
* **RNF-USA-02 (Identidad Gráfica Institucional UNALM):** La interfaz adopta la identidad visual oficial de la Universidad Nacional Agraria La Molina (verde molinero `#1b5e20` / `#059669`, tipografía Google Inter, escudo institucional de alta resolución y modo oscuro/claro de alto contraste).
* **RNF-USA-03 (Retroalimentación al Usuario):** Toda acción destructiva (anulación, reasignación) o envío de formulario debe solicitar confirmación previa mediante modales y proporcionar notificaciones flotantes (Toast) informando el resultado inmediato de la operación.

### 4.5. Mantenibilidad, Estándares de Código y Portabilidad (RNF-MANT)
* **RNF-MANT-01 (Tipado Estricto de Código):** Tanto el frontend como el backend deben estar desarrollados en **TypeScript 5.x**, garantizando tipado estricto de datos y reduciendo drásticamente errores en tiempo de ejecución.
* **RNF-MANT-02 (Arquitectura en Capas):** El backend debe mantener una separación limpia de responsabilidades: Controladores (`controllers`), Servicios (`services`), Modelos de Base de Datos (`models`) y Middlewares (`middlewares`).
* **RNF-MANT-03 (Compatibilidad entre Navegadores):** La aplicación debe funcionar sin necesidad de instalación de complementos adicionales en las versiones actuales de Google Chrome, Mozilla Firefox, Microsoft Edge y Safari.

---

## 5. MATRIZ DE CUMPLIMIENTO Y VALIDACIÓN DE REQUERIMIENTOS

| Requisito | Componente Técnico Implementado | Evidencia de Validación | Estado |
|:---:|:---|:---|:---:|
| **RF-01** | `auth.middleware.ts` / `roles` table (8 roles) | Pruebas de acceso con cuentas de 8 roles distintos | **CONFORME** |
| **RF-02** | `ForcePasswordChangeModal.tsx` / `debe_cambiar_password` | Validación con usuario del padrón institucional (`vecoabrisqueta@lamolina.edu.pe`) | **CONFORME** |
| **RF-03** | `category.model.ts` / `catalog.controller.ts` | 12 categorías activas con horas de respuesta y resolución | **CONFORME** |
| **RF-04** | `upload.middleware.ts` / Multer con validación MIME | Carga exitosa de adjuntos JPG/PNG/PDF en `/uploads/` | **CONFORME** |
| **RF-05** | `ticketCode.ts` (Generador autonumérico anual) | Formatos `OTIC-2026-XXXXX` y `SG-2026-XXXXX` verificados | **CONFORME** |
| **RF-06** | `SpecialistDashboard.tsx` (Tab Triage Mesa de Ayuda) | Asignación y cambio de estado a `ASIGNADO` | **CONFORME** |
| **RF-07** | `ticket.controller.ts` / Transiciones ITIL de estado | Ciclo de vida completo probado sin bloqueos | **CONFORME** |
| **RF-08** | `comentarios_ticket` (`es_nota_interna = true/false`) | Nota técnica oculta para solicitante y visible para técnicos | **CONFORME** |
| **RF-09** | `sla.ts` / `tickets.sla_cumplido` | Registro de solución técnica y cálculo automático de SLA | **CONFORME** |
| **RF-10** | `SatisfactionSurveyModal.tsx` / `encuestas_satisfaccion` | Encuesta registrada (1-5 estrellas) y paso a `CERRADO` | **CONFORME** |
| **RF-11** | `InfrastructureInspectionsPage.tsx` / Ficha SIGI | Formulario de inspección de campo operativo | **CONFORME** |
| **RF-12** | `SGInventoryPage.tsx` / `materiales_inventario_sg` | 31 insumos registrados y vinculados a órdenes de trabajo | **CONFORME** |
| **RF-13** | `AdminDashboardPage.tsx` / KPIs en tiempo real | Gráficos estadísticos y métricas de soporte en vivo | **CONFORME** |
| **RF-14** | `logs_auditoria` con trigger de aplicación | Registro de IP, fecha, usuario y cambio en BD | **CONFORME** |
| **RNF-SEG**| BCrypt hash, JWT 24h, Variables `.env` protegidas | Auditoría de código limpia y repositorio GitHub sin secretos | **CONFORME** |
| **RNF-REND**| Express + Vite + Pool MySQL 20 conexiones | Latencia < 250ms en pruebas locales | **CONFORME** |
| **RNF-DISP**| Docker Compose con política `restart: always` | Contenedores frontend y backend operativos al 100% | **CONFORME** |

---

## 6. ACTA DE CONFORMIDAD Y FIRMAS DE APROBACIÓN

Por medio de la presente, se hace constar que los **Requisitos Funcionales (14)** y **Requisitos No Funcionales (15)** descritos en este documento han sido exhaustivamente desarrollados, validados en el ambiente de pruebas controlado (`http://172.16.20.49/`) y sincronizados en el repositorio institucional oficial (`https://github.com/otic-unalm/MESA_DE_AYUDA`).

Habiéndose verificado el cumplimiento estricto del flujo operativo institucional, los criterios de aceptación y las políticas de seguridad de la información de la UNALM, se suscribe la presente acta otorgando la **CONFORMIDAD TÉCNICA TOTAL**:

<br><br>

```
_____________________________________________         _____________________________________________
        ING. CARLOS GUTIÉRREZ                                 RESPONSABLE DE DESARROLLO
     Jefe de Soporte Técnico y Redes                         Líder Técnico de Software
             OTIC - UNALM                                           OTIC - UNALM
```

<br><br>

```
__________________________________________________________________________________
                    JEFE DE LA OFICINA DE TECNOLOGÍAS DE LA
                         INFORMACIÓN Y COMUNICACIONES
                                 OTIC - UNALM
```

<br>

**Fecha de Suscripción:** _____ de ____________________ del 2026.  
**Lugar:** Campus Universitario UNALM, La Molina, Lima - Perú.
