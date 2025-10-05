import {
  Chart,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadarController,
  Tooltip,
  LinearScale,
} from 'chart.js';
import { quizConfig } from '../data/index';
import type { QuizResult, RawScores } from '../core/scoring';

Chart.register(RadarController, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

let chartInstance: Chart | null = null;

interface RenderResultsOptions {
  container: HTMLElement;
  result: QuizResult;
  onRetake: () => void;
  onShare: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
}

export function renderResults({
  container,
  result,
  onRetake,
  onShare,
  onExportJson,
  onExportCsv,
}: RenderResultsOptions): void {
  const coreTypeInfo = quizConfig.personalityTypes[result.coreType] || {
    name: result.coreType,
    summary: '',
    strengths: [],
    weaknesses: [],
    scenarios: [],
    growth: [],
  };
  const variantInfo = quizConfig.variants[result.variant] || {
    modifier: result.variant,
    strength_phrase: '',
    growth_phrase: '',
  };
  const interactionInfo = quizConfig.eiAdjust[result.interaction] || {
    tagline: '',
    bullets: [],
    growthSuggestion: '',
  };
  const value1Info = quizConfig.valueAxes[result.valueAxis1];
  const value2Info = quizConfig.valueAxes[result.valueAxis2];
  const socialInfo = quizConfig.socialAdaptability[result.socialAdaptability];
  const identityInfo = quizConfig.identityClarity[result.identityClarity];

  const four = result.fourLetterType || result.fullType || '';
  const baseFour = four || result.coreType || '';
  const fourWithVariant = baseFour && result.variant ? `${baseFour}-${result.variant}` : result.variant || baseFour;
  const variantSummary = `A/T 變體觀察（${variantInfo.modifier}）：${variantInfo.strength_phrase}`;
  const interactionBullets = (interactionInfo.bullets || [])
    .map((point) => `<li>${point}</li>`)
    .join('') || '<li>暫無對應說明,後續將補齊。</li>';
  const interactionSection = `
    <div class="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
      <h4 class="font-semibold text-blue-600 dark:text-blue-400 mb-2">互動風格（${result.interaction}）</h4>
      <p class="text-sm text-slate-600 dark:text-slate-300 mb-2">${interactionInfo.tagline || ''}</p>
      <ul class="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">${interactionBullets}</ul>
    </div>`;

  const eiGrowthAdvice =
    interactionInfo.growthSuggestion ||
    (result.interaction === 'E'
      ? '外向:以每週的反思時間收斂行動步調,讓熱情更聚焦。'
      : '內向:安排定期的公開分享或協作任務,練習把洞見帶到外部。');

  const growthList = [
    ...coreTypeInfo.growth.map((s: string) => `<li>${s}</li>`),
    `<li class="mt-2 text-indigo-600 dark:text-indigo-400 font-medium">${variantInfo.growth_phrase}</li>`,
    `<li class="text-sky-600 dark:text-sky-400 font-medium">${eiGrowthAdvice}</li>`,
  ].join('');

  const html = `
    <div class="text-center p-6 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 rounded-2xl text-white shadow-lg mb-8">
      <h2 class="text-4xl font-bold">${coreTypeInfo.name}-${result.variant} (${fourWithVariant})</h2>
      <p class="mt-2 text-lg opacity-90">${coreTypeInfo.summary}</p>
      <div class="mt-4 text-sm space-y-1 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row justify-center items-center">
        <span>價值觀: <strong>${value1Info.name} × ${value2Info.name}</strong></span>
        <span class="hidden sm:inline">|</span>
        <span>社會適應: <strong>${socialInfo.name}</strong></span>
        <span class="hidden sm:inline">|</span>
        <span>認同清晰: <strong>${identityInfo.name}</strong></span>
      </div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <div class="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl">
        <h3 class="text-xl font-bold mb-4 text-center">人格維度圖</h3>
        <canvas id="resultsChart"></canvas>
      </div>
      <div class="space-y-6">
        <div class="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl">
          <h3 class="text-xl font-bold mb-3 text-slate-800 dark:text-slate-100">核心特質:${coreTypeInfo.name} (${result.coreType})</h3>
          <p class="text-base text-slate-600 dark:text-slate-300 mb-4">${variantSummary}</p>
          <h4 class="font-semibold text-green-600 dark:text-green-400 mb-2">優勢</h4>
          <ul class="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">${coreTypeInfo.strengths
            .map((s: string) => `<li>${s}</li>`)
            .join('')}</ul>
          <h4 class="font-semibold text-amber-600 dark:text-amber-400 mt-4 mb-2">常見盲點</h4>
          <ul class="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">${coreTypeInfo.weaknesses
            .map((w: string) => `<li>${w}</li>`)
            .join('')}</ul>
          ${interactionSection}
        </div>
      </div>
    </div>
    <div class="space-y-6">
      ${createSection('建議情境 / 職能', coreTypeInfo.scenarios.map((s: string) => `<li>${s}</li>`).join(''), 'briefcase')}
      ${createSection('個人成長建議', growthList, 'trending-up')}
      ${createSection(
        '價值觀解讀',
        `<p>${value1Info.description}</p><p class="mt-2">${value2Info.description}</p>`,
        'gem',
      )}
      ${createSection('社會適應力分析', socialInfo.advice.map((s: string) => `<li>${s}</li>`).join(''), 'users')}
      ${createSection('自我認同清晰度', identityInfo.advice.map((s: string) => `<li>${s}</li>`).join(''), 'user-check')}
    </div>
  `;

  container.innerHTML = html;

  const retakeBtn = document.getElementById('retake-btn') as HTMLButtonElement | null;
  const shareBtn = document.getElementById('share-btn') as HTMLButtonElement | null;
  const exportJsonBtn = document.getElementById('export-json-btn') as HTMLButtonElement | null;
  const exportCsvBtn = document.getElementById('export-csv-btn') as HTMLButtonElement | null;

  if (retakeBtn) retakeBtn.onclick = onRetake;
  if (shareBtn) shareBtn.onclick = onShare;
  if (exportJsonBtn) exportJsonBtn.onclick = onExportJson;
  if (exportCsvBtn) exportCsvBtn.onclick = onExportCsv;

  renderChart(result.rawScores);
}

function createSection(title: string, content: string, iconName: keyof typeof iconMap): string {
  return `
    <div class="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl">
      <div class="flex items-center mb-3">
        ${iconMap[iconName]}
        <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100">${title}</h3>
      </div>
      <div class="text-slate-600 dark:text-slate-300 space-y-2 pl-9">
        ${content.trim().startsWith('<li>') ? `<ul class="list-disc list-inside space-y-1">${content}</ul>` : content}
      </div>
    </div>
  `;
}

const iconMap = {
  briefcase:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 mr-3 text-blue-500"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  'trending-up':
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 mr-3 text-green-500"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
  gem:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 mr-3 text-purple-500"><path d="M6 3h12l4 6-10 13L2 9z"/><path d="m12 22 4-13-3-6h-2L8 9l4 13"/><path d="M2 9h20"/></svg>',
  users:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 mr-3 text-teal-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  'user-check':
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 mr-3 text-indigo-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>',
} as const;


function renderChart(rawScores: RawScores): void {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const canvas = document.getElementById('resultsChart') as HTMLCanvasElement | null;
  if (!canvas) {
    return;
  }

  const isDark = document.documentElement.classList.contains('dark');
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
  const labelColor = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)';

  chartInstance = new Chart(canvas, {
    type: 'radar',
    data: {
      labels: ['外向 (E)', '直覺 (N)', '思考 (T)', '判斷 (J)', '情緒穩定', '社會適應', '自我認同'],
      datasets: [
        {
          label: '你的得分',
          data: [
            rawScores.E_sum,
            rawScores.N_sum,
            rawScores.T_sum,
            rawScores.J_sum,
            rawScores.ES_score,
            rawScores.SA_score,
            rawScores.IC_score,
          ],
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 1)',
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { color: gridColor },
          grid: { color: gridColor },
          pointLabels: {
            color: labelColor,
            font: { size: 12 },
          },
          suggestedMin: 1,
          suggestedMax: 7,
          ticks: {
            display: false,
          },
        },
      },
      plugins: {
        legend: {
          labels: { color: labelColor },
          display: true,
          position: 'bottom',
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.parsed.r.toFixed(2)}`,
          },
        },
      },
    },
  });
}

export function destroyChart(): void {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}
