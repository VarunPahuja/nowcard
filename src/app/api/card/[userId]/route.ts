import { NextResponse, NextRequest } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

// ---------------- TYPES ----------------
interface Song {
title: string;
artist: string;
albumImage: string | null;
isPlaying: boolean;
lastPlayed?: string;
}

// ---------------- ENV ----------------
const client_id = process.env.SPOTIFY_CLIENT_ID!;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_ENDPOINT = "https://api.spotify.com/v1/me/player/currently-playing";

// ---------------- SPOTIFY ----------------
async function getNowPlaying(refresh_token: string): Promise<Song> {
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

```
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
```

}

const song = await res.json();

return {
title: song.item.name,
artist: song.item.artists.map((a: any) => a.name).join(", "),
albumImage: song.item.album.images[0].url,
isPlaying: song.is_playing,
};
}

// ---------------- UTILS ----------------
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
.replace(/&/g, "&")
.replace(/</g, "<")
.replace(/>/g, ">")
.replace(/"/g, """)
.replace(/'/g, "'");
}

function truncate(str: string, max: number): string {
return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

// ---------------- MAIN ROUTE ----------------
export async function GET(
req: NextRequest,
{ params }: { params: Promise<{ userId: string }> }
) {
const { userId } = await params;

const { searchParams } = new URL(req.url);
const theme = searchParams.get("theme") || "dark";
const accent = searchParams.get("accent") || "green";
const hide = searchParams.get("hide") || "";

const clerk = await clerkClient();
const user = await clerk.users.getUser(userId);

const meta = user.unsafeMetadata as any;

// 🔥 PER USER TOKEN
const refresh_token = meta.spotifyRefreshToken;

if (!refresh_token) {
return new Response("Spotify not connected", { status: 200 });
}

const song = await getNowPlaying(refresh_token);

const userData = {
name: String(user.firstName || "User"),
project: String(meta.project || "No project"),
vibe: String(meta.vibe || "No vibe"),
openToWork: Boolean(meta.openToWork),
};

const themes = {
dark: { bg: "#1c1c1e", text: "#ffffff", subtext: "#8e8e93" },
light: { bg: "#ffffff", text: "#111111", subtext: "#555" },
};

const accents = {
green: "#22c55e",
purple: "#a855f7",
blue: "#3b82f6",
};

const t = themes[theme as "dark" | "light"] || themes.dark;
const accentColor = accents[accent as keyof typeof accents] || accents.green;

let albumImageData = "";
if (song.albumImage) {
albumImageData = await imageToBase64(song.albumImage);
}

const titleText = song.isPlaying
? truncate(song.title, 38)
: song.lastPlayed
? `Last played ${song.lastPlayed}`
: "Nothing playing";

const artistText = song.isPlaying ? truncate(song.artist, 44) : "";

const badgeColor = userData.openToWork ? accentColor : "#ef4444";
const badgeLabel = userData.openToWork ? "YES" : "NO";
const badgePrefix = userData.openToWork ? "✓ OPEN TO WORK: " : "✕ OPEN TO WORK: ";

const svg = ` <svg xmlns="http://www.w3.org/2000/svg" width="420" height="210"> <rect width="100%" height="100%" rx="18" fill="${t.bg}" />

```
<text x="50%" y="50" text-anchor="middle" fill="${t.text}" font-size="16">
  ${escapeXml(titleText)}
</text>

<text x="50%" y="75" text-anchor="middle" fill="${t.subtext}" font-size="12">
  ${escapeXml(artistText)}
</text>

<text x="50%" y="110" text-anchor="middle" fill="${t.subtext}" font-size="12">
  Project: ${escapeXml(userData.project)}
</text>

${
  !hide.includes("vibe")
    ? `<text x="50%" y="130" text-anchor="middle" fill="${t.subtext}" font-size="12">
        Vibe: ${escapeXml(userData.vibe)}
      </text>`
    : ""
}

<text x="50%" y="170" text-anchor="middle" fill="${badgeColor}" font-size="12">
  ${badgePrefix}${badgeLabel}
</text>
```

  </svg>
  `;

return new NextResponse(svg, {
headers: {
"Content-Type": "image/svg+xml",
"Cache-Control": "no-store",
},
});
}
