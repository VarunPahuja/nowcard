import { clerkClient } from "@clerk/nextjs/server";

const client_id = process.env.SPOTIFY_CLIENT_ID!;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;
const SPOTIFY_REDIRECT_URI =
  process.env.NODE_ENV === "production"
    ? "https://nowcard.vercel.app/api/auth/callback"
    : "http://127.0.0.1:3000/api/auth/callback";
const ONBOARDING_REDIRECT_URL =
  process.env.NODE_ENV === "production"
    ? "https://nowcard.vercel.app/onboarding"
    : "http://localhost:3000/onboarding";

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const { searchParams } = requestUrl;

  const code = searchParams.get("code");
  const userId = searchParams.get("state");

  console.log("[spotify-callback] Callback received", {
    hasCode: Boolean(code),
    hasState: Boolean(userId),
    origin: requestUrl.origin,
  });

  if (!code || !userId) {
    console.error("[spotify-callback] Missing code or state", {
      codePresent: Boolean(code),
      userIdPresent: Boolean(userId),
    });
    return new Response("Missing code or userId", { status: 400 });
  }

  if (!client_id || !client_secret) {
    console.error("[spotify-callback] Missing Spotify env vars", {
      hasClientId: Boolean(client_id),
      hasClientSecret: Boolean(client_secret),
    });
    return new Response("Missing Spotify credentials", { status: 500 });
  }

  const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");

  console.log("[spotify-callback] Exchanging code for tokens", { userId });

  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
    }),
  });

  const data = await tokenResponse.json();

  const refresh_token = data.refresh_token;

  console.log("[spotify-callback] Token exchange result", {
    status: tokenResponse.status,
    ok: tokenResponse.ok,
    hasRefreshToken: Boolean(refresh_token),
  });

  if (!tokenResponse.ok) {
    console.error("[spotify-callback] Token exchange failed", {
      status: tokenResponse.status,
      data,
    });
    return new Response("Failed to exchange Spotify code", {
      status: tokenResponse.status,
    });
  }

  if (refresh_token) {
    const clerk = await clerkClient();

    await clerk.users.updateUser(userId, {
      unsafeMetadata: {
        spotifyRefreshToken: refresh_token,
      },
    });

    console.log("[spotify-callback] Stored refresh token in Clerk", { userId });
  } else {
    console.error("[spotify-callback] Missing refresh_token in token response", {
      data,
    });
    return new Response("No Spotify refresh token returned", { status: 400 });
  }

  console.log("[spotify-callback] Redirecting to onboarding", {
    redirect: ONBOARDING_REDIRECT_URL,
  });

  return Response.redirect(ONBOARDING_REDIRECT_URL);
}