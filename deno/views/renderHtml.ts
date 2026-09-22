import { PromptDoc, VariableDefinition, PaginatedPrompts } from "../db.ts";

export function getGtmHeadScript(): string {
  return `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-KQG2BPK9');</script>
<!-- End Google Tag Manager -->`;
}

export function getGtmNoScript(): string {
  return `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KQG2BPK9"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;
}

export function renderHomePage(
  data: PaginatedPrompts,
  selectedCategory = "all",
  searchQuery = "",
  selectedTag = "",
  baseUrl = "https://vibenote.sbs"
): string {
  const { prompts, total, page, totalPages } = data;

  const categoryList = [
    { id: "all", label: '<i class="fa-solid fa-layer-group"></i> All' },
    { id: "code", label: '<i class="fa-solid fa-code"></i> Code' },
    { id: "image", label: '<i class="fa-solid fa-image"></i> Art & Image' },
    { id: "writing", label: '<i class="fa-solid fa-pen-nib"></i> Writing' },
    { id: "marketing", label: '<i class="fa-solid fa-bullhorn"></i> Marketing' },
    { id: "business", label: '<i class="fa-solid fa-briefcase"></i> Business' },
    { id: "education", label: '<i class="fa-solid fa-graduation-cap"></i> Education' },
    { id: "video", label: '<i class="fa-solid fa-film"></i> Video' },
    { id: "music", label: '<i class="fa-solid fa-music"></i> Music' },
    { id: "other", label: '<i class="fa-solid fa-sliders"></i> Other' },
  ];

  const cardsHtml = prompts.map(p => renderPromptCard(p, baseUrl)).join("");
  const paginationHtml = renderPaginationControls(page, totalPages, selectedCategory, searchQuery, selectedTag);

  let pageTitle = "Vibe Note — AI Prompt Bank & Dynamic Variable Engine";
  if (selectedCategory && selectedCategory !== 'all') {
    pageTitle = `${selectedCategory.toUpperCase()} AI Prompts — Vibe Note Bank`;
  } else if (selectedTag) {
    pageTitle = `#${selectedTag} AI Prompts — Vibe Note Bank`;
  } else if (searchQuery) {
    pageTitle = `Search "${searchQuery}" AI Prompts — Vibe Note`;
  }

  const pageDesc = "Explore 10,000+ curated AI prompts with dynamic variables for ChatGPT, Midjourney, Claude, Gemini & Cursor. Test live and sync with mobile app.";
  
  let canonicalUrl = baseUrl;
  if (selectedCategory && selectedCategory !== 'all') {
    canonicalUrl = `${baseUrl}/?category=${encodeURIComponent(selectedCategory)}`;
  } else if (selectedTag) {
    canonicalUrl = `${baseUrl}/?tag=${encodeURIComponent(selectedTag)}`;
  }

  const schemaJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        "url": baseUrl,
        "name": "Vibe Note",
        "description": "Smart AI Prompt Bank & Dynamic Variable Engine",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${baseUrl}/?search={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        "name": "Vibe Note",
        "url": baseUrl,
        "logo": `${baseUrl}/favicon.ico`
      },
      {
        "@type": "CollectionPage",
        "@id": `${canonicalUrl}#webpage`,
        "url": canonicalUrl,
        "name": pageTitle,
        "isPartOf": {
          "@id": `${baseUrl}/#website`
        },
        "description": pageDesc,
        "inLanguage": "en-US"
      }
    ]
  };

  const isFilteredPage = Boolean(selectedTag || searchQuery || (selectedCategory && selectedCategory !== 'all') || page > 1);
  const robotsMeta = isFilteredPage
    ? "noindex, follow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  ${getGtmHeadScript()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(pageDesc)}">
  <meta name="keywords" content="AI prompts, prompt engineering, ChatGPT prompts, Midjourney prompts, Claude prompts, Gemini prompts, AI prompt generator, Vibe Note">
  <meta name="robots" content="${robotsMeta}">
  <meta name="google-adsense-account" content="ca-pub-5448783245957365">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="alternate" type="application/rss+xml" title="Vibe Note - Latest Prompts" href="${baseUrl}/feed.xml">
  <link rel="sitemap" type="application/xml" title="Sitemap" href="${baseUrl}/sitemap.xml">

  <!-- OpenGraph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(pageDesc)}">
  <meta property="og:site_name" content="Vibe Note">
  <meta property="og:locale" content="en_US">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${canonicalUrl}">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(pageDesc)}">

  <!-- Schema.org JSON-LD Structured Data -->
  <script type="application/ld+json">
    ${JSON.stringify(schemaJsonLd)}
  </script>
  
  <!-- Google Fonts & FontAwesome CDN -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  
  <!-- CSS Styles -->
  <style>
    ${getGlobalStyles()}
  </style>
</head>
<body>
  ${getGtmNoScript()}
  <div class="app-layout">
    <!-- Header -->
    <header class="navbar">
      <div class="container nav-container">
        <a href="/" class="brand-logo">
          <div class="logo-icon"><i class="fa-solid fa-bolt"></i></div>
          <span class="brand-name">Vibe<span class="gradient-text">Note</span></span>
        </a>
        <div class="nav-actions">
          <button class="btn btn-secondary btn-compact" onclick="openCreateModal()">
            <i class="fa-solid fa-plus"></i> <span class="hide-mobile">Submit</span>
          </button>
          <a href="vibenote://" class="btn btn-primary btn-glow btn-compact">
            <i class="fa-solid fa-mobile-screen-button"></i> <span class="hide-mobile">App</span>
          </a>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container text-center">
        <div class="hero-badge"><i class="fa-solid fa-wand-magic-sparkles"></i> Variable Engine</div>
        <h1 class="hero-title">
          Master Your Prompts.<br>
          <span class="gradient-text">Fill Variables & Launch Anywhere.</span>
        </h1>
        <p class="hero-subtitle">
          Explore ${total.toLocaleString()} prompts, test variable inputs live, and sync with the <strong>Vibe Note</strong> app.
        </p>

        <!-- Compact Search Bar -->
        <div class="search-box-wrapper">
          <div class="search-input-box">
            <span class="search-icon"><i class="fa-solid fa-magnifying-glass"></i></span>
            <input type="text" id="searchInput" placeholder="Title, tag, or topic..." value="${escapeHtml(searchQuery)}" onkeyup="handleSearch(event)">
            <button class="btn-search" onclick="triggerSearch()"><i class="fa-solid fa-magnifying-glass"></i></button>
          </div>
        </div>
      </div>
    </section>

    <!-- Category Filters (Crawlable <a> links for search engines) -->
    <section class="container categories-section">
      <div class="categories-scroll">
        ${categoryList.map(cat => `
          <a href="${cat.id === 'all' ? '/' : `/?category=${cat.id}`}" class="cat-pill ${selectedCategory === cat.id ? 'active' : ''}">
            ${cat.label}
          </a>
        `).join('')}
      </div>
    </section>

    <!-- Main Content Grid -->
    <main class="container main-content">
      <div class="section-header">
        <div class="header-title-group">
          <h2>Prompt Bank (${total.toLocaleString()})</h2>
          ${selectedTag ? `
            <span class="active-tag-badge">
              Tag: #${escapeHtml(selectedTag)}
              <a href="/" class="clear-tag-btn" title="Clear tag filter"><i class="fa-solid fa-xmark"></i></a>
            </span>
          ` : ''}
        </div>
        <div class="sort-wrapper">
          <label for="sortSelect">View:</label>
          <select id="sortSelect" onchange="changeSort(this.value)">
            <option value="random">Discover (Magazine Mix)</option>
            <option value="latest">Latest</option>
            <option value="popular">Popular</option>
          </select>
        </div>
      </div>

      ${prompts.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
          <h3>No prompts found</h3>
          <p>Try tweaking your search term or category filter.</p>
          <a href="/" class="btn btn-primary">View All Prompts</a>
        </div>
      ` : `
        <div class="prompts-grid">
          ${cardsHtml}
        </div>
        ${paginationHtml}
      `}
    </main>

    <!-- Modal for Submit Prompt -->
    <div id="createModal" class="modal-backdrop" onclick="closeCreateModal(event)">
      <div class="modal-card" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3>Submit a Prompt</h3>
          <button class="close-btn" onclick="closeCreateModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="createForm" onsubmit="submitPrompt(event)">
          <div class="form-group">
            <label>Prompt Title *</label>
            <input type="text" id="pTitle" required placeholder="e.g. Code Reviewer">
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
              <label>Platform</label>
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
            <label>Prompt Template *</label>
            <textarea id="pContent" rows="5" required placeholder="Write your prompt template here. Use {{variable}} for interactive inputs."></textarea>
          </div>
          <div class="form-group">
            <label>Tags (comma separated)</label>
            <input type="text" id="pTags" placeholder="e.g. typescript, clean-code">
          </div>
          <div class="submit-privacy-notice" style="margin-top: 14px; font-size: 0.82rem; color: var(--text-muted); display: flex; align-items: center; gap: 8px; background: rgba(245, 158, 11, 0.08); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.2);">
            <i class="fa-solid fa-shield-halved" style="color: #fbbf24;"></i>
            <span>البرومبتات الجديدة تُحفظ كخاصة (Private) لحماية السيرفر من الإغراق وتتطلب تفعيل الإدارة قبل الظهور للعامة.</span>
          </div>
          <div class="modal-footer" style="margin-top: 14px;">
            <button type="button" class="btn btn-secondary" onclick="closeCreateModal()">Cancel</button>
            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-paper-plane"></i> Submit for Review</button>
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
          <p>Smart AI Prompt Management System</p>
        </div>
        <div class="footer-links">
          <a href="/feed.xml"><i class="fa-solid fa-rss"></i> RSS Feed</a>
          <span>•</span>
          <a href="/sitemap.xml"><i class="fa-solid fa-sitemap"></i> Sitemap</a>
          <span>•</span>
          <a href="vibenote://">App: <code>vibenote://</code></a>
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

export function renderPromptDetailPage(
  prompt: PromptDoc,
  baseUrl = "https://vibenote.sbs",
  isAdmin = false,
  openEditOnLoad = false
): string {
  const shortUrl = `${baseUrl}/p/${prompt.shortId}`;
  const jsonUrl = `${shortUrl}?type=json`;
  const mdUrl = `${shortUrl}?type=md`;
  const xmlUrl = `${shortUrl}?type=xml`;
  const svgUrl = `${shortUrl}?type=svg`;
  const appDeepLink = `vibenote://prompt/${prompt.shortId}?data=${encodeURIComponent(JSON.stringify(prompt))}`;

  const promptImages: string[] = (prompt.images && prompt.images.length > 0)
    ? prompt.images
    : (prompt.image ? [prompt.image] : []);
  const primaryImage = promptImages[0] || "";
  const resolvedOgImage = primaryImage
    ? (primaryImage.startsWith("http") ? primaryImage : `${baseUrl}${primaryImage}`)
    : svgUrl;
  const isCustomImage = Boolean(primaryImage);
  const ogImageType = primaryImage
    ? (primaryImage.endsWith(".png") ? "image/png" : primaryImage.endsWith(".webp") ? "image/webp" : "image/jpeg")
    : "image/svg+xml";

  const promptTitle = `${prompt.title} — Vibe Note AI Prompt`;
  const promptDescription = prompt.description || prompt.content.slice(0, 160);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareSourceCode",
        "@id": `${shortUrl}#code`,
        "name": prompt.title,
        "description": promptDescription,
        "programmingLanguage": prompt.category,
        "codeSampleType": "AI Prompt Template",
        "url": shortUrl,
        ...(primaryImage ? { "image": resolvedOgImage } : {}),
        "dateCreated": prompt.createdAt,
        "dateModified": prompt.updatedAt || prompt.createdAt,
        "author": {
          "@type": "Organization",
          "name": "Vibe Note",
          "url": baseUrl
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${shortUrl}#breadcrumb`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": baseUrl
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": prompt.category.toUpperCase(),
            "item": `${baseUrl}/?category=${encodeURIComponent(prompt.category)}`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": prompt.title,
            "item": shortUrl
          }
        ]
      },
      {
        "@type": "Article",
        "@id": `${shortUrl}#article`,
        "headline": prompt.title,
        "description": promptDescription,
        "mainEntityOfPage": shortUrl,
        ...(primaryImage ? { "image": resolvedOgImage } : {}),
        "datePublished": prompt.createdAt,
        "dateModified": prompt.updatedAt || prompt.createdAt,
        "publisher": {
          "@type": "Organization",
          "name": "Vibe Note",
          "url": baseUrl
        }
      }
    ]
  };

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  ${getGtmHeadScript()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(promptTitle)}</title>
  <meta name="description" content="${escapeHtml(promptDescription)}">
  <meta name="keywords" content="${prompt.tags.join(', ')}, ${prompt.category}, ${prompt.platform}, AI Prompt, Vibe Note">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="google-adsense-account" content="ca-pub-5448783245957365">
  <link rel="canonical" href="${shortUrl}">
  <link rel="alternate" type="application/json" href="${jsonUrl}">
  <link rel="alternate" type="text/markdown" href="${mdUrl}">

  <!-- OpenGraph SEO -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${shortUrl}">
  <meta property="og:title" content="${escapeHtml(prompt.title)} — Vibe Note">
  <meta property="og:description" content="${escapeHtml(promptDescription)}">
  <meta property="og:site_name" content="Vibe Note">
  <meta property="og:locale" content="en_US">
  <meta property="og:image" content="${resolvedOgImage}">
  <meta property="og:image:type" content="${ogImageType}">
  <meta property="og:image:width" content="${isCustomImage ? '1200' : '800'}">
  <meta property="og:image:height" content="${isCustomImage ? '630' : '450'}">
  <meta property="og:image:alt" content="${escapeHtml(prompt.title)} Visual Preview">

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${shortUrl}">
  <meta name="twitter:title" content="${escapeHtml(prompt.title)} — Vibe Note">
  <meta name="twitter:description" content="${escapeHtml(promptDescription)}">
  <meta name="twitter:image" content="${resolvedOgImage}">

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
    ${JSON.stringify(jsonLd)}
  </script>

  <!-- Google Fonts & FontAwesome CDN -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

  <style>
    ${getGlobalStyles()}
  </style>
</head>
<body>
  ${getGtmNoScript()}
  <div class="app-layout">
    <!-- Header -->
    <header class="navbar">
      <div class="container nav-container">
        <a href="/" class="brand-logo">
          <div class="logo-icon"><i class="fa-solid fa-bolt"></i></div>
          <span class="brand-name">Vibe<span class="gradient-text">Note</span></span>
        </a>
        <div class="nav-actions">
          <button class="btn btn-warning btn-compact" onclick="handleEditPromptClick()" title="Edit Prompt">
            <i class="fa-solid fa-pen-to-square"></i> <span class="hide-mobile">Edit</span>
          </button>
          <a href="/" class="btn btn-secondary btn-compact"><i class="fa-solid fa-arrow-left"></i> <span class="hide-mobile">Bank</span></a>
          <a href="${appDeepLink}" class="btn btn-primary btn-glow btn-compact">
            <i class="fa-solid fa-mobile-screen-button"></i> <span class="hide-mobile">App</span>
          </a>
        </div>
      </div>
    </header>

    <main class="container detail-container">
      ${isAdmin && (prompt.status === 'pending' || prompt.visibility === 'private' || !prompt.isPublic) ? `
        <div class="admin-review-banner" style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); padding: 14px 18px; border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <span style="color: #fbbf24; font-weight: 700;"><i class="fa-solid fa-triangle-exclamation"></i> Admin Review Mode:</span>
            <span style="color: #e5e7eb; font-size: 0.9rem; margin-left: 6px;">This prompt is <strong>PRIVATE</strong> (pending approval) and hidden from the public.</span>
          </div>
          <button onclick="approveCurrentPrompt('${prompt.shortId}')" class="btn btn-success btn-small">
            <i class="fa-solid fa-check"></i> Approve & Publish Live
          </button>
        </div>
        <script>
          async function approveCurrentPrompt(id) {
            if (!confirm("Approve this prompt and make it public for everyone?")) return;
            try {
              const res = await fetch('/api/admin/approve/' + id, { method: 'POST' });
              if (res.ok) {
                alert("Prompt approved and published!");
                window.location.reload();
              } else {
                alert("Failed to approve prompt.");
              }
            } catch(e) { alert("Error: " + e.message); }
          }
        </script>
      ` : ''}
      <!-- Prompt Header Banner -->
      <div class="detail-header-card">
        <div class="detail-badges">
          <span class="badge cat-badge">${escapeHtml(prompt.category.toUpperCase())}</span>
          <span class="badge platform-badge">${escapeHtml(prompt.platform.toUpperCase())}</span>
          <span class="badge id-badge">ID: ${prompt.shortId}</span>
          <button class="btn btn-warning btn-small" onclick="handleEditPromptClick()" style="margin-left: auto;" title="Edit this prompt">
            <i class="fa-solid fa-pen-to-square"></i> Edit Prompt
          </button>
        </div>
        <h1 class="detail-title">${escapeHtml(prompt.title)}</h1>
        ${prompt.description ? `<p class="detail-desc">${escapeHtml(prompt.description)}</p>` : ''}
        
        <div class="tags-list">
          ${prompt.tags.map(t => `<a href="/?tag=${encodeURIComponent(t)}" class="tag-item">#${escapeHtml(t)}</a>`).join('')}
        </div>

        <div class="metrics-row">
          <span><i class="fa-regular fa-eye"></i> ${prompt.views || 0}</span>
          <span><i class="fa-regular fa-copy"></i> ${prompt.copies || 0}</span>
          <span><i class="fa-regular fa-calendar"></i> ${new Date(prompt.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <!-- Prompt Image Showcase & Gallery -->
      ${promptImages.length > 0 ? `
        <div class="panel prompt-gallery-panel">
          <div class="gallery-header flex-between">
            <h3><i class="fa-solid fa-images"></i> Visual Output & Preview Gallery (${promptImages.length})</h3>
            <span class="gallery-hint"><i class="fa-solid fa-magnifying-glass-plus"></i> Click image to enlarge</span>
          </div>
          <div class="gallery-featured-wrapper" onclick="openLightbox(currentGalleryIndex)">
            <img id="featuredGalleryImg" src="${escapeHtml(promptImages[0].startsWith('http') ? promptImages[0] : `${baseUrl}${promptImages[0]}`)}" alt="${escapeHtml(prompt.title)}" />
            <div class="gallery-overlay">
              <span class="gallery-zoom-badge"><i class="fa-solid fa-expand"></i> View Fullscreen</span>
            </div>
          </div>
          ${promptImages.length > 1 ? `
            <div class="gallery-thumbs-row">
              ${promptImages.map((img, idx) => {
                const fullSrc = img.startsWith('http') ? img : `${baseUrl}${img}`;
                return `
                  <div class="gallery-thumb-item ${idx === 0 ? 'active' : ''}" onclick="selectGalleryImage(${idx}, '${escapeHtml(fullSrc)}')">
                    <img src="${escapeHtml(fullSrc)}" alt="Thumb ${idx + 1}" loading="lazy" />
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}
        </div>
      ` : (isAdmin ? `
        <div class="panel prompt-gallery-panel prompt-gallery-empty" style="text-align: center; padding: 22px; border: 1px dashed rgba(255,255,255,0.15); margin-bottom: 24px;">
          <i class="fa-regular fa-image" style="font-size: 2.2rem; color: #6b7280; margin-bottom: 8px;"></i>
          <p style="color: #9ca3af; margin-bottom: 12px; font-size: 0.95rem;">No images attached to this prompt yet.</p>
          <button class="btn btn-secondary btn-small" onclick="openEditModal()"><i class="fa-solid fa-plus"></i> Add Images</button>
        </div>
      ` : '')}

      <!-- Main Interactive Columns -->
      <div class="interactive-grid">
        <!-- Left: Variable Controls -->
        <div class="panel variable-panel">
          <div class="panel-header">
            <h3><i class="fa-solid fa-sliders"></i> Dynamic Variables (${prompt.variables ? prompt.variables.length : 0})</h3>
            <p>Adjust variables below to customize your prompt in real-time.</p>
          </div>
          ${(!prompt.variables || prompt.variables.length === 0) ? `
            <div class="no-vars-msg">
              <i class="fa-solid fa-circle-info"></i> This prompt has no variables embedded. You can copy the template directly.
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
            <h3><i class="fa-solid fa-bolt"></i> Live Output</h3>
            <button class="btn btn-small btn-secondary" onclick="toggleViewMode()" id="viewModeBtn">
              Show Template Syntax
            </button>
          </div>

          <div class="prompt-output-box" id="outputBox">
            <pre id="compiledContent"></pre>
          </div>

          <div class="action-buttons-group">
            <button class="btn btn-primary btn-glow" onclick="copyCompiledPrompt('${prompt.shortId}')">
              <i class="fa-regular fa-copy"></i> Copy Prompt
            </button>

            <a href="${appDeepLink}" class="btn btn-accent">
              <i class="fa-solid fa-bookmark"></i> Save in App
            </a>

            <button class="btn btn-secondary" onclick="copyShortLink('${shortUrl}')">
              <i class="fa-solid fa-share-nodes"></i> Share Link
            </button>

            <a href="${mdUrl}" target="_blank" class="btn btn-secondary">
              <i class="fa-brands fa-markdown"></i> Export Markdown
            </a>
          </div>
        </div>
      </div>

      <!-- Developer Integration & Direct API Formats -->
      <div class="panel dev-integration-panel">
        <div class="panel-header">
          <h3><i class="fa-solid fa-code"></i> Developer API & Direct Formats</h3>
          <p>Fetch this prompt directly in your code via <code>JSON</code>, <code>Markdown</code>, or <code>SVG Card</code> endpoints.</p>
        </div>

        <div class="dev-tabs">
          <div class="dev-links-grid">
            <div class="dev-link-card">
              <span class="dev-link-title"><i class="fa-solid fa-file-code"></i> Direct JSON API</span>
              <code>GET ${jsonUrl}</code>
              <button class="btn btn-small btn-secondary" onclick="copyText('${jsonUrl}')"><i class="fa-regular fa-copy"></i> Copy URL</button>
            </div>

            <div class="dev-link-card">
              <span class="dev-link-title"><i class="fa-brands fa-markdown"></i> Markdown Raw</span>
              <code>GET ${mdUrl}</code>
              <button class="btn btn-small btn-secondary" onclick="copyText('${mdUrl}')"><i class="fa-regular fa-copy"></i> Copy URL</button>
            </div>

            <div class="dev-link-card">
              <span class="dev-link-title"><i class="fa-solid fa-code"></i> Direct XML API</span>
              <code>GET ${xmlUrl}</code>
              <button class="btn btn-small btn-secondary" onclick="copyText('${xmlUrl}')"><i class="fa-regular fa-copy"></i> Copy URL</button>
            </div>

            <div class="dev-link-card">
              <span class="dev-link-title"><i class="fa-solid fa-image"></i> Dynamic SVG Card</span>
              <code>GET ${svgUrl}</code>
              <button class="btn btn-small btn-secondary" onclick="copyText('${svgUrl}')"><i class="fa-regular fa-copy"></i> Copy URL</button>
            </div>
          </div>

          <!-- Code Snippets Example -->
          <div class="code-snippet-box">
            <div class="snippet-header">
              <span>JavaScript Fetch Example</span>
            </div>
            <pre>const res = await fetch("${jsonUrl}");
const prompt = await res.json();
console.log(prompt.title, prompt.content);</pre>
          </div>

          <div class="code-snippet-box">
            <div class="snippet-header">
              <span>cURL Command Example</span>
            </div>
            <pre>curl -s "${mdUrl}"</pre>
          </div>
        </div>
      </div>
    </main>

    <!-- Lightbox Modal -->
    <div id="imageLightboxModal" class="lightbox-modal" onclick="handleLightboxBackdropClick(event)">
      <div class="lightbox-toolbar">
        <span id="lightboxCounter" class="lightbox-counter">1 / 1</span>
        <div class="lightbox-actions">
          <button type="button" class="lightbox-btn" onclick="zoomLightbox(0.2)" title="Zoom In"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
          <button type="button" class="lightbox-btn" onclick="zoomLightbox(-0.2)" title="Zoom Out"><i class="fa-solid fa-magnifying-glass-minus"></i></button>
          <button type="button" class="lightbox-btn" onclick="resetLightboxZoom()" title="Reset Zoom"><i class="fa-solid fa-rotate-left"></i></button>
          <a id="lightboxDownloadBtn" href="" target="_blank" class="lightbox-btn" title="Open in new tab"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>
          <button type="button" class="lightbox-btn lightbox-close" onclick="closeLightboxDirect()" title="Close (Esc)"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
      <div class="lightbox-body">
        <button id="lightboxPrevBtn" type="button" class="lightbox-nav-btn prev" onclick="prevLightboxImage(event)"><i class="fa-solid fa-chevron-left"></i></button>
        <div class="lightbox-img-wrapper" id="lightboxImgWrapper">
          <img id="lightboxMainImg" src="" alt="Enlarged Prompt Image" />
        </div>
        <button id="lightboxNextBtn" type="button" class="lightbox-nav-btn next" onclick="nextLightboxImage(event)"><i class="fa-solid fa-chevron-right"></i></button>
      </div>
    </div>

    <!-- Admin Authentication Modal (Opens when unauthenticated user clicks Edit) -->
    <div id="adminAuthModal" class="modal-backdrop" style="display: none;" onclick="handleAuthBackdropClick(event)">
      <div class="modal-window modal-auth" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3><i class="fa-solid fa-lock" style="color: #fbbf24;"></i> Admin Authentication</h3>
          <button type="button" class="modal-close" onclick="closeAuthModal()">&times;</button>
        </div>
        <div class="modal-body">
          <p style="color: #9ca3af; font-size: 0.9rem; margin-bottom: 1rem;">
            Please enter your admin password to edit this prompt, update details, and upload images.
          </p>
          <div id="authErrorAlert" class="alert alert-error" style="display: none; margin-bottom: 1rem;"></div>
          <form id="authPromptForm" onsubmit="handleAuthSubmit(event)">
            <div class="form-group">
              <label for="adminAuthPassword"><i class="fa-solid fa-key"></i> Master Password</label>
              <input type="password" id="adminAuthPassword" required placeholder="••••••••••••" class="form-input" autofocus />
            </div>
            <div class="modal-footer" style="margin-top: 1rem; display: flex; justify-content: flex-end; gap: 8px;">
              <button type="button" class="btn btn-secondary" onclick="closeAuthModal()">Cancel</button>
              <button type="submit" id="authSubmitBtn" class="btn btn-primary btn-glow">
                <i class="fa-solid fa-unlock"></i> Unlock & Edit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Admin Edit Prompt Modal -->
    <div id="editPromptModal" class="modal-backdrop" style="display: none;" onclick="handleEditBackdropClick(event)">
      <div class="modal-window modal-wide" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3><i class="fa-solid fa-pen-to-square"></i> Edit Prompt (${prompt.shortId})</h3>
          <button type="button" class="modal-close" onclick="closeEditModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form id="editPromptForm" onsubmit="handleEditPromptSubmit(event)">
            <div class="form-group">
              <label>Title</label>
              <input type="text" id="editTitle" required class="form-input" value="${escapeHtml(prompt.title)}" />
            </div>

            <div class="form-row">
              <div class="form-group half">
                <label>Category</label>
                <select id="editCategory" class="form-select">
                  <option value="all">All</option>
                  <option value="code" ${prompt.category === 'code' ? 'selected' : ''}>Code</option>
                  <option value="image" ${prompt.category === 'image' ? 'selected' : ''}>Art & Image</option>
                  <option value="writing" ${prompt.category === 'writing' ? 'selected' : ''}>Writing</option>
                  <option value="marketing" ${prompt.category === 'marketing' ? 'selected' : ''}>Marketing</option>
                  <option value="business" ${prompt.category === 'business' ? 'selected' : ''}>Business</option>
                  <option value="education" ${prompt.category === 'education' ? 'selected' : ''}>Education</option>
                  <option value="video" ${prompt.category === 'video' ? 'selected' : ''}>Video</option>
                  <option value="music" ${prompt.category === 'music' ? 'selected' : ''}>Music</option>
                  <option value="other" ${prompt.category === 'other' ? 'selected' : ''}>Other</option>
                </select>
              </div>

              <div class="form-group half">
                <label>Platform</label>
                <select id="editPlatform" class="form-select">
                  <option value="chatgpt" ${prompt.platform === 'chatgpt' ? 'selected' : ''}>ChatGPT</option>
                  <option value="midjourney" ${prompt.platform === 'midjourney' ? 'selected' : ''}>Midjourney</option>
                  <option value="claude" ${prompt.platform === 'claude' ? 'selected' : ''}>Claude</option>
                  <option value="gemini" ${prompt.platform === 'gemini' ? 'selected' : ''}>Gemini</option>
                  <option value="cursor" ${prompt.platform === 'cursor' ? 'selected' : ''}>Cursor</option>
                  <option value="general" ${prompt.platform === 'general' ? 'selected' : ''}>General</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group half">
                <label>Status</label>
                <select id="editStatus" class="form-select">
                  <option value="approved" ${prompt.status === 'approved' ? 'selected' : ''}>Approved (Published)</option>
                  <option value="pending" ${prompt.status === 'pending' ? 'selected' : ''}>Pending (Review Queue)</option>
                </select>
              </div>

              <div class="form-group half">
                <label>Visibility</label>
                <select id="editVisibility" class="form-select">
                  <option value="public" ${prompt.visibility !== 'private' ? 'selected' : ''}>Public (Listed)</option>
                  <option value="private" ${prompt.visibility === 'private' ? 'selected' : ''}>Private (Hidden)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea id="editDescription" rows="2" class="form-textarea">${escapeHtml(prompt.description || '')}</textarea>
            </div>

            <div class="form-group">
              <label>Prompt Template Content</label>
              <textarea id="editContent" rows="6" required class="form-textarea code-font">${escapeHtml(prompt.content)}</textarea>
              <small class="form-hint">Use <code>{{variable_name}}</code> for dynamic variables.</small>
            </div>

            <div class="form-group">
              <label>Tags (Comma-separated)</label>
              <input type="text" id="editTags" class="form-input" value="${escapeHtml(prompt.tags.join(', '))}" />
            </div>

            <!-- Image Management Section -->
            <div class="images-manager-card">
              <div class="images-manager-header">
                <h4><i class="fa-solid fa-photo-film"></i> Prompt Images & Gallery</h4>
                <small>Upload images to Cloudflare R2 or add image URLs. Supports multiple images per prompt.</small>
              </div>

              <div id="editImagesList" class="edit-images-list"></div>

              <div class="image-add-controls">
                <div class="add-url-row">
                  <input type="url" id="newImageUrlInput" placeholder="https://example.com/image.png" class="form-input" />
                  <button type="button" class="btn btn-secondary" onclick="addImageFromUrl()"><i class="fa-solid fa-link"></i> Add URL</button>
                </div>

                <div class="upload-r2-dropzone" onclick="document.getElementById('r2FileInput').click()">
                  <input type="file" id="r2FileInput" accept="image/*" style="display:none" onchange="uploadFileToR2(this)" />
                  <i class="fa-solid fa-cloud-arrow-up dropzone-icon"></i>
                  <div class="dropzone-text">
                    <strong>Click to upload image to Cloudflare R2</strong>
                    <span>Supports JPG, PNG, WEBP, GIF, SVG (Up to 10MB)</span>
                  </div>
                  <div id="uploadSpinner" class="upload-spinner" style="display: none;">
                    <i class="fa-solid fa-spinner fa-spin"></i> Uploading to Cloudflare R2...
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer" style="margin-top: 16px; display: flex; justify-content: flex-end; gap: 8px;">
              <button type="button" class="btn btn-secondary" onclick="closeEditModal()">Cancel</button>
              <button type="submit" id="saveEditBtn" class="btn btn-primary btn-glow"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div id="toast" class="toast-message"></div>

    <footer class="footer">
      <div class="container text-center">
        <p>VibeNote Smart Prompt Bank &copy; 2026 — vibenote.sbs</p>
      </div>
    </footer>
  </div>

  <script>
    const rawTemplate = ${JSON.stringify(prompt.content)};
    const varsData = ${JSON.stringify(prompt.variables || [])};
    const galleryItems = ${JSON.stringify(promptImages.map(img => img.startsWith("http") ? img : `${baseUrl}${img}`))};
    let currentGalleryIndex = 0;
    let lightboxZoom = 1;
    let isShowingTemplate = false;

    function selectGalleryImage(idx, src) {
      currentGalleryIndex = idx;
      const featImg = document.getElementById("featuredGalleryImg");
      if (featImg) featImg.src = src;
      document.querySelectorAll(".gallery-thumb-item").forEach((el, i) => {
        el.classList.toggle("active", i === idx);
      });
    }

    function openLightbox(idx) {
      if (!galleryItems || galleryItems.length === 0) return;
      currentGalleryIndex = idx || 0;
      updateLightboxContent();
      const modal = document.getElementById("imageLightboxModal");
      if (modal) modal.classList.add("active");
      document.body.style.overflow = "hidden";
    }

    function closeLightboxDirect() {
      const modal = document.getElementById("imageLightboxModal");
      if (modal) modal.classList.remove("active");
      document.body.style.overflow = "";
      resetLightboxZoom();
    }

    function handleLightboxBackdropClick(e) {
      if (e.target.id === "imageLightboxModal" || e.target.id === "lightboxImgWrapper") {
        closeLightboxDirect();
      }
    }

    function updateLightboxContent() {
      const src = galleryItems[currentGalleryIndex];
      const img = document.getElementById("lightboxMainImg");
      const counter = document.getElementById("lightboxCounter");
      const downloadBtn = document.getElementById("lightboxDownloadBtn");
      if (img) img.src = src;
      if (counter) counter.textContent = (currentGalleryIndex + 1) + " / " + galleryItems.length;
      if (downloadBtn) downloadBtn.href = src;

      const prevBtn = document.getElementById("lightboxPrevBtn");
      const nextBtn = document.getElementById("lightboxNextBtn");
      if (prevBtn) prevBtn.style.display = galleryItems.length > 1 ? "flex" : "none";
      if (nextBtn) nextBtn.style.display = galleryItems.length > 1 ? "flex" : "none";
    }

    function nextLightboxImage(e) {
      if (e) e.stopPropagation();
      if (galleryItems.length <= 1) return;
      currentGalleryIndex = (currentGalleryIndex + 1) % galleryItems.length;
      resetLightboxZoom();
      updateLightboxContent();
    }

    function prevLightboxImage(e) {
      if (e) e.stopPropagation();
      if (galleryItems.length <= 1) return;
      currentGalleryIndex = (currentGalleryIndex - 1 + galleryItems.length) % galleryItems.length;
      resetLightboxZoom();
      updateLightboxContent();
    }

    function zoomLightbox(delta) {
      lightboxZoom = Math.max(0.5, Math.min(3, lightboxZoom + delta));
      const img = document.getElementById("lightboxMainImg");
      if (img) img.style.transform = "scale(" + lightboxZoom + ")";
    }

    function resetLightboxZoom() {
      lightboxZoom = 1;
      const img = document.getElementById("lightboxMainImg");
      if (img) img.style.transform = "scale(1)";
    }

    document.addEventListener("keydown", (e) => {
      const modal = document.getElementById("imageLightboxModal");
      if (modal && modal.classList.contains("active")) {
        if (e.key === "Escape") closeLightboxDirect();
        else if (e.key === "ArrowRight") nextLightboxImage();
        else if (e.key === "ArrowLeft") prevLightboxImage();
      }
    });

    let userIsAdmin = ${Boolean(isAdmin)} || Boolean(localStorage.getItem("vibenote_admin_token")) || Boolean(localStorage.getItem("vibenote_admin_pwd"));
    const openEditOnLoad = ${Boolean(openEditOnLoad)};

    function handleEditPromptClick() {
      if (userIsAdmin) {
        openEditModal();
      } else {
        openAuthModal();
      }
    }

    function openAuthModal() {
      const modal = document.getElementById("adminAuthModal");
      const err = document.getElementById("authErrorAlert");
      const pwd = document.getElementById("adminAuthPassword");
      if (err) err.style.display = "none";
      if (pwd) pwd.value = "";
      if (modal) modal.style.display = "flex";
      setTimeout(() => pwd?.focus(), 150);
    }

    function closeAuthModal() {
      const modal = document.getElementById("adminAuthModal");
      if (modal) modal.style.display = "none";
    }

    function handleAuthBackdropClick(e) {
      if (e.target.id === "adminAuthModal") closeAuthModal();
    }

    async function handleAuthSubmit(e) {
      e.preventDefault();
      const pwd = document.getElementById("adminAuthPassword").value;
      const btn = document.getElementById("authSubmitBtn");
      const err = document.getElementById("authErrorAlert");
      const origHtml = btn ? btn.innerHTML : "";

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
      }
      if (err) err.style.display = "none";

      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pwd }),
          credentials: "include"
        });
        const data = await res.json();
        if (res.ok && data.success) {
          userIsAdmin = true;
          try {
            if (data.token) localStorage.setItem("vibenote_admin_token", data.token);
            localStorage.setItem("vibenote_admin_pwd", pwd);
          } catch(e) {}
          closeAuthModal();
          showToast("Admin access unlocked!");
          openEditModal();
        } else {
          if (err) {
            err.textContent = data.error || "Incorrect password. Please try again.";
            err.style.display = "block";
          }
        }
      } catch (e) {
        if (err) {
          err.textContent = "Network error: " + e.message;
          err.style.display = "block";
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = origHtml;
        }
      }
    }

    let editImages = ${JSON.stringify(promptImages)};

    function openEditModal() {
      const modal = document.getElementById("editPromptModal");
      if (modal) modal.style.display = "flex";
      renderEditImages();
    }

    function closeEditModal() {
      const modal = document.getElementById("editPromptModal");
      if (modal) modal.style.display = "none";
    }

    function handleEditBackdropClick(e) {
      if (e.target.id === "editPromptModal") closeEditModal();
    }

    function renderEditImages() {
      const list = document.getElementById("editImagesList");
      if (!list) return;
      if (editImages.length === 0) {
        list.innerHTML = '<div style="color:#9ca3af;font-size:0.85rem;padding:6px 0;"><i class="fa-regular fa-images"></i> No images added yet. Upload or add URLs below.</div>';
        return;
      }
      list.innerHTML = editImages.map((img, i) => {
        const full = img.startsWith("http") ? img : ("${baseUrl}" + img);
        return '<div class="edit-image-chip">' +
          '<img src="' + full + '" alt="Img ' + (i+1) + '" />' +
          '<button type="button" class="chip-delete" onclick="removeEditImage(' + i + ')" title="Remove image">&times;</button>' +
          (i === 0 ? '<span class="chip-primary-badge">Primary</span>' : '') +
          '</div>';
      }).join("");
    }

    function addImageFromUrl() {
      const input = document.getElementById("newImageUrlInput");
      const val = input ? input.value.trim() : "";
      if (!val) return;
      if (!val.startsWith("http://") && !val.startsWith("https://") && !val.startsWith("/")) {
        alert("Please enter a valid image URL starting with http://, https://, or /");
        return;
      }
      editImages.push(val);
      input.value = "";
      renderEditImages();
      showToast("Image URL added to list");
    }

    async function uploadFileToR2(input) {
      const file = input.files && input.files[0];
      if (!file) return;

      const spinner = document.getElementById("uploadSpinner");
      if (spinner) spinner.style.display = "block";

      const formData = new FormData();
      formData.append("file", file);

      const headers = {};
      try {
        const token = localStorage.getItem("vibenote_admin_token");
        if (token) headers["x-admin-token"] = token;
        const pwd = localStorage.getItem("vibenote_admin_pwd");
        if (pwd) headers["x-admin-password"] = pwd;
      } catch(e) {}

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: headers,
          body: formData,
          credentials: "include"
        });
        const data = await res.json();
        if (res.ok && data.success) {
          editImages.push(data.url);
          renderEditImages();
          showToast("Image uploaded to Cloudflare R2!");
        } else {
          alert("Upload failed: " + (data.error || "Unknown error"));
        }
      } catch (err) {
        alert("Upload error: " + err.message);
      } finally {
        if (spinner) spinner.style.display = "none";
        input.value = "";
      }
    }

    function removeEditImage(idx) {
      editImages.splice(idx, 1);
      renderEditImages();
    }

    async function handleEditPromptSubmit(e) {
      e.preventDefault();
      const saveBtn = document.getElementById("saveEditBtn");
      const origHtml = saveBtn ? saveBtn.innerHTML : "";
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
      }

      const title = document.getElementById("editTitle").value.trim();
      const category = document.getElementById("editCategory").value;
      const platform = document.getElementById("editPlatform").value;
      const status = document.getElementById("editStatus").value;
      const visibility = document.getElementById("editVisibility").value;
      const description = document.getElementById("editDescription").value.trim();
      const content = document.getElementById("editContent").value;
      const tagsStr = document.getElementById("editTags").value;
      const tags = tagsStr.split(",").map(t => t.trim().replace(/^#/, "")).filter(Boolean);

      const payload = {
        title,
        category,
        platform,
        status,
        visibility,
        isPublic: visibility !== "private",
        description,
        content,
        tags,
        images: editImages,
      };

      const headers = { "Content-Type": "application/json" };
      try {
        const token = localStorage.getItem("vibenote_admin_token");
        if (token) headers["x-admin-token"] = token;
        const pwd = localStorage.getItem("vibenote_admin_pwd");
        if (pwd) headers["x-admin-password"] = pwd;
      } catch(e) {}

      try {
        const res = await fetch("/api/admin/prompts/${prompt.shortId}/edit", {
          method: "POST",
          headers: headers,
          body: JSON.stringify(payload),
          credentials: "include"
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("Prompt updated successfully!");
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } else {
          alert("Failed to update prompt: " + (data.error || "Unknown error"));
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = origHtml;
          }
        }
      } catch (err) {
        alert("Error updating prompt: " + err.message);
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = origHtml;
        }
      }
    }

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
        showToast("Copied to clipboard!");
        fetch('/api/prompts/' + shortId + '/stats', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ type: 'copy' }) });
      } catch (err) {
        showToast("Failed to copy");
      }
    }

    async function copyShortLink(url) {
      try {
        await navigator.clipboard.writeText(url);
        showToast("Link copied!");
      } catch (err) {
        showToast("Failed to copy link");
      }
    }

    async function copyText(text) {
      try {
        await navigator.clipboard.writeText(text);
        showToast("Copied!");
      } catch (err) {
        showToast("Failed to copy");
      }
    }

    function showToast(msg) {
      const toast = document.getElementById("toast");
      toast.textContent = msg;
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 3000);
    }

    renderCompiled();
    if (openEditOnLoad) {
      handleEditPromptClick();
    }
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

  const promptImages: string[] = (p.images && p.images.length > 0)
    ? p.images
    : (p.image ? [p.image] : []);
  const primaryThumb = promptImages[0] || "";
  const resolvedThumb = primaryThumb
    ? (primaryThumb.startsWith("http") ? primaryThumb : `${baseUrl}${primaryThumb}`)
    : "";

  return `
    <div class="prompt-card ${resolvedThumb ? 'has-thumbnail' : ''}">
      ${resolvedThumb ? `
        <a href="${shortUrl}" class="card-thumb-container">
          <img src="${escapeHtml(resolvedThumb)}" alt="${escapeHtml(p.title)}" class="card-image-preview" loading="lazy" onerror="this.parentElement.style.display='none'" />
          ${promptImages.length > 1 ? `<span class="thumb-count-badge"><i class="fa-solid fa-images"></i> ${promptImages.length}</span>` : ''}
        </a>
      ` : ''}
      <div class="card-header">
        <div class="card-badges">
          <span class="badge cat-badge">${escapeHtml(p.category.toUpperCase())}</span>
          <span class="badge platform-badge">${escapeHtml(p.platform.toUpperCase())}</span>
        </div>
        <span class="card-vars-count"><i class="fa-solid fa-sliders"></i> ${p.variables ? p.variables.length : 0}</span>
      </div>
      
      <h3 class="card-title">
        <a href="${shortUrl}">${escapeHtml(p.title)}</a>
      </h3>
      
      <p class="card-snippet">
        ${escapeHtml(p.description || p.content.slice(0, 120))}
      </p>

      <div class="card-tags">
        ${p.tags.slice(0, 4).map(t => `<a href="/?tag=${encodeURIComponent(t)}" class="tag-item" onclick="event.stopPropagation()">#${escapeHtml(t)}</a>`).join('')}
      </div>

      <div class="card-footer">
        <div class="card-stats">
          <span><i class="fa-regular fa-eye"></i> ${p.views || 0}</span>
          <span><i class="fa-regular fa-copy"></i> ${p.copies || 0}</span>
        </div>
        <div class="card-actions">
          <a href="${shortUrl}" class="btn btn-small btn-secondary"><i class="fa-solid fa-play"></i> Test</a>
          <a href="${appDeepLink}" class="btn btn-small btn-primary" title="Open in VibeNote App"><i class="fa-solid fa-bookmark"></i> Save</a>
        </div>
      </div>
    </div>
  `;
}

function renderPaginationControls(page: number, totalPages: number, category: string, search: string, tag: string): string {
  if (totalPages <= 1) return "";

  const prevPage = page > 1 ? page - 1 : 1;
  const nextPage = page < totalPages ? page + 1 : totalPages;

  const buildUrl = (p: number) => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.set('category', category);
    if (search) params.set('search', search);
    if (tag) params.set('tag', tag);
    params.set('page', p.toString());
    return '/?' + params.toString();
  };

  let pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return `
    <div class="pagination-wrapper">
      <a href="${buildUrl(prevPage)}" class="page-btn ${page === 1 ? 'disabled' : ''}">
        <i class="fa-solid fa-chevron-left"></i> Prev
      </a>
      
      <div class="page-numbers">
        ${pages.map(p => {
          if (p === '...') return `<span class="page-ellipsis">...</span>`;
          return `<a href="${buildUrl(p as number)}" class="page-num ${p === page ? 'active' : ''}">${p}</a>`;
        }).join('')}
      </div>

      <a href="${buildUrl(nextPage)}" class="page-btn ${page === totalPages ? 'disabled' : ''}">
        Next <i class="fa-solid fa-chevron-right"></i>
      </a>
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
    .container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 1.25rem; }
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
      background: rgba(10, 13, 20, 0.85);
      backdrop-filter: blur(12px);
      position: sticky; top: 0; z-index: 100; padding: 0.85rem 0;
    }
    .nav-container { display: flex; justify-content: space-between; align-items: center; }
    .brand-logo { display: flex; align-items: center; gap: 0.5rem; text-decoration: none; font-size: 1.4rem; font-weight: 800; color: var(--text-main); }
    .logo-icon { width: 34px; height: 34px; background: linear-gradient(135deg, #8B5CF6, #06B6D4); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1rem; color: white; }
    .nav-actions { display: flex; gap: 0.5rem; }

    /* Buttons */
    .btn {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.55rem 1rem; border-radius: var(--radius); font-weight: 600;
      font-size: 0.85rem; border: none; cursor: pointer; text-decoration: none; transition: all 0.2s ease;
    }
    .btn-primary { background: var(--accent-primary); color: white; }
    .btn-primary:hover { background: #7C3AED; transform: translateY(-1px); }
    .btn-secondary { background: rgba(255, 255, 255, 0.06); color: var(--text-main); border: 1px solid var(--border-color); }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.12); }
    .btn-accent { background: #06B6D4; color: white; }
    .btn-accent:hover { background: #0891B2; }
    .btn-glow { box-shadow: 0 0 15px var(--accent-glow); }
    .btn-small { padding: 0.35rem 0.75rem; font-size: 0.8rem; }
    .btn-compact { padding: 0.45rem 0.85rem; font-size: 0.85rem; }

    /* Hero Section */
    .hero-section { padding: 2.5rem 0 2rem 0; }
    .hero-badge {
      display: inline-block; padding: 0.3rem 0.85rem; border-radius: 20px;
      background: rgba(139, 92, 246, 0.15); color: #A78BFA; border: 1px solid rgba(139, 92, 246, 0.3);
      font-size: 0.8rem; font-weight: 600; margin-bottom: 1rem;
    }
    .hero-title { font-size: 2.4rem; font-weight: 800; line-height: 1.2; margin-bottom: 0.75rem; }
    .hero-subtitle { font-size: 1rem; color: var(--text-muted); max-width: 580px; margin: 0 auto 1.75rem auto; line-height: 1.5; }

    /* Search Box */
    .search-box-wrapper { max-width: 550px; margin: 0 auto; }
    .search-input-box {
      display: flex; align-items: center; background: var(--bg-card);
      border: 1px solid var(--border-color); border-radius: 14px; padding: 0.35rem 0.5rem 0.35rem 1rem;
      box-shadow: 0 8px 25px rgba(0,0,0,0.4);
    }
    .search-icon { font-size: 0.95rem; margin-right: 0.6rem; color: var(--text-muted); }
    .search-input-box input {
      flex: 1; background: transparent; border: none; outline: none; color: white; font-size: 0.95rem;
    }
    .btn-search {
      background: var(--accent-primary); color: white; border: none;
      padding: 0.55rem 1.1rem; border-radius: 10px; font-weight: 600; cursor: pointer;
    }

    /* Category Filter Pills */
    .categories-section { margin-bottom: 2rem; }
    .categories-scroll { display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.4rem; scrollbar-width: none; }
    .cat-pill {
      background: var(--bg-card); color: var(--text-muted); border: 1px solid var(--border-color);
      padding: 0.45rem 0.95rem; border-radius: 30px; white-space: nowrap; font-weight: 500; font-size: 0.82rem;
      cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 0.4rem;
    }
    .cat-pill:hover, .cat-pill.active {
      background: var(--accent-primary); color: white; border-color: var(--accent-primary);
    }

    /* Active Tag Badge */
    .header-title-group { display: flex; align-items: center; gap: 0.75rem; }
    .active-tag-badge {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan); border: 1px solid rgba(6, 182, 212, 0.3);
      padding: 0.25rem 0.65rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600;
    }
    .clear-tag-btn { color: var(--accent-cyan); text-decoration: none; font-size: 0.85rem; }

    /* Grid & Cards */
    .main-content { margin-bottom: 3.5rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .section-header h2 { font-size: 1.3rem; }
    .sort-wrapper select {
      background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color);
      padding: 0.35rem 0.75rem; border-radius: 8px; font-size: 0.82rem; outline: none;
    }
    .prompts-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem;
    }
    .prompt-card {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px;
      padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .prompt-card:hover { transform: translateY(-2px); border-color: rgba(139, 92, 246, 0.4); }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .card-badges { display: flex; gap: 0.35rem; }
    .badge {
      font-size: 0.68rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 6px; letter-spacing: 0.5px;
    }
    .cat-badge { background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan); }
    .platform-badge { background: rgba(139, 92, 246, 0.15); color: #A78BFA; }
    .id-badge { background: rgba(255, 255, 255, 0.08); color: var(--text-muted); }
    .card-vars-count { font-size: 0.78rem; color: #F59E0B; font-weight: 600; display: inline-flex; align-items: center; gap: 0.3rem; }
    .card-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.4rem; }
    .card-title a { color: var(--text-main); text-decoration: none; }
    .card-title a:hover { color: var(--accent-primary); }
    .card-snippet { font-size: 0.86rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 0.85rem; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .card-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 1rem; }
    .tag-item { font-size: 0.72rem; color: #A78BFA; background: rgba(139, 92, 246, 0.1); padding: 0.15rem 0.45rem; border-radius: 4px; text-decoration: none; transition: background 0.2s; }
    .tag-item:hover { background: rgba(139, 92, 246, 0.25); color: white; }

    .card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.85rem; }
    .card-stats { display: flex; gap: 0.75rem; font-size: 0.78rem; color: var(--text-muted); }
    .card-actions { display: flex; gap: 0.4rem; }

    /* Pagination */
    .pagination-wrapper { display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin-top: 2rem; }
    .page-btn {
      background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color);
      padding: 0.45rem 0.9rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; text-decoration: none;
      display: inline-flex; align-items: center; gap: 0.4rem; transition: all 0.2s ease;
    }
    .page-btn:hover:not(.disabled) { background: var(--accent-primary); color: white; border-color: var(--accent-primary); }
    .page-btn.disabled { opacity: 0.4; pointer-events: none; }
    .page-numbers { display: flex; gap: 0.25rem; align-items: center; }
    .page-num {
      width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center;
      background: var(--bg-card); color: var(--text-muted); border: 1px solid var(--border-color);
      border-radius: 8px; font-size: 0.85rem; font-weight: 600; text-decoration: none; transition: all 0.2s ease;
    }
    .page-num:hover, .page-num.active { background: var(--accent-primary); color: white; border-color: var(--accent-primary); }
    .page-ellipsis { padding: 0 0.25rem; color: var(--text-muted); }

    /* Developer Integration Panel */
    .dev-integration-panel { margin-top: 2rem; }
    .dev-links-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
    .dev-link-card { background: #06080D; border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .dev-link-title { font-size: 0.85rem; font-weight: 700; color: var(--accent-cyan); display: flex; align-items: center; gap: 0.4rem; }
    .dev-link-card code { font-family: 'Fira Code', monospace; font-size: 0.78rem; color: #E5E7EB; word-break: break-all; }
    
    .code-snippet-box { background: #06080D; border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem; margin-top: 0.75rem; }
    .snippet-header { font-size: 0.78rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem; text-transform: uppercase; }
    .code-snippet-box pre { font-family: 'Fira Code', monospace; font-size: 0.85rem; color: #A78BFA; overflow-x: auto; }

    /* Empty state */
    .empty-state { text-align: center; padding: 3rem 1rem; background: var(--bg-card); border-radius: 14px; border: 1px dashed var(--border-color); }
    .empty-icon { font-size: 2.2rem; margin-bottom: 0.75rem; color: var(--text-muted); }

    /* Detail Page */
    .detail-container { padding-top: 1.5rem; padding-bottom: 3.5rem; }
    .detail-header-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .detail-badges { display: flex; gap: 0.4rem; margin-bottom: 0.75rem; }
    .detail-title { font-size: 1.8rem; font-weight: 800; margin-bottom: 0.6rem; }
    .detail-desc { font-size: 0.98rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 0.85rem; }
    .metrics-row { display: flex; gap: 1.25rem; font-size: 0.82rem; color: var(--text-muted); margin-top: 0.85rem; }

    .interactive-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 1.5rem; }
    @media (max-width: 900px) { .interactive-grid { grid-template-columns: 1fr; } }

    .panel { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.5rem; }
    .panel-header { margin-bottom: 1.25rem; }
    .panel-header h3 { font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: 0.4rem; }
    .panel-header p { font-size: 0.82rem; color: var(--text-muted); margin-top: 0.2rem; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }

    /* Form Fields */
    .var-field { margin-bottom: 1rem; }
    .var-field label { display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.3rem; }
    .var-type { font-weight: normal; color: var(--text-muted); font-size: 0.72rem; }
    .var-input {
      width: 100%; background: var(--bg-input); border: 1px solid var(--border-color);
      border-radius: 8px; padding: 0.55rem 0.75rem; color: white; font-size: 0.9rem; outline: none;
    }
    .var-input:focus { border-color: var(--accent-primary); }

    /* Output Box */
    .prompt-output-box {
      background: #06080D; border: 1px solid var(--border-color); border-radius: 12px;
      padding: 1rem; min-height: 220px; max-height: 400px; overflow-y: auto; margin-bottom: 1.25rem;
    }
    .prompt-output-box pre { white-space: pre-wrap; word-wrap: break-word; font-family: 'Fira Code', monospace; font-size: 0.9rem; line-height: 1.55; color: #E5E7EB; }

    .action-buttons-group { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.6rem; }

    /* Card Image Thumbnail */
    .prompt-card.has-thumbnail { overflow: hidden; }
    .card-thumb-container {
      width: 100%; height: 160px; overflow: hidden; position: relative; display: block;
      background: #080c14; border-bottom: 1px solid var(--border-color); margin: -1.25rem -1.25rem 1rem -1.25rem;
    }
    .card-image-preview {
      width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; display: block;
    }
    .prompt-card:hover .card-image-preview { transform: scale(1.05); }
    .thumb-count-badge {
      position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.75);
      backdrop-filter: blur(6px); color: #fff; font-size: 0.72rem; padding: 2px 7px;
      border-radius: 6px; font-weight: 600; display: flex; align-items: center; gap: 4px;
    }

    /* Detail Page Gallery */
    .prompt-gallery-panel {
      margin-bottom: 1.5rem; background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: var(--radius); padding: 1.25rem;
    }
    .gallery-header { margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; }
    .gallery-hint { font-size: 0.82rem; color: var(--accent-cyan); font-weight: 500; }
    .gallery-featured-wrapper {
      position: relative; width: 100%; max-height: 480px; min-height: 220px;
      background: #06080e; border-radius: 10px; overflow: hidden; cursor: pointer;
      display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.06);
    }
    .gallery-featured-wrapper img {
      max-width: 100%; max-height: 480px; object-fit: contain; display: block;
      transition: transform 0.25s ease;
    }
    .gallery-featured-wrapper:hover img { transform: scale(1.02); }
    .gallery-overlay {
      position: absolute; bottom: 0; left: 0; right: 0; padding: 16px;
      background: linear-gradient(transparent, rgba(0,0,0,0.8)); opacity: 0;
      transition: opacity 0.2s ease; display: flex; justify-content: flex-end;
    }
    .gallery-featured-wrapper:hover .gallery-overlay { opacity: 1; }
    .gallery-zoom-badge {
      background: rgba(139, 92, 246, 0.9); color: #fff; padding: 6px 14px;
      border-radius: 8px; font-size: 0.82rem; font-weight: 600; backdrop-filter: blur(4px);
      display: inline-flex; align-items: center; gap: 6px;
    }
    .gallery-thumbs-row {
      display: flex; gap: 10px; margin-top: 12px; overflow-x: auto; padding-bottom: 4px;
    }
    .gallery-thumb-item {
      width: 80px; height: 60px; border-radius: 8px; overflow: hidden; cursor: pointer;
      border: 2px solid transparent; flex-shrink: 0; opacity: 0.6; transition: all 0.2s ease;
      background: #06080e;
    }
    .gallery-thumb-item.active, .gallery-thumb-item:hover {
      border-color: var(--accent-primary); opacity: 1; transform: translateY(-2px);
    }
    .gallery-thumb-item img { width: 100%; height: 100%; object-fit: cover; }

    /* Lightbox Modal */
    .lightbox-modal {
      position: fixed; inset: 0; background: rgba(5, 7, 12, 0.94);
      backdrop-filter: blur(14px); z-index: 3000; display: none;
      flex-direction: column; justify-content: space-between;
    }
    .lightbox-modal.active { display: flex; }
    .lightbox-toolbar {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .lightbox-counter { color: var(--text-muted); font-size: 0.9rem; font-weight: 600; }
    .lightbox-actions { display: flex; gap: 8px; }
    .lightbox-btn {
      background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1);
      color: #fff; width: 38px; height: 38px; border-radius: 8px; cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-size: 0.9rem;
      transition: all 0.2s ease; text-decoration: none;
    }
    .lightbox-btn:hover { background: var(--accent-primary); border-color: var(--accent-primary); }
    .lightbox-body {
      flex: 1; display: flex; align-items: center; justify-content: space-between;
      position: relative; overflow: hidden; padding: 1rem;
    }
    .lightbox-nav-btn {
      background: rgba(255,255,255,0.12); border: none; color: #fff; width: 48px; height: 48px;
      border-radius: 50%; cursor: pointer; display: flex; align-items: center;
      justify-content: center; font-size: 1.2rem; transition: all 0.2s ease; z-index: 10;
    }
    .lightbox-nav-btn:hover { background: var(--accent-primary); }
    .lightbox-img-wrapper {
      flex: 1; height: 100%; display: flex; align-items: center; justify-content: center;
      overflow: auto; user-select: none;
    }
    .lightbox-img-wrapper img {
      max-width: 90vw; max-height: 80vh; object-fit: contain; transition: transform 0.2s ease;
      border-radius: 8px; box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }

    /* Modal */
    .modal-backdrop {
      display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8);
      backdrop-filter: blur(8px); z-index: 2500; align-items: center; justify-content: center; padding: 1rem;
    }
    .modal-backdrop.active { display: flex; }
    .modal-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; width: 100%; max-width: 550px; padding: 1.5rem; }
    .modal-window { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; width: 100%; padding: 1.5rem; }
    .modal-window.modal-wide { max-width: 720px; max-height: 90vh; overflow-y: auto; }
    .modal-window.modal-auth { max-width: 420px; }
    .alert-error { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; padding: 0.65rem 0.9rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .modal-close, .close-btn { background: none; border: none; color: var(--text-muted); font-size: 1.4rem; cursor: pointer; }
    .modal-close:hover, .close-btn:hover { color: #fff; }
    .form-group { margin-bottom: 0.85rem; }
    .form-group label { display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.3rem; }
    .form-group input, .form-group select, .form-group textarea, .form-input, .form-select, .form-textarea {
      width: 100%; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.55rem 0.75rem; color: white; outline: none; font-size: 0.9rem;
    }
    .form-group textarea.code-font { font-family: 'Fira Code', monospace; font-size: 0.85rem; line-height: 1.4; }
    .form-hint { display: block; margin-top: 4px; color: var(--text-muted); font-size: 0.75rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.6rem; margin-top: 1.25rem; }

    /* Admin Image Manager */
    .images-manager-card {
      background: #0a0e17; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px; padding: 14px; margin-top: 14px;
    }
    .images-manager-header h4 { font-size: 0.95rem; margin-bottom: 2px; color: #e5e7eb; }
    .images-manager-header small { color: var(--text-muted); font-size: 0.8rem; }
    .edit-images-list {
      display: flex; gap: 10px; flex-wrap: wrap; margin: 12px 0; min-height: 30px;
    }
    .edit-image-chip {
      position: relative; width: 85px; height: 85px; border-radius: 8px; overflow: hidden;
      border: 1px solid rgba(255,255,255,0.15); background: #000;
    }
    .edit-image-chip img { width: 100%; height: 100%; object-fit: cover; }
    .edit-image-chip .chip-delete {
      position: absolute; top: 4px; right: 4px; background: rgba(239,68,68,0.9);
      color: #fff; border: none; width: 22px; height: 22px; border-radius: 50%;
      cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; justify-content: center;
    }
    .edit-image-chip .chip-primary-badge {
      position: absolute; bottom: 4px; left: 4px; background: rgba(139,92,246,0.9);
      color: #fff; font-size: 0.65rem; padding: 1px 5px; border-radius: 4px; font-weight: bold;
    }
    .add-url-row { display: flex; gap: 8px; margin-bottom: 10px; }
    .upload-r2-dropzone {
      border: 2px dashed rgba(139,92,246,0.4); border-radius: 8px; padding: 16px;
      text-align: center; cursor: pointer; transition: all 0.2s ease; background: rgba(139,92,246,0.04);
    }
    .upload-r2-dropzone:hover {
      border-color: var(--accent-primary); background: rgba(139,92,246,0.08);
    }
    .dropzone-icon { font-size: 1.8rem; color: var(--accent-primary); margin-bottom: 6px; }
    .dropzone-text strong { display: block; font-size: 0.88rem; color: #f3f4f6; }
    .dropzone-text span { font-size: 0.75rem; color: var(--text-muted); }
    .upload-spinner { color: var(--accent-cyan); font-weight: 600; font-size: 0.85rem; margin-top: 8px; }

    /* Toast */
    .toast-message {
      position: fixed; bottom: 1.5rem; right: 1.5rem; background: var(--bg-card); border: 1px solid var(--accent-primary);
      padding: 0.6rem 1.25rem; border-radius: 10px; font-weight: 600; color: white; font-size: 0.85rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5); opacity: 0; transform: translateY(20px); transition: all 0.3s ease; pointer-events: none; z-index: 4000;
    }
    .toast-message.show { opacity: 1; transform: translateY(0); }

    /* Footer */
    .footer { border-top: 1px solid var(--border-color); padding: 1.75rem 0; color: var(--text-muted); font-size: 0.82rem; margin-top: auto; }
    .footer-container { display: flex; justify-content: space-between; align-items: center; }

    /* Responsive Mobile Adjustments */
    @media (max-width: 640px) {
      .hide-mobile { display: none; }
      .hero-title { font-size: 1.75rem; }
      .hero-subtitle { font-size: 0.9rem; margin-bottom: 1.25rem; }
      .hero-section { padding: 1.75rem 0 1.25rem 0; }
      .prompts-grid { grid-template-columns: 1fr; }
      .search-input-box { padding: 0.25rem 0.35rem 0.25rem 0.75rem; }
      .search-input-box input { font-size: 0.88rem; }
      .btn-search { padding: 0.45rem 0.85rem; }
      .footer-container { flex-direction: column; gap: 0.75rem; text-align: center; }
      .action-buttons-group { grid-template-columns: 1fr; }
      .page-num { width: 30px; height: 30px; font-size: 0.8rem; }
    }
  `;
}

function getClientScripts(baseUrl: string): string {
  return `
    function filterCategory(cat) {
      const url = new URL(window.location.href);
      if (cat === 'all') url.searchParams.delete('category');
      else url.searchParams.set('category', cat);
      url.searchParams.delete('page');
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
      url.searchParams.delete('page');
      window.location.href = url.toString();
    }

    function changeSort(val) {
      const url = new URL(window.location.href);
      url.searchParams.set('sort', val);
      url.searchParams.delete('page');
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
      const form = document.getElementById("createForm");
      const btn = form?.querySelector('button[type="submit"]');
      const originalText = btn ? btn.innerHTML : 'Submit for Review';
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
      }

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
          body: JSON.stringify({ title, category, platform, description, content, tags })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          closeCreateModal();
          form?.reset();
          showToast("🎉 تم إرسال البرومبت بنجاح! تم حفظه كخاص (Private) وقيد المراجعة لحماية المنصة من الإغراق.");
        } else if (res.status === 429) {
          alert("⚠️ تم تجاوز الحد المسموح للإرسال لحماية السيرفر:\n" + (data.error || "يرجى الانتظار بضع دقائق قبل إرسال برومبت جديد."));
        } else {
          alert(data.error || 'Failed to submit prompt');
        }
      } catch (err) {
        alert('Error submitting prompt: ' + err.message);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      }
    }
  `;
}

export function renderPendingPrivatePromptPage(prompt: PromptDoc, baseUrl = "https://vibenote.sbs"): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  ${getGtmHeadScript()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Private Prompt — Pending Review | Vibe Note</title>
  <meta name="robots" content="noindex, nofollow">
  <meta name="google-adsense-account" content="ca-pub-5448783245957365">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    ${getGlobalStyles()}
  </style>
</head>
<body>
  ${getGtmNoScript()}
  <div class="app-layout">
    <header class="navbar">
      <div class="container nav-container">
        <a href="/" class="brand-logo">
          <div class="logo-icon"><i class="fa-solid fa-bolt"></i></div>
          <span class="brand-name">Vibe<span class="gradient-text">Note</span></span>
        </a>
        <div class="nav-actions">
          <a href="/" class="btn btn-primary btn-compact"><i class="fa-solid fa-house"></i> Home</a>
        </div>
      </div>
    </header>
    <main class="container text-center" style="padding: 90px 20px; flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; max-width: 640px; margin: 0 auto;">
      <div style="width: 76px; height: 76px; border-radius: 50%; background: rgba(245, 158, 11, 0.12); border: 2px solid rgba(245, 158, 11, 0.35); display: flex; align-items: center; justify-content: center; margin-bottom: 22px; color: #fbbf24; font-size: 2.2rem;">
        <i class="fa-solid fa-lock"></i>
      </div>
      <h1 style="font-size: 2rem; margin-bottom: 14px; font-weight: 700;">Prompt is Private & Pending Review</h1>
      <p style="color: var(--text-muted); font-size: 1.05rem; line-height: 1.7; margin-bottom: 24px;">
        هذا البرومبت محفوظ كخاص (Private) وقيد مراجعة وتفعيل الإدارة لحماية المنصة من الإغراق والسبام. سيظهر في المعرض العام فور اعتماده.
      </p>
      <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px 20px; margin-bottom: 28px; width: 100%; text-align: left; display: flex; align-items: center; gap: 12px;">
        <i class="fa-solid fa-shield-halved" style="color: var(--accent-cyan); font-size: 1.3rem;"></i>
        <div style="font-size: 0.95rem; color: var(--text-muted);">
          Status: <strong style="color: #fbbf24;">Pending Approval (Private)</strong> &bull; ID: <code>${prompt.shortId}</code>
        </div>
      </div>
      <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
        <a href="/" class="btn btn-primary"><i class="fa-solid fa-arrow-left"></i> Explore Public Prompts</a>
        <a href="/admin" class="btn btn-secondary"><i class="fa-solid fa-shield-halved"></i> Admin Login</a>
      </div>
    </main>
  </div>
</body>
</html>`;
}

export function render404Page(baseUrl = "https://vibenote.sbs"): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  ${getGtmHeadScript()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 — Page Not Found | Vibe Note</title>
  <meta name="robots" content="noindex, follow">
  <meta name="google-adsense-account" content="ca-pub-5448783245957365">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    ${getGlobalStyles()}
  </style>
</head>
<body>
  ${getGtmNoScript()}
  <div class="app-layout">
    <header class="navbar">
      <div class="container nav-container">
        <a href="/" class="brand-logo">
          <div class="logo-icon"><i class="fa-solid fa-bolt"></i></div>
          <span class="brand-name">Vibe<span class="gradient-text">Note</span></span>
        </a>
        <div class="nav-actions">
          <a href="/" class="btn btn-primary btn-compact"><i class="fa-solid fa-house"></i> Home</a>
        </div>
      </div>
    </header>
    <main class="container text-center" style="padding: 100px 20px; flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <div style="font-size: 5rem; font-weight: 800; color: var(--accent-primary); line-height: 1; margin-bottom: 1rem;">404</div>
      <h1 style="font-size: 2rem; margin-bottom: 1rem; color: #fff;">Prompt or Page Not Found</h1>
      <p style="color: var(--text-muted); max-width: 500px; margin: 0 auto 2rem; font-size: 1.05rem;">
        The prompt template or page you requested could not be located. Browse the full prompt collection below.
      </p>
      <a href="/" class="btn btn-primary btn-glow" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; font-size: 1rem;">
        <i class="fa-solid fa-magnifying-glass"></i> Explore 10,000+ AI Prompts
      </a>
    </main>
    <footer class="footer">
      <div class="container text-center">
        <p>VibeNote Smart Prompt Bank &copy; 2026 — vibenote.sbs</p>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

