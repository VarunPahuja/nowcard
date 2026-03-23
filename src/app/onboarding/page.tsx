"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";

export default function Onboarding() {
  const { user } = useUser();
  console.log(user?.id);

  const [project, setProject] = useState("");
  const [vibe, setVibe] = useState("");
  const [openToWork, setOpenToWork] = useState(true);

  const save = async () => {
    await user?.update({
      unsafeMetadata: {
        project,
        vibe,
        openToWork,
      },
    });

    alert("Saved!");
  };

  const handleConnectSpotify = () => {
    console.log("[onboarding] Connect Spotify clicked", { userId: user?.id });
    window.location.assign("/api/auth/login");
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

      <button type="button" onClick={handleConnectSpotify}>
        Connect Spotify
      </button>

      <br />
      <br />

      <button type="button" onClick={save}>
        Save
      </button>
    </div>
    
  );
}