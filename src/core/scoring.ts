import { quizConfig, type QuizConfig, type CoreKey, type VariantKey, type InteractionKey } from '../data/index';

export interface RawScores {
  E_sum: number;
  I_sum: number;
  S_sum: number;
  N_sum: number;
  T_sum: number;
  F_sum: number;
  J_sum: number;
  P_sum: number;
  ES_score: number;
  SA_score: number;
  IC_score: number;
  ST_mean: number;
  SE_mean: number;
  OP_mean: number;
  CO_mean: number;
}

export type ValueAxis1 = 'ST' | 'SE' | 'STSE_Balance';
export type ValueAxis2 = 'OP' | 'CO' | 'OPCO_Balance';
export type AdaptabilityLevel = '高' | '中' | '低';

export interface QuizResult {
  SN: 'S' | 'N';
  TF: 'T' | 'F';
  JP: 'J' | 'P';
  coreType: CoreKey;
  variant: VariantKey;
  interaction: InteractionKey;
  fullType: string;
  fourLetterType: string;
  socialAdaptability: AdaptabilityLevel;
  identityClarity: AdaptabilityLevel;
  valueAxis1: ValueAxis1;
  valueAxis2: ValueAxis2;
  rawScores: RawScores;
}

const questionMap = new Map(quizConfig.items.map((item) => [item.id, item]));

function getAverage(ids: number[], answers: Record<number, number>, config: QuizConfig): number {
  let sum = 0;
  ids.forEach((id) => {
    const item = questionMap.get(id) ?? config.items.find((entry) => entry.id === id);
    if (!item) {
      return;
    }
    let score = answers[id] ?? 4;
    if (item.reverse) {
      score = 8 - score;
    }
    sum += score;
  });
  return ids.length ? sum / ids.length : 0;
}

export function calculateRawScores(
  answers: Record<number, number>,
  config: QuizConfig = quizConfig,
): RawScores {
  return {
    E_sum: getAverage(config.mapToDimensions.E, answers, config),
    I_sum: getAverage(config.mapToDimensions.I, answers, config),
    S_sum: getAverage(config.mapToDimensions.S, answers, config),
    N_sum: getAverage(config.mapToDimensions.N, answers, config),
    T_sum: getAverage(config.mapToDimensions.T, answers, config),
    F_sum: getAverage(config.mapToDimensions.F, answers, config),
    J_sum: getAverage(config.mapToDimensions.J, answers, config),
    P_sum: getAverage(config.mapToDimensions.P, answers, config),
    ES_score: getAverage(config.mapToDimensions.ES, answers, config),
    SA_score: getAverage(config.mapToDimensions.SA, answers, config),
    IC_score: getAverage(config.mapToDimensions.IC, answers, config),
    ST_mean: getAverage(config.mapToDimensions.ST, answers, config),
    SE_mean: getAverage(config.mapToDimensions.SE, answers, config),
    OP_mean: getAverage(config.mapToDimensions.OP, answers, config),
    CO_mean: getAverage(config.mapToDimensions.CO, answers, config),
  };
}

function resolvePreference(
  left: number,
  right: number,
  tiebreakerPref: 'left' | 'right',
  tiebreakerScore: number,
): 'left' | 'right' | 'left_tie' | 'right_tie' {
  const diff = left - right;
  if (diff >= 0.25) {
    return 'left';
  }
  if (diff <= -0.25) {
    return 'right';
  }
  if (tiebreakerScore >= 4.5) {
    return tiebreakerPref === 'left' ? 'left_tie' : 'right_tie';
  }
  return left > right ? 'left_tie' : 'right_tie';
}

export function calculateResults(
  answers: Record<number, number>,
  config: QuizConfig = quizConfig,
): QuizResult {
  const rawScores = calculateRawScores(answers, config);
  const consoleLog: Record<string, unknown> = { rawScores };

  const snPref = resolvePreference(rawScores.N_sum, rawScores.S_sum, 'left', rawScores.IC_score);
  const SN: 'S' | 'N' = snPref.startsWith('left') ? 'N' : 'S';

  const tfPref = resolvePreference(rawScores.T_sum, rawScores.F_sum, 'right', rawScores.IC_score);
  const TF: 'T' | 'F' = tfPref.startsWith('left') ? 'T' : 'F';

  const jpPref = resolvePreference(rawScores.J_sum, rawScores.P_sum, 'left', rawScores.IC_score);
  const JP: 'J' | 'P' = jpPref.startsWith('left') ? 'J' : 'P';

  const coreType = `${SN}${TF}${JP}` as CoreKey;
  consoleLog.coreTypeCalc = { snPref, tfPref, jpPref, coreType };

  let variant: VariantKey;
  if (rawScores.ES_score >= 4.5) {
    variant = 'A';
  } else if (rawScores.ES_score <= 3.5) {
    variant = 'T';
  } else {
    variant = rawScores.IC_score >= 4.5 ? 'A' : 'T';
  }
  consoleLog.variantCalc = { ES_score: rawScores.ES_score, IC_score: rawScores.IC_score, variant };

  const eiDiff = rawScores.E_sum - rawScores.I_sum;
  let interaction: InteractionKey;
  if (eiDiff >= 0.25) {
    interaction = 'E';
  } else if (eiDiff <= -0.25) {
    interaction = 'I';
  } else if (rawScores.SA_score >= 4.2) {
    interaction = 'E';
  } else if (rawScores.SA_score <= 3.8) {
    interaction = 'I';
  } else {
    interaction = rawScores.E_sum > rawScores.I_sum ? 'E' : 'I';
  }
  consoleLog.interactionCalc = { eiDiff, SA_score: rawScores.SA_score, interaction };

  const fullType = `${interaction}${coreType}`;
  const fourLetterType = fullType;
  consoleLog.fullType = fullType;

  let socialAdaptability: AdaptabilityLevel;
  if (rawScores.SA_score >= 5) {
    socialAdaptability = '高';
  } else if (rawScores.SA_score >= 3.6) {
    socialAdaptability = '中';
  } else {
    socialAdaptability = '低';
  }

  let identityClarity: AdaptabilityLevel;
  if (rawScores.IC_score >= 4.8) {
    identityClarity = '高';
  } else if (rawScores.IC_score >= 3.8) {
    identityClarity = '中';
  } else {
    identityClarity = '低';
  }

  const stseDiff = rawScores.ST_mean - rawScores.SE_mean;
  const valueAxis1: ValueAxis1 = stseDiff >= 0.4 ? 'ST' : stseDiff <= -0.4 ? 'SE' : 'STSE_Balance';

  const opcoDiff = rawScores.OP_mean - rawScores.CO_mean;
  const valueAxis2: ValueAxis2 = opcoDiff >= 0.4 ? 'OP' : opcoDiff <= -0.4 ? 'CO' : 'OPCO_Balance';

  const result: QuizResult = {
    SN,
    TF,
    JP,
    coreType,
    variant,
    interaction,
    fullType,
    fourLetterType,
    socialAdaptability,
    identityClarity,
    valueAxis1,
    valueAxis2,
    rawScores,
  };

  console.log('Calculation Details:', consoleLog);
  return result;
}

export function sanityCheck(config: QuizConfig = quizConfig): void {
  const interactions: InteractionKey[] = ['E', 'I'];
  const coreKeys: CoreKey[] = ['NTJ', 'NTP', 'NFJ', 'NFP', 'STJ', 'STP', 'SFJ', 'SFP'];
  const variants: VariantKey[] = ['A', 'T'];

  interactions.forEach((interaction) => {
    coreKeys.forEach((coreKey) => {
      if (!config.personalityTypes[coreKey]) {
        console.warn('[Sanity] Missing copy for', { interaction, coreKey, target: 'core' });
      }
      if (!config.eiAdjust?.[interaction]) {
        console.warn('[Sanity] Missing copy for', { interaction, coreKey, target: 'interaction' });
      }
      variants.forEach((variant) => {
        if (!config.variants?.[variant]) {
          console.warn('[Sanity] Missing copy for', { interaction, coreKey, target: 'variant', variant });
        }
      });
    });
  });
}
