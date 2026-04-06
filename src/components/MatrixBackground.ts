// Matrix background animation component
import { APP_CONFIG } from '@/lib/constants';

export class MatrixBackground {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  private lastFrameTime = 0;
  private chars: string[] = [];
  private drops: number[] = [];
  private fontSize = 14;

  constructor() {
    this.init();
  }

  private init(): void {
    this.canvas = document.getElementById('matrix-canvas') as HTMLCanvasElement;
    if (!this.canvas) {
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      return;
    }

    this.setupCanvas();
    this.setupCharacters();
    this.setupDrops();
    this.startAnimation();
    this.setupResizeHandler();
  }

  private setupCanvas(): void {
    if (!this.canvas) {
      return;
    }

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private setupCharacters(): void {
    const charString = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?';
    this.chars = charString.split('');
  }

  private setupDrops(): void {
    if (!this.canvas) {
      return;
    }

    const columns = this.canvas.width / this.fontSize;
    this.drops = Array(Math.floor(columns)).fill(1);
  }

  private startAnimation(): void {
    if (!this.canvas || !this.ctx) {
      return;
    }

    const animate = (timestamp: number) => {
      if (timestamp - this.lastFrameTime >= APP_CONFIG.MATRIX_ANIMATION_INTERVAL) {
        this.drawMatrix();
        this.lastFrameTime = timestamp;
      }
      this.animationId = window.requestAnimationFrame(animate);
    };
    this.animationId = window.requestAnimationFrame(animate);
  }

  private drawMatrix(): void {
    if (!this.canvas || !this.ctx) {
      return;
    }

    // Create trailing effect
    this.ctx.fillStyle = 'rgba(10, 10, 10, 0.04)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Set text properties
    this.ctx.fillStyle = '#00ff88';
    this.ctx.font = `${this.fontSize}px JetBrains Mono`;

    // Draw characters
    for (let i = 0; i < this.drops.length; i++) {
      const text = this.chars[Math.floor(Math.random() * this.chars.length)];
      this.ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);

      // Reset drop when it reaches bottom and randomly
      if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
        this.drops[i] = 0;
      }
      this.drops[i]++;
    }
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      this.setupCanvas();
      this.setupDrops();
    });
  }

  /**
   * Destroy the matrix background animation
   */
  public destroy(): void {
    if (this.animationId !== null) {
      window.cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
