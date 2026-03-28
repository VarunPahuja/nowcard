export const MockCard = () => {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold text-sm">
          VV
        </div>
        <div>
          <div className="text-foreground font-semibold text-sm">vvannavv</div>
          <div className="text-muted-foreground text-xs">Full-stack developer</div>
        </div>
        <span className="ml-auto px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium">
          Open to work
        </span>
      </div>

      {/* Now Playing */}
      <div className="flex items-center gap-2.5 p-3 rounded-md bg-muted/50">
        <div className="flex items-center gap-1.5">
          <span className="w-1 h-3 bg-primary rounded-full animate-pulse" />
          <span className="w-1 h-4 bg-primary rounded-full animate-pulse [animation-delay:150ms]" />
          <span className="w-1 h-2.5 bg-primary rounded-full animate-pulse [animation-delay:300ms]" />
        </div>
        <div className="min-w-0">
          <div className="text-foreground text-xs font-medium truncate">Nightcall — Kavinsky</div>
          <div className="text-muted-foreground text-[11px]">via Last.fm</div>
        </div>
      </div>

      {/* Project & Vibe */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-md bg-muted/50">
          <div className="text-muted-foreground text-[11px] uppercase tracking-wider mb-1">Building</div>
          <div className="text-foreground text-xs font-medium">NowCard</div>
        </div>
        <div className="p-3 rounded-md bg-muted/50">
          <div className="text-muted-foreground text-[11px] uppercase tracking-wider mb-1">Vibe</div>
          <div className="text-foreground text-xs font-medium">shipping fast 🚀</div>
        </div>
      </div>
    </div>
  );
};
