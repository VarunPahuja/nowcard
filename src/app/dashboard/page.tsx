"use client";
import { useState, useMemo, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { Copy, Pencil, Share2, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import Nav from "@/components/Nav";

type Layout = "default" | "soft" | "compact" | "hero" | "grid" | "minimal" | "gradient";
type Accent = "green" | "purple" | "blue" | "orange";

const ACCENT_COLORS: { name: Accent; hex: string }[] = [
  { name: "green", hex: "#22c55e" },
  { name: "purple", hex: "#a855f7" },
  { name: "blue", hex: "#3b82f6" },
  { name: "orange", hex: "#f97316" },
];

const LAYOUTS: { id: Layout; label: string; desc: string }[] = [
  { id: "default", label: "Default", desc: "Dark minimal glass" },
  { id: "soft", label: "Soft", desc: "Light image card" },
  { id: "compact", label: "Compact", desc: "Media strip" },
  { id: "hero", label: "Hero", desc: "Center feature" },
  { id: "grid", label: "Grid", desc: "Modular tiles" },
  { id: "minimal", label: "Minimal", desc: "Dev text card" },
  { id: "gradient", label: "Gradient", desc: "Colorful border" },
];

export default function Dashboard() {
  const router = useRouter();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user } = useUser();

  const [layout, setLayout] = useState<Layout>("default");
  const [accent, setAccent] = useState<Accent>("green");
  const [hiddenModules, setHiddenModules] = useState<string[]>([]);
  const [imgLoading, setImgLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  useEffect(() => {
    if (authLoaded && !isSignedIn) router.push('/');
  }, [authLoaded, isSignedIn, router]);

  // Compute card URL
  const cardUrl = useMemo(() => {
    if (!user?.id) return "";
    const base = `https://www.nowcard.store/api/card/${user.id}`;
    const params = new URLSearchParams();
    if (layout !== 'default') params.set('layout', layout);
    if (accent !== 'green') params.set('accent', accent);
    if (hiddenModules.length > 0) params.set('hide', hiddenModules.join(','));
    const query = params.toString();
    return query ? `${base}?${query}` : base;
  }, [layout, accent, hiddenModules, user?.id]);

  const embedSnippet = `![NowCard](${cardUrl})`;

  const copyUrl = () => {
    navigator.clipboard.writeText(cardUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
    toast.success("Card URL copied");
  };

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
    toast.success("Markdown snippet copied");
  };

  const shareOnLinkedIn = () => {
    const text = encodeURIComponent(
      "I built my live developer identity card with NowCard! Updated live from my Spotify & Last.fm. Check it out 👇"
    );
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(cardUrl)}`,
      "_blank"
    );
  };

  const toggleModule = (module: string) => {
    setHiddenModules((prev) => 
      prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module]
    );
  };

  if (!authLoaded || !user) return null;

  return (
    <div className="min-h-screen bg-[#050505]">
      <Nav />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[1fr_400px] gap-12">
          
          {/* Left Column: Preview */}
          <div className="space-y-10">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white tracking-tight">Your NowCard</h1>
              <p className="text-gray-400">Customize and embed your dynamic profile card.</p>
            </div>

            <div className="space-y-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative bg-[#0d0d0d] border border-white/10 rounded-2xl p-6 min-h-[260px] flex items-center justify-center overflow-hidden">
                  {imgLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d0d] z-10">
                      <div className="w-full max-w-[480px] h-[200px] animate-pulse bg-white/5 rounded-xl flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
                      </div>
                    </div>
                  )}
                  <img
                    src={cardUrl}
                    alt="NowCard Live Preview"
                    className={`max-w-full transition-all duration-300 ${imgLoading ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
                    onLoad={() => setImgLoading(false)}
                    onError={() => setImgLoading(false)}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Card URL</label>
                  <div className="flex gap-1">
                    <input 
                      readOnly 
                      value={cardUrl} 
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white/70 font-mono focus:outline-none"
                    />
                    <Button variant="outline" size="icon" className="shrink-0 rounded-xl border-white/10" onClick={copyUrl}>
                      {copiedUrl ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">README Embed</label>
                  <div className="flex gap-1">
                    <input 
                      readOnly 
                      value={embedSnippet} 
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white/70 font-mono focus:outline-none"
                    />
                    <Button variant="outline" size="icon" className="shrink-0 rounded-xl border-white/10" onClick={copyEmbed}>
                      {copiedEmbed ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white gap-2" onClick={shareOnLinkedIn}>
                <Share2 className="w-4 h-4" /> Share on LinkedIn
              </Button>
            </div>
          </div>

          {/* Right Column: Controls */}
          <div className="space-y-8 bg-[#0d0d0d] border border-white/10 rounded-2xl p-8 h-fit">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Layout</h3>
              <div className="grid gap-2">
                {LAYOUTS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      setImgLoading(true);
                      setLayout(l.id);
                    }}
                    className={`flex flex-col p-4 rounded-xl border text-left transition-all ${
                      layout === l.id 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/50' 
                        : 'border-white/5 bg-[#111] hover:border-white/20'
                    }`}
                  >
                    <span className="text-sm font-bold text-white leading-none">{l.label}</span>
                    <span className="text-[11px] text-gray-500 mt-1">{l.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Accent Color</h3>
              <div className="flex gap-3">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => {
                      setImgLoading(true);
                      setAccent(color.name);
                    }}
                    className={`w-10 h-10 rounded-full border-4 transition-all ${
                      accent === color.name 
                        ? 'border-white scale-110 shadow-lg' 
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Modules</h3>
              <div className="space-y-3">
                {[
                  { id: 'albumArt', label: 'Show album art' },
                  { id: 'vibe', label: 'Show vibe' },
                  { id: 'project', label: 'Show project' },
                  { id: 'openToWork', label: 'Open to work badge' },
                ].map((mod) => (
                  <div key={mod.id} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-300 font-medium">{mod.label}</span>
                    <Switch
                      checked={!hiddenModules.includes(mod.id)}
                      onCheckedChange={() => {
                        setImgLoading(true);
                        toggleModule(mod.id);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</h3>
              <Button 
                variant="outline" 
                className="w-full rounded-xl border-white/10 bg-[#1a1a1a] hover:bg-[#222] text-white gap-2"
                onClick={() => router.push('/onboarding')}
              >
                <Pencil className="w-4 h-4" /> Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
