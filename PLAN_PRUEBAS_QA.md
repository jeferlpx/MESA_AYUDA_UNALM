# 🧪 PLAN DE PRUEBAS Y MANUAL DE CONTROL DE CALIDAD (QA)
## Sistema de Mesa de Ayuda In-House (OTIC & Servicios Generales - UNALM)
**Destinatario:** Equipo de Aseguramiento de la Calidad (QA) / Testers / Jefatura de Proyectos  
**Objetivo:** Guía de validación funcional, pruebas de integración y criterios de aceptación para el pase a Producción.  
**Versión:** 1.0.0  

---

## 1. AMBIENTE DE PRUEBAS Y CREDENCIALES PRECONFIGURADAS

Para realizar las pruebas de extremo a extremo, se dispone de las siguientes cuentas de prueba correspondientes a cada uno de los roles del sistema:

> **Contraseña universal para todas las cuentas de prueba:** `Unalm2026$`

| Rol del Sistema | Correo Electrónico Institucional | Perfil y Alcance de Pruebas |
|---|---|---|
| **Administrador General** | `admin.otic@lamolina.edu.pe` | Configuración de catálogo, creación de técnicos/supervisores, configuración de SLA, auditoría global y métricas. |
| **Supervisor OTIC** | `supervisor.otic@lamolina.edu.pe` | Bandeja de tickets OTIC, asignación de técnicos, reasignación, cambio de prioridad/impacto, reportes de área. |
| **Supervisor Servicios Generales** | `supervisor.sg@lamolina.edu.pe` *(o usuario asignado con rol SUPERVISOR_SG)* | Supervisión exclusiva de incidencias de infraestructura física, obras y mantenimiento de campus. |
| **Técnico OTIC** | `tecnico.redes@lamolina.edu.pe` | Atención de tickets, notas internas técnicas, registro de diagnóstico, resolución de tickets OTIC. |
| **Técnico Servicios Generales** | `tecnico.sg@lamolina.edu.pe` *(o usuario asignado con rol TECNICO_SG)* | Generación de Ficha de Inspección Técnica, solicitud de materiales requeridos y resolución de tickets SG. |
| **Docente Solicitante** | `jbenavides@lamolina.edu.pe` | Registro de tickets de incidencias académicas, seguimiento en vivo, chat con el técnico, calificación del servicio. |
| **Estudiante Solicitante** | `20220145@lamolina.edu.pe` | Solicitudes de servicio (Wi-Fi, correo institucional, aula virtual), vista de historial. |

---

## 2. MATRIZ DE CASOS DE PRUEBA FUNCIONALES (TEST CASES)

### MÓDULO 1: AUTENTICACIÓN, SEGURIDAD Y SESIÓN
---

#### 📌 CP-01: Inicio de Sesión Exitoso y Control de Roles (RBAC)
- **Precondición:** El usuario debe encontrarse registrado y con estado `ACTIVO`.
- **Pasos:**
  1. Ingresar a la URL del portal.
  2. Introducir correo institucional (ej: `tecnico.redes@lamolina.edu.pe`) y contraseña `Unalm2026$`.
  3. Pulsar en **"Iniciar Sesión"**.
- **Resultado Esperado:** 
  - El sistema genera y almacena el token JWT.
  - Redirige al Dashboard correspondiente a su rol (Dashboard Técnico con sus tickets asignados).
  - El menú lateral muestra únicamente las opciones autorizadas para dicho rol.

#### 📌 CP-02: Control de Acceso Erróneo y Credenciales Inválidas
- **Pasos:** Intentar iniciar sesión con un correo no registrado o una contraseña incorrecta.
- **Resultado Esperado:** Mensaje de error claro en pantalla (*"Credenciales incorrectas o usuario no encontrado"*). No se permite el acceso al dashboard ni se expone información interna en consola.

---

### MÓDULO 2: PORTAL DE SOLICITANTE Y CREACIÓN DE TICKETS
---

#### 📌 CP-03: Creación de Solicitud/Incidente por Usuario Final
- **Precondición:** Sesión iniciada como Solicitante (`jbenavides@lamolina.edu.pe`).
- **Pasos:**
  1. Hacer clic en el botón **"Nuevo Ticket"**.
  2. Seleccionar el Módulo (ej: *Soporte OTIC*).
  3. Seleccionar la Categoría del Servicio (ej: *Infraestructura y Red Wi-Fi*).
  4. Llenar el Título descriptivo y Detalle de la incidencia.
  5. Seleccionar Urgencia e Impacto.
  6. Adjuntar una captura o documento (PDF, PNG, JPG).
  7. Hacer clic en **"Registrar Ticket"**.
- **Resultado Esperado:**
  - El sistema genera el código correlativo automático único (ej: `OTIC-2026-00004`).
  - Se calcula automáticamente la fecha límite de primera respuesta y resolución según el SLA de la categoría.
  - El ticket aparece en el historial del solicitante en estado `REPORTADO`.
  - Se dispara notificación automática por correo al solicitante confirmando la recepción del ticket.

---

### MÓDULO 3: GESTIÓN POR SUPERVISOR (TRIAGE Y ASIGNACIÓN)
---

#### 📌 CP-04: Asignación y Reasignación de Técnico
- **Precondición:** Sesión iniciada como Supervisor (`supervisor.otic@lamolina.edu.pe`).
- **Pasos:**
  1. Ingresar a la bandeja principal de tickets.
  2. Filtrar por tickets en estado `REPORTADO` o `SIN ASIGNAR`.
  3. Abrir el ticket creado en el CP-03.
  4. En el panel de gestión, seleccionar un técnico responsable de la lista desplegable (ej: `David Mendoza`).
  5. Confirmar la asignación.
- **Resultado Esperado:**
  - El estado del ticket cambia a `ASIGNADO`.
  - Se genera un registro inalterable en la pestaña de **Auditoría** del ticket (*"Asignación de técnico realizada por Supervisor"*).
  - El técnico asignado recibe una notificación y el ticket aparece en su bandeja personal.

---

### MÓDULO 4: ATENCIÓN TÉCNICA, CHAT Y RESOLUCIÓN
---

#### 📌 CP-05: Mensajería y Notas Internas
- **Precondición:** Sesión iniciada como Técnico asignado (`tecnico.redes@lamolina.edu.pe`).
- **Pasos:**
  1. Abrir el ticket asignado.
  2. Escribir un comentario público al solicitante solicitando mayor detalle.
  3. Escribir un segundo comentario marcando la casilla **"Nota Interna (Solo Técnicos/Supervisores)"**.
- **Resultado Esperado:**
  - El comentario público es visible para el solicitante.
  - La **Nota Interna** se resalta en color distintivo (ámbar/amarillo) y **NUNCA** es visible para el solicitante cuando este inicia sesión.

#### 📌 CP-06: Módulo de Inspección Técnica (Servicios Generales)
- **Precondición:** Ticket perteneciente al módulo de Servicios Generales en estado `ASIGNADO`. Sesión con rol `TECNICO_SG` o `SUPERVISOR_SG`.
- **Pasos:**
  1. Ir a la pestaña **"Ficha de Inspección"**.
  2. Completar: Diagnóstico técnico en sitio, condiciones encontradas, si requiere intervención de terceros y fecha programada.
  3. Guardar inspección.
- **Resultado Esperado:**
  - Se persiste la ficha de inspección técnica vinculada al ticket.
  - El estado del ticket pasa a `EN_INSPECCION` o `EN_PROCESO`.
  - Queda trazabilidad en el log de auditoría.

#### 📌 CP-07: Solicitud de Materiales y Repuestos
- **Precondición:** Ticket en atención técnica.
- **Pasos:**
  1. En el detalle del ticket, ingresar a la sección **"Materiales"**.
  2. Agregar ítems (Nombre del material, cantidad, unidad de medida y justificación técnica).
  3. Enviar solicitud de materiales.
- **Resultado Esperado:**
  - Se genera el listado de requerimientos de materiales para almacén/logística asociado al ticket.

#### 📌 CP-08: Resolución y Solución Definitiva del Ticket
- **Precondición:** Técnico atendiendo el ticket.
- **Pasos:**
  1. Hacer clic en **"Resolver Ticket"**.
  2. Ingresar la descripción detallada de la solución técnica aplicada (ej: *"Se reemplazó el patch cord y se reconfiguró el puerto en el switch de borde"*).
  3. Confirmar la resolución.
- **Resultado Esperado:**
  - El estado del ticket cambia a `RESUELTO`.
  - Se registra la fecha y hora exacta de resolución.
  - El sistema evalúa automáticamente si la atención **cumplió o no con el SLA** pactado.
  - Se envía correo electrónico al solicitante notificando la solución e invitándolo a evaluar la atención.

---

### MÓDULO 5: CIERRE Y CONTROL DE CALIDAD ITIL
---

#### 📌 CP-09: Encuesta de Satisfacción por el Solicitante
- **Precondición:** Ticket en estado `RESUELTO`. Sesión iniciada con el Solicitante.
- **Pasos:**
  1. Ingresar al ticket resuelto.
  2. Visualizar la notificación para calificar el servicio.
  3. Seleccionar puntuación (de 1 a 5 estrellas) e ingresar un comentario opcional de satisfacción.
  4. Enviar encuesta.
- **Resultado Esperado:**
  - La calificación queda registrada en la base de datos vinculada al ticket.
  - El ticket cambia a estado `CERRADO`.
  - El ticket no puede volver a calificarse doblemente (protección de integridad de datos).

---

### MÓDULO 6: ADMINISTRACIÓN Y CATÁLOGO ITIL
---

#### 📌 CP-10: Gestión de Catálogo y SLAs
- **Precondición:** Sesión iniciada como `admin.otic@lamolina.edu.pe`.
- **Pasos:**
  1. Ingresar a **"Administración" > "Catálogo de Servicios"**.
  2. Crear una nueva categoría o modificar el tiempo SLA (horas de respuesta / resolución) de una categoría existente.
  3. Guardar cambios.
- **Resultado Esperado:**
  - Los nuevos tickets generados para esa categoría adoptan los nuevos tiempos de SLA calculados.

---

### MÓDULO 7: ASIGNACIÓN COLABORATIVA MULTITÉCNICO E INFORMES TÉCNICOS
---

#### 📌 CP-11: Asignación Multitécnico en Mesa de Ayuda OTIC con Complejidad Crítica (`COMPLEJA`)
- **Precondición:** Sesión iniciada como Mesa de Ayuda OTIC (`soporte@lamolina.edu.pe`). Ticket perteneciente al módulo `OTIC` en estado `REPORTADO` o `ASIGNADO`.
- **Pasos:**
  1. Abrir el modal o drawer de asignación del ticket.
  2. En el campo **"Nivel de Complejidad Técnica (*)"**, seleccionar **"Crítica / Muy Compleja — Especializada" (`COMPLEJA`)**.
  3. Verificar que aparece la sección **"Equipo de Apoyo Técnico (Multitécnico)"**.
  4. Seleccionar un Técnico Principal (ej: `David Mendoza`) y añadir uno o dos Técnicos de Apoyo desde el selector adicional (ej: `Ana Torres`).
  5. Confirmar la asignación.
- **Resultado Esperado:**
  - El ticket se actualiza registrando al técnico principal y a los técnicos de apoyo en la tabla `ticket_tecnicos`.
  - La tabla de tickets muestra el badge distintivo del técnico principal junto al indicador `+{n} apoyos`.
  - Al iniciar sesión con el técnico de apoyo (`tecnico.sistemas@lamolina.edu.pe`), el ticket aparece en su bandeja de trabajo y tiene permisos para consultar el detalle, intervenir y resolverlo.

#### 📌 CP-12: Restricción y Aislamiento de Multitécnicos en Servicios Generales y Complejidades Estándar
- **Precondición:** Sesión iniciada como Mesa de Ayuda Servicios Generales (`mesa.sg@lamolina.edu.pe`) o Mesa de Ayuda OTIC con ticket estándar.
- **Pasos:**
  1. Abrir la asignación de un ticket de Servicios Generales (`modulo === 'SERVICIOS_GENERALES'`).
  2. Verificar que aun seleccionando complejidad crítica, **NO** se despliega el selector multitécnico, manteniendo asignación simple única.
  3. Abrir un ticket de OTIC y seleccionar complejidad **"Baja"** o **"Media"**.
  4. Verificar que el panel de técnicos de apoyo se oculta automáticamente.
- **Resultado Esperado:**
  - Solo el módulo OTIC bajo complejidad `COMPLEJA` permite multitécnicos. Todas las demás combinaciones preservan la asignación unívoca estándar.

#### 📌 CP-13: Resolución Técnica de Ticket con Adjunto de Informe Técnico Digital (Opcional)
- **Precondición:** Sesión iniciada con el técnico asignado (principal o de apoyo). Ticket en estado `EN_EJECUCION` o `ASIGNADO`.
- **Pasos:**
  1. Abrir el ticket y pulsar **"Resolver Ticket"** (o cambiar estado a `RESUELTO`).
  2. Ingresar el comentario descriptivo de la solución técnica.
  3. En la sección **"Añadir Informe Técnico o Documento (Opcional)"**, hacer clic en el selector y cargar un archivo formal (`.pdf`, `.docx` o imagen).
  4. Verificar que se muestre el nombre del archivo y tamaño en KB/MB con botón de remoción disponible.
  5. Confirmar la resolución del ticket.
- **Resultado Esperado:**
  - El ticket cambia a estado `RESUELTO`.
  - El archivo se guarda en `/app/uploads` y se inserta en la tabla `adjuntos` con su metadata.
  - En la línea de vida y auditoría del ticket se registra el evento `ADJUNTAR_ARCHIVO`.
  - El solicitante y supervisores pueden descargar/previsualizar el documento adjunto desde la ficha del ticket.

---

## 3. PRUEBAS NO FUNCIONALES Y DE INTEGRACIÓN

| ID | Tipo de Prueba | Descripción | Criterio de Éxito |
|---|---|---|---|
| **PNF-01** | **Seguridad de Archivos** | Intentar subir un archivo con extensión `.exe`, `.bat` o superior a 10MB. | El sistema rechaza la carga con mensaje de validación amigable y no almacena el archivo en disco. |
| **PNF-02** | **Protección de Rutas (JWT)** | Intentar ingresar directamente a la URL de administración (`/admin`) sin haber iniciado sesión o con rol de estudiante. | Redirección inmediata a la pantalla de login o error 403 Forbidden. |
| **PNF-03** | **Persistencia tras Reinicio** | Simular un reinicio del servidor de Node.js con `pm2 restart mesa-ayuda-backend`. | La aplicación reanuda operaciones sin pérdida de datos en menos de 2 segundos. Las sesiones activas válidas continúan operativas. |
| **PNF-04** | **Conexión a Base de Datos** | Simular desconexión temporal de red con el host `172.16.0.189`. | El pool de MySQL gestiona el error limpiamente y se reconecta tan pronto el enlace de red se restablece sin requerir reiniciar el proceso manualmente. |

---

## 4. PLANTILLA PARA REPORTE DE HALLAZGOS (BUGS) PARA QA

En caso de encontrar una discrepancia durante las pruebas, el analista QA debe registrarla bajo el siguiente formato estándar:

```markdown
### [BUG-ID]: Título conciso del problema
- **Severidad:** [ Crítica | Alta | Media | Baja ]
- **Módulo / Pantalla:** [ Login | Detalle Ticket | Catálogo | Notificaciones ]
- **Usuario utilizado:** [ ej: tecnico.redes@lamolina.edu.pe ]
- **Pasos para reproducir:**
  1. ...
  2. ...
- **Resultado obtenido:** (Lo que ocurrió erróneamente)
- **Resultado esperado:** (Lo que debió ocurrir según el plan)
- **Captura / Log de consola:** (Adjuntar screenshot o texto del error)
```
