import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import type { Config, PortfolioData } from './types';

/**
 * `main.ts` is the composition root: it has no behaviour of its own beyond
 * loading the data and handing each slice to the feature that owns it. So the
 * features and services are replaced with recorders and the test asserts the
 * wiring — what runs, in what order, with which data.
 */
const calls = vi.hoisted(() => [] as string[]);

const record = vi.hoisted(
  () => (name: string) =>
    vi.fn(() => {
      calls.push(name);
    })
);

const config: Config = {
  name: 'marcuscjh',
  real_name: 'Marcus Chan',
  title: 'Engineer',
  subtitle: 'Cloud',
  typedMessages: ['hello'],
  emptyMessage: 'Nothing matches.',
  filters: [{ id: 'all', label: 'All' }],
  loadingMessages: ['Booting'],
  loadingReady: 'Ready',
};

const data = vi.hoisted(() => ({ value: {} as PortfolioData }));
data.value = {
  config,
  social: [{ platform: 'GitHub', url: 'https://github.com/x', icon: '' }],
  navigation: [{ id: 'home', title: 'home', icon: '', enabled: true }],
  timeline: [
    {
      company: 'Accenture',
      title: 'Software Engineer',
      startDate: '2021',
      category: 'work',
      order: 1,
    },
  ],
  showcase: [{ id: 'datav', title: 'DataV', backgroundImage: '' }],
};

const dataService = vi.hoisted(() => ({
  loadData: vi.fn(),
  getConfig: vi.fn(),
  getSocialLinks: vi.fn(),
  getNavigation: vi.fn(),
  getTimeline: vi.fn(),
  getShowcase: vi.fn(),
}));

const loadingService = vi.hoisted(() => ({
  hideMainContent: vi.fn(),
  startLoading: vi.fn(),
  setMessages: vi.fn(),
  completeLoading: vi.fn(),
}));

const features = vi.hoisted(() => ({
  applyCopy: vi.fn(),
  initStaticIcons: vi.fn(),
  initHero: vi.fn(),
  initTypedIntro: vi.fn(),
  initNav: vi.fn(),
  initSocials: vi.fn(),
  initTimeline: vi.fn(),
  initShowcase: vi.fn(),
  initFooter: vi.fn(),
  initScrollAnimations: vi.fn(),
  startEntranceAnimations: vi.fn(),
  initModal: vi.fn(),
  openModal: vi.fn(),
  openResumeModal: vi.fn(),
  applyStructuredData: vi.fn(),
}));

vi.mock('./services/dataService', () => ({
  DataService: { getInstance: () => dataService },
}));

vi.mock('./services/loadingService', () => ({
  LoadingService: { getInstance: () => loadingService },
}));

vi.mock('./services/seoService', () => ({
  SEOService: { applyStructuredData: features.applyStructuredData },
}));

vi.mock('./features/copy', () => ({ applyCopy: features.applyCopy }));
vi.mock('./features/static-icons', () => ({ initStaticIcons: features.initStaticIcons }));
vi.mock('./features/hero', () => ({
  initHero: features.initHero,
  initTypedIntro: features.initTypedIntro,
}));
vi.mock('./features/nav', () => ({ initNav: features.initNav }));
vi.mock('./features/socials', () => ({ initSocials: features.initSocials }));
vi.mock('./features/timeline', () => ({ initTimeline: features.initTimeline }));
vi.mock('./features/showcase', () => ({ initShowcase: features.initShowcase }));
vi.mock('./features/footer', () => ({ initFooter: features.initFooter }));
vi.mock('./features/scroll-animations', () => ({
  initScrollAnimations: features.initScrollAnimations,
  startEntranceAnimations: features.startEntranceAnimations,
}));
vi.mock('./features/modal', () => ({
  initModal: features.initModal,
  openModal: features.openModal,
  openResumeModal: features.openResumeModal,
}));

/** Boot the app the way the browser does: fire DOMContentLoaded and wait. */
async function bootstrap(): Promise<void> {
  document.dispatchEvent(new Event('DOMContentLoaded'));
  await vi.waitFor(() => {
    expect(loadingService.completeLoading).toHaveBeenCalled();
  });
}

describe('main', () => {
  // Imported once: the module registers its DOMContentLoaded listener at
  // import time, and a second import would leave two listeners on the
  // document and boot the app twice per event.
  beforeAll(async () => {
    await import('./main');
  });

  beforeEach(() => {
    calls.length = 0;
    Object.values(features).forEach(mock => mock.mockReset());
    Object.values(loadingService).forEach(mock => mock.mockReset());

    dataService.loadData.mockReset();
    dataService.loadData.mockResolvedValue(data.value);
    dataService.getConfig.mockReturnValue(config);
    dataService.getSocialLinks.mockReturnValue(data.value.social);
    dataService.getNavigation.mockReturnValue(data.value.navigation);
    dataService.getTimeline.mockReturnValue(data.value.timeline);
    dataService.getShowcase.mockReturnValue(data.value.showcase);

    // Order recorders, applied after the resets above.
    loadingService.hideMainContent.mockImplementation(record('hideMainContent'));
    loadingService.startLoading.mockImplementation(record('startLoading'));
    loadingService.completeLoading.mockImplementation(record('completeLoading'));
    features.applyStructuredData.mockImplementation(record('applyStructuredData'));
    features.initTypedIntro.mockImplementation(record('initTypedIntro'));
    features.applyCopy.mockImplementation(record('applyCopy'));
    features.initStaticIcons.mockImplementation(record('initStaticIcons'));
    features.initHero.mockImplementation(record('initHero'));
    features.initNav.mockImplementation(record('initNav'));
    features.initSocials.mockImplementation(record('initSocials'));
    features.initTimeline.mockImplementation(record('initTimeline'));
    features.initShowcase.mockImplementation(record('initShowcase'));
    features.initFooter.mockImplementation(record('initFooter'));
    features.initScrollAnimations.mockImplementation(record('initScrollAnimations'));
    features.initModal.mockImplementation(record('initModal'));
    features.startEntranceAnimations.mockImplementation(record('startEntranceAnimations'));
  });

  it('boots only on DOMContentLoaded, not on import', () => {
    expect(dataService.loadData).not.toHaveBeenCalled();
    expect(features.applyCopy).not.toHaveBeenCalled();
  });

  it('wires every feature once, in order, behind the loading screen', async () => {
    await bootstrap();

    expect(calls).toEqual([
      'hideMainContent',
      'startLoading',
      'applyStructuredData',
      'initTypedIntro',
      'applyCopy',
      'initStaticIcons',
      'initHero',
      'initNav',
      'initSocials',
      'initTimeline',
      'initShowcase',
      'initFooter',
      'initScrollAnimations',
      'initModal',
      'startEntranceAnimations',
      'completeLoading',
    ]);
  });

  it('applies the structured data to the loaded payload', async () => {
    await bootstrap();

    expect(features.applyStructuredData).toHaveBeenCalledWith(data.value);
  });

  it('hands each feature the slice of data it owns', async () => {
    await bootstrap();

    expect(features.initTypedIntro).toHaveBeenCalledWith(config.typedMessages);
    expect(features.applyCopy).toHaveBeenCalledWith(config);
    expect(features.initHero).toHaveBeenCalledWith(config);
    expect(features.initFooter).toHaveBeenCalledWith(config);
    expect(features.initSocials).toHaveBeenCalledWith(data.value.social);
    expect(loadingService.setMessages).toHaveBeenCalledWith(
      config.loadingMessages,
      config.loadingReady
    );
  });

  it('gives the nav a resume handler that opens the resume dialog', async () => {
    await bootstrap();

    const options = features.initNav.mock.calls[0]?.[0] as
      { navigation: unknown; onResume: () => void } | undefined;
    expect(options?.navigation).toBe(data.value.navigation);

    options?.onResume();
    expect(features.openResumeModal).toHaveBeenCalledWith(config);
  });

  it('gives the timeline its items, filters and empty message', async () => {
    await bootstrap();

    const options = features.initTimeline.mock.calls[0]?.[0] as
      | {
          items: unknown;
          filters: { id: string }[];
          emptyMessage: string;
          onOpenItem: (item: unknown) => void;
        }
      | undefined;
    expect(options?.items).toBe(data.value.timeline);
    expect(options?.filters).toEqual(config.filters);
    expect(options?.emptyMessage).toBe(config.emptyMessage);

    const item = data.value.timeline[0];
    options?.onOpenItem(item);
    expect(features.openModal).toHaveBeenCalledWith('Accenture', item);
  });

  it('falls back to the built-in filters and empty message', async () => {
    dataService.getConfig.mockReturnValue({
      ...config,
      filters: undefined,
      emptyMessage: undefined,
    });

    await bootstrap();

    const options = features.initTimeline.mock.calls[0]?.[0] as
      { filters: { id: string }[]; emptyMessage: string } | undefined;
    expect(options?.filters.map(filter => filter.id)).toEqual([
      'all',
      'work',
      'education',
      'certification',
    ]);
    expect(options?.emptyMessage).toBe('No entries match that filter.');
  });

  it('gives the showcase its projects and a handler that opens the project dialog', async () => {
    await bootstrap();

    const options = features.initShowcase.mock.calls[0]?.[0] as
      { projects: unknown; onOpenProject: (project: unknown) => void } | undefined;
    expect(options?.projects).toBe(data.value.showcase);

    const project = data.value.showcase[0];
    options?.onOpenProject(project);
    expect(features.openModal).toHaveBeenCalledWith('DataV', project);
  });
});
