import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatusBadge } from '../components/Badge';
import { EquipmentHistoryModal } from '../components/EquipmentHistoryModal';
import { EquipmentLookupModal } from '../components/EquipmentLookupModal';
import {
  Laptop,
  Search,
  RefreshCw,
  Building2,
  User,
  Wrench,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter,
  Inbox,
  ShieldCheck,
  Layers,
} from 'lucide-react';

interface EquipmentSummaryItem {
  numero_inventario: string;
  total_tickets: number;
  tickets_resueltos: number;
  tickets_activos: number;
  ultima_atencion: string;
  ultimo_ticket_codigo: string;
  ultimo_ticket_id: number;
  ultimo_ticket_estado: string;
  ultimo_ticket_titulo: string;
  ultima_dependencia: string;
  ultimo_solicitante: string;
  ultimo_tecnico: string;
  ultima_categoria: string;
  ultimo_modulo: 'OTIC' | 'SERVICIOS_GENERALES';
}

interface AdminEquipmentPageProps {
  onSelectTicketDetail?: (ticketId: number, ticketCode?: string, ticketStatus?: string) => void;
}

export const AdminEquipmentPage: React.FC<AdminEquipmentPageProps> = ({ onSelectTicketDetail }) => {
  const [items, setItems] = useState<EquipmentSummaryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedModulo, setSelectedModulo] = useState<string>('ALL');
  const [selectedEstado, setSelectedEstado] = useState<string>('ALL');

  // Modales
  const [selectedInventoryForHistory, setSelectedInventoryForHistory] = useState<string | null>(null);
  const [isLookupModalOpen, setIsLookupModalOpen] = useState<boolean>(false);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.getEquipmentSummary({
        search: search.trim() || undefined,
        modulo: selectedModulo !== 'ALL' ? selectedModulo : undefined,
        estado: selectedEstado !== 'ALL' ? selectedEstado : undefined,
      });
      if (res.success && Array.isArray(res.data)) {
        setItems(res.data);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Error fetching equipment summary:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSummary();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedModulo, selectedEstado]);

  // Cálculos para KPIs superiores
  const totalBienes = items.length;
  const totalAtenciones = items.reduce((acc, curr) => acc + Number(curr.total_tickets || 0), 0);
  const bienesEnAtencionActiva = items.filter((i) => Number(i.tickets_activos) > 0).length;
  const bienesConcluidos = items.filter((i) => Number(i.tickets_activos) === 0).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado Principal */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs transition-colors duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-2xl shrink-0 shadow-xs border border-blue-200 dark:border-blue-800/60">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Bienes y Equipos Institucionales
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Trazabilidad Patrimonial
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Control de bienes patrimoniales con intervenciones técnicas, trazabilidad de mantenimiento y consulta rápida de hoja de vida.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsLookupModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer active:scale-95 text-left"
              title="Consultar Historial de Bien Institucional • Módulo de consulta rápida de hoja de vida y atenciones técnicas por código patrimonial"
            >
              <Search className="w-4 h-4 shrink-0" />
              <span>Consultar Historial de Bien</span>
            </button>

            <button
              type="button"
              onClick={fetchSummary}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Actualizar listado de bienes"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tarjetas KPI de Resumen */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
              Bienes Registrados
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{totalBienes}</span>
              <span className="text-[10px] text-slate-400 font-medium">con atenciones</span>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200/70 dark:border-blue-900/40">
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 block uppercase">
              Total Mantenimientos
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-blue-900 dark:text-blue-200">{totalAtenciones}</span>
              <span className="text-[10px] text-blue-500 font-medium">tickets enlazados</span>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/70 dark:border-amber-900/40">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block uppercase">
              En Atención Activa
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-amber-900 dark:text-amber-200">{bienesEnAtencionActiva}</span>
              <span className="text-[10px] text-amber-600 font-medium">en proceso</span>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/70 dark:border-emerald-900/40">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block uppercase">
              Operativos / Concluidos
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-emerald-900 dark:text-emerald-200">{bienesConcluidos}</span>
              <span className="text-[10px] text-emerald-600 font-medium">al 100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código patrimonial, ticket, solicitante o dependencia..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setSelectedModulo('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex-1 md:flex-initial ${
                selectedModulo === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setSelectedModulo('OTIC')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex-1 md:flex-initial ${
                selectedModulo === 'OTIC'
                  ? 'bg-white dark:bg-slate-900 text-unalm-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              OTIC
            </button>
            <button
              type="button"
              onClick={() => setSelectedModulo('SERVICIOS_GENERALES')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex-1 md:flex-initial ${
                selectedModulo === 'SERVICIOS_GENERALES'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Serv. Generales
            </button>
          </div>

          <select
            value={selectedEstado}
            onChange={(e) => setSelectedEstado(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="ACTIVO">Con Mantenimiento Activo</option>
            <option value="RESUELTO">Con Mantenimiento Concluido</option>
          </select>
        </div>
      </div>

      {/* Contenido: Listado de Bienes */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <p className="text-xs font-bold">Cargando bienes y trazabilidad de atenciones...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Laptop className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No hay bienes con mantenimientos registrados actualmente
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Los bienes institucionales aparecen automáticamente listados en este panel conforme los usuarios o técnicos registren tickets indicando el código patrimonial o N° de inventario del equipo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsLookupModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Consultar por Código de Inventario</span>
            </button>
          </div>
        ) : (
          <>
            {/* Tabla en Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3.5 px-4">CÓDIGO PATRIMONIAL / INVENTARIO</th>
                    <th className="py-3.5 px-3">MÓDULO</th>
                    <th className="py-3.5 px-4">ÚLTIMO REQUERIMIENTO / ATENCIÓN</th>
                    <th className="py-3.5 px-4">DEPENDENCIA & SOLICITANTE</th>
                    <th className="py-3.5 px-3">ESPECIALISTA ASIGNADO</th>
                    <th className="py-3.5 px-3 text-center">HISTORIAL</th>
                    <th className="py-3.5 px-3 text-center">ESTADO</th>
                    <th className="py-3.5 px-4 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {items.map((item) => (
                    <tr
                      key={item.numero_inventario}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                            <Laptop className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-mono font-black text-slate-900 dark:text-white block text-xs tracking-tight">
                              {item.numero_inventario}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium truncate block max-w-[150px]">
                              {item.ultima_categoria || 'Bien Institucional'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            item.ultimo_modulo === 'OTIC'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {item.ultimo_modulo === 'OTIC' ? 'OTIC' : 'SERV. GEN.'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                              {item.ultimo_ticket_codigo}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(item.ultima_atencion).toLocaleDateString()}</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px] font-medium mt-0.5" title={item.ultimo_ticket_titulo}>
                            {item.ultimo_ticket_titulo}
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[200px]" title={item.ultima_dependencia}>
                            {item.ultima_dependencia || 'Comunidad UNALM'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium truncate block max-w-[200px]">
                            {item.ultimo_solicitante}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300">
                          <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[150px] font-medium">
                            {item.ultimo_tecnico || 'Sin asignar'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          <FileText className="w-3 h-3" />
                          <span>{item.total_tickets} {Number(item.total_tickets) === 1 ? 'atención' : 'atenciones'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <StatusBadge status={item.ultimo_ticket_estado as any} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedInventoryForHistory(item.numero_inventario)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 transition-colors flex items-center space-x-1 cursor-pointer"
                            title="Ver Hoja de Vida e Historial Completo del Bien"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Hoja de Vida</span>
                          </button>

                          {onSelectTicketDetail && item.ultimo_ticket_id && (
                            <button
                              type="button"
                              onClick={() => onSelectTicketDetail(item.ultimo_ticket_id, item.ultimo_ticket_codigo, item.ultimo_ticket_estado)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                              title="Ver detalle del último ticket de este equipo"
                            >
                              <span>Ticket</span>
                              <ChevronRight className="w-3.5 h-3.5 inline ml-0.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista en Tarjetas para Móviles */}
            <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
              {items.map((item) => (
                <div key={item.numero_inventario} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-mono font-black text-slate-900 dark:text-white text-xs block">
                          {item.numero_inventario}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {item.ultima_categoria || 'Bien Institucional'}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={item.ultimo_ticket_estado as any} />
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                      <span className="font-bold">Último Ticket:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {item.ultimo_ticket_codigo} ({new Date(item.ultima_atencion).toLocaleDateString()})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate">
                      {item.ultimo_ticket_titulo}
                    </p>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                      <span>Dependencia:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                        {item.ultima_dependencia}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                      {item.total_tickets} {Number(item.total_tickets) === 1 ? 'atención' : 'atenciones'}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedInventoryForHistory(item.numero_inventario)}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800 flex items-center space-x-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Hoja de Vida</span>
                      </button>
                      {onSelectTicketDetail && item.ultimo_ticket_id && (
                        <button
                          type="button"
                          onClick={() => onSelectTicketDetail(item.ultimo_ticket_id, item.ultimo_ticket_codigo, item.ultimo_ticket_estado)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Ticket</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal de Hoja de Vida / Historial Completo del Bien */}
      {selectedInventoryForHistory && (
        <EquipmentHistoryModal
          isOpen={Boolean(selectedInventoryForHistory)}
          onClose={() => setSelectedInventoryForHistory(null)}
          numeroInventario={selectedInventoryForHistory}
          onSelectTicketDetail={onSelectTicketDetail}
        />
      )}

      {/* Modal de Búsqueda Rápida de Bien Patrimonial */}
      {isLookupModalOpen && (
        <EquipmentLookupModal
          isOpen={isLookupModalOpen}
          onClose={() => setIsLookupModalOpen(false)}
          onSelectTicketDetail={onSelectTicketDetail}
        />
      )}
    </div>
  );
};

