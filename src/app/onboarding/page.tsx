"use client";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";

export default function Onboarding() {
  const { user, isLoaded } = useUser();
  const [project, setProject] = useState("");
  const [vibe, setVibe] = useState("");
  const [openToWork, setOpenToWork] = useState(true);
  const [lastfmUsername, setLastfmUsername] = useState("");
  const [lastfmStatus, setLastfmStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [lastfmInfo, setLastfmInfo] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  const verifyLastfm = async () => {
    if (!lastfmUsername.trim()) return;
    setLastfmStatus("checking");
    setLastfmInfo(null);
    try {
      const res = await fetch(`/api/lastfm/verify?username=${lastfmUsername.trim()}`);
      const data = await res.json();
      if (data.valid) {
        setLastfmStatus("valid");
        setLastfmInfo(data);
      } else {
        setLastfmStatus("invalid");
      }
    } catch {
      setLastfmStatus("invalid");
    }
  };

  const save = async () => {
    if (lastfmStatus !== "valid") {
      alert("Please verify your Last.fm username first");
      return;
    }
    await user?.update({
      unsafeMetadata: {
        project,
        vibe,
        openToWork,
        lastfmUsername: lastfmUsername.trim(),
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: 20, maxWidth: 480 }}>
      <h1>Setup your NowCard</h1>
      <br />

      <label style={{ fontSize: 13, color: "#888" }}>Last.fm username</label>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <input
          placeholder="your-lastfm-username"
          value={lastfmUsername}
          onChange={(e) => {
            setLastfmUsername(e.target.value);
            setLastfmStatus("idle");
            setLastfmInfo(null);
          }}
          style={{ flex: 1 }}
        />
        <button
          type="button"
          onClick={verifyLastfm}
          disabled={!lastfmUsername.trim() || lastfmStatus === "checking"}
        >
          {lastfmStatus === "checking" ? "Checking..." : "Verify"}
        </button>
      </div>

      {lastfmStatus === "valid" && lastfmInfo && (
        <div style={{ marginTop: 8, padding: 10, background: "#1a2e1a", borderRadius: 8, border: "1px solid #22c55e" }}>
          <p style={{ color: "#22c55e", fontSize: 13, margin: 0 }}>
            ✓ Found: {lastfmInfo.name} · {parseInt(lastfmInfo.playcount).toLocaleString()} scrobbles
          </p>
        </div>
      )}

      {lastfmStatus === "invalid" && (
        <div style={{ marginTop: 8, padding: 10, background: "#2e1a1a", borderRadius: 8, border: "1px solid #ef4444" }}>
          <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>
            ✕ Last.fm user not found. Check your username at last.fm
          </p>
        </div>
      )}

      <p style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
        No Last.fm account? Create one free at last.fm then connect Spotify to it.
      </p>

      <br />
      <label style={{ fontSize: 13, color: "#888" }}>Current project</label>
      <input
        placeholder="e.g. NowCard"
        value={project}
        onChange={(e) => setProject(e.target.value)}
        style={{ display: "block", marginTop: 4, width: "100%" }}
      />
      <br />

      <label style={{ fontSize: 13, color: "#888" }}>Vibe</label>
      <input
        placeholder="e.g. locked in, coasting"
        value={vibe}
        onChange={(e) => setVibe(e.target.value)}
        style={{ display: "block", marginTop: 4, width: "100%" }}
      />
      <br />

      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={openToWork}
          onChange={() => setOpenToWork(!openToWork)}
        />
        <span style={{ fontSize: 14 }}>Open to Work</span>
      </label>
      <br />

      <button
        type="button"
        onClick={save}
        disabled={!isLoaded || !user || lastfmStatus !== "valid"}
        style={{ opacity: lastfmStatus !== "valid" ? 0.5 : 1 }}
      >
        {saved ? "Saved!" : "Save"}
      </button>

      <br /><br />
      {user && (
        <div style={{ background: "#111", padding: 12, borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: "#888", margin: "0 0 4px" }}>Your card URL:</p>
          <a
            href={`https://www.nowcard.store/api/card/${user.id}`}
            target="_blank"
            style={{ fontSize: 12, color: "#3b82f6" }}
          >
            {`https://www.nowcard.store/api/card/${user.id}`}
          </a>
          <br /><br />
          <p style={{ fontSize: 12, color: "#888", margin: "0 0 4px" }}>GitHub README embed:</p>
          <code style={{ fontSize: 11, color: "#22c55e" }}>
            {`![NowCard](https://www.nowcard.store/api/card/${user.id})`}
          </code>
        </div>
      )}
    </div>
  );
}