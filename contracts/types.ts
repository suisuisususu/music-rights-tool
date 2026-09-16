export * from "./errors";

// ─────────────────────────────────────────────────────────────
// 版权检索（Lookup）
// ─────────────────────────────────────────────────────────────

export type SourceStatus =
  | "ok" // 成功获取数据
  | "partial" // 获取到部分数据
  | "not_found" // 数据源正常但未找到记录
  | "blocked" // 数据源拒绝自动访问（反爬/需登录）
  | "not_configured" // 缺少 API 凭证，未启用
  | "error"; // 请求出错

export interface SourceReport {
  source: string;
  status: SourceStatus;
  message?: string;
  /** 手动检索入口 */
  manualUrl?: string;
}

export interface PublisherInfo {
  name: string;
  share?: string;
  pro?: string;
  source: string;
  /** 官网或详情页 */
  contactUrl?: string;
}

export interface WriterInfo {
  name: string;
  role?: string;
  pro?: string;
}

export interface TrackInfo {
  title: string;
  artist: string;
  album?: string;
  releaseDate?: string;
  isrc?: string;
  label?: string;
  coverUrl?: string;
  spotifyUrl?: string;
  popularity?: number;
  durationMs?: number;
}

export interface MasterOwnerInfo {
  name?: string;
  source?: string;
  note?: string;
  contactUrl?: string;
}

export interface ManualLink {
  label: string;
  url: string;
  note?: string;
}

export interface LookupResult {
  query: { title: string; artist: string };
  found: boolean;
  track?: TrackInfo;
  publishers: PublisherInfo[];
  writers: WriterInfo[];
  masterOwner?: MasterOwnerInfo;
  sources: SourceReport[];
  manualLinks: ManualLink[];
  /** 关键信息（publishers / master owner）未找全时 = true，提示需手动检索 */
  needManual: boolean;
  message?: string;
}

// ─────────────────────────────────────────────────────────────
// 费用评估（Estimate）
// ─────────────────────────────────────────────────────────────

export type RightsNeeded = "sync" | "master" | "both";

export type ScenarioKey =
  | "film_short"
  | "film_indie"
  | "film_studio"
  | "trailer_indie"
  | "trailer_studio"
  | "tv_network"
  | "tv_streaming"
  | "ad_national_tv"
  | "ad_regional"
  | "ad_digital"
  | "ad_streaming"
  | "game_aaa"
  | "game_indie"
  | "podcast"
  | "online_creator"
  | "corporate";

export type Prominence = "background" | "featured" | "end_credit" | "theme";
export type Territory = "single" | "north_america" | "worldwide";
export type Term = "1y" | "3y" | "perpetual";
export type Exclusivity = "non" | "limited" | "full";
export type ArtistTier = "indie" | "mid" | "hit";
export type UsageLength = "under30" | "30to60" | "over60" | "full";

export interface EstimateInput {
  rights: RightsNeeded;
  scenario: ScenarioKey;
  prominence: Prominence;
  territory: Territory;
  term: Term;
  exclusivity: Exclusivity;
  artistTier: ArtistTier;
  usageLength: UsageLength;
}

export interface EstimateFactor {
  label: string;
  choice: string;
  multiplier: number;
  note?: string;
}

export interface PublicCase {
  title: string;
  url: string;
  snippet: string;
}

export interface MoneyRange {
  low: number;
  high: number;
}

export interface EstimateResult {
  /** 综合估价区间（美元，all-in 或按所选权利） */
  rangeUSD: MoneyRange;
  /** 词曲（sync）与录音（master）各自拆分（rights=both 时给出） */
  split?: { sync: MoneyRange; master: MoneyRange };
  factors: EstimateFactor[];
  /** 检索到的公开报价案例（需配置搜索 API） */
  cases: PublicCase[];
  casesEnabled: boolean;
  casesNote?: string;
  /** 内置行业参考区间（小字兜底） */
  benchmark: MoneyRange & { scenarioLabel: string };
  notes: string[];
  disclaimer: string;
}
