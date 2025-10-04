import { quizConfig } from '../data/index';
import type { QuizResult } from './scoring';

interface ExportOptions {
  answers: Record<number, number>;
  result: QuizResult;
}

export function exportAsJson({ answers, result }: ExportOptions): Blob {
  const payload = {
    answers,
    results: result,
    meta: {
      fourLetterType: result.fourLetterType || result.fullType,
      generatedAt: new Date().toISOString(),
    },
  };
  const jsonString = JSON.stringify(payload, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
}

export function exportAsCsv({ answers, result }: ExportOptions): Blob {
  let csvContent = '\ufeff';
  csvContent += 'Question ID,Question Text,Score\n';
  quizConfig.items.forEach((item) => {
    const answer = answers[item.id] ?? '';
    const text = item.text.replace(/"/g, '""');
    csvContent += `"${item.id}","${text}","${answer}"\n`;
  });

  csvContent += '\nDimension,Score\n';
  Object.entries(result.rawScores).forEach(([key, value]) => {
    csvContent += `"${key}",${value.toFixed(2)}\n`;
  });

  const baseFour = result.fourLetterType || result.fullType;
  const fourWithVariant = baseFour && result.variant ? `${baseFour}-${result.variant}` : result.variant;

  csvContent += '\nResult Type,Value\n';
  csvContent += `"Full Type","${fourWithVariant}"\n`;
  csvContent += `"Core Type","${result.coreType}"\n`;
  csvContent += `"fourLetterType","${baseFour}"\n`;
  csvContent += `"Variant","${result.variant}"\n`;

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
