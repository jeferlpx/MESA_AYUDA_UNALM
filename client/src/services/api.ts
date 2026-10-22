const getApiBase = () => {
  if (typeof window !== 'undefined') {
    // 1. Si se definió por variable de entorno Vite
    const envApi = (import.meta as any).env?.VITE_API_URL;
    if (envApi) return envApi;

    // 2. Si estamos en desarrollo local en localhost / 127.0.0.1
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return '/api';
    }

    // 3. Si la ruta contiene el subdirectorio de pruebas institucional
    const pathLower = window.location.pathname.toLowerCase();
    if (pathLower.includes('/pruebas1/david/mesa_ayuda')) {
      return '/pruebas1/david/mesa_ayuda/api';
    }

    return '/api';
  }
  return 'http://localhost:4000/api';
};


export const API_BASE = getApiBase();

export function getAssetUrl(path?: string | null): string {
  if (!path || !path.trim()) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  let cleanPath = path.replace(/\\/g, '/');
  const uploadsIdx = cleanPath.indexOf('uploads/');
  if (uploadsIdx !== -1) {
    cleanPath = cleanPath.substring(uploadsIdx);
  } else {
    cleanPath = cleanPath.replace(/^\/+/, '');
  }
  
  if (typeof window !== 'undefined') {
    const pathLower = window.location.pathname.toLowerCase();
    if (pathLower.includes('/pruebas1/david/mesa_ayuda')) {
      return `/pruebas1/david/mesa_ayuda/${cleanPath}`;
    }
  }
  return `/${cleanPath}`;
}



export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('otic_token');
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Si no es FormData, setear Content-Type a application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Error del servidor (${response.status}): ${text.slice(0, 100)}`);
    }
    data = { success: true, message: text };
  }

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('otic_token');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('otic_unauthorized', { detail: data.message }));
      }
    }
    throw new Error(data.message || `Error ${response.status} en la petición al servidor OTIC`);
  }

  return data;
}


export const api = {
  // Auth
  login: (email: string, password: string) => 
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  ldapLogin: (username: string, password: string) =>
    apiFetch('/auth/ldap-login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getLdapStatus: () =>
    apiFetch('/auth/ldap-status'),
  register: (data: { nombres?: string; apellidos?: string; nombreCompleto?: string; email: string; password: string; facultadDependencia: string; telefono?: string; anexo?: string }) => 
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => 
    apiFetch('/auth/me'),
  completeFirstLogin: (data: {
    newPassword?: string;
    newEmail?: string;
    facultadDependencia?: string;
    telefono?: string;
    anexo?: string;
  }) => apiFetch('/auth/complete-first-login', { method: 'POST', body: JSON.stringify(data) }),
  getUserProfile: () =>
    apiFetch('/users/profile'),
  updateUserProfile: (data: { telefono?: string; anexo?: string; facultadDependencia?: string; ubicacionReferencia?: string }) =>
    apiFetch('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
  updateProfilePhoto: (formData: FormData) =>
    apiFetch('/users/profile/photo', { method: 'POST', body: formData }),


  // Catalog
  getCategories: (params?: { modulo?: string }) => {
    const query = params?.modulo ? `?modulo=${params.modulo}` : '';
    return apiFetch(`/catalog/categories${query}`);
  },
  getAllCategoriesAdmin: (params?: { modulo?: string }) => {
    const query = params?.modulo ? `?modulo=${params.modulo}` : '';
    return apiFetch(`/catalog/categories/all${query}`);
  },
  createCategory: (data: any) => 
    apiFetch('/catalog/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: number, data: any) =>
    apiFetch(`/catalog/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  reorderCategories: (orders: { id: number; orden: number }[]) =>
    apiFetch('/catalog/categories/reorder', { method: 'PUT', body: JSON.stringify({ orders }) }),
  deleteCategory: (id: number) =>
    apiFetch(`/catalog/categories/${id}`, { method: 'DELETE' }),

  // Users & Technicians CRUD
  getTechnicians: (params?: { modulo?: string }) => {
    const query = params?.modulo ? `?modulo=${params.modulo}` : '';
    return apiFetch(`/users/technicians${query}`);
  },
  getTechnicianHistory: (id: number) =>
    apiFetch(`/users/technicians/${id}/history`),
  getUsers: (params?: Record<string, string>) => {

    const query = new URLSearchParams(params).toString();
    return apiFetch(`/users${query ? `?${query}` : ''}`);
  },
  getUserById: (id: number) => 
    apiFetch(`/users/${id}`),
  createUser: (data: any) => 
    apiFetch('/users/register', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: number, data: any) => 
    apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateUserPhotoByAdmin: (id: number, formData: FormData) =>
    apiFetch(`/users/${id}/photo`, { method: 'POST', body: formData }),
  removeUserPhotoByAdmin: (id: number) =>
    apiFetch(`/users/${id}/photo`, { method: 'POST', body: JSON.stringify({ fotoPerfil: '' }) }),
  updateUserPassword: (id: number, password: string) => 
    apiFetch(`/users/${id}/password`, { method: 'PUT', body: JSON.stringify({ password }) }),
  deleteUser: (id: number) => 
    apiFetch(`/users/${id}`, { method: 'DELETE' }),
  syncLdapUsers: () =>
    apiFetch('/users/sync-ldap', { method: 'POST' }),


  // Tickets
  getTickets: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/tickets${query ? `?${query}` : ''}`);
  },
  getTicketDetail: (id: number) => 
    apiFetch(`/tickets/${id}`),
  getTicketById: (id: number) => 
    apiFetch(`/tickets/${id}`),
  createTicket: (formData: FormData) => 
    apiFetch('/tickets', { method: 'POST', body: formData }),
  updateStatus: (
    id: number,
    status: string,
    solucionDetalle?: string,
    comentario?: string,
    materialesUsados?: string,
    materialesSobrantes?: string,
    archivo?: File | null
  ) => {
    if (archivo) {
      const formData = new FormData();
      formData.append('estado', status);
      if (solucionDetalle) formData.append('solucionDetalle', solucionDetalle);
      if (comentario) formData.append('comentario', comentario);
      if (materialesUsados) formData.append('materialesUsados', materialesUsados);
      if (materialesSobrantes) formData.append('materialesSobrantes', materialesSobrantes);
      formData.append('file', archivo);
      return apiFetch(`/tickets/${id}/status`, {
        method: 'PUT',
        body: formData,
      });
    }
    return apiFetch(`/tickets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        estado: status,
        solucionDetalle,
        comentario,
        materialesUsados,
        materialesSobrantes,
      }),
    });
  },
  updateTicketStatus: (
    id: number,
    data: {
      estado: string;
      solucionDetalle?: string;
      comentario?: string;
      materialesUsados?: string;
      materialesSobrantes?: string;
      archivo?: File | null;
    }
  ) => {
    if (data.archivo) {
      const formData = new FormData();
      formData.append('estado', data.estado);
      if (data.solucionDetalle) formData.append('solucionDetalle', data.solucionDetalle);
      if (data.comentario) formData.append('comentario', data.comentario);
      if (data.materialesUsados) formData.append('materialesUsados', data.materialesUsados);
      if (data.materialesSobrantes) formData.append('materialesSobrantes', data.materialesSobrantes);
      formData.append('file', data.archivo);
      return apiFetch(`/tickets/${id}/status`, {
        method: 'PUT',
        body: formData,
      });
    }
    return apiFetch(`/tickets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  assignTechnician: (id: number, tecnicoId: number, complejidad?: string, tecnicosAdicionalesIds?: number[]) => 
    apiFetch(`/tickets/${id}/assign`, { method: 'PUT', body: JSON.stringify({ tecnicoId, complejidad, tecnicosAdicionalesIds }) }),
  deriveTicket: (id: number, nuevoTecnicoId: number, nuevaCategoriaId?: number, nuevaComplejidad?: string, motivo?: string, nuevosTecnicosAdicionalesIds?: number[]) =>
    apiFetch(`/tickets/${id}/derive`, { method: 'PUT', body: JSON.stringify({ nuevoTecnicoId, nuevaCategoriaId, nuevaComplejidad, motivo, nuevosTecnicosAdicionalesIds }) }),
  observeTicket: (id: number, formData: FormData) =>
    apiFetch(`/tickets/${id}/observe`, { method: 'PUT', body: formData }),
  reopenTicket: (id: number, motivo?: string) =>
    apiFetch(`/tickets/${id}/reopen`, { method: 'PUT', body: JSON.stringify({ motivo }) }),
  submitSurvey: (id: number, puntuacion: number, comentario?: string) =>
    apiFetch(`/tickets/${id}/survey`, { method: 'POST', body: JSON.stringify({ puntuacion, comentario }) }),
  addComment: (id: number, formData: FormData) => 
    apiFetch(`/tickets/${id}/comments`, { method: 'POST', body: formData }),
  addAttachmentsToTicket: (id: number, formData: FormData) =>
    apiFetch(`/tickets/${id}/attachments`, { method: 'POST', body: formData }),
  uploadTicketAttachments: (id: number, formData: FormData) =>
    apiFetch(`/tickets/${id}/attachments`, { method: 'POST', body: formData }),

  // Admin Dashboard & Global
  getDashboardMetrics: (params?: { modulo?: string }) => {
    const query = params?.modulo ? `?modulo=${params.modulo}` : '';
    return apiFetch(`/admin/dashboard${query}`);
  },
  getAuditLogsGlobal: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/admin/audit-logs${query ? `?${query}` : ''}`);
  },
  getSystemConfig: () =>
    apiFetch('/admin/config'),
  updateSystemConfig: (clave: string, valor: string, descripcion?: string) =>
    apiFetch('/admin/config', { method: 'POST', body: JSON.stringify({ clave, valor, descripcion }) }),

  // Inspecciones Preventivas de Infraestructura (SIGI UNALM)
  getInspections: (params?: Record<string, string>) => {
    const query = params ? new URLSearchParams(params).toString() : '';
    return apiFetch(`/inspections${query ? `?${query}` : ''}`);
  },
  getInspectionDetail: (id: number) =>
    apiFetch(`/inspections/${id}`),
  generateTicketsFromInspection: (id: number) =>
    apiFetch(`/inspections/${id}/generate-tickets`, { method: 'POST' }),
  generateTicketFromFinding: (findingId: number) =>
    apiFetch(`/inspections/findings/${findingId}/create-ticket`, { method: 'POST' }),
  generateAllCriticalTickets: () =>
    apiFetch('/inspections/generate-all-critical', { method: 'POST' }),

  // Inventario de Materiales e Insumos (Servicios Generales)
  getMaterials: (params?: { search?: string; categoria?: string; estadoStock?: string }) => {
    const cleanParams: Record<string, string> = {};
    if (params?.search && params.search.trim() !== '') cleanParams.search = params.search.trim();
    if (params?.categoria && params.categoria !== 'ALL') cleanParams.categoria = params.categoria;
    if (params?.estadoStock && params.estadoStock !== 'ALL') cleanParams.estadoStock = params.estadoStock;
    const query = new URLSearchParams(cleanParams).toString();
    return apiFetch(`/materials${query ? `?${query}` : ''}`);
  },
  getMaterialDetail: (id: number) =>
    apiFetch(`/materials/${id}`),
  createMaterial: (data: any) =>
    apiFetch('/materials', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterial: (id: number, data: any) =>
    apiFetch(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaterial: (id: number) =>
    apiFetch(`/materials/${id}`, { method: 'DELETE' }),
  registerMaterialMovement: (data: any) =>
    apiFetch('/materials/movimientos', { method: 'POST', body: JSON.stringify(data) }),
  getMaterialMovements: (params?: { materialId?: number; limit?: number }) => {
    const cleanParams: Record<string, string> = {};
    if (params?.materialId) cleanParams.materialId = String(params.materialId);
    if (params?.limit) cleanParams.limit = String(params.limit);
    const query = new URLSearchParams(cleanParams).toString();
    return apiFetch(`/materials/movimientos${query ? `?${query}` : ''}`);
  },
};

