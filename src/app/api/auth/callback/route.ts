const client_id = process.env.SPOTIFY_CLIENT_ID!;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;
const redirect_uri =
  process.env.NODE_ENV === "production"
    ? "https://nowcard.vercel.app/api/auth/callback"
    : "http://127.0.0.1:3000/api/auth/callback"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code!,
      redirect_uri,
    }),
  });

  const data = await res.json();

  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}