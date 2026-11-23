import INVENTORY_RAW from '../data/inventory.json';

/**
 * The original mobile inventory ("Icon inventory — mobile app.pdf"): every current SVG with what it indicates,
 * where it is used and the earlier Material suggestion. Kept only as reference for the library's `sources`.
 */
export interface InvRow {
  section: string; module: string; file: string; indicates: string; usedIn: string; referenced: boolean;
  label: string; name: string; confidence: 'high' | 'medium' | 'low'; note?: string; style?: 'line' | 'filled'; requested?: string;
}
export const INVENTORY = INVENTORY_RAW as InvRow[];
export const INV_BY_FILE = new Map(INVENTORY.map((r) => [r.file, r]));
export const currentSrc = (file: string) => `current/mobile_${file}.svg`;
