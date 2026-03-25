import type { SQLiteDatabase } from 'expo-sqlite';
import { generateId } from '@/utils/id';

interface SeedPrompt {
  title: string;
  content: string;
  description: string;
  category: string;
  platform: string;
  tags: string[];
}

const SEED_PROMPTS: SeedPrompt[] = [
  {
    title: 'Cinematic Portrait',
    content: 'Create a stunning portrait of {{subject}} in {{setting|a dark studio}}. Style: {{style:cinematic|anime|watercolor|oil painting}}. Lighting: {{lighting:natural|studio|dramatic|neon}}. Camera angle: close-up, shallow depth of field, 8k resolution.',
    description: 'Generate beautiful AI portraits with customizable style and lighting',
    category: 'image',
    platform: 'midjourney',
    tags: ['portrait', 'cinematic', 'photography'],
  },
  {
    title: 'Code Review Expert',
    content: 'You are a senior {{language|TypeScript}} developer. Review the following code for:\n1. Bugs and potential issues\n2. Performance optimizations\n3. {{focus:security|readability|performance|best practices}} concerns\n4. Suggestions for improvement\n\nCode:\n```\n{{code}}\n```\n\nProvide specific, actionable feedback with code examples.',
    description: 'Get thorough code reviews with specific focus areas',
    category: 'code',
    platform: 'chatgpt',
    tags: ['code-review', 'development', 'best-practices'],
  },
  {
    title: 'Article Writer',
    content: 'Write a comprehensive article about {{topic}} targeting {{audience|general readers}}. Tone: {{tone:formal|casual|academic|conversational}}. Length: {{length|1500}} words.\n\nRequirements:\n- Engaging introduction with a hook\n- Clear subheadings\n- Practical examples\n- Strong conclusion with call to action\n- SEO-friendly structure',
    description: 'Generate well-structured articles with customizable tone and audience',
    category: 'writing',
    platform: 'claude',
    tags: ['article', 'content', 'seo'],
  },
  {
    title: 'Logo Design Concept',
    content: 'Design a modern logo for {{company}} in the {{industry}} industry. Color scheme: {{colors|blue and white}}. Style: {{style:minimalist|geometric|abstract|vintage|3D}}. The logo should be clean, memorable, and work at small sizes. White background, vector-style illustration.',
    description: 'Generate logo concepts with customizable style and colors',
    category: 'image',
    platform: 'dalle',
    tags: ['logo', 'branding', 'design'],
  },
  {
    title: 'Marketing Copy Generator',
    content: 'Create compelling marketing copy for {{product}}.\nTarget audience: {{audience}}\nPlatform: {{platform:instagram|twitter|linkedin|facebook|email}}\nGoal: {{goal|increase engagement}}\n\nGenerate:\n1. Headline (max 10 words)\n2. Body copy (2-3 paragraphs)\n3. Call to action\n4. 5 relevant hashtags',
    description: 'Generate marketing copy optimized for different social platforms',
    category: 'marketing',
    platform: 'gemini',
    tags: ['marketing', 'social-media', 'copywriting'],
  },
  {
    title: 'Fantasy Landscape',
    content: 'A breathtaking {{scene|enchanted forest}} during {{time_of_day:dawn|golden hour|sunset|night|blue hour}}. Style: {{style:photorealistic|digital art|concept art|studio ghibli}}. Atmosphere: mystical fog, volumetric lighting, cinematic composition, ultra-detailed, 4k wallpaper quality.',
    description: 'Generate stunning fantasy landscape artwork',
    category: 'image',
    platform: 'stable_diffusion',
    tags: ['landscape', 'fantasy', 'art'],
  },
  {
    title: 'Interactive Lesson Plan',
    content: 'Create an interactive lesson plan for teaching {{subject}} to {{level:beginner|intermediate|advanced}} students.\n\nInclude:\n1. Learning objectives (3-5)\n2. Warm-up activity (5 min)\n3. Main content with examples\n4. Interactive exercise\n5. Assessment questions (5)\n6. Homework assignment\n\nMake it engaging and suitable for {{format|online}} learning.',
    description: 'Generate complete lesson plans with interactive elements',
    category: 'education',
    platform: 'chatgpt',
    tags: ['education', 'teaching', 'lesson-plan'],
  },
  {
    title: 'Professional Email Template',
    content: 'Write a professional email to {{recipient}} regarding {{purpose}}.\nTone: {{tone|professional}}\nContext: {{context}}\n\nThe email should be:\n- Concise and clear\n- Professionally formatted\n- Include a clear subject line\n- End with an appropriate call to action',
    description: 'Generate professional emails for any business context',
    category: 'business',
    platform: 'claude',
    tags: ['email', 'business', 'communication'],
  },
];

export function seedDatabase(db: SQLiteDatabase): void {
  const result = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM prompts'
  );

  if (result && result.count > 0) return;

  const now = Date.now();
  const stmt = db.prepareSync(
    `INSERT INTO prompts (id, title, content, description, category, platform, tags, variables, is_favorite, is_pinned, usage_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  try {
    for (let i = 0; i < SEED_PROMPTS.length; i++) {
      const p = SEED_PROMPTS[i];
      const id = generateId();
      const createdAt = now - (SEED_PROMPTS.length - i) * 86400000; // stagger dates
      stmt.executeSync(
        id,
        p.title,
        p.content,
        p.description,
        p.category,
        p.platform,
        JSON.stringify(p.tags),
        '[]',
        i < 3 ? 1 : 0, // first 3 are favorites
        i === 0 ? 1 : 0, // first is pinned
        Math.floor(Math.random() * 20),
        createdAt,
        createdAt
      );
    }
  } finally {
    stmt.finalizeSync();
  }
}
