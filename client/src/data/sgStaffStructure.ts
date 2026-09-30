/**
 * Estructura Orgánica y Directorio de Personal Oficial de la
 * Unidad de Servicios Generales y Mantenimiento (USG) - UNALM
 * Basado en el Organigrama Oficial y Cuadro de Asignación de Personal 2026
 */

export interface SGStaffMember {
  id: number;
  area: string;
  seccion: string;
  nombres: string;
  cargo: string;
  condicion: 'NOMBRADO' | 'CAS' | 'CONTRATADO 276' | 'TERCERO';
  dni?: string;
  turno?: string;
  observaciones?: string;
  esCoordinador?: boolean;
}

export interface SGAreaNode {
  id: string;
  nombre: string;
  responsable: string;
  cargoResponsable: string;
  color: string;
  secciones: {
    id: string;
    nombre: string;
    coordinador: string;
    totalPersonal: number;
    personal?: string[];
  }[];
}

export const SG_ORGANIGRAM_TREE: SGAreaNode[] = [
  {
    id: 'sg-jefatura',
    nombre: 'Jefatura de Servicios Generales',
    responsable: 'Necker Rutilio Linares Melgarejo',
    cargoResponsable: 'Jefe de Unidad (USG)',
    color: '#0f172a', // Slate 900
    secciones: [
      {
        id: 'sg-secretaria',
        nombre: 'Secretaría de Jefatura',
        coordinador: 'Giovanna Flor Valdez Flores',
        totalPersonal: 2,
        personal: ['Giovanna Flor Valdez Flores (Secretaria)', 'Angela Villar Paucar (Conserje)'],
      },
      {
        id: 'sg-chofer-jefatura',
        nombre: 'Transporte de Jefatura',
        coordinador: 'Noe Américo Aguilar',
        totalPersonal: 1,
        personal: ['Noe Américo Aguilar (Chofer USG)'],
      },
    ],
  },
  {
    id: 'sg-calidad-planeamiento',
    nombre: 'Calidad y Planeamiento',
    responsable: 'Juze Durand Guevara',
    cargoResponsable: 'Encargado de Calidad y Mejora Continua',
    color: '#475569', // Slate 600
    secciones: [
      {
        id: 'sg-planeamiento-secc',
        nombre: 'Planeamiento y Mejora Continua',
        coordinador: 'Juze Durand Guevara',
        totalPersonal: 1,
        personal: ['Juze Durand Guevara (Encargado)'],
      },
    ],
  },
  {
    id: 'sg-administracion',
    nombre: 'Administración y Presupuesto',
    responsable: 'Jhon Víctor Pomacarhua Huaringa',
    cargoResponsable: 'Encargado de Administración y Recursos',
    color: '#db2777', // Pink 600
    secciones: [
      {
        id: 'sg-presupuesto',
        nombre: 'Presupuesto y Finanzas',
        coordinador: 'Nelson Gonzales Sulca',
        totalPersonal: 1,
        personal: ['Nelson Gonzales Sulca (Presupuesto)'],
      },
      {
        id: 'sg-almacen',
        nombre: 'Almacén Central de Insumos',
        coordinador: 'Luis Zamora Lozano',
        totalPersonal: 1,
        personal: ['Luis Zamora Lozano (Almacén)'],
      },
    ],
  },
  {
    id: 'sg-coordinacion-general',
    nombre: 'Coordinación General & Mesa de Órdenes',
    responsable: 'Manuel Rubino Bastidas Guerra',
    cargoResponsable: 'Coordinador General de Operaciones Integradas',
    color: '#2563eb', // Blue 600
    secciones: [
      {
        id: 'sg-soporte-admin',
        nombre: 'Soporte Administrativo',
        coordinador: 'Martha Elizabeth Medina Maza',
        totalPersonal: 1,
        personal: ['Martha Elizabeth Medina Maza (Auxiliar Administrativo)'],
      },
      {
        id: 'sg-ordenes-trabajo',
        nombre: 'Gestión de Órdenes de Trabajo (Mesa de Ayuda SG)',
        coordinador: 'Raúl Antonio Gave Barja',
        totalPersonal: 2,
        personal: ['Raúl Antonio Gave Barja (Encargado)', 'Adolfo Manuel Torres Bautista (Tercero)'],
      },
    ],
  },
  {
    id: 'sg-talleres',
    nombre: 'Área de Talleres de Infraestructura',
    responsable: 'Martha Elizabeth Medina Maza / Alex García Broca',
    cargoResponsable: 'Coordinador de Infraestructura Edilicia',
    color: '#dc2626', // Red 600
    secciones: [
      {
        id: 'sg-taller-electricidad',
        nombre: 'Equipo Electricidad y Electrotecnia',
        coordinador: 'Alex García Broca',
        totalPersonal: 7,
        personal: [
          'Alex García Broca (Coordinador)',
          'Percy Adán Figueroa Palomino (Tco. Elect.)',
          'José Antonio Révolo Rojas (Tco. Elect.)',
          'Guillermo Izaguirre Tarazona (Tco. Elect.)',
          'José Luis Narváez Montoya (Aux.)',
          'José Luciano Castillo Correa (Aux.)',
          'Leoncio Florentino Jayo Huamaní (Aux.)',
        ],
      },
      {
        id: 'sg-taller-gasfiteria',
        nombre: 'Equipo Gasfitería e Instalaciones Sanitarias',
        coordinador: 'Miguel Quispe Huamán',
        totalPersonal: 3,
        personal: [
          'Miguel Quispe Huamán (Coordinador)',
          'Eugenio Villar Flores (Gasfitería Téc.)',
          'Ulises Armando Quispe Callo (Gasfitería)',
        ],
      },
      {
        id: 'sg-taller-herreria',
        nombre: 'Equipo Herrería y Cerrajería',
        coordinador: 'Pío Edmundo Quispe Zárate',
        totalPersonal: 3,
        personal: [
          'Pío Edmundo Quispe Zárate (Coordinador)',
          'Jacinto Cornejo Pérez (Soldador)',
          'Cirilo Lluyacc Ramos (Cerrajero)',
        ],
      },
      {
        id: 'sg-taller-pintura',
        nombre: 'Equipo Pintura y Acabados',
        coordinador: 'Ángel Máximo Pauca Ventura',
        totalPersonal: 4,
        personal: [
          'Ángel Máximo Pauca Ventura (Coordinador)',
          'José Roberto Vega Ramírez (Pintor)',
          'Julián Chamilco López (Pintor)',
          'Juan Enrique López Cirilo (Auxiliar)',
        ],
      },
      {
        id: 'sg-taller-carpinteria',
        nombre: 'Equipo Carpintería y Ebanistería',
        coordinador: 'Luis Alejandro León Azurza',
        totalPersonal: 3,
        personal: [
          'Luis Alejandro León Azurza (Coordinador)',
          'Lucio Deciderio Zacarías Méndez (Carpintero)',
          'Carlos Lapa Romero (Carpintero)',
        ],
      },
      {
        id: 'sg-taller-albanileria',
        nombre: 'Equipo Albañilería, Pisos y Obras Menores',
        coordinador: 'Alejandro Pillco Quispe',
        totalPersonal: 2,
        personal: [
          'Alejandro Pillco Quispe (Maestro de Obra)',
          'Jefferson Fabricio Campos Mitma (Ayudante)',
        ],
      },
    ],
  },
  {
    id: 'sg-paisajismo',
    nombre: 'Área de Paisajismo, Limpieza y Residuos',
    responsable: 'Daniel Adolfo Medina Benavente',
    cargoResponsable: 'Encargado de Áreas Verdes y Saneamiento',
    color: '#16a34a', // Green 600
    secciones: [
      {
        id: 'sg-parques-jardines',
        nombre: 'Equipo Parques y Jardines',
        coordinador: 'Juan Ártica Camayo',
        totalPersonal: 12,
        personal: [
          'Juan Ártica Camayo (Coordinador)',
          'Favián Sebastián Córdova Fernández (Téc. Agropecuario)',
          'Walter Cabezas Flores (Aux. Parque)',
          'Juan Quispe Quiroz (Aux. Parque)',
          'Fernando Rojas Mendoza (Aux. Parque)',
          'Álvaro Tafur Quispe (Aux. Parque)',
          'García Richard Cervantes (Aux. Parque)',
          'Felícitas Flores Quiroz (Aux. Parque)',
          'Alejandro Peralta Alfaro (Aux. Parque)',
          'Habacuc Tueros Mesajil (Aux. Parque)',
          'Alejandro Jaulis Quispe (Aux. Parque)',
          'Rogelio Córdova Yupanqui (Aux. Parque)',
        ],
      },
      {
        id: 'sg-riego-tecnificado',
        nombre: 'Equipo de Riego Tecnificado',
        coordinador: 'Anthony Alfredo Arango Mitma',
        totalPersonal: 4,
        personal: [
          'Anthony Alfredo Arango Mitma (Coordinador)',
          'Fernando Huamán López (Aux.)',
          'Máximo Mamani Cama (Aux.)',
          'Luis Fernando Huamán Hay (Aux.)',
        ],
      },
      {
        id: 'sg-residuos-solidos',
        nombre: 'Equipo Recojo de Residuos Sólidos',
        coordinador: 'Óscar Alanya Calderón',
        totalPersonal: 4,
        personal: [
          'Óscar Alanya Calderón (Coordinador)',
          'Segundo Andrés Quispe Cartagena (Rec. Residuos)',
          'Raúl Juan Paraguay Montes (Rec. Residuos)',
          'Rubén Darío Baldeón Flores (Rec. Residuos)',
        ],
      },
      {
        id: 'sg-recojo-maleza',
        nombre: 'Equipo Recojo de Maleza y Poda',
        coordinador: 'Juan José Bautista de la Cruz',
        totalPersonal: 3,
        personal: [
          'Juan José Bautista de la Cruz (Coordinador)',
          'Juan Pablo Gonzales Carranza (Rec. Maleza)',
          'Renzo Vargas Vásquez (Rec. Maleza)',
        ],
      },
      {
        id: 'sg-limpieza-ambientes',
        nombre: 'Equipo Limpieza y Saneamiento',
        coordinador: 'Jony Baglietto Olcese',
        totalPersonal: 8,
        personal: [
          'Jony Baglietto Olcese (Coordinador)',
          'Irma Julia Mayta Mamani (Limpieza)',
          'Norma Rosa Quispe Cartagena (Limpieza)',
          'Ina Alejandra Vivar Quinteros (Limpieza)',
          'Mara Magdalena Cuba Gaspar (Limpieza)',
          'Julia Quispe Cartegena (Limpieza)',
          'Alberto Gregorio Pérez Fernández (Limpieza)',
          'Ernesta Tanta Chauca (Limpieza)',
        ],
      },
      {
        id: 'sg-maquinaria-pesada',
        nombre: 'Equipo Maquinaria Pesada y Tractores',
        coordinador: 'Frank Smith Julón López',
        totalPersonal: 2,
        personal: [
          'Frank Smith Julón López (Tco. Maq. Pes.)',
          'Máximo Coras Rafael (Tco. Maq. Pes.)',
        ],
      },
    ],
  },
  {
    id: 'sg-mecanica-transporte',
    nombre: 'Área de Mecánica y Transportes',
    responsable: 'Alex Rivelino Pomacarhua Ahuaringa',
    cargoResponsable: 'Encargado de Flota Vehicular y Maquinaria',
    color: '#ca8a04', // Yellow 600
    secciones: [
      {
        id: 'sg-equipo-mecanica',
        nombre: 'Equipo Mecánica Automotriz y Mantenimiento',
        coordinador: 'Jacobo León Aguilar',
        totalPersonal: 4,
        personal: [
          'Jacobo León Aguilar (Coordinador)',
          'Celestino Alanya Calderón (Aux.)',
          'Hugo Paraguay Montes (Aux.)',
          'Carlos Janampa Vargas (Aux.)',
        ],
      },
      {
        id: 'sg-equipo-transporte',
        nombre: 'Equipo de Transporte Institucional y Choferes',
        coordinador: 'Aníbal Luyo Roncal Palomino',
        totalPersonal: 16,
        personal: [
          'Aníbal Luyo Roncal Palomino (Coordinador)',
          'Anselmo Fernández Curi (Chofer - Turno Mañana)',
          'Luis Alberto Villegas Hernández (Chofer - Turno Mañana)',
          'Juvenal Reyes Risco (Chofer - Turno Mañana)',
          'Alfredo Moisés Janampa Vargas (Chofer - Turno Mañana)',
          'Carlos Mendoza Yauco (Chofer - Turno Tarde)',
          'Benjamín Cárdenas Orellana (Chofer - Turno Mañana/Tarde)',
          'Sergio Castro Córdova (Chofer)',
          'Albino Curi Jáuregui (Chofer)',
          'Juan Curi Jáuregui (Chofer)',
          'José Luis Villar Montalván (Chofer)',
          'Wilfredo Huamaní Huamán (Chofer)',
          'Sergio Sulca Rafael (Chofer)',
          'Víctor Quequejana Quequejana (Chofer)',
          'Walter Marapi Labio (Chofer)',
        ],
      },
      {
        id: 'sg-equipo-combustible',
        nombre: 'Control Estadístico y Combustible',
        coordinador: 'Luz Karen Rahuilla Ñahuilla',
        totalPersonal: 1,
        personal: ['Luz Karen Rahuilla Ñahuilla (Control Estadístico Combustible)'],
      },
    ],
  },
];

export interface SGTechInfo {
  cargo: string;
  encargadoDe: string;
  especialidad: string;
  dondeLabora: string;
}

export function lookupSGTechnician(nombre?: string, email?: string, dependencia?: string): SGTechInfo {
  const normName = (nombre || '').toLowerCase().trim();
  const normDep = (dependencia || '').toLowerCase().trim();

  // 1. Buscar en el árbol oficial de SG por coincidencia en coordinadores o personal
  if (normName) {
    for (const area of SG_ORGANIGRAM_TREE) {
      if (area.responsable.toLowerCase().includes(normName) || normName.includes(area.responsable.toLowerCase())) {
        return {
          cargo: area.cargoResponsable,
          encargadoDe: area.nombre,
          especialidad: 'Gestión y Supervisión General',
          dondeLabora: 'Unidad de Servicios Generales y Mantenimiento (USG)',
        };
      }

      for (const secc of area.secciones) {
        if (secc.coordinador.toLowerCase().includes(normName) || normName.includes(secc.coordinador.toLowerCase())) {
          return {
            cargo: `Coordinador / Encargado de ${secc.nombre}`,
            encargadoDe: secc.nombre,
            especialidad: area.nombre,
            dondeLabora: `USG - ${area.nombre}`,
          };
        }

        if (secc.personal) {
          for (const p of secc.personal) {
            // Ejemplo: 'Percy Adán Figueroa Palomino (Tco. Elect.)'
            const [pName, pRole] = p.split('(');
            const cleanPName = pName.trim().toLowerCase();
            const roleStr = pRole ? pRole.replace(')', '').trim() : 'Técnico Especialista';

            if (normName.includes(cleanPName) || cleanPName.includes(normName)) {
              return {
                cargo: roleStr || 'Técnico Especialista',
                encargadoDe: secc.nombre,
                especialidad: area.nombre,
                dondeLabora: `USG - ${area.nombre}`,
              };
            }
          }
        }
      }
    }
  }

  // 2. Si no hubo match exacto de nombre, deducir por la dependencia o especialidad indicada
  const textToScan = `${normName} ${normDep}`;

  if (textToScan.includes('electric') || textToScan.includes('electrotecnia')) {
    return {
      cargo: 'Técnico Electricista Especializado',
      encargadoDe: 'Equipo Electricidad y Electrotecnia',
      especialidad: 'Instalaciones Eléctricas, Tableros y Luminarias',
      dondeLabora: 'USG - Taller de Electricidad e Infraestructura',
    };
  }

  if (textToScan.includes('gasfit') || textToScan.includes('sanitaria') || textToScan.includes('agua')) {
    return {
      cargo: 'Técnico en Gasfitería e Instalaciones Sanitarias',
      encargadoDe: 'Equipo Gasfitería y Redes Hidráulicas',
      especialidad: 'Redes de Agua, Desagüe y Bombas Hidroneumáticas',
      dondeLabora: 'USG - Taller de Gasfitería e Infraestructura',
    };
  }

  if (textToScan.includes('carpint') || textToScan.includes('ebanist') || textToScan.includes('madera')) {
    return {
      cargo: 'Maestro Carpintero y Ebanista',
      encargadoDe: 'Equipo Carpintería y Ebanistería',
      especialidad: 'Fabricación, Mantenimiento de Mobiliario y Aulas',
      dondeLabora: 'USG - Taller de Carpintería',
    };
  }

  if (textToScan.includes('pintur') || textToScan.includes('acabado')) {
    return {
      cargo: 'Especialista en Pintura y Acabados Edilicios',
      encargadoDe: 'Equipo Pintura y Acabados',
      especialidad: 'Pintado de Pabellones, Fachadas y Señalización',
      dondeLabora: 'USG - Taller de Pintura y Acabados',
    };
  }

  if (textToScan.includes('herreria') || textToScan.includes('cerrajer') || textToScan.includes('soldad')) {
    return {
      cargo: 'Técnico Soldador y Cerrajero',
      encargadoDe: 'Equipo Herrería, Cerrajería y Estructuras',
      especialidad: 'Cerrajería de Emergencia, Puertas y Portones Metálicos',
      dondeLabora: 'USG - Taller de Herrería',
    };
  }

  if (textToScan.includes('albañil') || textToScan.includes('albanil') || textToScan.includes('piso') || textToScan.includes('obra')) {
    return {
      cargo: 'Maestro de Obras Menores y Albañilería',
      encargadoDe: 'Equipo Albañilería y Reparaciones Edilicias',
      especialidad: 'Pisos, Veredas, Techos y Resanes Estructurales',
      dondeLabora: 'USG - Taller de Obras Menores',
    };
  }

  if (textToScan.includes('jard') || textToScan.includes('paisaj') || textToScan.includes('verde') || textToScan.includes('poda')) {
    return {
      cargo: 'Especialista en Áreas Verdes y Paisajismo',
      encargadoDe: 'Equipo Parques, Jardines y Poda',
      especialidad: 'Mantenimiento de Jardines, Riego y Ornato de Campus',
      dondeLabora: 'USG - Área de Paisajismo y Áreas Verdes',
    };
  }

  if (textToScan.includes('transpor') || textToScan.includes('chofer') || textToScan.includes('vehic') || textToScan.includes('mecanic')) {
    return {
      cargo: 'Conductor / Mecánico de Transporte Institucional',
      encargadoDe: 'Equipo de Transporte Institucional y Flota',
      especialidad: 'Operación Vehicular y Mantenimiento Mecánico',
      dondeLabora: 'USG - Unidad de Transporte y Maquinaria',
    };
  }

  if (textToScan.includes('limpieza') || textToScan.includes('residuo') || textToScan.includes('saneam')) {
    return {
      cargo: 'Operario de Limpieza y Saneamiento Institucional',
      encargadoDe: 'Equipo Limpieza, Desinfección y Residuos',
      especialidad: 'Saneamiento Ambiental y Recolección de Residuos',
      dondeLabora: 'USG - Área de Limpieza y Saneamiento',
    };
  }

  // 3. Fallback genérico para Servicios Generales
  return {
    cargo: 'Técnico Especialista de Campo',
    encargadoDe: dependencia || 'Mantenimiento e Infraestructura Edilicia',
    especialidad: 'Atención Operativa y Reparaciones en Campus',
    dondeLabora: 'Unidad de Servicios Generales y Mantenimiento (USG)',
  };
}
