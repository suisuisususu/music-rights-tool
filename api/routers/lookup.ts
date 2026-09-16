import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { lookupMusicBrainz } from "../services/musicbrainz";
import { lookupSpotify } from "../services/spotify";
import { lookupProSources } from "../services/proSources";
import { lookupQqMusic } from "../services/qqmusic";
import { lookupMlc } from "../services/mlc";
import { MANUAL_LINKS } from "../../contracts/constants";
import { t } from "../../contracts/i18n";
import type { LookupResult, PublisherInfo, WriterInfo } from "../../contracts/types";

function dedupeByName<T extends { name: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = i.name.trim().toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export const lookupRouter = createRouter({
  search: publicQuery
    .input(
      z.object({
        title: z.string().min(1),
        artist: z.string().min(1),
        lang: z.enum(["zh", "en"]).default("zh"),
      }),
    )
    .query(async ({ input }): Promise<LookupResult> => {
      const { title, artist, lang } = input;

      // 四个数据源并行；任一失败不影响其他
      const [mb, spotify, pro, qq, mlc] = await Promise.all([
        lookupMusicBrainz(title, artist, lang),
        lookupSpotify(title, artist, lang),
        lookupProSources(title, artist, lang),
        lookupQqMusic(title, artist, lang),
        lookupMlc(title, artist, lang),
      ]);

      const hasTrack = mb.track || spotify.track?.title || qq.track?.title;
      const track = hasTrack
        ? {
            title: spotify.track?.title ?? mb.track?.title ?? qq.track?.title ?? title,
            artist: spotify.track?.artist ?? mb.track?.artist ?? qq.track?.artist ?? artist,
            album: spotify.track?.album ?? mb.track?.album ?? qq.track?.album,
            releaseDate: spotify.track?.releaseDate ?? mb.track?.releaseDate ?? qq.track?.releaseDate,
            isrc: spotify.track?.isrc ?? mb.track?.isrc,
            label: spotify.track?.label ?? mb.track?.label ?? qq.track?.label,
            coverUrl: spotify.track?.coverUrl,
            spotifyUrl: spotify.track?.spotifyUrl,
            popularity: spotify.track?.popularity,
            durationMs: spotify.track?.durationMs ?? mb.track?.durationMs ?? qq.track?.durationMs,
          }
        : undefined;

      const publishers: PublisherInfo[] = dedupeByName([...mlc.publishers, ...pro.publishers, ...mb.publishers]);
      const writers: WriterInfo[] = dedupeByName([...mlc.writers, ...pro.writers, ...mb.writers]);
      const masterOwner = spotify.masterOwner ?? mb.masterOwner ?? qq.masterOwner;

      const found = Boolean(track);
      const needManual = !found || publishers.length === 0 || !masterOwner;

      return {
        query: { title, artist },
        found,
        track,
        publishers,
        writers,
        masterOwner,
        sources: [mlc.report, mb.report, spotify.report, qq.report, ...pro.reports],
        manualLinks: MANUAL_LINKS.map((l) => ({
          label: t(lang, `manual.${l.id}`),
          url: l.url,
          note: t(lang, `manual.${l.id}.note`),
        })),
        needManual,
        message: !found
          ? t(lang, "msg.resultNotFound")
          : needManual
            ? t(lang, "msg.resultPartial")
            : undefined,
      };
    }),
});
