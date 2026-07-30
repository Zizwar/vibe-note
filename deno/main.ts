import { initDatabase, getPublicPrompts, getPromptByShortId, savePrompt, incrementStats, seedDatabase, PromptDoc } from "./db.ts";
import { renderHomePage, renderPromptDetailPage } from "./views/renderHtml.ts";
import { extractVariables } from "./variableParser.ts";

// Initialize database
await initDatabase();

const PORT = Number(Deno.env.get("PORT") || 3333);

Deno.serve({ port: PORT }, async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // Base URL for links
  const forwardedHost = req.headers.get("x-forwarded-host");
  const hostHeader = forwardedHost || req.headers.get("host") || "vibenote.sbs";
  const scheme = req.headers.get("x-forwarded-proto") || (hostHeader.includes("localhost") ? "http" : "https");
  const baseUrl = `${scheme}://${hostHeader.replace(/:3333$/, '')}`;

  // CORS Headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // -------------------------------------------------------------
    // Route 1: Home Page (Web Showcase with Tag Filtering)
    // -------------------------------------------------------------
    if (path === "/" && method === "GET") {
      const category = url.searchParams.get("category") || "all";
      const search = url.searchParams.get("search") || "";
      const tag = url.searchParams.get("tag") || "";
      const sort = url.searchParams.get("sort") || "random";
      const page = Number(url.searchParams.get("page")) || 1;
      const rawLimit = Number(url.searchParams.get("limit")) || 24;
      const limit = Math.min(Math.max(rawLimit, 1), 50);

      const paginatedData = await getPublicPrompts({ category, search, tag, sort, page, limit });
      const html = renderHomePage(paginatedData, category, search, tag, baseUrl);
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      });
    }

    // -------------------------------------------------------------
    // Route 2: Single Prompt Page /p/:shortId or /:shortId with format handlers
    // -------------------------------------------------------------
    const isSinglePromptRoute = (path.startsWith("/p/") && method === "GET") || (/^\/[a-zA-Z0-9_-]{4,15}$/.test(path) && method === "GET" && !path.startsWith("/api"));
    if (isSinglePromptRoute) {
      const shortId = path.startsWith("/p/") ? path.split("/")[2] : path.slice(1);
      const prompt = await getPromptByShortId(shortId);
      if (!prompt) {
        return new Response("Prompt not found", { status: 404 });
      }

      const formatType = (url.searchParams.get("type") || url.searchParams.get("format") || "").toLowerCase();
      const acceptHeader = (req.headers.get("accept") || "").toLowerCase();

      // Format 1: Raw JSON
      if (formatType === "json" || acceptHeader.includes("application/json")) {
        return new Response(JSON.stringify(prompt, null, 2), {
          headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders },
        });
      }

      // Format 2: Raw Markdown
      if (formatType === "md" || formatType === "markdown" || acceptHeader.includes("text/markdown")) {
        const mdContent = `# ${prompt.title}

> **Category**: ${prompt.category} | **Platform**: ${prompt.platform} | **Short ID**: ${prompt.shortId}
> **Tags**: ${prompt.tags.join(', ')}

## Description
${prompt.description || 'No description provided.'}

## System Prompt Template
\`\`\`
${prompt.content}
\`\`\`
`;
        return new Response(mdContent, {
          headers: { "Content-Type": "text/markdown; charset=utf-8", ...corsHeaders },
        });
      }

      // Format 3: Dynamic SVG Card
      if (formatType === "svg" || acceptHeader.includes("image/svg+xml")) {
        const svgContent = generatePromptSvg(prompt);
        return new Response(svgContent, {
          headers: { "Content-Type": "image/svg+xml; charset=utf-8", ...corsHeaders },
        });
      }

      // Format 4: Raw XML
      if (formatType === "xml" || acceptHeader.includes("application/xml") || acceptHeader.includes("text/xml")) {
        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<vibenote_prompt id="${escapeXml(prompt.shortId)}">
  <title>${escapeXml(prompt.title)}</title>
  <category>${escapeXml(prompt.category)}</category>
  <platform>${escapeXml(prompt.platform)}</platform>
  <description>${escapeXml(prompt.description || '')}</description>
  <content><![CDATA[${prompt.content}]]></content>
  <tags>
    ${prompt.tags.map(t => `<tag>${escapeXml(t)}</tag>`).join('\n    ')}
  </tags>
  <variables>
    ${(prompt.variables || []).map(v => `<variable name="${escapeXml(v.name)}" type="${escapeXml(v.type)}"${v.defaultValue ? ` default="${escapeXml(v.defaultValue)}"` : ''}/>`).join('\n    ')}
  </variables>
  <created_at>${prompt.createdAt}</created_at>
</vibenote_prompt>`;

        return new Response(xmlContent, {
          headers: { "Content-Type": "application/xml; charset=utf-8", ...corsHeaders },
        });
      }

      // Default: HTML Web Page
      const html = renderPromptDetailPage(prompt, baseUrl);
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      });
    }

    // -------------------------------------------------------------
    // Route 3: API Create / Share Prompt
    // -------------------------------------------------------------
    if (path === "/api/prompts" && method === "POST") {
      const body = await req.json();
      const content = body.content || "";

      // Auto-extract variables if not provided
      const variables = (Array.isArray(body.variables) && body.variables.length > 0)
        ? body.variables
        : extractVariables(content);

      const saved = await savePrompt({
        title: body.title || "Untitled Prompt",
        kind: body.kind || "prompt",
        content: content,
        description: body.description || "",
        category: body.category || "other",
        platform: body.platform || "chatgpt",
        tags: Array.isArray(body.tags) ? body.tags : [],
        variables: variables,
        isPublic: body.isPublic !== false,
      });

      const shortUrl = `${baseUrl}/p/${saved.shortId}`;

      return new Response(
        JSON.stringify({
          success: true,
          shortId: saved.shortId,
          shortUrl: shortUrl,
          prompt: saved,
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // -------------------------------------------------------------
    // Route 4: API List Public Prompts
    // -------------------------------------------------------------
    if (path === "/api/prompts" && method === "GET") {
      const category = url.searchParams.get("category") || "all";
      const search = url.searchParams.get("search") || "";
      const tag = url.searchParams.get("tag") || "";
      const sort = url.searchParams.get("sort") || "random";
      const page = Number(url.searchParams.get("page")) || 1;
      const rawLimit = Number(url.searchParams.get("limit")) || 24;
      const limit = Math.min(Math.max(rawLimit, 1), 50);

      const result = await getPublicPrompts({ category, search, tag, sort, page, limit });
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // -------------------------------------------------------------
    // Route 5: API Get Single Prompt JSON
    // -------------------------------------------------------------
    if (path.match(/^\/api\/prompts\/[a-zA-Z0-9_-]+$/) && method === "GET") {
      const shortId = path.split("/")[3];
      const prompt = await getPromptByShortId(shortId);
      if (!prompt) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      return new Response(JSON.stringify(prompt), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // -------------------------------------------------------------
    // Route 6: Incremental Stats
    // -------------------------------------------------------------
    if (path.match(/^\/api\/prompts\/[a-zA-Z0-9_-]+\/stats$/) && method === "POST") {
      const shortId = path.split("/")[3];
      const body = await req.json().catch(() => ({}));
      const type = body.type === "copy" ? "copy" : "view";
      await incrementStats(shortId, type);
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // -------------------------------------------------------------
    // Route 7: Database Seeding Route (/api/seed)
    // -------------------------------------------------------------
    if (path === "/api/seed" && method === "GET") {
      const force = url.searchParams.get("force") === "true";
      const result = await seedDatabase(force);
      return new Response(JSON.stringify({ success: true, ...result }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // -------------------------------------------------------------
    // 404 Not Found
    // -------------------------------------------------------------
    return new Response("Not Found", { status: 404, headers: corsHeaders });
  } catch (error: any) {
    console.error("Server Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

function generatePromptSvg(prompt: PromptDoc): string {
  const title = (prompt.title || "AI Prompt").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const category = (prompt.category || 'general').toUpperCase();
  const platform = (prompt.platform || 'chatgpt').toUpperCase();
  const description = (prompt.description || prompt.content.slice(0, 150)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const contentSnippet = prompt.content.slice(0, 220).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tags = prompt.tags.slice(0, 4).join(', ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" fill="none">
    <rect width="800" height="450" rx="16" fill="#0A0D14"/>
    <rect x="1" y="1" width="798" height="448" rx="15" fill="#121824" stroke="rgba(255,255,255,0.1)"/>
    
    <!-- Accent Gradient Header Line -->
    <rect x="0" y="0" width="800" height="6" rx="3" fill="url(#grad)"/>
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#8B5CF6"/>
        <stop offset="100%" stop-color="#06B6D4"/>
      </linearGradient>
    </defs>

    <!-- Brand Logo -->
    <text x="40" y="45" fill="#8B5CF6" font-family="'Outfit', sans-serif" font-weight="bold" font-size="20">⚡ VibeNote.sbs</text>
    <text x="760" y="45" text-anchor="end" fill="#9CA3AF" font-family="'Inter', sans-serif" font-size="14">ID: ${prompt.shortId}</text>

    <!-- Category & Platform Badges -->
    <rect x="40" y="70" width="90" height="24" rx="6" fill="rgba(6,182,212,0.15)"/>
    <text x="85" y="86" text-anchor="middle" fill="#06B6D4" font-family="'Inter', sans-serif" font-weight="bold" font-size="11">${category}</text>

    <rect x="140" y="70" width="90" height="24" rx="6" fill="rgba(139,92,246,0.15)"/>
    <text x="185" y="86" text-anchor="middle" fill="#A78BFA" font-family="'Inter', sans-serif" font-weight="bold" font-size="11">${platform}</text>

    <!-- Title -->
    <text x="40" y="130" fill="#F3F4F6" font-family="'Outfit', sans-serif" font-weight="bold" font-size="24">${title}</text>

    <!-- Description -->
    <text x="40" y="165" fill="#9CA3AF" font-family="'Inter', sans-serif" font-size="14">${description.slice(0, 90)}...</text>

    <!-- Content Code Preview Box -->
    <rect x="40" y="195" width="720" height="170" rx="10" fill="#06080D" stroke="rgba(255,255,255,0.08)"/>
    <text x="60" y="230" fill="#8B5CF6" font-family="'Inter', sans-serif" font-size="12" font-weight="bold">// Prompt Template Snippet</text>
    <text x="60" y="260" fill="#E5E7EB" font-family="monospace" font-size="13">${contentSnippet.slice(0, 80)}</text>
    <text x="60" y="285" fill="#E5E7EB" font-family="monospace" font-size="13">${contentSnippet.slice(80, 160)}</text>
    <text x="60" y="310" fill="#E5E7EB" font-family="monospace" font-size="13">${contentSnippet.slice(160, 240)}...</text>

    <!-- Footer Stats & Tags -->
    <text x="40" y="405" fill="#6B7280" font-family="'Inter', sans-serif" font-size="12">Tags: ${tags}</text>
    <text x="760" y="405" text-anchor="end" fill="#8B5CF6" font-family="'Inter', sans-serif" font-weight="bold" font-size="13">https://vibenote.sbs/p/${prompt.shortId}</text>
  </svg>`;
}

function escapeXml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
