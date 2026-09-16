import type {
  ArtistTier,
  Exclusivity,
  Prominence,
  RightsNeeded,
  ScenarioKey,
  Term,
  Territory,
  UsageLength,
} from "./types";

// 选项的文案统一在 contracts/i18n.ts，按 `opt.{维度}.{值}` 的 key 取词。

export const RIGHTS_VALUES: RightsNeeded[] = ["both", "sync", "master"];

export const SCENARIO_GROUPS: { group: string; values: ScenarioKey[] }[] = [
  { group: "film", values: ["film_short", "film_indie", "film_studio"] },
  { group: "trailer", values: ["trailer_indie", "trailer_studio"] },
  { group: "tv", values: ["tv_network", "tv_streaming"] },
  { group: "ad", values: ["ad_national_tv", "ad_regional", "ad_digital", "ad_streaming"] },
  { group: "game", values: ["game_aaa", "game_indie"] },
  { group: "digital", values: ["podcast", "online_creator", "corporate"] },
];

export const PROMINENCE_VALUES: Prominence[] = ["background", "featured", "end_credit", "theme"];
export const TERRITORY_VALUES: Territory[] = ["single", "north_america", "worldwide"];
export const TERM_VALUES: Term[] = ["1y", "3y", "perpetual"];
export const EXCLUSIVITY_VALUES: Exclusivity[] = ["non", "limited", "full"];
export const ARTIST_TIER_VALUES: ArtistTier[] = ["indie", "mid", "hit"];
export const USAGE_LENGTH_VALUES: UsageLength[] = ["under30", "30to60", "over60", "full"];

/** 手动检索入口（文案 key 为 manual.{id} / manual.{id}.note） */
export const MANUAL_LINKS: { id: string; url: string }[] = [
  { id: "songview", url: "https://www.songview.com/" },
  { id: "ascap", url: "https://www.ascap.com/repertory" },
  { id: "bmi", url: "https://repertoire.bmi.com/" },
  { id: "sesac", url: "https://www.sesac.com/repertory/" },
  { id: "hfa", url: "https://www.harryfox.com/songfile/" },
  { id: "mb", url: "https://musicbrainz.org/" },
  { id: "spotify", url: "https://open.spotify.com/" },
  { id: "qq", url: "https://y.qq.com/" },
  { id: "mlc", url: "https://portal.themlc.com/search" },
];
