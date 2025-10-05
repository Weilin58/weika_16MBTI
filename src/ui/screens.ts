export type ScreenId = 'welcome' | 'quiz' | 'results';

export interface ScreenElements {
  welcome: HTMLElement;
  quiz: HTMLElement;
  results: HTMLElement;
}

export function getScreens(): ScreenElements {
  const welcome = document.getElementById('welcome-screen');
  const quiz = document.getElementById('quiz-screen');
  const results = document.getElementById('results-screen');
  if (!welcome || !quiz || !results) {
    throw new Error('Screen elements not found');
  }
  return { welcome, quiz, results };
}

export function showScreen(id: ScreenId, screens: ScreenElements): void {
  Object.entries(screens).forEach(([key, element]) => {
    element.style.display = key === id ? 'block' : 'none';
  });
}

export function setupDarkMode(): void {
  const toggle = document.getElementById('dark-mode-toggle');
  const sunIcon = document.getElementById('sun-icon');
  const moonIcon = document.getElementById('moon-icon');
  if (!toggle || !sunIcon || !moonIcon) {
    return;
  }

  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    } else {
      document.documentElement.classList.remove('dark');
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    }
  };

  let isDarkMode = localStorage.getItem('darkMode') === 'true';
  applyTheme(isDarkMode);

  toggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', String(isDarkMode));
    applyTheme(isDarkMode);
  });
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export function showToast(message: string, type: ToastType = 'success'): void {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  const colors: Record<ToastType, string> = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };
  toast.style.backgroundColor = colors[type] ?? colors.success;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

export function setupBeforeUnload(shouldWarn: () => boolean): void {
  window.addEventListener('beforeunload', (event) => {
    if (shouldWarn()) {
      event.preventDefault();
      event.returnValue = '您尚未完成測驗,確定要離開嗎?';
    }
  });
}
