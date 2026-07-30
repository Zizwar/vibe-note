import { PromptDoc, PaginatedPrompts } from "../db.ts";

export function renderAdminLoginPage(error?: string): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Login — VibeNote</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    ${getAdminStyles()}
  </style>
</head>
<body class="login-body">
  <div class="login-card">
    <div class="brand-logo text-center">
      <div class="logo-icon"><i class="fa-solid fa-shield-halved"></i></div>
      <h2>VibeNote Admin</h2>
      <p class="login-sub">Enter your master password configured in <code>.env</code></p>
    </div>

    ${error ? `<div class="alert alert-error"><i class="fa-solid fa-triangle-exclamation"></i> ${escapeHtml(error)}</div>` : ''}

    <form action="/admin/login" method="POST" class="login-form">
      <div class="form-group">
        <label for="password"><i class="fa-solid fa-lock"></i> Master Password</label>
        <input type="password" id="password" name="password" required placeholder="••••••••••••" autofocus>
      </div>
      <button type="submit" class="btn btn-primary btn-block">
        <i class="fa-solid fa-right-to-bracket"></i> Login to Dashboard
      </button>
    </form>
    <div class="text-center margin-top">
      <a href="/" class="back-link"><i class="fa-solid fa-arrow-left"></i> Back to Public Bank</a>
    </div>
  </div>
</body>
</html>`;
}

export function renderAdminDashboardPage(data: {
  pendingPrompts: PromptDoc[];
  allPrompts: PaginatedPrompts;
  currentTab: string;
  searchQuery: string;
  statusFilter: string;
  categoryFilter: string;
  page: number;
}): string {
  const { pendingPrompts, allPrompts, currentTab, searchQuery, statusFilter, categoryFilter, page } = data;

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard — VibeNote</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    ${getAdminStyles()}
  </style>
</head>
<body>
  <div class="admin-layout">
    <!-- Top Admin Bar -->
    <header class="admin-navbar">
      <div class="container nav-container">
        <a href="/admin" class="brand-logo">
          <div class="logo-icon"><i class="fa-solid fa-shield-halved"></i></div>
          <span class="brand-name">VibeNote <span class="badge admin-badge">ADMIN</span></span>
        </a>
        <div class="nav-actions">
          <a href="/" target="_blank" class="btn btn-secondary btn-small"><i class="fa-solid fa-globe"></i> View Site</a>
          <a href="/admin/logout" class="btn btn-danger btn-small"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>
        </div>
      </div>
    </header>

    <main class="container admin-main">
      <!-- Admin Header Stats -->
      <div class="admin-stats-grid">
        <div class="stat-card yellow">
          <div class="stat-icon"><i class="fa-solid fa-clock"></i></div>
          <div class="stat-info">
            <span class="stat-value">${pendingPrompts.length}</span>
            <span class="stat-label">Pending Approvals</span>
          </div>
        </div>
        <div class="stat-card cyan">
          <div class="stat-icon"><i class="fa-solid fa-layer-group"></i></div>
          <div class="stat-info">
            <span class="stat-value">${allPrompts.total.toLocaleString()}</span>
            <span class="stat-label">Total Prompts in Database</span>
          </div>
        </div>
        <div class="stat-card purple">
          <div class="stat-icon"><i class="fa-solid fa-check-double"></i></div>
          <div class="stat-info">
            <span class="stat-value">${allPrompts.total - pendingPrompts.length}</span>
            <span class="stat-label">Published Prompts</span>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="admin-tabs-bar">
        <button class="tab-btn ${currentTab === 'pending' ? 'active' : ''}" onclick="switchTab('pending')">
          <i class="fa-solid fa-clock"></i> Moderation Queue
          ${pendingPrompts.length > 0 ? `<span class="tab-badge">${pendingPrompts.length}</span>` : ''}
        </button>
        <button class="tab-btn ${currentTab === 'all' ? 'active' : ''}" onclick="switchTab('all')">
          <i class="fa-solid fa-list-check"></i> Manage All Prompts
        </button>
        <button class="tab-btn ${currentTab === 'create' ? 'active' : ''}" onclick="switchTab('create')">
          <i class="fa-solid fa-plus"></i> Create Admin Prompt
        </button>
      </div>

      <!-- TAB 1: PENDING APPROVALS QUEUE -->
      ${currentTab === 'pending' ? `
        <div class="panel">
          <div class="panel-header">
            <h3><i class="fa-solid fa-user-clock"></i> User Submissions Awaiting Review (${pendingPrompts.length})</h3>
            <p>Prompts submitted by public users will not appear on the website until you click <strong>Approve</strong>.</p>
          </div>

          ${pendingPrompts.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon"><i class="fa-solid fa-circle-check"></i></div>
              <h3>No pending approvals!</h3>
              <p>All user submissions have been reviewed.</p>
            </div>
          ` : `
            <div class="table-responsive">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Title & Snippet</th>
                    <th>Category</th>
                    <th>Platform</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${pendingPrompts.map(p => `
                    <tr id="row-${p.shortId}">
                      <td>
                        <strong>${escapeHtml(p.title)}</strong> <span class="badge id-badge">ID: ${p.shortId}</span>
                        <div class="snippet-text">${escapeHtml(p.content.slice(0, 100))}...</div>
                      </td>
                      <td><span class="badge cat-badge">${escapeHtml(p.category.toUpperCase())}</span></td>
                      <td><span class="badge platform-badge">${escapeHtml(p.platform.toUpperCase())}</span></td>
                      <td>${new Date(p.createdAt).toLocaleString()}</td>
                      <td>
                        <div class="action-btns">
                          <button class="btn btn-success btn-small" onclick="approvePrompt('${p.shortId}')">
                            <i class="fa-solid fa-check"></i> Approve & Publish
                          </button>
                          <button class="btn btn-danger btn-small" onclick="deletePrompt('${p.shortId}')">
                            <i class="fa-solid fa-trash"></i> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      ` : ''}

      <!-- TAB 2: MANAGE ALL PROMPTS -->
      ${currentTab === 'all' ? `
        <div class="panel">
          <div class="panel-header flex-between">
            <h3><i class="fa-solid fa-database"></i> All Database Prompts</h3>
            <div class="filter-controls">
              <input type="text" id="adminSearch" placeholder="Search by title, ID..." value="${escapeHtml(searchQuery)}" onkeyup="if(e.key==='Enter') filterAdminPrompts()">
              <select id="adminStatusFilter" onchange="filterAdminPrompts()">
                <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
                <option value="approved" ${statusFilter === 'approved' ? 'selected' : ''}>Approved Only</option>
                <option value="pending" ${statusFilter === 'pending' ? 'selected' : ''}>Pending Only</option>
              </select>
              <button class="btn btn-secondary btn-small" onclick="filterAdminPrompts()"><i class="fa-solid fa-filter"></i> Filter</button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Title & ID</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Stats</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${allPrompts.prompts.map(p => `
                  <tr id="row-${p.shortId}">
                    <td>
                      <a href="/p/${p.shortId}" target="_blank" class="prompt-link">
                        <strong>${escapeHtml(p.title)}</strong>
                      </a>
                      <span class="badge id-badge">ID: ${p.shortId}</span>
                    </td>
                    <td><span class="badge cat-badge">${escapeHtml(p.category.toUpperCase())}</span></td>
                    <td>
                      ${p.status === 'pending'
                        ? `<span class="status-pill status-pending"><i class="fa-solid fa-clock"></i> Pending</span>`
                        : `<span class="status-pill status-approved"><i class="fa-solid fa-check"></i> Approved</span>`
                      }
                    </td>
                    <td><span class="stat-badge"><i class="fa-regular fa-eye"></i> ${p.views || 0} | <i class="fa-regular fa-copy"></i> ${p.copies || 0}</span></td>
                    <td>${new Date(p.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div class="action-btns">
                        ${p.status === 'pending'
                          ? `<button class="btn btn-success btn-small" onclick="approvePrompt('${p.shortId}')"><i class="fa-solid fa-check"></i> Approve</button>`
                          : `<button class="btn btn-warning btn-small" onclick="unpublishPrompt('${p.shortId}')"><i class="fa-solid fa-ban"></i> Unpublish</button>`
                        }
                        <button class="btn btn-danger btn-small" onclick="deletePrompt('${p.shortId}')"><i class="fa-solid fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ${renderAdminPagination(allPrompts.page, allPrompts.totalPages, searchQuery, statusFilter)}
        </div>
      ` : ''}

      <!-- TAB 3: CREATE ADMIN PROMPT -->
      ${currentTab === 'create' ? `
        <div class="panel max-width-form">
          <div class="panel-header">
            <h3><i class="fa-solid fa-plus"></i> Create Published Admin Prompt</h3>
            <p>Prompts created here will be automatically set to <strong>Approved</strong> and published live.</p>
          </div>
          <form onsubmit="submitAdminCreate(event)">
            <div class="form-group">
              <label>Prompt Title *</label>
              <input type="text" id="adminTitle" required placeholder="e.g. Senior Architecture Advisor">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Category</label>
                <select id="adminCategory">
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
                <select id="adminPlatform">
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
              <input type="text" id="adminDescription" placeholder="Brief summary of what this prompt accomplishes">
            </div>
            <div class="form-group">
              <label>Prompt Template *</label>
              <textarea id="adminContent" rows="6" required placeholder="Write prompt template with {{variables}}..."></textarea>
            </div>
            <div class="form-group">
              <label>Tags (comma separated)</label>
              <input type="text" id="adminTags" placeholder="e.g. typescript, architecture">
            </div>
            <button type="submit" class="btn btn-primary btn-glow">
              <i class="fa-solid fa-check"></i> Create & Publish Prompt
            </button>
          </form>
        </div>
      ` : ''}
    </main>

    <div id="toast" class="toast-message"></div>
  </div>

  <script>
    function switchTab(tab) {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.location.href = url.toString();
    }

    function filterAdminPrompts() {
      const q = document.getElementById("adminSearch")?.value.trim() || "";
      const st = document.getElementById("adminStatusFilter")?.value || "all";
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'all');
      if (q) url.searchParams.set('search', q); else url.searchParams.delete('search');
      if (st !== 'all') url.searchParams.set('status', st); else url.searchParams.delete('status');
      window.location.href = url.toString();
    }

    async function approvePrompt(shortId) {
      try {
        const res = await fetch('/api/admin/approve/' + shortId, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          showToast("Prompt approved!");
          const row = document.getElementById("row-" + shortId);
          if (row) row.remove();
        }
      } catch (err) {
        showToast("Error approving prompt");
      }
    }

    async function unpublishPrompt(shortId) {
      try {
        const res = await fetch('/api/admin/unpublish/' + shortId, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          showToast("Prompt unpublished!");
          window.location.reload();
        }
      } catch (err) {
        showToast("Error unpublishing prompt");
      }
    }

    async function deletePrompt(shortId) {
      if (!confirm("Are you sure you want to delete prompt " + shortId + "?")) return;
      try {
        const res = await fetch('/api/admin/delete/' + shortId, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          showToast("Prompt deleted!");
          const row = document.getElementById("row-" + shortId);
          if (row) row.remove();
        }
      } catch (err) {
        showToast("Error deleting prompt");
      }
    }

    async function submitAdminCreate(e) {
      e.preventDefault();
      const title = document.getElementById("adminTitle").value.trim();
      const category = document.getElementById("adminCategory").value;
      const platform = document.getElementById("adminPlatform").value;
      const description = document.getElementById("adminDescription").value.trim();
      const content = document.getElementById("adminContent").value.trim();
      const tags = document.getElementById("adminTags").value.split(',').map(t => t.trim()).filter(Boolean);

      try {
        const res = await fetch('/api/admin/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, category, platform, description, content, tags, status: 'approved' })
        });
        const data = await res.json();
        if (data.success) {
          showToast("Admin Prompt Created!");
          setTimeout(() => window.location.href = '/admin?tab=all', 1000);
        }
      } catch (err) {
        alert("Error creating prompt: " + err.message);
      }
    }

    function showToast(msg) {
      const toast = document.getElementById("toast");
      toast.textContent = msg;
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 3000);
    }
  </script>
</body>
</html>`;
}

function renderAdminPagination(page: number, totalPages: number, search: string, status: string): string {
  if (totalPages <= 1) return "";

  const buildUrl = (p: number) => {
    const params = new URLSearchParams();
    params.set('tab', 'all');
    if (search) params.set('search', search);
    if (status && status !== 'all') params.set('status', status);
    params.set('page', p.toString());
    return '/admin?' + params.toString();
  };

  return `
    <div class="pagination-wrapper">
      <a href="${buildUrl(page > 1 ? page - 1 : 1)}" class="page-btn ${page === 1 ? 'disabled' : ''}">Prev</a>
      <span class="page-ellipsis">Page ${page} of ${totalPages}</span>
      <a href="${buildUrl(page < totalPages ? page + 1 : totalPages)}" class="page-btn ${page === totalPages ? 'disabled' : ''}">Next</a>
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

function getAdminStyles(): string {
  return `
    :root {
      --bg-dark: #0A0D14;
      --bg-card: #121824;
      --bg-input: #1B2234;
      --border-color: rgba(255, 255, 255, 0.08);
      --accent-primary: #8B5CF6;
      --accent-glow: rgba(139, 92, 246, 0.4);
      --accent-cyan: #06B6D4;
      --accent-green: #10B981;
      --accent-red: #EF4444;
      --accent-yellow: #F59E0B;
      --text-main: #F3F4F6;
      --text-muted: #9CA3AF;
      --radius: 12px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
    body { background-color: var(--bg-dark); color: var(--text-main); min-height: 100vh; }
    .container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 1.25rem; }
    .text-center { text-align: center; }

    /* Login Screen */
    .login-body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: radial-gradient(circle at center, #1B2234 0%, #0A0D14 100%); }
    .login-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; width: 100%; max-width: 420px; padding: 2rem; box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
    .brand-logo h2 { font-family: 'Outfit', sans-serif; font-size: 1.6rem; margin-top: 0.5rem; }
    .logo-icon { width: 46px; height: 46px; background: linear-gradient(135deg, #8B5CF6, #06B6D4); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 1.3rem; color: white; margin-bottom: 0.5rem; }
    .login-sub { font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1.5rem; }
    .login-sub code { background: rgba(255,255,255,0.08); padding: 0.1rem 0.35rem; border-radius: 4px; color: var(--accent-cyan); }
    
    .login-form { margin-top: 1rem; }
    .form-group { margin-bottom: 1.1rem; text-align: left; }
    .form-group label { display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.4rem; color: var(--text-main); }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.65rem 0.85rem; color: white; font-size: 0.92rem; outline: none;
    }
    .form-group input:focus { border-color: var(--accent-primary); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.6rem 1.1rem; border-radius: 8px; font-weight: 600; font-size: 0.88rem; border: none; cursor: pointer; text-decoration: none; transition: all 0.2s; }
    .btn-primary { background: var(--accent-primary); color: white; }
    .btn-secondary { background: rgba(255,255,255,0.06); color: var(--text-main); border: 1px solid var(--border-color); }
    .btn-success { background: var(--accent-green); color: white; }
    .btn-danger { background: var(--accent-red); color: white; }
    .btn-warning { background: var(--accent-yellow); color: #000; }
    .btn-block { width: 100%; }
    .btn-small { padding: 0.35rem 0.65rem; font-size: 0.78rem; }
    .btn-glow { box-shadow: 0 0 15px var(--accent-glow); }
    .margin-top { margin-top: 1.25rem; }
    .back-link { color: var(--text-muted); text-decoration: none; font-size: 0.82rem; }
    .alert-error { background: rgba(239, 68, 68, 0.15); border: 1px solid var(--accent-red); color: #FCA5A5; padding: 0.6rem 0.85rem; border-radius: 8px; font-size: 0.82rem; margin-bottom: 1rem; }

    /* Admin Dashboard Navbar */
    .admin-navbar { background: rgba(10,13,20,0.9); border-bottom: 1px solid var(--border-color); padding: 0.85rem 0; sticky: top; }
    .nav-container { display: flex; justify-content: space-between; align-items: center; }
    .admin-badge { background: #EF4444; color: white; font-size: 0.65rem; padding: 0.15rem 0.45rem; border-radius: 4px; vertical-align: middle; margin-left: 0.4rem; }
    .admin-main { padding-top: 1.75rem; padding-bottom: 3.5rem; }

    /* Stats Grid */
    .admin-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; margin-bottom: 1.75rem; }
    .stat-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; }
    .stat-card.yellow { border-left: 4px solid var(--accent-yellow); }
    .stat-card.cyan { border-left: 4px solid var(--accent-cyan); }
    .stat-card.purple { border-left: 4px solid var(--accent-primary); }
    .stat-icon { width: 44px; height: 44px; border-radius: 10px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
    .stat-value { font-size: 1.6rem; font-weight: 800; font-family: 'Outfit', sans-serif; display: block; }
    .stat-label { font-size: 0.8rem; color: var(--text-muted); }

    /* Admin Tabs */
    .admin-tabs-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
    .tab-btn { background: transparent; border: none; color: var(--text-muted); padding: 0.6rem 1.25rem; border-radius: 8px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; }
    .tab-btn:hover, .tab-btn.active { background: var(--bg-card); color: white; }
    .tab-badge { background: var(--accent-yellow); color: black; font-size: 0.7rem; font-weight: 800; padding: 0.1rem 0.45rem; border-radius: 10px; }

    /* Panels & Tables */
    .panel { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem; }
    .panel-header { margin-bottom: 1.25rem; }
    .panel-header h3 { font-size: 1.15rem; font-family: 'Outfit', sans-serif; }
    .panel-header p { font-size: 0.82rem; color: var(--text-muted); margin-top: 0.2rem; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }

    .filter-controls { display: flex; gap: 0.5rem; align-items: center; }
    .filter-controls input, .filter-controls select { background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 6px; padding: 0.4rem 0.65rem; color: white; font-size: 0.82rem; outline: none; }

    .table-responsive { overflow-x: auto; }
    .admin-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; }
    .admin-table th, .admin-table td { padding: 0.85rem 0.75rem; border-bottom: 1px solid var(--border-color); }
    .admin-table th { background: rgba(255,255,255,0.02); color: var(--text-muted); font-weight: 600; font-size: 0.78rem; text-transform: uppercase; }
    .snippet-text { font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem; }
    .action-btns { display: flex; gap: 0.35rem; }

    .status-pill { font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 12px; display: inline-flex; align-items: center; gap: 0.3rem; }
    .status-pending { background: rgba(245, 158, 11, 0.15); color: var(--accent-yellow); }
    .status-approved { background: rgba(16, 185, 129, 0.15); color: var(--accent-green); }

    .badge { font-size: 0.68rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 6px; }
    .cat-badge { background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan); }
    .platform-badge { background: rgba(139, 92, 246, 0.15); color: #A78BFA; }
    .id-badge { background: rgba(255, 255, 255, 0.08); color: var(--text-muted); }
    .prompt-link { color: white; text-decoration: none; }
    .prompt-link:hover { color: var(--accent-primary); }

    .pagination-wrapper { display: flex; justify-content: center; align-items: center; gap: 0.75rem; margin-top: 1.5rem; }
    .page-ellipsis { font-size: 0.82rem; color: var(--text-muted); }
    .max-width-form { max-width: 650px; margin: 0 auto; }

    /* Toast */
    .toast-message {
      position: fixed; bottom: 1.5rem; right: 1.5rem; background: var(--bg-card); border: 1px solid var(--accent-primary);
      padding: 0.6rem 1.25rem; border-radius: 10px; font-weight: 600; color: white; font-size: 0.85rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5); opacity: 0; transform: translateY(20px); transition: all 0.3s; pointer-events: none; z-index: 2000;
    }
    .toast-message.show { opacity: 1; transform: translateY(0); }
  `;
}
