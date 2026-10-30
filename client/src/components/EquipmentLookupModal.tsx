import React, { useState } from 'react';
import { Modal } from './Modal';
import { EquipmentHistoryModal } from './EquipmentHistoryModal';
import { Laptop, Search, AlertCircle } from 'lucide-react';

interface EquipmentLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTicketDetail?: (ticketId: number) => void;
}

export const EquipmentLookupModal: React.FC<EquipmentLookupModalProps> = ({
  isOpen,
  onClose,
  onSelectTicketDetail,
}) => {
  const [inventarioInput, setInventarioInput] = useState('');
  const [activeSearchCode, setActiveSearchCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inventarioInput.trim();
    if (!clean) {
      setError('Por favor ingrese el N° de inventario o código patrimonial');
      return;
    }
    setError(null);
    setActiveSearchCode(clean);
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !activeSearchCode}
        onClose={onClose}
        title="Consultar Historial de Bien Institucional"
        subtitle="Módulo de consulta rápida de hoja de vida y atenciones técnicas por código patrimonial"
        maxWidth="md"
      >
        <form onSubmit={handleSearch} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-2xl flex items-center space-x-3 text-xs text-blue-950 dark:text-blue-200">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <p className="leading-relaxed">
              Ingrese el código patrimonial o número de inventario que figura en el equipo institucional para revisar todas sus atenciones pasadas.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              N° de Inventario / Código Patrimonial *
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                required
                value={inventarioInput}
                onChange={(e) => {
                  setInventarioInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ej: 740895000012, PC-LAB-01, IMP-DIR-04..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-unalm-500 focus:outline-none placeholder-slate-400"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar Atenciones</span>
            </button>
          </div>
        </form>
      </Modal>

      {activeSearchCode && (
        <EquipmentHistoryModal
          isOpen={Boolean(activeSearchCode)}
          onClose={() => {
            setActiveSearchCode(null);
            onClose();
          }}
          numeroInventario={activeSearchCode}
          onSelectTicketDetail={onSelectTicketDetail}
        />
      )}
    </>
  );
};

