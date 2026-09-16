import type { PublicCase, ScenarioKey } from "../../contracts/types";
import { t, type Lang } from "../../contracts/i18n";

const SCENARIO_QUERY_HINT: Record<ScenarioKey, string> = {
  film_short: "indie short film",
  film_indie: "indie feature film",
  film_studio: "studio feature film",
  trailer_indie: "indie trailer",
  trailer_studio: "studio movie trailer",
  tv_network: "network TV episode",
  tv_streaming: "Netflix streaming series",
  ad_national_tv: "national TV commercial",
  ad_regional: "regional local commercial",
  ad_digital: "digital social media ad",
  ad_streaming: "streaming pre-roll CTV ad",
  game_aaa: "AAA video game",
  game_indie: "indie video game",
  podcast: "podcast",
  online_creator: "YouTube creator video",
  corporate: "corporate video",
};

export interface CaseSearchResult {
  cases: PublicCase[];
  enabled: boolean;
  note?: string;
}

/**
 * 检索公开报道的真实授权报价案例。
 * 支持 Tavily（TAVILY_API_KEY）或 SerpAPI（SERPAPI_KEY），二选一；
 * 未配置时返回空并提示如何启用——绝不编造案例。
 */
export async function searchPublicCases(scenario: ScenarioKey, lang: Lang): Promise<CaseSearchResult> {
  const tavilyKey = process.env.TAVILY_API_KEY;
  const serpApiKey = process.env.SERPAPI_KEY;
  const hint = SCENARIO_QUERY_HINT[scenario];
  const query = `music sync licensing fee ${hint} deal cost paid $`;

  if (tavilyKey) {
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: tavilyKey, query, max_results: 5, search_depth: "basic" }),
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) throw new Error(`Tavily HTTP ${res.status}`);
      const data: any = await res.json();
      const cases: PublicCase[] = (data.results ?? []).map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: (r.content ?? "").slice(0, 300),
      }));
      return { cases, enabled: true };
    } catch (e: any) {
      return { cases: [], enabled: true, note: t(lang, "msg.casesFailed", { error: e?.message ?? "unknown" }) };
    }
  }

  if (serpApiKey) {
    try {
      const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${serpApiKey}&num=5`;
      const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) throw new Error(`SerpAPI HTTP ${res.status}`);
      const data: any = await res.json();
      const cases: PublicCase[] = (data.organic_results ?? []).slice(0, 5).map((r: any) => ({
        title: r.title,
        url: r.link,
        snippet: (r.snippet ?? "").slice(0, 300),
      }));
      return { cases, enabled: true };
    } catch (e: any) {
      return { cases: [], enabled: true, note: t(lang, "msg.casesFailed", { error: e?.message ?? "unknown" }) };
    }
  }

  return { cases: [], enabled: false, note: t(lang, "msg.casesDisabled") };
}
