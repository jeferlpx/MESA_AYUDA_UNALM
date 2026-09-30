import React, { useState } from 'react';
import {
  Wifi,
  Monitor,
  Laptop,
  Mail,
  GraduationCap,
  FileCheck,
  Shield,
  Server,
  Database,
  Printer,
  Headphones,
  KeyRound,
  HardDrive,
  Cpu,
  Globe,
  Settings,
  Lock,
  FileText,
  HelpCircle,
  Smartphone,
  Router,
  AlertTriangle,
  FolderLock,
  Layers,
  Wrench,
  Camera,
  Radio,
  Search,
  Sparkles,
} from 'lucide-react';

export interface SvgIconItem {
  id: string;
  name: string;
  category: string;
  tags: string[];
  component: React.ComponentType<{ className?: string }>;
}

export const SVG_ICON_CATALOG: SvgIconItem[] = [
  { id: 'Wifi', name: 'Wi-Fi / Redes', category: 'Conectividad', tags: ['wifi', 'internet', 'red', 'eduroam', 'wireless'], component: Wifi },
  { id: 'Router', name: 'Router / Switch', category: 'Conectividad', tags: ['router', 'switch', 'punto de red', 'fibra'], component: Router },
  { id: 'Radio', name: 'Antena / Radioenlace', category: 'Conectividad', tags: ['radio', 'antena', 'enlace', 'ap'], component: Radio },
  { id: 'Globe', name: 'Web / Portal Institucional', category: 'Sistemas', tags: ['web', 'portal', 'pagina', 'hosting'], component: Globe },
  { id: 'GraduationCap', name: 'Sistemas Académicos (SIRA/Moodle)', category: 'Sistemas', tags: ['sira', 'aula virtual', 'moodle', 'matricula', 'docente', 'alumno'], component: GraduationCap },
  { id: 'Mail', name: 'Correo Institucional', category: 'Cuentas', tags: ['mail', 'correo', 'email', 'gmail', 'outlook', 'cuenta'], component: Mail },
  { id: 'KeyRound', name: 'Contraseñas & Accesos', category: 'Cuentas', tags: ['password', 'clave', 'acceso', 'login', 'credenciales'], component: KeyRound },
  { id: 'Lock', name: 'Seguridad & Permisos', category: 'Cuentas', tags: ['permisos', 'seguridad', 'bloqueo'], component: Lock },
  { id: 'Monitor', name: 'Computadora / PC', category: 'Hardware', tags: ['pc', 'computadora', 'monitor', 'pantalla', 'desktop'], component: Monitor },
  { id: 'Laptop', name: 'Laptop / Portátil', category: 'Hardware', tags: ['laptop', 'notebook', 'portatil'], component: Laptop },
  { id: 'Printer', name: 'Impresora / Escáner', category: 'Hardware', tags: ['impresora', 'scanner', 'escaner', 'tinta', 'toner'], component: Printer },
  { id: 'Headphones', name: 'Audio & Videoconferencia', category: 'Hardware', tags: ['audio', 'microfono', 'auricular', 'zoom', 'teams'], component: Headphones },
  { id: 'Camera', name: 'Cámara / Multimedia', category: 'Hardware', tags: ['camara', 'proyector', 'video', 'multimedia'], component: Camera },
  { id: 'Smartphone', name: 'Telefonía / Móviles', category: 'Hardware', tags: ['telefono', 'celular', 'anexo', 'central'], component: Smartphone },
  { id: 'Server', name: 'Servidores & Hosting', category: 'Infraestructura', tags: ['server', 'servidor', 'datacenter', 'nube'], component: Server },
  { id: 'Database', name: 'Base de Datos (SQL)', category: 'Infraestructura', tags: ['bd', 'database', 'sql', 'mysql', 'datos'], component: Database },
  { id: 'HardDrive', name: 'Almacenamiento / Backup', category: 'Infraestructura', tags: ['disco', 'backup', 'disco duro', 'nas', 'copia'], component: HardDrive },
  { id: 'Cpu', name: 'Procesamiento / Hardware Especial', category: 'Infraestructura', tags: ['cpu', 'procesador', 'memoria', 'ram'], component: Cpu },
  { id: 'FileCheck', name: 'Firma Digital (Refirma / RENIEC)', category: 'Software', tags: ['firma', 'digital', 'refirma', 'token', 'certificado'], component: FileCheck },
  { id: 'FolderLock', name: 'Trámite Documentario', category: 'Software', tags: ['tramite', 'sgd', 'documentos', 'mesa de partes'], component: FolderLock },
  { id: 'FileText', name: 'Software Ofimática & Licencias', category: 'Software', tags: ['office', 'word', 'excel', 'licencia', 'antivirus'], component: FileText },
  { id: 'Shield', name: 'Ciberseguridad & Antivirus', category: 'Seguridad', tags: ['antivirus', 'seguridad', 'firewall', 'malware'], component: Shield },
  { id: 'Wrench', name: 'Mantenimiento Preventivo', category: 'Soporte', tags: ['mantenimiento', 'reparacion', 'soporte', 'limpieza'], component: Wrench },
  { id: 'Settings', name: 'Configuración de Equipos', category: 'Soporte', tags: ['configuracion', 'setup', 'instalacion'], component: Settings },
  { id: 'HelpCircle', name: 'Soporte General OTIC', category: 'Soporte', tags: ['general', 'ayuda', 'consulta', 'otro'], component: HelpCircle },
];

export const getServiceIconComponent = (iconId: string): React.ComponentType<{ className?: string }> => {
  const found = SVG_ICON_CATALOG.find((item) => item.id.toLowerCase() === (iconId || '').toLowerCase());
  return found ? found.component : HelpCircle;
};

interface SvgIconPickerProps {
  selectedIcon: string;
  onSelectIcon: (iconId: string) => void;
}

export const SvgIconPicker: React.FC<SvgIconPickerProps> = ({ selectedIcon, onSelectIcon }) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('Todos');

  const categories = ['Todos', ...Array.from(new Set(SVG_ICON_CATALOG.map((i) => i.category)))];

  const filteredIcons = SVG_ICON_CATALOG.filter((item) => {
    const matchesCat = selectedCat === 'Todos' || item.category === selectedCat;
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query) ||
      item.tags.some((t) => t.toLowerCase().includes(query));
    return matchesCat && matchesSearch;
  });

  const CurrentIconComp = getServiceIconComponent(selectedIcon);

  return (
    <div className="space-y-4 bg-slate-50/80 p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xs">
      {/* Active Selected Icon Preview Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 bg-white rounded-2xl border border-slate-200">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-unalm-700 to-unalm-500 text-white flex items-center justify-center shadow-md shrink-0">
            <CurrentIconComp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Logo SVG: <span className="text-unalm-600 font-extrabold">{selectedIcon || 'HelpCircle'}</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Seleccionado
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Este icono se mostrará a los solicitantes en el portal web y catálogo de atención.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar icono por palabra clave (wifi, correo, pc, firma, software)..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-unalm-500"
          />
        </div>
        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 font-bold"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Spacious Grid of Icons */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2.5 max-h-64 overflow-y-auto p-1.5 bg-white/70 rounded-2xl border border-slate-200/80">
        {filteredIcons.map((icon) => {
          const IconComp = icon.component;
          const isSelected = selectedIcon.toLowerCase() === icon.id.toLowerCase();
          return (
            <button
              key={icon.id}
              type="button"
              onClick={() => onSelectIcon(icon.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-150 text-center ${
                isSelected
                  ? 'bg-unalm-600 text-white border-unalm-700 shadow-md scale-105 ring-2 ring-unalm-400 ring-offset-1'
                  : 'bg-white text-slate-700 border-slate-200/90 hover:border-unalm-400 hover:bg-slate-50 hover:scale-102 shadow-2xs'
              }`}
              title={`${icon.name} (${icon.category})`}
            >
              <IconComp className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-white' : 'text-slate-700'}`} />
              <span className="text-[10px] font-bold truncate w-full block">
                {icon.id}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
