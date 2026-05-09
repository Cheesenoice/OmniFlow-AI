import { Button } from "@/components/ui/button";
import { Brain, Zap, Share2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-gradient-to-br from-zinc-50 to-blue-50 dark:from-zinc-950 dark:to-zinc-900">
      <main className="flex flex-col items-center gap-10 text-center max-w-2xl px-6 py-24">
        <div className="flex items-center gap-3">
          <Brain className="w-10 h-10 text-blue-600" />
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            OmniFlow AI
          </h1>
        </div>

        <p className="text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-lg">
          One-click AI content hub. Input an idea, get blog posts, social media
          content, and video scripts — powered by your own Digital Brain.
        </p>

        <div className="flex gap-4 flex-wrap justify-center">
          <Button size="lg" className="gap-2">
            <Zap className="w-4 h-4" />
            Start Creating
          </Button>
          <Button size="lg" variant="outline" className="gap-2">
            <Share2 className="w-4 h-4" />
            Connect Platforms
          </Button>
        </div>

        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-6">
          Phase 1 — Foundation &amp; Database Schema
        </p>
      </main>
    </div>
  );
}
