"use client";
import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { MockCard } from "@/components/MockCard";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";

const Landing = () => {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) router.push('/dashboard');
  }, [isSignedIn, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Your dev identity. Live.
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            A dynamic card for your GitHub README showing what you're building,
            listening to, and vibing with right now.
          </p>
          <Button size="lg" onClick={() => router.push("/onboarding")} className="mt-4">
            Get your card
          </Button>
        </div>

        {/* Mock Card */}
        <div className="mt-16 w-full max-w-md">
          <MockCard />
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-12">
          {["Live music", "Current project", "Open to work badge"].map((feature) => (
            <span
              key={feature}
              className="px-4 py-2 rounded-full border border-border text-sm text-muted-foreground bg-card"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* How it works */}
        <section className="mt-24 w-full max-w-2xl">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: 1,
                title: "Sign in with Google",
                desc: "One click to create your account. No passwords, no friction.",
              },
              {
                step: 2,
                title: "Connect Last.fm & fill your profile",
                desc: "Link your music, share what you're building, and set your vibe.",
              },
              {
                step: 3,
                title: "Embed in your README",
                desc: "Copy the markdown snippet into your GitHub profile. It updates live.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="text-center space-y-3 p-5 rounded-xl border border-border bg-card"
              >
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary/15 text-primary text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="text-foreground font-semibold text-sm">{item.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-muted-foreground border-t border-border">
        NowCard · nowcard.store
      </footer>
    </div>
  );
};

export default Landing;
