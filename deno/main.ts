import { initDatabase, getPublicPrompts, getPromptByShortId, savePrompt, incrementStats, seedDatabase } from "./db.ts";
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
  const hostHeader = forwardedHost || req.headers.get("host") || "test.10rg.com";
  const scheme = req.headers.get("x-forwarded-proto") || (hostHeader.includes("test.10rg.com") ? "https" : "http");
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
    // Route 1: Home Page (Web Showcase)
    // -------------------------------------------------------------
    if (path === "/" && method === "GET") {
      const category = url.searchParams.get("category") || "all";
      const search = url.searchParams.get("search") || "";
      const sort = url.searchParams.get("sort") || "latest";

      const prompts = await getPublicPrompts({ category, search, sort });
      const html = renderHomePage(prompts, category, search, baseUrl);
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      });
    }

    // -------------------------------------------------------------
    // Route 2: Single Prompt Page /p/:shortId
    // -------------------------------------------------------------
    if (path.startsWith("/p/") && method === "GET") {
      const shortId = path.split("/")[2];
      const prompt = await getPromptByShortId(shortId);
      if (!prompt) {
        return new Response("Prompt not found", { status: 404 });
      }
      const html = renderPromptDetailPage(prompt, baseUrl);
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      });
    }

    // Direct short link route e.g. /Ghr3ds
    if (/^\/[a-zA-Z0-9]{5,10}$/.test(path) && method === "GET") {
      const shortId = path.slice(1);
      const prompt = await getPromptByShortId(shortId);
      if (prompt) {
        const html = renderPromptDetailPage(prompt, baseUrl);
        return new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
        });
      }
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
      const sort = url.searchParams.get("sort") || "latest";

      const prompts = await getPublicPrompts({ category, search, sort });
      return new Response(JSON.stringify(prompts), {
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
    // Route 6: API Export Prompt as .vibe File
    // -------------------------------------------------------------
    if (path.match(/^\/api\/prompts\/[a-zA-Z0-9_-]+\/export$/) && method === "GET") {
      const shortId = path.split("/")[3];
      const prompt = await getPromptByShortId(shortId);
      if (!prompt) {
        return new Response("Not found", { status: 404 });
      }

      const vibeData = {
        version: 2,
        type: "prompt",
        exportedAt: new Date().toISOString(),
        prompt: {
          kind: prompt.kind || "prompt",
          title: prompt.title,
          content: prompt.content,
          description: prompt.description,
          category: prompt.category,
          platform: prompt.platform,
          tags: prompt.tags,
          variables: prompt.variables,
        },
      };

      return new Response(JSON.stringify(vibeData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${shortId}.vibe"`,
          ...corsHeaders,
        },
      });
    }

    // -------------------------------------------------------------
    // Route 7: API Increment Stats (views/copies)
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
    // Route 8: API Seed Database
    // -------------------------------------------------------------
    if (path === "/api/seed") {
      const force = url.searchParams.get("force") === "true";
      const result = await seedDatabase(force);
      return new Response(JSON.stringify({ success: true, ...result }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  } catch (err: any) {
    console.error("Server error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

console.log(`🌐 VibeNote Deno Server listening on port ${PORT}`);
