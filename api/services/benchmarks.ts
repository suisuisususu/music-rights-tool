import type {
  ArtistTier,
  EstimateFactor,
  EstimateInput,
  Exclusivity,
  MoneyRange,
  Prominence,
  ScenarioKey,
  Term,
  Territory,
  UsageLength,
} from "../../contracts/types";
import { STRINGS, t, type Lang } from "../../contracts/i18n";

/**
 * 内置行业参考区间（2025–2026 公开市场数据，all-in 口径：sync + master 合计）。
 * 来源：Songtradr / BMI 公开披露、Chartlex 2026 费率卡、DropCue 2026 实务数据、
 * FWD Music 2026 指南、Billboard 报道等公开资料的综合区间。
 * 仅作参考兜底；实际报价以权利人谈判为准。
 */
export const BENCHMARKS: Record<ScenarioKey, MoneyRange> = {
  film_short: { low: 0, high: 1500 },
  film_indie: { low: 500, high: 10000 },
  film_studio: { low: 20000, high: 500000 },
  trailer_indie: { low: 1000, high: 5000 },
  trailer_studio: { low: 100000, high: 1500000 },
  tv_network: { low: 3000, high: 45000 },
  tv_streaming: { low: 2500, high: 50000 },
  ad_national_tv: { low: 15000, high: 800000 },
  ad_regional: { low: 2000, high: 40000 },
  ad_digital: { low: 500, high: 25000 },
  ad_streaming: { low: 4500, high: 110000 },
  game_aaa: { low: 15000, high: 150000 },
  game_indie: { low: 500, high: 15000 },
  podcast: { low: 2000, high: 35000 },
  online_creator: { low: 0, high: 7500 },
  corporate: { low: 1000, high: 25000 },
};

const PROMINENCE_MULT: Record<Prominence, number> = { background: 1.0, featured: 1.5, end_credit: 2.0, theme: 2.5 };
const TERRITORY_MULT: Record<Territory, number> = { single: 0.6, north_america: 1.0, worldwide: 1.8 };
const TERM_MULT: Record<Term, number> = { "1y": 1.0, "3y": 1.4, perpetual: 2.5 };
const EXCLUSIVITY_MULT: Record<Exclusivity, number> = { non: 1.0, limited: 1.5, full: 2.5 };
const ARTIST_TIER_MULT: Record<ArtistTier, number> = { indie: 0.4, mid: 1.0, hit: 3.0 };
const USAGE_LENGTH_MULT: Record<UsageLength, number> = { under30: 0.5, "30to60": 1.0, over60: 1.3, full: 1.6 };

export interface EstimateComputation {
  rangeUSD: MoneyRange;
  split?: { sync: MoneyRange; master: MoneyRange };
  factors: EstimateFactor[];
  benchmark: MoneyRange & { scenarioLabel: string };
  notes: string[];
}

const round = (n: number) => {
  if (n >= 100000) return Math.round(n / 1000) * 1000;
  if (n >= 10000) return Math.round(n / 500) * 500;
  if (n >= 1000) return Math.round(n / 100) * 100;
  return Math.round(n / 10) * 10;
};

export function computeEstimate(input: EstimateInput, lang: Lang): EstimateComputation {
  const bench = BENCHMARKS[input.scenario];
  const factors: EstimateFactor[] = [];

  const dims: { dim: string; value: string; m: number }[] = [
    { dim: "prominence", value: input.prominence, m: PROMINENCE_MULT[input.prominence] },
    { dim: "territory", value: input.territory, m: TERRITORY_MULT[input.territory] },
    { dim: "term", value: input.term, m: TERM_MULT[input.term] },
    { dim: "exclusivity", value: input.exclusivity, m: EXCLUSIVITY_MULT[input.exclusivity] },
    { dim: "artistTier", value: input.artistTier, m: ARTIST_TIER_MULT[input.artistTier] },
    { dim: "usageLength", value: input.usageLength, m: USAGE_LENGTH_MULT[input.usageLength] },
  ];

  let total = 1;
  for (const { dim, value, m } of dims) {
    total *= m;
    const hintKey = `opt.${dim}.${value}.hint`;
    factors.push({
      label: t(lang, `est.${dim}`),
      choice: t(lang, `opt.${dim}.${value}`),
      multiplier: m,
      note: STRINGS[lang][hintKey] ? t(lang, hintKey) : undefined,
    });
  }

  // 以基准区间中点为锚，按乘数缩放后给出 ±40% 的谈判带宽
  const mid = (bench.low + bench.high) / 2;
  let low = mid * total * 0.6;
  let high = mid * total * 1.4;
  // 不跌破场景下限的 30%，不超过场景上限的 4 倍（防止乘数叠加失真）
  low = Math.max(low, bench.low * 0.3);
  high = Math.min(high, bench.high * 4);
  if (high < low) high = low * 2;

  // 权利拆分：行业惯例 sync 与 master 大致 1:1（MFN 最惠待遇）
  let split: EstimateComputation["split"];
  if (input.rights === "both") {
    split = {
      sync: { low: round(low / 2), high: round(high / 2) },
      master: { low: round(low / 2), high: round(high / 2) },
    };
  } else {
    // 仅单方权利时，总价约为 all-in 的一半
    low *= 0.5;
    high *= 0.5;
  }

  const notes: string[] = [t(lang, "note.mfn"), t(lang, "note.budget")];
  if (input.scenario === "tv_network" || input.scenario === "tv_streaming") notes.push(t(lang, "note.tv"));
  if (input.scenario.startsWith("ad_")) notes.push(t(lang, "note.ad"));
  if (input.scenario === "online_creator" || input.scenario === "ad_digital") notes.push(t(lang, "note.creator"));
  if (input.term === "perpetual") notes.push(t(lang, "note.perpetual"));

  return {
    rangeUSD: { low: round(low), high: round(high) },
    split,
    factors,
    benchmark: { low: bench.low, high: bench.high, scenarioLabel: t(lang, `opt.scenario.${input.scenario}`) },
    notes,
  };
}
