// Loading service for managing loading states
import { DOMUtils } from '@/lib/dom';
import { APP_CONFIG, DEFAULT_TEXT, SELECTORS } from '@/lib/constants';

export interface LoadingState {
  progress: number;
  messages: string[];
  currentMessageIndex: number;
  interval?: ReturnType<typeof setInterval>;
}

export class LoadingService {
  private static instance: LoadingService;
  private readyMessage: string = DEFAULT_TEXT.loadingReady;
  private state: LoadingState = {
    progress: 0,
    messages: [],
    currentMessageIndex: 0,
  };

  private constructor() {
    this.state.messages = [...DEFAULT_TEXT.loadingMessages];
  }

  /** Replace the progress copy once data.json has loaded. */
  public setMessages(messages?: string[], ready?: string): void {
    if (messages?.length) {
      this.state.messages = [...messages];
    }
    if (ready) {
      this.readyMessage = ready;
    }
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
    const loadingCounter = document.querySelector('.loading-counter') as HTMLElement;

    if (!progressBar) {
      return;
    }

    this.state.progress = 0;
    this.state.currentMessageIndex = 0;

    // Update initial loading text
    if (loadingText) {
      loadingText.textContent = this.state.messages[0];
    }
    if (loadingCounter) {
      loadingCounter.textContent = '00%';
    }

    this.state.interval = setInterval(() => {
      this.updateProgress(progressBar, loadingText, loadingCounter);
    }, APP_CONFIG.LOADING_UPDATE_INTERVAL);
  }

  /**
   * Update loading progress
   */
  private updateProgress(
    progressBar: HTMLElement,
    loadingText: HTMLElement | null,
    loadingCounter: HTMLElement | null
  ): void {
    // More realistic progress increments
    const increment = Math.random() * 14 + 8; // 8-22% increments
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
    progressBar.parentElement?.setAttribute('aria-valuenow', `${Math.round(this.state.progress)}`);
    if (loadingCounter) {
      loadingCounter.textContent = `${Math.round(this.state.progress).toString().padStart(2, '0')}%`;
    }
  }

  /**
   * Update loading message based on progress
   */
  private updateLoadingMessage(loadingText: HTMLElement | null): void {
    if (!loadingText) {
      return;
    }

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
    const loadingCounter = document.querySelector('.loading-counter') as HTMLElement;
    const mainContainer = document.querySelector(SELECTORS.MAIN_CONTAINER) as HTMLElement;

    // Update internal state to 100%
    this.state.progress = 100;

    // Complete the progress bar to 100%
    if (progressBar) {
      progressBar.style.width = '100%';
      progressBar.parentElement?.setAttribute('aria-valuenow', '100');
    }
    if (loadingCounter) {
      loadingCounter.textContent = '100%';
    }

    // Show final message
    if (loadingText) {
      loadingText.textContent = this.readyMessage;
    }

    // Brief beat so the bar is seen reaching 100%, then hand over. Both
    // delays are deliberately short — they sit directly in front of first
    // meaningful paint.
    setTimeout(() => {
      if (loadingScreen) {
        loadingScreen.classList.add('hidden');
      }

      setTimeout(() => {
        if (mainContainer) {
          mainContainer.style.opacity = '1';
          mainContainer.style.visibility = 'visible';
        }
      }, 160);
    }, 180);
  }

  /**
   * Get current loading state
   */
  public getState(): LoadingState {
    return { ...this.state };
  }
}
