import type { ViteDevServer } from 'vite';
import { describe, expect, it, vi } from 'vitest';
import { renderManifest } from './builders/manifest.ts';
import { buildSitemap } from './builders/sitemap.ts';
import { devSeoRoutesPlugin } from './dev-seo-routes.ts';
import { dataModifiedDate, loadSiteData } from './site-data.ts';
import { hookFunction } from './test-fixtures.ts';

type Next = () => void;
type Handler = (req: { url?: string }, res: FakeResponse, next: Next) => void;

interface FakeResponse {
  setHeader: ReturnType<typeof vi.fn<(name: string, value: string) => void>>;
  end: ReturnType<typeof vi.fn<(body: string) => void>>;
}

interface Mounted {
  path: string | undefined;
  handler: Handler;
}

function install(): Mounted[] {
  const mounted: Mounted[] = [];
  const use = (first: string | Handler, second?: Handler): void => {
    if (typeof first === 'string' && second) {
      mounted.push({ path: first, handler: second });
    } else if (typeof first !== 'string') {
      mounted.push({ path: undefined, handler: first });
    }
  };
  const server = { middlewares: { use } } as unknown as ViteDevServer;
  const configure = hookFunction(devSeoRoutesPlugin().configureServer);
  void configure.call({} as never, server);
  return mounted;
}

function fakeResponse(): FakeResponse {
  return { setHeader: vi.fn(), end: vi.fn() };
}

function bodyOf(res: FakeResponse): string {
  return String(res.end.mock.calls[0]?.[0]);
}

describe('devSeoRoutesPlugin', () => {
  it('is a serve-only plugin that mounts three middlewares', () => {
    const plugin = devSeoRoutesPlugin();
    expect(plugin.name).toBe('site:dev-seo-routes');
    expect(plugin.apply).toBe('serve');
    const mounted = install();
    expect(mounted.map(entry => entry.path)).toEqual([undefined, '/manifest.json', '/sitemap.xml']);
  });

  describe('project pages', () => {
    const project = loadSiteData().showcase[0]!;
    const route = (url: string | undefined) => {
      const res = fakeResponse();
      const next = vi.fn();
      install()[0]!.handler({ url }, res, next);
      return { res, next };
    };

    it('serves a prerendered page linking the dev stylesheet', () => {
      const { res, next } = route(`/projects/${project.id}/`);
      expect(next).not.toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html; charset=utf-8');
      const body = bodyOf(res);
      expect(body.startsWith('<!doctype html>')).toBe(true);
      expect(body).toContain('<link rel="stylesheet" href="/src/styles/style.css">');
      expect(body).toContain(`/projects/${encodeURIComponent(project.id)}/`);
    });

    it('accepts a missing trailing slash and a query string', () => {
      expect(route(`/projects/${project.id}`).next).not.toHaveBeenCalled();
      expect(route(`/projects/${project.id}/?x=1`).next).not.toHaveBeenCalled();
    });

    it('decodes percent-encoded ids', () => {
      const encoded = [...project.id].map(c => `%${c.charCodeAt(0).toString(16)}`).join('');
      const { res, next } = route(`/projects/${encoded}/`);
      expect(next).not.toHaveBeenCalled();
      expect(res.end).toHaveBeenCalledTimes(1);
    });

    it('passes unknown projects through to the next middleware', () => {
      const { res, next } = route('/projects/does-not-exist/');
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.end).not.toHaveBeenCalled();
    });

    it.each([undefined, '/', '/projects/', '/projects/a/b/', '/other/alpha/'])(
      'passes non-matching url %s through',
      url => {
        const { res, next } = route(url);
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.end).not.toHaveBeenCalled();
      }
    );
  });

  it('serves the manifest as JSON', () => {
    const res = fakeResponse();
    install()[1]!.handler({}, res, vi.fn());
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(bodyOf(res)).toBe(renderManifest(loadSiteData()));
  });

  it('serves the sitemap as XML', () => {
    const res = fakeResponse();
    install()[2]!.handler({}, res, vi.fn());
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/xml');
    expect(bodyOf(res)).toBe(buildSitemap(loadSiteData(), dataModifiedDate()));
  });
});
