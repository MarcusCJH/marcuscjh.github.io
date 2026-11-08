import './styles/style.css';

import { DataService } from './services/dataService';
import { LoadingService } from './services/loadingService';
import { SEOService } from './services/seoService';

import { APP_CONFIG, DEFAULT_TEXT } from './lib/constants';

import { applyCopy } from './features/copy';
import { initStaticIcons } from './features/static-icons';
import { initHero, initTypedIntro } from './features/hero';
import { initNav } from './features/nav';
import { initSocials } from './features/socials';
import { initTimeline } from './features/timeline';
import { initShowcase } from './features/showcase';
import { initFooter } from './features/footer';
import { initScrollAnimations, startEntranceAnimations } from './features/scroll-animations';
import { initModal, openModal, openResumeModal } from './features/modal';

async function bootstrap(): Promise<void> {
  const dataService = DataService.getInstance();
  const loadingService = LoadingService.getInstance();

  // The main container stays hidden until every section has been filled in.
  loadingService.hideMainContent();
  loadingService.startLoading();

  const startTime = Date.now();
  const data = await dataService.loadData();

  // Static meta tags are injected at build time (vite.config.ts);
  // only the data-driven structured data schemas are applied at runtime.
  SEOService.applyStructuredData(data);

  const config = dataService.getConfig();
  loadingService.setMessages(config.loadingMessages, config.loadingReady);

  initTypedIntro(config.typedMessages);
  applyCopy(config);
  initStaticIcons();
  initHero(config);
  initNav({
    navigation: dataService.getNavigation(),
    onResume: () => openResumeModal(config),
  });
  initSocials(dataService.getSocialLinks());
  initTimeline({
    items: dataService.getTimeline(),
    filters: config.filters ?? [...DEFAULT_TEXT.filters],
    emptyMessage: config.emptyMessage ?? DEFAULT_TEXT.emptyMessage,
    onOpenItem: item => openModal(item.company, item),
  });
  initShowcase({
    projects: dataService.getShowcase(),
    onOpenProject: project => openModal(project.title, project),
  });
  initFooter(config);
  initScrollAnimations();
  initModal();
  startEntranceAnimations();

  const elapsedTime = Date.now() - startTime;
  const remainingTime = Math.max(0, APP_CONFIG.MIN_LOADING_TIME - elapsedTime);
  if (remainingTime > 0) {
    await new Promise(resolve => setTimeout(resolve, remainingTime));
  }

  loadingService.completeLoading();
}

document.addEventListener('DOMContentLoaded', () => {
  void bootstrap();
});
