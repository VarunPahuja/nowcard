"use client";
import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { MockCard } from "@/components/MockCard";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { ArrowRight, Music, Layers, Briefcase, Zap } from "lucide-react";

export default function Landing() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) router.push('/dashboard');
  }, [isLoaded, isSignedIn, router]);

  const layouts = [
    "Default", "Soft", "Compact", "Hero", "Grid", "Minimal", "Gradient"
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Nav />

      {/* Hero Section */}
      <main className="relative pt-24 pb-32 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-transparent pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto text-center space-y-10 relative z-10">
          <div className="space-y-6">
            <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tighter leading-[1] bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
              Your dev identity.<br />Live.
            </h1>
            <p className="text-xl text-gray-400 max-w-xl mx-auto font-medium leading-relaxed">
              A dynamic card for your GitHub README. Shows what you&apos;re building,
              listening to, and vibing with — updated in real time.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => router.push(isSignedIn ? "/dashboard" : "/onboarding")} 
              className="h-14 px-10 text-lg font-bold rounded-2xl bg-white text-black hover:bg-white/90 group"
            >
              Get your card <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-14 px-10 text-lg font-bold rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              onClick={() => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore layouts
            </Button>
          </div>

          {/* Main Mockup */}
          <div className="mt-20 flex justify-center perspective-[1000px]">
            <div className="rotate-x-6 rotate-y--6 transition-transform duration-700 hover:rotate-x-0 hover:rotate-y-0">
               <MockCard />
            </div>
          </div>
        </div>
      </main>

      {/* Layout Showcase */}
      <section id="showcase" className="py-24 bg-[#0a0a0a] border-y border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-12 flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">One card, many vibes.</h2>
          <div className="hidden sm:flex gap-2">
            <div className="w-10 h-1 rounded-full bg-white/20"></div>
            <div className="w-4 h-1 rounded-full bg-white/10"></div>
            <div className="w-4 h-1 rounded-full bg-white/10"></div>
          </div>
        </div>
        
        <div className="flex gap-8 px-6 animate-scroll whitespace-nowrap overflow-x-auto pb-8 no-scrollbar">
          {layouts.map((l) => (
            <div key={l} className="flex-none p-4 rounded-2xl bg-white/5 border border-white/10 w-64 text-center space-y-3">
              <div className="h-32 bg-white/5 rounded-xl flex items-center justify-center font-bold text-white/20 text-4xl">
                {l[0]}
              </div>
              <p className="font-bold text-white/80">{l} Layout</p>
            </div>
          ))}
          {/* Duplicate for infinite scroll feel if needed, but simple horizontal scroll for now */}
        </div>
      </section>

      {/* Why NowCard */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Music, title: "Live Music", desc: "Sync your Last.fm to show what's currently playing." },
            { icon: Layers, title: "7 Layouts", desc: "From minimal text-only to full hero designs." },
            { icon: Zap, title: "Real-time", desc: "No manual updates. Your README stays fresh automatically." },
            { icon: Briefcase, title: "Open to Work", desc: "Let recruiters know you're available for new roles." },
          ].map((item, i) => (
            <div key={i} className="p-8 rounded-2xl bg-[#0d0d0d] border border-white/5 space-y-4 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-primary">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 bg-[#0a0a0a] border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-16">
          <h2 className="text-4xl font-bold tracking-tight text-white mb-10">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-12 relative">
             <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -z-10 hidden sm:block"></div>
            {[
              { step: 1, title: "Create Last.fm", desc: "Sign up and connect Spotify to it." },
              { step: 2, title: "Setup Profile", desc: "Enter your username and project vibe." },
              { step: 3, title: "Embed Card", desc: "Copy the markdown to your README." },
            ].map((item) => (
              <div key={item.step} className="space-y-4 bg-[#0a0a0a] px-4 py-8 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-white text-black text-xl font-black flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
          <Button 
            size="lg" 
            onClick={() => router.push("/onboarding")} 
            className="h-14 px-12 text-lg font-bold rounded-2xl bg-white text-black hover:bg-white/90"
          >
            Start Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center px-6">
        <p className="text-gray-600 text-sm font-medium">NowCard · Dynamic README Badges · Created with ❤️ for developers</p>
      </footer>
    </div>
  );
}
