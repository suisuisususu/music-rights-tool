import type { MasterOwnerInfo, SourceReport, TrackInfo } from "../../contracts/types";
import { t, type Lang } from "../../contracts/i18n";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(clientId: string, clientSecret: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Spotify 授权失败 HTTP ${res.status}`);
  const data: any = await res.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

export interface SpotifyLookup {
  track?: Partial<TrackInfo>;
  masterOwner?: MasterOwnerInfo;
  report: SourceReport;
}

/**
 * Spotify Web API（需在 .env 配置 SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET）。
 * 提供：ISRC、专辑、流行度、以及专辑的 label（Master Owner 重要线索）。
 */
export async function lookupSpotify(title: string, artist: string, lang: Lang): Promise<SpotifyLookup> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return {
      report: {
        source: "Spotify",
        status: "not_configured",
        message: t(lang, "msg.spotifyNotConfigured"),
        manualUrl: "https://developer.spotify.com/dashboard",
      },
    };
  }

  try {
    const token = await getToken(clientId, clientSecret);
    const q = encodeURIComponent(`track:${title} artist:${artist}`);
    const searchRes = await fetch(`${API_BASE}/search?q=${q}&type=track&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!searchRes.ok) throw new Error(`Spotify 搜索失败 HTTP ${searchRes.status}`);
    const search: any = await searchRes.json();
    const item = search.tracks?.items?.[0];
    if (!item) {
      return {
        report: { source: "Spotify", status: "not_found", message: t(lang, "msg.spotifyNotFound"), manualUrl: "https://open.spotify.com/search" },
      };
    }

    // 专辑详情含 label 字段
    let label: string | undefined;
    if (item.album?.id) {
      const albumRes = await fetch(`${API_BASE}/albums/${item.album.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      });
      if (albumRes.ok) {
        const album: any = await albumRes.json();
        label = album.label;
      }
    }

    return {
      track: {
        title: item.name,
        artist: (item.artists ?? []).map((a: any) => a.name).join(", "),
        album: item.album?.name,
        releaseDate: item.album?.release_date,
        isrc: item.external_ids?.isrc,
        coverUrl: item.album?.images?.[0]?.url,
        spotifyUrl: item.external_urls?.spotify,
        popularity: item.popularity,
        durationMs: item.duration_ms,
        label,
      },
      masterOwner: label
        ? {
            name: label,
            source: t(lang, "msg.masterSrcSpotify"),
            note: t(lang, "msg.masterNote"),
          }
        : undefined,
      report: { source: "Spotify", status: "ok" },
    };
  } catch (e: any) {
    return {
      report: { source: "Spotify", status: "error", message: e?.message ?? "请求失败", manualUrl: "https://open.spotify.com/search" },
    };
  }
}
