// Loading service for managing loading states
import { DOMUtils } from '@/lib/dom';
import { APP_CONFIG, SELECTORS } from '@/lib/constants';

export interface LoadingState {
  progress: number;
  messages: string[];
  currentMessageIndex: number;
  interval?: NodeJS.Timeout;
}

export class LoadingService {
  private static instance: LoadingService;
  private state: LoadingState = {
    progress: 0,
    messages: [],
    currentMessageIndex: 0
  };

  private constructor() {
    this.state.messages = [
      'Initializing systems...',
      'Loading portfolio data...',
      'Setting up components...',
      'Preparing animations...',
      'Almost ready...'
    ];
  }

  public static getInstance(): LoadingService {
    if (!LoadingService.instance) {
      LoadingService.instance = new LoadingService();
    }
    return LoadingService.instance;
  }

  /**
   * Start loading animation
   */
  public startLoading(): void {
    const progressBar = DOMUtils.getElement('loading-progress') as HTMLElement;
    const loadingText = document.querySelector(SELECTORS.LOADING_TEXT) as HTMLElement;
    
    if (!progressBar) return;

    this.state.progress = 0;
    this.state.currentMessageIndex = 0;

    // Update initial loading text
    if (loadingText) {
      loadingText.textContent = this.state.messages[0];
    }

    this.state.interval = setInterval(() => {
      this.updateProgress(progressBar, loadingText);
    }, APP_CONFIG.LOADING_UPDATE_INTERVAL);
  }

  /**
   * Update loading progress
   */
  private updateProgress(progressBar: HTMLElement, loadingText: HTMLElement | null): void {
    // More realistic progress increments
    const increment = Math.random() * 8 + 2; // 2-10% increments
    this.state.progress += increment;

    // Update loading message based on progress
    this.updateLoadingMessage(loadingText);

    if (this.state.progress > 95) {
      this.state.progress = 95; // Stop at 95% until everything is ready
      if (this.state.interval) {
        clearInterval(this.state.interval);
      }
    }
    progressBar.style.width = `${this.state.progress}%`;
  }

  /**
   * Update loading message based on progress
   */
  private updateLoadingMessage(loadingText: HTMLElement | null): void {
    if (!loadingText) return;

    const { progress, currentMessageIndex, messages } = this.state;

    if (progress > 20 && currentMessageIndex === 0) {
      this.state.currentMessageIndex = 1;
      loadingText.textContent = messages[1];
    } else if (progress > 40 && currentMessageIndex === 1) {
      this.state.currentMessageIndex = 2;
      loadingText.textContent = messages[2];
    } else if (progress > 60 && currentMessageIndex === 2) {
      this.state.currentMessageIndex = 3;
      loadingText.textContent = messages[3];
    } else if (progress > 80 && currentMessageIndex === 3) {
      this.state.currentMessageIndex = 4;
      loadingText.textContent = messages[4];
    }
  }

  /**
   * Complete loading and hide loading screen
   */
  public completeLoading(): void {
    const progressBar = DOMUtils.getElement('loading-progress') as HTMLElement;
    const loadingScreen = DOMUtils.getElement('loading-screen') as HTMLElement;
    const loadingText = document.querySelector(SELECTORS.LOADING_TEXT) as HTMLElement;
    const mainContainer = document.querySelector(SELECTORS.MAIN_CONTAINER) as HTMLElement;

    // Complete the progress bar to 100%
    if (progressBar) {
      progressBar.style.width = '100%';
    }

    // Show final message
    if (loadingText) {
      loadingText.textContent = 'Ready!';
    }

    // Wait a moment for the user to see 100% and "Ready!", then start transition
    setTimeout(() => {
      if (loadingScreen) {
        loadingScreen.classList.add('hidden');
      }

      // Wait for the CSS transition to complete before showing main content
      setTimeout(() => {
        if (mainContainer) {
          mainContainer.style.opacity = '1';
          mainContainer.style.visibility = 'visible';
        }
      }, 500); // Match the CSS transition duration
    }, 500);
  }

  /**
   * Get current loading state
   */
  public getState(): LoadingState {
    return { ...this.state };
  }
}
