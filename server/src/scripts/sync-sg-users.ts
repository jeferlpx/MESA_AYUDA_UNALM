import { dbPool } from '../config/db';

const PWD_HASH = '$2a$10$lAduImN7Z3O4/SKm.sPn3.JdbxuXo0kobu7fjBHgR8.Yl3gpwbbpK';

export interface SeedUser {
  nombres: string;
  apellidos: string;
  email: string;
  rolId: number; // 1: ADMIN, 2: SUPERVISOR, 3: TECNICO, 4: SOLICITANTE, 5: MESA_AYUDA, 6: MESA_AYUDA_SG, 7: TECNICO_SG, 8: SUPERVISOR_SG
  facultad: string;
  telefono?: string;
}

export const SG_PERSONNEL_SEEDS: SeedUser[] = [
  // -------------------------------------------------------------
  // PERFILES RÁPIDOS DE DEMOSTRACIÓN (NO BORRAR)
  // -------------------------------------------------------------
  {
    nombres: 'Administrador',
    apellidos: 'General OTIC',
    email: 'admin.otic@lamolina.edu.pe',
    rolId: 1, // ADMIN
    facultad: 'Oficina de Tecnologías de la Información (OTIC)',
    telefono: '01-614-7800 Ext 101',
  },
  {
    nombres: 'Mesa de Ayuda',
    apellidos: 'OTIC (Soporte)',
    email: 'soporte@lamolina.edu.pe',
    rolId: 5, // MESA_AYUDA
    facultad: 'OTIC - Mesa de Ayuda',
    telefono: '01-614-7800 Ext 105',
  },
  {
    nombres: 'Mesa de Ayuda',
    apellidos: 'Servicios Generales',
    email: 'mesa.sg@lamolina.edu.pe',
    rolId: 6, // MESA_AYUDA_SG
    facultad: 'Unidad de Servicios Generales y Mantenimiento',
    telefono: '01-614-7800 Ext 201',
  },
  {
    nombres: 'Jorge',
    apellidos: 'Benavides (Docente)',
    email: '20220145@lamolina.edu.pe',
    rolId: 4, // SOLICITANTE
    facultad: 'Facultad de Agronomía',
    telefono: '998877665',
  },
  {
    nombres: 'David',
    apellidos: 'Mendoza (Técnico Redes)',
    email: 'tecnico.redes@lamolina.edu.pe',
    rolId: 3, // TECNICO
    facultad: 'OTIC - Área de Redes y Telecomunicaciones',
    telefono: '01-614-7800 Ext 103',
  },
  {
    nombres: 'Marco',
    apellidos: 'Valdivia (Esp. Electricidad)',
    email: 'tecnico.electricidad@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo de Electricidad',
    telefono: '01-614-7800 Ext 202',
  },

  // -------------------------------------------------------------
  // JEFATURA & COORDINACIONES DE SERVICIOS GENERALES
  // -------------------------------------------------------------
  {
    nombres: 'Necker Rutilio',
    apellidos: 'Linares Melgarejo',
    email: 'necker.linares@lamolina.edu.pe',
    rolId: 8, // SUPERVISOR_SG
    facultad: 'Servicios Generales - Jefatura de Unidad (USG)',
    telefono: 'DNI: 25560765',
  },
  {
    nombres: 'Giovanna Flor',
    apellidos: 'Valdez Flores',
    email: 'giovanna.valdez@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Secretaría de Jefatura',
    telefono: 'DNI: 41697649',
  },
  {
    nombres: 'Angela',
    apellidos: 'Villar Paucar',
    email: 'angela.villar@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Jefatura (Conserjería)',
    telefono: 'DNI: 08300064',
  },
  {
    nombres: 'Noe Américo',
    apellidos: 'Aguilar',
    email: 'noe.aguilar@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Jefatura (Chofer USG)',
    telefono: 'DNI: 09567101',
  },
  {
    nombres: 'Raúl Antonio',
    apellidos: 'Gave Barja',
    email: 'raul.gave@lamolina.edu.pe',
    rolId: 6, // MESA_AYUDA_SG
    facultad: 'Servicios Generales - Coordinación de Gestión de Órdenes de Trabajo',
    telefono: 'DNI: 20428747',
  },
  {
    nombres: 'Adolfo Manuel',
    apellidos: 'Torres Bautista',
    email: 'adolfo.torres@lamolina.edu.pe',
    rolId: 6, // MESA_AYUDA_SG
    facultad: 'Servicios Generales - Coordinación de Gestión de Órdenes de Trabajo',
    telefono: 'DNI: 72872978',
  },
  {
    nombres: 'Juze',
    apellidos: 'Durand Guevara',
    email: 'juze.durand@lamolina.edu.pe',
    rolId: 8, // SUPERVISOR_SG
    facultad: 'Servicios Generales - Coordinación de Planeamiento y Mejora Continua',
    telefono: 'DNI: 46617310',
  },
  {
    nombres: 'Jhon Víctor',
    apellidos: 'Pomacarhua Huaringa',
    email: 'jhon.pomacarhua@lamolina.edu.pe',
    rolId: 8, // SUPERVISOR_SG
    facultad: 'Servicios Generales - Coordinación de Administración y Recursos',
    telefono: 'DNI: 48314834',
  },
  {
    nombres: 'Nelson',
    apellidos: 'Gonzales Sulca',
    email: 'nelson.gonzales@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Administración (Presupuesto)',
    telefono: 'DNI: 45505171',
  },
  {
    nombres: 'Luis',
    apellidos: 'Zamora Lozano',
    email: 'luis.zamora@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Administración (Almacén Central)',
    telefono: 'DNI: 04083927',
  },
  {
    nombres: 'Manuel Rubino',
    apellidos: 'Bastidas Guerra',
    email: 'manuel.bastidas@lamolina.edu.pe',
    rolId: 8, // SUPERVISOR_SG
    facultad: 'Servicios Generales - Coordinación de Operaciones Integradas',
    telefono: 'DNI: 09848392',
  },
  {
    nombres: 'Martha Elizabeth',
    apellidos: 'Medina Maza',
    email: 'martha.medina@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Operaciones Integradas (Soporte Administrativo)',
    telefono: 'DNI: 07504009',
  },

  // -------------------------------------------------------------
  // TALLERES MANTENIMIENTO DE INFRAESTRUCTURA (22)
  // -------------------------------------------------------------
  // Equipo Electricidad (07)
  {
    nombres: 'Alex',
    apellidos: 'García Broca',
    email: 'alex.garcia@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Electricidad (Coordinador)',
    telefono: 'DNI: 25653089',
  },
  {
    nombres: 'Percy Adán',
    apellidos: 'Figueroa Palomino',
    email: 'percy.figueroa@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Electricidad (Tco. Electricista)',
    telefono: 'DNI: 41661123',
  },
  {
    nombres: 'José Antonio',
    apellidos: 'Révolo Rojas',
    email: 'jose.revolo@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Electricidad (Tco. Electricista)',
    telefono: 'DNI: 41974127',
  },
  {
    nombres: 'Guillermo',
    apellidos: 'Izaguirre Tarazona',
    email: 'guillermo.izaguirre@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Electricidad (Tco. Electricista)',
    telefono: 'DNI: 09811154',
  },
  {
    nombres: 'José Luis',
    apellidos: 'Narváez Montoya',
    email: 'jose.narvaez@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Electricidad (Auxiliar)',
    telefono: 'DNI: 43058145',
  },
  {
    nombres: 'José Luciano',
    apellidos: 'Castillo Correa',
    email: 'jose.castillo@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Electricidad (Auxiliar)',
    telefono: 'DNI: 07800020',
  },
  {
    nombres: 'Leoncio Florentino',
    apellidos: 'Jayo Huamaní',
    email: 'leoncio.jayo@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Electricidad (Auxiliar)',
    telefono: 'DNI: 08937746',
  },

  // Equipo Herrería y Cerrajería (03)
  {
    nombres: 'Pío Edmundo',
    apellidos: 'Quispe Zárate',
    email: 'pio.quispe@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Herrería y Cerrajería (Coordinador)',
    telefono: 'DNI: 09366227',
  },
  {
    nombres: 'Jacinto',
    apellidos: 'Cornejo Pérez',
    email: 'jacinto.cornejo@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Herrería y Cerrajería (Soldador)',
    telefono: 'DNI: 00249706',
  },
  {
    nombres: 'Cirilo',
    apellidos: 'Lluyacc Ramos',
    email: 'cirilo.lluyacc@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Herrería y Cerrajería (Cerrajero)',
    telefono: 'DNI: 43909804',
  },

  // Equipo Pintura (04)
  {
    nombres: 'Ángel Máximo',
    apellidos: 'Pauca Ventura',
    email: 'angel.pauca@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Pintura (Coordinador)',
    telefono: 'DNI: 09752061',
  },
  {
    nombres: 'José Roberto',
    apellidos: 'Vega Ramírez',
    email: 'jose.vega@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Pintura (Pintor)',
    telefono: 'DNI: 42887996',
  },
  {
    nombres: 'Julián',
    apellidos: 'Chamilco López',
    email: 'julian.chamilco@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Pintura (Pintor)',
    telefono: 'DNI: 09811077',
  },
  {
    nombres: 'Juan Enrique',
    apellidos: 'López Cirilo',
    email: 'juan.lopez.c@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Pintura (Auxiliar)',
    telefono: 'DNI: 08133264',
  },

  // Equipo Carpintería (03)
  {
    nombres: 'Luis Alejandro',
    apellidos: 'León Azurza',
    email: 'luis.leon@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Carpintería (Coordinador)',
    telefono: 'DNI: 07117433',
  },
  {
    nombres: 'Lucio Deciderio',
    apellidos: 'Zacarías Méndez',
    email: 'lucio.zacarias@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Carpintería (Carpintero)',
    telefono: 'DNI: 19936872',
  },
  {
    nombres: 'Carlos',
    apellidos: 'Lapa Romero',
    email: 'carlos.lapa@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Carpintería (Carpintero)',
    telefono: 'DNI: 09177650',
  },

  // Equipo Gasfitería (03)
  {
    nombres: 'Miguel',
    apellidos: 'Quispe Huamán',
    email: 'miguel.quispe@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Gasfitería (Coordinador)',
    telefono: 'DNI: 07273180',
  },
  {
    nombres: 'Eugenio',
    apellidos: 'Villar Flores',
    email: 'eugenio.villar@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Gasfitería (Gasfitería Técnica)',
    telefono: 'DNI: 10317191',
  },
  {
    nombres: 'Ulises Armando',
    apellidos: 'Quispe Callo',
    email: 'ulises.quispe@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Gasfitería (Gasfitero)',
    telefono: 'DNI: 10059509',
  },

  // Equipo Albañilería (02)
  {
    nombres: 'Alejandro',
    apellidos: 'Pillco Quispe',
    email: 'alejandro.pillco@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Albañilería (Maestro de Obra)',
    telefono: 'DNI: 10747771',
  },
  {
    nombres: 'Jefferson Fabricio',
    apellidos: 'Campos Mitma',
    email: 'jefferson.campos@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Albañilería (Ayudante)',
    telefono: 'DNI: 72319750',
  },

  // -------------------------------------------------------------
  // ÁREAS VERDES - LIMPIEZA Y RESIDUOS (34)
  // -------------------------------------------------------------
  {
    nombres: 'Daniel Adolfo',
    apellidos: 'Medina Benavente',
    email: 'daniel.medina@lamolina.edu.pe',
    rolId: 8, // SUPERVISOR_SG
    facultad: 'Servicios Generales - Encargado Áreas Verdes y Saneamiento',
    telefono: 'DNI: 10349883',
  },
  // Equipo Maquinaria Pesada (02)
  {
    nombres: 'Frank Smith',
    apellidos: 'Julón López',
    email: 'frank.julon@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Maquinaria Pesada (Tco. Maq. Pesada)',
    telefono: 'DNI: 76792637',
  },
  {
    nombres: 'Máximo',
    apellidos: 'Coras Rafael',
    email: 'maximo.coras@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Maquinaria Pesada (Tco. Maq. Pesada)',
    telefono: 'DNI: 41831698',
  },

  // Equipo Parques y Jardines (12)
  {
    nombres: 'Juan',
    apellidos: 'Ártica Camayo',
    email: 'juan.artica@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Parques y Jardines (Coordinador)',
    telefono: 'DNI: 07270067',
  },
  {
    nombres: 'Favián Sebastián',
    apellidos: 'Córdova Fernández',
    email: 'favian.cordova@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Parques y Jardines (Téc. Agropecuario)',
    telefono: 'DNI: 28307551',
  },
  {
    nombres: 'Walter',
    apellidos: 'Cabezas Flores',
    email: 'walter.cabezas@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Parques y Jardines (Auxiliar)',
    telefono: 'DNI: 28265288',
  },
  {
    nombres: 'Juan',
    apellidos: 'Quispe Quiroz',
    email: 'juan.quispe.q@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Parques y Jardines (Auxiliar)',
    telefono: 'DNI: 07277045',
  },
  {
    nombres: 'Fernando',
    apellidos: 'Rojas Mendoza',
    email: 'fernando.rojas@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Parques y Jardines (Auxiliar)',
    telefono: 'DNI: 09395811',
  },
  {
    nombres: 'Álvaro',
    apellidos: 'Tafur Quispe',
    email: 'alvaro.tafur@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Parques y Jardines (Auxiliar)',
    telefono: 'DNI: 47877526',
  },
  {
    nombres: 'Richard',
    apellidos: 'García Cervantes',
    email: 'richard.garcia@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Parques y Jardines (Auxiliar)',
    telefono: 'DNI: 42543660',
  },
  {
    nombres: 'Felícitas',
    apellidos: 'Flores Quiroz',
    email: 'felicitas.flores@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Parques y Jardines (Auxiliar)',
    telefono: 'DNI: 07276870',
  },
  {
    nombres: 'Alejandro',
    apellidos: 'Peralta Alfaro',
    email: 'alejandro.peralta@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Parques y Jardines (Auxiliar)',
    telefono: 'DNI: 41078542',
  },
  {
    nombres: 'Habacuc',
    apellidos: 'Tueros Mesajil',
    email: 'habacuc.tueros@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Parques y Jardines (Auxiliar)',
    telefono: 'DNI: 28253203',
  },
  {
    nombres: 'Alejandro',
    apellidos: 'Jaulis Quispe',
    email: 'alejandro.jaulis@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Parques y Jardines (Auxiliar)',
    telefono: 'DNI: 09567101',
  },
  {
    nombres: 'Rogelio',
    apellidos: 'Córdova Yupanqui',
    email: 'rogelio.cordova@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Parques y Jardines (Auxiliar)',
    telefono: 'DNI: 42008158',
  },

  // Equipo de Riego Tecnificado (04)
  {
    nombres: 'Anthony Alfredo',
    apellidos: 'Arango Mitma',
    email: 'anthony.arango@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Riego Tecnificado (Coordinador)',
    telefono: 'DNI: 76290791',
  },
  {
    nombres: 'Fernando',
    apellidos: 'Huamán López',
    email: 'fernando.huaman.l@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Riego Tecnificado (Auxiliar)',
    telefono: 'DNI: 09395547',
  },
  {
    nombres: 'Máximo',
    apellidos: 'Mamani Cama',
    email: 'maximo.mamani@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Riego Tecnificado (Auxiliar)',
    telefono: 'DNI: 10143925',
  },
  {
    nombres: 'Luis Fernando',
    apellidos: 'Huamán Hay',
    email: 'luis.huaman.h@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Riego Tecnificado (Auxiliar)',
    telefono: 'Personal Riego',
  },

  // Equipo Recojo de Residuos Sólidos (04)
  {
    nombres: 'Óscar',
    apellidos: 'Alanya Calderón',
    email: 'oscar.alanya@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Recojo de Residuos Sólidos (Coordinador)',
    telefono: 'DNI: 10612786',
  },
  {
    nombres: 'Segundo Andrés',
    apellidos: 'Quispe Cartagena',
    email: 'segundo.quispe@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Recojo de Residuos Sólidos (Operario)',
    telefono: 'DNI: 10063079',
  },
  {
    nombres: 'Raúl Juan',
    apellidos: 'Paraguay Montes',
    email: 'raul.paraguay@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Recojo de Residuos Sólidos (Operario)',
    telefono: 'DNI: 10491973',
  },
  {
    nombres: 'Rubén Darío',
    apellidos: 'Baldeón Flores',
    email: 'ruben.baldeon@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Recojo de Residuos Sólidos (Operario)',
    telefono: 'DNI: 09752496',
  },

  // Equipo Recojo de Maleza (03)
  {
    nombres: 'Juan José',
    apellidos: 'Bautista de la Cruz',
    email: 'juan.bautista@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Recojo de Maleza y Poda (Coordinador)',
    telefono: 'DNI: 80181802',
  },
  {
    nombres: 'Juan Pablo',
    apellidos: 'Gonzales Carranza',
    email: 'juan.gonzales@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Recojo de Maleza y Poda (Operario)',
    telefono: 'DNI: 42957986',
  },
  {
    nombres: 'Renzo',
    apellidos: 'Vargas Vásquez',
    email: 'renzo.vargas@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Recojo de Maleza y Poda (Operario)',
    telefono: 'DNI: 70607121',
  },

  // Equipo Limpieza (08)
  {
    nombres: 'Jony',
    apellidos: 'Baglietto Olcese',
    email: 'jony.baglietto@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Limpieza de Ambientes (Coordinador)',
    telefono: 'DNI: 5178710',
  },
  {
    nombres: 'Irma Julia',
    apellidos: 'Mayta Mamani',
    email: 'irma.mayta@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Limpieza de Ambientes',
    telefono: 'DNI: 30846090',
  },
  {
    nombres: 'Norma Rosa',
    apellidos: 'Quispe Cartagena',
    email: 'norma.quispe@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Limpieza de Ambientes',
    telefono: 'DNI: 10612208',
  },
  {
    nombres: 'Ina Alejandra',
    apellidos: 'Vivar Quinteros',
    email: 'ina.vivar@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Limpieza de Ambientes',
    telefono: 'DNI: 07194509',
  },
  {
    nombres: 'Mara Magdalena',
    apellidos: 'Cuba Gaspar',
    email: 'mara.cuba@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Limpieza de Ambientes',
    telefono: 'DNI: 43962812',
  },
  {
    nombres: 'Julia',
    apellidos: 'Quispe Cartegena',
    email: 'julia.quispe.c@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Limpieza de Ambientes',
    telefono: 'DNI: 80646624',
  },
  {
    nombres: 'Alberto Gregorio',
    apellidos: 'Pérez Fernández',
    email: 'alberto.perez@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Limpieza de Ambientes',
    telefono: 'DNI: 09750281',
  },
  {
    nombres: 'Ernesta',
    apellidos: 'Tanta Chauca',
    email: 'ernesta.tanta@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Limpieza de Ambientes',
    telefono: 'DNI: 09287973',
  },

  // -------------------------------------------------------------
  // MECÁNICA Y TRANSPORTE (21)
  // -------------------------------------------------------------
  {
    nombres: 'Alex Rivelino',
    apellidos: 'Pomacarhua Ahuaringa',
    email: 'alex.pomacarhua@lamolina.edu.pe',
    rolId: 8, // SUPERVISOR_SG
    facultad: 'Servicios Generales - Encargado de Mecánica y Transportes',
    telefono: 'DNI: 40190674',
  },
  // Equipo Mecánica (04)
  {
    nombres: 'Jacobo',
    apellidos: 'León Aguilar',
    email: 'jacobo.leon@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Mecánica Automotriz (Coordinador)',
    telefono: 'DNI: 10062495',
  },
  {
    nombres: 'Celestino',
    apellidos: 'Alanya Calderón',
    email: 'celestino.alanya@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Mecánica Automotriz (Auxiliar)',
    telefono: 'DNI: 07277731',
  },
  {
    nombres: 'Hugo',
    apellidos: 'Paraguay Montes',
    email: 'hugo.paraguay@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Mecánica Automotriz (Auxiliar)',
    telefono: 'DNI: 09750953',
  },
  {
    nombres: 'Carlos',
    apellidos: 'Janampa Vargas',
    email: 'carlos.janampa@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Mecánica Automotriz (Auxiliar)',
    telefono: 'DNI: 10116869',
  },

  // Equipo de Transporte (16)
  {
    nombres: 'Aníbal',
    apellidos: 'Luyo Roncal Palomino',
    email: 'anibal.luyo@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Transporte (Coordinador)',
    telefono: 'DNI: 07271893',
  },
  {
    nombres: 'Anselmo',
    apellidos: 'Fernández Curi',
    email: 'anselmo.fernandez@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Transporte (Chofer - Turno Mañana)',
    telefono: 'DNI: 09397012',
  },
  {
    nombres: 'Luis Alberto',
    apellidos: 'Villegas Hernández',
    email: 'luis.villegas@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Transporte (Chofer - Turno Mañana)',
    telefono: 'DNI: 09395226',
  },
  {
    nombres: 'Juvenal',
    apellidos: 'Reyes Risco',
    email: 'juvenal.reyes@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Transporte (Chofer - Turno Mañana)',
    telefono: 'DNI: 07271154',
  },
  {
    nombres: 'Alfredo Moisés',
    apellidos: 'Janampa Vargas',
    email: 'alfredo.janampa@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Transporte (Chofer - Turno Mañana)',
    telefono: 'DNI: 0939984',
  },
  {
    nombres: 'Carlos',
    apellidos: 'Mendoza Yauco',
    email: 'carlos.mendoza@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Transporte (Chofer - Turno Tarde)',
    telefono: 'DNI: 42852171',
  },
  {
    nombres: 'Benjamín',
    apellidos: 'Cárdenas Orellana',
    email: 'benjamin.cardenas@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Transporte (Chofer - Turno Mañana/Tarde)',
    telefono: 'DNI: 07271039',
  },
  {
    nombres: 'Sergio',
    apellidos: 'Castro Córdova',
    email: 'sergio.castro@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Transporte (Chofer)',
    telefono: 'DNI: 41464171',
  },
  {
    nombres: 'Albino',
    apellidos: 'Curi Jáuregui',
    email: 'albino.curi@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Transporte (Chofer)',
    telefono: 'DNI: 10611272',
  },
  {
    nombres: 'Juan',
    apellidos: 'Curi Jáuregui',
    email: 'juan.curi@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Transporte (Chofer)',
    telefono: 'DNI: 42640522',
  },
  {
    nombres: 'José Luis',
    apellidos: 'Villar Montalván',
    email: 'jose.villar@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Transporte (Chofer)',
    telefono: 'DNI: 17835895',
  },
  {
    nombres: 'Wilfredo',
    apellidos: 'Huamaní Huamán',
    email: 'wilfredo.huamani@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Transporte (Chofer)',
    telefono: 'DNI: 40220336',
  },
  {
    nombres: 'Sergio',
    apellidos: 'Sulca Rafael',
    email: 'sergio.sulca@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Transporte (Chofer)',
    telefono: 'DNI: 40329401',
  },
  {
    nombres: 'Víctor',
    apellidos: 'Quequejana Quequejana',
    email: 'victor.quequejana@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Transporte (Chofer)',
    telefono: 'DNI: 10011146',
  },
  {
    nombres: 'Walter',
    apellidos: 'Marapi Labio',
    email: 'walter.marapi@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Equipo Transporte (Chofer)',
    telefono: 'DNI: 41589514',
  },
  {
    nombres: 'Luz Karen',
    apellidos: 'Rahuilla Ñahuilla',
    email: 'luz.rahuilla@lamolina.edu.pe',
    rolId: 7, // TECNICO_SG
    facultad: 'Servicios Generales - Control Estadístico de Combustible',
    telefono: 'DNI: 74810805',
  },
];

export async function syncSGPersonnel() {
  console.log('--- Sincronizando personal oficial de Servicios Generales UNALM ---');

  const emailsToPreserve = SG_PERSONNEL_SEEDS.map((u) => u.email);
  // Preservar también alias esenciales
  emailsToPreserve.push(
    'admin@lamolina.edu.pe',
    'admin.otic@lamolina.edu.pe',
    'soporte@lamolina.edu.pe',
    'mesa.ayuda@lamolina.edu.pe',
    'mesa.sg@lamolina.edu.pe',
    'solicitante@lamolina.edu.pe',
    '20220145@lamolina.edu.pe',
    'tecnico.redes@lamolina.edu.pe',
    'tecnico.electricidad@lamolina.edu.pe'
  );

  // 1. Desactivar / Eliminar usuarios residuales que no pertenezcan al personal oficial ni a las cuentas de demostración
  try {
    const placeholders = emailsToPreserve.map(() => '?').join(',');
    await dbPool.query(
      `DELETE FROM usuarios WHERE email NOT IN (${placeholders})`,
      emailsToPreserve
    );
    console.log('✓ Cuentas residuales eliminadas exitosamente.');
  } catch (e: any) {
    // Si hay restricción por FK con tickets, marcar como INACTIVO en lugar de fallar
    const placeholders = emailsToPreserve.map(() => '?').join(',');
    await dbPool.query(
      `UPDATE usuarios SET estado = 'INACTIVO' WHERE email NOT IN (${placeholders})`,
      emailsToPreserve
    );
    console.log('✓ Cuentas residuales desactivadas (conservadas por integridad referencial).');
  }

  // 2. Insertar / Actualizar todo el personal oficial
  for (const u of SG_PERSONNEL_SEEDS) {
    const [existing] = await dbPool.query<any[]>(
      'SELECT id FROM usuarios WHERE email = ?',
      [u.email]
    );

    if (existing.length > 0) {
      await dbPool.query(
        `UPDATE usuarios 
         SET nombres = ?, apellidos = ?, password_hash = ?, rol_id = ?, facultad_dependencia = ?, telefono = ?, estado = 'ACTIVO'
         WHERE id = ?`,
        [u.nombres, u.apellidos, PWD_HASH, u.rolId, u.facultad, u.telefono || '', existing[0].id]
      );
    } else {
      await dbPool.query(
        `INSERT INTO usuarios (nombres, apellidos, email, password_hash, rol_id, facultad_dependencia, telefono, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVO')`,
        [u.nombres, u.apellidos, u.email, PWD_HASH, u.rolId, u.facultad, u.telefono || '']
      );
    }
  }

  console.log(`✓ ${SG_PERSONNEL_SEEDS.length} usuarios oficiales creados y actualizados en el sistema.`);
}

if (require.main === module) {
  syncSGPersonnel()
    .then(() => {
      console.log('Sincronización completada exitosamente.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error al sincronizar personal SG:', err);
      process.exit(1);
    });
}
