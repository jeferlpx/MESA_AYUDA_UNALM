import React, { useState, useEffect, useMemo } from 'react';
import { api, getAssetUrl } from '../services/api';
import { UserAdmin } from '../types';
import { Modal } from '../components/Modal';
import { TechnicianProfileModal } from '../components/TechnicianProfileModal';
import { SearchableDependenciaSelect } from '../components/SearchableDependenciaSelect';
import { UNALM_DEPENDENCIAS_LIST } from '../data/unalmStructure';
import { useToast } from '../components/Toast';
import { validatePeruvianPhone, handlePhoneInputChange } from '../utils/phoneValidator';
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  Phone,
  Mail,
  Building2,
  RefreshCw,
  AlertCircle,
  UserCheck,
  Star,
  Camera,
  Upload,
  Network,
} from 'lucide-react';

const ROLES_INFO: Record<number, { codigo: string; nombre: string; color: string }> = {
  1: { codigo: 'ADMIN', nombre: 'Administrador General', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  2: { codigo: 'SUPERVISOR', nombre: 'Supervisor / Jefatura OTIC', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  3: { codigo: 'TECNICO', nombre: 'Especialista en Soporte Técnico', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  4: { codigo: 'SOLICITANTE', nombre: 'Usuario Solicitante (Comunidad UNALM)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  5: { codigo: 'MESA_AYUDA', nombre: 'Mesa de Ayuda OTIC (Triage)', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  6: { codigo: 'MESA_AYUDA_SG', nombre: 'Mesa de Ayuda Serv. Generales (Triage)', color: 'bg-amber-100 text-amber-900 border-amber-400' },
  7: { codigo: 'TECNICO_SG', nombre: 'Especialista Serv. Generales (ROF 2023)', color: 'bg-orange-100 text-orange-900 border-orange-300' },
  8: { codigo: 'SUPERVISOR_SG', nombre: 'Supervisor / Jefatura Serv. Generales', color: 'bg-rose-100 text-rose-900 border-rose-300' },
  9: { codigo: 'ESPECIALISTA_REDES', nombre: 'Especialista en Redes', color: 'bg-teal-100 text-teal-800 border-teal-300' },
  10: { codigo: 'ESPECIALISTA_DESARROLLO', nombre: 'Especialista en Desarrollo', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
};

const UNALM_DEPENDENCIAS = UNALM_DEPENDENCIAS_LIST;

export const AdminUsersPage: React.FC = () => {
  const toast = useToast();
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAdmin | null>(null);

  // Delete User Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserAdmin | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Create/Edit Form fields
  const [formNombres, setFormNombres] = useState('');
  const [formApellidos, setFormApellidos] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCargo, setFormCargo] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRolId, setFormRolId] = useState(3); // Default Técnico
  const [formRolesIds, setFormRolesIds] = useState<number[]>([3]);
  const [formDependencia, setFormDependencia] = useState(UNALM_DEPENDENCIAS[0]);
  const [formTelefono, setFormTelefono] = useState('');
  const [formAnexo, setFormAnexo] = useState('');
  const [formEstado, setFormEstado] = useState<'ACTIVO' | 'INACTIVO' | 'BLOQUEADO'>('ACTIVO');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const phoneValidation = useMemo(() => validatePeruvianPhone(formTelefono, false), [formTelefono]);

  // Technician history modal
  const [historyTechId, setHistoryTechId] = useState<number | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Password reset field
  const [newPassword, setNewPassword] = useState('');

  // User photo management in Edit Modal
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [removePhotoFlag, setRemovePhotoFlag] = useState<boolean>(false);

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [syncingLdap, setSyncingLdap] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExecuteSyncLdap = async () => {
    try {
      setSyncingLdap(true);
      const res = await api.syncLdapUsers();
      if (res.success) {
        toast.success(
          `Sincronización con Directorio Activo completada: Cuentas institucionales actualizadas exitosamente.`,
          'Directorio Activo UNALM'
        );
        setIsSyncModalOpen(false);
        loadUsers();
      } else {
        toast.error(res.message || 'Error en la sincronización con LDAP', 'Directorio Activo');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al conectar con el Directorio Activo', 'Error');
    } finally {
      setSyncingLdap(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (roleFilter) params.rolId = roleFilter;
      if (statusFilter) params.estado = statusFilter;

      const res = await api.getUsers(params);
      if (res.success) {
        setUsers(res.data);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(handler);
  }, [search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(users.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return users.slice(start, start + itemsPerPage);
  }, [users, currentPage, itemsPerPage]);

  const handleOpenCreateModal = () => {
    setSelectedUser(null);
    setFormNombres('');
    setFormApellidos('');
    setFormEmail('');
    setFormCargo('');
    setFormPassword('');
    setFormRolId(3);
    setFormRolesIds([3]);
    setFormDependencia('OTIC - Soporte Técnico');
    setFormTelefono('');
    setFormAnexo('');
    setFormEstado('ACTIVO');
    setEditPhotoFile(null);
    setEditPhotoPreview(null);
    setRemovePhotoFlag(false);
    setErrorMsg(null);
    setIsCreateModalOpen(true);
  };

  const handleToggleRoleSelection = (rid: number) => {
    setFormRolesIds((prev) => {
      let next: number[];
      if (prev.includes(rid)) {
        if (prev.length <= 1) return prev;
        next = prev.filter((id) => id !== rid);
        if (formRolId === rid && next.length > 0) {
          setFormRolId(next[0]);
        }
      } else {
        next = [...prev, rid];
      }
      return next;
    });
  };

  const handleOpenEditModal = (user: UserAdmin) => {
    setSelectedUser(user);
    setFormNombres(user.nombres);
    setFormApellidos(user.apellidos);
    setFormEmail(user.email);
    setFormCargo(user.cargo || '');
    const roleMapping: Record<string, number> = {
      ADMIN: 1,
      SUPERVISOR: 2,
      TECNICO: 3,
      SOLICITANTE: 4,
      MESA_AYUDA: 5,
      MESA_AYUDA_SG: 6,
      TECNICO_SG: 7,
      SUPERVISOR_SG: 8,
      ESPECIALISTA_REDES: 9,
      ESPECIALISTA_DESARROLLO: 10,
    };
    const primaryRid = user.rolId || roleMapping[user.rol] || 3;
    setFormRolId(primaryRid);
    const userRoleIds: number[] = user.rolesIds && user.rolesIds.length > 0
      ? user.rolesIds
      : [primaryRid];
    setFormRolesIds(userRoleIds.length > 0 ? userRoleIds : [primaryRid]);
    setFormDependencia(user.facultadDependencia);
    setFormTelefono(user.telefono || '');
    setFormAnexo(user.anexo || '');
    setFormEstado(user.estado || 'ACTIVO');
    setEditPhotoFile(null);
    setEditPhotoPreview(user.fotoPerfil ? getAssetUrl(user.fotoPerfil) : null);
    setRemovePhotoFlag(false);
    setErrorMsg(null);
    setIsEditModalOpen(true);
  };

  const handleOpenPasswordModal = (user: UserAdmin) => {
    setSelectedUser(user);
    setNewPassword('');
    setErrorMsg(null);
    setIsPasswordModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formEmail.toLowerCase().endsWith('@lamolina.edu.pe')) {
      setErrorMsg('El correo debe pertenecer al dominio @lamolina.edu.pe');
      return;
    }

    if (formPassword.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formTelefono.trim().length > 0 && !phoneValidation.isValid) {
      setErrorMsg(phoneValidation.error || 'Número de celular inválido (MTC Perú: 9 dígitos comenzando con 9)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createUser({
        nombres: formNombres,
        apellidos: formApellidos,
        email: formEmail,
        password: formPassword,
        rolId: formRolId,
        rolesIds: formRolesIds.includes(formRolId) ? formRolesIds : [...formRolesIds, formRolId],
        facultadDependencia: formDependencia,
        cargo: formCargo,
        telefono: phoneValidation.cleanNumber || formTelefono.trim(),
        anexo: formAnexo,
      });

      if (res.success) {
        setIsCreateModalOpen(false);
        toast.success(`Usuario ${formNombres} ${formApellidos} registrado exitosamente.`, 'Usuario Creado');
        await loadUsers();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear usuario');
      toast.error(err.message || 'Error al crear usuario', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setErrorMsg(null);

    if (formTelefono.trim().length > 0 && !phoneValidation.isValid) {
      setErrorMsg(phoneValidation.error || 'Número de celular inválido (MTC Perú: 9 dígitos comenzando con 9)');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Process photo update or removal if changed
      if (editPhotoFile) {
        const formData = new FormData();
        formData.append('file', editPhotoFile);
        await api.updateUserPhotoByAdmin(selectedUser.id, formData);
      } else if (removePhotoFlag) {
        await api.removeUserPhotoByAdmin(selectedUser.id);
      }

      // 2. Process user profile data update
      const res = await api.updateUser(selectedUser.id, {
        nombres: formNombres,
        apellidos: formApellidos,
        email: formEmail,
        rolId: formRolId,
        rolesIds: formRolesIds.includes(formRolId) ? formRolesIds : [...formRolesIds, formRolId],
        facultadDependencia: formDependencia,
        cargo: formCargo,
        telefono: phoneValidation.cleanNumber || formTelefono.trim(),
        anexo: formAnexo,
        estado: formEstado,
      });

      if (res.success) {
        setIsEditModalOpen(false);
        toast.success('Datos del usuario y foto actualizados correctamente.', 'Perfil Guardado');
        await loadUsers();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar usuario');
      toast.error(err.message || 'Error al actualizar usuario', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (newPassword.length < 6) {
      setErrorMsg('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.updateUserPassword(selectedUser.id, newPassword);
      if (res.success) {
        setIsPasswordModalOpen(false);
        toast.success(`Contraseña restablecida con éxito para ${selectedUser.nombres}.`, 'Contraseña Actualizada');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cambiar contraseña');
      toast.error(err.message || 'Error al cambiar contraseña', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (user: UserAdmin) => {
    const nuevoEstado = user.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      const res = await api.updateUser(user.id, {
        nombres: user.nombres,
        apellidos: user.apellidos,
        email: user.email,
        rolId: user.rolId,
        facultadDependencia: user.facultadDependencia,
        estado: nuevoEstado,
      });

      if (res.success) {
        toast.success(`Usuario ${user.nombres} ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'} correctamente.`);
        await loadUsers();
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar estado del usuario');
    }
  };

  const handleOpenDeleteModal = (u: UserAdmin) => {
    setUserToDelete(u);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setDeletingUser(true);
      const res = await api.deleteUser(userToDelete.id);
      if (res.success) {
        toast.success(
          `El usuario ${userToDelete.nombres} ${userToDelete.apellidos} (${userToDelete.email}) fue eliminado permanentemente de la base de datos.`,
          'Usuario Eliminado'
        );
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
        await loadUsers();
      } else {
        toast.error(res.message || 'No se pudo eliminar el usuario.', 'Error');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar el usuario de la base de datos.', 'Error');
    } finally {
      setDeletingUser(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1700px] min-w-0 mx-auto px-3 sm:px-6 py-4 sm:py-6 overflow-hidden">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Users className="w-6 h-6 text-unalm-600" />
            <span>Gestión de Usuarios y Personal Técnico (CRUD)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Administración de cuentas institucionales, asignación de roles y control de accesos OTIC y Servicios Generales (ROF 2023).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setIsSyncModalOpen(true)}
            disabled={syncingLdap}
            className="px-4 py-3 bg-sky-700 hover:bg-sky-800 text-white rounded-2xl text-xs font-extrabold shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            title="Importar y sincronizar usuarios en tiempo real desde el Directorio Activo (172.16.0.8)"
          >
            {syncingLdap ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Network className="w-4 h-4 text-sky-200" />
            )}
            <span>{syncingLdap ? 'Sincronizando AD...' : 'Sincronizar Directorio Activo'}</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-3 bg-unalm-600 hover:bg-unalm-700 text-white rounded-2xl text-xs font-extrabold shadow-md transition-all flex items-center space-x-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
            placeholder="Buscar por nombre, correo, dependencia..."
            className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-unalm-500 focus:outline-none font-medium"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 font-bold focus:ring-2 focus:ring-unalm-500 focus:outline-none"
        >
          <option value="">Todos los Roles</option>
          <option value="1">Administrador General</option>
          <option value="5">Mesa de Ayuda OTIC (Triage)</option>
          <option value="3">Especialista en Soporte Técnico</option>
          <option value="9">Especialista en Redes</option>
          <option value="10">Especialista en Desarrollo</option>
          <option value="2">Supervisor OTIC</option>
          <option value="6">Mesa de Ayuda Serv. Generales (Triage)</option>
          <option value="7">Especialista Serv. Generales (ROF 2023)</option>
          <option value="8">Supervisor Serv. Generales</option>
          <option value="4">Usuario Solicitante UNALM</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 font-bold focus:ring-2 focus:ring-unalm-500 focus:outline-none"
        >
          <option value="">Todos los Estados</option>
          <option value="ACTIVO">Activos</option>
          <option value="INACTIVO">Inactivos</option>
          <option value="BLOQUEADO">Bloqueados</option>
        </select>

        <div className="flex space-x-2">
          <button
            onClick={loadUsers}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-extrabold transition-colors shadow-xs"
          >
            Buscar
          </button>
          <button
            onClick={loadUsers}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-300 transition-colors"
            title="Refrescar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Users High-Efficiency Table / Cards Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1040px]">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3.5 px-4 w-[20%]">USUARIO / NOMBRES</th>
                <th className="py-3.5 px-3 w-[15%]">CARGO / CONDICIÓN</th>
                <th className="py-3.5 px-4 w-[16%]">CORREO INSTITUCIONAL</th>
                <th className="py-3.5 px-3 w-[14%]">ROL EN EL SISTEMA</th>
                <th className="py-3.5 px-4 w-[18%]">FACULTAD O DEPENDENCIA UNALM</th>
                <th className="py-3.5 px-3 w-[10%]">CELULAR / ANEXO</th>
                <th className="py-3.5 px-2 w-[7%] text-center">ESTADO</th>
                <th className="py-3.5 px-3 w-[9%] text-right sticky right-0 bg-slate-100/90 backdrop-blur-xs shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.05)]">
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No se encontraron usuarios con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const roleBadge = ROLES_INFO[u.rolId] || ROLES_INFO[4];
                  const isTech = ['TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'TECNICO_SG'].includes(u.rol);
                  const isEmailMissing = u.email.toLowerCase().startsWith('sin_correo_') || u.correoPendiente || u.email === '#N/D';
                  const isDependenciaMissing = !u.facultadDependencia || u.facultadDependencia.trim() === '#N/D';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center space-x-3">
                          {u.fotoPerfil ? (
                            <img
                              src={getAssetUrl(u.fotoPerfil)}
                              alt={u.nombres}
                              className="w-8 h-8 rounded-full object-cover border border-amber-300 shadow-xs cursor-pointer shrink-0"
                              onClick={() => {
                                if (isTech) {
                                  setHistoryTechId(u.id);
                                  setIsHistoryModalOpen(true);
                                }
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-unalm-100 text-unalm-700 font-extrabold flex items-center justify-center text-xs border border-unalm-200 shrink-0">
                              {u.nombres.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="block truncate font-bold text-slate-900">{u.nombres} {u.apellidos}</span>
                            {isTech && (
                              <button
                                onClick={() => {
                                  setHistoryTechId(u.id);
                                  setIsHistoryModalOpen(true);
                                }}
                                className="text-[10px] text-amber-700 hover:text-amber-800 font-extrabold flex items-center space-x-1 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded-md border border-amber-200 transition-colors mt-0.5"
                                title="Ver récord de atenciones y reseñas"
                              >
                                <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                <span>{u.promedioCalificacion || 5.0} ({u.totalCalificaciones || 0} reseñas)</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-slate-700 font-semibold text-[11px] block truncate" title={u.cargo}>
                          {u.cargo || '—'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {isEmailMissing ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                            #N/D (Sin Correo)
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono text-[11px] truncate block" title={u.email}>
                            {u.email}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {(() => {
                            const userRoleIds = u.rolesIds && u.rolesIds.length > 0 
                              ? u.rolesIds 
                              : [u.rolId || 4];
                            return userRoleIds.map((rid) => {
                              const rInfo = ROLES_INFO[rid] || ROLES_INFO[4];
                              const isPrimary = rid === u.rolId;
                              return (
                                <span
                                  key={rid}
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${rInfo.color} ${
                                    isPrimary ? 'ring-1 ring-slate-400/50 shadow-2xs font-black' : 'opacity-90'
                                  }`}
                                  title={isPrimary ? `${rInfo.nombre} (Rol Principal)` : rInfo.nombre}
                                >
                                  {rInfo.nombre.split(' (')[0]}
                                  {isPrimary && <span className="ml-1 text-[8px] text-amber-600 font-bold">★</span>}
                                </span>
                              );
                            });
                          })()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {isDependenciaMissing ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                            #N/D (Sin Dependencia)
                          </span>
                        ) : (
                          <span className="text-slate-600 truncate max-w-[200px] block" title={u.facultadDependencia}>
                            {u.facultadDependencia}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-xs whitespace-nowrap">
                        {u.telefono ? (
                          <div className="font-medium">
                            <span>{u.telefono}</span>
                            {u.anexo && <span className="text-[10px] text-slate-400 block font-mono">Anx: {u.anexo}</span>}
                          </div>
                        ) : u.anexo ? (
                          <span className="text-[10px] text-slate-400 font-mono">Anx: {u.anexo}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            u.estado === 'ACTIVO'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {u.estado}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50 transition-colors shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.05)]">
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="p-1.5 rounded-xl text-slate-600 hover:text-unalm-700 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                          title="Editar datos de usuario"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenPasswordModal(u)}
                          className="p-1.5 rounded-xl text-slate-600 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 transition-colors cursor-pointer"
                          title="Restablecer contraseña"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`p-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer ${
                            u.estado === 'ACTIVO'
                              ? 'text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'
                          }`}
                          title={u.estado === 'ACTIVO' ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          {u.estado === 'ACTIVO' ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(u)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                          title="Eliminar usuario definitivamente de la base de datos"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500 hover:text-rose-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (eliminates horizontal scrolling on mobile) */}
        <div className="block md:hidden p-3 space-y-3 bg-slate-50/50">
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              Cargando usuarios...
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              No se encontraron usuarios con los filtros aplicados.
            </div>
          ) : (
            paginatedUsers.map((u) => {
              const roleBadge = ROLES_INFO[u.rolId] || ROLES_INFO[4];
              const isTech = ['TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'TECNICO_SG'].includes(u.rol);
              const isEmailMissing = u.email.toLowerCase().startsWith('sin_correo_') || u.correoPendiente || u.email === '#N/D';
              const isDependenciaMissing = !u.facultadDependencia || u.facultadDependencia.trim() === '#N/D';

              return (
                <div key={u.id} className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center space-x-3 min-w-0">
                      {u.fotoPerfil ? (
                        <img
                          src={getAssetUrl(u.fotoPerfil)}
                          alt={u.nombres}
                          className="w-10 h-10 rounded-full object-cover border border-amber-300 shadow-xs shrink-0 cursor-pointer"
                          onClick={() => {
                            if (isTech) {
                              setHistoryTechId(u.id);
                              setIsHistoryModalOpen(true);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-unalm-100 text-unalm-700 font-extrabold flex items-center justify-center text-xs border border-unalm-200 shrink-0">
                          {u.nombres.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">
                          {u.nombres} {u.apellidos}
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium block truncate mt-0.5">
                          {u.cargo || 'Sin cargo especificado'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        u.estado === 'ACTIVO'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {u.estado}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {(() => {
                      const userRoleIds = u.rolesIds && u.rolesIds.length > 0 
                        ? u.rolesIds 
                        : [u.rolId || 4];
                      return userRoleIds.map((rid) => {
                        const rInfo = ROLES_INFO[rid] || ROLES_INFO[4];
                        const isPrimary = rid === u.rolId;
                        return (
                          <span
                            key={rid}
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${rInfo.color} ${
                              isPrimary ? 'ring-1 ring-slate-400/50 shadow-2xs font-black' : 'opacity-90'
                            }`}
                            title={isPrimary ? `${rInfo.nombre} (Rol Principal)` : rInfo.nombre}
                          >
                            {rInfo.nombre.split(' (')[0]}
                            {isPrimary && <span className="ml-1 text-[8px] text-amber-600 font-bold">★</span>}
                          </span>
                        );
                      });
                    })()}
                    {isTech && (
                      <button
                        onClick={() => {
                          setHistoryTechId(u.id);
                          setIsHistoryModalOpen(true);
                        }}
                        className="text-[10px] text-amber-700 hover:text-amber-800 font-extrabold flex items-center space-x-1 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 transition-colors"
                      >
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        <span>{u.promedioCalificacion || 5.0} ({u.totalCalificaciones || 0} reseñas)</span>
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2.5 space-y-1.5 text-xs text-slate-600 border border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 text-[11px] shrink-0">Correo:</span>
                      {isEmailMissing ? (
                        <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                          #N/D (Sin Correo)
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-slate-700 truncate">{u.email}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 text-[11px] shrink-0">Dependencia:</span>
                      {isDependenciaMissing ? (
                        <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                          #N/D (Sin Dep.)
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-700 truncate max-w-[200px]" title={u.facultadDependencia}>
                          {u.facultadDependencia}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 text-[11px] shrink-0">Contacto:</span>
                      <span className="text-[11px] font-medium text-slate-700">
                        {u.telefono || '—'} {u.anexo ? `(Anx: ${u.anexo})` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEditModal(u)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-unalm-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleOpenPasswordModal(u)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Clave</span>
                    </button>
                    <button
                      onClick={() => handleToggleUserStatus(u)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center space-x-1.5 cursor-pointer ${
                        u.estado === 'ACTIVO'
                          ? 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200'
                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                      }`}
                    >
                      {u.estado === 'ACTIVO' ? (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Desactivar</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Activar</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(u)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
                      title="Eliminar usuario definitivamente de la BD"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <span>Mostrar</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-unalm-500"
            >
              <option value={25}>25 por pág.</option>
              <option value={50}>50 por pág.</option>
              <option value={100}>100 por pág.</option>
              <option value={250}>250 por pág.</option>
            </select>
            <span>de <strong>{users.length}</strong> usuarios en total</span>
          </div>

          <div className="flex items-center space-x-1.5 font-bold">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-slate-700">
              Página {currentPage} de {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Registrar Nuevo Usuario / Técnico en el Sistema"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateUser} className="space-y-3.5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombres *</label>
              <input
                type="text"
                required
                value={formNombres}
                onChange={(e) => setFormNombres(e.target.value)}
                placeholder="Ej: Carlos"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Apellidos *</label>
              <input
                type="text"
                required
                value={formApellidos}
                onChange={(e) => setFormApellidos(e.target.value)}
                placeholder="Ej: Gutiérrez Soto"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Institucional *</label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="usuario@lamolina.edu.pe"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo / Tipo de Usuario</label>
              <input
                type="text"
                value={formCargo}
                onChange={(e) => setFormCargo(e.target.value)}
                placeholder="Ej: Docente Nombrado, CAS..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rol Principal *</label>
              <select
                value={formRolId}
                onChange={(e) => {
                  const newRid = Number(e.target.value);
                  setFormRolId(newRid);
                  if (!formRolesIds.includes(newRid)) {
                    setFormRolesIds((prev) => [...prev, newRid]);
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-semibold"
              >
                <option value={1}>Administrador General</option>
                <option value={5}>Mesa de Ayuda OTIC (Triage)</option>
                <option value={3}>Especialista en Soporte Técnico</option>
                <option value={9}>Especialista en Redes</option>
                <option value={10}>Especialista en Desarrollo</option>
                <option value={2}>Supervisor / Jefe OTIC</option>
                <option value={6}>Mesa de Ayuda Serv. Generales (Triage)</option>
                <option value={7}>Especialista Serv. Generales (ROF 2023)</option>
                <option value={8}>Supervisor Serv. Generales</option>
                <option value={4}>Usuario Solicitante UNALM</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Celular *</label>
                <span className="text-[10px] text-slate-400">9 dígitos (MTC)</span>
              </div>
              <div className="relative">
                <input
                  type="tel"
                  value={formTelefono}
                  onChange={(e) => setFormTelefono(handlePhoneInputChange(e.target.value))}
                  placeholder="Ej: 998 877 665"
                  maxLength={11}
                  className={`w-full px-3 py-2 pr-7 border rounded-xl text-xs transition-colors ${
                    formTelefono.trim().length === 0
                      ? 'border-slate-300'
                      : phoneValidation.isValid
                        ? 'border-emerald-500 bg-emerald-50/30 text-emerald-950'
                        : 'border-rose-400 bg-rose-50/30 text-rose-950'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                  {formTelefono.trim().length > 0 && (
                    phoneValidation.isValid ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    )
                  )}
                </div>
              </div>
              {formTelefono.trim().length > 0 && !phoneValidation.isValid && (
                <p className="text-[10px] text-rose-500 mt-0.5">{phoneValidation.error}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Anexo Telefónico *</label>
              <input
                type="text"
                value={formAnexo}
                onChange={(e) => setFormAnexo(e.target.value)}
                placeholder="Ej: 123"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <SearchableDependenciaSelect
              value={formDependencia}
              onChange={setFormDependencia}
              label="Facultad o Dependencia UNALM *"
              theme="light"
              required
            />
          </div>

          {/* Selector de Roles Múltiples (Multi-Rol RBAC) */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-unalm-600" />
                <span>Asignación de Roles Múltiples (Permisos Simultáneos)</span>
              </label>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                {formRolesIds.length} rol(es)
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Active los roles que el usuario podrá ejercer simultáneamente (ej. Mesa de Ayuda y Soporte Técnico):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              {Object.entries(ROLES_INFO).map(([idStr, rInfo]) => {
                const rid = Number(idStr);
                const isChecked = formRolesIds.includes(rid);
                const isPrimary = formRolId === rid;
                return (
                  <label
                    key={rid}
                    className={`flex items-center space-x-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-white border-unalm-500 shadow-2xs text-slate-900 font-semibold'
                        : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleRoleSelection(rid)}
                      className="rounded text-unalm-600 focus:ring-unalm-500 h-3.5 w-3.5 border-slate-300"
                    />
                    <span className="truncate flex-1">{rInfo.nombre.split(' (')[0]}</span>
                    {isPrimary && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-black border border-amber-300 shrink-0">
                        Principal
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña Inicial *</label>
            <input
              type="password"
              required
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-unalm-600 hover:bg-unalm-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT USER MODAL */}
      {selectedUser && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Editar Usuario: ${selectedUser.nombres} ${selectedUser.apellidos}`}
          maxWidth="lg"
        >
          <form onSubmit={handleUpdateUser} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Foto de Perfil del Usuario */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Foto de Perfil del Usuario
              </label>

              <div className="flex items-center space-x-4">
                <div className="relative shrink-0">
                  {editPhotoPreview ? (
                    <img
                      src={editPhotoPreview}
                      alt="Avatar"
                      className="w-14 h-14 rounded-full object-cover border-2 border-amber-400 shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-unalm-700 text-white font-extrabold text-lg flex items-center justify-center border-2 border-white shadow-sm">
                      {formNombres ? formNombres.slice(0, 2).toUpperCase() : 'US'}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <label className="cursor-pointer px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs inline-flex items-center space-x-1.5 transition-colors">
                      <Camera className="w-3.5 h-3.5 text-unalm-600" />
                      <span>{editPhotoPreview ? 'Cambiar Foto' : 'Subir Foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const f = e.target.files[0];
                            setEditPhotoFile(f);
                            setEditPhotoPreview(URL.createObjectURL(f));
                            setRemovePhotoFlag(false);
                          }
                        }}
                      />
                    </label>

                    {editPhotoPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditPhotoFile(null);
                          setEditPhotoPreview(null);
                          setRemovePhotoFlag(true);
                        }}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 inline-flex items-center space-x-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Quitar Foto</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Sube una foto JPG, PNG o WebP. Puedes cambiarla o eliminarla en cualquier momento.
                  </p>
                </div>
              </div>
            </div>

            {(selectedUser.correoPendiente || selectedUser.email.toLowerCase().startsWith('sin_correo_') || selectedUser.email === '#N/D') && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Usuario con Correo Pendiente (#N/D):</span>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Este usuario fue registrado sin correo institucional oficial. Ingrese a continuación su correo @lamolina.edu.pe para regularizar su cuenta.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombres *</label>
                <input
                  type="text"
                  required
                  value={formNombres}
                  onChange={(e) => setFormNombres(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Apellidos *</label>
                <input
                  type="text"
                  required
                  value={formApellidos}
                  onChange={(e) => setFormApellidos(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Institucional *</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo / Tipo de Usuario</label>
                <input
                  type="text"
                  value={formCargo}
                  onChange={(e) => setFormCargo(e.target.value)}
                  placeholder="Ej: Docente Nombrado, CAS, Administrativo..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rol Principal *</label>
                <select
                  value={formRolId}
                  onChange={(e) => {
                    const newRid = Number(e.target.value);
                    setFormRolId(newRid);
                    if (!formRolesIds.includes(newRid)) {
                      setFormRolesIds((prev) => [...prev, newRid]);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-semibold"
                >
                  <option value={1}>Administrador General</option>
                  <option value={5}>Mesa de Ayuda OTIC (Triage)</option>
                  <option value={3}>Especialista en Soporte Técnico</option>
                  <option value={9}>Especialista en Redes</option>
                  <option value={10}>Especialista en Desarrollo</option>
                  <option value={2}>Supervisor / Jefe OTIC</option>
                  <option value={6}>Mesa de Ayuda Serv. Generales (Triage)</option>
                  <option value={7}>Especialista Serv. Generales (ROF 2023)</option>
                  <option value={8}>Supervisor Serv. Generales</option>
                  <option value={4}>Usuario Solicitante UNALM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estado de Cuenta</label>
                <select
                  value={formEstado}
                  onChange={(e) => setFormEstado(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-bold"
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                  <option value="BLOQUEADO">BLOQUEADO</option>
                </select>
              </div>
            </div>

            {/* Selector de Roles Múltiples (Multi-Rol RBAC) */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 text-unalm-600" />
                  <span>Roles Asignados (Permisos Simultáneos Multi-Rol)</span>
                </label>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                  {formRolesIds.length} rol(es)
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Seleccione todos los roles que este usuario puede ejercer (ej. Mesa de Ayuda + Soporte Técnico):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {Object.entries(ROLES_INFO).map(([idStr, rInfo]) => {
                  const rid = Number(idStr);
                  const isChecked = formRolesIds.includes(rid);
                  const isPrimary = formRolId === rid;
                  return (
                    <label
                      key={rid}
                      className={`flex items-center space-x-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-white border-unalm-500 shadow-2xs text-slate-900 font-semibold'
                          : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleRoleSelection(rid)}
                        className="rounded text-unalm-600 focus:ring-unalm-500 h-3.5 w-3.5 border-slate-300"
                      />
                      <span className="truncate flex-1">{rInfo.nombre.split(' (')[0]}</span>
                      {isPrimary && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-black border border-amber-300 shrink-0">
                          Principal
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <SearchableDependenciaSelect
                value={formDependencia}
                onChange={setFormDependencia}
                label="Facultad o Dependencia UNALM *"
                theme="light"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Celular</label>
                  <span className="text-[10px] text-slate-400">9 dígitos (MTC)</span>
                </div>
                <div className="relative">
                  <input
                    type="tel"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(handlePhoneInputChange(e.target.value))}
                    placeholder="Ej: 998 877 665"
                    maxLength={11}
                    className={`w-full px-3 py-2 pr-7 border rounded-xl text-xs transition-colors ${
                      formTelefono.trim().length === 0
                        ? 'border-slate-300'
                        : phoneValidation.isValid
                          ? 'border-emerald-500 bg-emerald-50/30 text-emerald-950'
                          : 'border-rose-400 bg-rose-50/30 text-rose-950'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                    {formTelefono.trim().length > 0 && (
                      phoneValidation.isValid ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      )
                    )}
                  </div>
                </div>
                {formTelefono.trim().length > 0 && !phoneValidation.isValid && (
                  <p className="text-[10px] text-rose-500 mt-0.5">{phoneValidation.error}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Anexo</label>
                <input
                  type="text"
                  value={formAnexo}
                  onChange={(e) => setFormAnexo(e.target.value)}
                  placeholder="Ej: 123"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-unalm-600 hover:bg-unalm-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
              >
                {submitting ? 'Guardando...' : 'Actualizar Cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* RESET PASSWORD MODAL */}
      {selectedUser && (
        <Modal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          title={`Restablecer Contraseña: ${selectedUser.nombres}`}
          maxWidth="sm"
        >
          <form onSubmit={handleResetPassword} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nueva Contraseña *
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold"
              >
                {submitting ? 'Guardando...' : 'Cambiar Contraseña'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Technician Record & History Modal */}
      <TechnicianProfileModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setHistoryTechId(null);
        }}
        technicianId={historyTechId}
      />

      {/* LDAP SYNCHRONIZATION CONFIRMATION MODAL */}
      <Modal
        isOpen={isSyncModalOpen}
        onClose={() => !syncingLdap && setIsSyncModalOpen(false)}
        title="Sincronización con Directorio Activo (LDAP)"
        subtitle="Controlador de Dominio Institucional UNALM"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-600/15 dark:bg-sky-500/20 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0 mt-0.5">
              <Network className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-extrabold text-slate-900 dark:text-white block text-sm">
                Domain Controller (172.16.0.8:636)
              </span>
              <p className="leading-relaxed">
                Esta operación importará y sincronizará en tiempo real todas las cuentas institucionales registradas en el Directorio Activo (<code className="text-sky-700 dark:text-sky-300 font-bold font-mono">@lamolina.edu.pe</code>).
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Detalles del Proceso:</span>
            <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Actualiza nombres, apellidos, correo institucional y facultades/dependencias oficiales.</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Registra automáticamente nuevas cuentas docentes y no docentes del campus.</span>
              </li>
              <li className="flex items-center space-x-2">
                <Shield className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span className="font-semibold text-purple-900 dark:text-purple-300">
                  Protección activa: El usuario Administrador y personal técnico están protegidos permanentemente.
                </span>
              </li>
            </ul>
          </div>

          {syncingLdap && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center space-x-2.5 text-xs text-amber-800 dark:text-amber-300 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-semibold">
                Sincronizando cuentas con el servidor LDAP... Por favor espere unos momentos.
              </span>
            </div>
          )}

          <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={syncingLdap}
              onClick={() => setIsSyncModalOpen(false)}
              className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={syncingLdap}
              onClick={handleExecuteSyncLdap}
              className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {syncingLdap ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sincronizando...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Sincronizar Ahora</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Confirmar Eliminación Definitiva de Usuario (Hard Delete) */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !deletingUser && setIsDeleteModalOpen(false)}
        title="Eliminar Usuario Definitivamente de la BD"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start space-x-3.5">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 shrink-0 mt-0.5">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <div className="text-xs text-rose-900 dark:text-rose-200 space-y-1">
              <span className="font-extrabold text-sm block text-rose-950 dark:text-rose-100">
                ¿Está seguro de eliminar definitivamente a este usuario?
              </span>
              <p className="leading-relaxed text-rose-800 dark:text-rose-300">
                Esta acción es <strong>irreversible</strong> y eliminará el registro de forma permanente de la base de datos MySQL centralizada. Se recomienda para depurar cuentas duplicadas o registros erróneos.
              </p>
            </div>
          </div>

          {userToDelete && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-black text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                  {userToDelete.nombres.charAt(0)}{userToDelete.apellidos.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {userToDelete.nombres} {userToDelete.apellidos}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {userToDelete.email}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    userToDelete.estado === 'ACTIVO'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
                >
                  {userToDelete.estado}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Rol:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{userToDelete.rolNombre || userToDelete.rol}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Dependencia:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block" title={userToDelete.facultadDependencia}>
                    {userToDelete.facultadDependencia || 'No asignada'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={deletingUser}
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={deletingUser}
              onClick={handleConfirmDeleteUser}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {deletingUser ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Eliminando de la BD...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar Definitivamente</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

