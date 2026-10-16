import React, { useState, useRef, useEffect } from 'react';
import { Search, UserCheck, ChevronDown, X, Wrench, Shield, Laptop } from 'lucide-react';
import { User } from '../types';

interface SearchableTechnicianSelectProps {
  technicians: User[];
  selectedTechId: number | '' | null;
  onSelect: (techId: number | '') => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const SearchableTechnicianSelect: React.FC<SearchableTechnicianSelectProps> = ({
  technicians,
  selectedTechId,
  onSelect,
  placeholder = 'Buscar y seleccionar especialista...',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedTech = technicians.find((t) => t.id === Number(selectedTechId));

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Multi-token fuzzy filter (matches all words typed in any order)
  const filteredTechs = technicians.filter((t) => {
    if (!searchTerm.trim()) return true;
    const tokens = searchTerm.toLowerCase().trim().split(/\s+/);
    const targetString = `${t.nombres} ${t.apellidos} ${t.email} ${t.facultadDependencia || ''} ${t.telefono || ''} ${t.rolNombre || ''} ${t.rol || ''}`.toLowerCase();
    return tokens.every((token) => targetString.includes(token));
  });

  const getSpecialtyBadge = (facultad?: string, rol?: string) => {
    const text = (facultad || '').toLowerCase();
    if (text.includes('electricidad')) return { label: 'Electricidad', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
    if (text.includes('gasfiter')) return { label: 'Gasfitería', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
    if (text.includes('herreria') || text.includes('cerraj')) return { label: 'Herrería/Cerrajería', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
    if (text.includes('pintura')) return { label: 'Pintura', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
    if (text.includes('carpinter')) return { label: 'Carpintería', bg: 'bg-orange-100 text-orange-800 border-orange-300' };
    if (text.includes('albanil')) return { label: 'Albañilería', bg: 'bg-stone-100 text-stone-800 border-stone-300' };
    if (text.includes('parque') || text.includes('jardin') || text.includes('paisajismo')) return { label: 'Áreas Verdes', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (text.includes('riego')) return { label: 'Riego', bg: 'bg-cyan-100 text-cyan-800 border-cyan-300' };
    if (text.includes('residuo') || text.includes('maleza') || text.includes('limpieza')) return { label: 'Saneamiento', bg: 'bg-teal-100 text-teal-800 border-teal-300' };
    if (text.includes('mecanica')) return { label: 'Mecánica', bg: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    if (rol === 'ESPECIALISTA_REDES') return { label: 'Redes y Conectividad', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (rol === 'ESPECIALISTA_DESARROLLO') return { label: 'Desarrollo de Software', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
    if (rol === 'TECNICO') return { label: 'Soporte Técnico OTIC', bg: 'bg-sky-100 text-sky-800 border-sky-300' };
    if (rol === 'SUPERVISOR' || text.includes('otic')) return { label: 'OTIC / TI', bg: 'bg-sky-100 text-sky-800 border-sky-300' };
    return { label: 'Servicios Generales', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      {/* Selected Box / Toggle Button */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className={`w-full p-2.5 bg-white border rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-2xs ${
          disabled
            ? 'opacity-60 bg-slate-100 cursor-not-allowed border-slate-200'
            : isOpen
            ? 'border-unalm-500 ring-2 ring-unalm-500/20'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center space-x-2.5 truncate pr-2">
          {selectedTech ? (
            <>
              <div className="w-7 h-7 rounded-full bg-unalm-100 text-unalm-700 font-bold flex items-center justify-center text-xs shrink-0 border border-unalm-200">
                {selectedTech.nombres.charAt(0)}
                {selectedTech.apellidos.charAt(0)}
              </div>
              <div className="truncate text-left">
                <div className="text-xs font-bold text-slate-900 truncate flex items-center space-x-1.5">
                  <span>
                    {selectedTech.nombres} {selectedTech.apellidos}
                  </span>
                  {(() => {
                    const badge = getSpecialtyBadge(selectedTech.facultadDependencia, selectedTech.rol);
                    return (
                      <span className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded-md border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {selectedTech.facultadDependencia || selectedTech.email}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{placeholder}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          {selectedTech && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect('');
                setSearchTerm('');
              }}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              title="Limpiar selección"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-unalm-600' : ''
            }`}
          />
        </div>
      </div>

      {/* Floating Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1">
          {/* Live Search Input */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-10">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Escribe especialidad, nombre, apellido, cargo o DNI..."
                className="w-full pl-8 pr-7 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-unalm-500 font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex justify-between items-center px-1 pt-1.5 text-[10px] text-slate-400 font-semibold">
              <span>{filteredTechs.length} especialistas encontrados</span>
              <span>Busca en cualquier orden</span>
            </div>
          </div>

          {/* Technicians List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
            {filteredTechs.length > 0 ? (
              filteredTechs.map((tech) => {
                const isSelected = tech.id === Number(selectedTechId);
                const badge = getSpecialtyBadge(tech.facultadDependencia, tech.rol);

                return (
                  <div
                    key={tech.id}
                    onClick={() => {
                      onSelect(tech.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`p-2.5 hover:bg-unalm-50/80 cursor-pointer transition-colors flex items-center justify-between space-x-3 ${
                      isSelected ? 'bg-unalm-50 border-l-4 border-unalm-600' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <div
                        className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                          isSelected
                            ? 'bg-unalm-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {tech.nombres.charAt(0)}
                        {tech.apellidos.charAt(0)}
                      </div>

                      <div className="truncate text-left">
                        <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5 truncate">
                          <span>
                            {tech.nombres} {tech.apellidos}
                          </span>
                          <span className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded-md border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {tech.facultadDependencia || tech.email} {tech.telefono ? `• ${tech.telefono}` : ''}
                        </div>
                      </div>
                    </div>

                    {isSelected && <UserCheck className="w-4 h-4 text-unalm-600 shrink-0" />}
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No se encontraron especialistas que coincidan con "{searchTerm}".
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
