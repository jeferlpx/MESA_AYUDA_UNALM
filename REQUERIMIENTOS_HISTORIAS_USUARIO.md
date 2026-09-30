# 📋 ESPECIFICACIÓN DE REQUERIMIENTOS Y HISTORIAS DE USUARIO (HU)
## Sistema de Mesa de Ayuda In-House (OTIC & Servicios Generales - UNALM)
**Estándar:** ITIL v4 Ready  
**Institución:** Universidad Nacional Agraria La Molina (UNALM)  
**Oficina Técnica:** Oficina de Tecnologías de la Información y Comunicaciones (OTIC)  
**Versión del Producto:** v2.4.0-QA  
**Destinatario:** Equipo de Aseguramiento de la Calidad (QA / Software Testing)

---

## 1. INTRODUCCIÓN Y ALCANCE

El presente documento define los requerimientos funcionales, reglas de negocio y criterios de aceptación formalizados bajo la estructura de **Historias de Usuario (HU)** y especificación **Gherkin (Dado - Cuando - Entonces)**. Este insumo sirve de base para el diseño y ejecución de la matriz de casos de prueba (CP) en el ambiente de QA.

### Alcance Funcional:
1. **Portal del Solicitante:** Catálogo de servicios tecnológicos (OTIC) e infraestructura/mantenimiento (Servicios Generales), registro de tickets con archivos adjuntos, historial en vivo y validación de solución.
2. **Bandeja de Triage (Mesa de Ayuda):** Clasificación por complejidad, derivación a especialistas y control de colas.
3. **Consola del Técnico:** Atención técnica, bitácora de seguimiento (comentarios públicos y notas internas), resolución con diagnóstico y medición automática de SLA.
4. **Módulo de Calidad ITIL:** Encuesta de satisfacción del usuario solicitante post-atención (1 a 5 estrellas + comentarios cualitativos).
5. **Seguridad y Control de Acceso:** RBAC con 8 roles institucionales, autenticación JWT (24h de vigencia) y forzado de personalización de credenciales en primer acceso.

---

## 2. REGLAS DE NEGOCIO (RN)

* **RN-01 (Dominio Institucional Obligatorio):** Todo usuario solicitante o del personal de soporte debe poseer cuenta institucional bajo el dominio `@lamolina.edu.pe`.
* **RN-02 (Correlativo Único Institucional):** Todo ticket generado recibe un código autonumérico correlativo según su módulo de origen:
  - Formato OTIC: `OTIC-YYYY-XXXXX` (ej: `OTIC-2026-00001`).
  - Formato Servicios Generales: `SG-YYYY-XXXXX` (ej: `SG-2026-00001`).
* **RN-03 (Cálculo Inmediato de SLA):** Al crearse un ticket, el sistema computa automáticamente:
  - `fecha_limite_respuesta = fecha_apertura + categoria.sla_horas_respuesta`
  - `fecha_limite_resolucion = fecha_apertura + categoria.sla_horas_resolucion`
* **RN-04 (Ciclo de Vida de Estados ITIL v4):**
  - `REPORTADO` $\rightarrow$ `ASIGNADO` $\rightarrow$ `EN_EJECUCION` $\rightarrow$ `RESUELTO` $\rightarrow$ `CERRADO`.
  - Estados de contingencia: `OBSERVADO`, `PENDIENTE_USUARIO`, `ESPERA_MATERIALES`, `REABIERTO`.
* **RN-05 (Privacidad de Notas Internas):** Los comentarios técnicos marcados como `es_nota_interna = true` son de visibilidad exclusiva para perfiles técnicos y de supervisión (`TECNICO`, `TECNICO_SG`, `MESA_AYUDA`, `MESA_AYUDA_SG`, `ADMIN`, `SUPERVISOR`). El Solicitante **nunca** podrá visualizarlos.
* **RN-06 (Restricción de Archivos y Evidencias):**
  - Formatos permitidos: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`, `.docx`.
  - Tamaño máximo por archivo: 10 MB.
  - Almacenamiento seguro mediante hashes criptográficos en `./uploads` evitando path traversal.
* **RN-07 (Unicidad de Encuesta de Satisfacción):** La encuesta de satisfacción solo puede registrarse **una única vez por ticket**. Solo se habilita si el ticket está en estado `RESUELTO` y el usuario autenticado es el propietario (`solicitante_id`).
* **RN-08 (Seguridad en Primer Acceso):** Todo usuario que ingrese con la contraseña genérica (`123456`) o tenga `debe_cambiar_password = 1` debe completar obligatoriamente el cambio de clave y confirmación de dependencia antes de poder navegar en el sistema.
* **RN-09 (Trazabilidad Forense Inmutable):** Toda asignación, cambio de estado, edición o calificación debe registrar una entrada en `logs_auditoria` con `usuario_id`, `accion`, `campo_modificado`, `valor_anterior`, `valor_nuevo` e `ip_origen`.

---

## 3. HISTORIAS DE USUARIO Y CRITERIOS DE ACEPTACIÓN (GHERKIN)

### 📌 HU-01: Registro de Requerimiento o Incidencia por el Usuario Solicitante
**Como:** Usuario de la comunidad universitaria UNALM (Docente, Administrativo, Estudiante)  
**Quiero:** Acceder al catálogo oficial de servicios y registrar un requerimiento o falla detallando el problema y adjuntando evidencias fotográficas o documentos  
**Para:** Que la mesa de ayuda correspondiente canalice y resuelva mi incidencia oportunamente con respaldo institucional.

#### Criterios de Aceptación (Gherkin):
```gherkin
Escenario: Registro exitoso de un ticket de soporte técnico OTIC
  Dado que el usuario "jbenavides@lamolina.edu.pe" ha iniciado sesión como SOLICITANTE
  Y se encuentra en la pestaña "Catálogo de Servicios"
  Cuando selecciona la categoría "Sistemas Académicos (SIRA / Aula Virtual)"
  Y completa el formulario con:
    | Campo           | Valor                                                        |
    | Título          | Error al registrar actas de notas en sistema SIRA             |
    | Descripción     | Al intentar cerrar el acta final aparece error 500 en módulo |
    | Urgencia        | ALTA                                                         |
    | Ubicación       | Pabellón Agronomía Aula 204                                  |
  Y adjunta el archivo de captura "error_sira.png" (tamaño < 10MB)
  Y hace clic en "Registrar Requerimiento"
  Entonces el sistema debe responder con código HTTP 201 Created
  Y generar un correlativo con formato "OTIC-2026-XXXXX"
  Y asignar el estado inicial "REPORTADO"
  Y calcular las fechas límites de respuesta y resolución según el SLA de la categoría
  Y mostrar el modal de confirmación con el código generado
  Y guardar el archivo adjunto en el almacenamiento físico con acceso web "/uploads/..."
```

```gherkin
Escenario: Rechazo de archivo no permitido o sobredimensionado
  Dado que el usuario solicitante se encuentra completando el formulario de nuevo ticket
  Cuando intenta adjuntar un archivo ejecutable "script.bat" o un archivo mayor a 10MB
  Entonces el sistema debe mostrar una alerta inmediata de validación
  Y no debe permitir el envío del formulario hasta remover el archivo inválido.
```

---

### 📌 HU-02: Triage, Evaluación y Asignación de Especialista por Mesa de Ayuda
**Como:** Operador de la Mesa de Ayuda OTIC (`MESA_AYUDA`)  
**Quiero:** Visualizar la cola de tickets reportados, analizar su impacto/complejidad y derivarlos al técnico idóneo  
**Para:** Distribuir eficientemente la carga operativa y dar cumplimiento a los acuerdos de nivel de servicio (SLA).

#### Criterios de Aceptación (Gherkin):
```gherkin
Escenario: Asignación formal de técnico especialista
  Dado que el operador "soporte@lamolina.edu.pe" ha iniciado sesión con rol "MESA_AYUDA"
  Y accede a la bandeja "Cola de Tickets OTIC (Triage)"
  Y visualiza un ticket en estado "REPORTADO"
  Cuando hace clic en el ticket para ver su detalle
  Y pulsa el botón "Asignar Especialista"
  Y selecciona al técnico "David Mendoza (Técnico Redes)"
  Y confirma la asignación
  Entonces el sistema debe actualizar el estado del ticket a "ASIGNADO"
  Y registrar el id del técnico en "tecnico_id"
  Y registrar un evento en la línea de vida y auditoría "ASIGNACION_TECNICO"
  Y reflejar el ticket inmediatamente en la bandeja personal del técnico asignado.
```

---

### 📌 HU-03: Atención Técnica, Bitácora y Resolución por el Especialista
**Como:** Técnico de soporte asignado (`TECNICO` o `TECNICO_SG`)  
**Quiero:** Gestionar el ticket, registrar notas de avance y emitir el informe técnico de solución concluida  
**Para:** Documentar la intervención técnica realizada y dejar el requerimiento listo para la conformidad del usuario.

#### Criterios de Aceptación (Gherkin):
```gherkin
Escenario: Transición a ejecución y resolución del requerimiento
  Dado que el técnico "tecnico.redes@lamolina.edu.pe" ha iniciado sesión con rol "TECNICO"
  Y accede al detalle del ticket asignado
  Cuando hace clic en "Iniciar Atención Técnica"
  Entonces el estado del ticket debe cambiar a "EN_EJECUCION"
  Y cuando ingresa a la pestaña "Resolver Requerimiento"
  Y redacta el informe de solución: "Se actualizó la caché del servidor SIRA y se restablecieron permisos"
  Y confirma la resolución
  Entonces el estado del ticket debe cambiar a "RESUELTO"
  Y registrar la "fecha_resolucion" con la marca temporal actual
  Y computar si se cumplió el SLA comparando con "fecha_limite_resolucion"
  Y registrar la trazabilidad en logs_auditoria.
```

```gherkin
Escenario: Registro de comentario interno confidencial
  Dado que el técnico se encuentra en el chat del ticket
  Cuando redacta un mensaje y activa la casilla "Nota Interna (Solo Técnicos / Mesa de Ayuda)"
  Y envía el mensaje
  Entonces el comentario debe guardarse con "es_nota_interna = 1"
  Y mostrarse con fondo distintivo ámbar para el personal técnico
  Y NO debe ser retornado ni visible para el Solicitante.
```

---

### 📌 HU-04: Verificación de Solución y Calificación por Encuesta de Satisfacción
**Como:** Usuario Solicitante propietario del ticket  
**Quiero:** Constatar la solución aplicada en mi ticket resuelto y calificar con estrellas y comentarios la atención recibida  
**Para:** Evaluar la calidad del servicio técnico y cerrar el ciclo de vida del ticket conforme a ITIL v4.

#### Criterios de Aceptación (Gherkin):
```gherkin
Escenario: Calificación exitosa y cierre del ticket
  Dado que el usuario solicitante "jbenavides@lamolina.edu.pe" inicia sesión
  Y se dirige a la sección "Mis Solicitudes Registradas" o "Calificaciones Pendientes"
  Y abre un ticket con estado "RESUELTO" sin calificación previa
  Cuando hace clic en "Calificar Atención"
  Y en el modal selecciona "5 estrellas"
  Y escribe el comentario: "Excelente atención y rapidez en la solución"
  Y hace clic en "Enviar Calificación"
  Entonces el sistema debe responder con HTTP 200 OK
  Y registrar la fila en la tabla "encuestas_satisfaccion" con "ticket_id", "tecnico_id", "solicitante_id", "puntuacion = 5"
  Y actualizar el estado del ticket a "RESUELTO / CALIFICADO" o "CERRADO"
  Y deshabilitar la opción de calificar nuevamente para evitar duplicidad
  Y actualizar el promedio de estrellas del técnico atendiente.
```

```gherkin
Escenario: Intentar registrar calificación sin puntaje
  Dado que el solicitante abre el modal de encuesta de satisfacción
  Cuando intenta enviar el formulario sin seleccionar entre 1 y 5 estrellas
  Entonces el sistema debe validar en frontend y backend bloqueando el envío
  Y retornar el mensaje "La calificación debe ser de 1 a 5 estrellas".
```

---

### 📌 HU-05: Control de Acceso por Roles (RBAC) y Prevención de Vistas Prohibidas
**Como:** Administrador de Seguridad del Sistema  
**Quiero:** Que las rutas y componentes de React validen en tiempo real el rol del usuario autenticado  
**Para:** Impedir que usuarios no autorizados (como Solicitantes) accedan a dashboards directivos, auditorías o inventarios de talleres.

#### Criterios de Aceptación (Gherkin):
```gherkin
Escenario: Solicitante intenta acceder a módulo administrativo
  Dado que un usuario ha iniciado sesión con rol "SOLICITANTE"
  Cuando su aplicación evalúa la pestaña activa
  Entonces la propiedad "safeActiveTab" debe forzar su redirección a "catalog", "my-tickets" o "pending-surveys"
  Y en ningún caso montar "AdminDashboardPage" ni invocar "/api/admin/dashboard"
  Y ante cualquier petición HTTP manual no autorizada el backend debe responder HTTP 403 Forbidden.
```

---

## 4. MATRIZ DE TRAZABILIDAD: FLUJO PRINCIPAL E2E

El siguiente flujo de 6 pasos constituye la prueba crítica de aceptación funcional del sistema:

| Paso | Actor | Acción en el Sistema | Endpoint API Involucrado | Resultado Esperado |
|:---:|:---|:---|:---|:---|
| **1** | Solicitante | Envía nuevo requerimiento con adjunto. | `POST /api/tickets` | Ticket creado en `REPORTADO`, correlativo generado, SLA calculado. |
| **2** | Mesa de Ayuda | Revisa cola y asigna técnico. | `PUT /api/tickets/:id/assign` | Estado pasa a `ASIGNADO`, notificación al técnico y log registrado. |
| **3** | Técnico | Inicia atención y ejecuta labores. | `PUT /api/tickets/:id/status` | Estado pasa a `EN_EJECUCION`. Notas de avance registradas. |
| **4** | Técnico | Emite informe de solución y resuelve. | `PUT /api/tickets/:id/resolve` | Estado pasa a `RESUELTO`. Cumplimiento de SLA evaluado. |
| **5** | Solicitante | Visualiza ticket resuelto en su portal. | `GET /api/tickets/:id` | Visualiza informe de solución y botón "Calificar Atención". |
| **6** | Solicitante | Envía encuesta de satisfacción (1-5★). | `POST /api/tickets/:id/survey` | Registro en `encuestas_satisfaccion`, ticket cerrado, estrellas asignadas. |
