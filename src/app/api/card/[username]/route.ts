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

interface LastfmStats {
  scrobbles: string;
  topArtist: string;
  registeredYear: string;
}

async function findUserByLastfmUsername(lastfmUsername: string) {
  const clerk = await clerkClient();
  // Get all users and find the one with matching lastfmUsername in unsafeMetadata
  // Use Clerk's user list with a reasonable limit
  const users = await clerk.users.getUserList({ limit: 500 });
  return users.data.find(
    (u) => (u.unsafeMetadata as any)?.lastfmUsername?.toLowerCase() === lastfmUsername.toLowerCase()
  ) || null;
}

async function getNowPlaying(lastfmUsername: string): Promise<Song> {
  const res = await fetch(
    `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfmUsername}&api_key=${LASTFM_API_KEY}&format=json&limit=1`
  );

  if (!res.ok) {
    return { title: "Last.fm unavailable", artist: "", albumImage: null, isPlaying: false };
  }

  const data = await res.json();
  if (data.error) {
    return { title: "Nothing playing", artist: "", albumImage: null, isPlaying: false };
  }

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
    const timeLabel = diffMins < 60
      ? `${diffMins}m ago`
      : diffMins < 1440
      ? `${Math.floor(diffMins / 60)}h ago`
      : `${Math.floor(diffMins / 1440)}d ago`;
    return { title, artist, albumImage, isPlaying: false, lastPlayed: timeLabel };
  }

  return { title, artist, albumImage, isPlaying: true };
}

async function getLastfmStats(lastfmUsername: string): Promise<LastfmStats | null> {
  try {
    const [userRes, topRes] = await Promise.all([
      fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${lastfmUsername}&api_key=${LASTFM_API_KEY}&format=json`),
      fetch(`https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${lastfmUsername}&api_key=${LASTFM_API_KEY}&format=json&limit=1&period=1month`)
    ]);

    if (!userRes.ok || !topRes.ok) return null;

    const userData = await userRes.json();
    const topData = await topRes.json();

    if (userData.error) return null;

    const scrobbles = parseInt(userData.user?.playcount || "0").toLocaleString();
    const registeredYear = new Date(parseInt(userData.user?.registered?.unixtime || "0") * 1000).getFullYear().toString();
    const topArtist = topData.topartists?.artist?.[0]?.name || "";

    return { scrobbles, topArtist, registeredYear };
  } catch {
    return null;
  }
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
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const { searchParams } = new URL(req.url);
  const theme = searchParams.get("theme") || "dark";
  const accent = searchParams.get("accent") || "green";
  const hide = searchParams.get("hide") || "";
  const widgets = searchParams.get("widgets") || ""; // e.g. "scrobbles,topartist,since"

  const hideModules = hide.split(",").map(s => s.trim()).filter(Boolean);
  const activeWidgets = widgets.split(",").map(s => s.trim()).filter(Boolean);

  const showAlbumArt = !hideModules.includes("albumart");
  const showVibe = !hideModules.includes("vibe");
  const showProject = !hideModules.includes("project");
  const showOpenToWork = !hideModules.includes("opentowork");

  const showScrobbles = activeWidgets.includes("scrobbles");
  const showTopArtist = activeWidgets.includes("topartist");
  const showSince = activeWidgets.includes("since");
  const hasAnyWidget = showScrobbles || showTopArtist || showSince;

  // Find user by Last.fm username
  let user: any = null;
  try {
    user = await findUserByLastfmUsername(username);
  } catch (err) {
    console.error("User lookup failed:", err);
  }

  if (!user) {
    return new NextResponse(
      `<svg width="420" height="60" xmlns="http://www.w3.org/2000/svg">
        <rect width="420" height="60" rx="12" fill="#1c1c1e"/>
        <text x="20" y="36" font-family="sans-serif" font-size="14" fill="#8e8e93">User not found: ${escapeXml(username)}</text>
      </svg>`,
      { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-cache" } }
    );
  }

  const meta = user.unsafeMetadata as any;
  const lastfmUsername = meta.lastfmUsername || username;

  // Fetch song + stats in parallel
  const [song, stats] = await Promise.all([
    getNowPlaying(lastfmUsername).catch(() => ({
      title: "Unavailable", artist: "", albumImage: null, isPlaying: false
    } as Song)),
    hasAnyWidget ? getLastfmStats(lastfmUsername).catch(() => null) : Promise.resolve(null)
  ]);

  const userData = {
    project: String(meta.project || ""),
    vibe: String(meta.vibe || ""),
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
    orange: "#f97316",
  };
  const accentColor = accents[accent] ?? accents.green;

  const cardW = 480;
  const albumSize = 88;
  const albumRx = 10;
  const albumX = (cardW - albumSize) / 2;
  const albumY = 0;
  const topPad = albumSize / 2 + 10;
  const cardStartY = albumSize / 2;

  // Calculate card height dynamically
  let contentLines = 0;
  if (song.isPlaying || song.title) contentLines += 2; // title + artist
  if (showProject && userData.project) contentLines += 1;
  if (showVibe && userData.vibe) contentLines += 1;
  if (showOpenToWork) contentLines += 1;
  if (hasAnyWidget && stats) contentLines += 1;

  const lineHeight = 22;
  const paddingTop = 50;
  const paddingBottom = 24;
  const cardH = paddingTop + (contentLines * lineHeight) + paddingBottom + (hasAnyWidget && stats ? 16 : 0);
  const totalH = cardStartY + cardH;

  const titleText = song.isPlaying
    ? truncate(song.title, 38)
    : song.lastPlayed
    ? `Last played ${song.lastPlayed}`
    : "Nothing playing";
  const artistText = song.isPlaying || song.artist ? truncate(song.artist, 44) : "";

  const badgeColor = userData.openToWork ? accentColor : "#ef4444";
  const badgeLabel = userData.openToWork ? "YES" : "NO";
  const badgePrefix = userData.openToWork ? "✓  OPEN TO WORK: " : "✕  OPEN TO WORK: ";

  let albumImageData = "";
  if (showAlbumArt && song.albumImage) {
    albumImageData = await imageToBase64(song.albumImage);
  }

  // Calculate Y positions dynamically
  const titleY = cardStartY + paddingTop;
  const artistY = titleY + lineHeight;
  let currentY = artistY + lineHeight + 4;

  const projectY = showProject && userData.project ? (currentY += lineHeight, currentY - lineHeight) : 0;
  const vibeY = showVibe && userData.vibe ? (currentY += lineHeight, currentY - lineHeight) : 0;
  const badgeCenterY = showOpenToWork ? (currentY += lineHeight + 4, currentY - lineHeight / 2) : 0;

  // Widget row Y
  const widgetY = hasAnyWidget && stats ? (currentY += 20, currentY) : 0;

  const badgeH = 26;
  const badgeW = 180;
  const badgeX = (cardW - badgeW) / 2;

  // Build widget pills SVG
  const widgetPills: string[] = [];
  if (stats) {
    let pillX = 20;
    const pillH = 20;
    const pillPad = 10;
    const fontSize = 10;

    if (showScrobbles && stats.scrobbles) {
      const label = `♪ ${stats.scrobbles}`;
      const pillW = label.length * 6.5 + pillPad * 2;
      widgetPills.push(`
        <rect x="${pillX}" y="${widgetY - pillH + 4}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="${accentColor}22" stroke="${accentColor}44" stroke-width="0.8"/>
        <text x="${pillX + pillW / 2}" y="${widgetY - pillH + 4 + 13}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="${fontSize}" fill="${accentColor}">${escapeXml(label)}</text>
      `);
      pillX += pillW + 8;
    }

    if (showTopArtist && stats.topArtist) {
      const label = `↑ ${truncate(stats.topArtist, 18)}`;
      const pillW = label.length * 6 + pillPad * 2;
      widgetPills.push(`
        <rect x="${pillX}" y="${widgetY - pillH + 4}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="${t.text}11" stroke="${t.text}22" stroke-width="0.8"/>
        <text x="${pillX + pillW / 2}" y="${widgetY - pillH + 4 + 13}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="${fontSize}" fill="${t.subtext}">${escapeXml(label)}</text>
      `);
      pillX += pillW + 8;
    }

    if (showSince && stats.registeredYear) {
      const label = `since ${stats.registeredYear}`;
      const pillW = label.length * 6 + pillPad * 2;
      widgetPills.push(`
        <rect x="${pillX}" y="${widgetY - pillH + 4}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="${t.text}11" stroke="${t.text}22" stroke-width="0.8"/>
        <text x="${pillX + pillW / 2}" y="${widgetY - pillH + 4 + 13}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="${fontSize}" fill="${t.subtext}">${escapeXml(label)}</text>
      `);
    }
  }

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

  <rect x="0" y="${cardStartY}" width="${cardW}" height="${cardH}" rx="18" ry="18" fill="${t.bg}" />

  ${albumImageData
    ? `<image href="${albumImageData}" x="${albumX}" y="${albumY}" width="${albumSize}" height="${albumSize}" clip-path="url(#albumClip)" preserveAspectRatio="xMidYMid slice" />`
    : showAlbumArt
    ? `<rect x="${albumX}" y="${albumY}" width="${albumSize}" height="${albumSize}" rx="${albumRx}" ry="${albumRx}" fill="#2a2a2e" stroke="#444" stroke-width="1.5" />
       <text x="${cardW / 2}" y="${albumY + albumSize / 2 + 8}" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#555">♪</text>`
    : ""
  }

  <text x="${cardW / 2}" y="${titleY}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="17" font-weight="800" fill="${t.text}">${escapeXml(titleText)}</text>

  ${artistText ? `<text x="${cardW / 2}" y="${artistY}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="13" fill="${t.subtext}">${escapeXml(artistText)}</text>` : ""}

  ${showProject && userData.project ? `<text x="${cardW / 2}" y="${projectY}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="12" fill="${t.subtext}">Project: <tspan fill="${t.text}" font-weight="500">${escapeXml(truncate(userData.project, 36))}</tspan></text>` : ""}

  ${showVibe && userData.vibe ? `<text x="${cardW / 2}" y="${vibeY}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="12" fill="${t.subtext}">Vibe: <tspan fill="${t.text}" font-weight="500">${escapeXml(truncate(userData.vibe, 40))}</tspan></text>` : ""}

  ${showOpenToWork ? `
  <rect x="${badgeX}" y="${badgeCenterY - badgeH / 2}" width="${badgeW}" height="${badgeH}" rx="${badgeH / 2}" ry="${badgeH / 2}" fill="none" stroke="${badgeColor}" stroke-width="1.8" />
  <text x="${cardW / 2}" y="${badgeCenterY + 5}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="0.6" fill="${badgeColor}">${escapeXml(badgePrefix)}<tspan font-weight="800">${badgeLabel}</tspan></text>
  ` : ""}

  ${widgetPills.join("")}
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
