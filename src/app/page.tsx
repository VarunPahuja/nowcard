"use client";
import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { ArrowRight, Music, Layers, Briefcase, Zap } from "lucide-react";

// 7 hardcoded cards with different people and songs
const CARDS = [
  {
    layout: "default",
    name: "Default",
    bg: "#111111",
    stroke: "#222222",
    height: 200,
    song: "All Mirrors",
    artist: "Angel Olsen",
    project: "ml-portfolio-v2",
    vibe: "deep focus",
    albumBg: "#1a1a2e",
    albumUrl: "https://upload.wikimedia.org/wikipedia/en/f/f1/Angel_Olsen_-_All_Mirrors.png",
    dark: true,
  },
  {
    layout: "soft",
    name: "Soft",
    bg: "#fafafa",
    stroke: "#e5e5e5",
    height: 160,
    song: "Motion Sickness",
    artist: "Phoebe Bridgers",
    project: "design-system",
    vibe: "creative mode",
    albumBg: "#e8e8f0",
    albumUrl: "https://upload.wikimedia.org/wikipedia/en/d/df/Phoebe_bridgers_motion_sickness.jpg",
    dark: false,
  },
  {
    layout: "compact",
    name: "Compact",
    bg: "#ffffff",
    stroke: "#e0e0e0",
    height: 80,
    song: "Cigarette Daydreams",
    artist: "Cage The Elephant",
    project: "open-source-cli",
    vibe: "shipping fast",
    albumBg: "#f0f0f0",
    albumUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/1/1e/Cage_the_Elephant_Melophobia.jpg/250px-Cage_the_Elephant_Melophobia.jpg",
    dark: false,
  },
  {
    layout: "hero",
    name: "Hero",
    bg: "#0d0d0d",
    stroke: "none",
    height: 240,
    song: "Stargazing",
    artist: "Travis Scott",
    project: "react-hooks-lib",
    vibe: "locked in",
    albumBg: "#1a0a2e",
    albumUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/4/4b/Travis_Scott_-_Astroworld.png/250px-Travis_Scott_-_Astroworld.png",
    dark: true,
  },
  {
    layout: "grid",
    name: "Grid",
    bg: "#ffffff",
    stroke: "#eeeeee",
    height: 200,
    song: "Apocalypse",
    artist: "Cigarettes After Sex",
    project: "fintech-dashboard",
    vibe: "late night grind",
    albumBg: "#f0f0f0",
    albumUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/Cigarettes_After_Sex_-_Apocalypse.png/250px-Cigarettes_After_Sex_-_Apocalypse.png",
    dark: false,
  },
  {
    layout: "minimal",
    name: "Minimal",
    bg: "#f8f8f8",
    stroke: "#dddddd",
    height: 130,
    song: "White Ferrari",
    artist: "Frank Ocean",
    project: "portfolio-v3",
    vibe: "in the zone",
    albumBg: "#e8e8e8",
    albumUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a0/Blonde_-_Frank_Ocean.jpeg/250px-Blonde_-_Frank_Ocean.jpeg",
    dark: false,
  },
  {
    layout: "gradient",
    name: "Gradient",
    bg: "#ffffff",
    stroke: "none",
    height: 180,
    song: "Ivy",
    artist: "Frank Ocean",
    project: "ai-side-project",
    vibe: "building in public",
    albumBg: "#f0e8f8",
    albumUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a0/Blonde_-_Frank_Ocean.jpeg/250px-Blonde_-_Frank_Ocean.jpeg",
    dark: false,
  },
];

function DefaultCard({ d }: { d: typeof CARDS[0] }) {
  return (
    <svg width="380" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="rectClipDefault">
          <rect x="292" y="16" width="72" height="72" rx="10" />
        </clipPath>
      </defs>
      <rect width="380" height="200" rx="14" fill="#111111" stroke="#222222" strokeWidth="1" />
      <circle cx="20" cy="28" r="4" fill="#22c55e" />
      <text x="30" y="33" fontFamily="Inter,sans-serif" fontSize="9" fill="#22c55e" letterSpacing="2">NOW PLAYING</text>
      <rect x="292" y="16" width="72" height="72" rx="10" fill="#222" />
      <image href={d.albumUrl} x="292" y="16" width="72" height="72" clipPath="url(#rectClipDefault)" preserveAspectRatio="xMidYMid slice" />
      <text x="20" y="68" fontFamily="Inter,sans-serif" fontSize="18" fontWeight="700" fill="#ffffff">{d.song}</text>
      <text x="20" y="88" fontFamily="Inter,sans-serif" fontSize="12" fill="#888888">{d.artist}</text>
      <line x1="20" y1="104" x2="280" y2="104" stroke="#222222" strokeWidth="1" />
      <text x="20" y="122" fontFamily="Inter,sans-serif" fontSize="11" fill="#888888">Project: <tspan fill="#ffffff">{d.project}</tspan></text>
      <text x="20" y="140" fontFamily="Inter,sans-serif" fontSize="11" fill="#888888">Vibe: <tspan fill="#ffffff">{d.vibe}</tspan></text>
      <rect x="20" y="158" width="170" height="24" rx="12" fill="none" stroke="#22c55e" strokeWidth="1.5" />
      <text x="105" y="174" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="10" fontWeight="700" fill="#22c55e">✓  OPEN TO WORK: YES</text>
    </svg>
  );
}

function SoftCard({ d }: { d: typeof CARDS[0] }) {
  return (
    <svg width="380" height="160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="rectClipSoft">
          <rect x="14" y="35" width="90" height="90" rx="12" />
        </clipPath>
      </defs>
      <rect width="380" height="160" rx="16" fill="#fafafa" stroke="#e5e5e5" strokeWidth="1" />
      <text x="116" y="46" fontFamily="Inter,sans-serif" fontSize="8" fill="#999" letterSpacing="1.5">NOW PLAYING</text>
      <rect x="14" y="35" width="90" height="90" rx="12" fill="#f0f0f0" />
      <image href={d.albumUrl} x="14" y="35" width="90" height="90" clipPath="url(#rectClipSoft)" preserveAspectRatio="xMidYMid slice" />
      <text x="116" y="66" fontFamily="Inter,sans-serif" fontSize="16" fontWeight="700" fill="#111">{d.song}</text>
      <text x="116" y="84" fontFamily="Inter,sans-serif" fontSize="12" fill="#666">{d.artist}</text>
      <text x="116" y="104" fontFamily="Inter,sans-serif" fontSize="11" fill="#999">Project: <tspan fill="#333">{d.project}</tspan></text>
      <text x="116" y="120" fontFamily="Inter,sans-serif" fontSize="11" fill="#999">Vibe: <tspan fill="#333">{d.vibe}</tspan></text>
      <rect x="280" y="128" width="84" height="20" rx="10" fill="none" stroke="#22c55e" strokeWidth="1" />
      <text x="322" y="142" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="9" fontWeight="700" fill="#22c55e">AVAILABLE</text>
    </svg>
  );
}

function CompactCard({ d }: { d: typeof CARDS[0] }) {
  return (
    <svg width="380" height="80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="rectClipCompact">
          <rect x="12" y="12" width="56" height="56" rx="8" />
        </clipPath>
      </defs>
      <rect width="380" height="80" rx="10" fill="#ffffff" stroke="#e0e0e0" strokeWidth="1" />
      <rect x="12" y="12" width="56" height="56" rx="8" fill="#f5f5f5" />
      <image href={d.albumUrl} x="12" y="12" width="56" height="56" clipPath="url(#rectClipCompact)" preserveAspectRatio="xMidYMid slice" />
      <text x="78" y="28" fontFamily="Inter,sans-serif" fontSize="8" fill="#999">NOW PLAYING</text>
      <text x="78" y="46" fontFamily="Inter,sans-serif" fontSize="13" fontWeight="700" fill="#111">{d.song}</text>
      <text x="78" y="62" fontFamily="Inter,sans-serif" fontSize="11" fill="#777">{d.artist}</text>
      <text x="220" y="38" fontFamily="Inter,sans-serif" fontSize="10" fill="#777">P: <tspan fill="#333">{d.project.slice(0, 14)}</tspan></text>
      <text x="220" y="54" fontFamily="Inter,sans-serif" fontSize="10" fill="#777">V: <tspan fill="#333">{d.vibe}</tspan></text>
      <circle cx="348" cy="40" r="3" fill="#22c55e" />
      <text x="356" y="44" fontFamily="Inter,sans-serif" fontSize="9" fontWeight="700" fill="#22c55e">OPEN</text>
    </svg>
  );
}

function HeroCard({ d }: { d: typeof CARDS[0] }) {
  return (
    <svg width="380" height="240" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="circleClipHero">
          <circle cx="190" cy="52" r="32" />
        </clipPath>
      </defs>
      <rect width="380" height="240" rx="16" fill="#0d0d0d" />
      <circle cx="190" cy="52" r="32" fill="#222" />
      <image href={d.albumUrl} x="158" y="20" width="64" height="64" clipPath="url(#circleClipHero)" preserveAspectRatio="xMidYMid slice" />
      <text x="190" y="106" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="20" fontWeight="700" fill="#ffffff">{d.song}</text>
      <text x="190" y="126" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="13" fill="#888888">{d.artist}</text>
      <text x="190" y="152" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="11" fill="#666">Project: <tspan fill="#aaa">{d.project}</tspan></text>
      <text x="190" y="170" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="11" fill="#666">Vibe: <tspan fill="#aaa">{d.vibe}</tspan></text>
      <rect x="115" y="192" width="150" height="28" rx="14" fill="#22c55e" />
      <text x="190" y="210" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="10" fontWeight="700" fill="#000">OPEN TO WORK: YES</text>
    </svg>
  );
}

function GridCard({ d }: { d: typeof CARDS[0] }) {
  return (
    <svg width="380" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="rectClipGrid">
          <rect x="22" y="24" width="32" height="32" rx="4" />
        </clipPath>
      </defs>
      <rect width="380" height="200" rx="12" fill="#ffffff" stroke="#eeeeee" strokeWidth="1" />
      <rect x="10" y="10" width="176" height="86" rx="8" fill="#f9f9f9" stroke="#eee" strokeWidth="1" />
      <rect x="22" y="24" width="32" height="32" rx="4" fill="#eee" />
      <image href={d.albumUrl} x="22" y="24" width="32" height="32" clipPath="url(#rectClipGrid)" preserveAspectRatio="xMidYMid slice" />
      <text x="62" y="36" fontFamily="Inter,sans-serif" fontSize="12" fontWeight="700" fill="#111">{d.song.slice(0, 12)}</text>
      <text x="62" y="52" fontFamily="Inter,sans-serif" fontSize="10" fill="#777">{d.artist.slice(0, 14)}</text>
      <rect x="194" y="10" width="176" height="86" rx="8" fill="#f9f9f9" stroke="#eee" strokeWidth="1" />
      <text x="206" y="32" fontFamily="Inter,sans-serif" fontSize="8" fontWeight="700" fill="#999">PROJECT</text>
      <text x="206" y="54" fontFamily="Inter,sans-serif" fontSize="12" fontWeight="700" fill="#111">{d.project.slice(0, 14)}</text>
      <rect x="10" y="104" width="176" height="86" rx="8" fill="#f9f9f9" stroke="#eee" strokeWidth="1" />
      <text x="22" y="126" fontFamily="Inter,sans-serif" fontSize="8" fontWeight="700" fill="#999">VIBE</text>
      <text x="22" y="148" fontFamily="Inter,sans-serif" fontSize="12" fontWeight="700" fill="#111">{d.vibe}</text>
      <rect x="194" y="104" width="176" height="86" rx="8" fill="#dcfce7" stroke="#bbf7d0" strokeWidth="1" />
      <text x="282" y="152" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="9" fontWeight="700" fill="#166534">OPEN TO WORK</text>
    </svg>
  );
}

function MinimalCard({ d }: { d: typeof CARDS[0] }) {
  return (
    <svg width="380" height="130" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="rectClipMinimal">
          <rect x="20" y="40" width="40" height="40" rx="8" />
        </clipPath>
      </defs>
      <rect width="380" height="130" rx="8" fill="#f8f8f8" stroke="#dddddd" strokeWidth="1" />
      <text x="20" y="28" fontFamily="Inter,sans-serif" fontSize="8" fill="#aaaaaa" letterSpacing="1">NOW PLAYING</text>

      <rect x="20" y="40" width="40" height="40" rx="8" fill="#eee" />
      <image href={d.albumUrl} x="20" y="40" width="40" height="40" clipPath="url(#rectClipMinimal)" preserveAspectRatio="xMidYMid slice" />

      <text x="70" y="55" fontFamily="Inter,sans-serif" fontSize="15" fontWeight="700" fill="#111111">{d.song}</text>
      <text x="70" y="72" fontFamily="Inter,sans-serif" fontSize="11" fill="#777">{d.artist}</text>

      <text x="20" y="100" fontFamily="Inter,sans-serif" fontSize="11" fill="#888888">Project: <tspan fill="#444444" fontWeight="500">{d.project}</tspan></text>
      <text x="20" y="116" fontFamily="Inter,sans-serif" fontSize="11" fill="#888888">Vibe: <tspan fill="#444444" fontWeight="500">{d.vibe}</tspan></text>
    </svg>
  );
}

function GradientCard({ d }: { d: typeof CARDS[0] }) {
  return (
    <svg width="380" height="180" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`grad_${d.layout}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <clipPath id="rectClipGradient">
          <rect x="24" y="44" width="48" height="48" rx="8" />
        </clipPath>
      </defs>
      <rect width="380" height="180" rx="14" fill={`url(#grad_${d.layout})`} />
      <rect x="3" y="3" width="374" height="174" rx="12" fill="#ffffff" />
      <text x="190" y="32" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="8" fill="#999" letterSpacing="1">NOW PLAYING</text>

      <rect x="24" y="44" width="48" height="48" rx="8" fill="#f5f5f5" />
      <image href={d.albumUrl} x="24" y="44" width="48" height="48" clipPath="url(#rectClipGradient)" preserveAspectRatio="xMidYMid slice" />

      <text x="82" y="60" textAnchor="start" fontFamily="Inter,sans-serif" fontSize="16" fontWeight="700" fill="#111">{d.song}</text>
      <text x="82" y="78" textAnchor="start" fontFamily="Inter,sans-serif" fontSize="11" fill="#777">{d.artist}</text>

      <rect x="20" y="105" width="164" height="28" rx="14" fill="#f3f4f6" />
      <text x="102" y="123" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="10" fill="#333">P: {d.project.slice(0, 14)}</text>
      <rect x="196" y="105" width="164" height="28" rx="14" fill="#f3f4f6" />
      <text x="278" y="123" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="10" fill="#333">V: {d.vibe}</text>
      <rect x="110" y="142" width="160" height="24" rx="12" fill="#dcfce7" />
      <text x="190" y="158" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="9" fontWeight="700" fill="#166534">OPEN TO WORK: YES</text>
    </svg>
  );
}

function CardPreview({ d }: { d: typeof CARDS[0] }) {
  switch (d.layout) {
    case "default": return <DefaultCard d={d} />;
    case "soft": return <SoftCard d={d} />;
    case "compact": return <CompactCard d={d} />;
    case "hero": return <HeroCard d={d} />;
    case "grid": return <GridCard d={d} />;
    case "minimal": return <MinimalCard d={d} />;
    case "gradient": return <GradientCard d={d} />;
    default: return <DefaultCard d={d} />;
  }
}

export default function Landing() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) router.push('/dashboard');
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Nav />

      {/* Hero — tight, no wasted space */}
      <main className="pt-20 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/50 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            Live updates · Free forever · No OAuth needed
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tighter leading-tight text-white">
            Your dev identity.<br />
            <span className="text-white/40">Live.</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-lg mx-auto leading-relaxed">
            A dynamic card for your GitHub README. Shows what you're building,
            listening to, and vibing with — updated in real time.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => router.push(isSignedIn ? "/dashboard" : "/onboarding")}
              className="h-12 px-8 text-base font-bold rounded-xl bg-white text-black hover:bg-white/90 flex items-center gap-2 transition-all"
            >
              Get your card <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push("/how-to")}
              className="h-12 px-8 text-base font-medium rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
            >
              How it works
            </button>
          </div>
        </div>
      </main>

      {/* Card showcase — MAIN FEATURE, front and center */}
      <section className="py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white">7 layouts. One identity.</h2>
            <span className="text-xs text-white/30">Pick yours on the dashboard</span>
          </div>

          {/* Masonry-style layout showing all 7 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Default — full width on first row */}
            <div className="lg:col-span-2 group">
              <div className="p-4 rounded-2xl bg-[#0d0d0d] border border-white/5 hover:border-white/15 transition-all duration-300">
                <div className="overflow-x-auto">
                  <DefaultCard d={CARDS[0]} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-white/40 uppercase tracking-wide">Default</span>
                  <span className="text-xs text-white/20">Dark · Album art · All fields</span>
                </div>
              </div>
            </div>

            {/* Hero — tall card */}
            <div className="group">
              <div className="p-4 rounded-2xl bg-[#0d0d0d] border border-white/5 hover:border-white/15 transition-all duration-300">
                <div className="overflow-x-auto">
                  <HeroCard d={CARDS[3]} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-white/40 uppercase tracking-wide">Hero</span>
                  <span className="text-xs text-white/20">Centered · Bold</span>
                </div>
              </div>
            </div>

            {/* Soft */}
            <div className="group">
              <div className="p-4 rounded-2xl bg-[#0d0d0d] border border-white/5 hover:border-white/15 transition-all duration-300">
                <div className="overflow-x-auto">
                  <SoftCard d={CARDS[1]} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-white/40 uppercase tracking-wide">Soft</span>
                  <span className="text-xs text-white/20">Light · Clean</span>
                </div>
              </div>
            </div>

            {/* Grid — spans 2 cols */}
            <div className="lg:col-span-2 group">
              <div className="p-4 rounded-2xl bg-[#0d0d0d] border border-white/5 hover:border-white/15 transition-all duration-300">
                <div className="overflow-x-auto">
                  <GridCard d={CARDS[4]} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-white/40 uppercase tracking-wide">Grid</span>
                  <span className="text-xs text-white/20">Modular · Dashboard feel</span>
                </div>
              </div>
            </div>

            {/* Compact — full width */}
            <div className="lg:col-span-3 group">
              <div className="p-4 rounded-2xl bg-[#0d0d0d] border border-white/5 hover:border-white/15 transition-all duration-300">
                <div className="overflow-x-auto">
                  <CompactCard d={CARDS[2]} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-white/40 uppercase tracking-wide">Compact</span>
                  <span className="text-xs text-white/20">Minimal height · Best for tight READMEs</span>
                </div>
              </div>
            </div>

            {/* Minimal */}
            <div className="group">
              <div className="p-4 rounded-2xl bg-[#0d0d0d] border border-white/5 hover:border-white/15 transition-all duration-300">
                <div className="overflow-x-auto">
                  <MinimalCard d={CARDS[5]} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-white/40 uppercase tracking-wide">Minimal</span>
                  <span className="text-xs text-white/20">Text only · No image</span>
                </div>
              </div>
            </div>

            {/* Gradient — spans 2 cols */}
            <div className="lg:col-span-2 group">
              <div className="p-4 rounded-2xl bg-[#0d0d0d] border border-white/5 hover:border-white/15 transition-all duration-300">
                <div className="overflow-x-auto">
                  <GradientCard d={CARDS[6]} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-white/40 uppercase tracking-wide">Gradient</span>
                  <span className="text-xs text-white/20">Colorful · Eye-catching</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features strip — compact, no massive padding */}
      <section className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Music, title: "Live music", desc: "Syncs via Last.fm. Works with Spotify." },
            { icon: Layers, title: "7 layouts", desc: "From minimal to full hero designs." },
            { icon: Zap, title: "Real-time", desc: "README stays fresh automatically." },
            { icon: Briefcase, title: "Open to work", desc: "Signal availability to recruiters." },
          ].map((item, i) => (
            <div key={i} className="p-5 rounded-xl bg-[#0d0d0d] border border-white/5 hover:border-white/15 transition-colors flex gap-4 items-start">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — compact */}
      <section className="py-12 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-8 text-center">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Create Last.fm", desc: "Free account. Connect Spotify to scrobble automatically." },
              { step: "02", title: "Setup profile", desc: "Enter your username, project, vibe. Takes 2 minutes." },
              { step: "03", title: "Embed in README", desc: "Copy one line of markdown. Done." },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 items-start">
                <span className="text-2xl font-black text-white/10 flex-shrink-0 w-10">{item.step}</span>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <button
              onClick={() => router.push("/onboarding")}
              className="h-11 px-8 text-sm font-bold rounded-xl bg-white text-black hover:bg-white/90 transition-all"
            >
              Get your card for free →
            </button>
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-white/5 text-center px-6">
        <p className="text-gray-600 text-xs">NowCard · Dynamic README cards for developers · <a href="/how-to" className="hover:text-white/40 transition-colors">How it works</a></p>
      </footer>
    </div>
  );
}