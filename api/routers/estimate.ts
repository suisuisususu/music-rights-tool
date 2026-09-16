import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { computeEstimate } from "../services/benchmarks";
import { searchPublicCases } from "../services/caseSearch";
import { t } from "../../contracts/i18n";
import type { EstimateResult } from "../../contracts/types";

export const estimateRouter = createRouter({
  estimate: publicQuery
    .input(
      z.object({
        rights: z.enum(["sync", "master", "both"]),
        scenario: z.enum([
          "film_short", "film_indie", "film_studio",
          "trailer_indie", "trailer_studio",
          "tv_network", "tv_streaming",
          "ad_national_tv", "ad_regional", "ad_digital", "ad_streaming",
          "game_aaa", "game_indie",
          "podcast", "online_creator", "corporate",
        ]),
        prominence: z.enum(["background", "featured", "end_credit", "theme"]),
        territory: z.enum(["single", "north_america", "worldwide"]),
        term: z.enum(["1y", "3y", "perpetual"]),
        exclusivity: z.enum(["non", "limited", "full"]),
        artistTier: z.enum(["indie", "mid", "hit"]),
        usageLength: z.enum(["under30", "30to60", "over60", "full"]),
        lang: z.enum(["zh", "en"]).default("zh"),
      }),
    )
    .query(async ({ input }): Promise<EstimateResult> => {
      const { lang, ...estimateInput } = input;
      const computed = computeEstimate(estimateInput, lang);
      const caseResult = await searchPublicCases(input.scenario, lang);

      return {
        ...computed,
        cases: caseResult.cases,
        casesEnabled: caseResult.enabled,
        casesNote: caseResult.note,
        disclaimer: t(lang, "est.disclaimer"),
      };
    }),
});
