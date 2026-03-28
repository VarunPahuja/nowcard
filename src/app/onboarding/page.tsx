"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import Nav from "@/components/Nav";

export default function Onboarding() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [lastfmUsername, setLastfmUsername] = useState("");
  const [verifyState, setVerifyState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [lastfmInfo, setLastfmInfo] = useState<any>(null);
  const [project, setProject] = useState("");
  const [vibe, setVibe] = useState("");
  const [openToWork, setOpenToWork] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (user?.unsafeMetadata && !isInitialized) {
      const meta = user.unsafeMetadata as any;
      if (meta.lastfmUsername) {
        setLastfmUsername(meta.lastfmUsername);
        setVerifyState("success");
      }
      if (meta.project) setProject(meta.project);
      if (meta.vibe) setVibe(meta.vibe);
      if (typeof meta.openToWork === 'boolean') setOpenToWork(meta.openToWork);
      setIsInitialized(true);
    }
  }, [user, isInitialized]);

  const handleVerify = async () => {
    if (!lastfmUsername.trim()) return;
    setVerifyState("loading");
    setLastfmInfo(null);
    try {
      const res = await fetch(`/api/lastfm/verify?username=${lastfmUsername.trim()}`);
      const data = await res.json();
      if (data.valid) {
        setVerifyState("success");
        setLastfmInfo(data);
      } else {
        setVerifyState("error");
      }
    } catch {
      setVerifyState("error");
    }
  };

  const handleSave = async () => {
    if (verifyState !== "success") return;
    setIsSaving(true);
    try {
      await user?.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          lastfmUsername: lastfmUsername.trim(),
          project,
          vibe,
          openToWork,
        },
      });
      router.push("/dashboard");
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) return null;

  const hasData = !!(user?.unsafeMetadata as any)?.lastfmUsername;

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-xl mx-auto px-6 py-16">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {hasData ? "Update your NowCard" : "Setup your NowCard"}
            </h1>
            <p className="text-muted-foreground">
              Connect your Last.fm and show the world what you're building.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 space-y-6 shadow-sm">
            {/* Last.fm section */}
            <div className="space-y-3">
              <label className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                Last.fm username
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="your-username"
                  value={lastfmUsername}
                  onChange={(e) => {
                    setLastfmUsername(e.target.value);
                    setVerifyState("idle");
                  }}
                  className="bg-muted/50"
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
                <div className="flex items-center gap-2 text-xs font-medium text-primary px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                  <Check className="w-3.5 h-3.5" />
                  Verified: {lastfmInfo?.name || lastfmUsername} 
                  {lastfmInfo?.playcount && ` · ${parseInt(lastfmInfo.playcount).toLocaleString()} scrobbles`}
                </div>
              )}
              
              {verifyState === "error" && (
                <div className="flex items-center gap-2 text-xs font-medium text-destructive px-3 py-2 rounded-lg bg-destructive/5 border border-destructive/20">
                  <X className="w-3.5 h-3.5" />
                  User not found. Please check your username.
                </div>
              )}

              <p className="text-[11px] text-muted-foreground mt-1">
                No account? Create one free at last.fm — connect Spotify to it to scrobble live.
              </p>
            </div>

            {/* Profile fields */}
            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                  Current project
                </label>
                <Input
                  placeholder="e.g. NowCard"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                  Vibe
                </label>
                <Input
                  placeholder="e.g. locked in, coasting"
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  className="bg-muted/50"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold">Open to work</label>
                  <p className="text-xs text-muted-foreground">
                    Show a badge on your card
                  </p>
                </div>
                <Switch checked={openToWork} onCheckedChange={setOpenToWork} />
              </div>
            </div>

            <Button
              className="w-full h-12 text-base font-semibold"
              disabled={verifyState !== "success" || isSaving}
              onClick={handleSave}
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save & Continue"}
            </Button>
          </div>

          {/* Preview */}
          {hasData && (
            <div className="space-y-4 pt-4">
              <h3 className="text-center text-sm font-medium text-muted-foreground tracking-widest uppercase">
                Your Current Card
              </h3>
              <div className="rounded-2xl overflow-hidden border border-border bg-muted/20 p-2">
                <img
                  src={`https://www.nowcard.store/api/card/${user?.id}`}
                  alt="Current NowCard"
                  className="w-full rounded-xl"
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
