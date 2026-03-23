const client_id = process.env.SPOTIFY_CLIENT_ID!;
// const redirect_uri = "http://127.0.0.1:3000/api/auth/callback";
const redirect_uri = "https://nowcard.vercel.app/api/auth/callback";

export async function GET() {
  const scope = "user-read-currently-playing user-read-recently-played";

  const url =
    "https://accounts.spotify.com/authorize?" +
    new URLSearchParams({
      response_type: "code",
      client_id,
      scope,
      redirect_uri,
    });

  return Response.redirect(url);
}