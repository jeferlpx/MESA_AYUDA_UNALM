import { Response } from 'express';
import { TicketModel } from '../models/ticket.model';
import { UserModel } from '../models/user.model';
import { CategoryModel } from '../models/category.model';
import { ConfigModel } from '../models/config.model';
import { EmailService } from '../services/email.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { generateTicketCode } from '../utils/ticketCode';
import { calculatePriority, calculateSLADeadlines } from '../utils/sla';
import { TicketStatus, TicketImpact, TicketUrgency, TicketComplejidad } from '../types';

export class TicketController {
  static async listTickets(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'No autenticado' });

      const { estado, categoriaId, tecnicoId, search, prioridad, modulo, canal_origen, excluir_canal_origen } = req.query;

      const tickets = await TicketModel.searchTickets({
        userRole: req.user.rol,
        userId: req.user.id,
        modulo: modulo as any,
        estado: estado as TicketStatus,
        categoriaId: categoriaId ? parseInt(categoriaId as string, 10) : undefined,
        tecnicoId: tecnicoId ? parseInt(tecnicoId as string, 10) : undefined,
        searchQuery: search as string,
        prioridad: prioridad as string,
        canalOrigen: canal_origen as string,
        excluirCanalOrigen: excluir_canal_origen as string,
      });

      return res.json({
        success: true,
        data: tickets,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al listar los tickets' });
    }
  }

  static async getTicketDetail(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'No autenticado' });

      const id = parseInt(req.params.id, 10);
      const ticket = await TicketModel.findById(id);

      if (!ticket) {
        return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
      }

      // Restricción de acceso para Solicitantes: solo pueden ver sus propios tickets
      if (req.user.rol === 'SOLICITANTE' && ticket.solicitante_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'No tiene permiso para ver este ticket' });
      }

      // Restricción para Técnicos: solo pueden ver tickets que les han sido asignados
      if (['TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'TECNICO_SG'].includes(req.user.rol)) {
        const userId = req.user.id;
        const isAssigned = ticket.tecnico_id === userId || (ticket.tecnicos_asignados && ticket.tecnicos_asignados.some((a) => a.id === userId));
        if (!isAssigned) {
          return res.status(403).json({ success: false, message: 'No tiene permiso para ver tickets no asignados a su persona' });
        }
      }

      // Restricción para Mesa de Ayuda por área
      if (req.user.rol === 'MESA_AYUDA' && ticket.modulo !== 'OTIC') {
        return res.status(403).json({ success: false, message: 'Este ticket corresponde al área de Servicios Generales e Infraestructura' });
      }
      if (req.user.rol === 'MESA_AYUDA_SG' && ticket.modulo !== 'SERVICIOS_GENERALES') {
        return res.status(403).json({ success: false, message: 'Este ticket corresponde al área de OTIC' });
      }

      const comments = await TicketModel.getComments(id, req.user.rol);
      const rawAttachments = await TicketModel.getAttachments(id);
      const auditLogs = await TicketModel.getAuditLogs(id);

      const normalizedAttachments = rawAttachments.map((a) => {
        let webPath = (a.ruta_servidor || '').replace(/\\/g, '/');
        const idx = webPath.indexOf('uploads/');
        if (idx !== -1) {
          webPath = webPath.substring(idx);
        } else if (a.nombre_guardado) {
          webPath = `uploads/${a.nombre_guardado}`;
        }
        return {
          ...a,
          ruta_servidor: webPath,
          ruta_archivo: webPath,
        };
      });

      const historial = auditLogs.map((log) => {
        let evento = 'Registro en Línea de Vida';
        let detalles = log.valor_nuevo || '';

        switch (log.accion) {
          case 'CREACION_TICKET':
            evento = 'Creación del Requerimiento';
            detalles = log.valor_nuevo || 'Apertura y registro inicial del ticket en el sistema.';
            break;
          case 'ASIGNACION_TECNICO':
            evento = 'Asignación de Especialista';
            detalles = log.valor_nuevo || 'Requerimiento asignado a especialista técnico.';
            break;
          case 'CAMBIO_ESTADO':
            if (log.valor_nuevo === 'RESUELTO' || log.valor_nuevo?.startsWith('RESUELTO')) {
              evento = 'Resolución del Requerimiento';
              const solDetalle = ticket.solucion_detalle?.trim() || '';
              if (log.valor_nuevo?.includes('Informe Técnico:') || log.valor_nuevo?.includes('Informe:')) {
                detalles = log.valor_anterior ? `${log.valor_anterior} → ${log.valor_nuevo}` : log.valor_nuevo;
              } else if (solDetalle) {
                detalles = `${log.valor_anterior ? `${log.valor_anterior} → ` : ''}RESUELTO\nInforme Técnico: ${solDetalle}`;
              } else {
                detalles = log.valor_anterior ? `${log.valor_anterior} → ${log.valor_nuevo}` : `Estado: ${log.valor_nuevo}`;
              }
            } else {
              evento = 'Cambio de Estado';
              detalles = log.valor_anterior ? `${log.valor_anterior} → ${log.valor_nuevo}` : `Estado: ${log.valor_nuevo}`;
            }
            break;
          case 'ADJUNTAR_ARCHIVO':
            evento = 'Archivo Adjuntado';
            detalles = log.valor_nuevo || 'Nuevo documento o evidencia adjuntada.';
            break;
          case 'COMENTARIO_PUBLICO':
            evento = 'Mensaje Registrado';
            detalles = log.valor_nuevo || 'Comentario de comunicación en el requerimiento.';
            break;
          case 'COMENTARIO_INTERNO':
            evento = 'Nota Técnica Interna';
            detalles = log.valor_nuevo || 'Nota interna de coordinación técnica registrada.';
            break;
          case 'REAPERTURA_TICKET':
            evento = 'Reapertura del Requerimiento';
            if (log.valor_nuevo) {
              detalles = log.valor_nuevo.replace(/^ASIGNADO\s*-\s*Motivo:\s*/i, 'Motivo: ');
            } else {
              detalles = 'Ticket reabierto para atención técnica complementaria.';
            }
            break;
          default:
            evento = log.accion ? log.accion.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : 'Evento';
            detalles = log.valor_nuevo || (log.campo_modificado ? `Campo modificado: ${log.campo_modificado}` : '');
            break;
        }

        return {
          id: log.id,
          ticket_id: log.ticket_id,
          evento,
          detalles,
          usuario_id: log.usuario_id,
          usuario_nombre: log.usuario_nombre,
          usuario_rol: log.usuario_rol,
          accion: log.accion,
          campo_modificado: log.campo_modificado,
          valor_anterior: log.valor_anterior,
          valor_nuevo: log.valor_nuevo,
          fecha: log.fecha,
          creado_en: log.fecha,
        };
      });

      return res.json({
        success: true,
        data: {
          ticket,
          comments,
          attachments: normalizedAttachments,
          adjuntos: normalizedAttachments,
          auditLogs,
          historial,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al obtener detalle del ticket' });
    }
  }

  static async getEquipmentHistory(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'No autenticado' });

      const inventoryNumber = req.params.inventoryNumber;
      if (!inventoryNumber || !inventoryNumber.trim()) {
        return res.status(400).json({ success: false, message: 'Número de inventario es requerido' });
      }

      const tickets = await TicketModel.getHistoryByEquipment(inventoryNumber);
      return res.json({
        success: true,
        data: tickets,
      });
    } catch (error: any) {
      console.error('[getEquipmentHistory Error]:', error);
      return res.status(500).json({ success: false, message: 'Error al consultar historial de atenciones del bien' });
    }
  }

  static async getEquipmentSummary(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'No autenticado' });

      const search = (req.query.search as string) || '';
      const modulo = (req.query.modulo as string) || '';
      const estado = (req.query.estado as string) || '';

      const items = await TicketModel.getEquipmentSummary({ search, modulo, estado });
      return res.json({
        success: true,
        data: items,
      });
    } catch (error: any) {
      console.error('[getEquipmentSummary Error]:', error);
      return res.status(500).json({ success: false, message: 'Error al consultar resumen de bienes institucionales' });
    }
  }

  static async createTicket(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'No autenticado' });

      const {
        titulo,
        descripcion,
        tipo,
        impacto,
        urgencia,
        categoriaId,
        ubicacionOficina,
        referenciaUbicacion,
        contactoLocal,
        horarioAcceso,
        subtipoIntervencion,
        datosVehiculares,
        materialesUsados,
        esEquipo,
        es_equipo,
        numeroInventario,
        numero_inventario,
      } = req.body;

      const isEquipoFinal = esEquipo === true || esEquipo === 'true' || es_equipo === true || es_equipo === 'true';
      const numInventarioFinal = isEquipoFinal
        ? (numeroInventario ? String(numeroInventario).trim() : (numero_inventario ? String(numero_inventario).trim() : null))
        : null;

      if (!titulo || !descripcion || !categoriaId) {
        return res.status(400).json({ success: false, message: 'Título, descripción y categoría de servicio son requeridos' });
      }

      const category = await CategoryModel.findById(parseInt(categoriaId, 10));
      if (!category) {
        return res.status(404).json({ success: false, message: 'La categoría de servicio no existe' });
      }

      const moduloTicket = category.modulo || 'OTIC';
      const isSG = moduloTicket === 'SERVICIOS_GENERALES';

      const ticketImpact: TicketImpact = impacto || 'MEDIO';
      const ticketUrgency: TicketUrgency = urgencia || 'MEDIA';
      const prioridad = calculatePriority(ticketImpact, ticketUrgency);

      // Si es Servicios Generales, no se aplican SLAs
      const { fechaLimiteRespuesta, fechaLimiteResolucion } = isSG
        ? { fechaLimiteRespuesta: null, fechaLimiteResolucion: null }
        : calculateSLADeadlines(
            category.sla_horas_respuesta,
            category.sla_horas_resolucion,
            prioridad
          );

      const codigoCorrelativo = await generateTicketCode(moduloTicket);

      // REGLA: El derivar automáticamente no debe estar activado por defecto.
      // Solo se auto-asigna si la opción está activada desde la configuración por el Admin General.
      const isAutoAssign = await ConfigModel.isAutoAssignEnabled();
      const autoTecnicoId = isAutoAssign ? (category.tecnico_defecto_id || null) : null;

      // Sincronizar automáticamente celular, anexo y centro de labores en el perfil del usuario si se enviaron
      try {
        const uPhone = req.body.telefono;
        const uAnexo = req.body.anexo;
        const uDep = req.body.facultadDependencia || (ubicacionOficina && !ubicacionOficina.includes('#N/D') ? ubicacionOficina : undefined);
        if (uPhone || uAnexo || uDep) {
          await UserModel.updateProfile(req.user.id, {
            telefono: uPhone ? String(uPhone).trim() : undefined,
            anexo: uAnexo ? String(uAnexo).trim() : undefined,
            facultadDependencia: uDep ? String(uDep).trim() : undefined,
          });
        }
      } catch (profileSyncErr) {
        console.warn('[TicketController.createTicket] Warning al sincronizar perfil de usuario:', profileSyncErr);
      }

      const newTicketId = await TicketModel.createTicket({
        codigoCorrelativo,
        modulo: moduloTicket,
        titulo,
        descripcion,
        tipo: tipo || 'INCIDENTE',
        prioridad,
        impacto: ticketImpact,
        urgencia: ticketUrgency,
        complejidad: 'BAJA',
        solicitanteId: req.user.id,
        tecnicoId: autoTecnicoId,
        categoriaId: category.id,
        ubicacionOficina: ubicacionOficina || null,
        referenciaUbicacion: referenciaUbicacion || null,
        contactoLocal: contactoLocal || null,
        horarioAcceso: horarioAcceso || null,
        subtipoIntervencion: subtipoIntervencion || null,
        datosVehiculares: datosVehiculares || null,
        materialesUsados: materialesUsados || null,
        canalOrigen: 'PORTAL_WEB',
        fechaLimiteRespuesta,
        fechaLimiteResolucion,
        esEquipo: isEquipoFinal,
        numeroInventario: numInventarioFinal,
      });

      // Procesar archivos adjuntos si vienen en la petición (soporte múltiple con deduplicación)
      let rawFiles: Express.Multer.File[] = [];
      if (req.files && Array.isArray(req.files)) {
        rawFiles = req.files;
      } else if (req.file) {
        rawFiles = [req.file];
      }

      const seenFiles = new Set<string>();
      const uploadedFiles = rawFiles.filter((f) => {
        const key = `${f.originalname}_${f.size}`;
        if (seenFiles.has(key)) return false;
        seenFiles.add(key);
        return true;
      });

      for (const f of uploadedFiles) {
        await TicketModel.addAttachment({
          ticketId: newTicketId,
          nombreOriginal: f.originalname,
          nombreGuardado: f.filename,
          rutaServidor: f.path.replace(/\\/g, '/'),
          tamanoBytes: f.size,
          mimeType: f.mimetype,
          subidoPorId: req.user.id,
        });

        await TicketModel.logAudit({
          ticketId: newTicketId,
          usuarioId: req.user.id,
          accion: 'ADJUNTAR_ARCHIVO',
          valorNuevo: `Archivo inicial: ${f.originalname}`,
          ipOrigen: req.ip,
        });
      }

      // Log de auditoría
      await TicketModel.logAudit({
        ticketId: newTicketId,
        usuarioId: req.user.id,
        accion: 'CREACION_TICKET',
        valorNuevo: `${codigoCorrelativo} (${titulo})${referenciaUbicacion ? ` - Ref: ${referenciaUbicacion}` : ''}`,
        ipOrigen: req.ip,
      });

      // Disparar notificaciones por correo de forma asíncrona no bloqueante
      (async () => {
        try {
          const solicitanteUser = await UserModel.findById(req.user!.id);
          if (solicitanteUser) {
            EmailService.notificarCreacionTicket(
              {
                id: newTicketId,
                codigo_correlativo: codigoCorrelativo,
                titulo,
                descripcion,
                categoria_nombre: category.nombre,
                urgencia: ticketUrgency,
              },
              {
                nombres: solicitanteUser.nombres,
                apellidos: solicitanteUser.apellidos,
                email: solicitanteUser.email,
                facultadDependencia: solicitanteUser.facultad_dependencia,
              }
            ).catch((err) => console.error('[EmailService createTicket error]:', err));
          }
        } catch (err) {
          console.error('[EmailService createTicket background error]:', err);
        }
      })();

      return res.status(201).json({
        success: true,
        message: 'Ticket de requerimiento creado exitosamente',
        data: {
          id: newTicketId,
          codigoCorrelativo,
          titulo,
          categoriaNombre: category.nombre,
          urgencia: ticketUrgency,
          fechaApertura: new Date().toISOString(),
          fechaLimiteResolucion: fechaLimiteResolucion ? fechaLimiteResolucion.toISOString() : null,
        },
      });
    } catch (error: any) {
      console.error('[createTicket Error]:', error);
      return res.status(500).json({ success: false, message: 'Error al registrar el ticket' });
    }
  }

  static async changeStatus(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'No autenticado' });

      const ticketId = parseInt(req.params.id, 10);
      const { estado, solucionDetalle, comentario, materialesUsados, materialesSobrantes } = req.body;

      const ticket = await TicketModel.findById(ticketId);
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket no encontrado' });

      // Validar estados permitidos: ITIL + Estados de Servicios Generales
      const estadoAnterior = ticket.estado;
      const nuevoEstado: TicketStatus = estado;

      const validStates: TicketStatus[] = [
        'REPORTADO',
        'EVALUACION_INSPECCION',
        'ESPERA_MATERIALES',
        'ESPERA_MATERIALES_SOLICITANTE',
        'ASIGNADO',
        'EN_EJECUCION',
        'RESUELTO',
        'OBSERVADO',
      ];

      if (!validStates.includes(nuevoEstado)) {
        return res.status(400).json({ success: false, message: `Estado inválido. Estados permitidos: ${validStates.join(', ')}` });
      }

      // REGLA: Solo el técnico especialista asignado puede cerrar su propio ticket. Mesa de Ayuda NO.
      if (nuevoEstado === 'RESUELTO') {
        if (['MESA_AYUDA', 'MESA_AYUDA_SG'].includes(req.user.rol)) {
          return res.status(403).json({
            success: false,
            message: 'Solo el técnico especialista asignado puede resolver y cerrar su ticket. Mesa de Ayuda no tiene permisos para concluir la atención técnica.',
          });
        }

        if (['TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'TECNICO_SG'].includes(req.user.rol)) {
          const userId = req.user.id;
          const isAssigned = ticket.tecnico_id === userId || (ticket.tecnicos_asignados && ticket.tecnicos_asignados.some((a) => a.id === userId));
          if (!isAssigned) {
            return res.status(403).json({
              success: false,
              message: 'Solo el técnico especialista designado para este ticket puede marcarlo como resuelto.',
            });
          }
        }
      }

      await TicketModel.updateTicketStatus(
        ticketId,
        nuevoEstado,
        solucionDetalle,
        undefined,
        materialesUsados,
        materialesSobrantes
      );

      // Procesar informe técnico o documento adjunto opcional
      const uploadedFiles: Express.Multer.File[] = [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        uploadedFiles.push(...req.files);
      } else if (req.file) {
        uploadedFiles.push(req.file);
      }

      for (const f of uploadedFiles) {
        await TicketModel.addAttachment({
          ticketId,
          comentarioId: undefined,
          nombreOriginal: f.originalname,
          nombreGuardado: f.filename,
          rutaServidor: f.path,
          tamanoBytes: f.size,
          mimeType: f.mimetype,
          subidoPorId: req.user.id,
        });

        await TicketModel.logAudit({
          ticketId,
          usuarioId: req.user.id,
          accion: 'ADJUNTAR_ARCHIVO',
          campoModificado: 'adjunto_resolucion',
          valorNuevo: `Informe técnico / documento adjunto: ${f.originalname}`,
          ipOrigen: req.ip,
        });
      }

      if (comentario) {
        await TicketModel.addComment({
          ticketId,
          usuarioId: req.user.id,
          mensaje: comentario,
          esNotaInterna: false,
        });
      }

      let valorNuevoAudit: string = nuevoEstado;
      if (nuevoEstado === 'RESUELTO' && solucionDetalle?.trim()) {
        valorNuevoAudit = `RESUELTO - Informe Técnico: ${solucionDetalle.trim()}`;
      }

      await TicketModel.logAudit({
        ticketId,
        usuarioId: req.user.id,
        accion: 'CAMBIO_ESTADO',
        campoModificado: 'estado',
        valorAnterior: estadoAnterior,
        valorNuevo: valorNuevoAudit,
        ipOrigen: req.ip,
      });

      // Si el ticket fue marcado como RESUELTO, notificar al solicitante por correo
      if (nuevoEstado === 'RESUELTO') {
        (async () => {
          try {
            const solicitanteUser = await UserModel.findById(ticket.solicitante_id);
            if (solicitanteUser) {
              EmailService.notificarResolucionTicket(
                {
                  id: ticketId,
                  codigo_correlativo: ticket.codigo_correlativo,
                  titulo: ticket.titulo,
                },
                {
                  nombres: solicitanteUser.nombres,
                  apellidos: solicitanteUser.apellidos,
                  email: solicitanteUser.email,
                },
                solucionDetalle || 'Atención completada satisfactoriamente.'
              ).catch((err) => console.error('[EmailService notificarResolucionTicket error]:', err));
            }
          } catch (err) {
            console.error('[EmailService changeStatus background error]:', err);
          }
        })();
      }

      return res.json({
        success: true,
        message: `Estado de ticket actualizado a [${nuevoEstado}]`,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al actualizar el estado del ticket' });
    }
  }

  static async assignTicket(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'No autenticado' });

      // Solo Mesa de Ayuda (OTIC y Serv. Generales), Supervisor y Admin pueden asignar
      if (!['ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG', 'MESA_AYUDA', 'MESA_AYUDA_SG'].includes(req.user.rol)) {
        return res.status(403).json({ success: false, message: 'Solo el personal de Mesa de Ayuda, Supervisor o Administrador puede asignar tickets' });
      }

      const ticketId = parseInt(req.params.id, 10);
      const { tecnicoId, complejidad, tecnicosAdicionalesIds } = req.body;

      if (!tecnicoId) return res.status(400).json({ success: false, message: 'Se requiere seleccionar el técnico especialista' });

      const ticket = await TicketModel.findById(ticketId);
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket no encontrado' });

      // Validación por área para Mesa de Ayuda
      if (req.user.rol === 'MESA_AYUDA' && ticket.modulo !== 'OTIC') {
        return res.status(403).json({ success: false, message: 'No tiene permisos para asignar requerimientos de Servicios Generales' });
      }
      if (req.user.rol === 'MESA_AYUDA_SG' && ticket.modulo !== 'SERVICIOS_GENERALES') {
        return res.status(403).json({ success: false, message: 'No tiene permisos para asignar requerimientos de OTIC' });
      }

      const comp: TicketComplejidad = complejidad || 'BAJA';

      // REGLA: Designación múltiple solo para Mesa de Ayuda OTIC cuando la complejidad es COMPLEJA
      let parsedAdicionales: number[] = [];
      if (ticket.modulo === 'OTIC' && comp === 'COMPLEJA' && Array.isArray(tecnicosAdicionalesIds)) {
        parsedAdicionales = tecnicosAdicionalesIds
          .map((id: any) => parseInt(id, 10))
          .filter((id: number) => !isNaN(id) && id !== parseInt(tecnicoId, 10));
        parsedAdicionales = Array.from(new Set(parsedAdicionales));
      }

      await TicketModel.assignTechnicianWithComplexity(ticketId, parseInt(tecnicoId, 10), comp, parsedAdicionales);

      const assignedTecUser = await UserModel.findById(parseInt(tecnicoId, 10));
      const assignedTecName = assignedTecUser
        ? `${assignedTecUser.nombres} ${assignedTecUser.apellidos}`
        : `Técnico ID ${tecnicoId}`;

      let additionalNamesText = '';
      const additionalUsersList: any[] = [];
      if (parsedAdicionales.length > 0) {
        const addUsers = await Promise.all(parsedAdicionales.map((id) => UserModel.findById(id)));
        for (const u of addUsers) {
          if (u) additionalUsersList.push(u);
        }
        if (additionalUsersList.length > 0) {
          additionalNamesText = ` | Técnicos de Apoyo: ${additionalUsersList.map((u) => `${u.nombres} ${u.apellidos}`).join(', ')}`;
        }
      }

      await TicketModel.logAudit({
        ticketId,
        usuarioId: req.user.id,
        accion: 'ASIGNACION_TECNICO',
        campoModificado: 'tecnico_id',
        valorAnterior: ticket.tecnico_nombre || 'Sin Asignar',
        valorNuevo: `Asignado al Especialista ${assignedTecName}${additionalNamesText} | Complejidad: ${comp}`,
        ipOrigen: req.ip,
      });

      // Disparar notificaciones por correo de asignación (al técnico principal, adicionales y al solicitante)
      (async () => {
        try {
          const [tecnicoUser, solicitanteUser] = await Promise.all([
            UserModel.findById(parseInt(tecnicoId, 10)),
            UserModel.findById(ticket.solicitante_id),
          ]);

          if (tecnicoUser && solicitanteUser) {
            EmailService.notificarAsignacionTecnico(
              {
                id: ticketId,
                codigo_correlativo: ticket.codigo_correlativo,
                titulo: ticket.titulo,
                descripcion: ticket.descripcion,
                complejidad: comp,
              },
              {
                nombres: tecnicoUser.nombres,
                apellidos: tecnicoUser.apellidos,
                email: tecnicoUser.email,
                facultadDependencia: tecnicoUser.facultad_dependencia,
              },
              {
                nombres: solicitanteUser.nombres,
                apellidos: solicitanteUser.apellidos,
                email: solicitanteUser.email,
                facultadDependencia: solicitanteUser.facultad_dependencia,
              }
            ).catch((err) => console.error('[EmailService assignTicket error]:', err));

            // Notificar a técnicos adicionales de apoyo si los hay
            for (const coTec of additionalUsersList) {
              EmailService.notificarAsignacionTecnico(
                {
                  id: ticketId,
                  codigo_correlativo: ticket.codigo_correlativo,
                  titulo: `${ticket.titulo} (Equipo de Apoyo Técnico)`,
                  descripcion: ticket.descripcion,
                  complejidad: comp,
                },
                {
                  nombres: coTec.nombres,
                  apellidos: coTec.apellidos,
                  email: coTec.email,
                  facultadDependencia: coTec.facultad_dependencia,
                },
                {
                  nombres: solicitanteUser.nombres,
                  apellidos: solicitanteUser.apellidos,
                  email: solicitanteUser.email,
                  facultadDependencia: solicitanteUser.facultad_dependencia,
                }
              ).catch((err) => console.error('[EmailService assignTicket coTec error]:', err));
            }
          }
        } catch (err) {
          console.error('[EmailService assignTicket background error]:', err);
        }
      })();

      return res.json({
        success: true,
        message: `Técnico especialista asignado con complejidad [${comp}] exitosamente`,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al asignar el técnico al ticket' });
    }
  }

  static async observeTicket(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'No autenticado' });

      // Solo Mesa de Ayuda (OTIC y Serv. Generales), Supervisor y Admin pueden observar
      if (!['ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG', 'MESA_AYUDA', 'MESA_AYUDA_SG'].includes(req.user.rol)) {
        return res.status(403).json({ success: false, message: 'Solo el personal de Mesa de Ayuda o Supervisor puede observar requerimientos' });
      }

      const ticketId = parseInt(req.params.id, 10);
      const { justificacion } = req.body;

      if (!justificacion || !justificacion.trim()) {
        return res.status(400).json({ success: false, message: 'La justificación o motivo de la observación es requerida' });
      }

      const ticket = await TicketModel.findById(ticketId);
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket no encontrado' });

      // Cambiar estado a OBSERVADO
      await TicketModel.updateTicketStatus(ticketId, 'OBSERVADO');

      // Registrar comentario con la observación
      const commentId = await TicketModel.addComment({
        ticketId,
        usuarioId: req.user.id,
        mensaje: `[OBSERVACIÓN]: ${justificacion.trim()}`,
        esNotaInterna: false,
      });

      // Si se adjuntó archivo o foto
      if (req.file) {
        await TicketModel.addAttachment({
          ticketId,
          comentarioId: commentId,
          nombreOriginal: req.file.originalname,
          nombreGuardado: req.file.filename,
          rutaServidor: req.file.path,
          tamanoBytes: req.file.size,
          mimeType: req.file.mimetype,
          subidoPorId: req.user.id,
        });

        await TicketModel.logAudit({
          ticketId,
          usuarioId: req.user.id,
          accion: 'ADJUNTAR_ARCHIVO',
          valorNuevo: `Evidencia de observación adjunta: ${req.file.originalname}`,
          ipOrigen: req.ip,
        });
      }

      await TicketModel.logAudit({
        ticketId,
        usuarioId: req.user.id,
        accion: 'CAMBIO_ESTADO',
        campoModificado: 'estado',
        valorAnterior: ticket.estado,
        valorNuevo: 'OBSERVADO',
        ipOrigen: req.ip,
      });

      await TicketModel.logAudit({
        ticketId,
        usuarioId: req.user.id,
        accion: 'COMENTARIO_PUBLICO',
        valorNuevo: `Observación registrada: ${justificacion.trim()}`,
        ipOrigen: req.ip,
      });

      // Notificar al solicitante por correo electrónico institucional
      const currentUser = req.user;
      (async () => {
        try {
          const solicitanteUser = await UserModel.findById(ticket.solicitante_id);
          if (solicitanteUser && currentUser) {
            EmailService.notificarObservacionTicket(
              {
                id: ticketId,
                codigo_correlativo: ticket.codigo_correlativo,
                titulo: ticket.titulo,
              },
              {
                nombres: solicitanteUser.nombres,
                apellidos: solicitanteUser.apellidos,
                email: solicitanteUser.email,
              },
              {
                nombres: currentUser.nombres,
                apellidos: currentUser.apellidos,
              },
              justificacion.trim()
            ).catch((err) => console.error('[EmailService notificarObservacionTicket error]:', err));
          }
        } catch (err) {
          console.error('[EmailService observeTicket background error]:', err);
        }
      })();

      return res.json({
        success: true,
        message: 'Requerimiento observado exitosamente y notificación enviada al solicitante',
      });
    } catch (error: any) {
      console.error('[observeTicket Error]:', error);
      return res.status(500).json({ success: false, message: 'Error al registrar la observación del ticket' });
    }
  }

  static async deriveTicket(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'No autenticado' });

      if (!['ADMIN', 'SUPERVISOR', 'SUPERVISOR_SG', 'MESA_AYUDA', 'MESA_AYUDA_SG', 'TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'TECNICO_SG'].includes(req.user.rol)) {
        return res.status(403).json({ success: false, message: 'No tiene permisos para derivar tickets' });
      }

      const ticketId = parseInt(req.params.id, 10);
      const { nuevoTecnicoId, nuevaCategoriaId, nuevaComplejidad, motivo, nuevosTecnicosAdicionalesIds } = req.body;

      if (!nuevoTecnicoId) {
        return res.status(400).json({ success: false, message: 'Debe indicar el nuevo técnico de destino' });
      }

      const ticket = await TicketModel.findById(ticketId);
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket no encontrado' });

      await TicketModel.deriveTicket(
        ticketId,
        parseInt(nuevoTecnicoId, 10),
        nuevaCategoriaId ? parseInt(nuevaCategoriaId, 10) : undefined,
        nuevaComplejidad as TicketComplejidad,
        nuevosTecnicosAdicionalesIds
      );

      const nuevoTecUser = await UserModel.findById(parseInt(nuevoTecnicoId, 10));
      const nuevoTecName = nuevoTecUser
        ? `${nuevoTecUser.nombres} ${nuevoTecUser.apellidos}`
        : `Técnico ID ${nuevoTecnicoId}`;

      await TicketModel.logAudit({
        ticketId,
        usuarioId: req.user.id,
        accion: 'DERIVACION_TICKET',
        campoModificado: 'tecnico_id',
        valorAnterior: ticket.tecnico_nombre || 'Sin Asignar',
        valorNuevo: `Derivado al Especialista ${nuevoTecName}${motivo ? ` - Motivo: ${motivo}` : ''}`,
        ipOrigen: req.ip,
      });

      // Notificar al nuevo técnico derivado y al solicitante
      (async () => {
        try {
          const [nuevoTecnicoUser, solicitanteUser] = await Promise.all([
            UserModel.findById(parseInt(nuevoTecnicoId, 10)),
            UserModel.findById(ticket.solicitante_id),
          ]);

          if (nuevoTecnicoUser && solicitanteUser) {
            EmailService.notificarAsignacionTecnico(
              {
                id: ticketId,
                codigo_correlativo: ticket.codigo_correlativo,
                titulo: ticket.titulo,
                descripcion: `${ticket.descripcion}${motivo ? `\n[Nota de Derivación]: ${motivo}` : ''}`,
                complejidad: nuevaComplejidad || ticket.complejidad,
              },
              {
                nombres: nuevoTecnicoUser.nombres,
                apellidos: nuevoTecnicoUser.apellidos,
                email: nuevoTecnicoUser.email,
                facultadDependencia: nuevoTecnicoUser.facultad_dependencia,
              },
              {
                nombres: solicitanteUser.nombres,
                apellidos: solicitanteUser.apellidos,
                email: solicitanteUser.email,
                facultadDependencia: solicitanteUser.facultad_dependencia,
              }
            ).catch((err) => console.error('[EmailService deriveTicket error]:', err));
          }
        } catch (err) {
          console.error('[EmailService deriveTicket background error]:', err);
        }
      })();

      return res.json({
        success: true,
        message: 'Ticket derivado correctamente',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al derivar el ticket' });
    }
  }

  static async reopenTicket(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'No autenticado' });

      const ticketId = parseInt(req.params.id, 10);
      const { motivo } = req.body;

      const ticket = await TicketModel.findById(ticketId);
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket no encontrado' });

      // Regla ITIL 5 días para cierre definitivo sin reapertura
      if (ticket.fecha_resolucion) {
        const diffMs = Date.now() - new Date(ticket.fecha_resolucion).getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays > 5 && req.user.rol === 'SOLICITANTE') {
          return res.status(400).json({
            success: false,
            message: 'Han transcurrido más de 5 días desde la resolución del ticket. Según la norma ITIL, el ticket se encuentra cerrado definitivamente y no puede ser reabierto. Por favor genere una nueva solicitud.',
          });
        }
      }

      await TicketModel.reopenTicket(ticketId, motivo, req.user.id);

      // Notificar reapertura al técnico y a Mesa de Ayuda
      (async () => {
        try {
          const [tecnicoUser, solicitanteUser] = await Promise.all([
            ticket.tecnico_id ? UserModel.findById(ticket.tecnico_id) : Promise.resolve(null),
            UserModel.findById(ticket.solicitante_id),
          ]);

          if (solicitanteUser) {
            EmailService.notificarReaperturaTicket(
              {
                id: ticketId,
                codigo_correlativo: ticket.codigo_correlativo,
                titulo: ticket.titulo,
              },
              tecnicoUser ? { email: tecnicoUser.email } : null,
              {
                nombres: solicitanteUser.nombres,
                apellidos: solicitanteUser.apellidos,
              },
              motivo || 'Problema recurrente reportado por el solicitante'
            ).catch((err) => console.error('[EmailService reopenTicket error]:', err));
          }
        } catch (err) {
          console.error('[EmailService reopenTicket background error]:', err);
        }
      })();

      return res.json({
        success: true,
        message: 'El ticket ha sido reabierto exitosamente para continuar su atención',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al reabrir ticket' });
    }
  }

  static async submitSurvey(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'No autenticado' });

      const ticketId = parseInt(req.params.id, 10);
      const { puntuacion, comentario } = req.body;

      if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
        return res.status(400).json({ success: false, message: 'La calificación debe ser de 1 a 5 estrellas' });
      }

      const ticket = await TicketModel.findById(ticketId);
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket no encontrado' });

      await TicketModel.submitSatisfactionSurvey({
        ticketId,
        tecnicoId: ticket.tecnico_id || undefined,
        solicitanteId: req.user.id,
        puntuacion: parseInt(puntuacion, 10),
        comentario: comentario || undefined,
      });

      await TicketModel.logAudit({
        ticketId,
        usuarioId: req.user.id,
        accion: 'ENCUESTA_SATISFACCION',
        campoModificado: 'calificacion',
        valorNuevo: `${puntuacion} Estrellas ${comentario ? `(${comentario})` : ''}`,
        ipOrigen: req.ip,
      });

      return res.json({
        success: true,
        message: '¡Muchas gracias por calificar la atención del especialista!',
      });
    } catch (error: any) {
      console.error('[submitSurvey error]:', error);
      return res.status(500).json({ success: false, message: 'Error al registrar encuesta de satisfacción' });
    }
  }

  static async addComment(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'No autenticado' });

      const ticketId = parseInt(req.params.id, 10);
      const { mensaje, esNotaInterna } = req.body;

      if (!mensaje || !mensaje.trim()) {
        return res.status(400).json({ success: false, message: 'El mensaje no puede estar vacío' });
      }

      const ticket = await TicketModel.findById(ticketId);
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket no encontrado' });

      const esInterna = req.user.rol === 'SOLICITANTE'
        ? false
        : (esNotaInterna === true || esNotaInterna === 'true' || esNotaInterna === 1 || esNotaInterna === '1');

      const commentId = await TicketModel.addComment({
        ticketId,
        usuarioId: req.user.id,
        mensaje,
        esNotaInterna: esInterna,
      });

      if (req.file) {
        await TicketModel.addAttachment({
          ticketId,
          comentarioId: commentId,
          nombreOriginal: req.file.originalname,
          nombreGuardado: req.file.filename,
          rutaServidor: req.file.path,
          tamanoBytes: req.file.size,
          mimeType: req.file.mimetype,
          subidoPorId: req.user.id,
        });

        await TicketModel.logAudit({
          ticketId,
          usuarioId: req.user.id,
          accion: 'ADJUNTAR_ARCHIVO',
          valorNuevo: `Archivo adjunto en comentario: ${req.file.originalname}`,
          ipOrigen: req.ip,
        });
      }

      await TicketModel.logAudit({
        ticketId,
        usuarioId: req.user.id,
        accion: esInterna ? 'NOTA_INTERNA' : 'NUEVO_COMENTARIO',
        valorNuevo: mensaje.length > 80 ? `${mensaje.slice(0, 80)}...` : mensaje,
        ipOrigen: req.ip,
      });

      // Si el ticket estaba en OBSERVADO y el solicitante envía información/aclaración, pasa automáticamente a REPORTADO
      if (ticket.estado === 'OBSERVADO' && req.user.rol === 'SOLICITANTE') {
        await TicketModel.updateTicketStatus(ticketId, 'REPORTADO');
        await TicketModel.logAudit({
          ticketId,
          usuarioId: req.user.id,
          accion: 'CAMBIO_ESTADO',
          campoModificado: 'estado',
          valorAnterior: 'OBSERVADO',
          valorNuevo: 'REPORTADO',
          ipOrigen: req.ip,
        });
      }

      return res.status(201).json({
        success: true,
        message: esInterna ? 'Nota interna guardada' : 'Comentario registrado',
        data: { commentId },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al agregar comentario' });
    }
  }

  static async addAttachments(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'No autenticado' });

      const ticketId = parseInt(req.params.id, 10);
      const ticket = await TicketModel.findById(ticketId);
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket no encontrado' });

      let rawFiles: Express.Multer.File[] = [];
      if (req.files && Array.isArray(req.files)) {
        rawFiles = req.files;
      } else if (req.file) {
        rawFiles = [req.file];
      }

      const seenFiles = new Set<string>();
      const uploadedFiles = rawFiles.filter((f) => {
        const key = `${f.originalname}_${f.size}`;
        if (seenFiles.has(key)) return false;
        seenFiles.add(key);
        return true;
      });

      if (uploadedFiles.length === 0) {
        return res.status(400).json({ success: false, message: 'No se recibieron archivos para adjuntar' });
      }

      const added = [];
      for (const f of uploadedFiles) {
        const attachId = await TicketModel.addAttachment({
          ticketId,
          nombreOriginal: f.originalname,
          nombreGuardado: f.filename,
          rutaServidor: f.path.replace(/\\/g, '/'),
          tamanoBytes: f.size,
          mimeType: f.mimetype,
          subidoPorId: req.user.id,
        });

        added.push({ id: attachId, nombreOriginal: f.originalname });

        await TicketModel.logAudit({
          ticketId,
          usuarioId: req.user.id,
          accion: 'ADJUNTAR_ARCHIVO',
          valorNuevo: `Archivo adicional: ${f.originalname} (${(f.size / 1024).toFixed(1)} KB)`,
          ipOrigen: req.ip,
        });
      }

      // Si el ticket estaba en OBSERVADO y el solicitante envía archivos/evidencias, pasa automáticamente a REPORTADO
      if (ticket.estado === 'OBSERVADO' && req.user.rol === 'SOLICITANTE') {
        await TicketModel.updateTicketStatus(ticketId, 'REPORTADO');
        await TicketModel.logAudit({
          ticketId,
          usuarioId: req.user.id,
          accion: 'CAMBIO_ESTADO',
          campoModificado: 'estado',
          valorAnterior: 'OBSERVADO',
          valorNuevo: 'REPORTADO',
          ipOrigen: req.ip,
        });
      }

      return res.status(201).json({
        success: true,
        message: `${added.length} archivo(s) adjuntado(s) exitosamente`,
        data: added,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al adjuntar archivos al ticket' });
    }
  }
}

