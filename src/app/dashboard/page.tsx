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
  const [imgLoading, setImgLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const [showAlbumArt, setShowAlbumArt] = useState(true);
  const [showVibe, setShowVibe] = useState(true);
  const [showProject, setShowProject] = useState(true);
  const [showOpenToWork, setShowOpenToWork] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editProject, setEditProject] = useState('');
  const [editVibe, setEditVibe] = useState('');
  const [editOpenToWork, setEditOpenToWork] = useState(true);
  const [editLastfm, setEditLastfm] = useState('');
  const [saving, setSaving] = useState(false);
  const [cardKey, setCardKey] = useState(0);

  useEffect(() => {
    if (authLoaded && !isSignedIn) router.push('/');
  }, [authLoaded, isSignedIn, router]);

  useEffect(() => {
    if (user?.unsafeMetadata) {
      const meta = user.unsafeMetadata as any;
      setEditProject(meta.project || '');
      setEditVibe(meta.vibe || '');
      setEditOpenToWork(meta.openToWork ?? true);
      setEditLastfm(meta.lastfmUsername || '');
    }
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    await user?.update({
      unsafeMetadata: {
        project: editProject,
        vibe: editVibe,
        openToWork: editOpenToWork,
        lastfmUsername: editLastfm,
      },
    });
    setSaving(false);
    setIsEditing(false);
    setCardKey(prev => prev + 1);
  };

  const hiddenModules = useMemo(() => {
    const hidden: string[] = [];
    if (!showAlbumArt) hidden.push('albumart');
    if (!showVibe) hidden.push('vibe');
    if (!showProject) hidden.push('project');
    if (!showOpenToWork) hidden.push('opentowork');
    return hidden;
  }, [showAlbumArt, showVibe, showProject, showOpenToWork]);

  const cardUrl = useMemo(() => {
    if (!user?.id) return "";
    const base = `https://www.nowcard.store/api/card/${user.id}`;
    const params = new URLSearchParams();
    if (layout !== 'default') params.set('layout', layout);
    if (accent !== 'green') params.set('accent', accent);
    if (hiddenModules.length > 0) params.set('hide', hiddenModules.join(','));
    const query = params.toString();
    return query ? `${base}?${query}` : base;
  }, [layout, accent, hiddenModules, user?.id, editOpenToWork]);

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

  // Actions replaced with inline save

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
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d0d] z-10 transition-opacity duration-200">
                      <div className="w-full max-w-[480px] h-[200px] animate-pulse bg-white/5 rounded-xl flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div className="w-[480px] min-h-[200px] flex items-center justify-center">
                    <img
                      key={cardKey + cardUrl}
                      src={cardUrl}
                      alt="NowCard Live Preview"
                      className={`max-w-full transition-opacity duration-200 ${imgLoading ? 'opacity-0' : 'opacity-100'}`}
                      onLoad={() => setImgLoading(false)}
                      onError={() => setImgLoading(false)}
                    />
                  </div>
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
                    <Button variant="outline" className={`h-10 shrink-0 rounded-xl border-white/10 transition-colors ${copiedUrl ? 'bg-green-500/10 text-green-500 border-green-500/50 hover:bg-green-500/20' : ''}`} onClick={copyUrl}>
                      {copiedUrl ? <><Check className="w-4 h-4 mr-2" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> Copy</>}
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
                    <Button variant="outline" className={`h-10 shrink-0 rounded-xl border-white/10 transition-colors ${copiedEmbed ? 'bg-green-500/10 text-green-500 border-green-500/50 hover:bg-green-500/20' : ''}`} onClick={copyEmbed}>
                      {copiedEmbed ? <><Check className="w-4 h-4 mr-2" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> Copy</>}
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
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-white">Show album art</span>
                  <Switch checked={showAlbumArt} onCheckedChange={(val) => { setImgLoading(true); setShowAlbumArt(val); }} />
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-white">Show vibe</span>
                  <Switch checked={showVibe} onCheckedChange={(val) => { setImgLoading(true); setShowVibe(val); }} />
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-white">Show project</span>
                  <Switch checked={showProject} onCheckedChange={(val) => { setImgLoading(true); setShowProject(val); }} />
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-white">Open to work badge</span>
                  <Switch checked={showOpenToWork} onCheckedChange={(val) => { setImgLoading(true); setShowOpenToWork(val); }} />
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Profile Info</h3>
              <Button 
                variant="outline" 
                className="w-full rounded-xl border-white/10 bg-[#1a1a1a] hover:bg-[#222] text-white gap-2"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Pencil className="w-4 h-4" /> {isEditing ? 'Cancel editing' : 'Edit card info'}
              </Button>

              {isEditing && (
                <div className="space-y-3 mt-4 p-4 bg-[#1a1a1a] rounded-xl border border-[#333]">
                  <div>
                    <label className="text-xs text-[#888] mb-1 block">Last.fm username</label>
                    <input
                      value={editLastfm}
                      onChange={e => setEditLastfm(e.target.value)}
                      className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm"
                      placeholder="your-lastfm-username"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#888] mb-1 block">Current project</label>
                    <input
                      value={editProject}
                      onChange={e => setEditProject(e.target.value)}
                      className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm"
                      placeholder="e.g. NowCard"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#888] mb-1 block">Vibe</label>
                    <input
                      value={editVibe}
                      onChange={e => setEditVibe(e.target.value)}
                      className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm"
                      placeholder="e.g. locked in, coasting"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-[#888]">Open to work</label>
                    <Switch checked={editOpenToWork} onCheckedChange={setEditOpenToWork} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="flex-1 bg-[#22c55e] text-black font-semibold text-sm py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save changes'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 border border-[#333] text-white text-sm py-2 rounded-lg hover:border-[#555] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
