"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import Nav from "@/components/Nav";

const Onboarding = () => {
  const router = useRouter();
  const { user } = useUser();
  const [lastfmUsername, setLastfmUsername] = useState("");
  const [verifyState, setVerifyState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [scrobbleCount, setScrobbleCount] = useState(0);
  const [project, setProject] = useState("");
  const [vibe, setVibe] = useState("");
  const [openToWork, setOpenToWork] = useState(false);

  useEffect(() => {
    if (user?.unsafeMetadata) {
      const meta = user.unsafeMetadata as any;
      if (meta.lastfmUsername) {
        setLastfmUsername(meta.lastfmUsername);
        setVerifyState("success");
      }
      if (meta.project) setProject(meta.project);
      if (meta.vibe) setVibe(meta.vibe);
      if (typeof meta.openToWork === 'boolean') setOpenToWork(meta.openToWork);
    }
  }, [user]);

  const handleVerify = async () => {
    if (!lastfmUsername.trim()) return;
    setVerifyState("loading");
    // Simulate API call to /api/lastfm/verify?username=xxx
    setTimeout(() => {
      if (lastfmUsername.toLowerCase() === "notfound") {
        setVerifyState("error");
      } else {
        setScrobbleCount(Math.floor(Math.random() * 50000) + 1000);
        setVerifyState("success");
      }
    }, 1200);
  };

  const handleSave = async () => {
    if (user) {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          lastfmUsername,
          project,
          vibe,
          openToWork
        }
      });
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-[500px] space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Set up your card</h1>
            <p className="text-muted-foreground text-sm">
              Connect your Last.fm and tell the world what you're up to.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            {/* Last.fm */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Last.fm username</label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. vvannavv"
                  value={lastfmUsername}
                  onChange={(e) => {
                    setLastfmUsername(e.target.value);
                    setVerifyState("idle");
                  }}
                />
                <Button
                  variant="outline"
                  onClick={handleVerify}
                  disabled={!lastfmUsername.trim() || verifyState === "loading"}
                >
                  {verifyState === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
              {verifyState === "success" && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-medium">
                  <Check className="w-3.5 h-3.5" /> {lastfmUsername} ·{" "}
                  {scrobbleCount.toLocaleString()} scrobbles
                </div>
              )}
              {verifyState === "error" && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/15 text-destructive text-xs font-medium">
                  <X className="w-3.5 h-3.5" /> User not found
                </div>
              )}
            </div>

            {/* Current Project */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Current project</label>
              <Input
                placeholder="e.g. NowCard"
                value={project}
                onChange={(e) => setProject(e.target.value)}
              />
            </div>

            {/* Vibe */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Vibe</label>
              <Input
                placeholder="e.g. shipping fast 🚀"
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
              />
            </div>

            {/* Open to Work */}
            <div className="flex items-center justify-between py-1">
              <label className="text-sm font-medium text-foreground">Open to work</label>
              <Switch checked={openToWork} onCheckedChange={setOpenToWork} />
            </div>

            <Button
              className="w-full"
              disabled={verifyState !== "success"}
              onClick={handleSave}
            >
              Save & generate card
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
