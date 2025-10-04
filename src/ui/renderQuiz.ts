import type { QuizConfig } from '../data/index';

interface RenderQuizOptions {
  container: HTMLElement;
  config: QuizConfig;
  answers: Record<number, number>;
  onSelect: (questionId: number, score: number) => void;
  onAfterSelect?: () => void;
}

const buttonColorMap: Record<number, string> = {
  7: '#bbf7d0',
  6: '#bbf7d0',
  5: '#d9f99d',
  4: '#e2e8f0',
  3: '#fde68a',
  2: '#fecaca',
  1: '#fecaca',
};

function applySelectionStyles(button: HTMLButtonElement, score: number): void {
  button.classList.add('selected');
  button.setAttribute('aria-checked', 'true');
  const color = buttonColorMap[score];
  if (color) {
    button.style.backgroundColor = color;
  }
}

function clearSelection(parent: Element): void {
  parent.querySelectorAll<HTMLButtonElement>('.scale-button').forEach((btn) => {
    btn.classList.remove('selected');
    btn.style.backgroundColor = '';
    btn.setAttribute('aria-checked', 'false');
  });
}

export function renderQuiz({ container, config, answers, onSelect, onAfterSelect }: RenderQuizOptions): void {
  container.innerHTML = '';

  config.items.forEach((item) => {
    const questionEl = document.createElement('div');
    questionEl.className = 'question-block border-t border-slate-200 dark:border-slate-700 pt-6';
    questionEl.id = `q-${item.id}`;

    const questionText = document.createElement('div');
    questionText.className = 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4';
    questionText.innerHTML = `
      <div>
        <p class="text-lg font-medium text-slate-800 dark:text-slate-100">Q${item.id}. ${item.text}</p>
        ${item.reverse ? '<p class="text-xs text-slate-500 dark:text-slate-400">(反向計分)</p>' : ''}
      </div>
    `;

    const scaleContainer = document.createElement('div');
    scaleContainer.className = 'grid grid-cols-7 gap-2 mt-4';
    scaleContainer.setAttribute('role', 'radiogroup');

    config.scales.forEach((label, index) => {
      const score = 7 - index;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'scale-button flex flex-col items-center justify-center p-3 rounded-lg bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 text-center text-xs sm:text-sm';
      button.dataset.questionId = String(item.id);
      button.dataset.score = String(score);
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', 'false');
      button.innerHTML = `
        <span class="font-semibold text-slate-700 dark:text-slate-200">${score}</span>
        <span class="mt-1 text-slate-500 dark:text-slate-400">${label}</span>
      `;

      button.addEventListener('click', () => {
        clearSelection(scaleContainer);
        applySelectionStyles(button, score);
        onSelect(item.id, score);
        onAfterSelect?.();
      });

      button.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          button.click();
        }
      });

      if (answers[item.id]) {
        const currentScore = answers[item.id];
        if (currentScore === score) {
          applySelectionStyles(button, score);
        }
      }

      scaleContainer.appendChild(button);
    });

    questionEl.appendChild(questionText);
    questionEl.appendChild(scaleContainer);
    container.appendChild(questionEl);
  });
}

export function updateProgress(
  answers: Record<number, number>,
  totalQuestions: number,
  progressBar: HTMLElement,
  progressText: HTMLElement,
  submitButton: HTMLButtonElement,
): void {
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / totalQuestions) * 100;
  progressBar.style.width = `${progress}%`;
  progressText.textContent = `${answeredCount} / ${totalQuestions}`;
  submitButton.disabled = answeredCount !== totalQuestions;
}
