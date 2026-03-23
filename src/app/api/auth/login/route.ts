import { auth } from "@clerk/nextjs/server";

const client_id = process.env.SPOTIFY_CLIENT_ID!;
const SPOTIFY_REDIRECT_URI =
  process.env.NODE_ENV === "production"
    ? "https://nowcard.vercel.app/api/auth/callback"
    : "http://127.0.0.1:3000/api/auth/callback";

export async function GET(req: Request) {
  const { userId } = await auth();

  console.log("[spotify-login] Request received", {
    userId,
  });

  if (!userId) {
    console.error("[spotify-login] Not logged in");
    return new Response("Not logged in", { status: 401 });
  }

  if (!client_id) {
    console.error("[spotify-login] Missing client_id");
    return new Response("Missing Spotify client ID", { status: 500 });
  }

  const scope = "user-read-currently-playing user-read-recently-played";

  const spotifyAuthUrl =
    "https://accounts.spotify.com/authorize?" +
    new URLSearchParams({
      response_type: "code",
      client_id,
      scope,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      state: userId,
    }).toString();

  console.log("[spotify-login] Redirecting →", spotifyAuthUrl);

  // 🔥 IMPORTANT FIX: use NextResponse + explicit 302
  return new Response(null, {
    status: 302,
    headers: {
      Location: spotifyAuthUrl,
    },
  });
}