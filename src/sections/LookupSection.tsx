import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useLang } from "@/providers/language";
import type { LookupResult, SourceStatus } from "@contracts/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Building2,
  Disc3,
  ExternalLink,
  FileWarning,
  Loader2,
  PenLine,
  Search,
  Users,
} from "lucide-react";

const STATUS_CLASS: Record<SourceStatus, string> = {
  ok: "bg-emerald-100 text-emerald-700 border-emerald-200",
  partial: "bg-amber-100 text-amber-700 border-amber-200",
  not_found: "bg-slate-100 text-slate-600 border-slate-200",
  blocked: "bg-orange-100 text-orange-700 border-orange-200",
  not_configured: "bg-slate-100 text-slate-500 border-slate-200",
  error: "bg-red-100 text-red-700 border-red-200",
};

export default function LookupSection() {
  const { lang, t } = useLang();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const canSearch = title.trim().length > 0 && artist.trim().length > 0 && !loading;

  async function handleSearch() {
    if (!canSearch) return;
    setLoading(true);
    setError(null);
    try {
      const data = await utils.lookup.search.fetch({ title: title.trim(), artist: artist.trim(), lang });
      setResult(data);
    } catch (e: any) {
      setError(e?.message ?? t("error.generic"));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 搜索表单 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("lookup.cardTitle")}</CardTitle>
          <CardDescription>{t("lookup.cardDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder={t("lookup.phTitle")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Input
              placeholder={t("lookup.phArtist")}
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={!canSearch} className="shrink-0 gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {t("lookup.search")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 py-4 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4" /> {error}
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {result && !loading && (
        <>
          {/* 整体提示 */}
          {result.message && (
            <Card className={result.needManual ? "border-orange-200 bg-orange-50" : "border-slate-200"}>
              <CardContent className="flex items-start gap-2 py-4 text-sm">
                <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                <span>{result.message}</span>
              </CardContent>
            </Card>
          )}

          {/* 曲目信息 */}
          {result.track && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Disc3 className="h-5 w-5 text-indigo-600" /> {t("lookup.trackInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {result.track.coverUrl && (
                    <img src={result.track.coverUrl} alt="cover" className="h-24 w-24 rounded-lg object-cover" />
                  )}
                  <dl className="grid flex-1 grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                    <div><dt className="text-slate-500">{t("lookup.fTitle")}</dt><dd className="font-medium">{result.track.title}</dd></div>
                    <div><dt className="text-slate-500">{t("lookup.fArtist")}</dt><dd className="font-medium">{result.track.artist}</dd></div>
                    {result.track.album && <div><dt className="text-slate-500">{t("lookup.fAlbum")}</dt><dd>{result.track.album}</dd></div>}
                    {result.track.releaseDate && <div><dt className="text-slate-500">{t("lookup.fDate")}</dt><dd>{result.track.releaseDate}</dd></div>}
                    {result.track.isrc && <div><dt className="text-slate-500">{t("lookup.fIsrc")}</dt><dd className="font-mono">{result.track.isrc}</dd></div>}
                    {result.track.label && <div><dt className="text-slate-500">{t("lookup.fLabel")}</dt><dd>{result.track.label}</dd></div>}
                    {result.track.spotifyUrl && (
                      <div>
                        <dt className="text-slate-500">Spotify</dt>
                        <dd>
                          <a href={result.track.spotifyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:underline">
                            {t("lookup.openTrack")} <ExternalLink className="h-3 w-3" />
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Publishers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-5 w-5 text-indigo-600" /> {t("lookup.publishers")}
                </CardTitle>
                <CardDescription>{t("lookup.publishersDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                {result.publishers.length > 0 ? (
                  <ul className="space-y-3">
                    {result.publishers.map((p, i) => (
                      <li key={i} className="rounded-lg border p-3 text-sm">
                        <div className="font-medium">{p.name}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>{t("lookup.source")}：{p.source}</span>
                          {p.pro && <Badge variant="outline">{p.pro}</Badge>}
                          {p.share && <span>{t("lookup.share")} {p.share}</span>}
                        </div>
                        {p.contactUrl && (
                          <a href={p.contactUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                            {t("lookup.detailContact")} <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ManualHint text={t("lookup.hintPublishers")} />
                )}
              </CardContent>
            </Card>

            {/* Master Owner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Disc3 className="h-5 w-5 text-indigo-600" /> {t("lookup.masterOwner")}
                </CardTitle>
                <CardDescription>{t("lookup.masterOwnerDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                {result.masterOwner?.name ? (
                  <div className="rounded-lg border p-3 text-sm">
                    <div className="font-medium">{result.masterOwner.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{t("lookup.source")}：{result.masterOwner.source}</div>
                    {result.masterOwner.note && <p className="mt-2 text-xs text-amber-600">{result.masterOwner.note}</p>}
                    {result.masterOwner.contactUrl && (
                      <a href={result.masterOwner.contactUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                        {t("lookup.detailContact")} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ) : (
                  <ManualHint text={t("lookup.hintMaster")} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* 词曲作者 */}
          {result.writers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PenLine className="h-5 w-5 text-indigo-600" /> {t("lookup.writers")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.writers.map((w, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 px-3 py-1 text-sm">
                      {w.name}
                      {w.role && <span className="text-xs text-slate-500">· {w.role}</span>}
                      {w.pro && <span className="text-xs text-slate-500">· {w.pro}</span>}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 数据源状态 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("lookup.sources")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.sources.map((s, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="w-40 font-medium">{s.source}</span>
                    <Badge variant="outline" className={STATUS_CLASS[s.status]}>
                      {t(`status.${s.status}`)}
                    </Badge>
                    {s.message && <span className="text-xs text-slate-500">{s.message}</span>}
                    {s.manualUrl && (
                      <a href={s.manualUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                        {t("lookup.manualRetrieval")} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 手动检索入口 */}
          <Card className={result.needManual ? "border-orange-300" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-orange-500" /> {t("lookup.manualTitle")}
              </CardTitle>
              <CardDescription>{t("lookup.manualDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2">
                {result.manualLinks.map((l, i) => (
                  <li key={i}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start justify-between gap-2 rounded-lg border p-3 text-sm transition hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      <span>
                        <span className="font-medium">{l.label}</span>
                        {l.note && <span className="mt-0.5 block text-xs text-slate-500">{l.note}</span>}
                      </span>
                      <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ManualHint({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-dashed border-orange-300 bg-orange-50 p-3 text-sm text-orange-700">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{text}</span>
    </div>
  );
}
