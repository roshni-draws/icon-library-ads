#!/usr/bin/env node
/**
 * One-off seed of ../library/index.json and ../library/merge-log.csv from src/data/inventory.json.
 *
 * Rules:
 *  - Unused files (referenced: false, 73) and brand logos (ANTZ, Vantara, WhatsApp) are left out.
 *  - Every remaining file is grouped into one concept. By default the concept is the suggested Material name
 *    (or the custom draft id), which merges state variants (selected, active, focused, _white, _filled, grey,
 *    inactive, colour roles), alternates and exact duplicates. SPLIT below separates files that share a Material
 *    name but mean different things (for example keyboard_arrow_up is both "Collapse" and "High priority").
 *  - RENAME gives some concepts a clearer ANTZ name than the Material one.
 *  - module = the PDF section of the first file in the concept; reference = the Material name (null for custom).
 *  - Every icon starts as status "to_design".
 *
 * The library is the source of truth once seeded, so this refuses to overwrite an existing index.json.
 * Run: node scripts/seed-library.mjs [--force]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const app = fileURLToPath(new URL('..', import.meta.url));
const lib = fileURLToPath(new URL('../../library/', import.meta.url));
const force = process.argv.includes('--force');
if (existsSync(lib + 'index.json') && !force) {
  console.error('library/index.json already exists. It is the source of truth now; pass --force to reseed (this drops all statuses).');
  process.exit(1);
}

const inv = JSON.parse(readFileSync(app + 'src/data/inventory.json', 'utf8'));

/** file -> concept key, for files whose Material name is shared with a different meaning. */
const SPLIT = {
  // keyboard_arrow_up / down: expand-collapse vs priority levels
  HighPR: 'priority_high', HighPRT: 'priority_high', priroty_request_priority_high: 'priority_high', priroty_high: 'priority_high',
  priroty_icon_priority_high_filled: 'priority_high',
  priroty_icon_priority_low: 'priority_low', priroty_low: 'priority_low', priroty_icon_priority_low_filled: 'priority_low',
  expand_more: 'expand_more', ExpandMore: 'expand_more', CompressMore: 'expand_less',
  // history: history vs sort
  oldFirst: 'sort_oldest_first', recentFirst: 'sort_newest_first',
  // sort_by_alpha: two directions
  alphabeticalAsc: 'sort_a_to_z', sortIcons_AtoZ: 'sort_a_to_z', alphabeticalDes: 'sort_z_to_a', sortIcons_ZtoA: 'sort_z_to_a',
  // ambulance: hospital transfer vs carcass pickup
  Ambulance: 'carcass_pickup', AmbulanceFAB: 'carcass_pickup',
  // skull: mortality vs fetal death
  homesvg_fetal_death_master: 'fetal_death',
  // biotech: lab microscope vs necropsy
  notifications_necropsy: 'necropsy', necropsyCenter: 'necropsy',
  // nutrition: supplement vs dietitian
  Dietitian: 'dietitian',
  // description: document vs Word file type
  doc: 'file_word', MediaDoc: 'file_word',
};

/** concept key -> [name, label]. Keys not listed keep the Material/custom name and the label of the first file. */
const RENAME = {
  pets: ['animal', 'Animal'],
  check_circle: ['done', 'Done / approved'],
  check_box: ['checkbox_checked', 'Checkbox, checked'],
  check_box_outline_blank: ['checkbox_unchecked', 'Checkbox, unchecked'],
  indeterminate_check_box: ['checkbox_partial', 'Checkbox, partly selected'],
  keyboard_double_arrow_up: ['priority_critical', 'Critical priority'],
  drag_handle: ['priority_medium', 'Medium priority'],
  priority_high: ['priority_high', 'High priority'],
  priority_low: ['priority_low', 'Low priority'],
  expand_more: ['expand_more', 'Expand'],
  expand_less: ['expand_less', 'Collapse'],
  flag: ['priority_flag', 'Priority flag'],
  skull: ['mortality', 'Mortality / deceased'],
  ambulance: ['hospital_transfer', 'Hospital transfer'],
  carcass_pickup: ['carcass_pickup', 'Carcass pickup / report mortality'],
  biotech: ['lab_microscope', 'Lab test / microscope'],
  science: ['lab_request', 'Lab request / tests'],
  labs: ['lab_sample', 'Lab sample'],
  vaccines: ['vaccine', 'Vaccine / vaccination'],
  medication: ['medication', 'Medication / dose'],
  nutrition: ['supplement', 'Supplement'],
  sick: ['symptoms', 'Symptoms / complaints'],
  description: ['document', 'Document'],
  file_word: ['file_word', 'Word document'],
  picture_as_pdf: ['file_pdf', 'PDF file'],
  table_chart: ['file_excel', 'Excel file'],
  sticky_note_2: ['note', 'Note'],
  medical_services: ['medical', 'Medical / first aid'],
  medical_information: ['medical_record', 'Medical record'],
  fence: ['enclosure', 'Enclosure / housing'],
  campaign: ['announcement', 'Announcement'],
  approval: ['request', 'Request / approval'],
  egg: ['egg', 'Egg'],
  thumb_up: ['like', 'Like'],
  delete: ['delete', 'Delete'],
  edit: ['edit', 'Edit'],
  location_on: ['location', 'Location'],
  location_city: ['site', 'Site'],
  sort_a_to_z: ['sort_a_to_z', 'Sort A to Z'],
  sort_z_to_a: ['sort_z_to_a', 'Sort Z to A'],
  sort_oldest_first: ['sort_oldest_first', 'Sort oldest first'],
  sort_newest_first: ['sort_newest_first', 'Sort newest first'],
  update: ['sort_newest_first', 'Sort newest first'],
  fetal_death: ['fetal_death', 'Fetal death'],
  necropsy: ['necropsy', 'Necropsy'],
  dietitian: ['dietitian', 'Dietitian'],
  history: ['history', 'History'],
  calendar_month: ['calendar', 'Date / calendar'],
  schedule: ['time', 'Time / schedule'],
  filter_list: ['filter', 'Filter'],
  filter_alt: ['filter_applied', 'Filter applied'],
  add_photo_alternate: ['add_photo', 'Add photo'],
  photo_library: ['gallery', 'Gallery'],
  account_circle: ['user', 'User / profile'],
  local_fire_department: ['urgent', 'Urgent case'],
  cancel: ['cancelled', 'Cancelled / rejected'],
  groups: ['groups', 'Groups'],
  group: ['people', 'People / team'],
  comment: ['comment', 'Comment'],
  move_down: ['move_in', 'Move in'],
  move_location: ['moved_location', 'Moved location'],
  compare_arrows: ['transfer', 'Transfer'],
  swap_horiz: ['swap', 'Swap / change'],
  emergency: ['emergency', 'Emergency priority'],
  emergency_home: ['emergency_announcement', 'Emergency announcement'],
  attach_file: ['attach_file', 'Attach file'],
  prescriptions: ['prescription', 'Prescription'],
  clinical_notes: ['clinical_notes', 'Clinical notes'],
  note_add: ['note_add', 'Add note'],
  skip_next: ['skip', 'Skip dose'],
  select_all: ['select_all', 'Select all'],
  add_circle: ['add_circle', 'Add (circle)'],
  download: ['download', 'Download'],
  assignment: ['assessment', 'Assessment record'],
  warning: ['warning', 'Warning'],
  visibility: ['visibility', 'Show / visible'],
  sort_by_alpha: ['sort_a_to_z', 'Sort A to Z'],
  line_end_square: ['line_end_square', 'Timeline end point'],
  category: ['category', 'Category'],
  chat: ['chat', 'Chat'],
  'custom:deworming': ['deworming', 'Deworming'],
  'custom:animal_batch': ['animal_batch', 'Batch of animals'],
  'custom:egg_discarded': ['egg_discarded', 'Egg discarded'],
  'custom:egg_clutch': ['egg_clutch', 'Egg clutch'],
  'custom:egg_nest': ['egg_nest', 'Egg in nest'],
  'custom:egg_nursery': ['egg_nursery', 'Egg nursery'],
  'custom:carcass': ['carcass_transfer', 'Carcass transfer'],
  'custom:controlled_substance': ['controlled_substance', 'Controlled substance'],
};

const rows = inv.filter((r) => r.referenced && r.name !== 'brand');
const concepts = new Map();
const log = [];
for (const r of rows) {
  const key = SPLIT[r.file] ?? r.name;
  const [name, label] = RENAME[key] ?? [key.replace(/^custom:/, ''), null];
  if (!/^[a-z0-9_]+$/.test(name)) throw new Error(`bad name ${name}`);
  let c = concepts.get(name);
  if (!c) {
    c = {
      name,
      label: label ?? r.label,
      module: r.section,
      status: 'to_design',
      sources: [],
      reference: r.name.startsWith('custom:') ? null : r.name,
      tags: [],
      notes: '',
      _notes: new Set(),
      _sections: new Set(),
    };
    concepts.set(name, c);
  }
  c.sources.push(r.file);
  if (r.note) c._notes.add(r.note);
  c._sections.add(r.section);
  if (r.name.startsWith('custom:')) c._notes.add(`Earlier custom draft: ${r.name.slice(7)}`);
  log.push({ file: r.file, name, section: r.section, label: r.label, material: r.name });
}

const icons = [...concepts.values()].map(({ _notes, _sections, ...c }) => {
  const also = [..._sections].filter((s) => s !== c.module);
  const notes = [...(also.length ? [`Also used in: ${also.join('; ')}`] : []), ..._notes];
  return { ...c, notes: notes.join(' · ') };
});

mkdirSync(lib + 'line', { recursive: true });
mkdirSync(lib + 'filled', { recursive: true });
writeFileSync(lib + 'index.json', JSON.stringify({ version: 1, style: 'antz-rounded', icons }, null, 2) + '\n');
const cell = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
writeFileSync(lib + 'merge-log.csv', ['source_file,library_name,section,original_label,suggested_material', ...log.map((l) => [l.file, l.name, l.section, l.label, l.material].map(cell).join(','))].join('\n') + '\n');

const merged = rows.length - icons.length;
console.log(`Sources: ${rows.length} files (excluded ${inv.filter((r) => !r.referenced).length} unused + ${inv.filter((r) => r.name === 'brand').length} brand).`);
console.log(`Library: ${icons.length} icons. Merges: ${merged} files folded into another icon; ${icons.filter((i) => i.sources.length > 1).length} icons have more than one source.`);
