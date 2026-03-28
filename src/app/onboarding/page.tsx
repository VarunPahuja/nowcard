"use client";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";

export default function Onboarding() {
  const { user, isLoaded } = useUser();
  const [project, setProject] = useState("");
  const [vibe, setVibe] = useState("");
  const [openToWork, setOpenToWork] = useState(true);
  const [lastfmUsername, setLastfmUsername] = useState("");
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await user?.update({
      unsafeMetadata: {
        project,
        vibe,
        openToWork,
        lastfmUsername,
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Setup your NowCard</h1>
      <br />
      <input
        placeholder="Last.fm username"
        value={lastfmUsername}
        onChange={(e) => setLastfmUsername(e.target.value)}
      />
      <p style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
        Get one free at last.fm
      </p>
      <br />
      <input
        placeholder="Current project"
        value={project}
        onChange={(e) => setProject(e.target.value)}
      />
      <br /><br />
      <input
        placeholder="Vibe (e.g. locked in, coasting)"
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
        {" "}Open to Work
      </label>
      <br /><br />
      <button type="button" onClick={save} disabled={!isLoaded || !user}>
        {saved ? "Saved!" : "Save"}
      </button>
      <br /><br />
      {user && (
        <div>
          <p style={{ fontSize: 13, color: "#888" }}>Your card URL:</p>
          <a
            href={`https://www.nowcard.store/api/card/${user.id}`}
            target="_blank"
            style={{ fontSize: 13 }}
          >
            {`https://www.nowcard.store/api/card/${user.id}`}
          </a>
          <br /><br />
          <p style={{ fontSize: 13, color: "#888" }}>Embed in your GitHub README:</p>
          <code style={{ fontSize: 12 }}>
            {`![NowCard](https://www.nowcard.store/api/card/${user.id})`}
          </code>
        </div>
      )}
    </div>
  );
}