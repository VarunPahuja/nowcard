import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

const LASTFM_API_KEY = process.env.LASTFM_API_KEY!;

interface Song {
  title: string;
  artist: string;
  albumImage: string | null;
  isPlaying: boolean;
  lastPlayed?: string;
}

async function getNowPlaying(lastfmUsername: string): Promise<Song> {
  const res = await fetch(
    `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfmUsername}&api_key=${LASTFM_API_KEY}&format=json&limit=1`
  );

  if (!res.ok) {
    return { title: "Last.fm unavailable", artist: "", albumImage: null, isPlaying: false };
  }

  const data = await res.json();
  const track = data.recenttracks?.track?.[0];

  if (!track) {
    return { title: "Nothing playing", artist: "", albumImage: null, isPlaying: false };
  }

  const isPlaying = track["@attr"]?.nowplaying === "true";
  const title = track.name;
  const artist = track.artist["#text"];
  const albumImage = track.image?.find((img: any) => img.size === "large")?.["#text"] || null;

  if (!isPlaying) {
    const playedAt = new Date(parseInt(track.date?.uts || "0") * 1000);
    const diffMins = Math.floor((Date.now() - playedAt.getTime()) / 60000);
    return { title, artist, albumImage, isPlaying: false, lastPlayed: `${diffMins} mins ago` };
  }

  return { title, artist, albumImage, isPlaying: true };
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const { searchParams } = new URL(req.url);
  const theme = searchParams.get("theme") || "dark";
  const accent = searchParams.get("accent") || "green";
  const hide = searchParams.get("hide") || "";

  let user: any;
  try {
    const clerk = await clerkClient();
    user = await clerk.users.getUser(userId);
  } catch (err) {
    console.error("Clerk user fetch failed:", err);
    return new NextResponse("Invalid user", { status: 400 });
  }

  const meta = user.unsafeMetadata as any;
  const lastfmUsername: string | undefined = meta.lastfmUsername;

  if (!lastfmUsername) {
    return new NextResponse(
      `<svg width="420" height="60" xmlns="http://www.w3.org/2000/svg">
        <rect width="420" height="60" rx="12" fill="#1c1c1e"/>
        <text x="20" y="36" font-family="sans-serif" font-size="14" fill="#8e8e93">Last.fm not connected yet</text>
      </svg>`,
      { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-cache" } }
    );
  }

  let song: Song;
  try {
    song = await getNowPlaying(lastfmUsername);
  } catch (err) {
    console.error("getNowPlaying threw for user", userId, err);
    song = { title: "Last.fm unavailable", artist: "", albumImage: null, isPlaying: false };
  }

  const userData = {
    name: user.firstName || "User",
    project: String(meta.project || "No project"),
    vibe: String(meta.vibe || "No vibe"),
    openToWork: Boolean(meta.openToWork ?? false),
  };

  const themes: Record<string, { bg: string; text: string; subtext: string }> = {
    dark: { bg: "#1c1c1e", text: "#ffffff", subtext: "#8e8e93" },
    light: { bg: "#ffffff", text: "#111111", subtext: "#555555" },
  };
  const t = themes[theme] ?? themes.dark;

  const accents: Record<string, string> = {
    green: "#22c55e",
    purple: "#a855f7",
    blue: "#3b82f6",
  };
  const accentColor = accents[accent] ?? accents.green;

  const cardW = 420;
  const cardH = 210;
  const cardRx = 18;
  const topPad = 55;
  const totalH = cardH + topPad;
  const albumSize = 88;
  const albumRx = 10;
  const albumX = (cardW - albumSize) / 2;
  const albumY = 0;
  const cardY = topPad;

  const titleText = song.isPlaying
    ? truncate(song.title, 38)
    : song.lastPlayed
    ? `Last played ${song.lastPlayed}`
    : "Nothing playing";
  const artistText = song.isPlaying ? truncate(song.artist, 44) : "";

  const badgeColor = userData.openToWork ? accentColor : "#ef4444";
  const badgeLabel = userData.openToWork ? "YES" : "NO";
  const badgePrefix = userData.openToWork ? "✓  OPEN TO WORK: " : "✕  OPEN TO WORK: ";

  let albumImageData = "";
  if (song.albumImage) {
    albumImageData = await imageToBase64(song.albumImage);
  }

  const titleY = cardY + albumSize / 2 + 30;
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
  <rect x="0" y="${cardY}" width="${cardW}" height="${cardH}" rx="${cardRx}" ry="${cardRx}" fill="${t.bg}" />
  ${albumImageData
    ? `<image href="${albumImageData}" x="${albumX}" y="${albumY}" width="${albumSize}" height="${albumSize}" clip-path="url(#albumClip)" preserveAspectRatio="xMidYMid slice" />`
    : `<rect x="${albumX}" y="${albumY}" width="${albumSize}" height="${albumSize}" rx="${albumRx}" ry="${albumRx}" fill="#2a2a2e" stroke="#444" stroke-width="1.5" />
       <text x="${cardW / 2}" y="${albumY + albumSize / 2 + 8}" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#555">♪</text>`
  }
  <text x="${cardW / 2}" y="${titleY}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="17" font-weight="800" fill="${t.text}" letter-spacing="0.2">${escapeXml(titleText)}</text>
  ${artistText ? `<text x="${cardW / 2}" y="${artistY}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="13" font-weight="400" fill="${t.subtext}">${escapeXml(artistText)}</text>` : ""}
  <text x="${cardW / 2}" y="${projectY}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="12" fill="${t.subtext}"><tspan fill="${t.subtext}">Project: </tspan><tspan fill="${t.text}" font-weight="500">${escapeXml(truncate(userData.project, 36))}</tspan></text>
  ${!hide.includes("vibe") ? `<text x="${cardW / 2}" y="${vibeY}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="12" fill="${t.subtext}"><tspan fill="${t.subtext}">Vibe: </tspan><tspan fill="${t.text}" font-weight="500">${escapeXml(truncate(userData.vibe, 40))}</tspan></text>` : ""}
  <rect x="${badgeX}" y="${badgeCenterY - badgeH / 2}" width="${badgeW}" height="${badgeH}" rx="${badgeH / 2}" ry="${badgeH / 2}" fill="none" stroke="${badgeColor}" stroke-width="1.8" />
  <text x="${cardW / 2}" y="${badgeCenterY + 5}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="0.6" fill="${badgeColor}">${escapeXml(badgePrefix)}<tspan font-weight="800">${badgeLabel}</tspan></text>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}