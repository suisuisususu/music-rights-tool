import type { MasterOwnerInfo, SourceReport, TrackInfo } from "../../contracts/types";
import { t, type Lang } from "../../contracts/i18n";

const HEADERS = {
  Referer: "https://y.qq.com/",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36",
};

export interface QqLookup {
  track?: Partial<TrackInfo>;
  masterOwner?: MasterOwnerInfo;
  report: SourceReport;
}

/**
 * QQ音乐（网页端公开接口）：对中文歌曲覆盖好。
 * 提供：专辑、发行时间、唱片公司（Master Owner 重要线索）。
 */
export async function lookupQqMusic(title: string, artist: string, lang: Lang): Promise<QqLookup> {
  try {
    // 1) 搜索歌曲
    const q = encodeURIComponent(`${title} ${artist}`);
    const searchRes = await fetch(
      `https://c.y.qq.com/soso/fcgi-bin/search_for_qq_cp?w=${q}&format=json&n=5`,
      { headers: HEADERS, signal: AbortSignal.timeout(10000) },
    );
    if (!searchRes.ok) throw new Error(`QQ音乐搜索 HTTP ${searchRes.status}`);
    const search: any = await searchRes.json();
    const list: any[] = search?.data?.song?.list ?? [];
    // 优先歌手名匹配的条目
    const hit =
      list.find((s) =>
        (s.singer ?? []).some((g: any) =>
          (g.name ?? "").toLowerCase().includes(artist.toLowerCase()) ||
          artist.toLowerCase().includes((g.name ?? "").toLowerCase()),
        ),
      ) ?? list[0];
    if (!hit) {
      return {
        report: { source: "QQ音乐", status: "not_found", message: t(lang, "msg.qqNotFound"), manualUrl: "https://y.qq.com/" },
      };
    }

    // 2) 歌曲详情（含唱片公司）
    const detailRes = await fetch("https://u.y.qq.com/cgi-bin/musicu.fcg", {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        comm: { ct: 24, cv: 0 },
        songinfo: {
          method: "get_song_detail_yqq",
          param: { song_type: 0, song_mid: hit.songmid },
          module: "music.pf_song_detail_svr",
        },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!detailRes.ok) throw new Error(`QQ音乐详情 HTTP ${detailRes.status}`);
    const detail: any = await detailRes.json();
    const data = detail?.songinfo?.data;
    const company: string | undefined = data?.info?.company?.content?.[0]?.value;
    const pubTime: string | undefined = data?.info?.pub_time?.content?.[0]?.value;
    const trackInfo = data?.track_info;

    return {
      track: {
        title: trackInfo?.name ?? hit.songname,
        artist: (trackInfo?.singer ?? hit.singer ?? []).map((g: any) => g.name).join(", "),
        album: trackInfo?.album?.name ?? hit.albumname,
        releaseDate: pubTime,
        durationMs: (trackInfo?.interval ?? hit.interval) ? (trackInfo?.interval ?? hit.interval) * 1000 : undefined,
        label: company,
      },
      masterOwner: company
        ? { name: company, source: t(lang, "msg.masterSrcQQ"), note: t(lang, "msg.masterNote") }
        : undefined,
      report: { source: "QQ音乐", status: company ? "ok" : "partial" },
    };
  } catch (e: any) {
    return {
      report: { source: "QQ音乐", status: "error", message: e?.message ?? "请求失败", manualUrl: "https://y.qq.com/" },
    };
  }
}
