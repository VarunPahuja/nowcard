"use client";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";

export default function Onboarding() {
  const { user, isLoaded } = useUser();
  console.log("Clerk state:", { isLoaded, hasUser: !!user, userId: user?.id });
  const [project, setProject] = useState("");
  const [vibe, setVibe] = useState("");
  const [openToWork, setOpenToWork] = useState(true);

  const save = async () => {
    await user?.update({
      unsafeMetadata: { project, vibe, openToWork },
    });
    alert("Saved!");
  };

  const handleConnectSpotify = () => {
    if (!user?.id) {
      alert("Not logged in yet, wait a second and try again");
      return;
    }

    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
      scope: "user-read-currently-playing user-read-recently-played",
      redirect_uri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!,
      state: user.id,
    });

    window.location.assign(
      "https://accounts.spotify.com/authorize?" + params.toString()
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Setup your NowCard</h1>
      <input
        placeholder="Project"
        value={project}
        onChange={(e) => setProject(e.target.value)}
      />
      <br /><br />
      <input
        placeholder="Vibe"
        value={vibe}
        onChange={(e) => setVibe(e.target.value)}
      />
      <br /><br />
      <label>
        <input
          type="checkbox"
          checked={openToWork}
          onChange={() => setOpenToWork(!openToWork)}
        />
        Open to Work
      </label>
      <br /><br />
      <button type="button" onClick={handleConnectSpotify} disabled={!isLoaded || !user}>
        {!isLoaded ? "Loading..." : "Connect Spotify"}
      </button>
      <br /><br />
      <button type="button" onClick={save}>
        Save
      </button>

      {user && (
        <div style={{ marginTop: 20 }}>
          <p>Your card URL: 
            <a href={`https://www.nowcard.store/api/card/${user.id}`} target="_blank">
              https://www.nowcard.store/api/card/{user.id}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}