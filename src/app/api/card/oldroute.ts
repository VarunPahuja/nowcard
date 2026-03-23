import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface UserData {
  name: string;
  project: string;
  vibe: string;
  openToWork: boolean;
}

interface Song {
  title: string;
  artist: string;
  albumImage: string | null;
  isPlaying: boolean;
  lastPlayed?: string;
}

const client_id = process.env.SPOTIFY_CLIENT_ID!;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN!;

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_ENDPOINT = "https://api.spotify.com/v1/me/player/currently-playing";

async function getNowPlaying(): Promise<Song> {
  const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");

  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token,
    }),
  });

  const tokenData = await tokenRes.json();
  const access_token = tokenData.access_token;

  const res = await fetch(NOW_PLAYING_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  const RECENTLY_PLAYED_ENDPOINT =
    "https://api.spotify.com/v1/me/player/recently-played?limit=1";

  if (res.status === 204 || res.status > 400) {
    const recentRes = await fetch(RECENTLY_PLAYED_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const recentData = await recentRes.json();
    const lastTrack = recentData.items?.[0];

    if (!lastTrack) {
      return {
        title: "Nothing playing",
        artist: "",
        albumImage: null,
        isPlaying: false,
      };
    }

    const playedAt = new Date(lastTrack.played_at);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - playedAt.getTime()) / 60000);

    return {
      title: lastTrack.track.name,
      artist: lastTrack.track.artists.map((a: any) => a.name).join(", "),
      albumImage: lastTrack.track.album.images[0].url,
      isPlaying: false,
      lastPlayed: `${diffMins} mins ago`,
    };
  }

  const song = await res.json();

  return {
    title: song.item.name,
    artist: song.item.artists.map((a: any) => a.name).join(", "),
    albumImage: song.item.album.images[0].url,
    isPlaying: song.is_playing,
  };
}

function getUserData(): UserData {
  const filePath = path.join(process.cwd(), "data", "user.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

async function imageToBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = res.headers.get("content-type") || "image/jpeg";
    return `data:${mimeType};base64,${base64}`;
  } catch {
    return "";
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const theme = searchParams.get("theme") || "dark";
  const accent = searchParams.get("accent") || "green";
  const hide = searchParams.get("hide") || "";

  const themes = {
    dark: {
      bg: "#1c1c1e",
      text: "#ffffff",
      subtext: "#8e8e93",
    },
    light: {
      bg: "#ffffff",
      text: "#111111",
      subtext: "#555",
    },
  };

  const t = themes[theme as "dark" | "light"] || themes.dark;

  const song = await getNowPlaying();
  const userData = getUserData();

  // Card dimensions
  const cardW = 420;
  const cardH = 210;
  const cardRx = 18;
  // Extra space on top for the floating album art
  const topPad = 55;
  const totalH = cardH + topPad;

  // Album art
  const albumSize = 88;
  const albumRx = 10;
  const albumX = (cardW - albumSize) / 2;
  const albumY = 0; // floats above card

  // Card starts below album overlap
  const cardY = topPad;

  const isPlaying = song.isPlaying;
  const titleText = isPlaying
    ? truncate(song.title, 38)
    : song.lastPlayed
    ? `Last played ${song.lastPlayed}`
    : "Nothing playing";
  const artistText = isPlaying ? truncate(song.artist, 44) : "";

  const accents = {
    green: "#22c55e",
    purple: "#a855f7",
    blue: "#3b82f6",
  };

  const accentColor = accents[accent as keyof typeof accents] || accents.green;

  const badgeColor = userData.openToWork ? accentColor : "#ef4444";
  const badgeLabel = userData.openToWork ? "YES" : "NO";
  const badgePrefix = userData.openToWork ? "✓  OPEN TO WORK: " : "✕  OPEN TO WORK: ";

  let albumImageData = "";
  if (song.albumImage) {
    albumImageData = await imageToBase64(song.albumImage);
  }

  // Vertical positions (relative to top of SVG)
  const titleY = cardY + albumSize / 2 + 30;   // below album center
  const artistY = titleY + 24;
  const projectY = artistY + 26;
  const vibeY = projectY + 20;
  const badgeCenterY = cardY + cardH - 22;
  const badgeH = 28;
  const badgeW = 198;
  const badgeX = (cardW - badgeW) / 2;

  const svg = `<svg
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${cardW}"
  height="${totalH}"
  viewBox="0 0 ${cardW} ${totalH}"
>
  <defs>
    <clipPath id="albumClip">
      <rect x="${albumX}" y="${albumY}" width="${albumSize}" height="${albumSize}" rx="${albumRx}" ry="${albumRx}" />
    </clipPath>
  </defs>

  <!-- Card background -->
  <rect
    x="0"
    y="${cardY}"
    width="${cardW}"
    height="${cardH}"
    rx="${cardRx}"
    ry="${cardRx}"
    fill="${t.bg}"
  />

  ${
    albumImageData
      ? `<!-- Album image -->
  <image
    href="${albumImageData}"
    x="${albumX}"
    y="${albumY}"
    width="${albumSize}"
    height="${albumSize}"
    clip-path="url(#albumClip)"
    preserveAspectRatio="xMidYMid slice"
  />`
      : `<!-- Album placeholder -->
  <rect
    x="${albumX}"
    y="${albumY}"
    width="${albumSize}"
    height="${albumSize}"
    rx="${albumRx}"
    ry="${albumRx}"
    fill="#2a2a2e"
    stroke="#444"
    stroke-width="1.5"
  />
  <text
    x="${cardW / 2}"
    y="${albumY + albumSize / 2 + 8}"
    text-anchor="middle"
    font-family="sans-serif"
    font-size="28"
    fill="#555"
  >♪</text>`
  }

  <!-- Song title -->
  <text
    x="${cardW / 2}"
    y="${titleY}"
    text-anchor="middle"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
    font-size="17"
    font-weight="800"
    fill="${t.text}"
    letter-spacing="0.2"
  >${escapeXml(titleText)}</text>

  ${
    artistText
      ? `<!-- Artist name -->
  <text
    x="${cardW / 2}"
    y="${artistY}"
    text-anchor="middle"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
    font-size="13"
    font-weight="400"
    fill="${t.subtext}"
  >${escapeXml(artistText)}</text>`
      : ""
  }

  <!-- Project line -->
  <text
    x="${cardW / 2}"
    y="${projectY}"
    text-anchor="middle"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
    font-size="12"
    fill="${t.subtext}"
  ><tspan fill="${t.subtext}">Project: </tspan><tspan fill="${t.text}" font-weight="500">${escapeXml(truncate(userData.project, 36))}</tspan></text>

  ${!hide.includes("vibe") ? `<!-- Vibe line -->
  <text
    x="${cardW / 2}"
    y="${vibeY}"
    text-anchor="middle"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
    font-size="12"
    fill="${t.subtext}"
  ><tspan fill="${t.subtext}">Vibe: </tspan><tspan fill="${t.text}" font-weight="500">${escapeXml(truncate(userData.vibe, 40))}</tspan></text>` : ""}

  <!-- Open to Work badge border -->
  <rect
    x="${badgeX}"
    y="${badgeCenterY - badgeH / 2}"
    width="${badgeW}"
    height="${badgeH}"
    rx="${badgeH / 2}"
    ry="${badgeH / 2}"
    fill="none"
    stroke="${badgeColor}"
    stroke-width="1.8"
  />

  <!-- Open to Work badge text -->
  <text
    x="${cardW / 2}"
    y="${badgeCenterY + 5}"
    text-anchor="middle"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
    font-size="12"
    font-weight="700"
    letter-spacing="0.6"
    fill="${badgeColor}"
  >${escapeXml(badgePrefix)}<tspan font-weight="800">${badgeLabel}</tspan></text>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}