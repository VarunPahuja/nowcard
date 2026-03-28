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
  try {
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
    const artist = typeof track.artist === 'string' ? track.artist : track.artist["#text"];
    const albumImage = track.image?.find((img: any) => img.size === "extralarge")?.["#text"] || 
                       track.image?.find((img: any) => img.size === "large")?.["#text"] || null;

    if (!isPlaying) {
      const playedAt = new Date(parseInt(track.date?.uts || "0") * 1000);
      const diffMins = Math.floor((Date.now() - playedAt.getTime()) / 60000);
      let timeStr = "";
      if (diffMins < 1) timeStr = "just now";
      else if (diffMins < 60) timeStr = `${diffMins}m ago`;
      else if (diffMins < 1440) timeStr = `${Math.floor(diffMins / 60)}h ago`;
      else timeStr = `${Math.floor(diffMins / 1440)}d ago`;

      return { title, artist, albumImage, isPlaying: false, lastPlayed: timeStr };
    }

    return { title, artist, albumImage, isPlaying: true };
  } catch (err) {
    console.error("Last.fm fetch error:", err);
    return { title: "Error fetching track", artist: "", albumImage: null, isPlaying: false };
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
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(str: string, max: number): string {
  if (!str) return "";
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

const GITHUB_ICON = `M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12`;

// Layout implementers
const layouts: Record<string, (data: any) => string> = {
  default: ({ song, userData, accent, hide, albumData }) => {
    const width = 480;
    const height = 200;
    const hideModules = hide.split(",");
    
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <clipPath id="albumClip">
          <rect x="360" y="40" width="80" height="80" rx="8" />
        </clipPath>
        <style>
          .title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: bold; fill: #ffffff; }
          .artist { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; fill: #888888; }
          .label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: #888888; }
          .value { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: #ffffff; }
          .status { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; font-weight: bold; letter-spacing: 2px; }
          .badge { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; font-weight: bold; fill: ${accent}; }
        </style>
      </defs>
      <rect width="${width}" height="${height}" rx="14" fill="#111111" stroke="#222" stroke-width="1" />
      
      <circle cx="24" cy="24" r="3" fill="${accent}" />
      <text x="36" y="27" class="status" fill="${accent}">${song.isPlaying ? 'NOW PLAYING' : 'RECENTLY PLAYED'}</text>
      
      <text x="24" y="70" class="title">${escapeXml(truncate(song.title, 28))}</text>
      <text x="24" y="90" class="artist">${escapeXml(truncate(song.artist, 40))}</text>
      
      <line x1="24" y1="110" x2="${width - 24}" y2="110" stroke="#222" stroke-width="1" />
      
      ${!hideModules.includes('project') ? `
        <text x="24" y="130" class="label">Project: <tspan class="value">${escapeXml(truncate(userData.project, 30))}</tspan></text>
      ` : ''}
      
      ${!hideModules.includes('vibe') ? `
        <text x="24" y="148" class="label">Vibe: <tspan class="value">${escapeXml(truncate(userData.vibe, 30))}</tspan></text>
      ` : ''}
      
      ${!hideModules.includes('openToWork') && userData.openToWork ? `
        <rect x="${width - 160}" y="${height - 40}" width="136" height="24" rx="12" fill="none" stroke="${accent}" stroke-width="1" />
        <text x="${width - 150}" y="${height - 24}" class="badge">OPEN TO WORK: YES</text>
      ` : ''}
      
      ${!hideModules.includes('albumArt') && albumData ? `
        <image href="${albumData}" x="360" y="40" width="80" height="80" clip-path="url(#albumClip)" preserveAspectRatio="xMidYMid slice" />
      ` : !hideModules.includes('albumArt') ? `
        <rect x="360" y="40" width="80" height="80" rx="8" fill="#222" />
        <text x="400" y="85" text-anchor="middle" font-size="24" fill="#444">♪</text>
      ` : ''}
    </svg>`;
  },
  
  soft: ({ song, userData, accent, hide, albumData }) => {
    const width = 480;
    const height = 160;
    const hideModules = hide.split(",");
    
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <clipPath id="albumClip">
          <rect x="16" y="30" width="100" height="100" rx="12" />
        </clipPath>
      </defs>
      <rect width="${width}" height="${height}" rx="16" fill="#fafafa" stroke="#e5e5e5" stroke-width="1" />
      
      ${!hideModules.includes('albumArt') && albumData ? `
        <image href="${albumData}" x="16" y="30" width="100" height="100" clip-path="url(#albumClip)" preserveAspectRatio="xMidYMid slice" />
      ` : `<rect x="16" y="30" width="100" height="100" rx="12" fill="#f0f0f0" />`}
      
      <g transform="translate(132, 0)">
        <text x="0" y="40" font-family="sans-serif" font-size="9" fill="#999" letter-spacing="1.5">${song.isPlaying ? 'NOW PLAYING' : 'WAS LISTENING TO'}</text>
        <text x="0" y="62" font-family="sans-serif" font-size="18" font-weight="bold" fill="#111">${escapeXml(truncate(song.title, 30))}</text>
        <text x="0" y="80" font-family="sans-serif" font-size="13" fill="#666">${escapeXml(truncate(song.artist, 40))}</text>
        
        ${!hideModules.includes('project') ? `
          <text x="0" y="100" font-family="sans-serif" font-size="12" fill="#999">Project: <tspan fill="#333">${escapeXml(truncate(userData.project, 30))}</tspan></text>
        ` : ''}
        
        ${!hideModules.includes('vibe') ? `
          <text x="0" y="116" font-family="sans-serif" font-size="12" fill="#999">Vibe: <tspan fill="#333">${escapeXml(truncate(userData.vibe, 30))}</tspan></text>
        ` : ''}
      </g>
      
      ${!hideModules.includes('openToWork') && userData.openToWork ? `
        <rect x="${width - 100}" y="${height - 36}" width="84" height="20" rx="10" fill="none" stroke="${accent}" stroke-width="1" />
        <text x="${width - 58}" y="${height - 22}" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="bold" fill="${accent}">AVAILABLE</text>
      ` : ''}
    </svg>`;
  },
  
  compact: ({ song, userData, accent, hide, albumData }) => {
    const width = 480;
    const height = 80;
    const hideModules = hide.split(",");
    
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <clipPath id="albumClip">
          <rect x="12" y="12" width="56" height="56" rx="6" />
        </clipPath>
      </defs>
      <rect width="${width}" height="${height}" rx="10" fill="#ffffff" stroke="#e0e0e0" stroke-width="1" />
      
      ${!hideModules.includes('albumArt') && albumData ? `
        <image href="${albumData}" x="12" y="12" width="56" height="56" clip-path="url(#albumClip)" preserveAspectRatio="xMidYMid slice" />
      ` : !hideModules.includes('albumArt') ? `<rect x="12" y="12" width="56" height="56" rx="6" fill="#f5f5f5" />` : ''}
      
      <g transform="translate(${hideModules.includes('albumArt') ? 16 : 80}, 0)">
        <text x="0" y="28" font-family="sans-serif" font-size="9" fill="#999">NOW PLAYING</text>
        <text x="0" y="46" font-family="sans-serif" font-size="14" font-weight="bold" fill="#111">${escapeXml(truncate(song.title, 32))}</text>
        <text x="0" y="62" font-family="sans-serif" font-size="12" fill="#777">${escapeXml(truncate(song.artist, 40))}</text>
      </g>
      
      <g transform="translate(320, 0)">
        ${!hideModules.includes('project') ? `
          <text x="0" y="40" font-family="sans-serif" font-size="11" fill="#777">P: <tspan fill="#333">${escapeXml(truncate(userData.project, 15))}</tspan></text>
        ` : ''}
        ${!hideModules.includes('vibe') ? `
          <text x="0" y="56" font-family="sans-serif" font-size="11" fill="#777">V: <tspan fill="#333">${escapeXml(truncate(userData.vibe, 15))}</tspan></text>
        ` : ''}
      </g>
      
      ${!hideModules.includes('openToWork') && userData.openToWork ? `
        <circle cx="${width - 86}" cy="40" r="3" fill="#22c55e" />
        <text x="${width - 76}" y="44" font-family="sans-serif" font-size="10" font-weight="bold" fill="#22c55e">AVAILABLE</text>
      ` : ''}
    </svg>`;
  },
  
  hero: ({ song, userData, accent, hide, albumData }) => {
    const width = 480;
    const height = 240;
    const hideModules = hide.split(",");
    
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <clipPath id="albumClip">
          <circle cx="${width / 2}" cy="56" r="36" />
        </clipPath>
      </defs>
      <rect width="${width}" height="${height}" rx="16" fill="#0d0d0d" />
      
      ${!hideModules.includes('albumArt') && albumData ? `
        <image href="${albumData}" x="${width / 2 - 36}" y="20" width="72" height="72" clip-path="url(#albumClip)" preserveAspectRatio="xMidYMid slice" />
      ` : !hideModules.includes('albumArt') ? `
        <circle cx="${width / 2}" cy="56" r="36" fill="#1a1a1a" stroke="#333" stroke-width="1" />
        <text x="${width / 2}" y="66" text-anchor="middle" font-size="28" fill="#444">♪</text>
      ` : ''}
      
      <text x="${width / 2}" y="115" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="bold" fill="#ffffff">${escapeXml(truncate(song.title, 34))}</text>
      <text x="${width / 2}" y="135" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#888888">${escapeXml(truncate(song.artist, 48))}</text>
      
      ${!hideModules.includes('project') ? `
        <text x="${width / 2}" y="160" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#666">Project: <tspan fill="#aaa">${escapeXml(truncate(userData.project, 40))}</tspan></text>
      ` : ''}
      
      ${!hideModules.includes('vibe') ? `
        <text x="${width / 2}" y="178" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#666">Vibe: <tspan fill="#aaa">${escapeXml(truncate(userData.vibe, 40))}</tspan></text>
      ` : ''}
      
      ${!hideModules.includes('openToWork') && userData.openToWork ? `
        <rect x="${width / 2 - 75}" y="${height - 45}" width="150" height="28" rx="14" fill="${accent}" />
        <text x="${width / 2}" y="${height - 27}" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="#000">OPEN TO WORK: YES</text>
      ` : ''}
    </svg>`;
  },
  
  grid: ({ song, userData, accent, hide, albumData }) => {
    const width = 480;
    const height = 200;
    const hideModules = hide.split(",");
    
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <clipPath id="albumClip">
          <rect x="24" y="24" width="36" height="36" rx="4" />
        </clipPath>
      </defs>
      <rect width="${width}" height="${height}" rx="12" fill="#ffffff" stroke="#eeeeee" stroke-width="1" />
      
      <!-- Row 1 -->
      <g transform="translate(14, 14)">
        <rect width="220" height="80" rx="8" fill="#f9f9f9" />
        ${albumData ? `<image href="${albumData}" x="12" y="22" width="36" height="36" clip-path="url(#albumClip)" preserveAspectRatio="xMidYMid slice" />` : `<rect x="12" y="22" width="36" height="36" rx="4" fill="#eee" />`}
        <text x="56" y="36" font-family="sans-serif" font-size="14" font-weight="bold" fill="#111">${escapeXml(truncate(song.title, 18))}</text>
        <text x="56" y="52" font-family="sans-serif" font-size="11" fill="#777">${escapeXml(truncate(song.artist, 20))}</text>
      </g>
      
      <g transform="translate(246, 14)">
        <rect width="220" height="80" rx="8" fill="#f9f9f9" />
        <text x="16" y="30" font-family="sans-serif" font-size="9" font-weight="bold" fill="#999">PROJECT</text>
        <text x="16" y="52" font-family="sans-serif" font-size="14" font-weight="bold" fill="#111">${escapeXml(truncate(userData.project, 24))}</text>
      </g>
      
      <!-- Row 2 -->
      <g transform="translate(14, 106)">
        <rect width="220" height="80" rx="8" fill="#f9f9f9" />
        <text x="16" y="30" font-family="sans-serif" font-size="9" font-weight="bold" fill="#999">VIBE</text>
        <text x="16" y="52" font-family="sans-serif" font-size="14" font-weight="bold" fill="#111">${escapeXml(truncate(userData.vibe, 24))}</text>
      </g>
      
      <g transform="translate(246, 106)">
        <rect width="220" height="80" rx="8" fill="${userData.openToWork ? '#dcfce7' : '#fef2f2'}" />
        <text x="110" y="44" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="bold" fill="${userData.openToWork ? '#166534' : '#991b1b'}">OPEN TO WORK</text>
      </g>
    </svg>`;
  },
  
  minimal: ({ song, userData, accent, hide }) => {
    const width = 480;
    const height = 130;
    const hideModules = hide.split(",");
    
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" rx="8" fill="#f8f8f8" stroke="#dddddd" stroke-width="1" />
      
      <g transform="translate(20, 0)">
        <text x="0" y="28" font-family="sans-serif" font-size="9" fill="#aaaaaa" letter-spacing="1">NOW PLAYING</text>
        <text x="0" y="50" font-family="sans-serif" font-size="16" font-weight="bold" fill="#111111">${escapeXml(truncate(song.title, 40))}</text>
        
        <text x="0" y="74" font-family="sans-serif" font-size="12" fill="#888888">Project: <tspan fill="#444444" font-weight="500">${escapeXml(truncate(userData.project, 36))}</tspan></text>
        <text x="0" y="92" font-family="sans-serif" font-size="12" fill="#888888">Vibe: <tspan fill="#444444" font-weight="500">${escapeXml(truncate(userData.vibe, 36))}</tspan></text>
        
        ${userData.openToWork ? `<text x="0" y="112" font-family="sans-serif" font-size="11" font-weight="bold" fill="${accent}">OPEN TO WORK: YES</text>` : ''}
      </g>
      
      <path d="${GITHUB_ICON}" transform="translate(${width - 40}, 20) scale(0.8)" fill="#ddd" />
    </svg>`;
  },
  
  gradient: ({ song, userData, accent, hide }) => {
    const width = 480;
    const height = 180;
    
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ec4899;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#f97316;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" rx="14" fill="url(#grad)" />
      <rect x="3" y="3" width="${width - 6}" height="${height - 6}" rx="12" fill="#ffffff" />
      
      <text x="${width / 2}" y="35" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#999" letter-spacing="1">NOW PLAYING</text>
      <text x="${width / 2}" y="60" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="#111">${escapeXml(truncate(song.title, 40))}</text>
      
      <g transform="translate(${width / 2}, 95)">
        <rect x="-140" y="0" width="135" height="28" rx="14" fill="#f3f4f6" />
        <text x="-72" y="18" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#333">P: ${escapeXml(truncate(userData.project, 18))}</text>
        
        <rect x="5" y="0" width="135" height="28" rx="14" fill="#f3f4f6" />
        <text x="72" y="18" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#333">V: ${escapeXml(truncate(userData.vibe, 18))}</text>
      </g>
      
      ${userData.openToWork ? `
        <rect x="${width / 2 - 80}" y="${height - 38}" width="160" height="24" rx="12" fill="#dcfce7" />
        <text x="${width / 2}" y="${height - 22}" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="bold" fill="#166534">OPEN TO WORK: YES</text>
      ` : ''}
    </svg>`;
  }
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const { searchParams } = new URL(req.url);
  
  const layout = searchParams.get("layout") || "default";
  const theme = searchParams.get("theme") || "dark"; // For some layouts it might matter
  const accent = searchParams.get("accent") || "green";
  const hide = searchParams.get("hide") || "";

  const accents: Record<string, string> = {
    green: "#22c55e",
    purple: "#a855f7",
    blue: "#3b82f6",
    orange: "#f97316",
  };
  const accentColor = accents[accent] ?? accents.green;

  let user: any;
  try {
    const clerk = await clerkClient();
    user = await clerk.users.getUser(userId);
  } catch (err) {
    console.error("Clerk user fetch failed:", err);
    return new NextResponse("Invalid user", { status: 400 });
  }

  const meta = user.unsafeMetadata as any;
  const lastfmUsername = meta.lastfmUsername;

  if (!lastfmUsername) {
    return new NextResponse(
      `<svg width="480" height="60" xmlns="http://www.w3.org/2000/svg">
        <rect width="480" height="60" rx="12" fill="#1c1c1e"/>
        <text x="240" y="36" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#8e8e93">Last.fm not connected yet</text>
      </svg>`,
      { headers: { "Content-Type": "image/svg+xml" } }
    );
  }

  const song = await getNowPlaying(lastfmUsername);
  
  const userData = {
    name: user.firstName || "User",
    project: String(meta.project || "No project"),
    vibe: String(meta.vibe || "No vibe"),
    openToWork: Boolean(meta.openToWork ?? false),
  };

  let albumData = "";
  if (song.albumImage && !hide.includes('albumArt')) {
    albumData = await imageToBase64(song.albumImage);
  }

  const selectedLayout = layouts[layout] || layouts.default;
  const svg = selectedLayout({ song, userData, accent: accentColor, hide, albumData });

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}