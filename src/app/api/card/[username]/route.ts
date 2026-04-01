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
  const users = await clerk.users.getUserList({ limit: 500 });
  return (
    users.data.find(
      (u) =>
        (u.unsafeMetadata as any)?.lastfmUsername?.toLowerCase() ===
        lastfmUsername.toLowerCase()
    ) || null
  );
}

async function getNowPlaying(lastfmUsername: string): Promise<Song> {
  const res = await fetch(
    `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfmUsername}&api_key=${LASTFM_API_KEY}&format=json&limit=1`
  );

  if (!res.ok)
    return { title: "Last.fm unavailable", artist: "", albumImage: null, isPlaying: false };

  const data = await res.json();
  if (data.error)
    return { title: "Nothing playing", artist: "", albumImage: null, isPlaying: false };

  const track = data.recenttracks?.track?.[0];
  if (!track)
    return { title: "Nothing playing", artist: "", albumImage: null, isPlaying: false };

  const isPlaying = track["@attr"]?.nowplaying === "true";
  const title = track.name;
  const artist = track.artist["#text"];
  const albumImage =
    track.image?.find((img: any) => img.size === "large")?.["#text"] || null;

  if (!isPlaying) {
    const playedAt = new Date(parseInt(track.date?.uts || "0") * 1000);
    const diffMins = Math.floor((Date.now() - playedAt.getTime()) / 60000);
    const timeLabel =
      diffMins < 60
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
      fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${lastfmUsername}&api_key=${LASTFM_API_KEY}&format=json`
      ),
      fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${lastfmUsername}&api_key=${LASTFM_API_KEY}&format=json&limit=1&period=1month`
      ),
    ]);

    if (!userRes.ok || !topRes.ok) return null;

    const userData = await userRes.json();
    const topData = await topRes.json();

    if (userData.error) return null;

    const scrobbles = parseInt(userData.user?.playcount || "0").toLocaleString();
    const registeredYear = new Date(
      parseInt(userData.user?.registered?.unixtime || "0") * 1000
    )
      .getFullYear()
      .toString();
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
  const accent = searchParams.get("accent") || "green";
  const hide = searchParams.get("hide") || "";
  const widgets = searchParams.get("widgets") || "";
  const layout = searchParams.get("layout") || "default";

  const hideModules = hide.split(",").map((s) => s.trim()).filter(Boolean);
  const activeWidgets = widgets.split(",").map((s) => s.trim()).filter(Boolean);

  const showAlbumArt = !hideModules.includes("albumart");
  const showVibe = !hideModules.includes("vibe");
  const showProject = !hideModules.includes("project");
  const showOpenToWork = !hideModules.includes("opentowork");

  const showScrobbles = activeWidgets.includes("scrobbles");
  const showTopArtist = activeWidgets.includes("topartist");
  const showSince = activeWidgets.includes("since");
  const hasAnyWidget = showScrobbles || showTopArtist || showSince;

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

  const [song, stats] = await Promise.all([
    getNowPlaying(lastfmUsername).catch(
      () => ({ title: "Unavailable", artist: "", albumImage: null, isPlaying: false } as Song)
    ),
    hasAnyWidget
      ? getLastfmStats(lastfmUsername).catch(() => null)
      : Promise.resolve(null),
  ]);

  const userData = {
    project: String(meta.project || ""),
    vibe: String(meta.vibe || ""),
    openToWork: Boolean(meta.openToWork ?? false),
  };

  const accents: Record<string, string> = {
    green: "#22c55e",
    purple: "#a855f7",
    blue: "#3b82f6",
    orange: "#f97316",
  };
  const accentColor = accents[accent] ?? accents.green;

  const songTitle = song.isPlaying
    ? truncate(song.title, 38)
    : song.lastPlayed
      ? truncate(song.title, 38)
      : "Nothing playing";
  const artistText = truncate(song.artist, 44);
  const nowPlayingLabel = song.isPlaying ? "NOW PLAYING" : song.lastPlayed ? `LAST PLAYED · ${song.lastPlayed}` : "NOTHING PLAYING";

  const badgeColor = userData.openToWork ? accentColor : "#ef4444";
  const badgeLabel = userData.openToWork ? "YES" : "NO";

  let albumImageData = "";
  if (showAlbumArt && song.albumImage) {
    albumImageData = await imageToBase64(song.albumImage);
  }

  // ── Widget pills (shared across layouts) ──────────────────────────────────
  function buildWidgetPills(
    startX: number,
    y: number,
    accent: string,
    subtext: string
  ): string {
    if (!hasAnyWidget || !stats) return "";
    const pills: string[] = [];
    let px = startX;
    const pH = 20;
    const pad = 10;
    const fs = 10;

    if (showScrobbles && stats.scrobbles) {
      const label = `♪ ${stats.scrobbles}`;
      const pw = label.length * 6.5 + pad * 2;
      pills.push(`
        <rect x="${px}" y="${y}" width="${pw}" height="${pH}" rx="${pH / 2}" fill="${accent}22" stroke="${accent}44" stroke-width="0.8"/>
        <text x="${px + pw / 2}" y="${y + 13}" text-anchor="middle" font-family="Inter,sans-serif" font-size="${fs}" fill="${accent}">${escapeXml(label)}</text>
      `);
      px += pw + 8;
    }
    if (showTopArtist && stats.topArtist) {
      const label = `↑ ${truncate(stats.topArtist, 18)}`;
      const pw = label.length * 6 + pad * 2;
      pills.push(`
        <rect x="${px}" y="${y}" width="${pw}" height="${pH}" rx="${pH / 2}" fill="${subtext}22" stroke="${subtext}33" stroke-width="0.8"/>
        <text x="${px + pw / 2}" y="${y + 13}" text-anchor="middle" font-family="Inter,sans-serif" font-size="${fs}" fill="${subtext}">${escapeXml(label)}</text>
      `);
      px += pw + 8;
    }
    if (showSince && stats.registeredYear) {
      const label = `since ${stats.registeredYear}`;
      const pw = label.length * 6 + pad * 2;
      pills.push(`
        <rect x="${px}" y="${y}" width="${pw}" height="${pH}" rx="${pH / 2}" fill="${subtext}22" stroke="${subtext}33" stroke-width="0.8"/>
        <text x="${px + pw / 2}" y="${y + 13}" text-anchor="middle" font-family="Inter,sans-serif" font-size="${fs}" fill="${subtext}">${escapeXml(label)}</text>
      `);
    }
    return pills.join("");
  }

  let svg = "";

  // ─── DEFAULT ── dark minimal, album top-right, left-aligned text ──────────
  if (layout === "default") {
    const W = 380;
    const H = 200;
    const albumX = 292;
    const albumY = 16;
    const albumSize = 72;

    // dynamic height if widgets present
    const totalH = hasAnyWidget && stats ? H + 28 : H;

    const widgetY = H - 12;

    svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${totalH}" viewBox="0 0 ${W} ${totalH}">
  <defs>
    <clipPath id="ac">
      <rect x="${albumX}" y="${albumY}" width="${albumSize}" height="${albumSize}" rx="10"/>
    </clipPath>
  </defs>

  <!-- Card bg -->
  <rect width="${W}" height="${totalH}" rx="14" fill="#111111" stroke="#222222" stroke-width="1"/>

  <!-- Now playing indicator -->
  <circle cx="20" cy="28" r="4" fill="${accentColor}"/>
  <text x="30" y="33" font-family="Inter,sans-serif" font-size="9" fill="${accentColor}" letter-spacing="2">${escapeXml(nowPlayingLabel)}</text>

  <!-- Album art -->
  <rect x="${albumX}" y="${albumY}" width="${albumSize}" height="${albumSize}" rx="10" fill="#222"/>
  ${albumImageData
        ? `<image href="${albumImageData}" x="${albumX}" y="${albumY}" width="${albumSize}" height="${albumSize}" clip-path="url(#ac)" preserveAspectRatio="xMidYMid slice"/>`
        : showAlbumArt
          ? `<text x="${albumX + albumSize / 2}" y="${albumY + albumSize / 2 + 8}" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#333">♪</text>`
          : ""
      }

  <!-- Song info -->
  <text x="20" y="68" font-family="Inter,sans-serif" font-size="18" font-weight="700" fill="#ffffff">${escapeXml(truncate(songTitle, 22))}</text>
  <text x="20" y="88" font-family="Inter,sans-serif" font-size="12" fill="#888888">${escapeXml(truncate(artistText, 28))}</text>

  <!-- Divider -->
  <line x1="20" y1="104" x2="280" y2="104" stroke="#222222" stroke-width="1"/>

  <!-- Project & Vibe -->
  ${showProject && userData.project ? `<text x="20" y="122" font-family="Inter,sans-serif" font-size="11" fill="#888888">Project: <tspan fill="#ffffff">${escapeXml(truncate(userData.project, 26))}</tspan></text>` : ""}
  ${showVibe && userData.vibe ? `<text x="20" y="140" font-family="Inter,sans-serif" font-size="11" fill="#888888">Vibe: <tspan fill="#ffffff">${escapeXml(truncate(userData.vibe, 30))}</tspan></text>` : ""}

  <!-- Open to work badge -->
  ${showOpenToWork
        ? `<rect x="20" y="158" width="170" height="24" rx="12" fill="none" stroke="${badgeColor}" stroke-width="1.5"/>
         <text x="105" y="174" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="700" fill="${badgeColor}">✓  OPEN TO WORK: ${badgeLabel}</text>`
        : ""
      }

  <!-- Last.fm widget pills -->
  ${buildWidgetPills(20, widgetY, accentColor, "#888888")}
</svg>`;
  }

  // ─── SOFT ── light bg, large left album, right-side text ─────────────────
  else if (layout === "soft") {
    const W = 380;
    const H = hasAnyWidget && stats ? 188 : 160;

    svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <clipPath id="ac">
      <rect x="14" y="35" width="90" height="90" rx="12"/>
    </clipPath>
  </defs>

  <rect width="${W}" height="${H}" rx="16" fill="#fafafa" stroke="#e5e5e5" stroke-width="1"/>

  <!-- Now playing label -->
  <text x="116" y="46" font-family="Inter,sans-serif" font-size="8" fill="#999" letter-spacing="1.5">NOW PLAYING</text>

  <!-- Album art -->
  <rect x="14" y="35" width="90" height="90" rx="12" fill="#f0f0f0"/>
  ${albumImageData
        ? `<image href="${albumImageData}" x="14" y="35" width="90" height="90" clip-path="url(#ac)" preserveAspectRatio="xMidYMid slice"/>`
        : showAlbumArt
          ? `<text x="59" y="85" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#ccc">♪</text>`
          : ""
      }

  <!-- Song info -->
  <text x="116" y="66" font-family="Inter,sans-serif" font-size="16" font-weight="700" fill="#111">${escapeXml(truncate(songTitle, 20))}</text>
  <text x="116" y="84" font-family="Inter,sans-serif" font-size="12" fill="#666">${escapeXml(truncate(artistText, 24))}</text>

  <!-- Project & Vibe -->
  ${showProject && userData.project ? `<text x="116" y="104" font-family="Inter,sans-serif" font-size="11" fill="#999">Project: <tspan fill="#333">${escapeXml(truncate(userData.project, 22))}</tspan></text>` : ""}
  ${showVibe && userData.vibe ? `<text x="116" y="120" font-family="Inter,sans-serif" font-size="11" fill="#999">Vibe: <tspan fill="#333">${escapeXml(truncate(userData.vibe, 26))}</tspan></text>` : ""}

  <!-- Available badge -->
  ${showOpenToWork
        ? `<rect x="280" y="128" width="84" height="20" rx="10" fill="none" stroke="${badgeColor}" stroke-width="1"/>
         <text x="322" y="142" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="${badgeColor}">AVAILABLE</text>`
        : ""
      }

  <!-- Widget pills -->
  ${buildWidgetPills(116, 140, accentColor, "#999")}
</svg>`;
  }

  // ─── COMPACT ── slim strip, small album left, text middle, badge right ────
  else if (layout === "compact") {
    const W = 380;
    const H = 80;

    svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <clipPath id="ac">
      <rect x="12" y="12" width="56" height="56" rx="8"/>
    </clipPath>
  </defs>

  <rect width="${W}" height="${H}" rx="10" fill="#ffffff" stroke="#e0e0e0" stroke-width="1"/>

  <!-- Album art -->
  <rect x="12" y="12" width="56" height="56" rx="8" fill="#f5f5f5"/>
  ${albumImageData
        ? `<image href="${albumImageData}" x="12" y="12" width="56" height="56" clip-path="url(#ac)" preserveAspectRatio="xMidYMid slice"/>`
        : showAlbumArt
          ? `<text x="40" y="46" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#ccc">♪</text>`
          : ""
      }

  <!-- Labels -->
  <text x="78" y="28" font-family="Inter,sans-serif" font-size="8" fill="#999">NOW PLAYING</text>
  <text x="78" y="46" font-family="Inter,sans-serif" font-size="13" font-weight="700" fill="#111">${escapeXml(truncate(songTitle, 18))}</text>
  <text x="78" y="62" font-family="Inter,sans-serif" font-size="11" fill="#777">${escapeXml(truncate(artistText, 20))}</text>

  <!-- Project & Vibe -->
  ${showProject && userData.project ? `<text x="220" y="38" font-family="Inter,sans-serif" font-size="10" fill="#777">P: <tspan fill="#333">${escapeXml(truncate(userData.project, 14))}</tspan></text>` : ""}
  ${showVibe && userData.vibe ? `<text x="220" y="54" font-family="Inter,sans-serif" font-size="10" fill="#777">V: <tspan fill="#333">${escapeXml(truncate(userData.vibe, 14))}</tspan></text>` : ""}

  <!-- Open badge -->
  ${showOpenToWork
        ? `<circle cx="348" cy="40" r="3" fill="${badgeColor}"/>
         <text x="356" y="44" font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="${badgeColor}">OPEN</text>`
        : ""
      }
</svg>`;
  }

  // ─── HERO ── dark, centered circle album, centered text, solid badge ──────
  else if (layout === "hero") {
    const W = 380;
    const H = hasAnyWidget && stats ? 270 : 240;

    svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <clipPath id="ac">
      <circle cx="190" cy="52" r="32"/>
    </clipPath>
  </defs>

  <rect width="${W}" height="${H}" rx="16" fill="#0d0d0d"/>

  <!-- Album art -->
  <circle cx="190" cy="52" r="32" fill="#222"/>
  ${albumImageData
        ? `<image href="${albumImageData}" x="158" y="20" width="64" height="64" clip-path="url(#ac)" preserveAspectRatio="xMidYMid slice"/>`
        : showAlbumArt
          ? `<text x="190" y="60" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#444">♪</text>`
          : ""
      }

  <!-- Song info -->
  <text x="190" y="106" text-anchor="middle" font-family="Inter,sans-serif" font-size="20" font-weight="700" fill="#ffffff">${escapeXml(truncate(songTitle, 26))}</text>
  <text x="190" y="126" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" fill="#888888">${escapeXml(truncate(artistText, 32))}</text>

  <!-- Project & Vibe -->
  ${showProject && userData.project ? `<text x="190" y="152" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" fill="#666">Project: <tspan fill="#aaa">${escapeXml(truncate(userData.project, 28))}</tspan></text>` : ""}
  ${showVibe && userData.vibe ? `<text x="190" y="170" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" fill="#666">Vibe: <tspan fill="#aaa">${escapeXml(truncate(userData.vibe, 30))}</tspan></text>` : ""}

  <!-- Open to work badge -->
  ${showOpenToWork
        ? `<rect x="115" y="192" width="150" height="28" rx="14" fill="${badgeColor}"/>
         <text x="190" y="210" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="700" fill="#000">OPEN TO WORK: ${badgeLabel}</text>`
        : ""
      }

  <!-- Widget pills -->
  ${buildWidgetPills(20, 234, accentColor, "#666")}
</svg>`;
  }

  // ─── GRID ── white, 2×2 tile layout ──────────────────────────────────────
  else if (layout === "grid") {
    const W = 380;
    const H = 200;

    svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <clipPath id="ac">
      <rect x="22" y="24" width="32" height="32" rx="4"/>
    </clipPath>
  </defs>

  <rect width="${W}" height="${H}" rx="12" fill="#ffffff" stroke="#eeeeee" stroke-width="1"/>

  <!-- Top-left: Now Playing tile -->
  <rect x="10" y="10" width="176" height="86" rx="8" fill="#f9f9f9" stroke="#eee" stroke-width="1"/>
  <rect x="22" y="24" width="32" height="32" rx="4" fill="#eee"/>
  ${albumImageData
        ? `<image href="${albumImageData}" x="22" y="24" width="32" height="32" clip-path="url(#ac)" preserveAspectRatio="xMidYMid slice"/>`
        : showAlbumArt
          ? `<text x="38" y="46" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#bbb">♪</text>`
          : ""
      }
  <text x="62" y="36" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="#111">${escapeXml(truncate(songTitle, 12))}</text>
  <text x="62" y="52" font-family="Inter,sans-serif" font-size="10" fill="#777">${escapeXml(truncate(artistText, 14))}</text>

  <!-- Top-right: Project tile -->
  <rect x="194" y="10" width="176" height="86" rx="8" fill="#f9f9f9" stroke="#eee" stroke-width="1"/>
  <text x="206" y="32" font-family="Inter,sans-serif" font-size="8" font-weight="700" fill="#999">PROJECT</text>
  ${showProject && userData.project
        ? `<text x="206" y="54" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="#111">${escapeXml(truncate(userData.project, 14))}</text>`
        : `<text x="206" y="54" font-family="Inter,sans-serif" font-size="11" fill="#bbb">not set</text>`
      }

  <!-- Bottom-left: Vibe tile -->
  <rect x="10" y="104" width="176" height="86" rx="8" fill="#f9f9f9" stroke="#eee" stroke-width="1"/>
  <text x="22" y="126" font-family="Inter,sans-serif" font-size="8" font-weight="700" fill="#999">VIBE</text>
  ${showVibe && userData.vibe
        ? `<text x="22" y="148" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="#111">${escapeXml(truncate(userData.vibe, 18))}</text>`
        : `<text x="22" y="148" font-family="Inter,sans-serif" font-size="11" fill="#bbb">not set</text>`
      }

  <!-- Bottom-right: Open to work tile -->
  ${showOpenToWork
        ? `<rect x="194" y="104" width="176" height="86" rx="8" fill="${userData.openToWork ? "#dcfce7" : "#fee2e2"}" stroke="${userData.openToWork ? "#bbf7d0" : "#fecaca"}" stroke-width="1"/>
         <text x="282" y="152" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="${userData.openToWork ? "#166534" : "#991b1b"}">${userData.openToWork ? "OPEN TO WORK" : "NOT AVAILABLE"}</text>`
        : `<rect x="194" y="104" width="176" height="86" rx="8" fill="#f9f9f9" stroke="#eee" stroke-width="1"/>
         <text x="282" y="126" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" font-weight="700" fill="#999">LAST.FM</text>
         ${buildWidgetPills(206, 140, accentColor, "#999")}`
      }

  <!-- Widget pills (below grid if open-to-work is shown) -->
  ${showOpenToWork ? buildWidgetPills(10, 198, accentColor, "#999") : ""}
</svg>`;
  }

  // ─── MINIMAL ── light, no album art, pure text layout ────────────────────
  else if (layout === "minimal") {
    const W = 380;
    let y = 28;
    const lines: string[] = [];

    lines.push(`<text x="20" y="${y}" font-family="Inter,sans-serif" font-size="8" fill="#aaaaaa" letter-spacing="1">NOW PLAYING</text>`);
    y += 28;

    // Album art thumbnail (small, left-aligned)
    if (showAlbumArt && albumImageData) {
      lines.push(`
        <defs><clipPath id="ac"><rect x="20" y="${y}" width="40" height="40" rx="8"/></clipPath></defs>
        <rect x="20" y="${y}" width="40" height="40" rx="8" fill="#eee"/>
        <image href="${albumImageData}" x="20" y="${y}" width="40" height="40" clip-path="url(#ac)" preserveAspectRatio="xMidYMid slice"/>
      `);
      lines.push(`<text x="70" y="${y + 15}" font-family="Inter,sans-serif" font-size="15" font-weight="700" fill="#111111">${escapeXml(truncate(songTitle, 28))}</text>`);
      lines.push(`<text x="70" y="${y + 32}" font-family="Inter,sans-serif" font-size="11" fill="#777">${escapeXml(truncate(artistText, 32))}</text>`);
      y += 52;
    } else {
      lines.push(`<text x="20" y="${y}" font-family="Inter,sans-serif" font-size="15" font-weight="700" fill="#111111">${escapeXml(truncate(songTitle, 38))}</text>`);
      y += 20;
      lines.push(`<text x="20" y="${y}" font-family="Inter,sans-serif" font-size="11" fill="#777">${escapeXml(truncate(artistText, 44))}</text>`);
      y += 22;
    }

    if (showProject && userData.project) {
      lines.push(`<text x="20" y="${y}" font-family="Inter,sans-serif" font-size="11" fill="#888888">Project: <tspan fill="#444444" font-weight="500">${escapeXml(truncate(userData.project, 36))}</tspan></text>`);
      y += 18;
    }
    if (showVibe && userData.vibe) {
      lines.push(`<text x="20" y="${y}" font-family="Inter,sans-serif" font-size="11" fill="#888888">Vibe: <tspan fill="#444444" font-weight="500">${escapeXml(truncate(userData.vibe, 40))}</tspan></text>`);
      y += 18;
    }
    if (showOpenToWork) {
      lines.push(`<text x="20" y="${y}" font-family="Inter,sans-serif" font-size="10" font-weight="700" fill="${badgeColor}">✓ OPEN TO WORK: ${badgeLabel}</text>`);
      y += 18;
    }
    if (hasAnyWidget && stats) {
      lines.push(buildWidgetPills(20, y, accentColor, "#888"));
      y += 28;
    }

    const H = y + 16;

    svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" rx="8" fill="#f8f8f8" stroke="#dddddd" stroke-width="1"/>
  ${lines.join("\n")}
</svg>`;
  }

  // ─── GRADIENT ── white card, gradient border, pill rows ──────────────────
  else if (layout === "gradient") {
    const W = 380;
    const H = hasAnyWidget && stats ? 210 : 180;

    svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ec4899"/>
      <stop offset="50%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
    <clipPath id="ac">
      <rect x="24" y="44" width="48" height="48" rx="8"/>
    </clipPath>
  </defs>

  <!-- Gradient border -->
  <rect width="${W}" height="${H}" rx="14" fill="url(#grad)"/>
  <rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="12" fill="#ffffff"/>

  <!-- Now playing label -->
  <text x="${W / 2}" y="32" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" fill="#999" letter-spacing="1">NOW PLAYING</text>

  <!-- Album art -->
  <rect x="24" y="44" width="48" height="48" rx="8" fill="#f5f5f5"/>
  ${albumImageData
        ? `<image href="${albumImageData}" x="24" y="44" width="48" height="48" clip-path="url(#ac)" preserveAspectRatio="xMidYMid slice"/>`
        : showAlbumArt
          ? `<text x="48" y="72" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#ccc">♪</text>`
          : ""
      }

  <!-- Song info -->
  <text x="82" y="60" font-family="Inter,sans-serif" font-size="16" font-weight="700" fill="#111">${escapeXml(truncate(songTitle, 22))}</text>
  <text x="82" y="78" font-family="Inter,sans-serif" font-size="11" fill="#777">${escapeXml(truncate(artistText, 26))}</text>

  <!-- Project & Vibe pills -->
  ${showProject && userData.project ? `<rect x="20" y="108" width="164" height="28" rx="14" fill="#f3f4f6"/><text x="102" y="126" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="#333">P: ${escapeXml(truncate(userData.project, 20))}</text>` : ""}
  ${showVibe && userData.vibe ? `<rect x="196" y="108" width="164" height="28" rx="14" fill="#f3f4f6"/><text x="278" y="126" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="#333">V: ${escapeXml(truncate(userData.vibe, 20))}</text>` : ""}

  <!-- Open to work badge -->
  ${showOpenToWork
        ? `<rect x="110" y="148" width="160" height="24" rx="12" fill="#dcfce7"/>
         <text x="${W / 2}" y="164" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="#166534">OPEN TO WORK: ${badgeLabel}</text>`
        : ""
      }

  <!-- Widget pills -->
  ${buildWidgetPills(20, 180, accentColor, "#999")}
</svg>`;
  }

  // ─── FALLBACK ─────────────────────────────────────────────────────────────
  else {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="60" viewBox="0 0 380 60">
  <rect width="380" height="60" rx="12" fill="#1c1c1e"/>
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