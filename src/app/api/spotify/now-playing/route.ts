const client_id = process.env.SPOTIFY_CLIENT_ID!;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN!;

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_ENDPOINT = "https://api.spotify.com/v1/me/player/currently-playing";

export async function GET() {
  const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");

  // 1. get access token
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

  // 2. fetch now playing
  const res = await fetch(NOW_PLAYING_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  if (res.status === 204 || res.status > 400) {
    return new Response(JSON.stringify({ isPlaying: false }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const song = await res.json();

  return new Response(
    JSON.stringify({
      isPlaying: song.is_playing,
      title: song.item.name,
      artist: song.item.artists.map((a: any) => a.name).join(", "),
      albumImage: song.item.album.images[0].url,
      url: song.item.external_urls.spotify,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}