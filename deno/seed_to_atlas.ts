import { MongoClient } from "npm:mongodb@6.8.0";
import { parse } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

function mapCategory(parent: string, sub: string): string {
  const text = `${parent} ${sub}`.toLowerCase();
  if (['code', 'python', 'javascript', 'typescript', 'web', 'dev', 'api', 'software', 'database', 'sql', 'git', 'docker', 'cyber', 'linux', 'backend', 'frontend', 'data science', 'machine learning', 'cloud', 'algorithm', 'app'].some(k => text.includes(k))) return 'code';
  if (['image', 'art', 'animation', '3d', 'drawing', 'illustration', 'photo', 'design', 'graphic', 'ui', 'ux', 'render', 'logo'].some(k => text.includes(k))) return 'image';
  if (['write', 'writing', 'copywriting', 'content', 'essay', 'novel', 'book', 'journal', 'story', 'blog', 'poem', 'script'].some(k => text.includes(k))) return 'writing';
  if (['market', 'marketing', 'seo', 'ad', 'advertising', 'social media', 'sales', 'brand', 'email', 'funnel', 'pr'].some(k => text.includes(k))) return 'marketing';
  if (['business', 'finance', 'accounting', 'management', 'entrepreneur', 'startup', 'strategy', 'economic', 'invest', 'real estate', 'legal', 'hr'].some(k => text.includes(k))) return 'business';
  if (['video', 'film', 'cinema', 'movie', 'youtube', 'editing', 'directing'].some(k => text.includes(k))) return 'video';
  if (['music', 'audio', 'sound', 'singing', 'song', 'podcast', 'instrument'].some(k => text.includes(k))) return 'music';
  if (['physics', 'math', 'chemistry', 'biology', 'science', 'education', 'teaching', 'academic', 'history', 'philosophy', 'psychology', 'medicine', 'health', 'astronomy', 'language', 'tutor'].some(k => text.includes(k))) return 'education';
  return 'other';
}

console.log("Reading environment...");
const env = await parse(await Deno.readTextFile("./.env"));
const MONGODB_URI = env.MONGOD_FULL_URI || env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI missing in .env");
  Deno.exit(1);
}

console.log("Reading 10,000 chatbot prompts JSON...");
const rawText = await Deno.readTextFile("./bank/10_000_chatbot_prompts.json");
const rawItems = JSON.parse(rawText);
console.log(`Loaded ${rawItems.length} raw prompts.`);

const docs = rawItems.map((item: any) => {
  const parent = (item.parent_category || "").trim();
  const sub = (item.subcategory || "").trim();
  const msg = (item.system_message || "").trim();
  const kw = item.keywords || [];

  const itemId = String(item.id || "").replace(/-/g, "_");
  const shortId = `cb_${itemId}`;

  const title = (sub && sub.toLowerCase() !== parent.toLowerCase()) ? `${sub} AI Assistant` : `${parent} AI Assistant`;
  
  let desc = msg;
  const firstPeriod = msg.indexOf(".");
  if (firstPeriod > 20 && firstPeriod < 200) {
    desc = msg.slice(0, firstPeriod + 1);
  } else if (msg.length > 160) {
    desc = msg.slice(0, 157) + "...";
  }

  const category = mapCategory(parent, sub);
  const tags: string[] = [];
  for (const t of [parent, sub, ...kw]) {
    const clean = String(t).trim();
    if (clean && !tags.includes(clean)) tags.push(clean);
  }

  return {
    shortId,
    kind: "prompt",
    title,
    description: desc,
    content: msg,
    category,
    platform: "chatgpt",
    tags,
    variables: [],
    isPublic: true,
    views: 0,
    copies: 0,
    createdAt: "2026-07-29T23:00:00.000Z",
    updatedAt: "2026-07-29T23:00:00.000Z",
  };
});

console.log("Connecting to MongoDB Atlas...");
const client = new MongoClient(MONGODB_URI);
await client.connect();
console.log("Connected to MongoDB Atlas!");

const db = client.db("vibenote");
const col = db.collection("prompts");

console.log("Seeding documents into 'prompts' collection in batches of 1,000...");
const ops = docs.map(doc => ({
  updateOne: {
    filter: { shortId: doc.shortId },
    update: { $set: doc },
    upsert: true,
  }
}));

for (let i = 0; i < ops.length; i += 1000) {
  const batch = ops.slice(i, i + 1000);
  console.log(`Writing batch ${i / 1000 + 1}/${Math.ceil(ops.length / 1000)}...`);
  await col.bulkWrite(batch, { ordered: false });
}

const totalInDb = await col.countDocuments();
console.log(`🎉 SUCCESS! Total documents in MongoDB Atlas 'prompts' collection: ${totalInDb}`);
await client.close();
