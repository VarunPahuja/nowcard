import { clerkClient, auth } from "@clerk/nextjs/server";

const client_id = process.env.SPOTIFY_CLIENT_ID!;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI!;

const ONBOARDING_REDIRECT_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.nowcard.store/onboarding" // ✅ fixed www
    : "http://localhost:3000/onboarding";

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const { searchParams } = requestUrl;

  const code = searchParams.get("code");
  const stateUserId = searchParams.get("state");

  // 🔥 real user from Clerk session
  const { userId } = await auth();

  console.log("[spotify-callback] Callback received", {
    hasCode: Boolean(code),
    hasState: Boolean(stateUserId),
    clerkUser: userId,
    origin: requestUrl.origin,
  });

  // ❌ must have code + logged in user
  if (!code || !userId) {
    console.error("[spotify-callback] Missing code or auth user", {
      codePresent: Boolean(code),
      userPresent: Boolean(userId),
    });
    return new Response("Missing code or user", { status: 400 });
  }

  // ⚠️ optional but recommended: verify state
  if (stateUserId && stateUserId !== userId) {
    console.error("[spotify-callback] State mismatch", {
      stateUserId,
      clerkUserId: userId,
    });
    return new Response("Invalid state", { status: 400 });
  }

  if (!client_id || !client_secret) {
    console.error("[spotify-callback] Missing Spotify env vars");
    return new Response("Missing Spotify credentials", { status: 500 });
  }

  const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");

  console.log("[spotify-callback] Exchanging code for tokens", { userId });

  let data: any;
  let tokenResponse: Response;

  try {
    tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
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

    data = await tokenResponse.json();
  } catch (err) {
    console.error("[spotify-callback] Token fetch threw:", err);
    return new Response("Token exchange request failed", { status: 500 });
  }

  console.log("[spotify-callback] Token exchange result", {
    status: tokenResponse.status,
    ok: tokenResponse.ok,
    hasRefreshToken: Boolean(data.refresh_token),
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

  const refresh_token = data.refresh_token;

  if (!refresh_token) {
    console.error("[spotify-callback] Missing refresh_token in response", { data });
    return new Response("No Spotify refresh token returned", { status: 400 });
  }

  try {
    const clerk = await clerkClient();

    await clerk.users.updateUserMetadata(userId, {
      unsafeMetadata: {
        spotifyRefreshToken: refresh_token,
      },
    });

    console.log("[spotify-callback] Stored refresh token in Clerk", { userId });
  } catch (err) {
    console.error("[spotify-callback] Clerk metadata save failed:", err);
    return new Response("Failed to save Spotify token", { status: 500 });
  }

  console.log("[spotify-callback] Redirecting to onboarding", {
    redirect: ONBOARDING_REDIRECT_URL,
  });

  return Response.redirect(ONBOARDING_REDIRECT_URL);
}