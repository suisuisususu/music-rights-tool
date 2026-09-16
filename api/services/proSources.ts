import type { PublisherInfo, SourceReport, WriterInfo } from "../../contracts/types";
import { t, type Lang } from "../../contracts/i18n";

export interface ProLookup {
  publishers: PublisherInfo[];
  writers: WriterInfo[];
  reports: SourceReport[];
}

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

/**
 * ASCAP / BMI / SESAC 等 PRO 数据库均有较强反爬保护，
 * 这里做“尽力而为”的自动尝试；失败时返回 blocked 状态并给出手动检索入口。
 * 这是设计使然：工具不会伪造数据，检索不到就明确提示手动检索。
 */
export async function lookupProSources(title: string, _artist: string, lang: Lang): Promise<ProLookup> {
  const publishers: PublisherInfo[] = [];
  const writers: WriterInfo[] = [];
  const reports: SourceReport[] = [];

  // ── ASCAP（经 Songview 联合库做尽力尝试）────────────────────
  try {
    const res = await fetch(
      `https://www.songview.com/api/search?searchType=song&searchTerm=${encodeURIComponent(title)}`,
      { headers: { "User-Agent": BROWSER_UA, Accept: "application/json" }, signal: AbortSignal.timeout(8000) },
    );
    if (res.ok) {
      const data: any = await res.json().catch(() => null);
      const items: any[] = data?.results ?? data?.songs ?? [];
      const hit = items.find((s) =>
        (s.title ?? s.songTitle ?? "").toLowerCase().includes(title.toLowerCase()),
      );
      if (hit) {
        for (const p of hit.publishers ?? []) {
          publishers.push({ name: p.name ?? p.publisherName ?? "未知", share: p.share, pro: p.society, source: "Songview (ASCAP/BMI)" });
        }
        for (const w of hit.writers ?? []) {
          writers.push({ name: w.name ?? "未知", pro: w.society });
        }
        reports.push({ source: "Songview (ASCAP+BMI)", status: publishers.length ? "ok" : "partial" });
      } else {
        reports.push({
          source: "Songview (ASCAP+BMI)",
          status: "not_found",
          message: t(lang, "msg.songviewNotFound"),
          manualUrl: "https://www.songview.com/",
        });
      }
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (e: any) {
    reports.push({
      source: "Songview (ASCAP+BMI)",
      status: "blocked",
      message: t(lang, "msg.proBlocked"),
      manualUrl: "https://www.songview.com/",
    });
  }

  // ── BMI Repertoire ──────────────────────────────────────────
  try {
    const res = await fetch(
      `https://repertoire.bmi.com/Search/Search?Main_Search_Text=${encodeURIComponent(title)}&Main_Search=Title&Search_Type=all`,
      { headers: { "User-Agent": BROWSER_UA }, signal: AbortSignal.timeout(8000), redirect: "manual" },
    );
    if (res.status === 200) {
      const html = await res.text();
      // BMI 返回 HTML，命中时页面包含作品条目；此处仅做存在性判断，不解析脆弱 DOM
      if (html.toLowerCase().includes(title.toLowerCase())) {
        reports.push({
          source: "BMI Repertoire",
          status: "partial",
          message: t(lang, "msg.bmiMaybe"),
          manualUrl: "https://repertoire.bmi.com/",
        });
      } else {
        reports.push({ source: "BMI Repertoire", status: "not_found", manualUrl: "https://repertoire.bmi.com/" });
      }
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch {
    reports.push({
      source: "BMI Repertoire",
      status: "blocked",
      message: t(lang, "msg.proBlocked"),
      manualUrl: "https://repertoire.bmi.com/",
    });
  }

  // ── SESAC / HFA：仅提供手动入口（无公开可自动查询接口）────────
  reports.push({
    source: "SESAC Repertory",
    status: "blocked",
    message: t(lang, "msg.sesacManual"),
    manualUrl: "https://www.sesac.com/repertory/",
  });
  reports.push({
    source: "HFA Songfile",
    status: "blocked",
    message: t(lang, "msg.hfaManual"),
    manualUrl: "https://www.harryfox.com/songfile/",
  });

  return { publishers, writers, reports };
}
