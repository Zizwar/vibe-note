import { PromptDoc, VariableDefinition } from "../db.ts";

export function renderHomePage(prompts: PromptDoc[], selectedCategory = "all", searchQuery = "", baseUrl = "https://test.10rg.com"): string {
  const categoryList = [
    { id: "all", label: "✨ All Prompts" },
    { id: "image", label: "🖼️ Image & Art" },
    { id: "code", label: "💻 Code & Dev" },
    { id: "writing", label: "✍️ Writing & Content" },
    { id: "marketing", label: "📢 Marketing & SEO" },
    { id: "business", label: "💼 Business" },
    { id: "video", label: "🎬 Video & Motion" },
    { id: "music", label: "🎵 Music & Audio" },
    { id: "education", label: "🎓 Education" },
    { id: "other", label: "⚡ Other" },
  ];

  const cardsHtml = prompts.map(p => renderPromptCard(p, baseUrl)).join("");

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vibe Note — AI Prompt Bank & Variable Engine</title>
  <meta name="description" content="Discover, test, and save curated AI prompts with dynamic variables for ChatGPT, Midjourney, Claude, Gemini, and more. Connect directly with the Vibe Note app.">
  <meta name="keywords" content="AI prompts, prompt engineering, ChatGPT prompts, Midjourney prompts, Vibe Note, AI variable engine">
  
  <!-- OpenGraph -->
  <meta property="og:title" content="Vibe Note — AI Prompt Bank & Variable Engine">
  <meta property="og:description" content="Discover, test, and save curated AI prompts with dynamic variables. Open directly in the Vibe Note mobile app.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${baseUrl}">
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  
  <!-- CSS Styles -->
  <style>
    ${getGlobalStyles()}
  </style>
</head>
<body>
  <div class="app-layout">
    <!-- Header -->
    <header class="navbar">
      <div class="container nav-container">
        <a href="/" class="brand-logo">
          <div class="logo-icon">⚡</div>
          <span class="brand-name">Vibe<span class="gradient-text">Note</span></span>
        </a>
        <div class="nav-actions">
          <button class="btn btn-secondary" onclick="openCreateModal()">
            <span>+</span> Submit Prompt
          </button>
          <a href="vibenote://" class="btn btn-primary btn-glow">
            <span>📱</span> Open App
          </a>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container text-center">
        <div class="hero-badge">🚀 Powered by AI Variable Engine</div>
        <h1 class="hero-title">
          Master Your Prompts.<br>
          <span class="gradient-text">Fill Variables & Launch Anywhere.</span>
        </h1>
        <p class="hero-subtitle">
          Explore curated prompts, test variable inputs live, and sync seamlessly with the <strong>Vibe Note</strong> mobile application.
        </p>

        <!-- Search Bar -->
        <div class="search-box-wrapper">
          <div class="search-input-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="searchInput" placeholder="Search prompts by title, tag, or topic... (Press '/' to search)" value="${escapeHtml(searchQuery)}" onkeyup="handleSearch(event)">
            <button class="btn-search" onclick="triggerSearch()">Search</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Category Filters -->
    <section class="container categories-section">
      <div class="categories-scroll">
        ${categoryList.map(cat => `
          <button class="cat-pill ${selectedCategory === cat.id ? 'active' : ''}" onclick="filterCategory('${cat.id}')">
            ${cat.label}
          </button>
        `).join('')}
      </div>
    </section>

    <!-- Main Content Grid -->
    <main class="container main-content">
      <div class="section-header">
        <h2>Curated Prompt Bank (${prompts.length})</h2>
        <div class="sort-wrapper">
          <label for="sortSelect">Sort by:</label>
          <select id="sortSelect" onchange="changeSort(this.value)">
            <option value="latest">Latest</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      ${prompts.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>No prompts found</h3>
          <p>Try tweaking your search term or category filter.</p>
          <button class="btn btn-primary" onclick="filterCategory('all')">View All Prompts</button>
        </div>
      ` : `
        <div class="prompts-grid">
          ${cardsHtml}
        </div>
      `}
    </section>

    <!-- Modal for Submit Prompt -->
    <div id="createModal" class="modal-backdrop" onclick="closeCreateModal(event)">
      <div class="modal-card" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3>Submit a Prompt to Vibe Note</h3>
          <button class="close-btn" onclick="closeCreateModal()">✕</button>
        </div>
        <form id="createForm" onsubmit="submitPrompt(event)">
          <div class="form-group">
            <label>Prompt Title *</label>
            <input type="text" id="pTitle" required placeholder="e.g. Senior Code Reviewer">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Category</label>
              <select id="pCategory">
                <option value="code">Code & Dev</option>
                <option value="image">Image & Art</option>
                <option value="writing">Writing & Content</option>
                <option value="marketing">Marketing</option>
                <option value="business">Business</option>
                <option value="video">Video</option>
                <option value="music">Music</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label>Target AI Platform</label>
              <select id="pPlatform">
                <option value="chatgpt">ChatGPT</option>
                <option value="claude">Claude</option>
                <option value="gemini">Gemini</option>
                <option value="midjourney">Midjourney</option>
                <option value="cursor">Cursor</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Description</label>
            <input type="text" id="pDescription" placeholder="Brief summary of what this prompt accomplishes">
          </div>
          <div class="form-group">
            <label>Prompt Template (use {{variable}} or {{var:opt1|opt2}} syntax) *</label>
            <textarea id="pContent" rows="5" required placeholder="Write your prompt template here. Use {{language}} or {{tone:fun|serious}} for interactive variables!"></textarea>
          </div>
          <div class="form-group">
            <label>Tags (comma separated)</label>
            <input type="text" id="pTags" placeholder="e.g. typescript, clean-code, refactor">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeCreateModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Publish Prompt</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Toast Notification -->
    <div id="toast" class="toast-message"></div>

    <!-- Footer -->
    <footer class="footer">
      <div class="container footer-container">
        <div class="footer-brand">
          <span class="brand-name">Vibe<span class="gradient-text">Note</span></span>
          <p>Smart AI Prompt Management & Variable System.</p>
        </div>
        <div class="footer-links">
          <a href="vibenote://">App Protocol: <code>vibenote://</code></a>
          <span>•</span>
          <span>Deployable on Deno Deploy</span>
        </div>
      </div>
    </footer>
  </div>

  <script>
    ${getClientScripts(baseUrl)}
  </script>
</body>
</html>`;
}

export function renderPromptDetailPage(prompt: PromptDoc, baseUrl = "https://test.10rg.com"): string {
  const shortUrl = `${baseUrl}/p/${prompt.shortId}`;
  const appDeepLink = `vibenote://prompt/${prompt.shortId}?data=${encodeURIComponent(JSON.stringify(prompt))}`;

  // Structured Data JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    "name": prompt.title,
    "description": prompt.description || prompt.content.slice(0, 150),
    "programmingLanguage": prompt.category,
    "codeSampleType": "AI Prompt",
    "url": shortUrl,
    "dateCreated": prompt.createdAt,
  };

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(prompt.title)} — Vibe Note AI Prompt</title>
  <meta name="description" content="${escapeHtml(prompt.description || prompt.content.slice(0, 160))}">
  <meta name="keywords" content="${prompt.tags.join(', ')}, ${prompt.category}, ${prompt.platform}, AI Prompt">

  <!-- OpenGraph SEO -->
  <meta property="og:title" content="${escapeHtml(prompt.title)}">
  <meta property="og:description" content="${escapeHtml(prompt.description || prompt.content.slice(0, 160))}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${shortUrl}">

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
    ${JSON.stringify(jsonLd)}
  </script>

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">

  <style>
    ${getGlobalStyles()}
  </style>
</head>
<body>
  <div class="app-layout">
    <!-- Header -->
    <header class="navbar">
      <div class="container nav-container">
        <a href="/" class="brand-logo">
          <div class="logo-icon">⚡</div>
          <span class="brand-name">Vibe<span class="gradient-text">Note</span></span>
        </a>
        <div class="nav-actions">
          <a href="/" class="btn btn-secondary">← Back to Bank</a>
          <a href="${appDeepLink}" class="btn btn-primary btn-glow">
            <span>📱</span> Open in App
          </a>
        </div>
      </div>
    </header>

    <main class="container detail-container">
      <!-- Prompt Header Banner -->
      <div class="detail-header-card">
        <div class="detail-badges">
          <span class="badge cat-badge">${escapeHtml(prompt.category.toUpperCase())}</span>
          <span class="badge platform-badge">${escapeHtml(prompt.platform.toUpperCase())}</span>
          <span class="badge id-badge">ID: ${prompt.shortId}</span>
        </div>
        <h1 class="detail-title">${escapeHtml(prompt.title)}</h1>
        ${prompt.description ? `<p class="detail-desc">${escapeHtml(prompt.description)}</p>` : ''}
        
        <div class="tags-list">
          ${prompt.tags.map(t => `<span class="tag-item">#${escapeHtml(t)}</span>`).join('')}
        </div>

        <div class="metrics-row">
          <span>👀 ${prompt.views || 0} views</span>
          <span>📋 ${prompt.copies || 0} copies</span>
          <span>📅 ${new Date(prompt.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <!-- Main Interactive Columns -->
      <div class="interactive-grid">
        <!-- Left: Variable Controls -->
        <div class="panel variable-panel">
          <div class="panel-header">
            <h3>🎛️ Dynamic Variables (${prompt.variables ? prompt.variables.length : 0})</h3>
            <p>Adjust variables below to customize your prompt in real-time.</p>
          </div>
          ${(!prompt.variables || prompt.variables.length === 0) ? `
            <div class="no-vars-msg">
              <span>ℹ️</span> This prompt has no variables embedded. You can copy the template directly.
            </div>
          ` : `
            <form id="varsForm" oninput="updateCompiledPrompt()">
              ${prompt.variables.map(v => renderVariableControl(v)).join('')}
            </form>
          `}
        </div>

        <!-- Right: Live Compiled Prompt Box -->
        <div class="panel output-panel">
          <div class="panel-header flex-between">
            <h3>⚡ Live Compiled Output</h3>
            <button class="btn btn-small btn-secondary" onclick="toggleViewMode()" id="viewModeBtn">
              Show Template Syntax
            </button>
          </div>

          <div class="prompt-output-box" id="outputBox">
            <pre id="compiledContent"></pre>
          </div>

          <div class="action-buttons-group">
            <button class="btn btn-primary btn-glow" onclick="copyCompiledPrompt('${prompt.shortId}')">
              <span>📋</span> Copy Compiled Prompt
            </button>

            <a href="${appDeepLink}" class="btn btn-accent">
              <span>📱</span> Save in VibeNote App
            </a>

            <a href="/api/prompts/${prompt.shortId}/export" download="${prompt.shortId}.vibe" class="btn btn-secondary">
              <span>📥</span> Download .vibe File
            </a>

            <button class="btn btn-secondary" onclick="copyShortLink('${shortUrl}')">
              <span>🔗</span> Share Link
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Toast Notification -->
    <div id="toast" class="toast-message"></div>

    <footer class="footer">
      <div class="container text-center">
        <p>VibeNote Smart Prompt Bank & Variable Engine &copy; 2026</p>
      </div>
    </footer>
  </div>

  <script>
    const rawTemplate = ${JSON.stringify(prompt.content)};
    const varsData = ${JSON.stringify(prompt.variables || [])};
    let isShowingTemplate = false;

    function renderCompiled() {
      const outputElem = document.getElementById("compiledContent");
      if (!outputElem) return;

      if (isShowingTemplate) {
        outputElem.textContent = rawTemplate;
        return;
      }

      let text = rawTemplate;
      if (varsData && varsData.length > 0) {
        varsData.forEach(v => {
          const input = document.getElementById("var_" + v.name);
          const val = input ? input.value : (v.defaultValue || "");
          // Replace {{varName}} and {{varName|default}} and {{varName:opt1|opt2}}
          const regex = new RegExp("\\{\\{\\s*" + v.name + "\\s*(?:[:|][^}]*)?\\}\\}", "g");
          text = text.replace(regex, val);
        });
      }
      outputElem.textContent = text;
    }

    function updateCompiledPrompt() {
      renderCompiled();
    }

    function toggleViewMode() {
      isShowingTemplate = !isShowingTemplate;
      document.getElementById("viewModeBtn").textContent = isShowingTemplate ? "Show Compiled Output" : "Show Template Syntax";
      renderCompiled();
    }

    async function copyCompiledPrompt(shortId) {
      renderCompiled();
      const text = document.getElementById("compiledContent").textContent;
      try {
        await navigator.clipboard.writeText(text);
        showToast("✅ Copied to clipboard!");
        fetch('/api/prompts/' + shortId + '/stats', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ type: 'copy' }) });
      } catch (err) {
        showToast("❌ Failed to copy");
      }
    }

    async function copyShortLink(url) {
      try {
        await navigator.clipboard.writeText(url);
        showToast("🔗 Link copied to clipboard!");
      } catch (err) {
        showToast("❌ Failed to copy link");
      }
    }

    function showToast(msg) {
      const toast = document.getElementById("toast");
      toast.textContent = msg;
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 3000);
    }

    // Init
    renderCompiled();
    fetch('/api/prompts/${prompt.shortId}/stats', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ type: 'view' }) });
  </script>
</body>
</html>`;
}

function renderVariableControl(v: VariableDefinition): string {
  if (v.type === 'select' && v.options && v.options.length > 0) {
    return `
      <div class="var-field">
        <label for="var_${v.name}">${escapeHtml(v.name)} <span class="var-type">(select)</span></label>
        <select id="var_${v.name}" class="var-input" onchange="updateCompiledPrompt()">
          ${v.options.map((opt: string) => `
            <option value="${escapeHtml(opt)}" ${opt === v.defaultValue ? 'selected' : ''}>${escapeHtml(opt)}</option>
          `).join('')}
        </select>
      </div>
    `;
  }

  return `
    <div class="var-field">
      <label for="var_${v.name}">${escapeHtml(v.name)} <span class="var-type">(text)</span></label>
      <input type="text" id="var_${v.name}" class="var-input" value="${escapeHtml(v.defaultValue || '')}" oninput="updateCompiledPrompt()">
    </div>
  `;
}

function renderPromptCard(p: PromptDoc, baseUrl: string): string {
  const shortUrl = `/p/${p.shortId}`;
  const appDeepLink = `vibenote://prompt/${p.shortId}?data=${encodeURIComponent(JSON.stringify(p))}`;

  return `
    <div class="prompt-card">
      <div class="card-header">
        <div class="card-badges">
          <span class="badge cat-badge">${escapeHtml(p.category.toUpperCase())}</span>
          <span class="badge platform-badge">${escapeHtml(p.platform.toUpperCase())}</span>
        </div>
        <span class="card-vars-count">⚡ ${p.variables ? p.variables.length : 0} vars</span>
      </div>
      
      <h3 class="card-title">
        <a href="${shortUrl}">${escapeHtml(p.title)}</a>
      </h3>
      
      <p class="card-snippet">
        ${escapeHtml(p.description || p.content.slice(0, 120))}
      </p>

      <div class="card-tags">
        ${p.tags.slice(0, 3).map(t => `<span class="tag-item">#${escapeHtml(t)}</span>`).join('')}
      </div>

      <div class="card-footer">
        <div class="card-stats">
          <span>👀 ${p.views || 0}</span>
          <span>📋 ${p.copies || 0}</span>
        </div>
        <div class="card-actions">
          <a href="${shortUrl}" class="btn btn-small btn-secondary">Test / View</a>
          <a href="${appDeepLink}" class="btn btn-small btn-primary" title="Open in VibeNote App">Save in App</a>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getGlobalStyles(): string {
  return `
    :root {
      --bg-dark: #0A0D14;
      --bg-card: #121824;
      --bg-input: #1B2234;
      --border-color: rgba(255, 255, 255, 0.08);
      --accent-primary: #8B5CF6;
      --accent-glow: rgba(139, 92, 246, 0.4);
      --accent-cyan: #06B6D4;
      --text-main: #F3F4F6;
      --text-muted: #9CA3AF;
      --radius: 12px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
    body { background-color: var(--bg-dark); color: var(--text-main); min-height: 100vh; }

    .app-layout { display: flex; flex-direction: column; min-height: 100vh; }
    .container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
    .text-center { text-align: center; }

    /* Typography & Effects */
    h1, h2, h3, .brand-name { font-family: 'Outfit', sans-serif; }
    .gradient-text {
      background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    /* Navbar */
    .navbar {
      border-bottom: 1px solid var(--border-color);
      background: rgba(10, 13, 20, 0.8);
      backdrop-filter: blur(12px);
      position: sticky; top: 0; z-index: 100; padding: 1rem 0;
    }
    .nav-container { display: flex; justify-content: space-between; align-items: center; }
    .brand-logo { display: flex; align-items: center; gap: 0.5rem; text-decoration: none; font-size: 1.5rem; font-weight: 800; color: var(--text-main); }
    .logo-icon { width: 36px; height: 36px; background: linear-gradient(135deg, #8B5CF6, #06B6D4); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
    .nav-actions { display: flex; gap: 0.75rem; }

    /* Buttons */
    .btn {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.65rem 1.25rem; border-radius: var(--radius); font-weight: 600;
      font-size: 0.9rem; border: none; cursor: pointer; text-decoration: none; transition: all 0.2s ease;
    }
    .btn-primary { background: var(--accent-primary); color: white; }
    .btn-primary:hover { background: #7C3AED; transform: translateY(-1px); }
    .btn-secondary { background: rgba(255, 255, 255, 0.06); color: var(--text-main); border: 1px solid var(--border-color); }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.12); }
    .btn-accent { background: #06B6D4; color: white; }
    .btn-accent:hover { background: #0891B2; }
    .btn-glow { box-shadow: 0 0 15px var(--accent-glow); }
    .btn-small { padding: 0.4rem 0.8rem; font-size: 0.8rem; }

    /* Hero Section */
    .hero-section { padding: 4rem 0 3rem 0; }
    .hero-badge {
      display: inline-block; padding: 0.35rem 1rem; border-radius: 20px;
      background: rgba(139, 92, 246, 0.15); color: #A78BFA; border: 1px solid rgba(139, 92, 246, 0.3);
      font-size: 0.85rem; font-weight: 600; margin-bottom: 1.5rem;
    }
    .hero-title { font-size: 3rem; font-weight: 800; line-height: 1.2; margin-bottom: 1rem; }
    .hero-subtitle { font-size: 1.15rem; color: var(--text-muted); max-width: 650px; margin: 0 auto 2.5rem auto; line-height: 1.6; }

    /* Search Box */
    .search-box-wrapper { max-width: 650px; margin: 0 auto; }
    .search-input-box {
      display: flex; align-items: center; background: var(--bg-card);
      border: 1px solid var(--border-color); border-radius: 16px; padding: 0.5rem 0.75rem 0.5rem 1.25rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .search-icon { font-size: 1.2rem; margin-right: 0.75rem; color: var(--text-muted); }
    .search-input-box input {
      flex: 1; background: transparent; border: none; outline: none; color: white; font-size: 1rem;
    }
    .btn-search {
      background: var(--accent-primary); color: white; border: none;
      padding: 0.65rem 1.5rem; border-radius: 12px; font-weight: 600; cursor: pointer;
    }

    /* Category Filter Pills */
    .categories-section { margin-bottom: 2.5rem; }
    .categories-scroll { display: flex; gap: 0.6rem; overflow-x: auto; padding-bottom: 0.5rem; scrollbar-width: none; }
    .cat-pill {
      background: var(--bg-card); color: var(--text-muted); border: 1px solid var(--border-color);
      padding: 0.5rem 1.1rem; border-radius: 30px; white-space: nowrap; font-weight: 500; font-size: 0.85rem;
      cursor: pointer; transition: all 0.2s ease;
    }
    .cat-pill:hover, .cat-pill.active {
      background: var(--accent-primary); color: white; border-color: var(--accent-primary);
    }

    /* Grid & Cards */
    .main-content { margin-bottom: 4rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .sort-wrapper select {
      background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color);
      padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.85rem; outline: none;
    }
    .prompts-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem;
    }
    .prompt-card {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px;
      padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .prompt-card:hover { transform: translateY(-3px); border-color: rgba(139, 92, 246, 0.4); }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .card-badges { display: flex; gap: 0.4rem; }
    .badge {
      font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px; letter-spacing: 0.5px;
    }
    .cat-badge { background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan); }
    .platform-badge { background: rgba(139, 92, 246, 0.15); color: #A78BFA; }
    .id-badge { background: rgba(255, 255, 255, 0.08); color: var(--text-muted); }
    .card-vars-count { font-size: 0.8rem; color: #F59E0B; font-weight: 600; }
    .card-title { font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem; }
    .card-title a { color: var(--text-main); text-decoration: none; }
    .card-title a:hover { color: var(--accent-primary); }
    .card-snippet { font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1rem; flex: 1; }
    .card-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1.25rem; }
    .tag-item { font-size: 0.75rem; color: #9CA3AF; background: rgba(255,255,255,0.04); padding: 0.2rem 0.5rem; border-radius: 4px; }
    .card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 1rem; }
    .card-stats { display: flex; gap: 0.75rem; font-size: 0.8rem; color: var(--text-muted); }
    .card-actions { display: flex; gap: 0.5rem; }

    /* Empty state */
    .empty-state { text-align: center; padding: 4rem 1rem; background: var(--bg-card); border-radius: 16px; border: 1px dashed var(--border-color); }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }

    /* Detail Page */
    .detail-container { padding-top: 2rem; padding-bottom: 4rem; }
    .detail-header-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; padding: 2rem; margin-bottom: 2rem; }
    .detail-badges { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .detail-title { font-size: 2.2rem; font-weight: 800; margin-bottom: 0.75rem; }
    .detail-desc { font-size: 1.05rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 1rem; }
    .metrics-row { display: flex; gap: 1.5rem; font-size: 0.85rem; color: var(--text-muted); margin-top: 1rem; }

    .interactive-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 2rem; }
    @media (max-width: 900px) { .interactive-grid { grid-template-columns: 1fr; } }

    .panel { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; padding: 1.75rem; }
    .panel-header { margin-bottom: 1.5rem; }
    .panel-header h3 { font-size: 1.2rem; font-weight: 700; }
    .panel-header p { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }

    /* Form Fields */
    .var-field { margin-bottom: 1.25rem; }
    .var-field label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.4rem; }
    .var-type { font-weight: normal; color: var(--text-muted); font-size: 0.75rem; }
    .var-input {
      width: 100%; background: var(--bg-input); border: 1px solid var(--border-color);
      border-radius: 10px; padding: 0.65rem 0.85rem; color: white; font-size: 0.95rem; outline: none;
    }
    .var-input:focus { border-color: var(--accent-primary); }

    /* Output Box */
    .prompt-output-box {
      background: #06080D; border: 1px solid var(--border-color); border-radius: 14px;
      padding: 1.25rem; min-height: 250px; max-height: 450px; overflow-y: auto; margin-bottom: 1.5rem;
    }
    .prompt-output-box pre { white-space: pre-wrap; word-wrap: break-word; font-family: 'Fira Code', monospace, sans-serif; font-size: 0.95rem; line-height: 1.6; color: #E5E7EB; }

    .action-buttons-group { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
    @media (max-width: 600px) { .action-buttons-group { grid-template-columns: 1fr; } }

    /* Modal */
    .modal-backdrop {
      display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75);
      backdrop-filter: blur(8px); z-index: 1000; align-items: center; justify-content: center; padding: 1rem;
    }
    .modal-backdrop.active { display: flex; }
    .modal-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; width: 100%; max-width: 600px; padding: 1.75rem; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .close-btn { background: none; border: none; color: var(--text-muted); font-size: 1.2rem; cursor: pointer; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem; }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 10px; padding: 0.6rem 0.8rem; color: white; outline: none;
    }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }

    /* Toast */
    .toast-message {
      position: fixed; bottom: 2rem; right: 2rem; background: var(--bg-card); border: 1px solid var(--accent-primary);
      padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 600; color: white;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5); opacity: 0; transform: translateY(20px); transition: all 0.3s ease; pointer-events: none; z-index: 2000;
    }
    .toast-message.show { opacity: 1; transform: translateY(0); }

    /* Footer */
    .footer { border-top: 1px solid var(--border-color); padding: 2.5rem 0; color: var(--text-muted); font-size: 0.85rem; margin-top: auto; }
    .footer-container { display: flex; justify-content: space-between; align-items: center; }
  `;
}

function getClientScripts(baseUrl: string): string {
  return `
    function filterCategory(cat) {
      const url = new URL(window.location.href);
      if (cat === 'all') url.searchParams.delete('category');
      else url.searchParams.set('category', cat);
      window.location.href = url.toString();
    }

    function handleSearch(e) {
      if (e.key === 'Enter') triggerSearch();
    }

    function triggerSearch() {
      const q = document.getElementById("searchInput").value.trim();
      const url = new URL(window.location.href);
      if (q) url.searchParams.set('search', q);
      else url.searchParams.delete('search');
      window.location.href = url.toString();
    }

    function changeSort(val) {
      const url = new URL(window.location.href);
      url.searchParams.set('sort', val);
      window.location.href = url.toString();
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        document.getElementById("searchInput")?.focus();
      }
    });

    function openCreateModal() {
      document.getElementById("createModal").classList.add("active");
    }
    function closeCreateModal(e) {
      document.getElementById("createModal").classList.remove("active");
    }

    async function submitPrompt(e) {
      e.preventDefault();
      const title = document.getElementById("pTitle").value.trim();
      const category = document.getElementById("pCategory").value;
      const platform = document.getElementById("pPlatform").value;
      const description = document.getElementById("pDescription").value.trim();
      const content = document.getElementById("pContent").value.trim();
      const tags = document.getElementById("pTags").value.split(',').map(t => t.trim()).filter(Boolean);

      try {
        const res = await fetch('/api/prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, category, platform, description, content, tags, isPublic: true })
        });
        const data = await res.json();
        if (data.shortId) {
          window.location.href = '/p/' + data.shortId;
        } else {
          alert('Failed to publish prompt');
        }
      } catch (err) {
        alert('Error publishing prompt: ' + err.message);
      }
    }
  `;
}
