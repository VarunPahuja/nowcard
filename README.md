# NowCard 🎵

**Your live developer identity. Connected. Dynamic. Automatic.**

NowCard is a high-performance SVG generation engine that creates dynamic, real-time profile cards for your GitHub README. It showcases what you're building, your current "vibe", and what you're listening to across all music platforms — updated as you scrobble.

![NowCard](https://www.nowcard.store/api/card/user_3BNkHVkxLLtW8Gh1uBNXK8MvdkH?layout=minimal&accent=orange)

## ✨ Features

- **Live Music Activity**: Synced via Last.fm. Works with Spotify, Apple Music, YouTube Music, and more.
- **7 Premium Layouts**: Choose from Default, Soft, Compact, Hero, Grid, Minimal, or Gradient designs.
- **Deep Customization**: Toggle modules (album art, vibe, project) and pick from curated accent colors.
- **Zero Overhead**: Embed once using Markdown. The card refreshes automatically whenever your README is viewed.
- **Open to Work**: Built-in status badge to signal availability to recruiters.

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Auth**: [Clerk](https://clerk.com/) (Secure, passwordless access)
- **Data**: [Last.fm API](https://www.last.fm/api) (Music aggregation)
- **Language**: TypeScript

## 🛠️ Getting Started

1. **Last.fm Setup**: Create a free [Last.fm](https://last.fm/) account and connect your music service (Spotify, etc.) to scrobble.
2. **Configure Profile**: Sign in to NowCard and enter your Last.fm username.
3. **Pick Your Vibe**: Set your current project and working "vibe".
4. **Embed**: Copy the Markdown snippet from your dashboard and paste it into your GitHub Profile README.

## 📁 Project Structure

```text
src/
├── app/
│   ├── api/card/[userId]/  # Core SVG generation engine
│   ├── dashboard/          # Customization interface
│   ├── onboarding/         # Setup flow
│   └── page.tsx            # Landing page with live showcase
├── components/             # Shadcn primitives + custom Nav
└── proxy.ts                # Clerk middleware proxy
```

## 🔐 Environment Variables

To run this locally, you'll need the following in your `.env.local`:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_DOMAIN=...
NEXT_PUBLIC_CLERK_FRONTEND_API=...
LASTFM_API_KEY=...
LASTFM_SHARED_SECRET=...
```

---

Built for developers who care about their README aesthetics.  
[Get your card at nowcard.store](https://nowcard.store)
