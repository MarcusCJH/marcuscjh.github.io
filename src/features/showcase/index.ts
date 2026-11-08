import { DOMUtils, onActivate } from '../../lib/dom';
import { markup, setHtml } from '../../lib/html';
import type { ShowcaseProject } from '../../types';

export interface ShowcaseOptions {
  projects: ShowcaseProject[];
  onOpenProject: (project: ShowcaseProject) => void;
}

export function initShowcase({ projects, onOpenProject }: ShowcaseOptions): void {
  const showcaseContainer = DOMUtils.getElement('showcase-grid');

  if (!projects || !showcaseContainer) {
    return;
  }

  setHtml(
    showcaseContainer,
    projects.map((project, index) => {
      // A real <img> rather than a background-image: it can be lazy-loaded,
      // it reserves its box via aspect-ratio, and it decodes off-thread.
      const eager = index < 3;
      const media = project.backgroundImage
        ? markup`<img class="showcase-media" src="${project.backgroundImage}" alt="${project.title} project preview"
               loading="${eager ? 'eager' : 'lazy'}" decoding="async"
               fetchpriority="${eager ? 'high' : 'auto'}">`
        : '';

      const tech = project.technologies?.length
        ? markup`<div class="tech-stack">${project.technologies.map(
            item => markup`<span class="tech-badge">${item}</span>`
          )}</div>`
        : '';

      return markup`
      <article class="showcase-card" role="button" tabindex="0" aria-label="View project: ${project.title}" data-showcase-item data-project-id="${project.id}">
        <div class="showcase-image">
          ${media}
          <div class="showcase-overlay" aria-hidden="true"></div>
          <span class="showcase-index" aria-hidden="true"></span>
        </div>
        <div class="showcase-content">
          <h3 class="showcase-title"><span><a href="/projects/${encodeURIComponent(project.id)}/">${project.title}</a></span></h3>
          ${tech}
        </div>
      </article>
    `;
    })
  );

  showcaseContainer.querySelectorAll('[data-showcase-item]').forEach(item => {
    item.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', event => event.stopPropagation());
      link.addEventListener('keydown', event => event.stopPropagation());
    });
    onActivate(item, () => {
      const projectId = (item as HTMLElement).dataset.projectId;
      const project = projects.find(p => p.id === projectId);
      if (project) {
        onOpenProject(project);
      }
    });
  });
}
