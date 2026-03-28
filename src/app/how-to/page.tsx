import Nav from "@/components/Nav";

const steps = [
  {
    number: 1,
    title: "Create a Last.fm account",
    description:
      "Head to last.fm/join and create a free account. This is how NowCard tracks what you're listening to in real time.",
  },
  {
    number: 2,
    title: "Connect Spotify to Last.fm",
    description:
      "In your Last.fm settings, go to Applications → Connect Spotify. This lets Last.fm scrobble your listening history automatically.",
  },
  {
    number: 3,
    title: "Sign in to NowCard with Google",
    description:
      'Click "Get your card" on the homepage and sign in with your Google account. That\'s it — no passwords to remember.',
  },
  {
    number: 4,
    title: "Enter your Last.fm username and verify",
    description:
      "On the onboarding page, type your Last.fm username and hit Verify. We'll confirm your account and pull your scrobble count.",
  },
  {
    number: 5,
    title: "Fill in your project and vibe",
    description:
      'Tell the world what you\'re building and your current vibe. Toggle "Open to work" if you\'re looking for opportunities.',
  },
  {
    number: 6,
    title: "Copy the embed code into your GitHub README",
    description:
      "Copy the markdown snippet and paste it into your GitHub profile README. Your card updates automatically — no redeployment needed.",
  },
];

const HowTo = () => {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-xl mx-auto px-4 py-16 space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">How it works</h1>
          <p className="text-muted-foreground text-sm">
            Get your live developer card in 6 simple steps.
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex gap-4 p-5 rounded-xl border border-border bg-card"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-sm font-bold">
                {step.number}
              </div>
              <div className="space-y-1">
                <h3 className="text-foreground font-semibold text-sm">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default HowTo;
