import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { MaterialSG, MaterialMovimientoSG, MaterialesMetrics } from '../types';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import {
  Package,
  PlusCircle,
  MinusCircle,
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Wrench,
  Zap,
  Droplets,
  Hammer,
  Car,
  KeyRound,
  Paintbrush,
  Trees,
  Sparkles,
  RefreshCw,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Printer,
  Building2,
  Tag,
  Info,
} from 'lucide-react';

const TALLERES_CATEGORIAS = [
  { id: 'ALL', label: 'Todos los Talleres', icon: Layers },
  { id: 'Electricidad', label: 'Electricidad', icon: Zap },
  { id: 'Gasfitería', label: 'Gasfitería & Sanitaria', icon: Droplets },
  { id: 'Carpintería', label: 'Carpintería', icon: Hammer },
  { id: 'Mecánica Automotriz', label: 'Mecánica & Transporte', icon: Car },
  { id: 'Cerrajería', label: 'Cerrajería & Soldadura', icon: KeyRound },
  { id: 'Pintura y Albañilería', label: 'Pintura & Albañilería', icon: Paintbrush },
  { id: 'Áreas Verdes', label: 'Áreas Verdes & Jardinería', icon: Trees },
  { id: 'Limpieza y Saneamiento', label: 'Limpieza & Residuos', icon: Sparkles },
];

export const SGInventoryPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [materials, setMaterials] = useState<MaterialSG[]>([]);
  const [metrics, setMetrics] = useState<MaterialesMetrics>({
    total_materiales: 0,
    total_agotados: 0,
    total_stock_bajo: 0,
    total_disponibles: 0,
    total_unidades_fisicas: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedTaller, setSelectedTaller] = useState('ALL');
  const [selectedStockStatus, setSelectedStockStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isNewMaterialModalOpen, setIsNewMaterialModalOpen] = useState(false);
  const [isEditMaterialModalOpen, setIsEditMaterialModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [isKardexModalOpen, setIsKardexModalOpen] = useState(false);

  // Selected Material for operations
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialSG | null>(null);
  const [kardexMovements, setKardexMovements] = useState<MaterialMovimientoSG[]>([]);
  const [loadingKardex, setLoadingKardex] = useState(false);

  // Form states for New / Edit Material
  const [formCodigo, setFormCodigo] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formTaller, setFormTaller] = useState('Electricidad');
  const [formUnidadMedida, setFormUnidadMedida] = useState('Unidad (und)');
  const [formStockInicial, setFormStockInicial] = useState('10');
  const [formStockMinimo, setFormStockMinimo] = useState('5');
  const [formUbicacion, setFormUbicacion] = useState('');
  const [formPrecio, setFormPrecio] = useState('');
  const [submittingForm, setSubmittingForm] = useState(false);

  // Form states for Movement (Entrada / Salida)
  const [movMaterialId, setMovMaterialId] = useState<number | ''>('');
  const [movTipo, setMovTipo] = useState<'ENTRADA_COMPRA' | 'ENTRADA_DEVOLUCION' | 'SALIDA_OT' | 'SALIDA_AJUSTE'>('ENTRADA_COMPRA');
  const [movCantidad, setMovCantidad] = useState('1');
  const [movOrdenTrabajo, setMovOrdenTrabajo] = useState('');
  const [movMotivo, setMovMotivo] = useState('');
  const [movObservaciones, setMovObservaciones] = useState('');
  const [submittingMovement, setSubmittingMovement] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getMaterials({
        search: searchQuery || undefined,
        categoria: selectedTaller !== 'ALL' ? selectedTaller : undefined,
        estadoStock: selectedStockStatus !== 'ALL' ? selectedStockStatus : undefined,
      });

      if (res.success) {
        setMaterials(res.data || []);
        if (res.metricas) {
          setMetrics(res.metricas);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Error al cargar la lista de materiales', 'Error de Conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedTaller, selectedStockStatus, searchQuery]);

  // Open Movement Modal
  const handleOpenMovementModal = (type: 'ENTRADA' | 'SALIDA', material?: MaterialSG) => {
    setMovementType(type);
    if (material) {
      setMovMaterialId(material.id);
      setSelectedMaterial(material);
    } else {
      setMovMaterialId(materials.length > 0 ? materials[0].id : '');
      setSelectedMaterial(materials.length > 0 ? materials[0] : null);
    }

    if (type === 'ENTRADA') {
      setMovTipo('ENTRADA_COMPRA');
      setMovMotivo('Ingreso por compra / recepción de almacén');
    } else {
      setMovTipo('SALIDA_OT');
      setMovMotivo('Despacho para atención de Orden de Trabajo');
    }

    setMovCantidad('1');
    setMovOrdenTrabajo('');
    setMovObservaciones('');
    setIsMovementModalOpen(true);
  };

  // Submit Movement (Entrada / Salida)
  const handleSubmitMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movMaterialId || Number(movCantidad) <= 0) {
      toast.warning('Por favor seleccione un material y una cantidad válida mayor a 0');
      return;
    }

    setSubmittingMovement(true);
    try {
      const res = await api.registerMaterialMovement({
        materialId: Number(movMaterialId),
        tipoMovimiento: movTipo,
        cantidad: Number(movCantidad),
        ordenTrabajoCodigo: movOrdenTrabajo.trim() || undefined,
        motivo: movMotivo.trim() || undefined,
        observaciones: movObservaciones.trim() || undefined,
      });

      if (res.success) {
        toast.success(res.message, 'Movimiento Guardado');
        setIsMovementModalOpen(false);
        await loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar el movimiento de inventario', 'Error');
    } finally {
      setSubmittingMovement(false);
    }
  };

  // Open Create Material Modal
  const handleOpenCreateModal = () => {
    setFormCodigo('');
    setFormNombre('');
    setFormTaller(selectedTaller !== 'ALL' ? selectedTaller : 'Electricidad');
    setFormUnidadMedida('Unidad (und)');
    setFormStockInicial('10');
    setFormStockMinimo('5');
    setFormUbicacion('Almacén Central SG');
    setFormPrecio('0');
    setIsNewMaterialModalOpen(true);
  };

  // Submit Create Material
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      toast.warning('Por favor ingrese el nombre del material');
      return;
    }

    setSubmittingForm(true);
    try {
      const res = await api.createMaterial({
        codigo: formCodigo.trim() || undefined,
        nombre: formNombre.trim(),
        categoriaTaller: formTaller,
        unidadMedida: formUnidadMedida,
        stockInicial: Number(formStockInicial) || 0,
        stockMinimo: Number(formStockMinimo) || 5,
        ubicacionAlmacen: formUbicacion.trim() || undefined,
        precioEstimado: Number(formPrecio) || 0,
      });

      if (res.success) {
        toast.success('¡Material registrado exitosamente en el inventario!', 'Material Creado');
        setIsNewMaterialModalOpen(false);
        await loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar el material', 'Error');
    } finally {
      setSubmittingForm(false);
    }
  };

  // Open Edit Material Modal
  const handleOpenEditModal = (mat: MaterialSG) => {
    setSelectedMaterial(mat);
    setFormCodigo(mat.codigo);
    setFormNombre(mat.nombre);
    setFormTaller(mat.categoria_taller);
    setFormUnidadMedida(mat.unidad_medida);
    setFormStockMinimo(String(mat.stock_minimo));
    setFormUbicacion(mat.ubicacion_almacen || '');
    setFormPrecio(String(mat.precio_unitario_estimado || '0'));
    setIsEditMaterialModalOpen(true);
  };

  // Submit Edit Material
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;

    setSubmittingForm(true);
    try {
      const res = await api.updateMaterial(selectedMaterial.id, {
        nombre: formNombre.trim(),
        categoriaTaller: formTaller,
        unidadMedida: formUnidadMedida,
        stockMinimo: Number(formStockMinimo) || 5,
        ubicacionAlmacen: formUbicacion.trim() || undefined,
        precioEstimado: Number(formPrecio) || 0,
      });

      if (res.success) {
        toast.success('Material actualizado correctamente', 'Guardado');
        setIsEditMaterialModalOpen(false);
        await loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar material', 'Error');
    } finally {
      setSubmittingForm(false);
    }
  };

  // Open Kardex History Modal
  const handleOpenKardex = async (mat?: MaterialSG) => {
    setSelectedMaterial(mat || null);
    setIsKardexModalOpen(true);
    setLoadingKardex(true);
    try {
      const res = await api.getMaterialMovements({
        materialId: mat ? mat.id : undefined,
        limit: 100,
      });
      if (res.success) {
        setKardexMovements(res.data || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Error al cargar el historial de movimientos');
    } finally {
      setLoadingKardex(false);
    }
  };

  // Export Inventory to CSV
  const handleExportCSV = () => {
    if (materials.length === 0) {
      toast.warning('No hay materiales para exportar con los filtros actuales');
      return;
    }

    const headers = [
      'CÓDIGO',
      'MATERIAL / INSUMO',
      'TALLER / ESPECIALIDAD',
      'UNIDAD DE MEDIDA',
      'STOCK ACTUAL',
      'STOCK MÍNIMO',
      'ESTADO DEL STOCK',
      'UBICACIÓN EN ALMACÉN',
      'PRECIO ESTIMADO (S/)',
      'FECHA DE REGISTRO',
    ];

    const rows = materials.map((m) => [
      `"${m.codigo}"`,
      `"${m.nombre.replace(/"/g, '""')}"`,
      `"${m.categoria_taller}"`,
      `"${m.unidad_medida}"`,
      m.stock_actual,
      m.stock_minimo,
      `"${m.estado_stock}"`,
      `"${(m.ubicacion_almacen || '').replace(/"/g, '""')}"`,
      m.precio_unitario_estimado || 0,
      `"${new Date(m.creado_en).toLocaleDateString('es-PE')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Inventario_Materiales_SG_UNALM_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('El reporte de inventario se ha descargado en formato Excel (.CSV)', 'Descarga Exitosa');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-[1720px] px-3 sm:px-6 lg:px-8 mx-auto pb-12 font-sans space-y-6">
      {/* =========================================================================
          REPORTE INSTITUCIONAL FORMAL PARA IMPRESIÓN / PDF (SOLO VISIBLE AL IMPRIMIR)
         ========================================================================= */}
      <div className="hidden print:block bg-white text-slate-900 p-2 space-y-6 text-xs">
        {/* Cabecera Oficial UNALM */}
        <div className="border-b-2 border-slate-900 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="./escudo-color.png"
                alt="Escudo UNALM"
                className="w-16 h-16 object-contain"
              />
              <div>
                <h1 className="text-sm font-black tracking-tight uppercase">
                  UNIVERSIDAD NACIONAL AGRARIA LA MOLINA
                </h1>
                <p className="text-[11px] font-bold text-slate-700">
                  DIRECCIÓN GENERAL DE ADMINISTRACIÓN • UNIDAD DE SERVICIOS GENERALES
                </p>
                <p className="text-[10px] text-slate-500 font-semibold">
                  Control de Inventario y Almacén de Talleres (ROF 2023)
                </p>
              </div>
            </div>

            <div className="text-right text-[10px] space-y-0.5">
              <p className="font-bold">INFORME DE INVENTARIO Y STOCK</p>
              <p className="text-slate-600">
                Fecha Emisión: {new Date().toLocaleDateString('es-PE')} {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-slate-600">
                Emitido por: {user ? `${user.nombres} ${user.apellidos}` : 'Mesa de Ayuda SG'}
              </p>
            </div>
          </div>

          <div className="mt-3 bg-slate-100 p-2 rounded border border-slate-300 text-[11px] flex items-center justify-between font-medium">
            <span><strong>Taller Filtrado:</strong> {selectedTaller === 'ALL' ? 'Todos los Talleres' : selectedTaller}</span>
            <span><strong>Estado Stock:</strong> {selectedStockStatus === 'ALL' ? 'Todos' : selectedStockStatus}</span>
            <span><strong>Total Ítems Listados:</strong> {materials.length} materiales</span>
          </div>
        </div>

        {/* Resumen de KPIs en Tabla Formal */}
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase text-slate-900 border-b border-slate-300 pb-1">
            1. Resumen de Existencias en Almacén
          </h2>
          <table className="w-full text-left border border-slate-300 text-[11px]">
            <thead className="bg-slate-100 font-bold border-b border-slate-300">
              <tr>
                <th className="p-2 border-r border-slate-300 text-center">Total Materiales</th>
                <th className="p-2 border-r border-slate-300 text-center">Stock Disponible</th>
                <th className="p-2 border-r border-slate-300 text-center">Stock Bajo (Alerta)</th>
                <th className="p-2 border-r border-slate-300 text-center">Agotados (Cero)</th>
                <th className="p-2 text-center">Total Unidades Físicas</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-bold text-center">
                <td className="p-2 border-r border-slate-300 font-mono text-sm">{metrics.total_materiales}</td>
                <td className="p-2 border-r border-slate-300 font-mono text-sm text-emerald-800">{metrics.total_disponibles}</td>
                <td className="p-2 border-r border-slate-300 font-mono text-sm text-amber-800">{metrics.total_stock_bajo}</td>
                <td className="p-2 border-r border-slate-300 font-mono text-sm text-rose-800">{metrics.total_agotados}</td>
                <td className="p-2 font-mono text-sm text-slate-900">{metrics.total_unidades_fisicas}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Catálogo Completo de Materiales */}
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase text-slate-900 border-b border-slate-300 pb-1">
            2. Catálogo Detallado de Materiales e Insumos
          </h2>
          <table className="w-full text-left border border-slate-300 text-[9px]">
            <thead className="bg-slate-100 font-bold border-b border-slate-300">
              <tr>
                <th className="p-1 border-r border-slate-300">Código</th>
                <th className="p-1 border-r border-slate-300">Material / Insumo</th>
                <th className="p-1 border-r border-slate-300">Taller</th>
                <th className="p-1 border-r border-slate-300 text-center">Unidad</th>
                <th className="p-1 border-r border-slate-300 text-center">Stock Mínimo</th>
                <th className="p-1 border-r border-slate-300 text-center">STOCK ACTUAL</th>
                <th className="p-1 border-r border-slate-300 text-center">Estado</th>
                <th className="p-1 border-r border-slate-300">Ubicación</th>
                <th className="p-1 text-right">Precio Est. (S/)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {materials.map((m) => (
                <tr key={m.id}>
                  <td className="p-1 border-r border-slate-300 font-mono font-bold whitespace-nowrap">{m.codigo}</td>
                  <td className="p-1 border-r border-slate-300 font-bold">{m.nombre}</td>
                  <td className="p-1 border-r border-slate-300 whitespace-nowrap">{m.categoria_taller}</td>
                  <td className="p-1 border-r border-slate-300 text-center">{m.unidad_medida}</td>
                  <td className="p-1 border-r border-slate-300 text-center font-mono">{m.stock_minimo}</td>
                  <td className="p-1 border-r border-slate-300 text-center font-mono font-black">{m.stock_actual}</td>
                  <td className="p-1 border-r border-slate-300 text-center font-bold">{m.estado_stock}</td>
                  <td className="p-1 border-r border-slate-300">{m.ubicacion_almacen || 'Almacén Central'}</td>
                  <td className="p-1 text-right font-mono">{Number(m.precio_unitario_estimado || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Firmas Oficiales */}
        <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center text-[10px]">
          <div className="space-y-1">
            <div className="h-12 border-b border-dashed border-slate-400 mx-4"></div>
            <p className="font-bold">Responsable de Almacén SG</p>
            <p className="text-slate-500">Unidad de Servicios Generales UNALM</p>
          </div>
          <div className="space-y-1">
            <div className="h-12 border-b border-dashed border-slate-400 mx-4"></div>
            <p className="font-bold">Jefatura de Servicios Generales</p>
            <p className="text-slate-500">Dirección General de Administración</p>
          </div>
          <div className="space-y-1">
            <div className="h-12 border-b border-dashed border-slate-400 mx-4"></div>
            <p className="font-bold">Control Patrimonial y Auditoría</p>
            <p className="text-slate-500">Órgano de Control Institucional (OCI)</p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PANTALLA INTERACTIVA (EN PANTALLA, ANCHO AMPLIADO Y SIN SCROLL CORTADO)
         ========================================================================= */}
      <div className="print:hidden space-y-6">
        {/* =========================================================================
            HEADER PRINCIPAL (TEXTOS GRANDES, CLAROS Y BOTONES ACCIONABLES)
           ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-xs shrink-0">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Control de Inventario & Almacén de Talleres
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    Servicios Generales UNALM • Control de existencias e insumos para Órdenes de Trabajo
                  </p>
                </div>
              </div>
            </div>

            {/* Botones Grandes de Acción Rápida */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleOpenMovementModal('ENTRADA')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>+ Registrar Ingreso / Compra</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenMovementModal('SALIDA')}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-md shadow-rose-700/20 transition-all cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>- Registrar Salida / Uso en OT</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-amber-400" />
                <span>Nuevo Material</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenKardex()}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-colors cursor-pointer border border-slate-200"
                title="Ver historial general de movimientos"
              >
                <History className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Historial Kardex</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="Descargar lista completa en Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Excel</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white rounded-2xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-md"
                title="Imprimir / Exportar Reporte de Inventario en PDF"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Imprimir Reporte PDF</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              TARJETAS DE RESUMEN / KPI (GRANDES, LEGIBLES Y VISUALES)
             ========================================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Total de Materiales
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {metrics.total_materiales}
                </span>
                <span className="text-xs text-slate-500 font-medium">ítems en catálogo</span>
              </div>
            </div>

            <div className="bg-emerald-50/80 p-4 sm:p-5 rounded-2xl border border-emerald-200 space-y-1">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">
                  Stock Disponible
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                  {metrics.total_disponibles}
                </span>
                <span className="text-xs text-emerald-800 font-semibold">con buen stock</span>
              </div>
            </div>

            <div className="bg-amber-50 p-4 sm:p-5 rounded-2xl border border-amber-300 space-y-1">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                  Stock Bajo (Reponer)
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-700">
                  {metrics.total_stock_bajo}
                </span>
                <span className="text-xs text-amber-900 font-bold">¡Quedan pocas unidades!</span>
              </div>
            </div>

            <div className="bg-rose-50 p-4 sm:p-5 rounded-2xl border border-rose-300 space-y-1">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="text-xs font-bold text-rose-900 uppercase tracking-wider block">
                  Agotados (Sin Stock)
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-rose-700">
                  {metrics.total_agotados}
                </span>
                <span className="text-xs text-rose-900 font-bold">en cero (0)</span>
              </div>
            </div>
          </div>
        </div>

      {/* =========================================================================
          PESTAÑAS DE FILTRO POR TALLER Y BUSCADOR EN TIEMPO REAL
         ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        {/* Buscador grande y filtros de estado */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, código o estante (ej: pintura, tubo, LED)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>

          {/* Filtro por estado de stock */}
          <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-500 mr-1 hidden sm:inline">Ver:</span>
            <button
              type="button"
              onClick={() => setSelectedStockStatus('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStockStatus === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({materials.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedStockStatus('DISPONIBLE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStockStatus === 'DISPONIBLE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Disponibles
            </button>

            <button
              type="button"
              onClick={() => setSelectedStockStatus('STOCK_BAJO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStockStatus === 'STOCK_BAJO'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              ⚠️ Stock Bajo ({metrics.total_stock_bajo})
            </button>

            <button
              type="button"
              onClick={() => setSelectedStockStatus('AGOTADO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStockStatus === 'AGOTADO'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              ⛔ Agotados ({metrics.total_agotados})
            </button>
          </div>
        </div>

        {/* Pestañas de Talleres */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100 scrollbar-thin">
          {TALLERES_CATEGORIAS.map((t) => {
            const Icon = t.icon;
            const isSelected = selectedTaller === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTaller(t.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          TABLA DE MATERIALES (ALTA LEGIBILIDAD, TEXTOS CLAROS Y ACCIONES GRANDES)
         ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-600">Cargando inventario de materiales...</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-base font-bold text-slate-800">No se encontraron materiales</p>
            <p className="text-xs text-slate-500">
              Pruebe cambiando los filtros de búsqueda o registre un nuevo material con el botón superior.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-extrabold border-b border-slate-800">
                  <th className="py-3.5 px-4">Código</th>
                  <th className="py-3.5 px-4">Descripción del Material / Insumo</th>
                  <th className="py-3.5 px-4">Taller / Especialidad</th>
                  <th className="py-3.5 px-4 text-center">Unidad</th>
                  <th className="py-3.5 px-4 text-center">Stock Mínimo</th>
                  <th className="py-3.5 px-4 text-center bg-slate-800">STOCK ACTUAL</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4">Ubicación Almacén</th>
                  <th className="py-3.5 px-4 text-center">Acciones Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-[13px]">
                {materials.map((m) => {
                  const isAgotado = m.stock_actual <= 0;
                  const isStockBajo = m.stock_actual > 0 && m.stock_actual <= m.stock_minimo;

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isAgotado
                          ? 'bg-rose-50/30'
                          : isStockBajo
                          ? 'bg-amber-50/30'
                          : ''
                      }`}
                    >
                      {/* Código */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600 whitespace-nowrap">
                        {m.codigo}
                      </td>

                      {/* Nombre del material */}
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-950 block">
                          {m.nombre}
                        </span>
                        {m.precio_unitario_estimado ? (
                          <span className="text-[11px] text-slate-500 font-medium">
                            Precio est.: S/ {Number(m.precio_unitario_estimado).toFixed(2)}
                          </span>
                        ) : null}
                      </td>

                      {/* Taller */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {m.categoria_taller}
                        </span>
                      </td>

                      {/* Unidad */}
                      <td className="py-3.5 px-4 text-center font-medium text-slate-600 whitespace-nowrap">
                        {m.unidad_medida}
                      </td>

                      {/* Stock Mínimo */}
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-500">
                        {m.stock_minimo}
                      </td>

                      {/* STOCK ACTUAL (PROMINENTE) */}
                      <td className="py-3.5 px-4 text-center font-mono font-black text-base sm:text-lg bg-slate-50/60 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-xl inline-block ${
                            isAgotado
                              ? 'bg-rose-600 text-white shadow-xs'
                              : isStockBajo
                              ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-300 shadow-xs'
                              : 'text-emerald-800 font-black'
                          }`}
                        >
                          {m.stock_actual}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isAgotado ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                            ⛔ AGOTADO
                          </span>
                        ) : isStockBajo ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                            ⚠️ STOCK BAJO
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ DISPONIBLE
                          </span>
                        )}
                      </td>

                      {/* Ubicación */}
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                        {m.ubicacion_almacen || 'Almacén Central'}
                      </td>

                      {/* Acciones Rápidas */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenMovementModal('ENTRADA', m)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                            title="Registrar Ingreso de Stock (+)"
                          >
                            <ArrowDownLeft className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenMovementModal('SALIDA', m)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-lg border border-rose-200 transition-colors cursor-pointer"
                            title="Registrar Salida para Orden de Trabajo (-)"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenKardex(m)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-700 text-slate-600 hover:text-white rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            title="Ver Historial de Movimientos (Kardex)"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(m)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg border border-blue-200 transition-colors cursor-pointer"
                            title="Editar Datos del Material"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>

      {/* =========================================================================
          MODAL: REGISTRAR MOVIMIENTO (ENTRADA / SALIDA)
         ========================================================================= */}
      {isMovementModalOpen && (
        <Modal
          isOpen={isMovementModalOpen}
          onClose={() => setIsMovementModalOpen(false)}
          title={
            movementType === 'ENTRADA'
              ? '🟢 Registrar Ingreso de Material / Compra'
              : '🔴 Registrar Salida de Material para Orden de Trabajo'
          }
          subtitle="Actualización inmediata de stock en el almacén de Servicios Generales"
          maxWidth="lg"
        >
          <form onSubmit={handleSubmitMovement} className="space-y-4">
            {/* Selección de Material */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Seleccionar Material / Insumo (*)
              </label>
              <select
                required
                value={movMaterialId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setMovMaterialId(id);
                  const found = materials.find((m) => m.id === id);
                  setSelectedMaterial(found || null);
                }}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white font-bold text-slate-900"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.codigo}] {m.nombre} • Stock Actual: {m.stock_actual} {m.unidad_medida} ({m.categoria_taller})
                  </option>
                ))}
              </select>
            </div>

            {selectedMaterial && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Taller:</span>
                  <span className="font-extrabold text-slate-800">{selectedMaterial.categoria_taller}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Stock Disponible:</span>
                  <span className="font-extrabold text-emerald-700 text-sm">{selectedMaterial.stock_actual} {selectedMaterial.unidad_medida}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Ubicación:</span>
                  <span className="font-extrabold text-slate-800">{selectedMaterial.ubicacion_almacen || 'Almacén'}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tipo de movimiento */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo de Operación (*)
                </label>
                <select
                  value={movTipo}
                  onChange={(e) => setMovTipo(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white font-semibold"
                >
                  {movementType === 'ENTRADA' ? (
                    <>
                      <option value="ENTRADA_COMPRA">Ingreso por Compra / Reabastecimiento</option>
                      <option value="ENTRADA_DEVOLUCION">Devolución de Material Sobrante de OT</option>
                    </>
                  ) : (
                    <>
                      <option value="SALIDA_OT">Salida para Orden de Trabajo (Campo / Taller)</option>
                      <option value="SALIDA_AJUSTE">Ajuste por Merma o Mantenimiento Interno</option>
                    </>
                  )}
                </select>
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cantidad a {movementType === 'ENTRADA' ? 'Ingresar' : 'Retirar'} (*)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  required
                  value={movCantidad}
                  onChange={(e) => setMovCantidad(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Si es salida por OT, pedir código de OT */}
            {movementType === 'SALIDA' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nº de Orden de Trabajo o Ticket (Opcional pero Recomendado)
                </label>
                <input
                  type="text"
                  value={movOrdenTrabajo}
                  onChange={(e) => setMovOrdenTrabajo(e.target.value)}
                  placeholder="Ej: OT-2026-0084 / TK-2026-0150"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs uppercase font-mono font-bold"
                />
              </div>
            )}

            {/* Motivo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motivo / Justificación
              </label>
              <input
                type="text"
                value={movMotivo}
                onChange={(e) => setMovMotivo(e.target.value)}
                placeholder="Ej: Reparación de tubería de agua en Pabellón Agronomía"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observaciones Adicionales
              </label>
              <textarea
                rows={2}
                value={movObservaciones}
                onChange={(e) => setMovObservaciones(e.target.value)}
                placeholder="Notas de entrega, persona que retira, etc..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            {/* Botones de acción */}
            <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsMovementModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={submittingMovement}
                className={`px-6 py-2.5 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                  movementType === 'ENTRADA'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submittingMovement
                  ? 'Guardando...'
                  : movementType === 'ENTRADA'
                  ? 'Confirmar Ingreso (+)'
                  : 'Confirmar Salida (-)'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: NUEVO MATERIAL EN EL INVENTARIO
         ========================================================================= */}
      {isNewMaterialModalOpen && (
        <Modal
          isOpen={isNewMaterialModalOpen}
          onClose={() => setIsNewMaterialModalOpen(false)}
          title="📦 Registrar Nuevo Material en Catálogo de Talleres"
          subtitle="Complete la información para dar de alta un nuevo insumo de Servicios Generales"
          maxWidth="lg"
        >
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre o Descripción del Material (*)
                </label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej: Pintura Látex Blanco Humo 5 Gal"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Código (Opcional)
                </label>
                <input
                  type="text"
                  value={formCodigo}
                  onChange={(e) => setFormCodigo(e.target.value)}
                  placeholder="Ej: MAT-PINT-005"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Taller / Especialidad (*)
                </label>
                <select
                  value={formTaller}
                  onChange={(e) => setFormTaller(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white font-bold"
                >
                  <option value="Electricidad">Electricidad</option>
                  <option value="Gasfitería">Gasfitería & Sanitaria</option>
                  <option value="Carpintería">Carpintería</option>
                  <option value="Mecánica Automotriz">Mecánica & Transporte</option>
                  <option value="Cerrajería">Cerrajería & Soldadura</option>
                  <option value="Pintura y Albañilería">Pintura & Albañilería</option>
                  <option value="Áreas Verdes">Áreas Verdes & Jardinería</option>
                  <option value="Limpieza y Saneamiento">Limpieza & Residuos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unidad de Medida (*)
                </label>
                <select
                  value={formUnidadMedida}
                  onChange={(e) => setFormUnidadMedida(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white font-bold"
                >
                  <option value="Unidad (und)">Unidad (und)</option>
                  <option value="Metro (m)">Metro (m)</option>
                  <option value="Galón (gal)">Galón (gal)</option>
                  <option value="Litro (L)">Litro (L)</option>
                  <option value="Bolsa">Bolsa</option>
                  <option value="Kilo (kg)">Kilo (kg)</option>
                  <option value="Rollo">Rollo</option>
                  <option value="Caja">Caja</option>
                  <option value="Plancha">Plancha</option>
                  <option value="Tubo (5m)">Tubo (5m)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Stock Inicial Físico (*)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  value={formStockInicial}
                  onChange={(e) => setFormStockInicial(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-black text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Stock Mínimo (Alerta) (*)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formStockMinimo}
                  onChange={(e) => setFormStockMinimo(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-amber-800 bg-amber-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Precio Est. Unitario (S/)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formPrecio}
                  onChange={(e) => setFormPrecio(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ubicación en Almacén / Taller
              </label>
              <input
                type="text"
                value={formUbicacion}
                onChange={(e) => setFormUbicacion(e.target.value)}
                placeholder="Ej: Almacén SG - Estante B-03 / Taller Carpintería"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewMaterialModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submittingForm}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {submittingForm ? 'Registrando...' : 'Dar de Alta Material'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: EDITAR MATERIAL
         ========================================================================= */}
      {isEditMaterialModalOpen && selectedMaterial && (
        <Modal
          isOpen={isEditMaterialModalOpen}
          onClose={() => setIsEditMaterialModalOpen(false)}
          title={`✏️ Editar Material: ${selectedMaterial.codigo}`}
          subtitle="Modifique la descripción, taller o stock mínimo del insumo"
          maxWidth="lg"
        >
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre o Descripción del Material (*)
              </label>
              <input
                type="text"
                required
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Taller / Especialidad (*)
                </label>
                <select
                  value={formTaller}
                  onChange={(e) => setFormTaller(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white font-bold"
                >
                  <option value="Electricidad">Electricidad</option>
                  <option value="Gasfitería">Gasfitería & Sanitaria</option>
                  <option value="Carpintería">Carpintería</option>
                  <option value="Mecánica Automotriz">Mecánica & Transporte</option>
                  <option value="Cerrajería">Cerrajería & Soldadura</option>
                  <option value="Pintura y Albañilería">Pintura & Albañilería</option>
                  <option value="Áreas Verdes">Áreas Verdes & Jardinería</option>
                  <option value="Limpieza y Saneamiento">Limpieza & Residuos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unidad de Medida (*)
                </label>
                <select
                  value={formUnidadMedida}
                  onChange={(e) => setFormUnidadMedida(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white font-bold"
                >
                  <option value="Unidad (und)">Unidad (und)</option>
                  <option value="Metro (m)">Metro (m)</option>
                  <option value="Galón (gal)">Galón (gal)</option>
                  <option value="Litro (L)">Litro (L)</option>
                  <option value="Bolsa">Bolsa</option>
                  <option value="Kilo (kg)">Kilo (kg)</option>
                  <option value="Rollo">Rollo</option>
                  <option value="Caja">Caja</option>
                  <option value="Plancha">Plancha</option>
                  <option value="Tubo (5m)">Tubo (5m)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Stock Mínimo de Alerta (*)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formStockMinimo}
                  onChange={(e) => setFormStockMinimo(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Precio Est. Unitario (S/)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formPrecio}
                  onChange={(e) => setFormPrecio(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ubicación en Almacén / Taller
              </label>
              <input
                type="text"
                value={formUbicacion}
                onChange={(e) => setFormUbicacion(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditMaterialModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submittingForm}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {submittingForm ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: KARDEX / HISTORIAL DE MOVIMIENTOS
         ========================================================================= */}
      {isKardexModalOpen && (
        <Modal
          isOpen={isKardexModalOpen}
          onClose={() => setIsKardexModalOpen(false)}
          title={
            selectedMaterial
              ? `📋 Kardex de Material: ${selectedMaterial.nombre}`
              : '📋 Historial General de Movimientos (Kardex)'
          }
          subtitle="Registro cronológico auditable de todas las entradas, salidas y usos en Órdenes de Trabajo"
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {loadingKardex ? (
              <div className="p-12 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-600">Cargando kardex de movimientos...</p>
              </div>
            ) : kardexMovements.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <History className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">Sin movimientos registrados</p>
                <p className="text-xs text-slate-500">
                  Aún no se han efectuado entradas o salidas para este material.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96 rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 text-white text-[10px] uppercase font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">Fecha</th>
                      <th className="p-2.5">Tipo Movimiento</th>
                      <th className="p-2.5">Material</th>
                      <th className="p-2.5 text-center">Cantidad</th>
                      <th className="p-2.5 text-center">Stock Resultante</th>
                      <th className="p-2.5">Nº OT / Motivo</th>
                      <th className="p-2.5">Responsable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {kardexMovements.map((mov) => {
                      const esEntrada =
                        mov.tipo_movimiento === 'ENTRADA_COMPRA' ||
                        mov.tipo_movimiento === 'ENTRADA_DEVOLUCION';

                      return (
                        <tr key={mov.id} className="hover:bg-slate-50/80">
                          <td className="p-2.5 whitespace-nowrap font-mono text-[11px] text-slate-500">
                            {new Date(mov.fecha).toLocaleString('es-PE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>

                          <td className="p-2.5 whitespace-nowrap">
                            {esEntrada ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                🟢 ENTRADA
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-800">
                                🔴 SALIDA (OT)
                              </span>
                            )}
                          </td>

                          <td className="p-2.5 font-bold text-slate-900">
                            {mov.material_nombre}
                          </td>

                          <td className="p-2.5 text-center font-mono font-black text-[13px]">
                            <span className={esEntrada ? 'text-emerald-700' : 'text-rose-700'}>
                              {esEntrada ? `+${mov.cantidad}` : `-${mov.cantidad}`}
                            </span>
                          </td>

                          <td className="p-2.5 text-center font-mono font-bold text-slate-900 bg-slate-50/50">
                            {mov.stock_nuevo}
                          </td>

                          <td className="p-2.5">
                            {mov.orden_trabajo_codigo && (
                              <span className="font-mono font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 block w-fit mb-0.5">
                                {mov.orden_trabajo_codigo}
                              </span>
                            )}
                            <span className="text-slate-600 block">{mov.motivo || '-'}</span>
                          </td>

                          <td className="p-2.5 text-slate-700 font-medium">
                            {mov.usuario_nombre || 'Personal SG'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setIsKardexModalOpen(false)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Cerrar Kardex
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
