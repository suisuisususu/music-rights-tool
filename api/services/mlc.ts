import type { PublisherInfo, SourceReport, WriterInfo } from "../../contracts/types";
import { t, type Lang } from "../../contracts/i18n";

const BASE = "https://public-api.themlc.com";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(username: string, password: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;
  const res = await fetch(`${BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`MLC 认证失败 HTTP ${res.status}`);
  const data: any = await res.json();
  if (!data.accessToken) throw new Error(data.errorDescription || data.error || "MLC 认证失败");
  cachedToken = {
    token: data.accessToken,
    expiresAt: Date.now() + (parseInt(data.expiresIn ?? "3600", 10) || 3600) * 1000,
  };
  return cachedToken.token;
}

export interface MlcLookup {
  publishers: PublisherInfo[];
  writers: WriterInfo[];
  iswc?: string;
  report: SourceReport;
}

/**
 * The MLC Public Search API（官方公开 API，需免费注册账号）。
 * 注册：https://www.themlc.com/dataprograms （Public Search API，免费）
 * 文档：https://public-api.themlc.com/api/doc
 * 提供：publishers（含份额/IPI）、词曲作者、ISWC——美国机械授权曲库，覆盖 5500 万+ 作品。
 */
export async function lookupMlc(title: string, artist: string, lang: Lang): Promise<MlcLookup> {
  const username = process.env.MLC_USERNAME;
  const password = process.env.MLC_PASSWORD;
  if (!username || !password) {
    return {
      publishers: [],
      writers: [],
      report: {
        source: "The MLC",
        status: "not_configured",
        message: t(lang, "msg.mlcNotConfigured"),
        manualUrl: "https://portal.themlc.com/search",
      },
    };
  }

  try {
    const token = await getToken(username, password);

    // 1) 按录音（歌名+歌手）检索 → mlcSongCode
    const searchRes = await fetch(`${BASE}/search/recordings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, artist }),
      signal: AbortSignal.timeout(12000),
    });
    if (!searchRes.ok) throw new Error(`MLC 检索失败 HTTP ${searchRes.status}`);
    const recordings: any[] = (await searchRes.json()) as any[];
    const rec = recordings?.[0];
    if (!rec?.mlcsongCode && !rec?.mlcSongCode) {
      return {
        publishers: [],
        writers: [],
        report: { source: "The MLC", status: "not_found", message: t(lang, "msg.mlcNotFound"), manualUrl: "https://portal.themlc.com/search" },
      };
    }

    // 2) 取作品详情 → publishers + writers
    const songCode = rec.mlcsongCode ?? rec.mlcSongCode;
    const workRes = await fetch(`${BASE}/work/id/${encodeURIComponent(songCode)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(12000),
    });
    if (!workRes.ok) throw new Error(`MLC 作品详情失败 HTTP ${workRes.status}`);
    const work: any = await workRes.json();

    const publishers: PublisherInfo[] = (work.publishers ?? []).map((p: any) => ({
      name: p.publisherName ?? "未知",
      share: typeof p.collectionShare === "number" ? `${(p.collectionShare * 100).toFixed(1)}%` : undefined,
      pro: "The MLC",
      source: "The MLC Public Search API",
    }));
    const writers: WriterInfo[] = (work.writers ?? []).map((w: any) => ({
      name: [w.writerFirstName, w.writerLastName].filter(Boolean).join(" ") || "未知",
      role: w.writerRoleCode,
    }));

    return {
      publishers,
      writers,
      iswc: work.iswc,
      report: { source: "The MLC", status: publishers.length ? "ok" : "partial" },
    };
  } catch (e: any) {
    return {
      publishers: [],
      writers: [],
      report: { source: "The MLC", status: "error", message: e?.message ?? "请求失败", manualUrl: "https://portal.themlc.com/search" },
    };
  }
}
