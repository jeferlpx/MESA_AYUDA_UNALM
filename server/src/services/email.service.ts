import nodemailer from 'nodemailer';
import { env } from '../config/env';

/**
 * Servicio de Notificaciones por Correo Electrónico para la Mesa de Ayuda OTIC UNALM
 * Dispara notificaciones HTML automáticas en cada fase del ciclo de vida ITIL del ticket.
 * Cuenta con modo resiliente (si no hay credenciales SMTP configuradas, simula el envío sin interrumpir el flujo).
 */
export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Inicializa o devuelve el transportador SMTP
   */
  private static getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) return this.transporter;

    if (!env.SMTP_USER || !env.SMTP_PASS) {
      return null;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false, // Permite certificados autofirmados si es relay local
        },
      });
      return this.transporter;
    } catch (err) {
      console.error('[EmailService] Error al inicializar transportador SMTP:', err);
      return null;
    }
  }

  /**
   * Método base para enviar correos con fallback a consola
   */
  private static async sendMail(options: { to: string; subject: string; html: string }): Promise<void> {
    const transporter = this.getTransporter();

    if (!transporter) {
      console.log(`\n=============================================================`);
      console.log(`[EMAIL NOTIFICADOR - MODO SIMULADO / PENDIENTE CREDENCIALES]`);
      console.log(`Para: ${options.to}`);
      console.log(`Asunto: ${options.subject}`);
      console.log(`Estado: Procesado correctamente (Configure SMTP_USER y SMTP_PASS en .env para envío real)`);
      console.log(`=============================================================\n`);
      return;
    }

    try {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      console.log(`[EmailService OK] Correo enviado exitosamente a: ${options.to} | Asunto: ${options.subject}`);
    } catch (error: any) {
      console.error(`[EmailService ERROR] No se pudo enviar correo a ${options.to}:`, error.message);
    }
  }

  /**
   * Generador de plantilla base HTML institucional UNALM
   */
  private static renderEmailTemplate(data: {
    headerTitle: string;
    headerSubtitle: string;
    contentHtml: string;
    buttonText?: string;
    buttonUrl?: string;
  }): string {
    const actionButton =
      data.buttonText && data.buttonUrl
        ? `
        <div style="text-align: center; margin: 28px 0 10px 0;">
          <a href="${data.buttonUrl}" style="background-color: #15803d; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            ${data.buttonText} &rarr;
          </a>
        </div>
      `
        : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #14532d 0%, #15803d 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">
                Mesa de Ayuda <span style="color: #86efac;">OTIC</span> UNALM
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                ${data.headerSubtitle}
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 16px 0; font-size: 17px; font-weight: 700; color: #0f172a;">
                ${data.headerTitle}
              </h2>

              ${data.contentHtml}

              ${actionButton}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
              <p style="margin: 0; font-weight: 600;">Oficina de Tecnologías de la Información (OTIC)</p>
              <p style="margin: 4px 0 0 0;">Universidad Nacional Agraria La Molina • Sistema ITIL v4</p>
              <p style="margin: 8px 0 0 0; font-size: 10px; color: #94a3b8;">Este es un mensaje automático de notificación institucional, por favor no responda a este correo.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  // ===========================================================================
  // 1. NOTIFICACIÓN DE CREACIÓN DE TICKET
  // ===========================================================================
  static async notificarCreacionTicket(ticket: any, solicitante: any): Promise<void> {
    const ticketUrl = `${env.APP_URL}`;

    // A. Correo para el Solicitante (Confirmación de recepción con código correlativo)
    const htmlSolicitante = this.renderEmailTemplate({
      headerTitle: `¡Hola, ${solicitante.nombres}!`,
      headerSubtitle: 'Confirmación de Solicitud Registrada',
      contentHtml: `
        <p style="font-size: 13px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
          Tu requerimiento técnico ha sido recibido satisfactoriamente por la <strong>Mesa de Ayuda de la OTIC</strong>. A continuación, el detalle de tu solicitud:
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 20px;">
          <table width="100%" style="font-size: 13px;">
            <tr>
              <td style="color: #64748b; padding-bottom: 8px; width: 35%;">Código Ticket:</td>
              <td style="font-weight: 800; color: #15803d; font-family: monospace; font-size: 14px; padding-bottom: 8px;">${ticket.codigo_correlativo}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding-bottom: 8px;">Asunto:</td>
              <td style="font-weight: 700; color: #0f172a; padding-bottom: 8px;">${ticket.titulo}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding-bottom: 8px;">Servicio OTIC:</td>
              <td style="font-weight: 600; color: #334155; padding-bottom: 8px;">${ticket.categoria_nombre || 'Servicio Técnico'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding-bottom: 8px;">Urgencia:</td>
              <td style="font-weight: 700; color: #b45309; padding-bottom: 8px;">${ticket.urgencia || 'MEDIA'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; vertical-align: top;">Descripción:</td>
              <td style="color: #475569; font-style: italic; vertical-align: top;">"${ticket.descripcion}"</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.5;">
          El personal de triaje de la Mesa de Ayuda revisará tu solicitud y asignará al especialista correspondiente de acuerdo a los Acuerdos de Nivel de Servicio (SLA).
        </p>
      `,
      buttonText: 'Consultar Estado del Ticket',
      buttonUrl: ticketUrl,
    });

    // B. Correo de Alerta para Mesa de Ayuda / Triaje
    const htmlMesaAyuda = this.renderEmailTemplate({
      headerTitle: '🔔 Nuevo Ticket en Cola de Triaje',
      headerSubtitle: 'Alerta para Mesa de Ayuda OTIC',
      contentHtml: `
        <p style="font-size: 13px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
          Se ha generado un nuevo ticket en el sistema que requiere revisión de complejidad y asignación a un técnico especialista:
        </p>

        <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 14px; padding: 18px; margin-bottom: 20px;">
          <table width="100%" style="font-size: 13px;">
            <tr>
              <td style="color: #854d0e; padding-bottom: 8px; width: 35%;">Correlativo:</td>
              <td style="font-weight: 800; color: #a16207; font-family: monospace; font-size: 14px; padding-bottom: 8px;">${ticket.codigo_correlativo}</td>
            </tr>
            <tr>
              <td style="color: #854d0e; padding-bottom: 8px;">Solicitante:</td>
              <td style="font-weight: 700; color: #0f172a; padding-bottom: 8px;">${solicitante.nombres} ${solicitante.apellidos}</td>
            </tr>
            <tr>
              <td style="color: #854d0e; padding-bottom: 8px;">Dependencia:</td>
              <td style="font-weight: 600; color: #334155; padding-bottom: 8px;">${solicitante.facultadDependencia || 'UNALM'}</td>
            </tr>
            <tr>
              <td style="color: #854d0e; padding-bottom: 8px;">Asunto:</td>
              <td style="font-weight: 700; color: #0f172a; padding-bottom: 8px;">${ticket.titulo}</td>
            </tr>
            <tr>
              <td style="color: #854d0e; vertical-align: top;">Urgencia:</td>
              <td style="font-weight: 800; color: #dc2626; vertical-align: top;">${ticket.urgencia || 'MEDIA'}</td>
            </tr>
          </table>
        </div>
      `,
      buttonText: 'Ir a Cola de Triaje Mesa de Ayuda',
      buttonUrl: ticketUrl,
    });

    await Promise.allSettled([
      this.sendMail({
        to: solicitante.email,
        subject: `[${ticket.codigo_correlativo}] Confirmación de Requerimiento - OTIC UNALM`,
        html: htmlSolicitante,
      }),
      this.sendMail({
        to: env.MESA_AYUDA_EMAIL,
        subject: `🔔 [NUEVO TICKET] ${ticket.codigo_correlativo} - ${ticket.titulo}`,
        html: htmlMesaAyuda,
      }),
    ]);
  }

  // ===========================================================================
  // 2. NOTIFICACIÓN DE ASIGNACIÓN DE TÉCNICO & COMPLEJIDAD
  // ===========================================================================
  static async notificarAsignacionTecnico(ticket: any, tecnico: any, solicitante: any): Promise<void> {
    const ticketUrl = `${env.APP_URL}`;

    // A. Correo para el Técnico Asignado
    const htmlTecnico = this.renderEmailTemplate({
      headerTitle: `Estimado(a) ${tecnico.nombres},`,
      headerSubtitle: 'Nuevo Ticket Asignado para Atención',
      contentHtml: `
        <p style="font-size: 13px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
          Se te ha asignado el ticket <strong>${ticket.codigo_correlativo}</strong> para su atención y resolución técnica:
        </p>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 18px; margin-bottom: 20px;">
          <table width="100%" style="font-size: 13px;">
            <tr>
              <td style="color: #166534; padding-bottom: 8px; width: 35%;">Código Ticket:</td>
              <td style="font-weight: 800; color: #15803d; font-family: monospace; font-size: 14px; padding-bottom: 8px;">${ticket.codigo_correlativo}</td>
            </tr>
            <tr>
              <td style="color: #166534; padding-bottom: 8px;">Solicitante:</td>
              <td style="font-weight: 700; color: #0f172a; padding-bottom: 8px;">${solicitante.nombres} ${solicitante.apellidos} (${solicitante.facultadDependencia})</td>
            </tr>
            <tr>
              <td style="color: #166534; padding-bottom: 8px;">Complejidad:</td>
              <td style="font-weight: 800; color: #0369a1; padding-bottom: 8px;">${ticket.complejidad || 'BAJA'}</td>
            </tr>
            <tr>
              <td style="color: #166534; padding-bottom: 8px;">Asunto:</td>
              <td style="font-weight: 700; color: #0f172a; padding-bottom: 8px;">${ticket.titulo}</td>
            </tr>
            <tr>
              <td style="color: #166534; vertical-align: top;">Descripción:</td>
              <td style="color: #475569; font-style: italic; vertical-align: top;">"${ticket.descripcion}"</td>
            </tr>
          </table>
        </div>
      `,
      buttonText: 'Atender Ticket en Cola OTIC',
      buttonUrl: ticketUrl,
    });

    // B. Correo para el Solicitante (Informando especialista asignado)
    const htmlSolicitante = this.renderEmailTemplate({
      headerTitle: '¡Tu solicitud ya tiene un técnico especialista!',
      headerSubtitle: 'Actualización de Estado de Ticket',
      contentHtml: `
        <p style="font-size: 13px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
          Te informamos que tu ticket <strong>${ticket.codigo_correlativo}</strong> ha sido asignado a un especialista de la OTIC para su pronta atención:
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 20px;">
          <table width="100%" style="font-size: 13px;">
            <tr>
              <td style="color: #64748b; padding-bottom: 8px; width: 35%;">Especialista:</td>
              <td style="font-weight: 800; color: #0f172a; font-size: 14px; padding-bottom: 8px;">${tecnico.nombres} ${tecnico.apellidos}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding-bottom: 8px;">Área / Dependencia:</td>
              <td style="font-weight: 600; color: #334155; padding-bottom: 8px;">${tecnico.facultadDependencia || 'OTIC Soporte Especializado'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding-bottom: 8px;">Asunto:</td>
              <td style="font-weight: 700; color: #0f172a; padding-bottom: 8px;">${ticket.titulo}</td>
            </tr>
            <tr>
              <td style="color: #64748b;">Estado Actual:</td>
              <td style="font-weight: 800; color: #2563eb;">ASIGNADO (En Proceso de Atención)</td>
            </tr>
          </table>
        </div>
      `,
      buttonText: 'Ver Detalle del Ticket',
      buttonUrl: ticketUrl,
    });

    await Promise.allSettled([
      this.sendMail({
        to: tecnico.email,
        subject: `📌 [ASIGNADO] Ticket ${ticket.codigo_correlativo} - ${ticket.titulo}`,
        html: htmlTecnico,
      }),
      this.sendMail({
        to: solicitante.email,
        subject: `[ACTUALIZACIÓN] Especialista asignado a tu ticket ${ticket.codigo_correlativo}`,
        html: htmlSolicitante,
      }),
    ]);
  }

  // ===========================================================================
  // 3. NOTIFICACIÓN DE RESOLUCIÓN DE TICKET & ENCUESTA DE CALIDAD
  // ===========================================================================
  static async notificarResolucionTicket(ticket: any, solicitante: any, solucionDetalle: string): Promise<void> {
    const ticketUrl = `${env.APP_URL}`;

    const html = this.renderEmailTemplate({
      headerTitle: '✅ ¡Tu requerimiento ha sido resuelto!',
      headerSubtitle: 'Atención Técnica Finalizada',
      contentHtml: `
        <p style="font-size: 13px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
          El especialista de la OTIC ha reportado la solución satisfactoria de tu ticket <strong>${ticket.codigo_correlativo}</strong>:
        </p>

        <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 14px; padding: 18px; margin-bottom: 20px;">
          <span style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">
            Detalle de la Solución Técnica:
          </span>
          <p style="margin: 0; font-size: 13px; color: #14532d; font-weight: 500; line-height: 1.5; white-space: pre-wrap;">
            "${solucionDetalle || 'Atención completada satisfactoriamente.'}"
          </p>
        </div>

        <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 14px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 600;">
            ⭐ Tu opinión es fundamental para nosotros:
          </p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #a16207; line-height: 1.4;">
            Por favor tómate unos segundos para calificar el desempeño y calidad de atención del técnico especialista (1 a 5 estrellas).
          </p>
        </div>

        <p style="font-size: 11px; color: #94a3b8; margin: 0; font-style: italic;">
          * Si el inconveniente persiste, cuentas con hasta 5 días para reabrir el ticket directamente desde el portal web.
        </p>
      `,
      buttonText: 'Calificar Atención Técnica (1-5★)',
      buttonUrl: ticketUrl,
    });

    await this.sendMail({
      to: solicitante.email,
      subject: `✅ [RESUELTO] Solución aplicada al ticket ${ticket.codigo_correlativo}`,
      html,
    });
  }

  // ===========================================================================
  // 4. NOTIFICACIÓN DE REAPERTURA DE TICKET
  // ===========================================================================
  static async notificarReaperturaTicket(ticket: any, tecnico: any, solicitante: any, motivo: string): Promise<void> {
    const ticketUrl = `${env.APP_URL}`;

    const html = this.renderEmailTemplate({
      headerTitle: '⚠️ Ticket Reabierto por el Solicitante',
      headerSubtitle: 'Alerta de Reapertura ITIL',
      contentHtml: `
        <p style="font-size: 13px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
          El usuario solicitante ha reabierto el ticket <strong>${ticket.codigo_correlativo}</strong> indicando que el problema persiste:
        </p>

        <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 14px; padding: 18px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #9f1239;">
            Motivo indicado por ${solicitante.nombres} ${solicitante.apellidos}:
          </p>
          <p style="margin: 0; font-size: 13px; color: #881337; font-style: italic;">
            "${motivo}"
          </p>
        </div>
      `,
      buttonText: 'Revisar Ticket Reabierto',
      buttonUrl: ticketUrl,
    });

    const recipients = [env.MESA_AYUDA_EMAIL];
    if (tecnico && tecnico.email) recipients.push(tecnico.email);

    await Promise.allSettled(
      recipients.map((email) =>
        this.sendMail({
          to: email,
          subject: `⚠️ [REABIERTO] Ticket ${ticket.codigo_correlativo} - ${ticket.titulo}`,
          html,
        })
      )
    );
  }

  // ===========================================================================
  // 5. NOTIFICACIÓN DE TICKET OBSERVADO (Aclaración requerida)
  // ===========================================================================
  static async notificarObservacionTicket(ticket: any, solicitante: any, observador: any, justificacion: string): Promise<void> {
    const ticketUrl = `${env.APP_URL}`;

    const htmlSolicitante = this.renderEmailTemplate({
      headerTitle: `Atención: Tu requerimiento requiere aclaración`,
      headerSubtitle: 'Observación por Mesa de Ayuda OTIC',
      contentHtml: `
        <p style="font-size: 13px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
          Estimado(a) <strong>${solicitante.nombres} ${solicitante.apellidos}</strong>, tu requerimiento <strong>${ticket.codigo_correlativo}</strong> ha sido <strong>OBSERVADO</strong> por el equipo de Mesa de Ayuda antes de proceder con la asignación técnica.
        </p>

        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px 0; color: #b45309; font-size: 14px; font-weight: 800;">
            ⚠️ Motivo de la Observación:
          </h4>
          <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #78350f; white-space: pre-wrap;">${justificacion}</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <table width="100%" style="font-size: 13px;">
            <tr>
              <td style="color: #64748b; padding-bottom: 6px; width: 35%;">Código Ticket:</td>
              <td style="font-weight: 800; color: #0f172a; font-family: monospace;">${ticket.codigo_correlativo}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding-bottom: 6px;">Asunto:</td>
              <td style="font-weight: 700; color: #0f172a;">${ticket.titulo}</td>
            </tr>
            <tr>
              <td style="color: #64748b;">Observado por:</td>
              <td style="font-weight: 600; color: #334155;">${observador.nombres} ${observador.apellidos} (Mesa de Ayuda)</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.5;">
          Por favor ingresa al sistema y abre el detalle de tu requerimiento en la pestaña <strong>Observados</strong> para responder a la consulta y adjuntar la información requerida, permitiendo continuar con la atención.
        </p>
      `,
      buttonText: 'Ver y Responder Observación',
      buttonUrl: ticketUrl,
    });

    await this.sendMail({
      to: solicitante.email,
      subject: `⚠️ [TICKET OBSERVADO] ${ticket.codigo_correlativo} - Se requiere aclaración para continuar atención`,
      html: htmlSolicitante,
    });
  }

  // ===========================================================================
  // 6. SOLICITUD DE CREACIÓN DE USUARIO EN DIRECTORIO ACTIVO (ÁREA DE REDES)
  // ===========================================================================
  static async notificarSolicitudCreacionUsuarioAD(data: {
    nombreCompleto: string;
    dni: string;
    condicion: string;
    email: string;
    facultadDependencia: string;
    celular: string;
    anexo?: string;
  }): Promise<void> {
    const destinoRedes = 'redes@lamolina.edu.pe';
    const fechaHora = new Date().toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      dateStyle: 'full',
      timeStyle: 'medium',
    });

    const htmlRedes = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #064e3b 0%, #047857 50%, #0284c7 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
              <span style="background-color: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; display: inline-block; margin-bottom: 8px;">
                Directorio Activo • Gestión de Identidades UNALM
              </span>
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">
                Solicitud de Alta de Usuario en Dominio
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 12px; opacity: 0.95; font-weight: 500;">
                Mesa de Ayuda OTIC — Universidad Nacional Agraria La Molina
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #166534; font-weight: 600;">
                  📌 Estimado equipo de <strong>Redes y Telecomunicaciones (OTIC)</strong>:
                </p>
                <p style="margin: 4px 0 0 0; font-size: 12px; line-height: 1.6; color: #15803d;">
                  Se ha recibido una nueva solicitud de registro institucional mediante el portal de Mesa de Ayuda para la creación y habilitación de cuenta de usuario en el <strong>Directorio Activo (LDAP UNALM)</strong>.
                </p>
              </div>

              <h3 style="margin: 0 0 14px 0; font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                📋 Ficha Técnica del Solicitante
              </h3>

              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 0; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; margin-bottom: 24px;">
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #475569; width: 38%; border-bottom: 1px solid #e2e8f0;">
                    Nombres y Apellidos Completos:
                  </td>
                  <td style="padding: 12px 16px; font-size: 13px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0;">
                    ${data.nombreCompleto}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0;">
                    DNI / Documento de Identidad:
                  </td>
                  <td style="padding: 12px 16px; font-size: 13px; font-weight: 800; color: #0f172a; font-family: monospace; border-bottom: 1px solid #e2e8f0;">
                    ${data.dni}
                  </td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0;">
                    Condición de Contrato / Vínculo:
                  </td>
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #0369a1; border-bottom: 1px solid #e2e8f0;">
                    <span style="background-color: #e0f2fe; padding: 3px 10px; border-radius: 12px; border: 1px solid #bae6fd;">
                      ${data.condicion}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0;">
                    Correo Institucional UNALM:
                  </td>
                  <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #15803d; font-family: monospace; border-bottom: 1px solid #e2e8f0;">
                    ${data.email}
                  </td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0;">
                    Facultad, Dependencia u Orgánica:
                  </td>
                  <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">
                    ${data.facultadDependencia}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0;">
                    Celular de Contacto:
                  </td>
                  <td style="padding: 12px 16px; font-size: 13px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0;">
                    📱 ${data.celular}
                  </td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0;">
                    Anexo Telefónico:
                  </td>
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #334155; border-bottom: 1px solid #e2e8f0;">
                    ${data.anexo ? `☎️ Anexo ${data.anexo}` : '— (No especificado)'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #475569;">
                    Fecha y Hora de la Solicitud:
                  </td>
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #64748b;">
                    🕒 ${fechaHora}
                  </td>
                </tr>
              </table>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; font-size: 12px; color: #64748b; line-height: 1.5;">
                <strong style="color: #0f172a;">Próximo paso técnico:</strong> Proceder a la creación de la cuenta en el Controlador de Dominio (OU correspondiente según la dependencia informada) y notificar los accesos iniciales al usuario solicitante a su correo institucional o de contacto.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
              <p style="margin: 0; font-weight: 700; color: #334155;">Oficina de Tecnologías de la Información y Comunicación (OTIC)</p>
              <p style="margin: 4px 0 0 0;">Universidad Nacional Agraria La Molina • Mesa de Ayuda In-House</p>
              <p style="margin: 8px 0 0 0; font-size: 10px; color: #94a3b8;">Notificación automática del Sistema de Mesa de Ayuda UNALM generada por solicitud web pública.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // 1. Envío al correo oficial de Redes
    await this.sendMail({
      to: destinoRedes,
      subject: `🔔 [SOLICITUD DE ALTA AD] ${data.nombreCompleto} - DNI ${data.dni} (${data.condicion})`,
      html: htmlRedes,
    });

    // 2. Envío de confirmación formal al usuario solicitante
    if (data.email && data.email.includes('@')) {
      const htmlUsuario = this.renderEmailTemplate({
        headerTitle: 'Hemos recibido tu Solicitud de Registro en Directorio Activo',
        headerSubtitle: 'Confirmación de Solicitud de Cuenta UNALM',
        contentHtml: `
          <p style="font-size: 13px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
            Estimado(a) <strong>${data.nombreCompleto}</strong>:
          </p>
          <p style="font-size: 13px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
            Tu solicitud de registro para la creación de cuenta en el <strong>Directorio Activo de la UNALM</strong> ha sido enviada exitosamente al Área de <strong>Redes y Telecomunicaciones (${destinoRedes})</strong>.
          </p>

          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <table width="100%" style="font-size: 12px;">
              <tr>
                <td style="color: #64748b; padding-bottom: 4px; width: 40%;">DNI:</td>
                <td style="font-weight: 700; color: #0f172a;">${data.dni}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding-bottom: 4px;">Condición:</td>
                <td style="font-weight: 700; color: #0f172a;">${data.condicion}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding-bottom: 4px;">Dependencia:</td>
                <td style="font-weight: 700; color: #0f172a;">${data.facultadDependencia}</td>
              </tr>
              <tr>
                <td style="color: #64748b;">Celular:</td>
                <td style="font-weight: 700; color: #0f172a;">${data.celular}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 12px; color: #64748b; line-height: 1.6; margin: 0;">
            El equipo técnico validará tu información y te remitirá tus credenciales y contraseña de acceso institucional por este medio. Una vez creada tu cuenta en el Directorio Activo, podrás ingresar a la Mesa de Ayuda directamente con tu usuario y contraseña institucional.
          </p>
        `,
      });

      await this.sendMail({
        to: data.email,
        subject: `📨 Confirmación de Solicitud de Cuenta en Directorio Activo - Mesa de Ayuda UNALM`,
        html: htmlUsuario,
      });
    }
  }
}
