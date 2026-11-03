import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { api, getAssetUrl } from '../services/api';
import { Ticket, ServiceCategory, Technician } from '../types';
import { ServiceRequestModal } from '../components/ServiceRequestModal';
import { WorkOrderModal } from '../components/WorkOrderModal';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardCheck,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  Eye,
  FileText,
  Wrench,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Building2,
  Layers,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

interface SGWorkOrdersHistoryPageProps {
  onSelectTicketDetail: (ticketId: number, ticketCode?: string, ticketStatus?: string) => void;
}

const MESES = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SETIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE',
];

export const SGWorkOrdersHistoryPage: React.FC<SGWorkOrdersHistoryPageProps> = ({
  onSelectTicketDetail,
}) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('ALL');
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterSection, setFilterSection] = useState<string>('ALL');
  const [filterRealizado, setFilterRealizado] = useState<string>('ALL'); // ALL, SI, NO, EN_PROCESO
  const [filterDependencia, setFilterDependencia] = useState<string>('ALL');
  const [filterTechnician, setFilterTechnician] = useState<string>('ALL');

  // Modals for Single Row Document View
  const [selectedServiceRequestTicket, setSelectedServiceRequestTicket] = useState<Ticket | null>(null);
  const [selectedWorkOrderTicket, setSelectedWorkOrderTicket] = useState<Ticket | null>(null);

  // Printable Audit Report Modal State
  const [showPrintableMatrixModal, setShowPrintableMatrixModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tickRes, catRes, techRes] = await Promise.all([
        api.getTickets({ modulo: 'SERVICIOS_GENERALES' }),
        api.getCategories(),
        api.getTechnicians(),
      ]);

      if (tickRes.success) {
        // Filtrar estrictamente solo los de Servicios Generales
        const sgList = (tickRes.data || []).filter((t: Ticket) => t.modulo === 'SERVICIOS_GENERALES');
        setTickets(sgList);
      }
      if (catRes.success) {
        const sgCats = (catRes.data || []).filter((c: ServiceCategory) => c.modulo === 'SERVICIOS_GENERALES');
        setCategories(sgCats);
      }
      if (techRes.success) {
        const sgTechs = (techRes.data || []).filter((tc: Technician) => tc.rol === 'TECNICO_SG' || tc.rol === 'SUPERVISOR_SG');
        setTechnicians(sgTechs);
      }
    } catch (err) {
      console.error('Error cargando historial de órdenes SG:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Formato N° Orden limpio (001-2026, 046-2026)
  const formatOrderNumber = (correlativo?: string) => {
    if (!correlativo) return '001-2026';
    const parts = correlativo.split('-');
    if (parts.length >= 3) {
      const year = parts[1];
      const num = parseInt(parts[2], 10);
      return `${String(num).padStart(3, '0')}-${year}`;
    }
    return correlativo;
  };

  // Obtener mes en texto
  const getMesName = (dateString?: string) => {
    if (!dateString) return 'ENERO';
    const d = new Date(dateString);
    return MESES[d.getMonth()] || 'ENERO';
  };

  // Formateo de fecha DD/MM/AAAA
  const formatDateSlash = (dateString?: string) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // Formateo de hora HH:MM:SS
  const formatTimeFull = (dateString?: string) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Dependencias únicas para el filtro
  const uniqueDependencias = useMemo(() => {
    const setDep = new Set<string>();
    tickets.forEach((t) => {
      if (t.solicitante_dependencia) setDep.add(t.solicitante_dependencia.trim());
    });
    return Array.from(setDep).sort();
  }, [tickets]);

  // Años únicos para el filtro
  const uniqueYears = useMemo(() => {
    const setY = new Set<string>();
    tickets.forEach((t) => {
      if (t.fecha_apertura) {
        setY.add(new Date(t.fecha_apertura).getFullYear().toString());
      }
    });
    setY.add(new Date().getFullYear().toString());
    return Array.from(setY).sort().reverse();
  }, [tickets]);

  // Filtrado de tickets para la matriz
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const d = t.fecha_apertura ? new Date(t.fecha_apertura) : new Date();
      const ticketMonth = MESES[d.getMonth()];
      const ticketYear = d.getFullYear().toString();

      // Filtro Mes
      if (filterMonth !== 'ALL' && ticketMonth !== filterMonth) return false;

      // Filtro Año
      if (filterYear !== 'ALL' && ticketYear !== filterYear) return false;

      // Filtro Sección / Categoría
      if (filterSection !== 'ALL' && t.categoria_nombre !== filterSection && String(t.categoria_id) !== filterSection) return false;

      // Filtro Realizado (Estado)
      if (filterRealizado === 'SI' && t.estado !== 'RESUELTO') return false;
      if (filterRealizado === 'NO' && t.estado !== 'REPORTADO') return false;
      if (filterRealizado === 'EN_PROCESO' && t.estado !== 'ASIGNADO') return false;

      // Filtro Dependencia
      if (filterDependencia !== 'ALL' && t.solicitante_dependencia !== filterDependencia) return false;

      // Filtro Técnico
      if (filterTechnician !== 'ALL' && String(t.tecnico_id) !== filterTechnician) return false;

      // Buscador Global
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const numOrden = formatOrderNumber(t.codigo_correlativo).toLowerCase();
        const matchTitle = t.titulo?.toLowerCase().includes(q);
        const matchDesc = t.descripcion?.toLowerCase().includes(q);
        const matchSol = t.solicitante_nombre?.toLowerCase().includes(q);
        const matchDep = t.solicitante_dependencia?.toLowerCase().includes(q);
        const matchTec = t.tecnico_nombre?.toLowerCase().includes(q);
        const matchCat = t.categoria_nombre?.toLowerCase().includes(q);
        const matchOfic = t.ubicacion_oficina?.toLowerCase().includes(q);

        if (!numOrden.includes(q) && !matchTitle && !matchDesc && !matchSol && !matchDep && !matchTec && !matchCat && !matchOfic) {
          return false;
        }
      }

      return true;
    });
  }, [
    tickets,
    filterMonth,
    filterYear,
    filterSection,
    filterRealizado,
    filterDependencia,
    filterTechnician,
    searchQuery,
  ]);

  // Exportar matriz a CSV Oficial con UTF-8 BOM
  const handleExportCSV = () => {
    let csv = '\uFEFF'; // BOM para compatibilidad con Excel en español
    csv += '==================================================================================================================================================\n';
    csv += 'UNIVERSIDAD NACIONAL AGRARIA LA MOLINA - DIRECCION GENERAL DE ADMINISTRACION\n';
    csv += 'UNIDAD DE SERVICIOS GENERALES Y MANTENIMIENTO - MATRIZ DE CONTROL Y SEGUIMIENTO DE ORDENES DE TRABAJO (HISTORIAL OCI)\n';
    csv += `Fecha de Reporte: ${new Date().toLocaleString('es-PE')} | Filtro Mes: ${filterMonth} | Filtro Año: ${filterYear}\n`;
    csv += '==================================================================================================================================================\n\n';

    // Cabeceras oficiales según el formato de la imagen
    const headers = [
      'FECHA',
      'ORDEN DE TRABAJO Nº',
      'Facultad/Programa/Ofic. Adm.',
      'Departamento / Área',
      'Solicitante',
      'Encargado de Sección',
      'Sección',
      'DESCRIPCIÓN DEL TRABAJO SOLICITADO',
      'Fecha inicio de trabajo',
      'Fecha fin de trabajo',
      'Kilometraje',
      'Hora inicio',
      'Hora fin',
      'Personal responsable de la ejecución del trabajo',
      'Informe sobre la ejecución de la orden de trabajo',
      'Materiales y aditivos adicionales',
      'REALIZADO',
      'MES',
    ];

    csv += headers.map((h) => `"${h}"`).join(',') + '\n';

    filteredTickets.forEach((t) => {
      const fechaSol = formatDateSlash(t.fecha_apertura);
      const numOrden = formatOrderNumber(t.codigo_correlativo);
      const facAdm = t.solicitante_dependencia || 'UNIDAD DE SERVICIOS GENERALES';
      const depArea = t.ubicacion_oficina || t.solicitante_dependencia || 'CAMPUS UNALM';
      const solicitante = t.solicitante_nombre || 'USUARIO SOLICITANTE';
      const encargadoSeccion = 'RUBINO BASTIDAS';
      const seccion = (t.categoria_nombre || 'SERVICIOS GENERALES').toUpperCase();
      const descTrabajo = `${t.titulo ? t.titulo + '. ' : ''}${t.descripcion || ''}`.replace(/"/g, '""');
      const fechaIni = t.fecha_primera_respuesta ? formatDateSlash(t.fecha_primera_respuesta) : fechaSol;
      const fechaFin = t.fecha_resolucion ? formatDateSlash(t.fecha_resolucion) : '-';
      const km = '-';
      const horaIni = t.fecha_primera_respuesta ? formatTimeFull(t.fecha_primera_respuesta) : '08:30:00';
      const horaFin = t.fecha_resolucion ? formatTimeFull(t.fecha_resolucion) : '-';
      const personal = t.tecnico_nombre || 'PERSONAL TÉCNICO SG';
      const informe = (t.solucion_detalle || 'EN ATENCIÓN').replace(/"/g, '""');
      const materiales = '01 INSUMOS Y HERRAMIENTAS DE TRABAJO';
      const realizado = t.estado === 'RESUELTO' ? 'SI' : t.estado === 'ASIGNADO' ? 'EN PROCESO' : 'NO';
      const mes = getMesName(t.fecha_apertura);

      const row = [
        fechaSol,
        numOrden,
        facAdm,
        depArea,
        solicitante,
        encargadoSeccion,
        seccion,
        descTrabajo,
        fechaIni,
        fechaFin,
        km,
        horaIni,
        horaFin,
        personal,
        informe,
        materiales,
        realizado,
        mes,
      ];

      csv += row.map((val) => `"${val}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Matriz_Control_Ordenes_Trabajo_SG_${filterMonth}_${filterYear}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalRegistros = filteredTickets.length;
  const totalRealizados = filteredTickets.filter((t) => t.estado === 'RESUELTO').length;
  const totalEnProceso = filteredTickets.filter((t) => t.estado === 'ASIGNADO').length;
  const totalPendientes = filteredTickets.filter((t) => t.estado === 'REPORTADO').length;

  return (
    <div className="space-y-6 w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 text-amber-400 font-black text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Módulo de Control y Seguimiento OCI • Servicios Generales UNALM</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Matriz de Órdenes de Trabajo e Historial de Talleres
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Consolidado oficial de solicitudes del área usuaria, asignación de especialistas en campo, ejecución técnica y actas de conformidad para control interno (OCI).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Refrescar matriz en tiempo real"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Excel (OCI)</span>
          </button>

          <button
            onClick={() => setShowPrintableMatrixModal(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-md transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Matriz Oficial</span>
          </button>
        </div>
      </div>

      {/* KPI Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Total Órdenes</span>
          <span className="text-2xl font-black text-slate-900 mt-0.5 block font-mono">{totalRegistros}</span>
          <span className="text-[11px] text-slate-400">En el período filtrado</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">Realizados (SI)</span>
          <span className="text-2xl font-black text-emerald-700 mt-0.5 block font-mono">{totalRealizados}</span>
          <span className="text-[11px] text-emerald-600 font-medium">Concluidos con informe</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 block">En Proceso / Campo</span>
          <span className="text-2xl font-black text-blue-700 mt-0.5 block font-mono">{totalEnProceso}</span>
          <span className="text-[11px] text-blue-600 font-medium">Asignados a técnicos</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block">Pendientes / No</span>
          <span className="text-2xl font-black text-amber-700 mt-0.5 block font-mono">{totalPendientes}</span>
          <span className="text-[11px] text-amber-600 font-medium">Por generar OT</span>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2 text-slate-800 font-black text-xs uppercase tracking-wider">
            <SlidersHorizontal className="w-4 h-4 text-amber-600" />
            <span>Filtros de Búsqueda y Fiscalización (OCI)</span>
          </div>

          <button
            onClick={() => {
              setSearchQuery('');
              setFilterMonth('ALL');
              setFilterYear(new Date().getFullYear().toString());
              setFilterSection('ALL');
              setFilterRealizado('ALL');
              setFilterDependencia('ALL');
              setFilterTechnician('ALL');
            }}
            className="text-[11px] font-bold text-amber-800 hover:text-amber-900 transition-colors"
          >
            Limpiar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Buscador Global */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por N° OT, Solicitante, Placa, Título..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Filtro Mes */}
          <div>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-bold text-slate-800"
            >
              <option value="ALL">Todos los Meses</option>
              {MESES.map((m) => (
                <option key={m} value={m}>
                  MES: {m}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Año */}
          <div>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-bold text-slate-800 font-mono"
            >
              <option value="ALL">Todos los Años</option>
              {uniqueYears.map((y) => (
                <option key={y} value={y}>
                  AÑO: {y}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Sección / Taller */}
          <div>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-bold text-slate-800"
            >
              <option value="ALL">Todas las Secciones / Talleres</option>
              {categories.map((c) => (
                <option key={c.id} value={c.nombre}>
                  {c.nombre.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Estado / Realizado */}
          <div>
            <select
              value={filterRealizado}
              onChange={(e) => setFilterRealizado(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-bold text-slate-800"
            >
              <option value="ALL">Todos los Estados (REALIZADO)</option>
              <option value="SI">REALIZADO: SÍ (Concluidos)</option>
              <option value="EN_PROCESO">REALIZADO: EN PROCESO (En Campo)</option>
              <option value="NO">REALIZADO: NO (Pendientes)</option>
            </select>
          </div>

          {/* Filtro Dependencia */}
          <div>
            <select
              value={filterDependencia}
              onChange={(e) => setFilterDependencia(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800"
            >
              <option value="ALL">Todas las Dependencias / Facultades</option>
              {uniqueDependencias.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Técnico */}
          <div>
            <select
              value={filterTechnician}
              onChange={(e) => setFilterTechnician(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800"
            >
              <option value="ALL">Todos los Técnicos / Personal</option>
              {technicians.map((tec) => (
                <option key={tec.id} value={tec.id}>
                  {tec.nombres} {tec.apellidos}
                </option>
              ))}
            </select>
          </div>

          {/* Contador de Resultados */}
          <div className="flex items-center justify-center p-2 bg-amber-50 rounded-xl border border-amber-200 text-xs font-bold text-amber-900">
            <span>Mostrando {filteredTickets.length} de {tickets.length} órdenes</span>
          </div>
        </div>
      </div>

      {/* Matriz Table (Idéntica a la Hoja de Control de la Imagen) */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans min-w-[1600px]">
            <thead>
              <tr className="bg-[#0f4c64] text-white font-bold text-[11px] uppercase tracking-wider border-b border-[#0a3547]">
                <th className="py-3 px-3 border-r border-[#19607d] w-24">FECHA</th>
                <th className="py-3 px-3 border-r border-[#19607d] w-28">ORDEN DE TRABAJO Nº</th>
                <th className="py-3 px-3 border-r border-[#19607d] w-48">Facultad/Programa/Ofic. Adm</th>
                <th className="py-3 px-3 border-r border-[#19607d] w-40">Departamento / Área</th>
                <th className="py-3 px-3 border-r border-[#19607d] w-44">Solicitante</th>
                <th className="py-3 px-3 border-r border-[#19607d] w-40">Encargado de Sección</th>
                <th className="py-3 px-3 border-r border-[#19607d] w-36">Sección</th>
                <th className="py-3 px-3 border-r border-[#19607d] w-72">3. DESCRIPCIÓN DEL TRABAJO SOLICITADO</th>
                <th className="py-3 px-3 border-r border-[#19607d] w-24 text-center">Fecha inicio trabajo</th>
                <th className="py-3 px-3 border-r border-[#19607d] w-24 text-center">Fecha fin trabajo</th>
                <th className="py-3 px-3 border-r border-[#19607d] w-20 text-center">Kilometraje</th>
                <th className="py-3 px-3 border-r border-[#19607d] w-20 text-center">hora inicio</th>
                <th className="py-3 px-3 border-r border-[#19607d] w-20 text-center">hora fin</th>
                <th className="py-3 px-3 border-r border-[#19607d] w-44">Personal responsable ejecución</th>
                <th className="py-3 px-3 border-r border-[#19607d] w-64">Informe sobre ejecución OT</th>
                <th className="py-3 px-3 border-r border-[#19607d] w-48">Materiales y aditivos</th>
                <th className="py-3 px-3 border-r border-[#19607d] w-24 text-center">REALIZADO</th>
                <th className="py-3 px-3 border-r border-[#19607d] w-24 text-center">MES</th>
                <th className="py-3 px-3 text-center w-36 sticky right-0 bg-[#0f4c64] shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.3)]">ACCIONES</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-slate-800 text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={19} className="py-12 text-center text-slate-400 font-semibold">
                    Cargando matriz de órdenes de trabajo de Servicios Generales...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={19} className="py-12 text-center text-slate-400 font-semibold space-y-2">
                    <ClipboardCheck className="w-10 h-10 mx-auto text-slate-300" />
                    <p>No se encontraron registros de órdenes con los filtros seleccionados.</p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t, idx) => {
                  const numOrden = formatOrderNumber(t.codigo_correlativo);
                  const mes = getMesName(t.fecha_apertura);
                  const isRealizado = t.estado === 'RESUELTO';
                  const isEnProceso = t.estado === 'ASIGNADO';

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-amber-50/40 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      {/* 1. FECHA */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-mono whitespace-nowrap">
                        {formatDateSlash(t.fecha_apertura)}
                      </td>

                      {/* 2. ORDEN DE TRABAJO Nº */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-mono font-bold text-slate-950 whitespace-nowrap">
                        <span className="bg-amber-100 text-amber-950 px-2 py-0.5 rounded border border-amber-300">
                          {numOrden}
                        </span>
                      </td>

                      {/* 3. Facultad / Programa / Ofic. Adm */}
                      <td className="py-2.5 px-3 border-r border-slate-200 uppercase font-medium">
                        {t.solicitante_dependencia || 'UNIDAD DE SERVICIOS GENERALES'}
                      </td>

                      {/* 4. Departamento / Área */}
                      <td className="py-2.5 px-3 border-r border-slate-200 uppercase text-slate-700">
                        {t.ubicacion_oficina || t.solicitante_dependencia || 'CAMPUS UNALM'}
                      </td>

                      {/* 5. Solicitante */}
                      <td className="py-2.5 px-3 border-r border-slate-200 uppercase font-bold text-slate-950">
                        {t.solicitante_nombre || 'USUARIO SOLICITANTE'}
                      </td>

                      {/* 6. Encargado de Sección */}
                      <td className="py-2.5 px-3 border-r border-slate-200 uppercase font-bold text-slate-900">
                        RUBINO BASTIDAS
                      </td>

                      {/* 7. Sección */}
                      <td className="py-2.5 px-3 border-r border-slate-200 uppercase font-black text-amber-900 whitespace-nowrap">
                        {t.categoria_nombre || 'SERVICIOS GENERALES'}
                      </td>

                      {/* 8. DESCRIPCIÓN DEL TRABAJO SOLICITADO */}
                      <td className="py-2.5 px-3 border-r border-slate-200 uppercase text-slate-900 leading-relaxed font-medium">
                        <span className="font-bold">{t.titulo ? `${t.titulo}. ` : ''}</span>
                        {t.descripcion}
                      </td>

                      {/* 9. Fecha inicio */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-center whitespace-nowrap">
                        {t.fecha_primera_respuesta ? formatDateSlash(t.fecha_primera_respuesta) : formatDateSlash(t.fecha_apertura)}
                      </td>

                      {/* 10. Fecha fin */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-center whitespace-nowrap">
                        {t.fecha_resolucion ? formatDateSlash(t.fecha_resolucion) : '-'}
                      </td>

                      {/* 11. Kilometraje */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-center text-slate-400">
                        -
                      </td>

                      {/* 12. Hora inicio */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-center whitespace-nowrap">
                        {t.fecha_primera_respuesta ? formatTimeFull(t.fecha_primera_respuesta) : '08:30:00'}
                      </td>

                      {/* 13. Hora fin */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-center whitespace-nowrap">
                        {t.fecha_resolucion ? formatTimeFull(t.fecha_resolucion) : '-'}
                      </td>

                      {/* 14. Personal responsable ejecución */}
                      <td className="py-2.5 px-3 border-r border-slate-200 uppercase font-bold text-slate-900">
                        {t.tecnico_nombre || 'PERSONAL TÉCNICO SG'}
                      </td>

                      {/* 15. Informe sobre ejecución OT */}
                      <td className="py-2.5 px-3 border-r border-slate-200 uppercase text-slate-800 leading-relaxed">
                        {t.solucion_detalle ? (
                          <span className="text-emerald-900 font-medium">{t.solucion_detalle}</span>
                        ) : (
                          <span className="text-slate-400 italic">EN EJECUCIÓN / CAMPO</span>
                        )}
                      </td>

                      {/* 16. Materiales y aditivos adicionales */}
                      <td className="py-2.5 px-3 border-r border-slate-200 uppercase text-slate-700">
                        01 INSUMOS, REPUESTOS Y HERRAMIENTAS DE TALLER
                      </td>

                      {/* 17. REALIZADO */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold font-mono">
                        {isRealizado ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px]">
                            SI
                          </span>
                        ) : isEnProceso ? (
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300 text-[10px]">
                            EN PROCESO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 text-[10px]">
                            NO
                          </span>
                        )}
                      </td>

                      {/* 18. MES */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold uppercase text-slate-700 whitespace-nowrap">
                        {mes}
                      </td>

                      {/* 19. ACCIONES */}
                      <td className="py-2.5 px-3 text-center space-x-1 whitespace-nowrap sticky right-0 bg-white group-hover:bg-amber-50/40 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.05)]">
                        <button
                          type="button"
                          onClick={() => setSelectedServiceRequestTicket(t)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                          title="Ver / Imprimir Solicitud del Área Usuaria"
                        >
                          📄 Solicitud
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedWorkOrderTicket(t)}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                          title="Ver / Imprimir Orden de Trabajo Oficial SG"
                        >
                          📋 OT
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectTicketDetail(t.id, t.codigo_correlativo, t.estado)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                          title="Ver Detalle Completo del Requerimiento"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Previsualización de Solicitud del Área Usuaria */}
      {selectedServiceRequestTicket && (
        <ServiceRequestModal
          isOpen={!!selectedServiceRequestTicket}
          onClose={() => setSelectedServiceRequestTicket(null)}
          ticket={selectedServiceRequestTicket}
        />
      )}

      {/* Modal: Previsualización de Orden de Trabajo Oficial */}
      {selectedWorkOrderTicket && (
        <WorkOrderModal
          isOpen={!!selectedWorkOrderTicket}
          onClose={() => setSelectedWorkOrderTicket(null)}
          ticket={selectedWorkOrderTicket}
        />
      )}

      {/* Modal / Vista Imprimible Horizontal para Fiscalización OCI */}
      {showPrintableMatrixModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static"
          style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
        >
          <div className="bg-white w-full max-w-[1500px] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full">
            
            {/* Header del Modal Imprimible (Oculto en Print) */}
            <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
              <div className="flex items-center space-x-2">
                <span className="p-2 bg-amber-500/20 text-amber-300 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Matriz Oficial de Control OCI - Servicios Generales</h3>
                  <p className="text-[11px] text-slate-400">Formato horizontal institucional para fiscalización y archivo de gestión</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Guardar PDF</span>
                </button>
                <button
                  onClick={() => setShowPrintableMatrixModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Documento Imprimible Horizontal */}
            <div className="p-6 sm:p-10 overflow-y-auto print:overflow-visible print:p-0 text-slate-900 space-y-4 text-[10px] leading-tight bg-white">
              
              {/* Header Institucional UNALM */}
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <img
                    src="./escudo-color.png"
                    alt="Escudo UNALM"
                    className="w-12 h-14 object-contain shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/escudo-color.png';
                    }}
                  />
                  <div>
                    <h2 className="font-black text-xs uppercase text-slate-950">
                      UNIVERSIDAD NACIONAL AGRARIA LA MOLINA
                    </h2>
                    <h3 className="font-bold text-[11px] uppercase text-slate-800">
                      DIRECCIÓN GENERAL DE ADMINISTRACIÓN • UNIDAD DE SERVICIOS GENERALES
                    </h3>
                    <p className="text-[9px] text-slate-500 font-semibold">
                      MATRIZ OFICIAL DE CONTROL Y SEGUIMIENTO DE ÓRDENES DE TRABAJO (HISTORIAL OCI)
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono text-[9px] text-slate-600">
                  <span className="block font-bold">PERÍODO: {filterMonth} - {filterYear}</span>
                  <span className="block">Fecha de Emisión: {new Date().toLocaleDateString('es-PE')}</span>
                  <span className="block font-bold text-slate-900">Total Órdenes: {filteredTickets.length}</span>
                </div>
              </div>

              {/* Tabla Impresa idéntica al formato físico de la imagen */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[9px] border border-slate-900 border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-950 font-bold border-b border-slate-900 uppercase">
                      <th className="py-1 px-1.5 border-r border-slate-900">FECHA</th>
                      <th className="py-1 px-1.5 border-r border-slate-900">ORDEN DE TRABAJO Nº</th>
                      <th className="py-1 px-1.5 border-r border-slate-900">Facultad/Programa/Ofic. Adm</th>
                      <th className="py-1 px-1.5 border-r border-slate-900">Departamento / Área</th>
                      <th className="py-1 px-1.5 border-r border-slate-900">Solicitante</th>
                      <th className="py-1 px-1.5 border-r border-slate-900">Encargado Sección</th>
                      <th className="py-1 px-1.5 border-r border-slate-900">Sección</th>
                      <th className="py-1 px-1.5 border-r border-slate-900">3. DESCRIPCIÓN TRABAJO</th>
                      <th className="py-1 px-1.5 border-r border-slate-900 text-center">F. Inicio</th>
                      <th className="py-1 px-1.5 border-r border-slate-900 text-center">F. Fin</th>
                      <th className="py-1 px-1.5 border-r border-slate-900 text-center">H. Inicio</th>
                      <th className="py-1 px-1.5 border-r border-slate-900 text-center">H. Fin</th>
                      <th className="py-1 px-1.5 border-r border-slate-900">Personal Responsable</th>
                      <th className="py-1 px-1.5 border-r border-slate-900">Informe sobre ejecución</th>
                      <th className="py-1 px-1.5 border-r border-slate-900">Materiales adicionales</th>
                      <th className="py-1 px-1.5 border-r border-slate-900 text-center">REALIZADO</th>
                      <th className="py-1 px-1.5 text-center">MES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-400">
                    {filteredTickets.map((t) => (
                      <tr key={t.id} className="border-b border-slate-300">
                        <td className="py-1 px-1.5 border-r border-slate-300 font-mono whitespace-nowrap">{formatDateSlash(t.fecha_apertura)}</td>
                        <td className="py-1 px-1.5 border-r border-slate-300 font-mono font-bold whitespace-nowrap">{formatOrderNumber(t.codigo_correlativo)}</td>
                        <td className="py-1 px-1.5 border-r border-slate-300 uppercase">{t.solicitante_dependencia}</td>
                        <td className="py-1 px-1.5 border-r border-slate-300 uppercase">{t.ubicacion_oficina || t.solicitante_dependencia}</td>
                        <td className="py-1 px-1.5 border-r border-slate-300 uppercase font-bold">{t.solicitante_nombre}</td>
                        <td className="py-1 px-1.5 border-r border-slate-300 uppercase">RUBINO BASTIDAS</td>
                        <td className="py-1 px-1.5 border-r border-slate-300 uppercase font-bold">{t.categoria_nombre}</td>
                        <td className="py-1 px-1.5 border-r border-slate-300 uppercase">{t.descripcion}</td>
                        <td className="py-1 px-1.5 border-r border-slate-300 font-mono text-center">{t.fecha_primera_respuesta ? formatDateSlash(t.fecha_primera_respuesta) : formatDateSlash(t.fecha_apertura)}</td>
                        <td className="py-1 px-1.5 border-r border-slate-300 font-mono text-center">{t.fecha_resolucion ? formatDateSlash(t.fecha_resolucion) : '-'}</td>
                        <td className="py-1 px-1.5 border-r border-slate-300 font-mono text-center">{t.fecha_primera_respuesta ? formatTimeFull(t.fecha_primera_respuesta) : '08:30:00'}</td>
                        <td className="py-1 px-1.5 border-r border-slate-300 font-mono text-center">{t.fecha_resolucion ? formatTimeFull(t.fecha_resolucion) : '-'}</td>
                        <td className="py-1 px-1.5 border-r border-slate-300 uppercase font-bold">{t.tecnico_nombre || 'PERSONAL SG'}</td>
                        <td className="py-1 px-1.5 border-r border-slate-300 uppercase">{t.solucion_detalle || 'EN ATENCIÓN'}</td>
                        <td className="py-1 px-1.5 border-r border-slate-300 uppercase">01 INSUMOS Y HERRAMIENTAS</td>
                        <td className="py-1 px-1.5 border-r border-slate-300 font-bold text-center">{t.estado === 'RESUELTO' ? 'SI' : t.estado === 'ASIGNADO' ? 'EN PROCESO' : 'NO'}</td>
                        <td className="py-1 px-1.5 text-center font-bold uppercase">{getMesName(t.fecha_apertura)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Firmas de Control y Fiscalización OCI */}
              <div className="pt-8 grid grid-cols-2 gap-16 text-center text-[10px] avoid-page-break">
                <div className="border-t border-slate-900 pt-1 space-y-0.5">
                  <span className="font-bold text-slate-950 block uppercase">Jefatura de Unidad de Servicios Generales</span>
                  <span className="text-slate-500 block text-[9px]">Mg. Necker Rutilio Linares Melgarejo</span>
                </div>

                <div className="border-t border-slate-900 pt-1 space-y-0.5">
                  <span className="font-bold text-slate-950 block uppercase">Órgano de Control Institucional (OCI)</span>
                  <span className="text-slate-500 block text-[9px]">Auditoría y Fiscalización Gubernamental UNALM</span>
                </div>
              </div>

            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
