import { MongoClient, Collection } from "npm:mongodb@6.8.0";
import { parse } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

export interface VariableDefinition {
  name: string;
  label?: string;
  type: 'text' | 'select';
  defaultValue?: string;
  options?: string[];
}

export interface PromptDoc {
  _id?: any;
  shortId: string;
  kind?: string; // 'prompt' | 'note' | 'context'
  title: string;
  content: string;
  description?: string;
  category: string;
  platform: string;
  tags: string[];
  variables: VariableDefinition[];
  isPublic: boolean;
  views: number;
  copies: number;
  createdAt: string;
  updatedAt: string;
}

// Load env
let env: Record<string, string> = {};
try {
  env = await parse(await Deno.readTextFile("./.env"));
} catch {
  env = Deno.env.toObject();
}

const MONGODB_URI = env.MONGOD_FULL_URI || env.MONGODB_URI || Deno.env.get("MONGODB_URI") || "";

let mongoCollection: Collection<PromptDoc> | null = null;
let useFallbackDb = false;

// Fallback local storage file
const LOCAL_DB_PATH = "./data/prompts.json";

async function ensureLocalDbDir() {
  try {
    await Deno.mkdir("./data", { recursive: true });
    try {
      await Deno.stat(LOCAL_DB_PATH);
    } catch {
      await Deno.writeTextFile(LOCAL_DB_PATH, JSON.stringify(getInitialSeedData(), null, 2));
    }
  } catch (e) {
    console.error("Local DB init error:", e);
  }
}

function getInitialSeedData(): PromptDoc[] {
  return [
    {
      shortId: "vibe101",
      kind: "prompt",
      title: "Senior Full-Stack Code Reviewer",
      description: "Comprehensive code review for clean architecture, security, performance, and best practices.",
      content: "Act as a Senior Principal Engineer. Review the following {{language}} code for:\n1. Security vulnerabilities\n2. Performance bottlenecks in {{focus_area}}\n3. Architecture & clean code principles\n\nCode snippet:\n```{{language}}\n{{code_snippet}}\n```\nProvide actionable recommendations with code examples.",
      category: "code",
      platform: "chatgpt",
      tags: ["code-review", "architecture", "refactoring"],
      variables: [
        { name: "language", type: "select", defaultValue: "typescript", options: ["typescript", "javascript", "python", "go", "rust"] },
        { name: "focus_area", type: "select", defaultValue: "async operations", options: ["async operations", "memory usage", "database queries", "API security"] },
        { name: "code_snippet", type: "text", defaultValue: "const data = await fetch('/api/user');" }
      ],
      isPublic: true,
      views: 142,
      copies: 68,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      shortId: "midj88",
      kind: "prompt",
      title: "Cyberpunk Cinematic Scene Generator",
      description: "Generates photorealistic neon-lit cyberpunk concept art with camera details.",
      content: "Cinematic shot of {{subject}} in a futuristic rainy neon cyberpunk street, {{lighting_style}} lighting, reflections in water puddles, shot on 35mm lens, f/1.4, volumetric fog, highly detailed, photorealistic, 8k resolution --ar {{aspect_ratio}} --v 6.0",
      category: "image",
      platform: "midjourney",
      tags: ["midjourney", "cyberpunk", "photorealistic"],
      variables: [
        { name: "subject", type: "text", defaultValue: "a lone female hacker with glowing cybernetic visor" },
        { name: "lighting_style", type: "select", defaultValue: "cyan and magenta neon", options: ["cyan and magenta neon", "golden hour twilight", "dark emerald darksynth"] },
        { name: "aspect_ratio", type: "select", defaultValue: "16:9", options: ["16:9", "9:16", "1:1", "21:9"] }
      ],
      isPublic: true,
      views: 289,
      copies: 140,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      shortId: "writ33",
      kind: "prompt",
      title: "Viral LinkedIn Post Creator",
      description: "Drafts engaging, high-hook LinkedIn posts with clear value and call-to-action.",
      content: "Write a high-converting LinkedIn post about {{topic}}.\nTarget Audience: {{target_audience}}\nTone: {{tone:inspiring|authoritative|conversational|storytelling}}\n\nStructure:\n1. Hook: Attention-grabbing first line (under 10 words)\n2. Problem & Story: Relatable struggle\n3. Solution & Takeaway: 3 actionable points\n4. CTA: Engaging question to spark comments.",
      category: "writing",
      platform: "chatgpt",
      tags: ["linkedin", "copywriting", "marketing"],
      variables: [
        { name: "topic", type: "text", defaultValue: "How AI is changing mobile app development" },
        { name: "target_audience", type: "text", defaultValue: "Software developers & product managers" },
        { name: "tone", type: "select", defaultValue: "conversational", options: ["inspiring", "authoritative", "conversational", "storytelling"] }
      ],
      isPublic: true,
      views: 95,
      copies: 41,
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    }
  ];
}

export async function initDatabase() {
  await ensureLocalDbDir();

  if (!MONGODB_URI) {
    console.log("⚠️ No MONGODB_URI set, using local fallback database.");
    useFallbackDb = true;
    return;
  }

  try {
    console.log("🔌 Connecting to MongoDB Atlas...");
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
    });
    await client.connect();
    const db = client.db("vibenote");
    mongoCollection = db.collection<PromptDoc>("prompts");
    console.log("✅ Successfully connected to MongoDB Atlas!");
  } catch (err: any) {
    console.warn(`⚠️ MongoDB Atlas connection failed (${err.message}). Using local JSON storage fallback.`);
    useFallbackDb = true;
  }
}

// Data methods
export async function getPublicPrompts(options?: { category?: string; search?: string; limit?: number; sort?: string }): Promise<PromptDoc[]> {
  const category = options?.category;
  const search = options?.search?.toLowerCase();
  const limit = options?.limit || 50;

  if (!useFallbackDb && mongoCollection) {
    try {
      const query: any = { isPublic: true };
      if (category && category !== 'all') {
        query.category = category;
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
        ];
      }
      const sortOption: any = options?.sort === 'popular' ? { copies: -1, views: -1 } : { createdAt: -1 };
      return await mongoCollection.find(query).sort(sortOption).limit(limit).toArray();
    } catch (e) {
      console.error("MongoDB query error, falling back:", e);
    }
  }

  // Fallback DB read
  try {
    const raw = await Deno.readTextFile(LOCAL_DB_PATH);
    let list: PromptDoc[] = JSON.parse(raw);
    list = list.filter(p => p.isPublic !== false);
    if (category && category !== 'all') {
      list = list.filter(p => p.category === category);
    }
    if (search) {
      list = list.filter(p =>
        p.title.toLowerCase().includes(search) ||
        (p.description && p.description.toLowerCase().includes(search)) ||
        p.content.toLowerCase().includes(search) ||
        p.tags.some(t => t.toLowerCase().includes(search))
      );
    }
    if (options?.sort === 'popular') {
      list.sort((a, b) => (b.copies || 0) - (a.copies || 0));
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list.slice(0, limit);
  } catch {
    return getInitialSeedData();
  }
}

export async function getPromptByShortId(shortId: string): Promise<PromptDoc | null> {
  if (!useFallbackDb && mongoCollection) {
    try {
      const doc = await mongoCollection.findOne({ shortId });
      if (doc) return doc;
    } catch (e) {
      console.error("MongoDB find error, falling back:", e);
    }
  }

  try {
    const raw = await Deno.readTextFile(LOCAL_DB_PATH);
    const list: PromptDoc[] = JSON.parse(raw);
    return list.find(p => p.shortId === shortId) || null;
  } catch {
    return null;
  }
}

export async function savePrompt(promptData: Partial<PromptDoc>): Promise<PromptDoc> {
  const shortId = promptData.shortId || generateShortId();
  const now = new Date().toISOString();

  const doc: PromptDoc = {
    shortId,
    kind: promptData.kind || "prompt",
    title: promptData.title || "Untitled Prompt",
    content: promptData.content || "",
    description: promptData.description || "",
    category: promptData.category || "other",
    platform: promptData.platform || "other",
    tags: Array.isArray(promptData.tags) ? promptData.tags : [],
    variables: Array.isArray(promptData.variables) ? promptData.variables : [],
    isPublic: promptData.isPublic !== false,
    views: promptData.views || 0,
    copies: promptData.copies || 0,
    createdAt: promptData.createdAt || now,
    updatedAt: now,
  };

  if (!useFallbackDb && mongoCollection) {
    try {
      await mongoCollection.updateOne(
        { shortId },
        { $set: doc },
        { upsert: true }
      );
      return doc;
    } catch (e) {
      console.error("MongoDB upsert error, saving locally:", e);
    }
  }

  // Local fallback save
  try {
    const raw = await Deno.readTextFile(LOCAL_DB_PATH);
    let list: PromptDoc[] = JSON.parse(raw);
    const idx = list.findIndex(p => p.shortId === shortId);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...doc };
    } else {
      list.unshift(doc);
    }
    await Deno.writeTextFile(LOCAL_DB_PATH, JSON.stringify(list, null, 2));
  } catch (e) {
    console.error("Error writing fallback db:", e);
  }

  return doc;
}

export async function incrementStats(shortId: string, type: 'view' | 'copy') {
  if (!useFallbackDb && mongoCollection) {
    try {
      const inc: any = type === 'view' ? { views: 1 } : { copies: 1 };
      await mongoCollection.updateOne({ shortId }, { $inc: inc });
      return;
    } catch (e) {
      console.error("MongoDB inc error:", e);
    }
  }

  try {
    const raw = await Deno.readTextFile(LOCAL_DB_PATH);
    let list: PromptDoc[] = JSON.parse(raw);
    const p = list.find(x => x.shortId === shortId);
    if (p) {
      if (type === 'view') p.views = (p.views || 0) + 1;
      if (type === 'copy') p.copies = (p.copies || 0) + 1;
      await Deno.writeTextFile(LOCAL_DB_PATH, JSON.stringify(list, null, 2));
    }
  } catch {}
}

function generateShortId(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
