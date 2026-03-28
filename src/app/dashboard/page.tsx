"use client";
import { useState, useMemo, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { Copy, Pencil, Share2 } from "lucide-react";
import { toast } from "sonner";
import Nav from "@/components/Nav";

type Layout = "default" | "compact" | "minimal";
type Accent = "green" | "purple" | "blue" | "orange";

const ACCENT_COLORS: { name: Accent; hsl: string }[] = [
  { name: "green", hsl: "142 71% 45%" },
  { name: "purple", hsl: "271 91% 65%" },
  { name: "blue", hsl: "217 91% 60%" },
  { name: "orange", hsl: "25 95% 53%" },
];

const LAYOUTS: { id: Layout; label: string; desc: string }[] = [
  { id: "default", label: "Default", desc: "Centered, album art on top" },
  { id: "compact", label: "Compact", desc: "Horizontal, single line" },
  { id: "minimal", label: "Minimal", desc: "Text only, no album art" },
];

const Dashboard = () => {
  const router = useRouter();
  
  const { isSignedIn, isLoaded } = useAuth();
  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push('/');
  }, [isLoaded, isSignedIn, router]);

  const { user } = useUser();

  const [layout, setLayout] = useState<Layout>("default");
  const [accent, setAccent] = useState<Accent>("green");
  const [modules, setModules] = useState({
    vibe: true,
    project: true,
    openToWork: true,
    albumArt: true,
  });

  // Build card URL with params
  const cardUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (layout !== 'default') params.set('layout', layout);
    if (accent !== 'green') params.set('accent', accent);
    
    const hiddenModules = Object.entries(modules)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (hiddenModules.length > 0) params.set('hide', hiddenModules.join(','));
    
    const query = params.toString();
    return `https://www.nowcard.store/api/card/${user?.id}${query ? '?' + query : ''}`;
  }, [layout, accent, modules, user?.id]);

  const embedSnippet = `![NowCard](${cardUrl})`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const shareOnLinkedIn = () => {
    const text = encodeURIComponent(
      "Built my dev identity card with NowCard — shows my live music, current project and whether I'm open to work. Check it out 👇"
    );
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(cardUrl)}&summary=${text}`,
      "_blank"
    );
  };

  const toggleModule = (key: keyof typeof modules) => {
    setModules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Simulated Last.fm stats
  const stats = {
    totalScrobbles: "24,891",
    topArtist: "Kavinsky",
    listeningSince: "2019",
  };

  return (
    <div className="min-h-screen">
      <Nav />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your NowCard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Customize and share your live developer card.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push("/onboarding")}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit profile
          </Button>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Left: Preview + Actions */}
          <div className="space-y-6">
            {/* Live Card Preview */}
            <div className="rounded-xl border border-border bg-card p-4">
              <img
                src={cardUrl}
                alt="NowCard"
                className="w-full rounded-lg bg-muted min-h-[140px]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>

            {/* Copy Actions */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <code className="flex-1 px-3 py-2.5 rounded-lg bg-input border border-border text-xs text-foreground font-mono truncate flex items-center">
                  {cardUrl}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(cardUrl, "Card URL")}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <code className="flex-1 px-3 py-2.5 rounded-lg bg-input border border-border text-xs text-foreground font-mono truncate flex items-center">
                  {embedSnippet}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(embedSnippet, "Embed snippet")}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              <Button variant="outline" className="w-full" onClick={shareOnLinkedIn}>
                <Share2 className="w-4 h-4 mr-2" /> Share on LinkedIn
              </Button>
            </div>

            {/* Last.fm Stats */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Last.fm Stats</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-foreground font-bold text-lg">{stats.totalScrobbles}</div>
                  <div className="text-muted-foreground text-xs">Total scrobbles</div>
                </div>
                <div>
                  <div className="text-foreground font-bold text-lg">{stats.topArtist}</div>
                  <div className="text-muted-foreground text-xs">Top artist this week</div>
                </div>
                <div>
                  <div className="text-foreground font-bold text-lg">{stats.listeningSince}</div>
                  <div className="text-muted-foreground text-xs">Listening since</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="space-y-6">
            {/* Layout Selector */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Layout</h3>
              <div className="space-y-2">
                {LAYOUTS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLayout(l.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      layout === l.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="text-foreground text-sm font-medium">{l.label}</div>
                    <div className="text-muted-foreground text-xs">{l.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Accent color</h3>
              <div className="flex gap-2">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setAccent(c.name)}
                    className={`w-9 h-9 rounded-lg border-2 transition-all ${
                      accent === c.name ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: `hsl(${c.hsl})` }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Module Toggles */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Modules</h3>
              {[
                { key: "vibe" as const, label: "Show vibe" },
                { key: "project" as const, label: "Show project" },
                { key: "openToWork" as const, label: "Open to work badge" },
                { key: "albumArt" as const, label: "Show album art" },
              ].map((mod) => (
                <div key={mod.key} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{mod.label}</span>
                  <Switch
                    checked={modules[mod.key]}
                    onCheckedChange={() => toggleModule(mod.key)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
