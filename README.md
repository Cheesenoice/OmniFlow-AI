# OmniFlow AI

One-click AI content hub. Input an idea or `.docx` file, get blog posts, social media content, and YouTube scripts — powered by Google Gemini.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | Tailwind CSS v4, Shadcn/UI v4, Framer Motion |
| AI | Google Gemini 2.5 Flash (generate) + text-embedding-004 (RAG) |
| Database | Supabase (PostgreSQL + pgvector) |
| File Parsing | Mammoth (.docx) |
| Publishing | Facebook Graph API, Telegram Bot API |

## Quick Start

```bash
# 1. Clone
git clone <repo-url>
cd omniflow-ai

# 2. Install
npm install

# 3. Environment
cp .env.example .env.local
# Edit .env.local — add your keys (see below)

# 4. Run
npm run dev
# Open http://localhost:3000
```

## Environment Variables

Create `.env.local`:

```env
# Required — Supabase (get from supabase.com → Project → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Required — Google Gemini (get from aistudio.google.com/apikey)
GEMINI_API_KEY=your-gemini-key

# Optional — OpenRouter for multi-model orchestration
OPENROUTER_API_KEY=sk-or-...
```

## Supabase Setup

1. Create project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste the contents of `supabase/schema.sql` → **Run**
3. Verify 4 tables created: `profiles`, `contents`, `vector_memory`, `connections`
4. Copy **Project URL** and **anon key** from Settings → API → into `.env.local`

## Features

### Content Generation
- Input raw idea or upload `.docx` file
- Select tone (Professional, Casual, Humorous, Persuasive, Informative)
- Select target audience
- Choose platforms: Blog, Facebook, Instagram, X/Twitter, Threads, YouTube
- AI generates platform-optimized content with platform-specific formatting

### RAG Digital Brain
- Past content stored as vector embeddings in Supabase pgvector
- New generation retrieves similar past content for brand voice consistency
- Auto-chunks documents into overlapping segments for embedding

### Publishing
| Platform | Status | Setup |
|---|---|---|
| Facebook Page | Ready | Page Access Token via Graph API Explorer |
| Telegram | Ready | Bot token from @BotFather |
| Instagram | Coming soon | Requires Meta App |
| X/Twitter | Coming soon | Requires API v2 OAuth |
| YouTube | Coming soon | Requires Google OAuth |

#### Facebook Page Setup

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your Meta App → Get User Token → check `pages_manage_posts`
3. Click **Get Page Access Token** → select your Page → copy token
4. GET `/me/accounts` → copy your Page ID
5. Paste both in Settings → **Save** → **Test Post**

#### Telegram Bot Setup

1. Chat with [@BotFather](https://t.me/BotFather) → `/newbot` → copy token
2. Send any message to your bot
3. Visit `https://api.telegram.org/bot<TOKEN>/getUpdates` → copy `chat.id`
4. Paste both in Settings → **Save** → **Test Message**

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx    # Main canvas (input → generate → output)
│   │   ├── archive/page.tsx      # Content history + search + filter
│   │   └── settings/page.tsx     # API keys + platform connections
│   └── api/
│       ├── generate/route.ts     # POST — Gemini content generation
│       └── publish/route.ts      # POST — Facebook / Telegram publish
├── components/
│   ├── dashboard/
│   │   ├── input-panel.tsx       # Textarea, docx upload, platform select
│   │   ├── output-panel.tsx      # Generated content tabs + grid
│   │   ├── content-card.tsx      # Card: View / Copy / Remix / Publish
│   │   └── content-preview-dialog.tsx  # Full markdown preview
│   ├── app-sidebar.tsx           # Sidebar navigation
│   └── ui/                       # Shadcn UI components (17)
├── services/
│   ├── content/
│   │   ├── docx-parser.ts        # Mammoth .docx → text + chunking
│   │   ├── prompts.ts            # 6 platform-specific system prompts
│   │   └── generator.ts          # Central generation pipeline
│   ├── rag/
│   │   ├── embeddings.ts         # Gemini text-embedding-004
│   │   └── vector-search.ts      # Supabase pgvector similarity search
│   └── social/
│       ├── facebook.ts           # Facebook Graph API v22 connector
│       └── telegram.ts           # Telegram Bot sendMessage
├── lib/
│   ├── ai/gemini.ts              # Gemini generate + embed client
│   └── supabase/                 # Client, server, middleware
├── types/
│   ├── index.ts                  # Shared TypeScript types
│   └── supabase.ts               # Database type definitions
└── supabase/
    └── schema.sql                # Full DB schema + RLS + pgvector
```

## Routes

| Route | Type | Description |
|---|---|---|
| `/` | Static | Landing page |
| `/dashboard` | Static | Create + Generate + Publish |
| `/archive` | Static | Content history + search |
| `/settings` | Static | API keys + connections |
| `/api/generate` | Dynamic | POST — content generation |
| `/api/publish` | Dynamic | POST — publish to platforms |

## Commands

```bash
npm run dev      # Development server (Turbopack)
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

## Notes

- Gemini API key is **never** sent to the browser — all AI calls go through server-side API routes
- Facebook Page Access Token from Graph API Explorer expires after ~2 hours. For production, generate a long-lived token via Meta App Settings
- Platform credentials in Settings are stored in `localStorage` for testing. Production should use Supabase `connections` table with encryption
- The `connections` service (`src/services/social/connections.ts`) is ready for Supabase-based credential storage — just wire up Supabase Auth
