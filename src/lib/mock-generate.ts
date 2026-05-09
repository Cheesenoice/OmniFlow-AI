import type { GeneratedContent, PlatformType } from '@/types';

/**
 * Mock content generator — simulates AI output for UI testing.
 * Will be replaced by real Gemini API calls in Phase 3.
 */
export function mockGenerate(idea: string, platforms: PlatformType[]): GeneratedContent[] {
  const results: GeneratedContent[] = [];

  for (const platform of platforms) {
    switch (platform) {
      case 'wordpress':
        results.push({
          title: generateBlogTitle(idea),
          body: generateBlogPost(idea),
          content_type: 'blog',
          metadata: { seo_keywords: ['AI', 'content', 'marketing'], reading_time: '5 min' },
        });
        break;
      case 'facebook':
        results.push({
          title: 'Facebook Post',
          body: generateSocialPost(idea, 'Facebook'),
          content_type: 'social_fb',
          metadata: { hashtags: '#AI #ContentMarketing', character_count: 280 },
        });
        break;
      case 'instagram':
        results.push({
          title: 'Instagram Caption',
          body: generateSocialPost(idea, 'Instagram'),
          content_type: 'social_ig',
          metadata: { hashtags: '#AIContent #DigitalMarketing', character_count: 2200 },
        });
        break;
      case 'x_twitter':
        results.push({
          title: 'X (Twitter) Thread',
          body: generateTwitterThread(idea),
          content_type: 'social_x',
          metadata: { tweet_count: 4, character_count: 1120 },
        });
        break;
      case 'threads':
        results.push({
          title: 'Threads Post',
          body: generateSocialPost(idea, 'Threads'),
          content_type: 'social_threads',
          metadata: { character_count: 450 },
        });
        break;
      case 'youtube':
        results.push({
          title: `Shorts Script: ${idea.slice(0, 40)}...`,
          body: generateYouTubeScript(idea),
          content_type: 'youtube_script',
          metadata: { duration: '60s', shots: 8 },
        });
        break;
    }
  }

  return results;
}

function generateBlogTitle(idea: string): string {
  const templates = [
    `How ${idea.slice(0, 40)} Is Changing the Game in 2026`,
    `The Ultimate Guide to ${idea.slice(0, 40)}`,
    `Why ${idea.slice(0, 40)} Matters More Than Ever`,
    `${idea.slice(0, 50)}: A Complete Breakdown`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function generateBlogPost(idea: string): string {
  return `# Introduction

${idea}

In today's rapidly evolving digital landscape, understanding how these technologies work together is crucial for businesses of all sizes. The convergence of artificial intelligence and content creation has opened up unprecedented opportunities for marketers, creators, and entrepreneurs alike.

## The Current State of Things

The content creation industry has undergone a massive transformation over the past few years. Traditional methods of content production are being replaced by AI-assisted workflows that can produce high-quality material in a fraction of the time. According to recent studies, companies that leverage AI in their content strategies see a 3x improvement in output quality and consistency.

## Key Benefits

1. **Speed and Efficiency**: Generate drafts in seconds instead of hours. What used to take an entire afternoon can now be accomplished during your morning coffee.

2. **Consistency Across Channels**: Maintain a unified brand voice across all platforms. AI ensures your messaging stays on-brand whether you're posting on LinkedIn, Twitter, or your company blog.

3. **Data-Driven Optimization**: AI analyzes performance metrics and suggests improvements in real-time, helping you refine your content strategy continuously.

4. **Scalability**: Scale your content operations without proportionally scaling your team. One person can now manage content across 5+ platforms simultaneously.

## Real-World Examples

Companies like Jasper, Copy.ai, and Writesonic have already demonstrated the power of AI in content creation. Small businesses using these tools report an average 40% reduction in content production costs while doubling their output volume.

## How to Get Started

1. Define your content goals and target audience
2. Choose the right AI tools for your specific needs
3. Set up quality control workflows (human-in-the-loop)
4. Measure, iterate, and optimize

## Conclusion

The future of content creation is not about AI replacing humans—it's about AI augmenting human creativity. The best results come from combining AI's speed and consistency with human strategic thinking and emotional intelligence.`.trim();
}

function generateSocialPost(idea: string, platform: string): string {
  return `🚀 Exciting insights on this topic!

${idea.slice(0, 100)}...

Here's what I've learned after deep research and hands-on experience working with dozens of brands this year. The key takeaway? Consistency beats perfection every single time.

💡 Pro tip: Start small, measure what works, and double down on the channels that bring the best ROI. Don't try to be everywhere at once — quality over quantity always wins.

What's your experience with this? Drop a comment below! 👇

#ContentStrategy #AIMarketing #${platform}Tips #DigitalGrowth`.trim();
}

function generateTwitterThread(idea: string): string {
  return `🧵 THREAD: ${idea.slice(0, 60)}

1/ Let's talk about something that's transforming the industry right now. Most people are sleeping on this, but the data doesn't lie.

2/ First, the problem: Traditional content creation is slow, expensive, and inconsistent. The average blog post takes 4+ hours to write. Social media? That's another 2-3 hours daily.

3/ Now, the solution: AI-assisted content workflows. Not replacing humans—augmenting them. Here's what the data shows: 3x faster production, 2x higher engagement, 40% lower costs.

4/ The bottom line: If you're not experimenting with AI in your content workflow yet, you're leaving money on the table. Start small, test everything, and scale what works.

What's your take? Have you tried AI for content yet? Let me know! 🚀`.trim();
}

function generateYouTubeScript(idea: string): string {
  return `# VIDEO: ${idea.slice(0, 30)}

**DURATION:** 60 seconds (Shorts)
**TONE:** Energetic, educational

---

[HOOK — 0:00-0:05]
"Stop spending hours on content creation. Here's how AI can do it in minutes."

[PROBLEM SETUP — 0:05-0:15]
Show screen recording of a cluttered content calendar. Voiceover: "You spend 20+ hours a week on content. Writing. Editing. Posting. And still feel like you're falling behind."

[THE REVEAL — 0:15-0:25]
Cut to clean AI dashboard. "Now watch this. Same brief. 5 platforms. Ready in under 2 minutes." Screen record of AI generating content across multiple windows.

[KEY POINTS — 0:25-0:45]
Fast cuts with text overlays:
• 📝 "Blog posts in 30 seconds"
• 📱 "Social captions auto-optimized per platform"
• 🎬 "Video scripts with shot-by-shot breakdown"
• 📊 "Performance predictions built-in"

[CTA — 0:45-0:60]
Face to camera: "Want to 10x your content output without hiring? Link in bio. Let's build your AI content engine together."

---

**SHOT LIST:**
1. Talking head hook
2. Screen recording — messy calendar
3. Screen recording — AI dashboard
4. Text overlay montage (4 shots)
5. Talking head CTA
6. Logo end card`.trim();
}
