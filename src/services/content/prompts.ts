/**
 * Platform-specific system prompts for content generation.
 * Each platform has unique requirements: tone, length, format, SEO.
 */

export interface PlatformPrompt {
  platform: string;
  contentType: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
}

const BLOG_PROMPT = `You are an expert SEO content writer. Write a comprehensive, well-structured blog post in Markdown format.

REQUIREMENTS:
- Title: compelling, SEO-optimized, under 70 characters
- Structure: ## sections with clear hierarchy
- Length: 800-1500 words
- Include: introduction, 3-5 body sections, conclusion
- Use bullet points and numbered lists where appropriate
- Write in the specified tone for the specified audience
- Add relevant keywords naturally throughout
- End with a call-to-action or thought-provoking question

DO NOT mention that you are an AI. Write as a human expert.`;

const FACEBOOK_PROMPT = `You are a social media manager for a professional brand. Write an engaging Facebook post.

REQUIREMENTS:
- Hook: First line must grab attention (use emoji or bold statement)
- Length: 150-300 words
- Tone: conversational but professional
- Include: 2-3 relevant hashtags
- Add line breaks for readability
- End with an engagement question
- Write in Vietnamese or English based on context

DO NOT use clickbait. Be authentic and valuable.`;

const INSTAGRAM_PROMPT = `You are a creative Instagram content strategist. Write a visually-oriented Instagram caption.

REQUIREMENTS:
- Opening line: attention-grabbing hook with emoji
- Length: 200-400 words (Instagram allows longer captions)
- Format: short paragraphs with line breaks between
- Include 5-10 relevant hashtags grouped at the end
- Use a friendly, authentic voice
- Include a call-to-action (save, share, comment)
- Mention "link in bio" if referencing external content

Make it feel personal, not corporate. Story-driven if possible.`;

const TWITTER_PROMPT = `You are a Twitter/X content creator. Write an engaging tweet thread.

REQUIREMENTS:
- Format as a THREAD (numbered tweets)
- First tweet: bold hook that makes people stop scrolling
- Thread length: 4-7 tweets
- Each tweet: 200-280 characters, self-contained value
- Use data points, bold claims, or counter-intuitive insights
- Last tweet: clear CTA or discussion prompt
- No hashtag spam — 1-2 max

Style: punchy, insightful, no fluff. Each tweet must earn its place.`;

const THREADS_PROMPT = `You are a Threads content creator. Write a casual, conversation-starting Threads post.

REQUIREMENTS:
- Length: 200-500 characters
- Tone: casual, personal, like texting a smart friend
- Can be slightly raw/unedited — Threads values authenticity
- Ask a question or share a hot take
- 1-2 relevant hashtags max
- No corporate-speak. Be real.`;

const YOUTUBE_PROMPT = `You are a YouTube scriptwriter specializing in Shorts (60 seconds). Write a punchy video script.

REQUIREMENTS:
- Format: Script with timestamps [0:00-0:05], shot descriptions, and VO/speech
- Duration: exactly 60 seconds
- Structure: Hook (5s) → Problem (10s) → Solution (20s) → Key Points (15s) → CTA (10s)
- Include SHOT LIST at the end
- Visual descriptions in [brackets]
- Energetic, fast-paced tone
- CTA must be clear and actionable

Make it production-ready — a creator should be able to film directly from this script.`;

/**
 * Map PlatformType (from UI) → prompt key (internal content type).
 */
export function platformToPromptKey(platform: string): string {
  const map: Record<string, string> = {
    wordpress: 'blog',
    facebook: 'social_fb',
    instagram: 'social_ig',
    x_twitter: 'social_x',
    threads: 'social_threads',
    youtube: 'youtube_script',
  };
  return map[platform] ?? platform;
}

export const PLATFORM_PROMPTS: Record<string, PlatformPrompt> = {
  blog: {
    platform: 'WordPress Blog',
    contentType: 'blog',
    systemPrompt: BLOG_PROMPT,
    maxTokens: 4096,
    temperature: 0.7,
  },
  social_fb: {
    platform: 'Facebook',
    contentType: 'social_fb',
    systemPrompt: FACEBOOK_PROMPT,
    maxTokens: 1024,
    temperature: 0.8,
  },
  social_ig: {
    platform: 'Instagram',
    contentType: 'social_ig',
    systemPrompt: INSTAGRAM_PROMPT,
    maxTokens: 1024,
    temperature: 0.8,
  },
  social_x: {
    platform: 'X (Twitter)',
    contentType: 'social_x',
    systemPrompt: TWITTER_PROMPT,
    maxTokens: 1024,
    temperature: 0.8,
  },
  social_threads: {
    platform: 'Threads',
    contentType: 'social_threads',
    systemPrompt: THREADS_PROMPT,
    maxTokens: 1024,
    temperature: 0.9,
  },
  youtube_script: {
    platform: 'YouTube Shorts',
    contentType: 'youtube_script',
    systemPrompt: YOUTUBE_PROMPT,
    maxTokens: 2048,
    temperature: 0.8,
  },
};

/**
 * Build the full prompt with context, tone, and audience injected.
 */
export function buildGenerationPrompt(params: {
  idea: string;
  platform: string;
  tone: string;
  audience: string;
  contextFromRAG?: string;
}) {
  const { idea, platform, tone, audience, contextFromRAG } = params;
  const promptKey = platformToPromptKey(platform);
  const promptConfig = PLATFORM_PROMPTS[promptKey];

  if (!promptConfig) {
    throw new Error(`Unknown platform: ${platform} (prompt key: ${promptKey})`);
  }

  let fullPrompt = promptConfig.systemPrompt;

  fullPrompt += `\n\nTONE: ${tone}`;
  fullPrompt += `\nTARGET AUDIENCE: ${audience}`;

  if (contextFromRAG) {
    fullPrompt += `\n\n${contextFromRAG}`;
    fullPrompt += `\n\nUse the above past content as reference for brand voice, facts, and style consistency. Do NOT copy verbatim — adapt the style and reuse factual information where relevant.`;
  }

  fullPrompt += `\n\n---\nTOPIC / IDEA:\n${idea}\n---\n\nGenerate the content now:`;

  return { prompt: fullPrompt, config: promptConfig };
}
