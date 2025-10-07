import './styles.css';
import { quizConfig } from './data/index';
import { calculateResults, sanityCheck, type QuizResult } from './core/scoring';
import {
  loadState,
  saveState,
  clearState,
  getSharedAnswersFromUrl,
  clearShareParam,
  buildShareUrl,
  copyTextToClipboard,
  isStateIncomplete,
  type StoredState,
} from './core/storage';
import { exportAsJson, exportAsCsv, downloadBlob } from './core/export';
import { renderQuiz, updateProgress } from './ui/renderQuiz';
import { renderResults, destroyChart } from './ui/renderResults';
import { getScreens, setupDarkMode, showScreen, showToast, setupBeforeUnload, type ScreenId } from './ui/screens';
import { testPresets, type TestPresetKey } from './tests/presets';

const appElement = document.querySelector<HTMLDivElement>('#app');
if (!appElement) {
  throw new Error('App container not found');
}

appElement.innerHTML = `
  <div class="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
    <header class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">高維度整合人格量表</h1>
      <button id="dark-mode-toggle" class="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="切換深色模式">
        <svg id="sun-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
        <svg id="moon-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon hidden"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
      </button>
    </header>

    <div
      id="welcome-screen"
      class="fade-in relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-950 dark:to-black shadow-2xl"
    >
      <div class="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-amber-200/60 blur-3xl dark:bg-amber-500/10"></div>
      <div class="absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-blue-200/50 blur-3xl dark:bg-blue-500/10"></div>
      <div class="relative z-10 grid gap-10 p-8 sm:p-10 lg:grid-cols-[1.1fr,0.9fr]">
        <div class="space-y-6">
          <div class="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-amber-700 shadow-sm ring-1 ring-white/50 dark:bg-white/5 dark:text-amber-200 dark:ring-amber-500/30">
            <span class="inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
            高維度整合人格量表
          </div>
          <h2 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            探索你的內在輪廓
          </h2>
          <p class="text-base leading-relaxed text-slate-600 dark:text-slate-300">
            本量表將透過 48 道題目,從多個維度分析您的人格特質、價值觀與決策風格。這不僅是一個 MBTI 測驗,更整合了情緒穩定度、社會適應力等多重面向,為您提供一份深入的個人化報告。
          </p>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-white/50 backdrop-blur-sm dark:bg-slate-900/60 dark:ring-slate-700">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-semibold text-slate-900 dark:text-white">預估時間</p>
                  <p class="text-sm text-slate-500 dark:text-slate-300">10-15 分鐘</p>
                </div>
              </div>
            </div>
            <div class="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-white/50 backdrop-blur-sm dark:bg-slate-900/60 dark:ring-slate-700">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-semibold text-slate-900 dark:text-white">結果保護</p>
                  <p class="text-sm text-slate-500 dark:text-slate-300">僅儲存於您的瀏覽器</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col justify-between gap-6 rounded-3xl bg-white/85 p-6 shadow-xl ring-1 ring-white/60 backdrop-blur-md dark:bg-slate-900/70 dark:ring-slate-700">
          <div>
            <div class="mb-4 flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-white">
              <span class="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg">!</span>
              作答須知
            </div>
            <ul class="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li class="flex items-start gap-3">
                <span class="mt-0.5 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-amber-500"></span>
                請依據您最真實、最自然的想法作答。
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-0.5 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-amber-500"></span>
                所有題目沒有對錯之分。
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-0.5 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-amber-500"></span>
                測驗結果將儲存於您的瀏覽器中,不會上傳至任何伺服器。
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-0.5 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-amber-500"></span>
                預計作答時間約為 10-15 分鐘。
              </li>
            </ul>
          </div>
          <button
            id="start-btn"
            class="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3 text-lg font-semibold text-white shadow-lg transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <span class="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-transform group-hover:translate-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-7 7 7-7-7-7" />
              </svg>
            </span>
            開始測驗
          </button>
        </div>
      </div>
      <div class="relative z-10 border-t border-slate-200/70 px-8 py-6 dark:border-slate-800/80">
        <h3 class="text-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">開發者測試區</h3>
        <div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <button class="test-btn text-xs font-medium uppercase tracking-wide text-slate-700 transition hover:-translate-y-0.5 hover:bg-white/80 hover:shadow dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:shadow-lg rounded-lg border border-slate-200/60 bg-white/70 px-3 py-2 dark:border-slate-700/80" data-case="ntp_a">測試案例 1: NTP-A</button>
          <button class="test-btn text-xs font-medium uppercase tracking-wide text-slate-700 transition hover:-translate-y-0.5 hover:bg-white/80 hover:shadow dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:shadow-lg rounded-lg border border-slate-200/60 bg-white/70 px-3 py-2 dark:border-slate-700/80" data-case="stj_a">測試案例 2: STJ-A</button>
          <button class="test-btn text-xs font-medium uppercase tracking-wide text-slate-700 transition hover:-translate-y-0.5 hover:bg-white/80 hover:shadow dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:shadow-lg rounded-lg border border-slate-200/60 bg-white/70 px-3 py-2 dark:border-slate-700/80" data-case="nfp_t">測試案例 3: NFP-T</button>
          <button class="test-btn text-xs font-medium uppercase tracking-wide text-slate-700 transition hover:-translate-y-0.5 hover:bg-white/80 hover:shadow dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:shadow-lg rounded-lg border border-slate-200/60 bg-white/70 px-3 py-2 dark:border-slate-700/80" data-case="entj_a">測試案例 4: ENTJ-A</button>
          <button class="test-btn text-xs font-medium uppercase tracking-wide text-slate-700 transition hover:-translate-y-0.5 hover:bg-white/80 hover:shadow dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:shadow-lg rounded-lg border border-slate-200/60 bg-white/70 px-3 py-2 dark:border-slate-700/80" data-case="intj_t">測試案例 5: INTJ-T</button>
          <button class="test-btn text-xs font-medium uppercase tracking-wide text-slate-700 transition hover:-translate-y-0.5 hover:bg-white/80 hover:shadow dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:shadow-lg rounded-lg border border-slate-200/60 bg-white/70 px-3 py-2 dark:border-slate-700/80" data-case="isfp_a">測試案例 6: ISFP-A</button>
          <button class="test-btn text-xs font-medium uppercase tracking-wide text-slate-700 transition hover:-translate-y-0.5 hover:bg-white/80 hover:shadow dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:shadow-lg rounded-lg border border-slate-200/60 bg-white/70 px-3 py-2 dark:border-slate-700/80" data-case="enfp_t">測試案例 7: ENFP-T</button>
        </div>
      </div>
    </div>

    <div id="quiz-screen" class="hidden fade-in">
      <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
        <div class="mb-6">
          <div class="flex justify-between mb-1">
            <span class="text-base font-medium text-blue-700 dark:text-white">進度</span>
            <span id="progress-text" class="text-sm font-medium text-blue-700 dark:text-white">0 / 48</span>
          </div>
          <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
            <div id="progress-bar" class="bg-blue-600 h-2.5 rounded-full progress-bar-inner" style="width: 0%"></div>
          </div>
        </div>
        <div id="questions-container" class="space-y-8"></div>
        <div class="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <button id="reset-btn" class="w-full sm:w-auto bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-2 px-6 rounded-lg transition">
            重新作答
          </button>
          <button id="submit-btn" class="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105 disabled:bg-slate-400 disabled:dark:bg-slate-600 disabled:cursor-not-allowed disabled:transform-none">
            完成並查看結果
          </button>
        </div>
      </div>
    </div>

    <div id="results-screen" class="hidden fade-in">
      <div class="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg">
        <div id="results-content"></div>
        <div class="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-center items-center gap-4">
          <button id="retake-btn" class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition">重新測驗</button>
          <button id="share-btn" class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition">複製分享連結</button>
          <div class="w-full sm:w-auto flex gap-2">
            <button id="export-json-btn" class="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg transition">匯出 JSON</button>
            <button id="export-csv-btn" class="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg transition">匯出 CSV</button>
          </div>
        </div>
      </div>
    </div>

    <footer class="text-center mt-8 text-xs text-slate-500 dark:text-slate-400">
      <p class="mb-2"><strong>免責聲明:</strong>此量表僅供自我探索、團隊溝通與娛樂之用,非臨床診斷工具,不可作為聘用人才的唯一依據。</p>
      <p>&copy; 2025 高維度整合人格量表. All rights reserved.</p>
    </footer>
  </div>
`;

setupDarkMode();
sanityCheck();

const screens = getScreens();
const startButton = document.getElementById('start-btn') as HTMLButtonElement | null;
const submitButton = document.getElementById('submit-btn') as HTMLButtonElement | null;
const resetButton = document.getElementById('reset-btn') as HTMLButtonElement | null;
const questionsContainer = document.getElementById('questions-container') as HTMLElement | null;
const progressBar = document.getElementById('progress-bar') as HTMLElement | null;
const progressText = document.getElementById('progress-text') as HTMLElement | null;
const resultsContainer = document.getElementById('results-content') as HTMLElement | null;

if (!submitButton || !questionsContainer || !progressBar || !progressText || !resultsContainer) {
  throw new Error('必要的 DOM 元素缺失');
}

const submitButtonEl = submitButton;
const questionsContainerEl = questionsContainer;
const progressBarEl = progressBar;
const progressTextEl = progressText;
const resultsContainerEl = resultsContainer;

const totalQuestions = quizConfig.items.length;

interface AppState {
  currentScreen: ScreenId;
  answers: Record<number, number>;
  results: QuizResult | null;
}

const appState: AppState = {
  currentScreen: 'welcome',
  answers: {},
  results: null,
};

function persistState(): void {
  const state: StoredState = {
    answers: appState.answers,
    results: appState.results,
    currentScreen: appState.currentScreen,
  };
  saveState(state);
}

function updateProgressBar(): void {
  updateProgress(appState.answers, totalQuestions, progressBarEl, progressTextEl, submitButtonEl);
}

function renderQuizUI(): void {
  renderQuiz({
    container: questionsContainerEl,
    config: quizConfig,
    answers: appState.answers,
    onSelect: (questionId, score) => {
      appState.answers[questionId] = score;
    },
    onAfterSelect: () => {
      persistState();
      updateProgressBar();
    },
  });
  updateProgressBar();
}

function switchScreen(id: ScreenId): void {
  appState.currentScreen = id;
  showScreen(id, screens);
  persistState();
}

function resetQuiz(): void {
  appState.answers = {};
  appState.results = null;
  destroyChart();
  clearState();
  renderQuizUI();
  updateProgressBar();
  switchScreen('welcome');
  showToast('已重置測驗', 'success');
}

function handleRetake(): void {
  if (confirm('您確定要清除所有作答紀錄並重新開始嗎?')) {
    resetQuiz();
  }
}

function ensureResults(): QuizResult | null {
  if (!appState.results) {
    showToast('請先完成測驗以匯出結果', 'warning');
    return null;
  }
  return appState.results;
}

function handleExport(format: 'json' | 'csv'): void {
  const result = ensureResults();
  if (!result) {
    return;
  }
  try {
    const blob = format === 'json' ? exportAsJson({ answers: appState.answers, result }) : exportAsCsv({ answers: appState.answers, result });
    const filename = `personality_results_${Date.now()}.${format}`;
    downloadBlob(blob, filename);
    showToast(`${format.toUpperCase()} 匯出成功`, 'success');
  } catch (error) {
    console.error('Export failed:', error);
    showToast('匯出失敗,請稍後再試', 'error');
  }
}

async function handleShare(): Promise<void> {
  if (Object.keys(appState.answers).length !== totalQuestions) {
    showToast('請先完成測驗再分享結果', 'warning');
    return;
  }
  try {
    const shareUrl = buildShareUrl(appState.answers);
    if (shareUrl.length > 2000) {
      showToast('分享連結過長,建議使用匯出功能', 'warning');
      return;
    }
    await copyTextToClipboard(shareUrl);
    showToast('分享連結已複製到剪貼簿!', 'success');
  } catch (error) {
    console.error('Share failed:', error);
    showToast('複製失敗,請手動複製連結', 'error');
  }
}

function showResults(result: QuizResult, toastMessage?: string): void {
  appState.results = result;
  renderResults({
    container: resultsContainerEl,
    result,
    onRetake: handleRetake,
    onShare: handleShare,
    onExportJson: () => handleExport('json'),
    onExportCsv: () => handleExport('csv'),
  });
  switchScreen('results');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (toastMessage) {
    showToast(toastMessage, 'info');
  }
}

function evaluateAndRender(): void {
  const result = calculateResults(appState.answers);
  showResults(result, '分析完成!');
  persistState();
}

function runTest(key: TestPresetKey): void {
  const data = testPresets[key];
  if (!data) {
    showToast('找不到測試案例', 'error');
    return;
  }

  appState.answers = {};

  const keyMap: Record<string, string[]> = {
    E: ['E'],
    I: ['I'],
    N: ['N'],
    S: ['S'],
    T: ['T'],
    F: ['F'],
    J: ['J'],
    P: ['P'],
    'ES+': ['ESPlus', 'ES'],
    'ES-': ['ESMinus', 'ES'],
    'SA+': ['SAPlus', 'SA'],
    'SA-': ['SAMinus', 'SA'],
    'IC+': ['ICPlus', 'IC'],
    'IC-': ['ICMinus', 'IC'],
    ST: ['ST'],
    SE: ['SE'],
    OP: ['OP'],
    CO: ['CO'],
  };

  quizConfig.items.forEach((item) => {
    const candidates = keyMap[item.key] ?? [item.key];
    let score = 4;
    for (const candidate of candidates) {
      if (candidate in data) {
        score = data[candidate as keyof typeof data];
        break;
      }
    }
    if (item.reverse && (item.key === 'ES-' || item.key === 'SA-' || item.key === 'IC-')) {
      score = 8 - score;
    }
    appState.answers[item.id] = score;
  });

  renderQuizUI();
  updateProgressBar();
  evaluateAndRender();
  showToast(`測試案例 ${key.toUpperCase()} 已載入`, 'info');
}

startButton?.addEventListener('click', () => {
  renderQuizUI();
  switchScreen('quiz');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

submitButtonEl.addEventListener('click', () => {
  if (Object.keys(appState.answers).length === totalQuestions) {
    evaluateAndRender();
  } else {
    showToast('請完成所有題目後再提交', 'warning');
  }
});

resetButton?.addEventListener('click', handleRetake);

document.querySelectorAll<HTMLButtonElement>('.test-btn').forEach((button) => {
  button.addEventListener('click', () => {
    runTest(button.dataset.case as TestPresetKey);
  });
});

setupBeforeUnload(() =>
  appState.currentScreen === 'quiz' &&
  isStateIncomplete(
    { answers: appState.answers, results: appState.results, currentScreen: appState.currentScreen },
    totalQuestions,
  ),
);

function restoreFromStorage(): void {
  const sharedAnswers = getSharedAnswersFromUrl();
  if (sharedAnswers) {
    appState.answers = sharedAnswers;
    try {
      renderQuizUI();
      const result = calculateResults(appState.answers);
      showResults(result, '已載入分享結果');
      persistState();
    } catch (error) {
      console.error('Failed to parse shared results:', error);
      showToast('分享連結解析失敗,請重新測驗', 'error');
      const stored = loadState();
      if (stored) {
        appState.answers = stored.answers ?? {};
        appState.results = stored.results ?? null;
        appState.currentScreen = stored.currentScreen ?? 'welcome';
        renderQuizUI();
        if (appState.results) {
          showResults(appState.results);
        } else if (Object.keys(appState.answers).length > 0) {
          switchScreen('quiz');
        } else {
          switchScreen('welcome');
        }
      } else {
        appState.answers = {};
        appState.results = null;
        destroyChart();
        renderQuizUI();
        updateProgressBar();
        switchScreen('welcome');
      }
    } finally {
      clearShareParam();
    }
    return;
  }

  const stored = loadState();
  if (stored) {
    appState.answers = stored.answers ?? {};
    appState.results = stored.results ?? null;
    appState.currentScreen = stored.currentScreen ?? 'welcome';
    renderQuizUI();
    if (appState.results) {
      showResults(appState.results);
    } else if (Object.keys(appState.answers).length > 0) {
      switchScreen('quiz');
    } else {
      switchScreen('welcome');
    }
    return;
  }

  renderQuizUI();
  switchScreen('welcome');
}

restoreFromStorage();
