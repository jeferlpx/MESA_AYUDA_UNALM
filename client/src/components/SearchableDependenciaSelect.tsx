import React, { useState, useRef, useEffect, useMemo } from 'react';
import { UNALM_ORGANIGRAM_UNITS, UNALMOrgUnit } from '../data/unalmStructure';
import {
  Building2,
  Search,
  Check,
  ChevronDown,
  X,
  GraduationCap,
  Briefcase,
  Shield,
  Laptop,
  BookOpen,
  FlaskConical,
  Wrench,
  Sparkles,
} from 'lucide-react';

interface SearchableDependenciaSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  theme?: 'dark' | 'light';
  placeholder?: string;
  error?: string;
}

export const SearchableDependenciaSelect: React.FC<SearchableDependenciaSelectProps> = ({
  value,
  onChange,
  label = 'Facultad o Dependencia UNALM *',
  required = true,
  theme = 'dark',
  placeholder = 'Buscar facultad, dirección, departamento o taller...',
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter units based on search query
  const filteredUnits = useMemo(() => {
    if (!search.trim()) return UNALM_ORGANIGRAM_UNITS;
    const q = search.toLowerCase().trim();
    return UNALM_ORGANIGRAM_UNITS.filter(
      (u) =>
        u.nombre.toLowerCase().includes(q) ||
        u.categoria.toLowerCase().includes(q) ||
        (u.sigla && u.sigla.toLowerCase().includes(q))
    );
  }, [search]);

  // Group filtered units by category
  const groupedUnits = useMemo(() => {
    const groups: { [key: string]: UNALMOrgUnit[] } = {};
    for (const unit of filteredUnits) {
      if (!groups[unit.categoria]) {
        groups[unit.categoria] = [];
      }
      groups[unit.categoria].push(unit);
    }
    return groups;
  }, [filteredUnits]);

  const getCategoryIcon = (category: string) => {
    const c = (category || '').toUpperCase();
    if (c.includes('FACULTAD') || c.includes('POSGRADO') || c.includes('POST-GRADO')) return <GraduationCap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    if (c.includes('OTIC') || c.includes('TECNOLOG') || c.includes('SISTEMA')) return <Laptop className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    if (c.includes('ADMINISTRACION') || c.includes('SERVICIOS GENERALES') || c.includes('MANTENIMIENTO')) return <Wrench className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
    if (c.includes('RECTORADO') || c.includes('CONTROL') || c.includes('JURIDIC') || c.includes('DEFENSOR')) return <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    if (c.includes('INVESTIG') || c.includes('LABORATOR') || c.includes('DSEE')) return <FlaskConical className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
    if (c.includes('ACADEMIC') || c.includes('ESTUDIOS') || c.includes('BIBLIOTECA')) return <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
    if (c.includes('BIENESTAR') || c.includes('IMAGEN') || c.includes('PLANEAMIENTO')) return <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    return <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  };

  const isDark = theme === 'dark';

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      {label && (
        <label
          className={`block text-xs sm:text-sm font-bold tracking-wide ${
            isDark ? 'text-slate-200' : 'text-slate-800'
          }`}
        >
          {label} {!label.endsWith('*') && required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Main Trigger Input Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-150 ${
          isDark
            ? 'bg-slate-950/90 border-slate-700 hover:border-slate-500 text-white shadow-inner'
            : 'bg-white border-slate-300 hover:border-slate-400 text-slate-900 shadow-xs'
        } ${isOpen ? 'ring-2 ring-unalm-500 border-unalm-500' : ''} ${
          error ? 'border-rose-500' : ''
        }`}
      >
        <div className="flex items-center space-x-3 overflow-hidden flex-1 mr-2">
          <Building2
            className={`w-5 h-5 shrink-0 ${isDark ? 'text-unalm-400' : 'text-unalm-600'}`}
          />
          {value ? (
            <span className="text-xs sm:text-sm font-semibold text-white break-words leading-snug">
              {value}
            </span>
          ) : (
            <span className={`text-xs sm:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setSearch('');
              }}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Limpiar selección"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-unalm-400' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Floating Panel */}
      {isOpen && (
        <div
          className={`absolute z-[100] left-0 right-0 mt-1.5 rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/20 ${
            isDark
              ? 'bg-slate-900 border-slate-700 text-white shadow-slate-950/90'
              : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
          }`}
          style={{ maxHeight: '420px' }}
        >
          {/* Real-time Search Input Header */}
          <div
            className={`p-3 border-b sticky top-0 z-10 backdrop-blur-md ${
              isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-slate-50/95 border-slate-200'
            }`}
          >
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Escriba para filtrar en tiempo real (ej: OTIC, Agronomía, DGA, Decanato)..."
                className={`w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border outline-none font-semibold transition-all ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-unalm-500 focus:ring-2 focus:ring-unalm-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-unalm-500 focus:ring-2 focus:ring-unalm-500'
                }`}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1 text-[11px] text-slate-400 font-medium">
              <span>Organigrama Oficial UNALM • Res. N° 0226-2023-CU</span>
              <span className="font-bold text-slate-300">{filteredUnits.length} dependencias disponibles</span>
            </div>
          </div>

          {/* Grouped Options List */}
          <div className="overflow-y-auto max-h-72 p-2 space-y-2.5">
            {Object.keys(groupedUnits).length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400 space-y-1.5">
                <Building2 className="w-8 h-8 mx-auto text-slate-500 opacity-50" />
                <p className="font-bold text-slate-300">No se encontraron dependencias con ese término</p>
                <p className="text-xs text-slate-400">
                  Intente con otra palabra clave (ej: Agronomía, Informática, Personal, Obras)
                </p>
              </div>
            ) : (
              Object.entries(groupedUnits).map(([cat, units]) => (
                <div key={cat} className="space-y-1">
                  {/* Category Header */}
                  <div
                    className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl flex items-center space-x-2 ${
                      isDark
                        ? 'bg-slate-950/80 text-amber-300 border border-slate-800'
                        : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}
                  >
                    {getCategoryIcon(cat)}
                    <span>{cat}</span>
                    <span className="ml-auto text-[10px] font-mono opacity-70">
                      ({units.length})
                    </span>
                  </div>

                  {/* Items in Category */}
                  <div className="space-y-1 pl-1">
                    {units.map((unit) => {
                      const isSelected = value === unit.nombre;
                      return (
                        <div
                          key={unit.id}
                          onClick={() => {
                            onChange(unit.nombre);
                            setIsOpen(false);
                            setSearch('');
                          }}
                          className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm flex items-start justify-between cursor-pointer transition-all ${
                            isSelected
                              ? isDark
                                ? 'bg-unalm-600/35 text-white font-bold border border-unalm-500/50 shadow-xs'
                                : 'bg-unalm-50 text-unalm-900 font-bold border border-unalm-300'
                              : isDark
                              ? 'text-slate-200 hover:bg-slate-800/90 hover:text-white hover:border-slate-700'
                              : 'text-slate-800 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex-1 pr-3 whitespace-normal break-words leading-relaxed">
                            <span className="font-medium text-slate-100">{unit.nombre}</span>
                            {unit.sigla && (
                              <span
                                className={`ml-2 inline-block text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded-md font-bold align-middle ${
                                  isDark
                                    ? 'bg-slate-800 text-emerald-300 border border-slate-700'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {unit.sigla}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 ml-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-400 font-semibold pl-1">{error}</p>}
    </div>
  );
};
