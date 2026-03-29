import React from "react";

export function CardShowcase() {
  const GITHUB_ICON = `M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12`;

  const cards = [
    {
      name: "Default Layout",
      svg: (
        <svg width="480" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="480" height="200" rx="14" fill="#111111" stroke="#222222" strokeWidth="1"/>
          {/* Green dot + NOW PLAYING */}
          <circle cx="20" cy="28" r="4" fill="#22c55e"/>
          <text x="30" y="33" fontFamily="Inter, sans-serif" fontSize="10" fill="#22c55e" letterSpacing="2">NOW PLAYING</text>
          {/* Album art placeholder */}
          <rect x="380" y="16" width="84" height="84" rx="8" fill="#1a1a2e"/>
          {/* Song title */}
          <text x="20" y="72" fontFamily="Inter, sans-serif" fontSize="20" fontWeight="700" fill="#ffffff">All Mirrors</text>
          {/* Artist */}
          <text x="20" y="92" fontFamily="Inter, sans-serif" fontSize="13" fill="#888888">Angel Olsen</text>
          {/* Divider */}
          <line x1="20" y1="108" x2="360" y2="108" stroke="#222222" strokeWidth="1"/>
          {/* Project */}
          <text x="20" y="128" fontFamily="Inter, sans-serif" fontSize="12" fill="#888888">Project: <tspan fill="#ffffff">ml-portfolio-v2</tspan></text>
          {/* Vibe */}
          <text x="20" y="148" fontFamily="Inter, sans-serif" fontSize="12" fill="#888888">Vibe: <tspan fill="#ffffff">deep focus</tspan></text>
          {/* Open to work badge */}
          <rect x="20" y="164" width="180" height="24" rx="12" fill="none" stroke="#22c55e" strokeWidth="1.5"/>
          <text x="110" y="180" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="700" fill="#22c55e" letterSpacing="0.5">✓  OPEN TO WORK: YES</text>
        </svg>
      )
    },
    {
      name: "Soft Layout",
      svg: (
        <svg width="480" height="160" xmlns="http://www.w3.org/2000/svg">
          <rect width="480" height="160" rx="16" fill="#fafafa" stroke="#e5e5e5" strokeWidth="1"/>
          <rect x="16" y="30" width="100" height="100" rx="12" fill="#f0f0f0"/>
          <g transform="translate(132, 0)">
            <text x="0" y="40" fontFamily="sans-serif" fontSize="9" fill="#999" letterSpacing="1.5">NOW PLAYING</text>
            <text x="0" y="62" fontFamily="sans-serif" fontSize="18" fontWeight="bold" fill="#111">All Mirrors</text>
            <text x="0" y="80" fontFamily="sans-serif" fontSize="13" fill="#666">Angel Olsen</text>
            <text x="0" y="100" fontFamily="sans-serif" fontSize="12" fill="#999">Project: <tspan fill="#333">ml-portfolio-v2</tspan></text>
            <text x="0" y="116" fontFamily="sans-serif" fontSize="12" fill="#999">Vibe: <tspan fill="#333">deep focus</tspan></text>
          </g>
          <rect x="380" y="124" width="84" height="20" rx="10" fill="none" stroke="#22c55e" strokeWidth="1"/>
          <text x="422" y="138" textAnchor="middle" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#22c55e">AVAILABLE</text>
        </svg>
      )
    },
    {
      name: "Compact Layout",
      svg: (
        <svg width="480" height="80" xmlns="http://www.w3.org/2000/svg">
          <rect width="480" height="80" rx="10" fill="#ffffff" stroke="#e0e0e0" strokeWidth="1"/>
          <rect x="12" y="12" width="56" height="56" rx="6" fill="#f0f0f0"/>
          <g transform="translate(80, 0)">
            <text x="0" y="28" fontFamily="sans-serif" fontSize="9" fill="#999">NOW PLAYING</text>
            <text x="0" y="46" fontFamily="sans-serif" fontSize="14" fontWeight="bold" fill="#111">All Mirrors</text>
            <text x="0" y="62" fontFamily="sans-serif" fontSize="12" fill="#777">Angel Olsen</text>
          </g>
          <g transform="translate(320, 0)">
            <text x="0" y="40" fontFamily="sans-serif" fontSize="11" fill="#777">P: <tspan fill="#333">ml-portfolio-v2</tspan></text>
            <text x="0" y="56" fontFamily="sans-serif" fontSize="11" fill="#777">V: <tspan fill="#333">deep focus</tspan></text>
          </g>
          <circle cx="394" cy="40" r="3" fill="#22c55e"/>
          <text x="404" y="44" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#22c55e">AVAILABLE</text>
        </svg>
      )
    },
    {
      name: "Hero Layout",
      svg: (
        <svg width="480" height="240" xmlns="http://www.w3.org/2000/svg">
          <rect width="480" height="240" rx="16" fill="#0d0d0d"/>
          <circle cx="240" cy="56" r="36" fill="#1a1a2e"/>
          <text x="240" y="115" textAnchor="middle" fontFamily="sans-serif" fontSize="22" fontWeight="bold" fill="#ffffff">All Mirrors</text>
          <text x="240" y="135" textAnchor="middle" fontFamily="sans-serif" fontSize="14" fill="#888888">Angel Olsen</text>
          <text x="240" y="160" textAnchor="middle" fontFamily="sans-serif" fontSize="12" fill="#666">Project: <tspan fill="#aaa">ml-portfolio-v2</tspan></text>
          <text x="240" y="178" textAnchor="middle" fontFamily="sans-serif" fontSize="12" fill="#666">Vibe: <tspan fill="#aaa">deep focus</tspan></text>
          <rect x="165" y="195" width="150" height="28" rx="14" fill="#22c55e"/>
          <text x="240" y="213" textAnchor="middle" fontFamily="sans-serif" fontSize="11" fontWeight="bold" fill="#000">OPEN TO WORK: YES</text>
        </svg>
      )
    },
    {
      name: "Grid Layout",
      svg: (
        <svg width="480" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="480" height="200" rx="12" fill="#ffffff" stroke="#eeeeee" strokeWidth="1"/>
          {/* Row 1 */}
          <g transform="translate(14, 14)">
            <rect width="220" height="80" rx="8" fill="#f9f9f9"/>
            <rect x="12" y="22" width="36" height="36" rx="4" fill="#f0f0f0"/>
            <text x="56" y="36" fontFamily="sans-serif" fontSize="14" fontWeight="bold" fill="#111">All Mirrors</text>
            <text x="56" y="52" fontFamily="sans-serif" fontSize="11" fill="#777">Angel Olsen</text>
          </g>
          <g transform="translate(246, 14)">
            <rect width="220" height="80" rx="8" fill="#f9f9f9"/>
            <text x="16" y="30" fontFamily="sans-serif" fontSize="9" fontWeight="bold" fill="#999">PROJECT</text>
            <text x="16" y="52" fontFamily="sans-serif" fontSize="14" fontWeight="bold" fill="#111">ml-portfolio-v2</text>
          </g>
          {/* Row 2 */}
          <g transform="translate(14, 106)">
            <rect width="220" height="80" rx="8" fill="#f9f9f9"/>
            <text x="16" y="30" fontFamily="sans-serif" fontSize="9" fontWeight="bold" fill="#999">VIBE</text>
            <text x="16" y="52" fontFamily="sans-serif" fontSize="14" fontWeight="bold" fill="#111">deep focus</text>
          </g>
          <g transform="translate(246, 106)">
            <rect width="220" height="80" rx="8" fill="#dcfce7"/>
            <text x="110" y="44" textAnchor="middle" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#166534">OPEN TO WORK</text>
          </g>
        </svg>
      )
    },
    {
      name: "Minimal Layout",
      svg: (
        <svg width="480" height="130" xmlns="http://www.w3.org/2000/svg">
          <rect width="480" height="130" rx="8" fill="#f8f8f8" stroke="#dddddd" strokeWidth="1"/>
          <g transform="translate(20, 0)">
            <text x="0" y="28" fontFamily="sans-serif" fontSize="9" fill="#aaaaaa" letterSpacing="1">NOW PLAYING</text>
            <text x="0" y="50" fontFamily="sans-serif" fontSize="16" fontWeight="bold" fill="#111111">All Mirrors</text>
            <text x="0" y="74" fontFamily="sans-serif" fontSize="12" fill="#888888">Project: <tspan fill="#444444" fontWeight="500">ml-portfolio-v2</tspan></text>
            <text x="0" y="92" fontFamily="sans-serif" fontSize="12" fill="#888888">Vibe: <tspan fill="#444444" fontWeight="500">deep focus</tspan></text>
            <text x="0" y="112" fontFamily="sans-serif" fontSize="11" fontWeight="bold" fill="#22c55e">OPEN TO WORK: YES</text>
          </g>
          <path d={GITHUB_ICON} transform="translate(440, 20) scale(0.8)" fill="#ddd"/>
        </svg>
      )
    },
    {
      name: "Gradient Layout",
      svg: (
        <svg width="480" height="180" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad_showcase" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="1"/>
              <stop offset="50%" stopColor="#f97316" stopOpacity="1"/>
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="1"/>
            </linearGradient>
          </defs>
          <rect width="480" height="180" rx="14" fill="url(#grad_showcase)"/>
          <rect x="3" y="3" width="474" height="174" rx="12" fill="#ffffff"/>
          <text x="240" y="35" textAnchor="middle" fontFamily="sans-serif" fontSize="9" fill="#999" letterSpacing="1">NOW PLAYING</text>
          <text x="240" y="60" textAnchor="middle" fontFamily="sans-serif" fontSize="18" fontWeight="bold" fill="#111">All Mirrors</text>
          <g transform="translate(240, 95)">
            <rect x="-140" y="0" width="135" height="28" rx="14" fill="#f3f4f6"/>
            <text x="-72" y="18" textAnchor="middle" fontFamily="sans-serif" fontSize="11" fill="#333">P: ml-portfolio-v2</text>
            <rect x="5" y="0" width="135" height="28" rx="14" fill="#f3f4f6"/>
            <text x="72" y="18" textAnchor="middle" fontFamily="sans-serif" fontSize="11" fill="#333">V: deep focus</text>
          </g>
          <rect x="160" y="142" width="160" height="24" rx="12" fill="#dcfce7"/>
          <text x="240" y="158" textAnchor="middle" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#166534">OPEN TO WORK: YES</text>
        </svg>
      )
    }
  ];

  return (
    <section id="showcase" className="py-24 bg-[#0a0a0a] border-y border-white/5 overflow-hidden">
      {/* Title Area */}
      <div className="max-w-7xl mx-auto px-6 mb-12 flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-white">One card, many vibes.</h2>
        <div className="hidden sm:flex gap-2">
          <div className="w-10 h-1 rounded-full bg-white/20"></div>
          <div className="w-4 h-1 rounded-full bg-white/10"></div>
          <div className="w-4 h-1 rounded-full bg-white/10"></div>
        </div>
      </div>
      
      {/* Horizontal SCroll Showcase Area */}
      <div className="flex gap-8 px-6 pb-8 overflow-x-auto snap-x snap-mandatory style-none">
        {cards.map((c, i) => (
          <div 
            key={i} 
            className="flex-none snap-center flex flex-col items-center gap-4 group"
          >
            <div className="transition-transform duration-500 group-hover:scale-[1.02] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)] bg-transparent rounded-2xl">
              {c.svg}
            </div>
            <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/50 tracking-wide uppercase">
              {c.name}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
