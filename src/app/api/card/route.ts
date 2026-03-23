import { readFile } from "fs/promises";

const client_id = process.env.SPOTIFY_CLIENT_ID!;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN!;

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_ENDPOINT = "https://api.spotify.com/v1/me/player/currently-playing";

async function getNowPlaying() {
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

  if (res.status === 204 || res.status > 400) return null;

  const song = await res.json();

  return {
    title: song.item.name,
    artist: song.item.artists.map((a: any) => a.name).join(", "),
  };
}

export async function GET() {
  const userData = JSON.parse(
    await readFile(process.cwd() + "/data/user.json", "utf-8")
  );

  const song = await getNowPlaying();

  const svg = `
  <svg width="400" height="220" xmlns="http://www.w3.org/2000/svg">
    <style>
      .title { font: bold 16px sans-serif; fill: white; }
      .text { font: 12px sans-serif; fill: #ccc; }
    </style>

    <rect width="100%" height="100%" fill="#0f0f0f" rx="12"/>

    <text x="20" y="30" class="title">${userData.name}</text>

    <text x="20" y="60" class="text">Project: ${userData.project}</text>
    <text x="20" y="80" class="text">Vibe: ${userData.vibe}</text>
    <text x="20" y="100" class="text">
      ${userData.openToWork ? "Open to work 🟢" : "Not looking 🔴"}
    </text>

    ${
      song
        ? `
      <text x="20" y="140" class="text">Now Playing:</text>
      <text x="20" y="160" class="text">${song.title}</text>
      <text x="20" y="180" class="text">${song.artist}</text>
    `
        : `<text x="20" y="150" class="text">Nothing playing</text>`
    }
  </svg>
  `;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
    },
  });
}