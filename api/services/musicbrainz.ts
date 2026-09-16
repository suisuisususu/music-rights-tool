import type {
  MasterOwnerInfo,
  PublisherInfo,
  SourceReport,
  TrackInfo,
  WriterInfo,
} from "../../contracts/types";
import { t, type Lang } from "../../contracts/i18n";

const MB_BASE = "https://musicbrainz.org/ws/2";
const UA = "MusicRightsTool/1.0 (https://github.com/)";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function mbGet(path: string, retries = 2): Promise<any> {
  const res = await fetch(`${MB_BASE}${path}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  // MusicBrainz 限流时返回 503，退避后重试
  if (res.status === 503 && retries > 0) {
    await sleep(2500);
    return mbGet(path, retries - 1);
  }
  if (!res.ok) throw new Error(`MusicBrainz HTTP ${res.status}`);
  return res.json();
}

export interface MbLookup {
  track?: TrackInfo;
  publishers: PublisherInfo[];
  writers: WriterInfo[];
  masterOwner?: MasterOwnerInfo;
  report: SourceReport;
}

/**
 * MusicBrainz 开放数据库：免费、无需密钥。
 * 检索录音 → 发行（厂牌 = Master Owner 候选）→ 作品（词曲作者 / publisher 关系）。
 */
export async function lookupMusicBrainz(title: string, artist: string, lang: Lang): Promise<MbLookup> {
  const publishers: PublisherInfo[] = [];
  const writers: WriterInfo[] = [];
  let track: TrackInfo | undefined;
  let masterOwner: MasterOwnerInfo | undefined;

  try {
    const q = encodeURIComponent(`recording:"${title}" AND artist:"${artist}"`);
    const search = await mbGet(`/recording/?query=${q}&fmt=json&limit=5&inc=releases+isrcs+work-rels+artist-credits`);
    const recs: any[] = search.recordings ?? [];
    if (recs.length === 0) {
      return {
        publishers,
        writers,
        report: { source: "MusicBrainz", status: "not_found", message: t(lang, "msg.mbNotFound"), manualUrl: "https://musicbrainz.org/search" },
      };
    }
    // 优先选择非现场/非混音版本（录音室版本更可能是商用母带）
    const rec =
      recs.find((r: any) => !/live|remix|acoustic|karaoke/i.test(r.disambiguation ?? "")) ?? recs[0];
    const artistCredit = (rec["artist-credit"] ?? [])
      .map((c: any) => c.name)
      .join("");
    const release = (rec.releases ?? [])[0];

    track = {
      title: rec.title,
      artist: artistCredit || artist,
      album: release?.title,
      releaseDate: release?.date,
      isrc: (rec.isrcs ?? [])[0],
      durationMs: rec.length ?? undefined,
    };

    // 发行详情 → 厂牌（Master Owner 候选）；遍历前几个发行直到找到厂牌
    for (const rel0 of (rec.releases ?? []).slice(0, 3)) {
      if (masterOwner) break;
      if (!rel0?.id) continue;
      await sleep(1100); // MusicBrainz 限流：1 req/s
      try {
        const rel = await mbGet(`/release/${rel0.id}?inc=labels&fmt=json`);
        const labelInfo = (rel["label-info"] ?? []).find((li: any) => li.label?.name);
        const labelName = labelInfo?.label?.name;
        if (labelName) {
          track.label = labelName;
          masterOwner = {
            name: labelName,
            source: t(lang, "msg.masterSrcMb"),
            note: t(lang, "msg.masterNote"),
            contactUrl: labelInfo.label.id
              ? `https://musicbrainz.org/label/${labelInfo.label.id}`
              : undefined,
          };
        }
      } catch {
        /* 厂牌详情失败不阻塞 */
      }
    }

    // 作品（Work）→ 词曲作者 + publisher 关系
    const workRel = (rec.relations ?? []).find((r: any) => r["target-type"] === "work");
    if (workRel?.work?.id) {
      await sleep(1100);
      try {
        const work = await mbGet(`/work/${workRel.work.id}?inc=artist-rels+label-rels&fmt=json`);
        for (const r of work.relations ?? []) {
          if (r["target-type"] === "artist" && ["writer", "composer", "lyricist"].includes(r.type)) {
            writers.push({ name: r.artist?.name ?? "未知", role: r.type });
          }
          if (r["target-type"] === "label" && r.type === "publisher") {
            publishers.push({
              name: r.label?.name ?? "未知",
              source: "MusicBrainz",
              contactUrl: r.label?.id ? `https://musicbrainz.org/label/${r.label.id}` : undefined,
            });
          }
        }
      } catch {
        /* work 详情失败不阻塞 */
      }
    }

    const partial = !masterOwner || publishers.length === 0;
    return {
      track,
      publishers,
      writers,
      masterOwner,
      report: {
        source: "MusicBrainz",
        status: partial ? "partial" : "ok",
        message: partial ? t(lang, "msg.mbPartial") : undefined,
        manualUrl: "https://musicbrainz.org/search",
      },
    };
  } catch (e: any) {
    return {
      publishers,
      writers,
      report: {
        source: "MusicBrainz",
        status: "error",
        message: e?.message ?? "请求失败",
        manualUrl: "https://musicbrainz.org/search",
      },
    };
  }
}
