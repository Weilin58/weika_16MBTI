import type { QuizResult } from './scoring';

const STORAGE_KEY = 'personalityQuizState';

type ScreenId = 'welcome' | 'quiz' | 'results';

export interface StoredState {
  answers: Record<number, number>;
  results: QuizResult | null;
  currentScreen: ScreenId;
}

export function saveState(state: StoredState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export function loadState(): StoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        answers: typeof parsed.answers === 'object' ? parsed.answers : {},
        results: parsed.results ?? null,
        currentScreen: parsed.currentScreen ?? 'welcome',
      };
    }
  } catch (error) {
    console.error('Failed to parse saved state:', error);
    localStorage.removeItem(STORAGE_KEY);
  }
  return null;
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function encodeAnswers(answers: Record<number, number>): string {
  return btoa(JSON.stringify(answers));
}

export function decodeAnswers(encoded: string): Record<number, number> | null {
  try {
    const decoded = atob(encoded);
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (error) {
    console.error('Failed to decode answers:', error);
  }
  return null;
}

export function getSharedAnswersFromUrl(): Record<number, number> | null {
  const params = new URLSearchParams(window.location.search);
  const payload = params.get('results');
  if (!payload) {
    return null;
  }
  const answers = decodeAnswers(payload);
  if (answers) {
    return answers;
  }
  return null;
}

export function clearShareParam(): void {
  if (window.history && window.history.replaceState) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

export function buildShareUrl(answers: Record<number, number>): string {
  const encoded = encodeAnswers(answers);
  return `${window.location.origin}${window.location.pathname}?results=${encoded}`;
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  fallbackCopyToClipboard(text);
}

function fallbackCopyToClipboard(text: string): void {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (error) {
    console.error('Fallback copy failed:', error);
  }
  document.body.removeChild(textArea);
}

export function isStateIncomplete(state: StoredState, totalQuestions: number): boolean {
  const answered = Object.keys(state.answers).length;
  return answered > 0 && answered < totalQuestions;
}
