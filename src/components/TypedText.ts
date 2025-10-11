// Typed text animation component
import { DOMUtils } from '@/lib/dom';
import { APP_CONFIG } from '@/lib/constants';

export interface TypedTextState {
  messageIndex: number;
  charIndex: number;
  isDeleting: boolean;
  messages: string[];
}

export class TypedText {
  private element: HTMLElement | null = null;
  private state: TypedTextState = {
    messageIndex: 0,
    charIndex: 0,
    isDeleting: false,
    messages: [],
  };
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(messages: string[]) {
    this.state.messages = messages;
    this.init();
  }

  private init(): void {
    this.element = DOMUtils.getElement('typed-text') as HTMLElement;
    if (!this.element) {
      return;
    }

    this.startTyping();
  }

  private startTyping(): void {
    this.typeText();
  }

  private typeText(): void {
    if (!this.element) {
      return;
    }

    const currentMessage = this.state.messages[this.state.messageIndex];

    if (this.state.isDeleting) {
      this.element.textContent = currentMessage.substring(0, this.state.charIndex - 1);
      this.state.charIndex--;
    } else {
      this.element.textContent = currentMessage.substring(0, this.state.charIndex + 1);
      this.state.charIndex++;
    }

    let typeSpeed: number = this.state.isDeleting
      ? APP_CONFIG.TYPED_TEXT_SPEEDS.DELETE
      : APP_CONFIG.TYPED_TEXT_SPEEDS.TYPE;

    if (!this.state.isDeleting && this.state.charIndex === currentMessage.length) {
      typeSpeed = APP_CONFIG.TYPED_TEXT_SPEEDS.PAUSE;
      this.state.isDeleting = true;
    } else if (this.state.isDeleting && this.state.charIndex === 0) {
      this.state.isDeleting = false;
      this.state.messageIndex = (this.state.messageIndex + 1) % this.state.messages.length;
      typeSpeed = APP_CONFIG.TYPED_TEXT_SPEEDS.NEXT_MESSAGE;
    }

    this.timeoutId = setTimeout(() => {
      this.typeText();
    }, typeSpeed);
  }

  /**
   * Update messages and restart typing
   */
  public updateMessages(messages: string[]): void {
    this.state.messages = messages;
    this.state.messageIndex = 0;
    this.state.charIndex = 0;
    this.state.isDeleting = false;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.startTyping();
  }

  /**
   * Get current state
   */
  public getState(): TypedTextState {
    return { ...this.state };
  }

  /**
   * Destroy the typed text component
   */
  public destroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
