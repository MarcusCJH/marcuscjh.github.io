// Particle system component
import { DOMUtils } from '@/lib/dom';
import { APP_CONFIG } from '@/lib/constants';

export class ParticleSystem {
  private container: HTMLElement | null = null;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.container = DOMUtils.getElement('particles-container') as HTMLElement;
    if (!this.container) return;

    this.startParticleGeneration();
  }

  private startParticleGeneration(): void {
    this.intervalId = setInterval(() => {
      this.createParticle();
    }, APP_CONFIG.PARTICLE_CREATION_INTERVAL);
  }

  private createParticle(): void {
    if (!this.container) return;

    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
    particle.style.animationDelay = Math.random() * 2 + 's';

    this.container.appendChild(particle);

    // Remove particle after animation completes
    setTimeout(() => {
      if (particle.parentNode) {
        particle.remove();
      }
    }, APP_CONFIG.PARTICLE_LIFETIME);
  }

  /**
   * Destroy the particle system
   */
  public destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
