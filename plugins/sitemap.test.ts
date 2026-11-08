import type { Rollup } from 'vite';
type NormalizedOutputOptions = Rollup.NormalizedOutputOptions;
type OutputBundle = Rollup.OutputBundle;
type PluginContext = Rollup.PluginContext;
import { describe, expect, it, vi } from 'vitest';
import { buildSitemap } from './builders/sitemap.ts';
import { dataModifiedDate, loadSiteData } from './site-data.ts';
import { sitemapPlugin } from './sitemap.ts';
import { hookFunction } from './test-fixtures.ts';

type Generate = (this: PluginContext, o: NormalizedOutputOptions, b: OutputBundle) => void;

describe('sitemapPlugin', () => {
  it('emits sitemap.xml as an asset with one entry per project', () => {
    const plugin = sitemapPlugin();
    expect(plugin.name).toBe('site:sitemap');
    expect(plugin.apply).toBe('build');
    const emitFile = vi.fn();
    const ctx = { emitFile } as unknown as PluginContext;
    hookFunction(plugin.generateBundle as unknown as Generate).call(
      ctx,
      {} as NormalizedOutputOptions,
      {}
    );
    const data = loadSiteData();
    expect(emitFile).toHaveBeenCalledTimes(1);
    expect(emitFile).toHaveBeenCalledWith({
      type: 'asset',
      fileName: 'sitemap.xml',
      source: buildSitemap(data, dataModifiedDate()),
    });
    expect(buildSitemap(data, '2000-01-01').match(/<loc>/g)).toHaveLength(data.showcase.length + 1);
  });
});
