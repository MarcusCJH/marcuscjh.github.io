import type { Rollup } from 'vite';
type NormalizedOutputOptions = Rollup.NormalizedOutputOptions;
type OutputBundle = Rollup.OutputBundle;
type PluginContext = Rollup.PluginContext;
import { describe, expect, it, vi } from 'vitest';
import { renderManifest } from './builders/manifest.ts';
import { loadSiteData } from './site-data.ts';
import { hookFunction } from './test-fixtures.ts';
import { webManifestPlugin } from './web-manifest.ts';

type Generate = (this: PluginContext, o: NormalizedOutputOptions, b: OutputBundle) => void;

describe('webManifestPlugin', () => {
  it('emits manifest.json as an asset built from data.json', () => {
    const plugin = webManifestPlugin();
    expect(plugin.name).toBe('site:web-manifest');
    expect(plugin.apply).toBe('build');
    const emitFile = vi.fn();
    const ctx = { emitFile } as unknown as PluginContext;
    hookFunction(plugin.generateBundle as unknown as Generate).call(
      ctx,
      {} as NormalizedOutputOptions,
      {}
    );
    expect(emitFile).toHaveBeenCalledTimes(1);
    expect(emitFile).toHaveBeenCalledWith({
      type: 'asset',
      fileName: 'manifest.json',
      source: renderManifest(loadSiteData()),
    });
  });
});
