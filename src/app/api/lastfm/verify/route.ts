import { NextRequest, NextResponse } from "next/server";

const LASTFM_API_KEY = process.env.LASTFM_API_KEY!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ valid: false, error: "Missing username" });
  }

  const res = await fetch(
    `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${LASTFM_API_KEY}&format=json`
  );

  const data = await res.json();

  if (data.error) {
    return NextResponse.json({ valid: false, error: "User not found" });
  }

  return NextResponse.json({
    valid: true,
    name: data.user.name,
    realname: data.user.realname,
    image: data.user.image?.[1]?.["#text"] || null,
    playcount: data.user.playcount,
  });
}
