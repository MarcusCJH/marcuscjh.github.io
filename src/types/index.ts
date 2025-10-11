// TypeScript interfaces for portfolio data structures

export interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

export interface NavigationItem {
  id: string;
  title: string;
  icon: string;
  enabled: boolean;
}

export interface TimelineItem {
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  category: 'work' | 'education' | 'certification';
  order: number;
  modalContent?: ModalContent;
}

export interface ShowcaseProject {
  id: string;
  title: string;
  backgroundImage: string;
  technologies?: string[];
  modalContent?: ModalContent;
}

export interface ModalContent {
  title?: string;
  subtitle?: string;
  location?: string;
  image?: string;
  video?: {
    src: string;
    type: string;
  };
  iframe?: string;
  description?: string;
  details?: string[];
  links?: {
    text: string;
    url: string;
  }[];
}

export interface Config {
  name: string;
  title: string;
  subtitle: string;
  typedMessages: string[];
  cvDriveId?: string;
}

export interface PortfolioData {
  config: Config;
  social: SocialLink[];
  navigation: NavigationItem[];
  timeline: TimelineItem[];
  showcase: ShowcaseProject[];
}

export interface CachedElements {
  [key: string]: HTMLElement | null;
}

export interface LoadingState {
  progress: number;
  messages: string[];
  currentMessageIndex: number;
  interval?: NodeJS.Timeout;
}

export interface TimelineState {
  currentFilter: string;
  currentSearch: string;
  currentIndex: number;
  filteredItems: TimelineItem[];
  isScrolling: boolean;
}

export interface TypedTextState {
  messageIndex: number;
  charIndex: number;
  isDeleting: boolean;
  messages: string[];
}

export interface DragState {
  isDragging: boolean;
  startX: number;
  scrollLeft: number;
}

export interface TouchState {
  startX: number;
  startY: number;
  isScrolling: boolean;
}
