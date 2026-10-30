import { Client } from 'ldapts';
import { env } from '../config/env';

export interface LdapUserProfile {
  username: string;
  email: string;
  nombres: string;
  apellidos: string;
  displayName: string;
  facultadDependencia?: string;
  cargo?: string;
  telefono?: string;
  anexo?: string;
  groups?: string[];
  dn?: string;
}

export interface LdapAuthResult {
  success: boolean;
  configured?: boolean;
  message?: string;
  user?: LdapUserProfile;
  code?: string;
}

export class LdapService {
  /**
   * Obtiene el estado actual de configuración de Directorio Activo (LDAP)
   */
  static getStatus() {
    const isConfigured = Boolean(env.LDAP_ENABLED && env.LDAP_URL && env.LDAP_URL.trim() !== '');
    return {
      enabled: env.LDAP_ENABLED,
      configured: isConfigured,
      ldapUrl: env.LDAP_URL || 'No configurada (Pendiente de IP/Hostname de Redes)',
      baseDn: env.LDAP_BASE_DN,
      domain: env.LDAP_DOMAIN,
      hasBindUser: Boolean(env.LDAP_BIND_DN && env.LDAP_BIND_DN.trim() !== ''),
      bindDn: env.LDAP_BIND_DN ? env.LDAP_BIND_DN.replace(/:.+@/, ':***@') : 'No configurado (Modo directo / Pendiente)',
      timeoutMs: env.LDAP_TIMEOUT_MS,
      statusMessage: isConfigured
        ? 'Servicio LDAP configurado para el dominio ' + env.LDAP_DOMAIN
        : 'Pendiente de información del Administrador de Red (IP de Domain Controller, Usuario de Servicio y Puerto)',
    };
  }

  /**
   * Autentica un usuario contra el Directorio Activo (Active Directory / LDAP) de la UNALM
   * @param rawUsername Usuario ingresado (ej: 'jperez', 'jperez@lamolina.edu.pe' o 'LAMOLINA\\jperez')
   * @param password Contraseña de dominio
   */
  static async authenticate(rawUsername: string, password: string): Promise<LdapAuthResult> {
    if (!env.LDAP_ENABLED) {
      return {
        success: false,
        configured: false,
        message: 'La autenticación mediante Directorio Activo (LDAP) está deshabilitada en el servidor.',
      };
    }

    if (!env.LDAP_URL || env.LDAP_URL.trim() === '') {
      return {
        success: false,
        configured: false,
        message:
          'El servicio de Directorio Activo (LDAP) aún no tiene asignada la IP o URL del servidor de dominio de la UNALM. Por favor solicite los datos de conexión (IP, puerto y usuario de servicio) al Administrador de Redes.',
      };
    }

    if (!rawUsername || !password) {
      return {
        success: false,
        message: 'Debe ingresar su usuario institucional y su contraseña de dominio.',
      };
    }

    // Normalizar usuario
    let sAMAccountName = rawUsername.trim();
    if (sAMAccountName.includes('@')) {
      sAMAccountName = sAMAccountName.split('@')[0];
    } else if (sAMAccountName.includes('\\')) {
      sAMAccountName = sAMAccountName.split('\\')[1];
    }

    const domain = env.LDAP_DOMAIN || 'lamolina.edu.pe';
    const userPrincipalName = `${sAMAccountName}@${domain}`;

    // Determinar URL de conexión: Si es ldap://389 o ldaps://636
    const urlsToTry = [env.LDAP_URL];
    if (env.LDAP_URL.includes(':389') || env.LDAP_URL.startsWith('ldap://')) {
      // Agregar opción LDAPS 636 como fallback automático si el DC requiere cifrado de integridad
      const ldapsUrl = env.LDAP_URL.replace('ldap://', 'ldaps://').replace(':389', ':636');
      if (!urlsToTry.includes(ldapsUrl)) {
        urlsToTry.push(ldapsUrl);
      }
    } else if (env.LDAP_URL.includes(':636') || env.LDAP_URL.startsWith('ldaps://')) {
      const ldapUrl = env.LDAP_URL.replace('ldaps://', 'ldap://').replace(':636', ':389');
      if (!urlsToTry.includes(ldapUrl)) {
        urlsToTry.push(ldapUrl);
      }
    }

    let lastError: any = null;

    for (const currentUrl of urlsToTry) {
      try {
        const client = new Client({
          url: currentUrl,
          timeout: env.LDAP_TIMEOUT_MS,
          connectTimeout: env.LDAP_TIMEOUT_MS,
          strictDN: false,
          tlsOptions: {
            rejectUnauthorized: false,
          },
        });

        // ESTRATEGIA 1: Si hay cuenta de servicio (Service Account Bind) configurada
        if (env.LDAP_BIND_DN && env.LDAP_BIND_PASSWORD) {
          const bindUsersToTry = [env.LDAP_BIND_DN];
          if (!env.LDAP_BIND_DN.includes('@') && !env.LDAP_BIND_DN.includes('=')) {
            bindUsersToTry.unshift(`${env.LDAP_BIND_DN}@${domain}`);
          }

          let bindOk = false;
          let bindErrMessage = '';

          for (const bUser of bindUsersToTry) {
            try {
              await client.bind(bUser, env.LDAP_BIND_PASSWORD);
              bindOk = true;
              break;
            } catch (err: any) {
              bindErrMessage = err.message;
            }
          }

          if (!bindOk) {
            console.error(`[LDAP] Error al conectar con la cuenta de servicio en ${currentUrl}:`, bindErrMessage);
            // Si el error es de integridad SSL, continuar al siguiente URL (ej. LDAPS)
            if (bindErrMessage.includes('integrity checking') || bindErrMessage.includes('0x8')) {
              continue;
            }
            return {
              success: false,
              message: `Error al autenticar la cuenta de servicio con el Directorio Activo (${currentUrl}): ${bindErrMessage}.`,
            };
          }

          // Búsqueda del usuario en el árbol LDAP
          const searchFilter = `(&(objectCategory=person)(objectClass=user)(|(sAMAccountName=${sAMAccountName})(userPrincipalName=${userPrincipalName})(mail=${rawUsername.trim()})))`;
          
          let searchResult;
          try {
            searchResult = await client.search(env.LDAP_BASE_DN, {
              scope: 'sub',
              filter: searchFilter,
              attributes: [
                'dn',
                'sAMAccountName',
                'userPrincipalName',
                'mail',
                'displayName',
                'givenName',
                'sn',
                'department',
                'physicalDeliveryOfficeName',
                'company',
                'description',
                'title',
                'telephoneNumber',
                'mobile',
                'ipPhone',
                'otherTelephone',
                'homePhone',
                'pager',
                'memberOf',
              ],
            });
          } catch (searchErr: any) {
            console.error('[LDAP] Error en búsqueda de usuario:', searchErr.message);
            return {
              success: false,
              message: `Error al consultar el Directorio Activo: ${searchErr.message}`,
            };
          } finally {
            try {
              await client.unbind();
            } catch {
              // Silenciar error en unbind
            }
          }

          if (!searchResult || !searchResult.searchEntries || searchResult.searchEntries.length === 0) {
            return {
              success: false,
              message: `El usuario "${sAMAccountName}" no fue encontrado en el Directorio Activo institucional (${domain}).`,
            };
          }

          const userEntry: any = searchResult.searchEntries[0];
          const userDN = userEntry.dn;
          const upnToBind = userEntry.userPrincipalName || userPrincipalName;

          // Validar contraseña del usuario haciendo bind
          const userClient = new Client({
            url: currentUrl,
            timeout: env.LDAP_TIMEOUT_MS,
            connectTimeout: env.LDAP_TIMEOUT_MS,
            strictDN: false,
            tlsOptions: { rejectUnauthorized: false },
          });

          let userAuthSuccess = false;
          let authErrorMessage = '';

          // Probar autenticación por DN y luego por UPN
          for (const userIdent of [userDN, upnToBind]) {
            if (!userIdent) continue;
            try {
              await userClient.bind(userIdent, password);
              userAuthSuccess = true;
              break;
            } catch (authErr: any) {
              authErrorMessage = authErr.message;
            }
          }

          try {
            await userClient.unbind();
          } catch {
            // Silenciar
          }

          if (!userAuthSuccess) {
            console.warn('[LDAP] Autenticación fallida para usuario:', sAMAccountName, authErrorMessage);
            return {
              success: false,
              code: 'INVALID_CREDENTIALS',
              message: 'Contraseña de dominio incorrecta. Verifique sus credenciales institucionales de la UNALM.',
            };
          }

          // Extraer datos del perfil institucional
          const profile = this.extractUserProfile(userEntry, sAMAccountName, domain);
          return {
            success: true,
            user: profile,
          };
        }

        // ESTRATEGIA 2: Direct Bind (Sin cuenta de servicio, bind directo con userPrincipalName)
        try {
          await client.bind(userPrincipalName, password);
        } catch (directBindErr: any) {
          console.warn('[LDAP] Direct bind falló para:', userPrincipalName, directBindErr.message);
          return {
            success: false,
            code: 'INVALID_CREDENTIALS',
            message: 'Credenciales inválidas en Directorio Activo. Verifique su usuario o contraseña institucional.',
          };
        }

        let userEntry: any = null;
        try {
          const searchFilter = `(&(objectCategory=person)(objectClass=user)(|(sAMAccountName=${sAMAccountName})(userPrincipalName=${userPrincipalName})))`;
          const searchResult = await client.search(env.LDAP_BASE_DN, {
            scope: 'sub',
            filter: searchFilter,
            attributes: [
              'dn',
              'sAMAccountName',
              'userPrincipalName',
              'mail',
              'displayName',
              'givenName',
              'sn',
              'department',
              'physicalDeliveryOfficeName',
              'company',
              'description',
              'title',
              'telephoneNumber',
              'mobile',
              'ipPhone',
              'otherTelephone',
              'homePhone',
              'pager',
              'memberOf',
            ],
          });
          if (searchResult && searchResult.searchEntries.length > 0) {
            userEntry = searchResult.searchEntries[0];
          }
        } catch (err: any) {
          console.warn('[LDAP] Advertencia al buscar atributos tras bind directo:', err.message);
        } finally {
          try {
            await client.unbind();
          } catch {
            // Silenciar
          }
        }

        const profile = userEntry
          ? this.extractUserProfile(userEntry, sAMAccountName, domain)
          : {
              username: sAMAccountName,
              email: userPrincipalName.toLowerCase(),
              nombres: sAMAccountName,
              apellidos: '-',
              displayName: sAMAccountName,
              facultadDependencia: 'Comunidad Universitaria UNALM',
              cargo: 'Usuario Institucional',
            };

        return {
          success: true,
          user: profile,
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`[LDAP] Intento de conexión con ${currentUrl} falló:`, err.message);
      }
    }

    console.error('[LDAP] Error general en el servicio LDAP tras probar URLs:', lastError);
    const isConnectionError =
      lastError?.code === 'ECONNREFUSED' ||
      lastError?.code === 'ETIMEDOUT' ||
      lastError?.code === 'ENOTFOUND' ||
      (lastError?.message && lastError.message.toLowerCase().includes('timeout'));

    if (isConnectionError) {
      return {
        success: false,
        message: `No se pudo establecer conexión con el Controlador de Dominio de Active Directory (${env.LDAP_URL}). Verifique que la IP y el puerto LDAP estén accesibles desde el servidor de Mesa de Ayuda.`,
      };
    }

    return {
      success: false,
      message: lastError?.message || 'Error inesperado durante la autenticación con Directorio Activo.',
    };
  }

  /**
   * Extrae y normaliza los atributos del objeto LDAP devuelto por Active Directory
   */
  private static extractUserProfile(entry: any, defaultUsername: string, domain: string): LdapUserProfile {
    const getAttr = (val: any): string => {
      if (!val) return '';
      if (Array.isArray(val)) {
        return val.length > 0 ? (val[0] || '').toString().trim() : '';
      }
      return val.toString().trim();
    };

    const sAMAccountName = getAttr(entry.sAMAccountName) || defaultUsername;
    let mail = getAttr(entry.mail) || getAttr(entry.userPrincipalName);
    if (!mail) {
      mail = `${sAMAccountName}@${domain}`;
    }
    mail = mail.toLowerCase();

    let givenName = getAttr(entry.givenName);
    let sn = getAttr(entry.sn);
    let displayName = getAttr(entry.displayName);

    if (!givenName && displayName) {
      const parts = displayName.split(/\s+/);
      givenName = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0];
      if (!sn && parts.length > 1) {
        sn = parts[parts.length - 1];
      }
    }

    if (!givenName) {
      givenName = sAMAccountName;
    }

    let department =
      getAttr(entry.department) ||
      getAttr(entry.physicalDeliveryOfficeName) ||
      getAttr(entry.company);

    if (!department && entry.dn) {
      const ouMatches = String(entry.dn).match(/OU=([^,]+)/g);
      if (ouMatches && ouMatches.length > 0) {
        const cleanedOUs = ouMatches
          .map((m: string) => m.replace('OU=', ''))
          .filter((ou: string) => ou !== 'UNALM' && ou !== 'UNALM Servicios');
        department = cleanedOUs.length > 0
          ? cleanedOUs.reverse().join(' - ')
          : ouMatches.map((m: string) => m.replace('OU=', '')).reverse().join(' - ');
      }
    }

    if (!department) {
      department = 'Comunidad Universitaria UNALM';
    }

    const cargo = getAttr(entry.title) || getAttr(entry.description) || 'Personal Institucional';

    const rawMobile = getAttr(entry.mobile);
    const rawTel = getAttr(entry.telephoneNumber);
    const rawIp = getAttr(entry.ipPhone);
    const rawOther = getAttr(entry.otherTelephone);
    const rawHome = getAttr(entry.homePhone);

    let telefono = '';
    let anexo = '';

    // Celular prioritario
    const allPhoneCandidates = [rawMobile, rawTel, rawHome, rawIp].filter(Boolean);
    for (const cand of allPhoneCandidates) {
      const digits = cand.replace(/\D/g, '');
      if (digits.length === 9 && digits.startsWith('9')) {
        telefono = digits;
        break;
      } else if (!telefono && digits.length >= 7) {
        telefono = cand;
      }
    }

    // Anexo: si hay otherTelephone o ipPhone corto (2 a 6 dígitos) o indicador de anexo
    if (rawOther && rawOther.replace(/\D/g, '').length >= 2 && rawOther.replace(/\D/g, '').length <= 6) {
      anexo = rawOther.replace(/\D/g, '');
    } else if (rawIp && rawIp.replace(/\D/g, '').length >= 2 && rawIp.replace(/\D/g, '').length <= 6) {
      anexo = rawIp.replace(/\D/g, '');
    } else if (rawTel) {
      const extMatch = rawTel.match(/(?:ext|anx|anexo|#)\.?\s*(\d{2,6})/i);
      if (extMatch) {
        anexo = extMatch[1];
      } else if (rawTel.replace(/\D/g, '').length >= 2 && rawTel.replace(/\D/g, '').length <= 5) {
        anexo = rawTel.replace(/\D/g, '');
      }
    }

    let groups: string[] = [];
    if (entry.memberOf) {
      if (Array.isArray(entry.memberOf)) {
        groups = entry.memberOf.map((g: any) => g.toString());
      } else {
        groups = [entry.memberOf.toString()];
      }
    }

    return {
      username: sAMAccountName,
      email: mail,
      nombres: givenName,
      apellidos: sn || '-',
      displayName: displayName || `${givenName} ${sn}`.trim(),
      facultadDependencia: department,
      cargo,
      telefono: telefono || undefined,
      anexo: anexo || undefined,
      groups,
      dn: entry.dn,
    };
  }
}
