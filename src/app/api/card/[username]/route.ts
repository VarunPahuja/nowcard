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
  const layout = searchParams.get("layout") || "default";

  // Helper values used across layouts
  const accentColor = accents[accent] ?? accents.green;

  const titleText = song.isPlaying
    ? truncate(song.title, 38)
    : song.lastPlayed
    ? `Last played ${song.lastPlayed}`
    : "Nothing playing";
  const artistText = truncate(song.artist, 44);

  const badgeColor = userData.openToWork ? accentColor : "#ef4444";
  const badgeLabel = userData.openToWork ? "YES" : "NO";
  const badgePrefix = userData.openToWork ? "✓  OPEN TO WORK: " : "✕  OPEN TO WORK: ";

  let albumImageData = "";
  if (showAlbumArt && song.albumImage) {
    albumImageData = await imageToBase64(song.albumImage);
  }

  // Widget pills builder (reused across layouts)
  function buildWidgetPills(startX: number, y: number, accentColor: string, subtext: string): string {
    if (!hasAnyWidget || !stats) return "";
    const pills: string[] = [];
    let pillX = startX;
    const pillH = 20;
    const pillPad = 10;
    const fontSize = 10;

    if (showScrobbles && stats.scrobbles) {
      const label = `♪ ${stats.scrobbles}`;
      const pillW = label.length * 6.5 + pillPad * 2;
      pills.push(`
        <rect x="${pillX}" y="${y}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="${accentColor}22" stroke="${accentColor}44" stroke-width="0.8"/>
        <text x="${pillX + pillW / 2}" y="${y + 13}" text-anchor="middle" font-family="Inter,sans-serif" font-size="${fontSize}" fill="${accentColor}">${escapeXml(label)}</text>
      `);
      pillX += pillW + 8;
    }
    if (showTopArtist && stats.topArtist) {
      const label = `↑ ${truncate(stats.topArtist, 18)}`;
      const pillW = label.length * 6 + pillPad * 2;
      pills.push(`
        <rect x="${pillX}" y="${y}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="${subtext}22" stroke="${subtext}33" stroke-width="0.8"/>
        <text x="${pillX + pillW / 2}" y="${y + 13}" text-anchor="middle" font-family="Inter,sans-serif" font-size="${fontSize}" fill="${subtext}">${escapeXml(label)}</text>
      `);
      pillX += pillW + 8;
    }
    if (showSince && stats.registeredYear) {
      const label = `since ${stats.registeredYear}`;
      const pillW = label.length * 6 + pillPad * 2;
      pills.push(`
        <rect x="${pillX}" y="${y}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="${subtext}22" stroke="${subtext}33" stroke-width="0.8"/>
        <text x="${pillX + pillW / 2}" y="${y + 13}" text-anchor="middle" font-family="Inter,sans-serif" font-size="${fontSize}" fill="${subtext}">${escapeXml(label)}</text>
      `);
    }
    return pills.join("");
  }

  let svg = "";

  // ─── LAYOUT: default ─────────────────────────────────────────────────────────
  if (layout === "default") {
    const cardW = 480;
    const albumSize = 88;
    const albumX = (cardW - albumSize) / 2;
    const albumY = 0;
    const cardStartY = albumSize / 2;
    let contentLines = 2;
    if (showProject && userData.project) contentLines++;
    if (showVibe && userData.vibe) contentLines++;
    if (showOpenToWork) contentLines++;
    if (hasAnyWidget && stats) contentLines++;
    const lineH = 22;
    const cardH = 50 + contentLines * lineH + 24 + (hasAnyWidget && stats ? 16 : 0);
    const totalH = cardStartY + cardH;
    const titleY = cardStartY + 50;
    const artistY = titleY + lineH;
    let cy = artistY + lineH + 4;
    const projectY = showProject && userData.project ? (cy += lineH, cy - lineH) : 0;
    const vibeY = showVibe && userData.vibe ? (cy += lineH, cy - lineH) : 0;
    const badgeCenterY = showOpenToWork ? (cy += lineH + 4, cy - lineH / 2) : 0;
    const widgetY = hasAnyWidget && stats ? (cy += 20, cy - 16) : 0;
    const badgeW = 180; const badgeH = 26; const badgeX = (cardW - badgeW) / 2;

    svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${cardW}" height="${totalH}" viewBox="0 0 ${cardW} ${totalH}">
    <defs><clipPath id="ac"><rect x="${albumX}" y="${albumY}" width="${albumSize}" height="${albumSize}" rx="10"/></clipPath></defs>
    <rect x="0" y="${cardStartY}" width="${cardW}" height="${cardH}" rx="18" fill="${t.bg}"/>
    ${albumImageData ? `<image href="${albumImageData}" x="${albumX}" y="${albumY}" width="${albumSize}" height="${albumSize}" clip-path="url(#ac)" preserveAspectRatio="xMidYMid slice"/>` : showAlbumArt ? `<rect x="${albumX}" y="${albumY}" width="${albumSize}" height="${albumSize}" rx="10" fill="#2a2a2e" stroke="#444" stroke-width="1.5"/><text x="${cardW/2}" y="${albumY+albumSize/2+8}" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#555">♪</text>` : ""}
    <text x="${cardW/2}" y="${titleY}" text-anchor="middle" font-family="Inter,sans-serif" font-size="17" font-weight="800" fill="${t.text}">${escapeXml(titleText)}</text>
    ${artistText ? `<text x="${cardW/2}" y="${artistY}" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" fill="${t.subtext}">${escapeXml(artistText)}</text>` : ""}
    ${showProject && userData.project ? `<text x="${cardW/2}" y="${projectY}" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" fill="${t.subtext}">Project: <tspan fill="${t.text}" font-weight="500">${escapeXml(truncate(userData.project, 36))}</tspan></text>` : ""}
    ${showVibe && userData.vibe ? `<text x="${cardW/2}" y="${vibeY}" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" fill="${t.subtext}">Vibe: <tspan fill="${t.text}" font-weight="500">${escapeXml(truncate(userData.vibe, 40))}</tspan></text>` : ""}
    ${showOpenToWork ? `<rect x="${badgeX}" y="${badgeCenterY - badgeH/2}" width="${badgeW}" height="${badgeH}" rx="${badgeH/2}" fill="none" stroke="${badgeColor}" stroke-width="1.8"/><text x="${cardW/2}" y="${badgeCenterY+5}" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="700" fill="${badgeColor}">${escapeXml(badgePrefix)}<tspan font-weight="800">${badgeLabel}</tspan></text>` : ""}
    ${buildWidgetPills(20, widgetY, accentColor, t.subtext)}
  </svg>`;
  }

  // ─── LAYOUT: soft ────────────────────────────────────────────────────────────
  else if (layout === "soft") {
    const W = 480; const H = 160;
    svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><clipPath id="ac"><rect x="14" y="28" width="100" height="104" rx="10"/></clipPath></defs>
    <rect width="${W}" height="${H}" rx="16" fill="#fafafa" stroke="#e5e5e5" stroke-width="1"/>
    ${albumImageData ? `<image href="${albumImageData}" x="14" y="28" width="100" height="104" clip-path="url(#ac)" preserveAspectRatio="xMidYMid slice"/>` : showAlbumArt ? `<rect x="14" y="28" width="100" height="104" rx="10" fill="#e8e8e8"/>` : ""}
    <text x="126" y="46" font-family="Inter,sans-serif" font-size="8" fill="#999" letter-spacing="1.5">NOW PLAYING</text>
    <text x="126" y="68" font-family="Inter,sans-serif" font-size="17" font-weight="700" fill="#111">${escapeXml(truncate(titleText, 24))}</text>
    <text x="126" y="86" font-family="Inter,sans-serif" font-size="12" fill="#666">${escapeXml(artistText)}</text>
    ${showProject && userData.project ? `<text x="126" y="106" font-family="Inter,sans-serif" font-size="11" fill="#999">Project: <tspan fill="#333">${escapeXml(truncate(userData.project, 22))}</tspan></text>` : ""}
    ${showVibe && userData.vibe ? `<text x="126" y="122" font-family="Inter,sans-serif" font-size="11" fill="#999">Vibe: <tspan fill="#333">${escapeXml(truncate(userData.vibe, 26))}</tspan></text>` : ""}
    ${showOpenToWork ? `<rect x="360" y="130" width="104" height="20" rx="10" fill="none" stroke="${accentColor}" stroke-width="1"/><text x="412" y="144" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="${accentColor}">AVAILABLE</text>` : ""}
    ${buildWidgetPills(126, 136, accentColor, "#999")}
  </svg>`;
  }

  // ─── LAYOUT: compact ─────────────────────────────────────────────────────────
  else if (layout === "compact") {
    const W = 480; const H = 80;
    svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><clipPath id="ac"><rect x="12" y="12" width="56" height="56" rx="6"/></clipPath></defs>
    <rect width="${W}" height="${H}" rx="10" fill="#ffffff" stroke="#e0e0e0" stroke-width="1"/>
    ${albumImageData ? `<image href="${albumImageData}" x="12" y="12" width="56" height="56" clip-path="url(#ac)" preserveAspectRatio="xMidYMid slice"/>` : showAlbumArt ? `<rect x="12" y="12" width="56" height="56" rx="6" fill="#f0f0f0"/>` : ""}
    <text x="78" y="28" font-family="Inter,sans-serif" font-size="8" fill="#999">NOW PLAYING</text>
    <text x="78" y="46" font-family="Inter,sans-serif" font-size="14" font-weight="700" fill="#111">${escapeXml(truncate(titleText, 20))}</text>
    <text x="78" y="62" font-family="Inter,sans-serif" font-size="11" fill="#777">${escapeXml(truncate(artistText, 22))}</text>
    ${showProject && userData.project ? `<text x="260" y="36" font-family="Inter,sans-serif" font-size="10" fill="#777">P: <tspan fill="#333">${escapeXml(truncate(userData.project, 14))}</tspan></text>` : ""}
    ${showVibe && userData.vibe ? `<text x="260" y="52" font-family="Inter,sans-serif" font-size="10" fill="#777">V: <tspan fill="#333">${escapeXml(truncate(userData.vibe, 14))}</tspan></text>` : ""}
    ${showOpenToWork ? `<circle cx="440" cy="40" r="4" fill="${accentColor}"/><text x="450" y="44" font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="${accentColor}">OPEN</text>` : ""}
  </svg>`;
  }

  // ─── LAYOUT: hero ────────────────────────────────────────────────────────────
  else if (layout === "hero") {
    const W = 480;
    let H = 240;
    if (hasAnyWidget && stats) H += 30;
    svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><clipPath id="ac"><circle cx="240" cy="56" r="36"/></clipPath></defs>
    <rect width="${W}" height="${H}" rx="16" fill="#0d0d0d"/>
    ${albumImageData ? `<image href="${albumImageData}" x="204" y="20" width="72" height="72" clip-path="url(#ac)" preserveAspectRatio="xMidYMid slice"/>` : showAlbumArt ? `<circle cx="240" cy="56" r="36" fill="#1a1a2e"/>` : ""}
    <text x="${W/2}" y="114" text-anchor="middle" font-family="Inter,sans-serif" font-size="20" font-weight="700" fill="#ffffff">${escapeXml(truncate(titleText, 30))}</text>
    <text x="${W/2}" y="134" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" fill="#888">${escapeXml(artistText)}</text>
    ${showProject && userData.project ? `<text x="${W/2}" y="158" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" fill="#666">Project: <tspan fill="#aaa">${escapeXml(truncate(userData.project, 28))}</tspan></text>` : ""}
    ${showVibe && userData.vibe ? `<text x="${W/2}" y="176" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" fill="#666">Vibe: <tspan fill="#aaa">${escapeXml(truncate(userData.vibe, 30))}</tspan></text>` : ""}
    ${showOpenToWork ? `<rect x="165" y="194" width="150" height="28" rx="14" fill="${accentColor}"/><text x="${W/2}" y="212" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="700" fill="#000">OPEN TO WORK: ${badgeLabel}</text>` : ""}
    ${buildWidgetPills(20, 228, accentColor, "#666")}
  </svg>`;
  }

  // ─── LAYOUT: grid ────────────────────────────────────────────────────────────
  else if (layout === "grid") {
    const W = 480; const H = 200;
    svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><clipPath id="ac"><rect x="22" y="24" width="36" height="36" rx="4"/></clipPath></defs>
    <rect width="${W}" height="${H}" rx="12" fill="#ffffff" stroke="#eeeeee" stroke-width="1"/>
    <rect x="10" y="10" width="228" height="86" rx="8" fill="#f9f9f9" stroke="#eee" stroke-width="1"/>
    ${albumImageData ? `<image href="${albumImageData}" x="22" y="24" width="36" height="36" clip-path="url(#ac)" preserveAspectRatio="xMidYMid slice"/>` : showAlbumArt ? `<rect x="22" y="24" width="36" height="36" rx="4" fill="#e8e8e8"/>` : ""}
    <text x="66" y="36" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="#111">${escapeXml(truncate(titleText, 14))}</text>
    <text x="66" y="52" font-family="Inter,sans-serif" font-size="10" fill="#777">${escapeXml(truncate(artistText, 16))}</text>
    <rect x="246" y="10" width="224" height="86" rx="8" fill="#f9f9f9" stroke="#eee" stroke-width="1"/>
    <text x="258" y="32" font-family="Inter,sans-serif" font-size="8" font-weight="700" fill="#999">PROJECT</text>
    ${showProject && userData.project ? `<text x="258" y="56" font-family="Inter,sans-serif" font-size="13" font-weight="700" fill="#111">${escapeXml(truncate(userData.project, 16))}</text>` : `<text x="258" y="56" font-family="Inter,sans-serif" font-size="11" fill="#bbb">not set</text>`}
    <rect x="10" y="104" width="228" height="86" rx="8" fill="#f9f9f9" stroke="#eee" stroke-width="1"/>
    <text x="22" y="126" font-family="Inter,sans-serif" font-size="8" font-weight="700" fill="#999">VIBE</text>
    ${showVibe && userData.vibe ? `<text x="22" y="150" font-family="Inter,sans-serif" font-size="13" font-weight="700" fill="#111">${escapeXml(truncate(userData.vibe, 18))}</text>` : `<text x="22" y="150" font-family="Inter,sans-serif" font-size="11" fill="#bbb">not set</text>`}
    <rect x="246" y="104" width="224" height="86" rx="8" fill="${userData.openToWork ? "#dcfce7" : "#fee2e2"}" stroke="${userData.openToWork ? "#bbf7d0" : "#fecaca"}" stroke-width="1"/>
    <text x="358" y="152" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="${userData.openToWork ? "#166534" : "#991b1b"}">${userData.openToWork ? "OPEN TO WORK" : "NOT AVAILABLE"}</text>
  </svg>`;
  }

  // ─── LAYOUT: minimal ─────────────────────────────────────────────────────────
  else if (layout === "minimal") {
    const W = 480;
    let currentLineY = 28;
    const lines: string[] = [];
    lines.push(`<text x="20" y="${currentLineY}" font-family="Inter,sans-serif" font-size="8" fill="#aaa" letter-spacing="1">NOW PLAYING</text>`);
    currentLineY += 26;
    lines.push(`<text x="20" y="${currentLineY}" font-family="Inter,sans-serif" font-size="16" font-weight="700" fill="#111">${escapeXml(truncate(titleText, 38))}</text>`);
    currentLineY += 20;
    lines.push(`<text x="20" y="${currentLineY}" font-family="Inter,sans-serif" font-size="12" fill="#777">${escapeXml(artistText)}</text>`);
    currentLineY += 22;
    if (showProject && userData.project) {
      lines.push(`<text x="20" y="${currentLineY}" font-family="Inter,sans-serif" font-size="11" fill="#888">Project: <tspan fill="#444" font-weight="500">${escapeXml(truncate(userData.project, 36))}</tspan></text>`);
      currentLineY += 18;
    }
    if (showVibe && userData.vibe) {
      lines.push(`<text x="20" y="${currentLineY}" font-family="Inter,sans-serif" font-size="11" fill="#888">Vibe: <tspan fill="#444" font-weight="500">${escapeXml(truncate(userData.vibe, 40))}</tspan></text>`);
      currentLineY += 18;
    }
    if (showOpenToWork) {
      lines.push(`<text x="20" y="${currentLineY}" font-family="Inter,sans-serif" font-size="10" font-weight="700" fill="${accentColor}">OPEN TO WORK: ${badgeLabel}</text>`);
      currentLineY += 18;
    }
    if (hasAnyWidget && stats) {
      lines.push(buildWidgetPills(20, currentLineY, accentColor, "#888"));
      currentLineY += 28;
    }
    const H = currentLineY + 16;
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" rx="8" fill="#f8f8f8" stroke="#ddd" stroke-width="1"/>
    ${lines.join("\n")}
  </svg>`;
  }

  // ─── LAYOUT: gradient ────────────────────────────────────────────────────────
  else if (layout === "gradient") {
    const W = 480; const H = 180;
    svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ec4899"/>
        <stop offset="50%" stop-color="#f97316"/>
        <stop offset="100%" stop-color="#3b82f6"/>
      </linearGradient>
      <clipPath id="ac"><rect x="24" y="44" width="52" height="52" rx="8"/></clipPath>
    </defs>
    <rect width="${W}" height="${H}" rx="14" fill="url(#grad)"/>
    <rect x="3" y="3" width="${W-6}" height="${H-6}" rx="12" fill="#ffffff"/>
    <text x="${W/2}" y="28" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#999" letter-spacing="1">NOW PLAYING</text>
    ${albumImageData ? `<image href="${albumImageData}" x="24" y="44" width="52" height="52" clip-path="url(#ac)" preserveAspectRatio="xMidYMid slice"/>` : showAlbumArt ? `<rect x="24" y="44" width="52" height="52" rx="8" fill="#f0e8f8"/>` : ""}
    <text x="86" y="62" font-family="Inter,sans-serif" font-size="16" font-weight="700" fill="#111">${escapeXml(truncate(titleText, 22))}</text>
    <text x="86" y="80" font-family="Inter,sans-serif" font-size="11" fill="#777">${escapeXml(truncate(artistText, 26))}</text>
    ${showProject && userData.project ? `<rect x="20" y="108" width="214" height="26" rx="13" fill="#f3f4f6"/><text x="127" y="125" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="#333">P: ${escapeXml(truncate(userData.project, 20))}</text>` : ""}
    ${showVibe && userData.vibe ? `<rect x="246" y="108" width="214" height="26" rx="13" fill="#f3f4f6"/><text x="353" y="125" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="#333">V: ${escapeXml(truncate(userData.vibe, 20))}</text>` : ""}
    ${showOpenToWork ? `<rect x="160" y="144" width="160" height="24" rx="12" fill="#dcfce7"/><text x="${W/2}" y="160" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="#166534">OPEN TO WORK: ${badgeLabel}</text>` : ""}
  </svg>`;
  }

  // ─── FALLBACK ────────────────────────────────────────────────────────────────
  else {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="60" viewBox="0 0 480 60">
    <rect width="480" height="60" rx="12" fill="#1c1c1e"/>
    <text x="20" y="36" font-family="sans-serif" font-size="14" fill="#8e8e93">Unknown layout: ${escapeXml(layout)}</text>
  </svg>`;
  }

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
