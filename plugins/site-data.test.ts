import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DATA_PATH, dataModifiedDate, dataModifiedIso, loadSiteData } from './site-data.ts';

describe('site-data', () => {
  it('points at the real public/data.json', () => {
    expect(DATA_PATH.split(path.sep).join('/')).toMatch(/\/public\/data\.json$/);
    expect(fs.existsSync(DATA_PATH)).toBe(true);
  });

  it('loads and parses the content file', () => {
    const data = loadSiteData();
    expect(data.config.name).toBeTruthy();
    expect(Array.isArray(data.showcase)).toBe(true);
    expect(data.showcase.length).toBeGreaterThan(0);
    expect(data.showcase.every(project => project.id.length > 0)).toBe(true);
  });

  it('re-reads the file on every call', () => {
    expect(loadSiteData()).not.toBe(loadSiteData());
    expect(loadSiteData()).toEqual(loadSiteData());
  });

  it('reports the modification time as an ISO timestamp matching the file mtime', () => {
    const iso = dataModifiedIso();
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(iso).toBe(fs.statSync(DATA_PATH).mtime.toISOString());
  });

  it('reports the modification date as the YYYY-MM-DD prefix of the ISO timestamp', () => {
    expect(dataModifiedDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dataModifiedIso().startsWith(dataModifiedDate())).toBe(true);
  });
});
