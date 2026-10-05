# 🚀 FICHA TÉCNICA DE PASE A CONTROL DE CALIDAD (QA)
## Sistema de Mesa de Ayuda In-House (OTIC & Servicios Generales)
**Institución:** Universidad Nacional Agraria La Molina (UNALM)  
**Oficina Gestora:** Oficina de Tecnologías de la Información y Comunicaciones (OTIC)  
**Fecha de Entrega:** Septiembre 2026  
**Versión / Build:** `v2.4.0-PROD-CANDIDATE`  
**Tipo de Entrega:** Pase a QA / Cambio Funcional Mayor  
**Requerimiento Principal:** Plataforma Centralizada de Mesa de Ayuda ITIL v4, Triage Multimódulo (OTIC y Servicios Generales), Gestión de Tickets, Evidencias Digitales y Calificación de Calidad.

---

## 1. RESUMEN DEL ALCANCE ENTREGADO

Se completó y estabilizó la versión para pruebas funcionales e integrales del Sistema de Mesa de Ayuda UNALM:
1. **Flujo de Trabajo Extremo a Extremo (E2E):** Solicitud de ticket por usuario final $\rightarrow$ Triage y asignación por Mesa de Ayuda $\rightarrow$ Intervención técnica y resolución por Especialista $\rightarrow$ Validación y calificación del servicio por el Solicitante (1 a 5 estrellas).
2. **Arquitectura Multimódulo:** Soporte a dos direcciones operativas: Tecnologías de la Información (**OTIC**) y Mantenimiento de Campus (**Servicios Generales**).
3. **Manejo de Evidencias:** Carga y previsualización segura de archivos adjuntos (imágenes y PDFs) a través de proxy inverso Nginx (`/uploads/`).
4. **Seguridad y Control de Acceso (RBAC):** Token JWT con expiración de 24 horas, protección contra vistas administrativas para Solicitantes (`safeActiveTab`) y validación de correo corporativo `@lamolina.edu.pe`.
5. **Carga Oficial del Padrón Institucional:** 1,354 cuentas de personal docente y administrativo precargadas con clave temporal institucional `123456` y flujo de primer inicio de sesión obligatorio.
6. **Asignación Colaborativa Multitécnico (Exclusivo OTIC):** Facilidad en Mesa de Ayuda OTIC para conformar un equipo de múltiples especialistas (1 Técnico Principal + N Técnicos de Apoyo) cuando la complejidad técnica es crítica (`COMPLEJA`), manteniendo asignación simple e inviolable para Servicios Generales.
7. **Adjunto de Informe Técnico Digital en Resolución (Opcional):** Los especialistas técnicos pueden adjuntar documentación formal (.pdf, .docx, imágenes) al momento de registrar el diagnóstico y solución del ticket.

---

## 2. DATOS DE ENTREGA PARA PRUEBAS (QA)

| Parámetro | Valor Oficial de Pruebas |
|---|---|
| **Ambiente Web QA:** | **http://172.16.20.49/** |
| **API REST Backend:** | **http://172.16.20.49/api** (o directo `http://172.16.20.49:4000/api`) |
| **Servicio de Archivos / Uploads:** | **http://172.16.20.49/uploads/** |
| **Repositorio Gestionado por OTIC:** | `/var/www/mesa-ayuda` |
| **Branch / Rama:** | `main` |
| **Base de Datos:** | MySQL 8.0 en servidor central `172.16.0.189:3306` |
| **Nombre de Base de Datos:** | `mesaayuda_db` |
| **Credenciales BD para DBA/Redes:** | Coordinar con DBA / Redes OTIC (configuración gestionada vía variables de entorno en `.env`) |
| **Datos de Prueba Iniciales:** | Precargados mediante [`schema2.sql`](file:///var/www/mesa-ayuda/schema2.sql) (1,363 usuarios, 12 categorías, 31 insumos, 4 tickets de prueba) |
| **Limitaciones Conocidas:** | Las notificaciones por correo electrónico operan actualmente en modo simulador (se registran en los logs de auditoría y consola del backend) hasta habilitar las credenciales SMTP de producción en el archivo `.env`. |

---

## 3. USUARIOS Y CREDENCIALES DE PRUEBA PRECONFIGURADAS

Para evaluar todos los roles y perfiles del sistema, se dispone de las siguientes cuentas:

> **Contraseña universal para personal de gestión y soporte:** `Unalm2026$`

| Rol Evaluado | Correo Institucional | Contraseña | Alcance de Pruebas |
|:---|:---|:---:|:---|
| **Administrador General** | `admin.otic@lamolina.edu.pe` | `Unalm2026$` | Control total, catálogo, usuarios, auditoría global y métricas. |
| **Supervisor OTIC** | `supervisor.otic@lamolina.edu.pe` | `Unalm2026$` | Monitoreo de colas, asignación, reasignación y reportes de SLA. |
| **Mesa de Ayuda OTIC** | `soporte@lamolina.edu.pe` | `Unalm2026$` | **Bandeja de Triage OTIC**, filtro de complejidad y derivación de tickets. |
| **Mesa de Ayuda SG** | `mesa.sg@lamolina.edu.pe` | `Unalm2026$` | **Bandeja de Triage Servicios Generales**, control de OCI e inventario. |
| **Técnico Redes OTIC** | `tecnico.redes@lamolina.edu.pe` | `Unalm2026$` | Atención técnica, notas internas, resolución y diagnóstico. |
| **Especialista Electricidad SG**| `tecnico.electricidad@lamolina.edu.pe`| `Unalm2026$` | Atención de infraestructura física, taller y resolución SG. |
| **Docente Solicitante** | `jbenavides@lamolina.edu.pe` | `Unalm2026$` | Creación de tickets, seguimiento, validación y **calificación (estrellas)**. |
| **Estudiante Solicitante** | `20220145@lamolina.edu.pe` | `Unalm2026$` | Creación de solicitudes de servicio estudiantil y consulta. |
| **Usuario Padrón (1er Acceso)** | `vecoabrisqueta@lamolina.edu.pe`| `123456` | **Prueba de primer login:** exige cambio de clave y confirmación de datos. |

---

## 4. GUÍA DEL FLUJO DE PRUEBA PRINCIPAL (6 PASOS E2E)

QA debe validar el siguiente flujo integral de ciclo de vida del ticket:

```
[1. Solicitante]       [2. Mesa de Ayuda]         [3. Técnico]
 Registra Ticket   ──>  Recibe en Triage     ──>  Inicia Atención
 con evidencias         y Asigna Especialista     y Resuelve Ticket
                                                          │
                                                          ▼
[6. Cierre & Calidad]  [5. Solicitante]           [4. Notificación]
 Califica Atención <──  Visualiza Solución   <──  Cambio de Estado
 (1 a 5 estrellas)      y Conformidad             a "RESUELTO"
```

### Paso 1: Creación del Requerimiento (Solicitante)
1. Iniciar sesión con el usuario docente: `jbenavides@lamolina.edu.pe` / `Unalm2026$`.
2. En la pestaña **"Catálogo de Servicios"**, seleccionar una categoría (ej: *Sistemas Académicos* o *Mantenimiento Eléctrico*).
3. Completar el formulario: Título, Descripción, Urgencia (`ALTA`) y adjuntar un archivo (ej: captura JPG/PNG).
4. Hacer clic en **"Registrar Requerimiento"**.
5. **Verificación:** Se genera el correlativo (ej: `OTIC-2026-00005`), el estado es `REPORTADO` y el archivo adjunto se visualiza en miniaturas sin error.

### Paso 2: Triage y Asignación (Mesa de Ayuda OTIC)
1. Cerrar sesión e ingresar con el operador: `soporte@lamolina.edu.pe` / `Unalm2026$`.
2. Dirigirse a **"Mesa de Ayuda OTIC (Triage)"**.
3. Localizar el ticket generado en el Paso 1 (en estado `REPORTADO`).
4. Abrir el ticket y pulsar **"Asignar Especialista"**.
5. Seleccionar la Complejidad Técnica:
   - Si se selecciona **"Crítica / Muy Compleja — Especializada" (`COMPLEJA`)**, el sistema despliega el selector **"Equipo de Apoyo Técnico (Multitécnico)"**, permitiendo seleccionar al Técnico Principal (ej: `David Mendoza`) y sumar técnicos de apoyo (ej: `Ana Torres`).
   - Si se selecciona *Baja* o *Media*, la asignación permanece unívoca.
6. Confirmar la asignación.
7. **Verificación:** El ticket pasa a estado `ASIGNADO`, la línea de vida registra el evento y todos los técnicos asignados visualizan el requerimiento en su cola de trabajo.

### Paso 3: Intervención y Resolución (Técnico)
1. Cerrar sesión e ingresar con el técnico asignado (principal o de apoyo): `tecnico.redes@lamolina.edu.pe` / `Unalm2026$`.
2. En la pestaña **"Cola de Tickets OTIC"**, abrir el ticket asignado.
3. Pulsar en **"Iniciar Atención"** (el ticket pasa a `EN_EJECUCION`).
4. (Opcional) Enviar una **Nota Interna** marcando el checkbox de privacidad.
5. Hacer clic en **"Resolver Ticket"**, ingresar el informe técnico de solución (ej: *"Se reconfiguró el acceso del usuario en el servidor SIRA satisfactoriamente"*).
6. En el campo **"Añadir Informe Técnico o Documento (Opcional)"**, cargar un archivo digital de soporte (.pdf, .docx o captura).
7. Confirmar la resolución.
8. **Verificación:** El estado cambia a `RESUELTO`. El archivo se almacena en el servidor y se registra en la auditoría y adjuntos del ticket. El sistema calcula el cumplimiento de SLA.

### Paso 4 y 5: Verificación de Solución (Solicitante)
1. Cerrar sesión e ingresar nuevamente como solicitante: `jbenavides@lamolina.edu.pe` / `Unalm2026$`.
2. En el menú lateral, acceder a **"Mis Solicitudes Registradas"** o a la pestaña parpadeante **"Calificaciones Pendientes"**.
3. Abrir el ticket.
4. **Verificación:** Se visualiza el cuadro de **"Informe de Solución Técnica Concluida"** con el texto registrado por el técnico, la nota interna **no es visible** para el solicitante, y se encuentra activo el botón **"Calificar Atención"**.

### Paso 6: Conformidad y Encuesta de Satisfacción (Solicitante)
1. Pulsar en **"Calificar Atención"** en el ticket resuelto.
2. En el modal emergente, seleccionar la calificación de **5 estrellas** y redactar un comentario de satisfacción.
3. Hacer clic en **"Enviar Calificación"**.
4. **Verificación:**
   - La pantalla muestra el mensaje de éxito (*"¡Muchas gracias por calificar la atención del especialista!"*).
   - El ticket queda con su puntuación consolidada.
   - En la base de datos se registra la fila en `encuestas_satisfaccion` con el ID del solicitante y del técnico.
   - El contador de calificaciones pendientes disminuye.

---

## 5. DOCUMENTACIÓN TÉCNICA Y DE ARQUITECTURA

### 5.1. Arquitectura en 3 Capas
* **Capa de Presentación:** Single Page Application (SPA) construida en **React 18** con **TypeScript**, empaquetada con **Vite** y servida mediante **Nginx** en el puerto 80.
* **Capa de Negocio:** API REST desarrollada en **Node.js 20 LTS** con **Express** y **TypeScript**, estructurada en controladores, servicios, modelos y middlewares (`auth`, `upload`, `error`), orquestada en Docker (`mesaayuda-backend`) y configurable con PM2.
* **Capa de Datos:** **MySQL 8.0** en servidor dedicado (`172.16.0.189:3306`), utilizando pool de conexiones gestionadas (`mysql2/promise`) con timezone `-05:00` (Perú / UNALM).

### 5.2. Mapeo de Puertos y Servicios
| Contenedor Docker | Puerto Externo | Puerto Interno | Tecnología | Función |
|---|:---:|:---:|---|---|
| `mesaayuda-frontend` | `80` | `80` | Nginx Alpine | Servidor web SPA y Reverse Proxy (`/api/`, `/uploads/`) |
| `mesaayuda-backend` | `4000` | `4000` | Node.js 20 | API REST y procesamiento de lógica ITIL |

---

## 6. DOCUMENTACIÓN DE BASE DE DATOS

### 6.1. Modelo de Datos Consolidado (13 Tablas)
1. **`roles`:** RBAC de 8 niveles (`ADMIN`, `SUPERVISOR`, `TECNICO`, `SOLICITANTE`, `MESA_AYUDA`, `MESA_AYUDA_SG`, `TECNICO_SG`, `SUPERVISOR_SG`).
2. **`usuarios`:** Usuarios institucionales con credenciales hash BCrypt, campos `debe_cambiar_password`, `correo_pendiente`, `cargo`, `ubicacion_referencia`, `anexo`, `foto_perfil`.
3. **`categorias_servicio`:** 12 categorías oficiales multimódulo (OTIC y Servicios Generales) con matriz de SLA (horas respuesta y resolución).
4. **`configuracion_sistema`:** Parámetros globales (ej: `asignacion_automatica_inmediata = false`).
5. **`inspecciones_infraestructura`:** Registro de inspecciones preventivas en campo (SIGI UNALM).
6. **`hallazgos_inspeccion`:** Detalle de criticidad física y vinculación con tickets de trabajo.
7. **`tickets`:** Entidad central de incidencias y requerimientos con correlativo, ciclo de vida ITIL, SLA y campos operativos SG.
8. **`comentarios_ticket`:** Historial de mensajería con soporte de notas internas confidenciales.
9. **`adjuntos`:** Almacenamiento y metadatos de archivos subidos.
10. **`encuestas_satisfaccion`:** Evaluación de calidad post-servicio con estrellas (1 a 5), comentario, `tecnico_id` y `solicitante_id`.
11. **`logs_auditoria`:** Registro inmutable de eventos con IP de origen.
12. **`materiales_inventario_sg`:** Catálogo de 31 insumos y stocks mínimos de talleres.
13. **`materiales_movimientos_sg`:** Kardex de entradas y salidas por orden de trabajo.

### 6.2. Scripts de Despliegue y Rollback
* **Script de Creación y Carga Inicial Oficial:** [`schema2.sql`](file:///var/www/mesa-ayuda/schema2.sql) (ejecutado y sincronizado con [`schema.sql`](file:///var/www/mesa-ayuda/schema.sql)).
* **Comando de Aplicación:**
  ```bash
  mysql --skip-ssl -h <HOST_BD> -P 3306 -u <USUARIO_BD> -p mesaayuda_db < /var/www/mesa-ayuda/schema2.sql
  ```
* **Plan de Rollback:** En caso de requerir restauración a un punto anterior, se dispone del respaldo exportado mediante `mysqldump` previo a la sincronización.

---

## 7. CATÁLOGO DE APIS REST PRINCIPALES

| Método | Endpoint | Rol Mínimo Requerido | Descripción Funcional | Códigos HTTP |
|:---:|:---|:---|:---|:---:|
| `POST` | `/api/auth/login` | Público | Autenticación de usuario institucional. Retorna JWT y datos de perfil. | `200`, `400`, `401` |
| `GET` | `/api/auth/me` | Autenticado | Obtiene la sesión activa y estado de cambio de contraseña. | `200`, `401` |
| `POST` | `/api/auth/complete-first-login` | Autenticado | Permite al usuario del padrón cambiar su clave `123456`. | `200`, `400` |
| `GET` | `/api/tickets` | Autenticado | Listado de tickets filtrado según el rol del usuario en sesión. | `200`, `401` |
| `GET` | `/api/tickets/:id` | Autenticado | Detalle completo de un ticket con adjuntos, comentarios y auditoría. | `200`, `401`, `404` |
| `POST` | `/api/tickets` | `SOLICITANTE`, `ADMIN` | Creación de nuevo ticket con carga de archivos (`multipart/form-data`). | `201`, `400`, `401` |
| `PUT` | `/api/tickets/:id/assign` | `MESA_AYUDA`, `ADMIN` | Asignación de técnico responsable a un ticket. | `200`, `400`, `403` |
| `PUT` | `/api/tickets/:id/status` | `TECNICO`, `ADMIN` | Transición de estado (`EN_EJECUCION`, etc.). | `200`, `400`, `403` |
| `PUT` | `/api/tickets/:id/resolve` | `TECNICO`, `ADMIN` | Cierre con informe técnico y cálculo de SLA cumplido. | `200`, `400`, `403` |
| `POST` | `/api/tickets/:id/survey` | `SOLICITANTE`, `ADMIN`| Registro de encuesta de satisfacción (1 a 5 estrellas). | `200`, `400`, `500` |
| `POST` | `/api/tickets/:id/comments` | Autenticado | Envío de mensajes de chat o notas internas técnicas. | `201`, `400`, `403` |
| `GET` | `/api/catalog/categories/all` | Autenticado | Obtención del catálogo de servicios con tiempos SLA. | `200`, `401` |
| `GET` | `/api/materials` | Personal SG / Admin | Inventario de insumos y repuestos de talleres. | `200`, `401`, `403` |
| `GET` | `/api/admin/dashboard` | `ADMIN`, `SUPERVISOR` | Métricas directivas y KPIs de atención institucional. | `200`, `403` |
