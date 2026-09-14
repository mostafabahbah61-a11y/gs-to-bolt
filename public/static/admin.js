// VYRO Admin Dashboard SPA
(function () {
  'use strict';

  var root = document.getElementById('admin-root');
  var state = {
    authed: false,
    username: '',
    tab: 'content',
    data: {},
    loading: false,
  };

  // ---------------- API helpers ----------------
  async function api(path, opts) {
    opts = opts || {};
    var res = await fetch('/api/admin' + path, Object.assign({ credentials: 'same-origin' }, opts, {
      headers: Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {}),
    }));
    if (res.status === 401) {
      state.authed = false;
      render();
      throw new Error('Unauthorized');
    }
    var json = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(json.error || 'Request failed');
    return json;
  }

  function apiGet(path) { return api(path); }
  function apiPost(path, body) { return api(path, { method: 'POST', body: JSON.stringify(body) }); }
  function apiPut(path, body) { return api(path, { method: 'PUT', body: JSON.stringify(body) }); }
  function apiDelete(path) { return api(path, { method: 'DELETE' }); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ---------------- Toast ----------------
  function toast(message, type) {
    var el = document.createElement('div');
    el.className = 'toast ' + (type || 'success');
    el.innerHTML = '<i class="fa-solid ' + (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check') + '"></i><span>' + esc(message) + '</span>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 300);
    }, 3200);
  }

  // ---------------- Auth ----------------
  async function checkAuth() {
    try {
      var me = await apiGet('/me');
      state.authed = true;
      state.username = me.username;
    } catch (e) {
      state.authed = false;
    }
  }

  async function login(username, password) {
    var res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, password: password }),
    });
    var json = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(json.error || 'Login failed');
    return json;
  }

  async function logout() {
    await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'same-origin' });
    state.authed = false;
    render();
  }

  // ---------------- Nav config ----------------
  var NAV_ITEMS = [
    { key: 'content', label: 'Site Content', icon: 'fa-solid fa-file-lines' },
    { key: 'projects', label: 'Projects', icon: 'fa-solid fa-diagram-project' },
    { key: 'services', label: 'Services', icon: 'fa-solid fa-cart-shopping' },
    { key: 'why', label: 'Why Vyro', icon: 'fa-solid fa-lightbulb' },
    { key: 'process', label: 'Process Steps', icon: 'fa-solid fa-route' },
    { key: 'social', label: 'Social Links', icon: 'fa-solid fa-share-nodes' },
    { key: 'media', label: 'Media Library', icon: 'fa-solid fa-photo-film' },
    { key: 'contact', label: 'Contact Messages', icon: 'fa-solid fa-envelope-open-text' },
    { key: 'feedback', label: 'Feedback', icon: 'fa-solid fa-comment-dots' },
    { key: 'settings', label: 'Settings', icon: 'fa-solid fa-gear' },
  ];

  // ---------------- Render shell ----------------
  function render() {
    if (!state.authed) {
      renderLogin();
      return;
    }
    renderShell();
  }

  function renderLogin() {
    root.innerHTML =
      '<div class="login-screen">' +
      '<div class="login-box">' +
      '<img src="/static/images/logo.png" alt="VYRO" />' +
      '<h2>VYRO Admin</h2>' +
      '<p>Sign in to manage your website content.</p>' +
      '<form id="login-form">' +
      '<div class="a-field"><label>Username</label><input type="text" id="login-username" autocomplete="username" required /></div>' +
      '<div class="a-field"><label>Password</label><input type="password" id="login-password" autocomplete="current-password" required /></div>' +
      '<button type="submit" class="a-btn a-btn-primary" style="width:100%;justify-content:center;padding:12px;">Sign In</button>' +
      '<p class="login-error" id="login-error"></p>' +
      '</form>' +
      '</div></div>';

    document.getElementById('login-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var u = document.getElementById('login-username').value.trim();
      var p = document.getElementById('login-password').value;
      var errEl = document.getElementById('login-error');
      errEl.textContent = '';
      try {
        var res = await login(u, p);
        state.authed = true;
        state.username = res.username;
        render();
      } catch (err) {
        errEl.textContent = err.message || 'Login failed';
      }
    });
  }

  function renderShell() {
    var navHtml = NAV_ITEMS.map(function (item) {
      return '<button class="admin-nav-item ' + (state.tab === item.key ? 'active' : '') + '" data-tab="' + item.key + '">' +
        '<i class="' + item.icon + '"></i><span>' + item.label + '</span>' +
        (item.key === 'feedback' ? '<span class="admin-nav-badge" id="feedback-badge" style="display:none;">•</span>' : '') +
        (item.key === 'contact' ? '<span class="admin-nav-badge" id="contact-badge" style="display:none;">•</span>' : '') +
        '</button>';
    }).join('');

    root.innerHTML =
      '<div class="admin-shell">' +
      '<aside class="admin-sidebar">' +
      '<div class="admin-brand"><img src="/static/images/logo.png" alt="VYRO" /><span>VYRO<span class="accent">ADMIN</span></span></div>' +
      '<nav class="admin-nav-list">' + navHtml + '</nav>' +
      '<button class="admin-logout" id="logout-btn"><i class="fa-solid fa-right-from-bracket"></i> Logout (' + esc(state.username) + ')</button>' +
      '</aside>' +
      '<main class="admin-main" id="admin-content"><div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i></div></main>' +
      '</div>';

    document.querySelectorAll('.admin-nav-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.tab = btn.getAttribute('data-tab');
        render();
      });
    });
    document.getElementById('logout-btn').addEventListener('click', logout);

    loadTab(state.tab);
    checkFeedbackBadge();
    checkContactBadge();
  }

  async function checkFeedbackBadge() {
    try {
      var res = await apiGet('/feedback');
      var hasNew = (res.items || []).some(function (f) { return f.status === 'new'; });
      var badge = document.getElementById('feedback-badge');
      if (badge) badge.style.display = hasNew ? 'inline-flex' : 'none';
    } catch (e) {}
  }

  async function checkContactBadge() {
    try {
      var res = await apiGet('/contact');
      var hasNew = (res.items || []).some(function (m) { return m.status === 'new'; });
      var badge = document.getElementById('contact-badge');
      if (badge) badge.style.display = hasNew ? 'inline-flex' : 'none';
    } catch (e) {}
  }

  async function loadTab(tab) {
    var container = document.getElementById('admin-content');
    if (!container) return;
    container.innerHTML = '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i></div>';
    try {
      switch (tab) {
        case 'content': await renderContentTab(container); break;
        case 'projects': await renderProjectsTab(container); break;
        case 'services': await renderSimpleListTab(container, 'services', 'Services', ['title_en', 'title_ar', 'icon']); break;
        case 'why': await renderWhyTab(container); break;
        case 'process': await renderProcessTab(container); break;
        case 'social': await renderSocialTab(container); break;
        case 'media': await renderMediaTab(container); break;
        case 'contact': await renderContactTab(container); break;
        case 'feedback': await renderFeedbackTab(container); break;
        case 'settings': await renderSettingsTab(container); break;
        default: container.innerHTML = '<p>Unknown tab</p>';
      }
    } catch (err) {
      container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i>Failed to load: ' + esc(err.message) + '</div>';
    }
  }

  // ================= Content tab =================
  async function renderContentTab(container) {
    var res = await apiGet('/content');
    var items = res.items || [];
    var bySection = {};
    items.forEach(function (it) {
      if (!bySection[it.section]) bySection[it.section] = [];
      bySection[it.section].push(it);
    });

    var sectionsHtml = Object.keys(bySection).sort().map(function (section) {
      var rows = bySection[section].map(function (it) {
        return (
          '<div class="a-field" data-content-id="' + it.id + '">' +
          '<label>' + esc(section) + ' — ' + esc(it.field) + '</label>' +
          '<div class="bilingual-field" style="margin-bottom:0;">' +
          '<div class="col"><label><span class="flag">🇬🇧</span> English</label>' +
          (it.value_en.length > 80
            ? '<textarea data-lang="en">' + esc(it.value_en) + '</textarea>'
            : '<input type="text" data-lang="en" value="' + esc(it.value_en) + '" />') +
          '</div>' +
          '<div class="col"><label><span class="flag">🇸🇦</span> Arabic</label>' +
          (it.value_ar.length > 80
            ? '<textarea data-lang="ar">' + esc(it.value_ar) + '</textarea>'
            : '<input type="text" data-lang="ar" value="' + esc(it.value_ar) + '" />') +
          '</div>' +
          '</div>' +
          '<button class="a-btn a-btn-sm a-btn-primary save-content-btn" style="margin-top:8px;" data-id="' + it.id + '"><i class="fa-solid fa-check"></i> Save</button>' +
          '</div>'
        );
      }).join('');

      return '<div class="a-card"><h3>' + esc(section.toUpperCase()) + '</h3>' + rows + '</div>';
    }).join('');

    container.innerHTML =
      '<div class="admin-header"><div><h1>Site Content</h1><p>Edit all bilingual text used across the public site — changes appear instantly.</p></div></div>' +
      sectionsHtml;

    container.querySelectorAll('.save-content-btn').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var id = btn.getAttribute('data-id');
        var wrapper = container.querySelector('[data-content-id="' + id + '"]');
        var enEl = wrapper.querySelector('[data-lang="en"]');
        var arEl = wrapper.querySelector('[data-lang="ar"]');
        btn.disabled = true;
        try {
          await apiPut('/content/' + id, { value_en: enEl.value, value_ar: arEl.value });
          toast('Content updated');
        } catch (err) {
          toast(err.message, 'error');
        } finally {
          btn.disabled = false;
        }
      });
    });
  }

  // ================= Projects tab =================
  async function renderProjectsTab(container) {
    var res = await apiGet('/projects');
    var items = res.items || [];

    var listHtml = items.length
      ? items.map(function (p) {
          return (
            '<div class="item-row ' + (p.is_active ? '' : 'inactive') + '" data-id="' + p.id + '">' +
            '<img class="item-thumb" src="' + esc(p.qr_image_url || '/static/images/logo.png') + '" />' +
            '<div class="item-info">' +
            '<div class="item-title">' + esc(p.name_en) + (p.name_ar ? ' / ' + esc(p.name_ar) : '') + '</div>' +
            '<div class="item-sub">' + esc(p.category_en) + ' · <a href="' + esc(p.url) + '" target="_blank">' + esc(p.url) + '</a></div>' +
            '</div>' +
            '<div class="item-actions">' +
            '<button class="a-btn a-btn-sm a-btn-icon move-up" title="Move up"><i class="fa-solid fa-arrow-up"></i></button>' +
            '<button class="a-btn a-btn-sm a-btn-icon move-down" title="Move down"><i class="fa-solid fa-arrow-down"></i></button>' +
            '<button class="a-btn a-btn-sm edit-btn"><i class="fa-solid fa-pen"></i> Edit</button>' +
            '<button class="a-btn a-btn-sm a-btn-danger delete-btn"><i class="fa-solid fa-trash"></i></button>' +
            '</div></div>'
          );
        }).join('')
      : '<div class="empty-state"><i class="fa-solid fa-diagram-project"></i>No projects yet.</div>';

    container.innerHTML =
      '<div class="admin-header"><div><h1>Projects</h1><p>Manage Selected Work cards — QR image, name, category and link.</p></div>' +
      '<button class="a-btn a-btn-primary" id="add-project-btn"><i class="fa-solid fa-plus"></i> Add Project</button></div>' +
      '<div class="a-card"><div class="item-list">' + listHtml + '</div></div>' +
      '<div id="project-form-mount"></div>';

    container.querySelectorAll('.item-row').forEach(function (row) {
      var id = row.getAttribute('data-id');
      var project = items.find(function (p) { return String(p.id) === id; });

      row.querySelector('.edit-btn').addEventListener('click', function () {
        openProjectForm(container, project);
      });
      row.querySelector('.delete-btn').addEventListener('click', async function () {
        if (!confirm('Delete "' + project.name_en + '"?')) return;
        await apiDelete('/projects/' + id);
        toast('Project deleted');
        loadTab('projects');
      });
      row.querySelector('.move-up').addEventListener('click', async function () {
        await apiPut('/projects/' + id + '/reorder', { direction: 'up' });
        loadTab('projects');
      });
      row.querySelector('.move-down').addEventListener('click', async function () {
        await apiPut('/projects/' + id + '/reorder', { direction: 'down' });
        loadTab('projects');
      });
    });

    document.getElementById('add-project-btn').addEventListener('click', function () {
      openProjectForm(container, null);
    });
  }

  function openProjectForm(container, project) {
    var mount = document.getElementById('project-form-mount');
    var isEdit = !!project;
    mount.innerHTML =
      '<div class="a-card">' +
      '<h3>' + (isEdit ? 'Edit Project' : 'Add Project') + '</h3>' +
      '<div class="bilingual-field">' +
      '<div class="col"><label>Name (EN)</label><input type="text" id="pf-name-en" value="' + esc(project ? project.name_en : '') + '" /></div>' +
      '<div class="col"><label>Name (AR)</label><input type="text" id="pf-name-ar" value="' + esc(project ? project.name_ar : '') + '" /></div>' +
      '</div>' +
      '<div class="bilingual-field">' +
      '<div class="col"><label>Category (EN)</label><input type="text" id="pf-cat-en" value="' + esc(project ? project.category_en : '') + '" /></div>' +
      '<div class="col"><label>Category (AR)</label><input type="text" id="pf-cat-ar" value="' + esc(project ? project.category_ar : '') + '" /></div>' +
      '</div>' +
      '<div class="a-field"><label>Project URL</label><input type="url" id="pf-url" value="' + esc(project ? project.url : '') + '" placeholder="https://example.com" /></div>' +
      '<div class="a-field"><label>QR Code Image</label>' +
      '<div id="pf-qr-preview" style="margin-bottom:10px;">' +
      (project && project.qr_image_url ? '<img src="' + esc(project.qr_image_url) + '" style="width:100px;height:100px;object-fit:cover;border-radius:8px;" />' : '') +
      '</div>' +
      '<input type="hidden" id="pf-qr-url" value="' + esc(project ? project.qr_image_url : '') + '" />' +
      '<input type="file" id="pf-qr-file" accept="image/*" />' +
      '<p class="a-field-hint">Upload a new QR image to replace the current one, or leave empty to keep it.</p>' +
      '</div>' +
      (isEdit ? '<div class="a-field"><label><input type="checkbox" id="pf-active" ' + (project.is_active ? 'checked' : '') + ' style="width:auto;margin-right:8px;" />Active (visible on site)</label></div>' : '') +
      '<div style="display:flex;gap:10px;">' +
      '<button class="a-btn a-btn-primary" id="pf-save"><i class="fa-solid fa-check"></i> Save</button>' +
      '<button class="a-btn" id="pf-cancel">Cancel</button>' +
      '</div>' +
      '</div>';

    document.getElementById('pf-cancel').addEventListener('click', function () { mount.innerHTML = ''; });

    document.getElementById('pf-qr-file').addEventListener('change', async function (e) {
      var file = e.target.files[0];
      if (!file) return;
      try {
        var url = await uploadMediaFile(file);
        document.getElementById('pf-qr-url').value = url;
        document.getElementById('pf-qr-preview').innerHTML = '<img src="' + esc(url) + '" style="width:100px;height:100px;object-fit:cover;border-radius:8px;" />';
        toast('QR image uploaded');
      } catch (err) {
        toast(err.message, 'error');
      }
    });

    document.getElementById('pf-save').addEventListener('click', async function () {
      var payload = {
        name_en: document.getElementById('pf-name-en').value.trim(),
        name_ar: document.getElementById('pf-name-ar').value.trim(),
        category_en: document.getElementById('pf-cat-en').value.trim(),
        category_ar: document.getElementById('pf-cat-ar').value.trim(),
        url: document.getElementById('pf-url').value.trim(),
        qr_image_url: document.getElementById('pf-qr-url').value.trim(),
      };
      if (isEdit) payload.is_active = document.getElementById('pf-active').checked;

      if (!payload.name_en || !payload.url) {
        toast('Name and URL are required', 'error');
        return;
      }

      try {
        if (isEdit) {
          await apiPut('/projects/' + project.id, payload);
        } else {
          await apiPost('/projects', payload);
        }
        toast('Project saved');
        loadTab('projects');
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  }

  // ================= Generic simple list (Services) =================
  async function renderSimpleListTab(container, resource, title, fields) {
    var res = await apiGet('/' + resource);
    var items = res.items || [];

    var listHtml = items.length
      ? items.map(function (it) {
          return (
            '<div class="item-row ' + (it.is_active ? '' : 'inactive') + '" data-id="' + it.id + '">' +
            '<div class="item-thumb" style="background:rgba(255,122,26,0.12);display:flex;align-items:center;justify-content:center;"><i class="' + esc(it.icon || 'fa-solid fa-star') + '" style="color:#ffa552;"></i></div>' +
            '<div class="item-info"><div class="item-title">' + esc(it.title_en) + (it.title_ar ? ' / ' + esc(it.title_ar) : '') + '</div></div>' +
            '<div class="item-actions">' +
            '<button class="a-btn a-btn-sm a-btn-icon move-up"><i class="fa-solid fa-arrow-up"></i></button>' +
            '<button class="a-btn a-btn-sm a-btn-icon move-down"><i class="fa-solid fa-arrow-down"></i></button>' +
            '<button class="a-btn a-btn-sm edit-btn"><i class="fa-solid fa-pen"></i> Edit</button>' +
            '<button class="a-btn a-btn-sm a-btn-danger delete-btn"><i class="fa-solid fa-trash"></i></button>' +
            '</div></div>'
          );
        }).join('')
      : '<div class="empty-state"><i class="fa-solid fa-inbox"></i>No items yet.</div>';

    container.innerHTML =
      '<div class="admin-header"><div><h1>' + esc(title) + '</h1><p>Manage the ' + esc(title.toLowerCase()) + ' cards shown on the site.</p></div>' +
      '<button class="a-btn a-btn-primary" id="add-item-btn"><i class="fa-solid fa-plus"></i> Add</button></div>' +
      '<div class="a-card"><div class="item-list">' + listHtml + '</div></div>' +
      '<div id="item-form-mount"></div>';

    function openForm(item) {
      var mount = document.getElementById('item-form-mount');
      var isEdit = !!item;
      mount.innerHTML =
        '<div class="a-card"><h3>' + (isEdit ? 'Edit' : 'Add') + ' ' + esc(title) + '</h3>' +
        '<div class="bilingual-field">' +
        '<div class="col"><label>Title (EN)</label><input type="text" id="if-title-en" value="' + esc(item ? item.title_en : '') + '" /></div>' +
        '<div class="col"><label>Title (AR)</label><input type="text" id="if-title-ar" value="' + esc(item ? item.title_ar : '') + '" /></div>' +
        '</div>' +
        '<div class="a-field"><label>Icon (Font Awesome class)</label><input type="text" id="if-icon" value="' + esc(item ? item.icon : 'fa-solid fa-star') + '" placeholder="fa-solid fa-code" />' +
        '<p class="a-field-hint">See icons at fontawesome.com/icons — e.g. fa-solid fa-code</p></div>' +
        (isEdit ? '<div class="a-field"><label><input type="checkbox" id="if-active" ' + (item.is_active ? 'checked' : '') + ' style="width:auto;margin-right:8px;" />Active</label></div>' : '') +
        '<div style="display:flex;gap:10px;">' +
        '<button class="a-btn a-btn-primary" id="if-save"><i class="fa-solid fa-check"></i> Save</button>' +
        '<button class="a-btn" id="if-cancel">Cancel</button>' +
        '</div></div>';

      document.getElementById('if-cancel').addEventListener('click', function () { mount.innerHTML = ''; });
      document.getElementById('if-save').addEventListener('click', async function () {
        var payload = {
          title_en: document.getElementById('if-title-en').value.trim(),
          title_ar: document.getElementById('if-title-ar').value.trim(),
          icon: document.getElementById('if-icon').value.trim(),
        };
        if (isEdit) payload.is_active = document.getElementById('if-active').checked;
        if (!payload.title_en) { toast('Title (EN) is required', 'error'); return; }
        try {
          if (isEdit) await apiPut('/' + resource + '/' + item.id, payload);
          else await apiPost('/' + resource, payload);
          toast('Saved');
          loadTab(state.tab);
        } catch (err) { toast(err.message, 'error'); }
      });
    }

    container.querySelectorAll('.item-row').forEach(function (row) {
      var id = row.getAttribute('data-id');
      var item = items.find(function (x) { return String(x.id) === id; });
      row.querySelector('.edit-btn').addEventListener('click', function () { openForm(item); });
      row.querySelector('.delete-btn').addEventListener('click', async function () {
        if (!confirm('Delete this item?')) return;
        await apiDelete('/' + resource + '/' + id);
        toast('Deleted');
        loadTab(state.tab);
      });
      row.querySelector('.move-up').addEventListener('click', async function () {
        await apiPut('/' + resource + '/' + id + '/reorder', { direction: 'up' });
        loadTab(state.tab);
      });
      row.querySelector('.move-down').addEventListener('click', async function () {
        await apiPut('/' + resource + '/' + id + '/reorder', { direction: 'down' });
        loadTab(state.tab);
      });
    });

    document.getElementById('add-item-btn').addEventListener('click', function () { openForm(null); });
  }

  // ================= Why Vyro tab =================
  async function renderWhyTab(container) {
    var res = await apiGet('/why');
    var items = res.items || [];

    var listHtml = items.length
      ? items.map(function (it) {
          return (
            '<div class="item-row ' + (it.is_active ? '' : 'inactive') + '" data-id="' + it.id + '">' +
            '<div class="item-thumb" style="background:rgba(255,122,26,0.12);display:flex;align-items:center;justify-content:center;"><i class="' + esc(it.icon) + '" style="color:#ffa552;"></i></div>' +
            '<div class="item-info"><div class="item-title">' + esc(it.title_en) + '</div><div class="item-sub">' + esc(it.text_en) + '</div></div>' +
            '<div class="item-actions">' +
            '<button class="a-btn a-btn-sm a-btn-icon move-up"><i class="fa-solid fa-arrow-up"></i></button>' +
            '<button class="a-btn a-btn-sm a-btn-icon move-down"><i class="fa-solid fa-arrow-down"></i></button>' +
            '<button class="a-btn a-btn-sm edit-btn"><i class="fa-solid fa-pen"></i> Edit</button>' +
            '<button class="a-btn a-btn-sm a-btn-danger delete-btn"><i class="fa-solid fa-trash"></i></button>' +
            '</div></div>'
          );
        }).join('')
      : '<div class="empty-state"><i class="fa-solid fa-lightbulb"></i>No highlights yet.</div>';

    container.innerHTML =
      '<div class="admin-header"><div><h1>Why Vyro</h1><p>Manage the Creative / Functional / Business-Focused highlight cards.</p></div>' +
      '<button class="a-btn a-btn-primary" id="add-why-btn"><i class="fa-solid fa-plus"></i> Add</button></div>' +
      '<div class="a-card"><div class="item-list">' + listHtml + '</div></div>' +
      '<div id="why-form-mount"></div>';

    function openForm(item) {
      var mount = document.getElementById('why-form-mount');
      var isEdit = !!item;
      mount.innerHTML =
        '<div class="a-card"><h3>' + (isEdit ? 'Edit' : 'Add') + ' Highlight</h3>' +
        '<div class="bilingual-field">' +
        '<div class="col"><label>Title (EN)</label><input type="text" id="wf-title-en" value="' + esc(item ? item.title_en : '') + '" /></div>' +
        '<div class="col"><label>Title (AR)</label><input type="text" id="wf-title-ar" value="' + esc(item ? item.title_ar : '') + '" /></div>' +
        '</div>' +
        '<div class="bilingual-field">' +
        '<div class="col"><label>Text (EN)</label><textarea id="wf-text-en">' + esc(item ? item.text_en : '') + '</textarea></div>' +
        '<div class="col"><label>Text (AR)</label><textarea id="wf-text-ar">' + esc(item ? item.text_ar : '') + '</textarea></div>' +
        '</div>' +
        '<div class="a-field"><label>Icon</label><input type="text" id="wf-icon" value="' + esc(item ? item.icon : 'fa-solid fa-lightbulb') + '" /></div>' +
        (isEdit ? '<div class="a-field"><label><input type="checkbox" id="wf-active" ' + (item.is_active ? 'checked' : '') + ' style="width:auto;margin-right:8px;" />Active</label></div>' : '') +
        '<div style="display:flex;gap:10px;">' +
        '<button class="a-btn a-btn-primary" id="wf-save"><i class="fa-solid fa-check"></i> Save</button>' +
        '<button class="a-btn" id="wf-cancel">Cancel</button>' +
        '</div></div>';

      document.getElementById('wf-cancel').addEventListener('click', function () { mount.innerHTML = ''; });
      document.getElementById('wf-save').addEventListener('click', async function () {
        var payload = {
          title_en: document.getElementById('wf-title-en').value.trim(),
          title_ar: document.getElementById('wf-title-ar').value.trim(),
          text_en: document.getElementById('wf-text-en').value.trim(),
          text_ar: document.getElementById('wf-text-ar').value.trim(),
          icon: document.getElementById('wf-icon').value.trim(),
        };
        if (isEdit) payload.is_active = document.getElementById('wf-active').checked;
        if (!payload.title_en) { toast('Title (EN) is required', 'error'); return; }
        try {
          if (isEdit) await apiPut('/why/' + item.id, payload);
          else await apiPost('/why', payload);
          toast('Saved');
          loadTab('why');
        } catch (err) { toast(err.message, 'error'); }
      });
    }

    container.querySelectorAll('.item-row').forEach(function (row) {
      var id = row.getAttribute('data-id');
      var item = items.find(function (x) { return String(x.id) === id; });
      row.querySelector('.edit-btn').addEventListener('click', function () { openForm(item); });
      row.querySelector('.delete-btn').addEventListener('click', async function () {
        if (!confirm('Delete this highlight?')) return;
        await apiDelete('/why/' + id);
        toast('Deleted');
        loadTab('why');
      });
      row.querySelector('.move-up').addEventListener('click', async function () {
        await apiPut('/why/' + id + '/reorder', { direction: 'up' });
        loadTab('why');
      });
      row.querySelector('.move-down').addEventListener('click', async function () {
        await apiPut('/why/' + id + '/reorder', { direction: 'down' });
        loadTab('why');
      });
    });

    document.getElementById('add-why-btn').addEventListener('click', function () { openForm(null); });
  }

  // ================= Process tab =================
  async function renderProcessTab(container) {
    var res = await apiGet('/process');
    var items = res.items || [];

    var listHtml = items.length
      ? items.map(function (it, idx) {
          return (
            '<div class="item-row ' + (it.is_active ? '' : 'inactive') + '" data-id="' + it.id + '">' +
            '<div class="item-thumb" style="background:rgba(255,122,26,0.12);display:flex;align-items:center;justify-content:center;font-weight:800;color:#ffa552;">0' + (idx + 1) + '</div>' +
            '<div class="item-info"><div class="item-title">' + esc(it.title_en) + (it.title_ar ? ' / ' + esc(it.title_ar) : '') + '</div></div>' +
            '<div class="item-actions">' +
            '<button class="a-btn a-btn-sm a-btn-icon move-up"><i class="fa-solid fa-arrow-up"></i></button>' +
            '<button class="a-btn a-btn-sm a-btn-icon move-down"><i class="fa-solid fa-arrow-down"></i></button>' +
            '<button class="a-btn a-btn-sm edit-btn"><i class="fa-solid fa-pen"></i> Edit</button>' +
            '<button class="a-btn a-btn-sm a-btn-danger delete-btn"><i class="fa-solid fa-trash"></i></button>' +
            '</div></div>'
          );
        }).join('')
      : '<div class="empty-state"><i class="fa-solid fa-route"></i>No steps yet.</div>';

    container.innerHTML =
      '<div class="admin-header"><div><h1>Process Steps</h1><p>Manage the Discover → Design → Build → Launch track.</p></div>' +
      '<button class="a-btn a-btn-primary" id="add-step-btn"><i class="fa-solid fa-plus"></i> Add Step</button></div>' +
      '<div class="a-card"><div class="item-list">' + listHtml + '</div></div>' +
      '<div id="step-form-mount"></div>';

    function openForm(item) {
      var mount = document.getElementById('step-form-mount');
      var isEdit = !!item;
      mount.innerHTML =
        '<div class="a-card"><h3>' + (isEdit ? 'Edit' : 'Add') + ' Step</h3>' +
        '<div class="bilingual-field">' +
        '<div class="col"><label>Title (EN)</label><input type="text" id="sf-title-en" value="' + esc(item ? item.title_en : '') + '" /></div>' +
        '<div class="col"><label>Title (AR)</label><input type="text" id="sf-title-ar" value="' + esc(item ? item.title_ar : '') + '" /></div>' +
        '</div>' +
        (isEdit ? '<div class="a-field"><label><input type="checkbox" id="sf-active" ' + (item.is_active ? 'checked' : '') + ' style="width:auto;margin-right:8px;" />Active</label></div>' : '') +
        '<div style="display:flex;gap:10px;">' +
        '<button class="a-btn a-btn-primary" id="sf-save"><i class="fa-solid fa-check"></i> Save</button>' +
        '<button class="a-btn" id="sf-cancel">Cancel</button>' +
        '</div></div>';

      document.getElementById('sf-cancel').addEventListener('click', function () { mount.innerHTML = ''; });
      document.getElementById('sf-save').addEventListener('click', async function () {
        var payload = {
          title_en: document.getElementById('sf-title-en').value.trim(),
          title_ar: document.getElementById('sf-title-ar').value.trim(),
        };
        if (isEdit) payload.is_active = document.getElementById('sf-active').checked;
        if (!payload.title_en) { toast('Title (EN) is required', 'error'); return; }
        try {
          if (isEdit) await apiPut('/process/' + item.id, payload);
          else await apiPost('/process', payload);
          toast('Saved');
          loadTab('process');
        } catch (err) { toast(err.message, 'error'); }
      });
    }

    container.querySelectorAll('.item-row').forEach(function (row) {
      var id = row.getAttribute('data-id');
      var item = items.find(function (x) { return String(x.id) === id; });
      row.querySelector('.edit-btn').addEventListener('click', function () { openForm(item); });
      row.querySelector('.delete-btn').addEventListener('click', async function () {
        if (!confirm('Delete this step?')) return;
        await apiDelete('/process/' + id);
        toast('Deleted');
        loadTab('process');
      });
      row.querySelector('.move-up').addEventListener('click', async function () {
        await apiPut('/process/' + id + '/reorder', { direction: 'up' });
        loadTab('process');
      });
      row.querySelector('.move-down').addEventListener('click', async function () {
        await apiPut('/process/' + id + '/reorder', { direction: 'down' });
        loadTab('process');
      });
    });

    document.getElementById('add-step-btn').addEventListener('click', function () { openForm(null); });
  }

  // ================= Social links tab =================
  async function renderSocialTab(container) {
    var res = await apiGet('/social-links');
    var items = res.items || [];

    var listHtml = items.length
      ? items.map(function (it) {
          return (
            '<div class="item-row ' + (it.is_active ? '' : 'inactive') + '" data-id="' + it.id + '">' +
            '<div class="item-thumb" style="background:rgba(255,122,26,0.12);display:flex;align-items:center;justify-content:center;"><i class="' + esc(it.icon) + '" style="color:#ffa552;"></i></div>' +
            '<div class="item-info"><div class="item-title">' + esc(it.platform) + '</div><div class="item-sub">' + esc(it.label) + ' · <a href="' + esc(it.url) + '" target="_blank">' + esc(it.url) + '</a></div></div>' +
            '<div class="item-actions">' +
            '<button class="a-btn a-btn-sm a-btn-icon move-up"><i class="fa-solid fa-arrow-up"></i></button>' +
            '<button class="a-btn a-btn-sm a-btn-icon move-down"><i class="fa-solid fa-arrow-down"></i></button>' +
            '<button class="a-btn a-btn-sm edit-btn"><i class="fa-solid fa-pen"></i> Edit</button>' +
            '<button class="a-btn a-btn-sm a-btn-danger delete-btn"><i class="fa-solid fa-trash"></i></button>' +
            '</div></div>'
          );
        }).join('')
      : '<div class="empty-state"><i class="fa-solid fa-share-nodes"></i>No links yet.</div>';

    container.innerHTML =
      '<div class="admin-header"><div><h1>Social Links</h1><p>Manage TikTok, Instagram, WhatsApp and other connect cards.</p></div>' +
      '<button class="a-btn a-btn-primary" id="add-link-btn"><i class="fa-solid fa-plus"></i> Add Link</button></div>' +
      '<div class="a-card"><div class="item-list">' + listHtml + '</div></div>' +
      '<div id="link-form-mount"></div>';

    function openForm(item) {
      var mount = document.getElementById('link-form-mount');
      var isEdit = !!item;
      mount.innerHTML =
        '<div class="a-card"><h3>' + (isEdit ? 'Edit' : 'Add') + ' Link</h3>' +
        '<div class="a-field-row">' +
        '<div class="a-field"><label>Platform key</label><input type="text" id="lf-platform" value="' + esc(item ? item.platform : '') + '" placeholder="tiktok / instagram / whatsapp" /></div>' +
        '<div class="a-field"><label>Icon</label><input type="text" id="lf-icon" value="' + esc(item ? item.icon : 'fa-brands fa-link') + '" /></div>' +
        '</div>' +
        '<div class="a-field"><label>Display label</label><input type="text" id="lf-label" value="' + esc(item ? item.label : '') + '" placeholder="@handle or phone number" /></div>' +
        '<div class="a-field"><label>URL</label><input type="url" id="lf-url" value="' + esc(item ? item.url : '') + '" /></div>' +
        (isEdit ? '<div class="a-field"><label><input type="checkbox" id="lf-active" ' + (item.is_active ? 'checked' : '') + ' style="width:auto;margin-right:8px;" />Active</label></div>' : '') +
        '<div style="display:flex;gap:10px;">' +
        '<button class="a-btn a-btn-primary" id="lf-save"><i class="fa-solid fa-check"></i> Save</button>' +
        '<button class="a-btn" id="lf-cancel">Cancel</button>' +
        '</div></div>';

      document.getElementById('lf-cancel').addEventListener('click', function () { mount.innerHTML = ''; });
      document.getElementById('lf-save').addEventListener('click', async function () {
        var payload = {
          platform: document.getElementById('lf-platform').value.trim(),
          icon: document.getElementById('lf-icon').value.trim(),
          label: document.getElementById('lf-label').value.trim(),
          url: document.getElementById('lf-url').value.trim(),
        };
        if (isEdit) payload.is_active = document.getElementById('lf-active').checked;
        if (!payload.platform || !payload.url) { toast('Platform and URL are required', 'error'); return; }
        try {
          if (isEdit) await apiPut('/social-links/' + item.id, payload);
          else await apiPost('/social-links', payload);
          toast('Saved');
          loadTab('social');
        } catch (err) { toast(err.message, 'error'); }
      });
    }

    container.querySelectorAll('.item-row').forEach(function (row) {
      var id = row.getAttribute('data-id');
      var item = items.find(function (x) { return String(x.id) === id; });
      row.querySelector('.edit-btn').addEventListener('click', function () { openForm(item); });
      row.querySelector('.delete-btn').addEventListener('click', async function () {
        if (!confirm('Delete this link?')) return;
        await apiDelete('/social-links/' + id);
        toast('Deleted');
        loadTab('social');
      });
      row.querySelector('.move-up').addEventListener('click', async function () {
        await apiPut('/social-links/' + id + '/reorder', { direction: 'up' });
        loadTab('social');
      });
      row.querySelector('.move-down').addEventListener('click', async function () {
        await apiPut('/social-links/' + id + '/reorder', { direction: 'down' });
        loadTab('social');
      });
    });

    document.getElementById('add-link-btn').addEventListener('click', function () { openForm(null); });
  }

  // ================= Media library tab =================
  async function uploadMediaFile(file) {
    var formData = new FormData();
    formData.append('file', file);
    var res = await fetch('/api/admin/media/upload', {
      method: 'POST',
      credentials: 'same-origin',
      body: formData,
    });
    var json = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(json.error || 'Upload failed');
    return json.url;
  }

  async function renderMediaTab(container) {
    var res = await apiGet('/media');
    var items = res.items || [];

    var gridHtml = items.length
      ? items.map(function (m) {
          var isImage = m.kind === 'image';
          return (
            '<div class="media-item" data-id="' + m.id + '">' +
            '<div class="thumb">' + (isImage ? '<img src="' + esc(m.url) + '" />' : '<i class="fa-solid fa-music"></i>') + '</div>' +
            '<div class="meta"><div class="fname">' + esc(m.filename) + '</div>' +
            '<span class="url-copy" data-url="' + esc(m.url) + '"><i class="fa-solid fa-copy"></i> Copy URL</span></div>' +
            '<div class="actions"><button class="a-btn a-btn-sm a-btn-icon a-btn-danger delete-media-btn"><i class="fa-solid fa-trash"></i></button></div>' +
            '</div>'
          );
        }).join('')
      : '<div class="empty-state"><i class="fa-solid fa-photo-film"></i>No media uploaded yet.</div>';

    container.innerHTML =
      '<div class="admin-header"><div><h1>Media Library</h1><p>Upload and manage images/audio used across the site. Max 10MB per file.</p></div></div>' +
      '<div class="dropzone" id="dropzone"><i class="fa-solid fa-cloud-arrow-up"></i><div>Click or drag files here to upload (images or audio)</div>' +
      '<input type="file" id="media-file-input" accept="image/*,audio/*" multiple hidden /></div>' +
      '<div class="media-grid">' + gridHtml + '</div>';

    var dropzone = document.getElementById('dropzone');
    var fileInput = document.getElementById('media-file-input');

    dropzone.addEventListener('click', function () { fileInput.click(); });
    dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('dragover'); });
    dropzone.addEventListener('drop', function (e) {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', function () { handleFiles(fileInput.files); });

    async function handleFiles(files) {
      for (var i = 0; i < files.length; i++) {
        try {
          await uploadMediaFile(files[i]);
        } catch (err) {
          toast(err.message, 'error');
        }
      }
      toast('Upload complete');
      loadTab('media');
    }

    container.querySelectorAll('.url-copy').forEach(function (el) {
      el.addEventListener('click', function () {
        var url = el.getAttribute('data-url');
        navigator.clipboard.writeText(window.location.origin + url).then(function () {
          toast('URL copied to clipboard');
        });
      });
    });

    container.querySelectorAll('.delete-media-btn').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var id = btn.closest('.media-item').getAttribute('data-id');
        if (!confirm('Delete this media file?')) return;
        await apiDelete('/media/' + id);
        toast('Deleted');
        loadTab('media');
      });
    });
  }

  // ================= Feedback tab =================
  function syncBadgeHtml(synced) {
    return synced
      ? '<span class="badge badge-synced" title="Saved to Google Sheet"><i class="fa-solid fa-cloud-arrow-up"></i> Synced</span>'
      : '<span class="badge badge-unsynced" title="Not yet saved to Google Sheet"><i class="fa-solid fa-triangle-exclamation"></i> Not synced</span>';
  }

  async function renderFeedbackTab(container) {
    var res = await apiGet('/feedback');
    var items = res.items || [];

    var rowsHtml = items.length
      ? items.map(function (f) {
          var badgeClass = f.status === 'new' ? 'badge-new' : f.status === 'archived' ? 'badge-archived' : 'badge-read';
          var date = new Date(f.created_at).toLocaleString();
          var who = [f.name, f.email_phone].filter(Boolean).join(' · ');
          return (
            '<div class="a-card" data-id="' + f.id + '" style="margin-bottom:14px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">' +
            '<div>' +
            '<span class="badge ' + badgeClass + '">' + esc(f.status.toUpperCase()) + '</span> ' +
            (f.emoji ? '<span style="font-size:18px;">' + esc(f.emoji) + '</span> ' : '') +
            syncBadgeHtml(!!f.sheet_synced) + ' ' +
            '<span style="color:#6f6a63;font-size:12px;">' + esc(date) + ' · ' + esc(f.lang.toUpperCase()) + '</span>' +
            '</div>' +
            '<div class="item-actions">' +
            (f.status !== 'read' ? '<button class="a-btn a-btn-sm mark-read-btn"><i class="fa-solid fa-eye"></i> Mark read</button>' : '') +
            (f.status !== 'archived' ? '<button class="a-btn a-btn-sm archive-btn"><i class="fa-solid fa-box-archive"></i> Archive</button>' : '') +
            (!f.sheet_synced ? '<button class="a-btn a-btn-sm resync-btn"><i class="fa-solid fa-rotate"></i> Retry sync</button>' : '') +
            '<button class="a-btn a-btn-sm a-btn-danger delete-feedback-btn"><i class="fa-solid fa-trash"></i></button>' +
            '</div></div>' +
            (who ? '<p style="margin-top:10px;font-size:13px;color:#8f8a82;">' + esc(who) + '</p>' : '') +
            (f.message ? '<p style="margin-top:8px;font-size:14px;line-height:1.6;">' + esc(f.message) + '</p>' : '') +
            (f.voice_url ? '<div class="audio-cell" style="margin-top:12px;"><audio controls src="' + esc(f.voice_url) + '"></audio></div>' : '') +
            '</div>'
          );
        }).join('')
      : '<div class="empty-state"><i class="fa-solid fa-comment-dots"></i>No feedback received yet.</div>';

    container.innerHTML =
      '<div class="admin-header"><div><h1>Feedback &amp; Suggestions</h1><p>Visitor feedback, emoji ratings and voice messages from the public site. Every entry is also forwarded to your Google Sheet.</p></div></div>' +
      rowsHtml;

    container.querySelectorAll('[data-id]').forEach(function (card) {
      var id = card.getAttribute('data-id');
      var markReadBtn = card.querySelector('.mark-read-btn');
      var archiveBtn = card.querySelector('.archive-btn');
      var deleteBtn = card.querySelector('.delete-feedback-btn');
      var resyncBtn = card.querySelector('.resync-btn');

      if (markReadBtn) markReadBtn.addEventListener('click', async function () {
        await apiPut('/feedback/' + id + '/status', { status: 'read' });
        loadTab('feedback');
        checkFeedbackBadge();
      });
      if (archiveBtn) archiveBtn.addEventListener('click', async function () {
        await apiPut('/feedback/' + id + '/status', { status: 'archived' });
        loadTab('feedback');
        checkFeedbackBadge();
      });
      if (resyncBtn) resyncBtn.addEventListener('click', async function () {
        resyncBtn.disabled = true;
        try {
          var r = await apiPost('/feedback/' + id + '/resync', {});
          toast(r.success ? 'Synced to Google Sheet' : 'Sheet sync failed — check webhook URL/permissions', r.success ? 'success' : 'error');
          loadTab('feedback');
        } catch (err) {
          toast(err.message, 'error');
          resyncBtn.disabled = false;
        }
      });
      if (deleteBtn) deleteBtn.addEventListener('click', async function () {
        if (!confirm('Delete this feedback entry?')) return;
        await apiDelete('/feedback/' + id);
        toast('Deleted');
        loadTab('feedback');
        checkFeedbackBadge();
      });
    });
  }

  // ================= Contact Messages tab =================
  async function renderContactTab(container) {
    var res = await apiGet('/contact');
    var items = res.items || [];

    var rowsHtml = items.length
      ? items.map(function (m) {
          var badgeClass = m.status === 'new' ? 'badge-new' : m.status === 'archived' ? 'badge-archived' : 'badge-read';
          var date = new Date(m.created_at).toLocaleString();
          return (
            '<div class="a-card" data-id="' + m.id + '" style="margin-bottom:14px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">' +
            '<div>' +
            '<span class="badge ' + badgeClass + '">' + esc(m.status.toUpperCase()) + '</span> ' +
            syncBadgeHtml(!!m.sheet_synced) + ' ' +
            '<span style="color:#6f6a63;font-size:12px;">' + esc(date) + ' · ' + esc((m.lang || 'en').toUpperCase()) + '</span>' +
            '</div>' +
            '<div class="item-actions">' +
            (m.status !== 'read' ? '<button class="a-btn a-btn-sm mark-read-btn"><i class="fa-solid fa-eye"></i> Mark read</button>' : '') +
            (m.status !== 'archived' ? '<button class="a-btn a-btn-sm archive-btn"><i class="fa-solid fa-box-archive"></i> Archive</button>' : '') +
            (!m.sheet_synced ? '<button class="a-btn a-btn-sm resync-btn"><i class="fa-solid fa-rotate"></i> Retry sync</button>' : '') +
            '<button class="a-btn a-btn-sm a-btn-danger delete-contact-btn"><i class="fa-solid fa-trash"></i></button>' +
            '</div></div>' +
            '<p style="margin-top:10px;font-size:14px;"><strong>' + esc(m.name) + '</strong> &middot; ' + esc(m.email_phone) + '</p>' +
            '<p style="margin-top:8px;font-size:14px;line-height:1.6;">' + esc(m.message) + '</p>' +
            '</div>'
          );
        }).join('')
      : '<div class="empty-state"><i class="fa-solid fa-envelope-open-text"></i>No contact messages received yet.</div>';

    container.innerHTML =
      '<div class="admin-header"><div><h1>Contact Messages</h1><p>Messages submitted via the Contact form. Every entry is also forwarded to your Google Sheet.</p></div></div>' +
      rowsHtml;

    container.querySelectorAll('[data-id]').forEach(function (card) {
      var id = card.getAttribute('data-id');
      var markReadBtn = card.querySelector('.mark-read-btn');
      var archiveBtn = card.querySelector('.archive-btn');
      var deleteBtn = card.querySelector('.delete-contact-btn');
      var resyncBtn = card.querySelector('.resync-btn');

      if (markReadBtn) markReadBtn.addEventListener('click', async function () {
        await apiPut('/contact/' + id + '/status', { status: 'read' });
        loadTab('contact');
        checkContactBadge();
      });
      if (archiveBtn) archiveBtn.addEventListener('click', async function () {
        await apiPut('/contact/' + id + '/status', { status: 'archived' });
        loadTab('contact');
        checkContactBadge();
      });
      if (resyncBtn) resyncBtn.addEventListener('click', async function () {
        resyncBtn.disabled = true;
        try {
          var r = await apiPost('/contact/' + id + '/resync', {});
          toast(r.success ? 'Synced to Google Sheet' : 'Sheet sync failed — check webhook URL/permissions', r.success ? 'success' : 'error');
          loadTab('contact');
        } catch (err) {
          toast(err.message, 'error');
          resyncBtn.disabled = false;
        }
      });
      if (deleteBtn) deleteBtn.addEventListener('click', async function () {
        if (!confirm('Delete this contact message?')) return;
        await apiDelete('/contact/' + id);
        toast('Deleted');
        loadTab('contact');
        checkContactBadge();
      });
    });
  }

  // ================= Settings tab =================
  async function renderSettingsTab(container) {
    var res = await apiGet('/settings');
    var items = res.items || [];
    var map = {};
    items.forEach(function (s) { map[s.key] = s.value; });

    container.innerHTML =
      '<div class="admin-header"><div><h1>Settings</h1><p>Global site settings, contact details and admin password.</p></div></div>' +
      '<div class="a-card"><h3>Contact</h3>' +
      '<div class="a-field"><label>WhatsApp number (digits only, with country code)</label><input type="text" id="set-whatsapp" value="' + esc(map.whatsapp_number || '') + '" placeholder="201033623827" /></div>' +
      '<div class="a-field"><label>Contact email</label><input type="email" id="set-email" value="' + esc(map.contact_email || '') + '" /></div>' +
      '<div class="a-field"><label>Default theme</label><select id="set-theme"><option value="dark" ' + (map.default_theme === 'dark' ? 'selected' : '') + '>Dark</option><option value="light" ' + (map.default_theme === 'light' ? 'selected' : '') + '>Light</option></select></div>' +
      '<div class="a-field"><label>Default language</label><select id="set-lang"><option value="en" ' + (map.default_lang === 'en' ? 'selected' : '') + '>English</option><option value="ar" ' + (map.default_lang === 'ar' ? 'selected' : '') + '>Arabic</option></select></div>' +
      '<button class="a-btn a-btn-primary" id="save-settings-btn"><i class="fa-solid fa-check"></i> Save Settings</button>' +
      '</div>' +
      '<div class="a-card"><h3>Change Admin Password</h3>' +
      '<div class="a-field"><label>Current password</label><input type="password" id="cp-current" /></div>' +
      '<div class="a-field"><label>New password (min 8 characters)</label><input type="password" id="cp-new" /></div>' +
      '<button class="a-btn a-btn-primary" id="change-pw-btn"><i class="fa-solid fa-key"></i> Update Password</button>' +
      '</div>';

    document.getElementById('save-settings-btn').addEventListener('click', async function () {
      try {
        await apiPut('/settings/whatsapp_number', { value: document.getElementById('set-whatsapp').value.trim() });
        await apiPut('/settings/contact_email', { value: document.getElementById('set-email').value.trim() });
        await apiPut('/settings/default_theme', { value: document.getElementById('set-theme').value });
        await apiPut('/settings/default_lang', { value: document.getElementById('set-lang').value });
        toast('Settings saved');
      } catch (err) {
        toast(err.message, 'error');
      }
    });

    document.getElementById('change-pw-btn').addEventListener('click', async function () {
      var current = document.getElementById('cp-current').value;
      var next = document.getElementById('cp-new').value;
      if (!current || !next) { toast('Fill both password fields', 'error'); return; }
      try {
        await api('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword: current, newPassword: next }) });
        toast('Password updated');
        document.getElementById('cp-current').value = '';
        document.getElementById('cp-new').value = '';
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  }

  // ---------------- Init ----------------
  (async function init() {
    await checkAuth();
    render();
  })();
})();
