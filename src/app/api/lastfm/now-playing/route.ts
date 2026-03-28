import { NextRequest, NextResponse } from "next/server";

const LASTFM_API_KEY = process.env.LASTFM_API_KEY!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  const res = await fetch(
    `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${LASTFM_API_KEY}&format=json&limit=1`
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Last.fm API error" }, { status: 502 });
  }

  const data = await res.json();
  const track = data.recenttracks?.track?.[0];

  if (!track) {
    return NextResponse.json({ isPlaying: false, title: "Nothing playing", artist: "", albumImage: null });
  }

  const isPlaying = track["@attr"]?.nowplaying === "true";
  const title = track.name;
  const artist = track.artist["#text"];
  const albumImage = track.image?.find((img: any) => img.size === "large")?.["#text"] || null;

  return NextResponse.json({ isPlaying, title, artist, albumImage });
}
