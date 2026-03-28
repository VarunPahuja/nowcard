export const MockCard = () => {
  return (
    <div className="w-full max-w-[480px] h-[200px] bg-[#111] border border-[#222] rounded-[14px] p-6 relative font-sans overflow-hidden shadow-2xl">
      {/* Status */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
        <span className="text-[#22c55e] text-[10px] font-bold tracking-[2px] uppercase">Now Playing</span>
      </div>

      {/* Content */}
      <div className="space-y-1">
        <h3 className="text-white text-xl font-bold leading-tight truncate pr-24">Nightcall</h3>
        <p className="text-[#888] text-sm truncate pr-24">Kavinsky</p>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#222] w-full my-4" />

      {/* Stats */}
      <div className="space-y-2">
        <p className="text-[#888] text-xs">
          Project: <span className="text-white font-medium">NowCard</span>
        </p>
        <p className="text-[#888] text-xs">
          Vibe: <span className="text-white font-medium">shipping fast 🚀</span>
        </p>
      </div>

      {/* Album Art */}
      <div className="absolute right-6 top-10 w-20 h-20 rounded-lg bg-[#222] overflow-hidden">
        <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">♪</div>
        <img 
          src="https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc4132b86b821ad9a.png" 
          alt="Mock Album"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Badge */}
      <div className="absolute right-6 bottom-6 px-3 py-1 rounded-full border border-[#22c55e] text-[#22c55e] text-[10px] font-bold tracking-wider">
        OPEN TO WORK: YES
      </div>
    </div>
  );
};
