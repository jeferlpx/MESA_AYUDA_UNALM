const fs = require('fs');
const organos = JSON.parse(fs.readFileSync('./organos_data.json', 'utf8'));

let lines = [];
lines.push('/**');
lines.push(' * Estructura Orgánica Oficial UNALM (ROF Institucional)');
lines.push(' * Generada a partir de los Órganos Padre e Hijos de la base de datos institucional.');
lines.push(' */');
lines.push('');
lines.push('export interface UNALMOrgUnit {');
lines.push('  id: string;');
lines.push('  nombre: string;');
lines.push('  categoria: string;');
lines.push('  sigla?: string;');
lines.push('}');
lines.push('');
lines.push('export const UNALM_ORGANIGRAM_UNITS: UNALMOrgUnit[] = [');

let count = 0;
for (const item of organos) {
  const padre = item.padre;
  if (!item.hijos || item.hijos.length === 0) {
    count++;
    lines.push(`  { id: 'org-${count}', nombre: ${JSON.stringify(padre)}, categoria: ${JSON.stringify(padre)} },`);
  } else {
    for (const hijo of item.hijos) {
      count++;
      const fullName = (hijo.toUpperCase() === padre.toUpperCase()) ? padre : (padre + ' - ' + hijo);
      lines.push(`  { id: 'org-${count}', nombre: ${JSON.stringify(fullName)}, categoria: ${JSON.stringify(padre)} },`);
    }
  }
}

lines.push('];');
lines.push('');

fs.writeFileSync('../client/src/data/unalmStructure.ts', lines.join('\n'), 'utf8');
console.log('Updated client/src/data/unalmStructure.ts with', count, 'units.');
