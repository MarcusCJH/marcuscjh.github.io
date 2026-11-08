import fs from 'node:fs';
import path from 'node:path';
import type { SiteData } from './types.ts';

/** Absolute path to the content file every generator reads from. */
export const DATA_PATH = path.resolve(import.meta.dirname, '../public/data.json');

/** Read and parse `public/data.json` (re-read per call so dev picks up edits). */
export function loadSiteData(): SiteData {
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8')) as SiteData;
}

/** Last modification time of data.json as an ISO timestamp. */
export function dataModifiedIso(): string {
  return fs.statSync(DATA_PATH).mtime.toISOString();
}

/** Last modification date of data.json as `YYYY-MM-DD`. */
export function dataModifiedDate(): string {
  return dataModifiedIso().split('T')[0] ?? '';
}
