import type { Rollup } from 'vite';
type NormalizedOutputOptions = Rollup.NormalizedOutputOptions;
type OutputBundle = Rollup.OutputBundle;
type PluginContext = Rollup.PluginContext;
import { describe, expect, it, vi } from 'vitest';
import { projectPagesPlugin } from './project-pages.ts';
import { loadSiteData } from './site-data.ts';
import { hookFunction } from './test-fixtures.ts';

type Generate = (this: PluginContext, o: NormalizedOutputOptions, b: OutputBundle) => void;

interface EmittedAsset {
  type: string;
  fileName: string;
  source: string;
}

function run(bundle: OutputBundle, errorImpl: (message: string) => void) {
  const emitFile = vi.fn<(file: EmittedAsset) => string>(() => 'ref');
  const error = vi.fn(errorImpl);
  const ctx = { emitFile, error } as unknown as PluginContext;
  hookFunction(projectPagesPlugin().generateBundle as unknown as Generate).call(
    ctx,
    {} as NormalizedOutputOptions,
    bundle
  );
  return { emitFile, error };
}

describe('projectPagesPlugin', () => {
  it('is a build-only plugin', () => {
    const plugin = projectPagesPlugin();
    expect(plugin.name).toBe('site:project-pages');
    expect(plugin.apply).toBe('build');
  });

  it('emits one prerendered page per project linking the hashed stylesheet', () => {
    const bundle = {
      'assets/index-abc.js': { type: 'chunk', fileName: 'assets/index-abc.js' },
      'assets/index-abc.css': { type: 'asset', fileName: 'assets/index-abc.css' },
    } as unknown as OutputBundle;
    const { emitFile, error } = run(bundle, () => undefined);
    const data = loadSiteData();
    expect(error).not.toHaveBeenCalled();
    expect(emitFile).toHaveBeenCalledTimes(data.showcase.length);
    const files = emitFile.mock.calls.map(([file]) => file);
    expect(files.map(file => file.fileName)).toEqual(
      data.showcase.map(project => `projects/${project.id}/index.html`)
    );
    for (const file of files) {
      expect(file.type).toBe('asset');
      expect(file.source.startsWith('<!doctype html>')).toBe(true);
      expect(file.source).toContain('<link rel="stylesheet" href="/assets/index-abc.css">');
    }
  });

  it('ignores JS chunks when looking for the stylesheet', () => {
    const bundle = {
      'a.css': { type: 'chunk', fileName: 'a.css' },
    } as unknown as OutputBundle;
    const { emitFile, error } = run(bundle, () => undefined);
    expect(error).toHaveBeenCalledTimes(1);
    expect(emitFile).not.toHaveBeenCalled();
  });

  it('reports an error and emits nothing when there is no CSS asset', () => {
    const { emitFile, error } = run({}, () => undefined);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('production CSS asset'));
    expect(emitFile).not.toHaveBeenCalled();
  });

  it('propagates the failure when this.error throws, as Rollup does', () => {
    expect(() =>
      run({}, message => {
        throw new Error(message);
      })
    ).toThrow('production CSS asset was not found');
  });
});
