import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useLang } from "@/providers/language";
import type { EstimateInput, EstimateResult } from "@contracts/types";
import {
  ARTIST_TIER_VALUES,
  EXCLUSIVITY_VALUES,
  PROMINENCE_VALUES,
  RIGHTS_VALUES,
  SCENARIO_GROUPS,
  TERM_VALUES,
  TERRITORY_VALUES,
  USAGE_LENGTH_VALUES,
} from "@contracts/constants";
import { STRINGS } from "@contracts/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Calculator, ExternalLink, Info, Loader2, Newspaper } from "lucide-react";

const fmt = (n: number) => "$" + n.toLocaleString("en-US");

export default function EstimateSection() {
  const { lang, t } = useLang();
  const [form, setForm] = useState<EstimateInput>({
    rights: "both",
    scenario: "tv_streaming",
    prominence: "background",
    territory: "north_america",
    term: "1y",
    exclusivity: "non",
    artistTier: "mid",
    usageLength: "30to60",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const set = <K extends keyof EstimateInput>(k: K, v: EstimateInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleEstimate() {
    setLoading(true);
    setError(null);
    try {
      const data = await utils.estimate.estimate.fetch({ ...form, lang });
      setResult(data);
    } catch (e: any) {
      setError(e?.message ?? t("error.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("est.cardTitle")}</CardTitle>
          <CardDescription>{t("est.cardDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 需要的权利 */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t("est.rights")}</Label>
            <RadioGroup value={form.rights} onValueChange={(v) => set("rights", v as EstimateInput["rights"])} className="grid gap-2 sm:grid-cols-3">
              {RIGHTS_VALUES.map((v) => (
                <Label key={v} htmlFor={`r-${v}`} className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 hover:bg-slate-50 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
                  <RadioGroupItem value={v} id={`r-${v}`} className="mt-0.5" />
                  <span>
                    <span className="block text-sm font-medium">{t(`opt.rights.${v}`)}</span>
                    <span className="block text-xs text-slate-500">{t(`opt.rights.${v}.hint`)}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* 场景 */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t("est.scenario")}</Label>
            <Select value={form.scenario} onValueChange={(v) => set("scenario", v as EstimateInput["scenario"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SCENARIO_GROUPS.map((g) => (
                  <SelectGroup key={g.group}>
                    <SelectLabel>{t(`group.${g.group}`)}</SelectLabel>
                    {g.values.map((v) => (
                      <SelectItem key={v} value={v}>{t(`opt.scenario.${v}`)}</SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 范围维度 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <OptionSelect dim="prominence" values={PROMINENCE_VALUES} value={form.prominence} onChange={(v) => set("prominence", v as EstimateInput["prominence"])} />
            <OptionSelect dim="territory" values={TERRITORY_VALUES} value={form.territory} onChange={(v) => set("territory", v as EstimateInput["territory"])} />
            <OptionSelect dim="term" values={TERM_VALUES} value={form.term} onChange={(v) => set("term", v as EstimateInput["term"])} />
            <OptionSelect dim="exclusivity" values={EXCLUSIVITY_VALUES} value={form.exclusivity} onChange={(v) => set("exclusivity", v as EstimateInput["exclusivity"])} />
            <OptionSelect dim="artistTier" values={ARTIST_TIER_VALUES} value={form.artistTier} onChange={(v) => set("artistTier", v as EstimateInput["artistTier"])} />
            <OptionSelect dim="usageLength" values={USAGE_LENGTH_VALUES} value={form.usageLength} onChange={(v) => set("usageLength", v as EstimateInput["usageLength"])} />
          </div>

          <Button onClick={handleEstimate} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
            {t("est.submit")}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 py-4 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4" /> {error}
          </CardContent>
        </Card>
      )}

      {loading && <Skeleton className="h-56 w-full" />}

      {result && !loading && (
        <>
          {/* 估价结果 */}
          <Card className="border-indigo-200">
            <CardHeader>
              <CardTitle className="text-lg">{t("est.resultTitle")}</CardTitle>
              <CardDescription>
                {form.rights === "both" ? t("est.forBoth") : form.rights === "sync" ? t("est.forSync") : t("est.forMaster")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-indigo-600 p-6 text-center text-white">
                <div className="text-sm opacity-80">{t("est.rangeTitle")}</div>
                <div className="mt-1 text-3xl font-bold tracking-tight">
                  {fmt(result.rangeUSD.low)} – {fmt(result.rangeUSD.high)}
                </div>
              </div>

              {result.split && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-4 text-center">
                    <div className="text-xs text-slate-500">{t("est.syncSide")}</div>
                    <div className="mt-1 font-semibold">{fmt(result.split.sync.low)} – {fmt(result.split.sync.high)}</div>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <div className="text-xs text-slate-500">{t("est.masterSide")}</div>
                    <div className="mt-1 font-semibold">{fmt(result.split.master.low)} – {fmt(result.split.master.high)}</div>
                  </div>
                </div>
              )}

              {/* 计算因子 */}
              <div>
                <div className="mb-2 text-sm font-semibold">{t("est.factors")}</div>
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs text-slate-500">
                      <tr>
                        <th className="px-3 py-2">{t("est.fDim")}</th>
                        <th className="px-3 py-2">{t("est.fChoice")}</th>
                        <th className="px-3 py-2 text-right">{t("est.fMult")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.factors.map((f, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2">{f.label}</td>
                          <td className="px-3 py-2">{f.choice}{f.note && <span className="ml-1 text-xs text-slate-400">（{f.note}）</span>}</td>
                          <td className="px-3 py-2 text-right font-mono">×{f.multiplier}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 行业参考区间（小字兜底） */}
              <p className="text-xs text-slate-400">
                {t("est.benchmark", {
                  label: result.benchmark.scenarioLabel,
                  low: fmt(result.benchmark.low),
                  high: fmt(result.benchmark.high),
                })}
              </p>
            </CardContent>
          </Card>

          {/* 公开报价案例 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Newspaper className="h-5 w-5 text-indigo-600" /> {t("est.cases")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.cases.length > 0 ? (
                <ul className="space-y-3">
                  {result.cases.map((c, i) => (
                    <li key={i}>
                      <a href={c.url} target="_blank" rel="noreferrer" className="block rounded-lg border p-3 transition hover:border-indigo-300 hover:bg-indigo-50">
                        <span className="flex items-center gap-1 text-sm font-medium text-indigo-700">
                          {c.title} <ExternalLink className="h-3 w-3" />
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">{c.snippet}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-start gap-2 rounded-lg border border-dashed p-3 text-sm text-slate-500">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{result.casesNote}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 谈判要点 */}
          <Card>
            <CardHeader><CardTitle className="text-base">{t("est.notesTitle")}</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                {result.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
              <Separator className="my-4" />
              <p className="text-xs text-slate-400">{result.disclaimer}</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function OptionSelect({
  dim,
  values,
  value,
  onChange,
}: {
  dim: string;
  values: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const { lang, t } = useLang();
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{t(`est.${dim}`)}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {values.map((v) => (
            <SelectItem key={v} value={v}>
              {t(`opt.${dim}.${v}`)}
              {STRINGS[lang][`opt.${dim}.${v}.hint`] && (
                <span className="ml-1 text-xs text-slate-400">{t(`opt.${dim}.${v}.hint`)}</span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
