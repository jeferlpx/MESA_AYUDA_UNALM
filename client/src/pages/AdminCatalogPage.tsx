import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ServiceCategory, Technician } from '../types';
import { Modal } from '../components/Modal';
import { SvgIconPicker, getServiceIconComponent } from '../components/SvgIconPicker';
import {
  Plus,
  Layers,
  Clock,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Zap,
  Shield,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';

export const AdminCatalogPage: React.FC = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  // System config state (Auto-assignment immediate toggle)
  const [autoAssignEnabled, setAutoAssignEnabled] = useState<boolean>(false);
  const [updatingConfig, setUpdatingConfig] = useState<boolean>(false);

  // Category Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);

  // Filter State for Admin Table
  const [activeModuleFilter, setActiveModuleFilter] = useState<'ALL' | 'OTIC' | 'SERVICIOS_GENERALES'>('ALL');

  // Form Fields
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [icono, setIcono] = useState('HelpCircle');
  const [orden, setOrden] = useState('0');
  const [modulo, setModulo] = useState<'OTIC' | 'SERVICIOS_GENERALES'>('OTIC');
  const [slaHorasRespuesta, setSlaHorasRespuesta] = useState('4');
  const [slaHorasResolucion, setSlaHorasResolucion] = useState('24');
  const [tecnicoDefectoId, setTecnicoDefectoId] = useState('');
  const [activo, setActivo] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCatalogData = async () => {
    try {
      setLoading(true);
      const [catRes, techRes, configRes] = await Promise.all([
        api.getAllCategoriesAdmin(),
        api.getTechnicians(),
        api.getSystemConfig(),
      ]);

      if (catRes.success) {
        // Ordenar por orden asc, id asc
        const sorted = (catRes.data || []).sort((a: ServiceCategory, b: ServiceCategory) => (a.orden ?? 0) - (b.orden ?? 0));
        setCategories(sorted);
      }
      if (techRes.success) setTechnicians(techRes.data);
      if (configRes.success && configRes.data) {
        const val = configRes.data.asignacion_automatica_inmediata;
        setAutoAssignEnabled(val === 'true' || val === '1');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogData();
  }, []);

  const handleToggleAutoAssign = async () => {
    setUpdatingConfig(true);
    try {
      const newValue = !autoAssignEnabled;
      const res = await api.updateSystemConfig(
        'asignacion_automatica_inmediata',
        newValue ? 'true' : 'false',
        'Derivación automática a técnico por defecto al crear ticket'
      );
      if (res.success) {
        setAutoAssignEnabled(newValue);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingConfig(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setNombre('');
    setCodigo('');
    setDescripcion('');
    setIcono('HelpCircle');
    setOrden((categories.length + 1).toString());
    setModulo(activeModuleFilter === 'SERVICIOS_GENERALES' ? 'SERVICIOS_GENERALES' : 'OTIC');
    setSlaHorasRespuesta('4');
    setSlaHorasResolucion('24');
    setTecnicoDefectoId('');
    setActivo(true);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: ServiceCategory) => {
    setEditingCategory(cat);
    setNombre(cat.nombre);
    setCodigo(cat.codigo);
    setDescripcion(cat.descripcion || '');
    setIcono(cat.icono || 'HelpCircle');
    setOrden(cat.orden !== undefined ? cat.orden.toString() : '0');
    setModulo(cat.modulo || 'OTIC');
    setSlaHorasRespuesta(cat.sla_horas_respuesta?.toString() || '4');
    setSlaHorasResolucion(cat.sla_horas_resolucion?.toString() || '24');
    setTecnicoDefectoId(cat.tecnico_defecto_id?.toString() || '');
    setActivo(cat.activo);
    setError(null);
    setIsModalOpen(true);
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (reordering) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newCategories = [...categories];
    const temp = newCategories[index];
    newCategories[index] = newCategories[targetIndex];
    newCategories[targetIndex] = temp;

    // Asignar números de orden correlativos
    const ordersPayload = newCategories.map((cat, idx) => ({
      id: cat.id,
      orden: idx + 1,
    }));

    // Actualización optimista de estado
    setCategories(newCategories.map((cat, idx) => ({ ...cat, orden: idx + 1 })));
    setReordering(true);

    try {
      await api.reorderCategories(ordersPayload);
    } catch (err) {
      console.error('Error al guardar nuevo orden:', err);
      await loadCatalogData();
    } finally {
      setReordering(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre || !codigo || !slaHorasRespuesta || !slaHorasResolucion) {
      setError('Complete los campos requeridos con (*)');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        // Update
        const res = await api.updateCategory(editingCategory.id, {
          nombre,
          codigo,
          descripcion,
          icono,
          orden: parseInt(orden, 10) || 0,
          modulo,
          sla_horas_respuesta: parseInt(slaHorasRespuesta, 10),
          sla_horas_resolucion: parseInt(slaHorasResolucion, 10),
          tecnico_defecto_id: tecnicoDefectoId ? parseInt(tecnicoDefectoId, 10) : null,
          activo,
        });

        if (res.success) {
          setIsModalOpen(false);
          await loadCatalogData();
        }
      } else {
        // Create
        const res = await api.createCategory({
          nombre,
          codigo,
          descripcion,
          icono,
          orden: parseInt(orden, 10) || 0,
          modulo,
          sla_horas_respuesta: parseInt(slaHorasRespuesta, 10),
          sla_horas_resolucion: parseInt(slaHorasResolucion, 10),
          tecnico_defecto_id: tecnicoDefectoId ? parseInt(tecnicoDefectoId, 10) : null,
          activo: true,
        });

        if (res.success) {
          setIsModalOpen(false);
          await loadCatalogData();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar la categoría');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat: ServiceCategory) => {
    if (!window.confirm(`¿Está seguro de desactivar el servicio '${cat.nombre}' del catálogo?`)) return;

    try {
      const res = await api.deleteCategory(cat.id);
      if (res.success) {
        await loadCatalogData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-unalm-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Administración de Catálogo ITIL</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Layers className="w-6 h-6 text-unalm-600 shrink-0" />
            <span>Catálogo de Servicios</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Control de posiciones/orden de visualización, asignación de logos SVG y configuración operativa.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-3 bg-unalm-600 hover:bg-unalm-700 text-white rounded-2xl text-xs font-extrabold shadow-md transition-all flex items-center space-x-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Añadir Nuevo Servicio al Catálogo</span>
        </button>
      </div>

      {/* Auto-assignment Configuration Control Panel */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center space-x-2">
            <Zap className={`w-5 h-5 ${autoAssignEnabled ? 'text-amber-400' : 'text-slate-400'}`} />
            <h2 className="text-sm font-bold tracking-tight">
              Modo de Asignación de Tickets (Derivación Inmediata)
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                autoAssignEnabled
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
              }`}
            >
              {autoAssignEnabled ? 'Auto-Asignación Activa' : 'Mesa de Ayuda Manual (Recomendado)'}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {autoAssignEnabled
              ? 'Los nuevos tickets creados se asignarán INMEDIATAMENTE al técnico especialista por defecto configurado en el catálogo de servicios.'
              : 'Los nuevos tickets quedarán en estado REPORTADO para que el personal de Mesa de Ayuda realice el triage, asigne al técnico adecuado y determine la complejidad.'}
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleToggleAutoAssign}
            disabled={updatingConfig}
            className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs transition-all flex items-center space-x-2 ${
              autoAssignEnabled
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
            }`}
          >
            {autoAssignEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            <span>{updatingConfig ? 'Guardando...' : autoAssignEnabled ? 'Desactivar Asignación Inmediata' : 'Activar Asignación Inmediata'}</span>
          </button>
        </div>
      </div>

      {/* Module Filter Tabs */}
      <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveModuleFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeModuleFilter === 'ALL'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Todos los Módulos ({categories.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveModuleFilter('OTIC')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeModuleFilter === 'OTIC'
              ? 'bg-unalm-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          💻 Tecnologías de la Información - OTIC ({categories.filter((c) => c.modulo === 'OTIC' || !c.modulo).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveModuleFilter('SERVICIOS_GENERALES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeModuleFilter === 'SERVICIOS_GENERALES'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🏗️ Servicios Generales & Infraestructura ({categories.filter((c) => c.modulo === 'SERVICIOS_GENERALES').length})
        </button>
      </div>

      {/* Catalog Table with Order Controls */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-4 h-4 text-unalm-600" />
            <h3 className="text-sm font-extrabold text-slate-800">
              Listado de Servicios y Orden de Visualización
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {categories.filter((c) => activeModuleFilter === 'ALL' || c.modulo === activeModuleFilter).length} servicios mostrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3.5 px-3 text-center w-24">POSICIÓN / ORDEN</th>
                <th className="py-3.5 px-4">LOGO</th>
                <th className="py-3.5 px-4">MÓDULO</th>
                <th className="py-3.5 px-4">CÓDIGO</th>
                <th className="py-3.5 px-4">NOMBRE DE SERVICIO</th>
                <th className="py-3.5 px-4">DESCRIPCIÓN</th>
                <th className="py-3.5 px-4">RESPUESTA REF.</th>
                <th className="py-3.5 px-4">RESOLUCIÓN REF.</th>
                <th className="py-3.5 px-4">TÉCNICO DEFECTO</th>
                <th className="py-3.5 px-4">ESTADO</th>
                <th className="py-3.5 px-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Cargando catálogo de servicios...
                  </td>
                </tr>
              ) : categories.filter((c) => activeModuleFilter === 'ALL' || c.modulo === activeModuleFilter).length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No hay servicios configurados para el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                categories
                  .filter((c) => activeModuleFilter === 'ALL' || c.modulo === activeModuleFilter)
                  .map((c, index) => {
                    const IconComp = getServiceIconComponent(c.icono);
                    const isSG = c.modulo === 'SERVICIOS_GENERALES';
                    return (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        {/* Order buttons */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center space-x-1 bg-slate-100 border border-slate-200 rounded-xl p-1">
                            <button
                              type="button"
                              disabled={index === 0 || reordering}
                              onClick={() => handleMoveOrder(index, 'up')}
                              className="p-1 text-slate-600 hover:text-unalm-700 hover:bg-white rounded-lg disabled:opacity-30 transition-colors"
                              title="Mover arriba en el catálogo"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-extrabold text-xs text-slate-900 px-1.5 min-w-[20px] text-center font-mono">
                              {c.orden ?? index + 1}
                            </span>
                            <button
                              type="button"
                              disabled={index === categories.length - 1 || reordering}
                              onClick={() => handleMoveOrder(index, 'down')}
                              className="p-1 text-slate-600 hover:text-unalm-700 hover:bg-white rounded-lg disabled:opacity-30 transition-colors"
                              title="Mover abajo en el catálogo"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-2xs ${
                            isSG
                              ? 'bg-amber-50 text-amber-600 border-amber-200'
                              : 'bg-unalm-50 text-unalm-600 border-unalm-200'
                          }`}>
                            <IconComp className="w-5 h-5" />
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${
                            isSG
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}>
                            {isSG ? 'Serv. Generales' : 'OTIC'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                          {c.codigo}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 max-w-[200px]">
                          {c.nombre}
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                          {c.descripcion}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-700">
                          {isSG ? (
                            <span className="text-slate-400 italic text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">Sin límite</span>
                          ) : (
                            <span className="inline-flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>{c.sla_horas_respuesta}h</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-700">
                          {isSG ? (
                            <span className="text-slate-400 italic text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">Sin límite</span>
                          ) : (
                            <span className="inline-flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{c.sla_horas_resolucion}h</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {c.tecnico_defecto_nombre ? (
                            <span className="font-semibold text-slate-800">{c.tecnico_defecto_nombre}</span>
                          ) : (
                            <span className="text-slate-400 italic">Mesa de Ayuda (Manual)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {c.activo ? (
                            <span className="px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 bg-emerald-100 rounded-full border border-emerald-300">
                              ACTIVO
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 text-[10px] font-extrabold text-slate-600 bg-slate-100 rounded-full border border-slate-300">
                              INACTIVO
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEditModal(c)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition-colors"
                            title="Editar Servicio"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {c.activo && (
                            <button
                              onClick={() => handleDeleteCategory(c)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition-colors"
                              title="Desactivar Servicio"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD: Create / Edit Category */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Editar Servicio del Catálogo' : 'Nuevo Servicio del Catálogo'}
        subtitle="Configure los parámetros de servicio, orden de visualización, logo SVG y auto-asignación técnica"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveCategory} className="space-y-5">
          {/* Service Name, Unique Code, Order and Module */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Nombre del Servicio Técnico (*)
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Conectividad Wi-Fi Eduroam / Mantenimiento Eléctrico"
                className="w-full p-3 border border-slate-300 rounded-2xl text-xs focus:ring-2 focus:ring-unalm-500 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Código Único ITIL (*)
              </label>
              <input
                type="text"
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Ej: NET_WIFI o SG_ELEC"
                className="w-full p-3 border border-slate-300 rounded-2xl text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-unalm-500 focus:outline-none text-unalm-700 bg-unalm-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Área / Módulo Institucional (*)
              </label>
              <select
                value={modulo}
                onChange={(e) => {
                  setModulo(e.target.value as any);
                  setTecnicoDefectoId('');
                }}
                className="w-full p-3 border border-slate-300 rounded-2xl text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-unalm-500 focus:outline-none"
              >
                <option value="OTIC">💻 Tecnologías de la Información (OTIC)</option>
                <option value="SERVICIOS_GENERALES">🏗️ Servicios Generales & Infraestructura</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Posición / Orden en Catálogo
              </label>
              <input
                type="number"
                min="0"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                placeholder="1"
                className="w-full p-3 border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-unalm-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Descripción Detallada del Servicio
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describa el alcance, características y tipo de soporte que brinda este servicio..."
                className="w-full p-3 border border-slate-300 rounded-2xl text-xs focus:ring-2 focus:ring-unalm-500 focus:outline-none"
              />
            </div>
          </div>

          {/* SVG Icon Selector Component */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
              Selector de Logo SVG Predeterminado del Sistema / Librerías
            </label>
            <SvgIconPicker selectedIcon={icono} onSelectIcon={setIcono} />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Técnico Especialista por Defecto ({modulo === 'SERVICIOS_GENERALES' ? 'Serv. Generales' : 'OTIC'})
            </label>
              <select
                value={tecnicoDefectoId}
                onChange={(e) => setTecnicoDefectoId(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-2xl text-xs bg-white font-medium focus:ring-2 focus:ring-unalm-500"
              >
                <option value="">Mesa de Ayuda (Manual)</option>
                {technicians
                  .filter((t) => {
                    if (modulo === 'SERVICIOS_GENERALES') {
                      return t.rol === 'TECNICO_SG' || t.rol === 'SUPERVISOR_SG';
                    }
                    return ['TECNICO', 'ESPECIALISTA_REDES', 'ESPECIALISTA_DESARROLLO', 'SUPERVISOR'].includes(t.rol);
                  })
                  .map((t) => (
                    <option key={t.id} value={t.id.toString()}>
                      {t.nombres} {t.apellidos} ({t.facultadDependencia})
                    </option>
                  ))}
              </select>
            </div>

          {editingCategory && (
            <div className="flex items-center space-x-2 pt-1">
              <label className="flex items-center space-x-2 text-xs font-extrabold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="rounded text-unalm-600 focus:ring-unalm-500 w-4 h-4"
                />
                <span>Servicio Activo y Disponible en el Catálogo para los Solicitantes</span>
              </label>
            </div>
          )}

          {error && (
            <p className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-7 py-3 bg-unalm-600 hover:bg-unalm-700 text-white rounded-2xl text-xs font-extrabold shadow-md transition-all disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : editingCategory ? 'Actualizar Servicio' : 'Guardar y Publicar Servicio'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
